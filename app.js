import { beginLogin, handleOAuthCallback } from "./oauth.js";
import { getProfile, getInventory, getInventions } from "./api.js";
import { buildExportText, downloadText } from "./exporter.js";

const config = window.APP_CONFIG;
const $ = id => document.getElementById(id);
const state = { token: null, profile: null, inventory: [], inventions: [], expiresAt: 0 };

function message(id, text, kind = "") {
  const el = $(id); el.textContent = text; el.className = `message ${kind}`.trim();
}
function setConnected(connected) {
  $("connectionBadge").textContent = connected ? "已連結" : "尚未連結";
  $("connectionBadge").classList.toggle("connected", connected);
  $("connectButton").classList.toggle("hidden", connected);
  $("disconnectButton").classList.toggle("hidden", !connected);
  $("refreshButton").disabled = !connected;
  $("exportInventoryButton").disabled = !connected;
  $("exportInventionsButton").disabled = !connected;
}
function renderList(id, items) {
  const list = $(id); list.replaceChildren();
  if (!items.length) {
    const li = document.createElement("li"); li.className = "empty"; li.textContent = "目前沒有資料"; list.append(li); return;
  }
  items.slice(0, 8).forEach(item => {
    const li = document.createElement("li");
    const emoji = document.createElement("span"); emoji.textContent = item.emoji || "▫️";
    const name = document.createElement("span"); name.textContent = item.name || "未命名創生物";
    li.append(emoji, name); list.append(li);
  });
  if (items.length > 8) {
    const li = document.createElement("li"); li.className = "more"; li.textContent = `以及另外 ${items.length - 8} 項…`; list.append(li);
  }
}
function renderData() {
  $("inventoryCount").textContent = state.inventory.length.toLocaleString("zh-TW");
  $("inventionsCount").textContent = state.inventions.length.toLocaleString("zh-TW");
  const name = state.profile?.workshopName || "玩家";
  $("profileLine").textContent = `已連結工坊：${name}`;
  renderList("inventoryPreview", state.inventory);
  renderList("inventionsPreview", state.inventions);
  $("exportInventoryButton").disabled = false;
  $("exportInventionsButton").disabled = false;
}

async function loadData() {
  if (!state.token || Date.now() >= state.expiresAt) throw new Error("登入已逾期，請重新連結帳號。");
  message("dataMessage", "正在讀取玩家資料與收藏…");
  const profile = await getProfile(state.token, config);
  const [inventory, inventions] = await Promise.all([
    getInventory(state.token, config),
    getInventions(state.token, config)
  ]);
  state.profile = profile;
  state.inventory = inventory;
  state.inventions = inventions;
  renderData();
  message("dataMessage", `讀取完成：持有 ${inventory.length} 項，首次創造 ${inventions.length} 項。`, "success");
}

async function connect() {
  try { await beginLogin(config); }
  catch (error) { message("authMessage", error.message, "error"); }
}
function disconnect() {
  state.token = null; state.profile = null; state.inventory = []; state.inventions = []; state.expiresAt = 0;
  $("inventoryCount").textContent = "—"; $("inventionsCount").textContent = "—";
  $("profileLine").textContent = "尚未取得玩家資料";
  renderList("inventoryPreview", []); renderList("inventionsPreview", []);
  message("authMessage", "已清除本次連線。重新整理頁面也會清除記憶體中的 access token。");
  message("dataMessage", "登入後即可載入資料。");
  setConnected(false);
}
async function initialize() {
  $("connectButton").addEventListener("click", connect);
  $("disconnectButton").addEventListener("click", disconnect);
  $("refreshButton").addEventListener("click", async () => {
    try { await loadData(); } catch (e) { message("dataMessage", e.message, "error"); }
  });
  $("exportInventoryButton").addEventListener("click", () => {
    const content = buildExportText({ profile: state.profile, items: state.inventory, type: "inventory" });
    downloadText(content, "infinite-alchemy-inventory.txt");
    message("exportMessage", `背包備份已產生，共 ${state.inventory.length} 項。`, "success");
  });
  $("exportInventionsButton").addEventListener("click", () => {
    const content = buildExportText({ profile: state.profile, items: state.inventions, type: "inventions" });
    downloadText(content, "infinite-alchemy-inventions.txt");
    message("exportMessage", `創生物備份已產生，共 ${state.inventions.length} 項。`, "success");
  });

  try {
    const result = await handleOAuthCallback(config);
    if (result) {
      state.token = result.accessToken;
      state.expiresAt = Date.now() + result.expiresIn * 1000;
      setConnected(true);
      message("authMessage", "授權成功，正在載入收藏…", "success");
      await loadData();
      message("authMessage", "帳號連結成功。Access token 僅保存在本頁記憶體中。", "success");
    }
  } catch (error) {
    message("authMessage", error.message, "error");
    if (error.code === "invalid_token") disconnect();
  }
  setConnected(Boolean(state.token));
}
initialize();
