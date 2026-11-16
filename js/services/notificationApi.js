/**
 * notificationApi.js - Lớp gọi API thông báo (module dùng chung FE <-> BE).
 * ---------------------------------------------------------------------------
 * Backend: app/routers/notifications.py  →  prefix /api/notifications
 *   GET    /api/notifications              → { items, total, page, page_size, total_pages, unread_count }
 *   GET    /api/notifications/unread-count → { unread_count }
 *   POST   /api/notifications/read         → { updated, unread_count, message }   body: { notification_ids }
 *   POST   /api/notifications/read-all     → { updated, unread_count, message }
 *   POST   /api/notifications/{id}/read    → { updated, unread_count, message }
 *   DELETE /api/notifications              → { deleted, message }
 *
 * Mọi request đều đi qua window.api (js/api.js) nên tự đính kèm Bearer token
 * và tự xử lý 401. Không dùng fetch() thô ở đây.
 */

/** Sự kiện custom khi badge thông báo thay đổi. */
export const NOTIFICATION_EVENT = "notifications:changed";

function api() {
  return window.api;
}

/**
 * Lấy danh sách thông báo.
 * @param {{page?:number, page_size?:number, unread_only?:boolean, type?:string}} params
 */
export async function fetchNotifications(params = {}) {
  const query = {};
  if (params.cursor) query.cursor = params.cursor;
  if (params.unread_only) query.unread_only = true;
  if (params.limit) query.limit = params.limit;
  if (params.type) query.type = params.type;
  if (params.page) query.page = params.page;
  if (params.page_size) query.page_size = params.page_size;
  return await api().get("/notifications", query);
}

/** Lấy số thông báo chưa đọc (badge chuông). */
export async function fetchUnreadCount() {
  const res = await api().get("/notifications/unread-count");
  return Number(res?.unread_count || 0);
}

/** Đánh dấu đã đọc một hoặc nhiều thông báo. */
export async function markRead(notificationIds) {
  const ids = (Array.isArray(notificationIds) ? notificationIds : [notificationIds]).filter(Boolean);
  if (!ids.length) return { updated: 0, unread_count: 0 };
  const res = await api().post("/notifications/read", { notification_ids: ids });
  emitChanged(res?.unread_count);
  return res;
}

/** Đánh dấu đã đọc toàn bộ thông báo. */
export async function markAllRead() {
  const res = await api().post("/notifications/read-all");
  emitChanged(res?.unread_count);
  return res;
}

/** Đánh dấu đã đọc 1 thông báo (khi bấm vào). */
export async function markOneRead(notificationId) {
  const res = await api().post(`/notifications/${notificationId}/read`);
  emitChanged(res?.unread_count);
  return res;
}

/** Xoá toàn bộ thông báo. */
export async function clearNotifications() {
  const res = await api().delete("/notifications");
  emitChanged(0);
  return res;
}

/** Phát sự kiện cập nhật badge (để các module khác refresh). */
export function emitChanged(unreadCount) {
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: { unread_count: unreadCount } }));
}

/** Đăng ký lắng nghe thay đổi badge. Trả về hàm để huỷ đăng ký. */
export function onNotificationsChanged(handler) {
  const wrapped = (e) => handler(e?.detail?.unread_count);
  window.addEventListener(NOTIFICATION_EVENT, wrapped);
  return () => window.removeEventListener(NOTIFICATION_EVENT, wrapped);
}

/**
 * Icon + màu theo loại thông báo — khớp với NotificationType ở backend
 * (app/services/notification.py).
 */
export const NOTIF_ICONS = {
  fileText: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>',
  calendar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  checkCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  xCircle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
  bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
};

export function getNotifIcon(type) {
  if (type === "application_submitted" || type === "cv_uploaded" || type === "cv_deleted") {
    return NOTIF_ICONS.fileText;
  }
  if (type === "interview_scheduled" || type === "interview_changed" || type === "application_interview") {
    return NOTIF_ICONS.calendar;
  }
  if (type === "interview_cancelled" || type === "job_rejected") {
    return NOTIF_ICONS.xCircle;
  }
  if (type === "application_status_changed" || type === "job_approved") {
    return NOTIF_ICONS.checkCircle;
  }
  return NOTIF_ICONS.bell;
}

export function notificationStyle(type) {
  return { icon: getNotifIcon(type), tone: "teal" };
}

function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatNotifTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function renderNotifItem(n, root = "./") {
  const isRead = Boolean(n.read || n.is_read);
  const iconSvg = getNotifIcon(n.type);
  let href = n.href || n.link || "#";
  if (href !== "#" && !href.startsWith("http://") && !href.startsWith("https://")) {
    href = `${root}${href.replace(/^\//, "")}`;
  }
  return `
    <a href="${esc(href)}" class="notif-item ${isRead ? "is-read" : "is-unread"}" data-id="${n.id}" role="listitem">
      <span class="notif-item-icon" aria-hidden="true">${iconSvg}</span>
      <div class="notif-item-content">
        <h4 class="notif-item-title">${esc(n.title)}</h4>
        <p class="notif-item-body">${esc(n.body || n.message)}</p>
        <span class="notif-item-time">${esc(formatNotifTime(n.created_at))}</span>
      </div>
      <div class="notif-item-dot-wrap">
        ${!isRead ? '<span class="notif-item-dot"><span class="sr-only">Chưa đọc</span></span>' : ""}
      </div>
    </a>`;
}
