/**
 * siteHeaderBoot.js - Khởi tạo header & mobile drawer dùng chung cho MỌI trang.
 * ---------------------------------------------------------------------------
 * - Nguồn dữ liệu duy nhất: js/config/navConfig.js (cấu trúc) + GET /api/meta/nav (số liệu).
 * - Phân quyền theo vai trò: khách / ứng viên / nhà tuyển dụng / admin.
 * Giới hạn: < 200 dòng.
 */
import { renderSiteHeader, SITE_ICONS } from "./components/siteHeader.js";
import { bindSiteHeaderEvents } from "./components/siteHeaderEvents.js";
import { renderSiteDrawer, bindSiteDrawerEvents } from "./components/siteDrawer.js";
import { renderSiteFooter } from "./components/siteFooter.js";
import { NAV_MEGA_CONFIG, NAV_BY_ROLE } from "./config/navConfig.js";

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

  const meta = await fetchNavMeta();
  applyLiveCounts(meta);

  const user = window.Auth?.getUser?.() || null;
  const role = window.Auth?.getRole?.() || "guest";
  const roleConfig = NAV_BY_ROLE[role] || NAV_BY_ROLE.guest;
  const rawActions = roleConfig.actions || [];

  // Kiểm tra cờ debug: ?debug=1 thì hiện cả mục "soon" kèm nhãn "Sắp có", mặc định chỉ hiện "ready"
  const isDebug = new URLSearchParams(window.location.search).get("debug") === "1";

  // Lọc NAV_MEGA_CONFIG theo status
  const navGroups = NAV_MEGA_CONFIG
    .map((group) => {
      const validCols = (group.columns || [])
        .map((col) => {
          if (!col.items) return col;
          const items = col.items
            .filter((item) => isDebug || item.status !== "soon")
            .map((item) => (isDebug && item.status === "soon" ? { ...item, badge: "Sắp có" } : item));
          return { ...col, items };
        })
        .filter((col) => !col.items || col.items.length > 0);

      return { ...group, columns: validCols };
    })
    .filter((group) => {
      const hasItems = group.columns.some((c) => (c.items ? c.items.length > 0 : true));
      return hasItems && group.columns.length > 0;
    });

  const userActions = rawActions
    .filter((a) => isDebug || a.status !== "soon")
    .map((a) => (isDebug && a.status === "soon" ? { ...a, badge: "Sắp có" } : a));

  renderSiteHeader({ navGroups, user, userActions });
  bindSiteHeaderEvents({ onSignOut: () => window.Auth?.logout?.() });

  renderSiteDrawer({ navGroups, user, userActions });
  bindSiteDrawerEvents({ onSignOut: () => window.Auth?.logout?.() });

  renderSiteFooter();

  // Nút đổi giao diện sáng/tối
  const themeBtn = host.querySelector("#site-theme-toggle");
  const paintTheme = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (themeBtn) themeBtn.innerHTML = isDark ? SITE_ICONS.sun : SITE_ICONS.moon;
  };
  paintTheme();
  themeBtn?.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
    paintTheme();
  });

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
