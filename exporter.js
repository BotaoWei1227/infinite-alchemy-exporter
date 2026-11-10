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

export function buildExportText({ profile, items, type, exportedAt = new Date() }) {
  const workshop = safeText(profile?.workshopName) || "未提供工坊名稱";
  const title = safeText(profile?.displayTitle);
  const isInventory = type === "inventory";
  const sectionTitle = isInventory
    ? "目前持有的創生物（Inventory）"
    : "自己首次創造的發明（Inventions）";
  const fileTitle = isInventory ? "背包備份" : "創生物備份";
  const list = Array.isArray(items) ? items : [];
  return [
    `無限煉製｜${fileTitle}`,
    "非官方玩家工具匯出資料",
    `工坊：${workshop}`,
    ...(title ? [`稱號：${title}`] : []),
    `匯出時間：${exportedAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false })}`,
    `資料筆數：${list.length} 項`,
    "",
    "========================================",
    sectionTitle,
    "========================================",
    formatItems(list),
    "",
    "備註：本檔案只包含所選類型的資料。",
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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
