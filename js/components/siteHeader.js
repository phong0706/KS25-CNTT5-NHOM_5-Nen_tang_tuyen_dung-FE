/**
 * siteHeader.js - Header dùng chung cho MỌI trang (công khai, ứng viên, nhà tuyển dụng).
 * ---------------------------------------------------------------------------
 * - Nguồn dữ liệu duy nhất: config/navConfig.js + GET /api/meta/nav (mega menu).
 * - Panel mega menu đặt trong CONTAINER header (position:relative), KHÔNG trong <li>
 * - Nút cha là <button aria-expanded aria-controls>; click để mở (hover chỉ phụ, trễ 150ms).
 * - Esc đóng + trả focus; mũi tên di chuyển; click ngoài đóng; đổi trang tự đóng.
 */
import { MENU_ICONS } from "../config/navIcons.js";

export const SITE_ICONS = {
  chevronDown: `<svg class="nav-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
  sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>`,
  menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  briefcase: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
};

function esc(v) {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
}

export function resolveSiteRoot() {
  const r = document.body?.dataset?.root;
  if (r) return r.endsWith("/") ? r : r + "/";
  const p = window.location.pathname.replace(/\\/g, "/");
  if (p.includes("/pages/admin/") || p.includes("/pages/employer/") || p.includes("/pages/candidate/")) return "../../";
  return p.includes("/pages/") ? "../" : "./";
}

export function siteUrl(path, root = resolveSiteRoot()) {
  return `${root}${String(path).replace(/^\//, "")}`;
}

function renderMegaColumns(columns, root, user) {
  return columns
    .map((col) => {
      const itemsHtml = (col.items || [])
        .map((item) => {
          let href = siteUrl(item.path, root);
          if (item.authRequired && !user) {
            href = `${siteUrl("pages/login.html", root)}?redirect=${encodeURIComponent(siteUrl(item.path, root))}`;
          }
          const iconSvg = item.iconSvg || MENU_ICONS[item.icon] || MENU_ICONS.briefcase;
          const desc = item.desc ? `<span class="mega-link-desc">${esc(item.desc)}</span>` : "";
          const badge = item.badge ? `<span class="mega-item-badge">${esc(item.badge)}</span>` : "";
          return `
            <a href="${href}" class="mega-menu-link">
              <span class="mega-link-icon" aria-hidden="true">${iconSvg}</span>
              <span class="mega-link-text">
                <span class="mega-link-title">${esc(item.label)}${badge}</span>
                ${desc}
              </span>
            </a>`;
        })
        .join("");
      return `
        <div class="mega-col">
          <h3 class="mega-col-title">${esc(col.title)}</h3>
          <div class="mega-col-list">${itemsHtml}</div>
        </div>`;
    })
    .join("");
}

export function renderSiteHeader(opts) {
  const host = document.getElementById("app-header");
  if (!host) return null;

  const root = resolveSiteRoot();
  const { navGroups = [], user = null, userActions = [] } = opts;

  const navHtml = navGroups
    .map((group) => {
      const panelId = `mega-panel-${group.id}`;
      const cols = group.columns?.length || 1;
      return `
        <div class="mega-nav-item nav-item" data-group="${group.id}">
          <button type="button" class="mega-nav-trigger" aria-expanded="false" aria-controls="${panelId}">
            <span>${esc(group.label)}</span>
            ${SITE_ICONS.chevronDown}
          </button>
          <div class="mega-panel" id="${panelId}" data-panel-for="${group.id}"
               role="region" aria-label="${esc(group.label)}" aria-hidden="true" inert
               style="--cols:${cols}">
            ${renderMegaColumns(group.columns || [], root, user)}
          </div>
        </div>`;
    })
    .join("");

  const rightHtml = user
    ? `
      <div class="user-menu-wrapper">
        <button type="button" class="user-profile-trigger" id="header-user-trigger"
                aria-haspopup="menu" aria-expanded="false" aria-controls="header-user-dropdown">
          <span class="user-avatar-circle" aria-hidden="true">${esc((user.full_name || user.email || "T").charAt(0).toUpperCase())}</span>
          <span class="user-meta-text">
            <span class="user-name-label">${esc(user.full_name || user.email)}</span>
          </span>
          ${SITE_ICONS.chevronDown}
        </button>
        <div class="user-dropdown-menu" id="header-user-dropdown" role="menu" hidden>
          ${userActions
            .map((a) => {
              const iconSvg = a.iconSvg || MENU_ICONS[a.icon] || SITE_ICONS.briefcase;
              return `
                <a href="${siteUrl(a.path, root)}" class="dropdown-item" role="menuitem">
                  <span class="mega-link-icon" aria-hidden="true">${iconSvg}</span>
                  <span>${esc(a.label)}</span>
                </a>`;
            })
            .join("")}
          <button type="button" class="dropdown-item" role="menuitem" data-signout>
            <span class="mega-link-icon" aria-hidden="true">${SITE_ICONS.logout}</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>`
    : `
      <a href="${siteUrl("pages/login.html", root)}" class="header-btn header-btn-ghost">Đăng nhập</a>
      <a href="${siteUrl("pages/register.html", root)}" class="header-btn header-btn-primary">Đăng ký</a>`;

  host.innerHTML = `
    <div class="site-header">
      <div class="container site-header-inner">
        <a href="${siteUrl("index.html", root)}" class="site-brand" aria-label="TechRecruit — trang chủ">
          <span class="site-brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M3 12h18"></path></svg>
          </span>
          <span class="site-brand-name">TechRecruit</span>
        </a>

        <nav class="site-nav" id="site-nav" aria-label="Điều hướng chính">${navHtml}</nav>

        <div class="site-header-actions">
          <button type="button" class="theme-toggle-btn" id="site-theme-toggle"
                  aria-label="Đổi giao diện sáng/tối">${SITE_ICONS.moon}</button>
          ${rightHtml}
          <button type="button" class="site-drawer-toggle" id="site-drawer-toggle"
                  aria-label="Mở menu" aria-expanded="false" aria-controls="site-drawer">${SITE_ICONS.menu}</button>
        </div>
      </div>
    </div>`;

  return host;
}
