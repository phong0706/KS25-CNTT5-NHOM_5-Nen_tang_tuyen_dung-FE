/**
 * notificationBell.js - Nút chuông thông báo + panel danh sách thông báo.
 * Tuân thủ: techrecruit-rules + frontend-design + WAI-ARIA.
 * Nút 40x40 reset CSS, badge không đè icon, items là <a href>, không emoji, < 200 dòng.
 */
import {
  fetchNotifications,
  fetchUnreadCount,
  formatNotifTime,
  markAllRead,
  markOneRead,
  renderNotifItem,
} from "../services/notificationApi.js";

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
        <h3 class="notif-bell-title">Thông báo</h3>
        <button type="button" class="notif-bell-link-btn" id="notif-read-all-btn">Đánh dấu đã đọc tất cả</button>
      </div>
      <div class="notif-bell-tabs" role="tablist">
        <button type="button" class="notif-tab-btn is-active" id="notif-tab-all" role="tab" aria-selected="true">Tất cả</button>
        <button type="button" class="notif-tab-btn" id="notif-tab-unread" role="tab" aria-selected="false">Chưa đọc</button>
      </div>
      <div class="notif-bell-list" id="notif-bell-list" aria-live="polite"><div class="notif-bell-empty">Đang tải thông báo...</div></div>
      <div class="notif-bell-footer" id="notif-bell-footer"></div>
    </div>
  </div>`;

  const btn = host.querySelector("#notif-bell-btn");
  const panel = host.querySelector("#notif-bell-panel");
  const badge = host.querySelector("#notif-bell-badge");
  const listEl = host.querySelector("#notif-bell-list");
  const footerEl = host.querySelector("#notif-bell-footer");
  const readAllBtn = host.querySelector("#notif-read-all-btn");
  const tabAll = host.querySelector("#notif-tab-all");
  const tabUnread = host.querySelector("#notif-tab-unread");

  let unreadCount = 0;
  let items = [];
  let nextCursor = null;
  let filterUnread = false;
  let pollTimer = null;

  function paintBadge(count) {
    unreadCount = Math.max(0, Number(count || 0));
    badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
    badge.hidden = unreadCount <= 0;
    btn.setAttribute("aria-label", unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo, không có thông báo chưa đọc");
  }

  async function refreshBadge() {
    try { paintBadge(await fetchUnreadCount()); } catch {}
  }

  function renderList() {
    if (!items.length) {
      listEl.innerHTML = `<div class="notif-bell-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><p>Chưa có thông báo</p></div>`;
      footerEl.innerHTML = "";
      return;
    }
    listEl.innerHTML = items.map((n) => renderNotifItem(n, root)).join("");
    listEl.querySelectorAll(".notif-item").forEach((el) => {
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = Number(el.dataset.id);
        const href = el.getAttribute("href");
        if (el.classList.contains("is-unread")) {
          el.classList.remove("is-unread");
          el.classList.add("is-read");
          el.querySelector(".notif-item-dot-wrap").innerHTML = "";
          paintBadge(Math.max(0, unreadCount - 1));
          try { await markOneRead(id); } catch {}
        }
        closePanel();
        if (href && href !== "#") window.location.href = href;
      });
    });

    if (nextCursor) {
      footerEl.innerHTML = `<button type="button" class="notif-more-btn" id="notif-more-btn">Xem thêm</button>`;
      footerEl.querySelector("#notif-more-btn")?.addEventListener("click", () => loadNotifications(true));
    } else {
      footerEl.innerHTML = "";
    }
  }

  async function loadNotifications(append = false) {
    if (!append) {
      listEl.innerHTML = `<div class="notif-skeleton-item"><div class="notif-sk-circle"></div><div class="notif-sk-lines"><div class="notif-sk-line medium"></div><div class="notif-sk-line full"></div><div class="notif-sk-line short"></div></div></div><div class="notif-skeleton-item"><div class="notif-sk-circle"></div><div class="notif-sk-lines"><div class="notif-sk-line medium"></div><div class="notif-sk-line full"></div><div class="notif-sk-line short"></div></div></div>`;
    }
    try {
      const res = await fetchNotifications({ limit: PAGE_SIZE, unread_only: filterUnread, cursor: append ? nextCursor : undefined });
      const newItems = res?.items || [];
      nextCursor = res?.next_cursor || null;
      items = append ? [...items, ...newItems] : newItems;
      paintBadge(res?.unread_count ?? unreadCount);
      renderList();
    } catch {
      listEl.innerHTML = `<div class="notif-bell-error"><p>Không thể tải thông báo</p><button type="button" class="notif-retry-btn" id="notif-retry-btn">Thử lại</button></div>`;
      footerEl.innerHTML = "";
      listEl.querySelector("#notif-retry-btn")?.addEventListener("click", () => loadNotifications(false));
    }
  }

  function openPanel() {
    const userMenu = document.getElementById("header-user-dropdown");
    const userTrigger = document.getElementById("header-user-trigger");
    if (userMenu && !userMenu.hidden) {
      userMenu.hidden = true;
      userTrigger?.setAttribute("aria-expanded", "false");
    }
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    loadNotifications(false);
  }

  function closePanel() {
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panel.hidden) openPanel();
    else closePanel();
  });

  const switchTab = (unread) => {
    if (filterUnread === unread) return;
    filterUnread = unread;
    tabAll.classList.toggle("is-active", !unread);
    tabAll.setAttribute("aria-selected", String(!unread));
    tabUnread.classList.toggle("is-active", unread);
    tabUnread.setAttribute("aria-selected", String(unread));
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

  document.addEventListener("click", (e) => {
    if (panel.hidden) return;
    if (!panel.contains(e.target) && !btn.contains(e.target)) closePanel();
  });

  document.addEventListener("keydown", (e) => {
    if (panel.hidden) return;
    if (e.key === "Escape") {
      closePanel();
      btn.focus();
      return;
    }
    const focusable = Array.from(listEl.querySelectorAll(".notif-item"));
    if (!focusable.length) return;
    const curIdx = focusable.indexOf(document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusable[(curIdx + 1) % focusable.length].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusable[(curIdx - 1 + focusable.length) % focusable.length].focus();
    }
  });

  refreshBadge();
  pollTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") refreshBadge();
  }, POLL_INTERVAL);
  window.addEventListener("focus", refreshBadge);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshBadge();
  });

  return { refreshBadge, closePanel, destroy() { if (pollTimer) clearInterval(pollTimer); window.removeEventListener("focus", refreshBadge); } };
}
