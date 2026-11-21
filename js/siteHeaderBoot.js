/**
 * siteHeaderBoot.js - Khởi tạo header & mobile drawer dùng chung cho MỌI trang.
 * ---------------------------------------------------------------------------
 * - Nguồn dữ liệu duy nhất: js/config/navConfig.js (cấu trúc) + GET /api/meta/nav (số liệu).
 * - Phân quyền theo vai trò: khách / ứng viên / nhà tuyển dụng / admin.
 * Giới hạn: < 200 dòng.
 */
import { renderSiteHeader, resolveSiteRoot } from "./components/siteHeader.js";
import { bindSiteHeaderEvents } from "./components/siteHeaderEvents.js";
import { mountNotificationBell } from "./components/notificationBell.js";
import { renderSiteDrawer, bindSiteDrawerEvents } from "./components/siteDrawer.js";
import { renderSiteFooter } from "./components/siteFooter.js";
import { NAV_MEGA_CONFIG, NAV_BY_ROLE } from "./config/navConfig.js";
import { auth } from "./core/auth.js";
import { hydrateDataRoutes } from "./routes.js";

async function fetchNavMeta() {
  try {
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const res = await fetch(`${base}/meta/nav`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function applyLiveCounts(meta) {
  if (!meta) return;
  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Number(n || 0));
  const jobs = fmt(meta.total_jobs);
  const updated = meta.tax_effective ? `Cập nhật ${meta.tax_effective}` : "";

  NAV_MEGA_CONFIG.forEach((group) => {
    group.columns.forEach((col) => {
      // Đổ dữ liệu động từ API cho cột lĩnh vực và địa điểm
      if (col.dynamicKey === "by_category" && Array.isArray(meta.by_category)) {
        col.items = meta.by_category
          .filter((c) => Number(c.job_count) > 0)
          .slice(0, 10)
          .map((c) => ({
            label: c.name,
            path: `pages/jobs.html?category=${encodeURIComponent(c.slug)}`,
            icon: c.icon || "tag",
            desc: `${fmt(c.job_count)} việc làm`,
          }));
      } else if (col.dynamicKey === "by_location" && Array.isArray(meta.by_location)) {
        col.items = meta.by_location
          .filter((l) => Number(l.job_count) > 0)
          .slice(0, 10)
          .map((l) => ({
            label: l.name,
            path: `pages/jobs.html?location=${encodeURIComponent(l.slug)}`,
            icon: "map-pin",
            desc: `${fmt(l.job_count)} việc làm`,
          }));
      }

      // Cập nhật số liệu thật cho các mục cố định
      if (col.items) {
        col.items.forEach((item) => {
          if (item.path === "pages/jobs.html") {
            item.desc = `${jobs} tin đang tuyển`;
          }
          if (item.path === "pages/thi-truong.html" && updated) {
            item.desc = updated;
          }
          if (item.path === "pages/candidate/applications.html" && meta.unread_applications_count > 0) {
            item.badge = `${meta.unread_applications_count} mới`;
          }
        });
      }
    });
  });
}

export async function bootSiteHeader() {
  const host = document.getElementById("app-header");
  if (!host) return;

  await auth.ready;

  const meta = await fetchNavMeta();
  applyLiveCounts(meta);

  const session = auth.getSession();
  const user = session.user;
  const role = session.role || "guest";
  const roleConfig = NAV_BY_ROLE[role] || NAV_BY_ROLE.guest;
  let rawActions = roleConfig.actions || [];

  if (user && (role === "recruiter" || role === "employer")) {
    try {
      const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
      const token = auth.getToken();
      const uvRes = await fetch(`${base}/employer/applications/unviewed-count`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (uvRes.ok) {
        const uvData = await uvRes.json();
        if (uvData && uvData.count > 0) {
          rawActions = rawActions.map((a) =>
            a.path && a.path.includes("recruitment.html")
              ? { ...a, badge: uvData.count }
              : a
          );
        }
      }
    } catch {
      // silently ignore network errors for badge
    }
  }

  // Giữ đầy đủ mọi mục menu; mục "soon" được gắn badge "Sắp có" để dẫn tới trang placeholder
  const navGroups = NAV_MEGA_CONFIG.map((group) => ({
    ...group,
    columns: (group.columns || []).map((col) => {
      if (!col.items) return col;
      const items = col.items.map((item) => (item.status === "soon" && !item.badge ? { ...item, badge: "Sắp có" } : item));
      return { ...col, items };
    }),
  }));

  const userActions = rawActions.map((a) => (a.status === "soon" && !a.badge ? { ...a, badge: "Sắp có" } : a));

  renderSiteHeader({ navGroups, user, userActions });
  bindSiteHeaderEvents({ onSignOut: () => window.Auth?.logout?.() });

  // Chuông thông báo — CHỈ hiện khi đã đăng nhập (guest không có thông báo).
  if (user) {
    const notifHost = host.querySelector("#site-notif-host");
    if (notifHost) mountNotificationBell(notifHost, { root: resolveSiteRoot() });

    window.addEventListener("techrecruit:new_application", async () => {
      try {
        const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
        const token = auth.getToken();
        const uvRes = await fetch(`${base}/employer/applications/unviewed-count`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (uvRes.ok) {
          const uvData = await uvRes.json();
          const count = Number(uvData?.count || 0);
          const recLink = document.querySelector('a[href*="recruitment.html"]');
          if (recLink) {
            let badge = recLink.querySelector(".user-action-badge");
            if (count > 0) {
              if (!badge) {
                badge = document.createElement("span");
                badge.className = "user-action-badge";
                badge.style.cssText = "margin-left:auto;padding:2px 7px;font-size:11px;font-weight:600;border-radius:999px;background:var(--primary,#0d9488);color:#fff;";
                recLink.appendChild(badge);
              }
              badge.textContent = count > 9 ? "9+" : String(count);
              badge.hidden = false;
            } else if (badge) {
              badge.hidden = true;
            }
          }
        }
      } catch {}
    });
  }

  renderSiteDrawer({ navGroups, user, userActions });
  bindSiteDrawerEvents({ onSignOut: () => window.Auth?.logout?.() });

  renderSiteFooter();
  hydrateDataRoutes(document);

  // Dọn dẹp khóa theme cũ nếu còn sót trong localStorage
  try {
    localStorage.removeItem("theme");
    localStorage.removeItem("techrecruit_theme");
  } catch {}

  // Nút mở drawer (mobile)
  const drawerBtn = host.querySelector("#site-drawer-toggle");
  drawerBtn?.addEventListener("click", () => {
    const drawer = document.getElementById("site-drawer");
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    drawerBtn.setAttribute("aria-expanded", "true");
    drawer.querySelector("#site-drawer-close")?.focus();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootSiteHeader);
} else {
  bootSiteHeader();
}
