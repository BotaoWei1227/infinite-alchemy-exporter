const AUTH_BASE = "https://pillars-of-creation.funtuan.work";
const STORAGE_KEY = "alchemy_export_oauth_pending";

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomUrlSafe(length = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes).slice(0, length);
}

async function createChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export function getRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

export async function beginLogin(config) {
  if (!window.isSecureContext && location.hostname !== "localhost") {
    throw new Error("OAuth 登入需要 HTTPS；請使用 GitHub Pages 網址。");
  }
  if (!config.clientId || config.clientId === "YOUR_APPROVED_CLIENT_ID") {
    throw new Error("尚未設定 Client ID。請先完成 Developer Center 申請並填入 config.js。");
  }

  const state = randomUrlSafe(48);
  const verifier = randomUrlSafe(64);
  const challenge = await createChallenge(verifier);
  const pending = { state, verifier, redirectUri: getRedirectUri(), createdAt: Date.now() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));

  const url = new URL(`${AUTH_BASE}/oauth/authorize`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: pending.redirectUri,
    scope: config.scopes.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256"
  }).toString();
  location.assign(url.toString());
}

export async function handleOAuthCallback(config) {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const returnedState = params.get("state");
  const error = params.get("error");
  if (!code && !error) return null;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  history.replaceState({}, document.title, getRedirectUri());

  if (!raw) throw new Error("找不到登入驗證資料，請重新登入。");
  const pending = JSON.parse(raw);
  if (Date.now() - pending.createdAt > 5 * 60 * 1000) throw new Error("登入授權已逾時，請重新登入。");
  if (!returnedState || returnedState !== pending.state) throw new Error("OAuth state 驗證失敗，已拒絕這次登入。");
  if (error) throw new Error(error === "access_denied" ? "你取消了授權。" : `登入未完成：${error}`);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: pending.redirectUri,
    code_verifier: pending.verifier
  });

  const response = await fetch(`${config.apiBaseUrl}/developer-api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store"
  });
  const payload = await safeJson(response);
  if (!response.ok) throw apiError(payload, response.status);
  if (!payload.access_token) throw new Error("授權伺服器沒有回傳 access token。");
  return { accessToken: payload.access_token, expiresIn: Number(payload.expires_in || 3600) };
}

async function safeJson(response) {
  try { return await response.json(); } catch { return {}; }
}
function apiError(payload, status) {
  const code = payload?.code || payload?.error || `http_${status}`;
  const messages = {
    invalid_grant: "授權碼無效或已使用，請重新登入。",
    invalid_redirect_uri: "Redirect URI 不符合 Developer Center 設定。",
    invalid_client: "Client ID 無效，請檢查設定。",
    invalid_scope: "申請的 OAuth 權限不正確。"
  };
  return new Error(messages[code] || `登入失敗（${code}）。`);
}
