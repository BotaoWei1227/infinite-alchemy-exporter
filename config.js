// 公開前端設定：Client ID 不是秘密，可以放在 GitHub Pages。
// 請將 YOUR_APPROVED_CLIENT_ID 替換成 Developer Center 核准後提供的 Client ID。
// Redirect URI 使用目前網站根網址；部署後必須在 Developer Center 登記完全相同的網址。
window.APP_CONFIG = Object.freeze({
  apiBaseUrl: "https://pillars-of-creation.funtuan.work",
  clientId: "YOUR_APPROVED_CLIENT_ID",
  scopes: ["profile", "inventory.read", "inventions.read"],
  requestTimeoutMs: 15000,
  maxReadRetries: 2
});
