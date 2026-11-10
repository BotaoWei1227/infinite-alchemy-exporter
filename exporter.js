function safeText(value) {
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").trim();
}
function safeManifestation(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}
function formatItems(items) {
  if (!items.length) return "（目前沒有資料）";
  return items.map((item, index) => {
    const lines = [
      `${index + 1}. ${safeText(item.emoji) || "▫️"} ${safeText(item.name) || "未命名創生物"}`,
      `   ID：${safeText(item.id) || "（未提供）"}`
    ];
    const image = safeManifestation(item.manifestationUrl);
    if (image) lines.push(`   外觀連結：${image}`);
    return lines.join("\n");
  }).join("\n\n");
}

export function buildExportText({ profile, inventory, inventions, exportedAt = new Date() }) {
  const workshop = safeText(profile?.workshopName) || "未提供工坊名稱";
  const title = safeText(profile?.displayTitle);
  return [
    "無限煉製｜創生物圖鑑備份",
    "非官方玩家工具匯出資料",
    `工坊：${workshop}`,
    ...(title ? [`稱號：${title}`] : []),
    `匯出時間：${exportedAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false })}`,
    `目前持有：${inventory.length} 項`,
    `首次創造：${inventions.length} 項`,
    "",
    "========================================",
    "一、目前持有的創生物（Inventory）",
    "========================================",
    formatItems(inventory),
    "",
    "========================================",
    "二、自己首次創造的發明（Inventions）",
    "========================================",
    formatItems(inventions),
    "",
    "備註：兩個章節依照平台 API 分別匯出，不會自動去重。",
    "manifestation URL 僅使用本次 API 回傳的 HTTPS 連結。"
  ].join("\n");
}

export function downloadText(text, filename = "infinite-alchemy-collection.txt") {
  const blob = new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
