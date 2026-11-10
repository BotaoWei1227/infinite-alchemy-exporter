# 創生物圖鑑匯出器

將《無限煉製》玩家目前持有的創生物（Inventory）與自己首次創造的發明（Inventions）分別匯出成 UTF-8 TXT。

> 非官方玩家工具，並非《無限煉製》官方活動。

## 功能

- OAuth 2.0 Authorization Code + PKCE（S256）
- 讀取 `profile`、`inventory.read`、`inventions.read`
- 自動依照 API `nextOffset` 讀取所有頁面
- TXT 匯出：名稱、emoji、creation ID、當次 API 回傳的 HTTPS manifestation URL
- access token 僅保存在頁面記憶體；重新整理後需重新登入
- 429 與 5xx 有界重試；不重試一般 4xx
- 手機優先的響應式介面

## 重要安全設計

- 不使用 Server Secret；此專案是純前端唯讀工具。
- Client ID 是公開識別值，可放在 `config.js`。
- 不輸出 app-scoped player ID。
- 不將 access token、OAuth code、PKCE verifier 寫入 console 或持久化儲存。
- 不使用非公開 API、內部資料庫或爬取方式。
- manifestation URL 僅接受 HTTPS；缺少 URL 時保留 emoji／文字資料。

## 設定

1. 在 Developer Center 申請應用程式。應用建立會立即送審，請先確認申請資料。
2. 核准後取得 Client ID。
3. 將 `config.js` 的 `YOUR_APPROVED_CLIENT_ID` 換成實際 Client ID。
4. 部署 GitHub Pages 後，將實際網站根網址（例如 `https://OWNER.github.io/infinite-alchemy-exporter/`）以完全相同的字串登記為 Redirect URI。
5. scopes 使用 `profile inventory.read inventions.read`。本工具不需要 `history.read`。
6. 用 HTTPS 網址測試登入。

Developer Center: https://pillars-of-creation.funtuan.work/developer

## 本機測試

可使用本機靜態伺服器，例如：

```bash
python -m http.server 8000
```

本機 OAuth 測試前，平台必須允許 `http://localhost:8000/` 作為測試 Redirect URI。不要假設 localhost 一定已被允許。

## GitHub Pages 部署

1. 將本專案檔案放在 repository 根目錄。
2. GitHub → Settings → Pages。
3. Build and deployment 選擇 **GitHub Actions**。
4. 推送至 `main` 後，工作流程會部署靜態網站。
5. 取得實際 Pages URL，再回 Developer Center 設定完全相同的 Redirect URI。

## API 與 CORS 注意事項

公開 API base URL：`https://pillars-of-creation.funtuan.work/`

瀏覽器會直接呼叫公開 Developer API。平台是否允許 GitHub Pages origin 的跨來源請求，必須以實際瀏覽器測試確認；文件未保證 CORS。若遇到 CORS 錯誤，應請平台維護者提供正式支援的公開跨來源設定，不可改用未文件化代理或私人 endpoint。

## 驗收清單

- [ ] OAuth state mismatch 會拒絕登入
- [ ] PKCE 使用 S256
- [ ] code 逾期／重複使用時提示重新登入
- [ ] redirect URI 不完全相符時清楚提示
- [ ] 缺少 scopes 時提示重新授權
- [ ] Inventory / Inventions 多頁資料完整讀取
- [ ] 空清單可正常匯出
- [ ] manifestation URL 為 null 或非 HTTPS 時仍可顯示名稱與 emoji
- [ ] 429 有界退避；5xx 有界重試
- [ ] 手機瀏覽器可登入、預覽及下載 TXT
- [ ] 確認 GitHub Pages origin 的 CORS

## 專案結構

```text
index.html
style.css
config.js
app.js
oauth.js
api.js
exporter.js
.github/workflows/pages.yml
```
