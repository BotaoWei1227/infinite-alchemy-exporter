# 測試計畫

## OAuth
- 未設定 Client ID：登入按鈕顯示設定提示，不導向授權頁。
- state 缺失或不一致：拒絕 callback。
- callback 等待超過 5 分鐘：要求重新登入。
- `access_denied`：顯示使用者取消授權。
- invalid_redirect_uri / invalid_grant：顯示可理解的錯誤訊息。
- 成功登入後 URL query 會被清除。

## API
- Profile 正常回應。
- Inventory / Inventions 單頁、多頁、空清單。
- nextOffset 重複或格式錯誤時停止，避免無限迴圈。
- 401 invalid_token、403 insufficient_scope、403 not_approved。
- 429 Retry-After 與退避；5xx 有界重試。
- 非 JSON 錯誤回應不造成 JSON parse crash。
- CORS 與 timeout 顯示可操作的提示。

## 匯出
- 中文、emoji、空名稱、空 ID。
- manifestationUrl 為 null、無效網址或非 HTTPS。
- 同一項同時出現在 Inventory / Inventions 時保留在兩個章節。
- 空資料仍可產生有效 TXT。
- 檔案為 UTF-8 BOM，適合 Windows 記事本開啟。

## 手機
- Android Chrome / iOS Safari：登入跳轉、返回 callback、預覽、下載。
