function makeError(payload, status) {
  const code = payload?.code || payload?.error || `http_${status}`;
  const messages = {
    invalid_token: "登入已逾期或失效，請重新連結帳號。",
    insufficient_scope: "目前授權缺少必要讀取權限，請重新登入並確認 scopes。",
    not_approved: "應用程式尚未獲得平台核准。",
    rate_limited: "API 請求過於頻繁，請稍後再試。",
    binding_required: "平台要求先完成遊戲內的帳號綁定。"
  };
  const error = new Error(messages[code] || `API 請求失敗（${code}）。`);
  error.code = code;
  error.status = status;
  return error;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const jitter = max => Math.floor(Math.random() * max);

async function requestJson(url, token, config) {
  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    let response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store"
      });
    } catch (error) {
      if (error.name === "AbortError") throw new Error("API 請求逾時，請檢查網路後重試。");
      throw new Error("無法連線至遊戲 API。若瀏覽器顯示 CORS 錯誤，請聯絡平台維護者確認公開 API 的跨來源存取設定。");
    } finally {
      clearTimeout(timeout);
    }

    let payload = {};
    try { payload = await response.json(); } catch { /* non-JSON error response */ }

    if (response.ok) return payload;
    const error = makeError(payload, response.status);
    if (error.code === "invalid_token" || error.code === "insufficient_scope" ||
        error.code === "not_approved" || error.code === "binding_required") throw error;

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= config.maxReadRetries) throw error;

    const retryAfter = Number(response.headers.get("Retry-After"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 30000)
      : Math.min(1000 * (2 ** attempt) + jitter(500), 10000);
    await sleep(delay);
    attempt += 1;
  }
}

export async function getProfile(token, config) {
  return requestJson(`${config.apiBaseUrl}/developer-api/v1/me`, token, config);
}

async function getAllPages(path, token, config) {
  const all = [];
  let offset = 0;
  const visited = new Set();

  while (offset !== null) {
    if (visited.has(offset)) throw new Error("API 分頁回傳重複位置，已停止讀取以避免無限迴圈。");
    visited.add(offset);
    const url = new URL(`${config.apiBaseUrl}${path}`);
    url.search = new URLSearchParams({ limit: "100", offset: String(offset) }).toString();
    const page = await requestJson(url.toString(), token, config);
    if (!Array.isArray(page.items)) throw new Error("API 回傳格式不符合預期（items）。");
    all.push(...page.items);
    offset = page.nextOffset ?? null;
    if (offset !== null && (!Number.isInteger(Number(offset)) || Number(offset) < 0)) {
      throw new Error("API 回傳了無效的 nextOffset。");
    }
    if (all.length > 100000) throw new Error("資料筆數異常，已停止讀取。");
  }
  return all;
}

export const getInventory = (token, config) => getAllPages("/developer-api/v1/inventory", token, config);
export const getInventions = (token, config) => getAllPages("/developer-api/v1/inventions", token, config);
