/**
 * notificationBell.js - Nút chuông thông báo + Realtime WebSocket & Polling Fallback.
 * Tuân thủ: techrecruit-rules + WAI-ARIA, <= 200 dòng.
 */
import {
  fetchNotifications,
  fetchUnreadCount,
  formatNotifTime,
  markAllRead,
  markOneRead,
  renderNotifItem,
} from "../services/notificationApi.js";
import { realtimeClient } from "../core/realtimeClient.js";
import { playNotificationEffects, showNotifToast, isSoundEnabled, toggleSound } from "./notificationEffects.js";

const POLL_INTERVAL = 60000;
const PAGE_SIZE = 10;
export { formatNotifTime as relativeTime };

export function mountNotificationBell(host, opts = {}) {
  if (!host || host.dataset.notifBellReady === "1") return null;
  host.dataset.notifBellReady = "1";
  const root = opts.root || "./";

  host.innerHTML = `<div class="notif-bell-wrap">
    <button type="button" class="notif-bell-btn" id="notif-bell-btn" aria-label="Thông báo, không có thông báo chưa đọc" aria-haspopup="dialog" aria-expanded="false" aria-controls="notif-bell-panel">
      <span class="notif-bell-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></span>
      <span class="notif-bell-badge" id="notif-bell-badge" hidden>0</span>
    </button>
    <div class="notif-bell-panel" id="notif-bell-panel" role="dialog" aria-label="Danh sách thông báo" hidden>
      <div class="notif-bell-head">
        <div style="display:flex; align-items:center; gap:8px;">
          <h3 class="notif-bell-title">Thông báo</h3>
          <span class="notif-live-dot" id="notif-live-dot" title="Đang cập nhật định kỳ"><span class="sr-only" id="notif-live-text">Đang cập nhật định kỳ</span></span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="notif-sound-btn" id="notif-sound-toggle-btn" title="Bật/tắt âm thông báo" aria-label="Bật/tắt âm thông báo">${isSoundEnabled() ? "🔔" : "🔕"}</button>
          <button type="button" class="notif-bell-link-btn" id="notif-read-all-btn">Đã đọc tất cả</button>
        </div>
      </div>
      <div class="notif-bell-tabs" role="tablist">
        <button type="button" class="notif-tab-btn is-active" id="notif-tab-all" role="tab" aria-selected="true">Tất cả</button>
        <button type="button" class="notif-tab-btn" id="notif-tab-unread" role="tab" aria-selected="false">Chưa đọc</button>
      </div>
      <div class="notif-bell-list" id="notif-bell-list" aria-live="polite"><div class="notif-bell-empty">Đang tải thông báo...</div></div>
      <div class="notif-bell-footer" id="notif-bell-footer"></div>
    </div>
  </div>`;

  const btn = host.querySelector("#notif-bell-btn"), panel = host.querySelector("#notif-bell-panel");
  const badge = host.querySelector("#notif-bell-badge"), listEl = host.querySelector("#notif-bell-list");
  const footerEl = host.querySelector("#notif-bell-footer"), readAllBtn = host.querySelector("#notif-read-all-btn");
  const tabAll = host.querySelector("#notif-tab-all"), tabUnread = host.querySelector("#notif-tab-unread");
  const dotEl = host.querySelector("#notif-live-dot"), dotText = host.querySelector("#notif-live-text");
  const soundBtn = host.querySelector("#notif-sound-toggle-btn");

  let unreadCount = 0, items = [], nextCursor = null, filterUnread = false, pollTimer = null;

  function paintBadge(count) {
    unreadCount = Math.max(0, Number(count || 0));
    badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
    badge.hidden = unreadCount <= 0;
    btn.setAttribute("aria-label", unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo, không có thông báo chưa đọc");
  }

  function updateStatusDot(status) {
    const isLive = status === "connected";
    dotEl?.classList.toggle("is-live", isLive);
    const label = isLive ? "Đang cập nhật trực tiếp" : "Đang cập nhật định kỳ";
    if (dotEl) dotEl.title = label;
    if (dotText) dotText.textContent = label;
  }

  function renderList() {
    if (!items.length) {
      listEl.innerHTML = `<div class="notif-bell-empty"><p>Chưa có thông báo</p></div>`;
      footerEl.innerHTML = "";
      return;
    }
    listEl.innerHTML = items.map((n) => renderNotifItem(n, root)).join("");
    listEl.querySelectorAll(".notif-item").forEach((el) => {
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = Number(el.dataset.id), href = el.getAttribute("href");
        if (el.classList.contains("is-unread")) {
          el.classList.replace("is-unread", "is-read");
          el.querySelector(".notif-item-dot-wrap").innerHTML = "";
          paintBadge(Math.max(0, unreadCount - 1));
          try { await markOneRead(id); } catch {}
        }
        closePanel();
        if (href && href !== "#") window.location.href = href;
      });
    });
    footerEl.innerHTML = nextCursor ? `<button type="button" class="notif-more-btn" id="notif-more-btn">Xem thêm</button>` : "";
    footerEl.querySelector("#notif-more-btn")?.addEventListener("click", () => loadNotifications(true));
  }

  async function loadNotifications(append = false) {
    if (!append) listEl.innerHTML = `<div class="notif-bell-empty">Đang tải...</div>`;
    try {
      const res = await fetchNotifications({ limit: PAGE_SIZE, unread_only: filterUnread, cursor: append ? nextCursor : undefined });
      nextCursor = res?.next_cursor || null;
      items = append ? [...items, ...(res?.items || [])] : (res?.items || []);
      paintBadge(res?.unread_count ?? unreadCount);
      renderList();
    } catch {
      listEl.innerHTML = `<div class="notif-bell-error"><p>Không thể tải thông báo</p></div>`;
    }
  }

  function openPanel() {
    document.getElementById("header-user-dropdown")?.setAttribute("hidden", "");
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    loadNotifications(false);
  }

  function closePanel() {
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }

  btn.addEventListener("click", (e) => { e.stopPropagation(); panel.hidden ? openPanel() : closePanel(); });
  soundBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const enabled = toggleSound();
    soundBtn.textContent = enabled ? "🔔" : "🔕";
  });

  const switchTab = (unread) => {
    if (filterUnread === unread) return;
    filterUnread = unread;
    tabAll.classList.toggle("is-active", !unread);
    tabUnread.classList.toggle("is-active", unread);
    loadNotifications(false);
  };
  tabAll.addEventListener("click", (e) => { e.stopPropagation(); switchTab(false); });
  tabUnread.addEventListener("click", (e) => { e.stopPropagation(); switchTab(true); });

  readAllBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      await markAllRead();
      paintBadge(0);
      items.forEach((i) => { i.read = true; i.is_read = true; });
      renderList();
    } catch {}
  });

  document.addEventListener("click", (e) => { if (!panel.hidden && !host.contains(e.target)) closePanel(); });
  document.addEventListener("keydown", (e) => {
    if (panel.hidden) return;
    if (e.key === "Escape") { closePanel(); btn.focus(); }
  });

  const unsubs = [
    realtimeClient.on("notification", (notif) => {
      if (!items.some((it) => it.id === notif.id)) items.unshift(notif);
      if (!panel.hidden) renderList();
      playNotificationEffects();
      showNotifToast(notif, root);
      window.dispatchEvent(new CustomEvent("techrecruit:notification", { detail: notif }));
      if (notif.type === "new_application" || notif.type === "application_submitted") {
        window.dispatchEvent(new CustomEvent("techrecruit:new_application", { detail: notif }));
      } else if (notif.type === "application_status_changed") {
        window.dispatchEvent(new CustomEvent("techrecruit:application_status_changed", { detail: notif }));
      }
    }),
    realtimeClient.on("unread_count", (cnt) => paintBadge(cnt)),
    realtimeClient.on("status", (st) => updateStatusDot(st)),
  ];

  realtimeClient.connect();

  pollTimer = setInterval(async () => {
    if (realtimeClient.status === "polling" && document.visibilityState === "visible") {
      try { paintBadge(await fetchUnreadCount()); } catch {}
    }
  }, POLL_INTERVAL);

  return {
    paintBadge,
    closePanel,
    destroy() {
      unsubs.forEach((u) => u());
      if (pollTimer) clearInterval(pollTimer);
      realtimeClient.disconnect();
    },
  };
}
