/**
 * siteDrawer.js - Mobile Drawer (< 1024px) có accordion dùng chung dữ liệu.
 * Giới hạn: < 200 dòng.
 */
import { resolveSiteRoot, siteUrl, SITE_ICONS } from "./siteHeader.js";
import { MENU_ICONS } from "../config/navIcons.js";

function esc(v) {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
}

/** Render HTML cho drawer di động */
export function renderSiteDrawer({ navGroups = [], user = null, userActions = [] }) {
  let drawer = document.getElementById("site-drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "site-drawer";
    drawer.className = "site-drawer";
    document.body.appendChild(drawer);
  }

  const root = resolveSiteRoot();
  const isDebug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

  // Accordion các nhóm mega menu
  const groupsHtml = navGroups
    .map((group, idx) => {
      const allItems = (group.columns || []).flatMap((c) =>
        (c.items || []).filter((item) => isDebug || item.status !== "soon")
      );
      if (!allItems.length) return "";
      const itemsList = allItems
        .map((item) => {
          let href = siteUrl(item.path, root);
          if (item.authRequired && !user) {
            href = `${siteUrl("pages/login.html", root)}?redirect=${encodeURIComponent(siteUrl(item.path, root))}`;
          }
          const iconSvg = item.iconSvg || MENU_ICONS[item.icon] || MENU_ICONS.briefcase;
          const badge = item.badge ? `<span class="drawer-item-badge">${esc(item.badge)}</span>` : "";
          const desc = item.desc ? `<span class="drawer-item-desc">${esc(item.desc)}</span>` : "";
          return `
            <a href="${href}" class="drawer-nav-item">
              <span class="drawer-item-icon" aria-hidden="true">${iconSvg}</span>
              <span class="drawer-item-content">
                <span class="drawer-item-title">${esc(item.label)}${badge}</span>
                ${desc}
              </span>
            </a>`;
        })
        .join("");

      const isFirst = idx === 0;
      return `
        <div class="drawer-accordion-group" data-drawer-group="${group.id}">
          <button type="button" class="drawer-accordion-header" aria-expanded="${isFirst ? "true" : "false"}"
                  aria-controls="drawer-sec-${group.id}">
            <span>${esc(group.label)}</span>
            <span class="drawer-chevron" aria-hidden="true">${SITE_ICONS.chevronDown}</span>
          </button>
          <div id="drawer-sec-${group.id}" class="drawer-accordion-body" ${isFirst ? "" : "hidden"}>
            ${itemsList}
          </div>
        </div>`;
    })
    .filter(Boolean)
    .join("");

  // Phần tài khoản trên drawer
  const authHtml = user
    ? `
      <div class="drawer-user-card">
        <div class="drawer-user-info">
          <span class="drawer-user-avatar">${esc((user.full_name || user.email || "T").charAt(0).toUpperCase())}</span>
          <div class="drawer-user-meta">
            <span class="drawer-user-name">${esc(user.full_name || user.email)}</span>
            <span class="drawer-user-role">${esc(user.role || "Ứng viên")}</span>
          </div>
        </div>
        <div class="drawer-user-links">
          ${userActions
            .map(
              (a) => {
                const badge = a.badge != null && a.badge !== "" && a.badge !== 0
                  ? `<span class="drawer-item-badge" style="margin-left:auto;background:var(--primary,#0d9488);color:#fff;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600;">${esc(a.badge)}</span>`
                  : "";
                return `
                <a href="${siteUrl(a.path, root)}" class="drawer-user-link">
                  <span class="drawer-item-icon" aria-hidden="true">${a.iconSvg || SITE_ICONS.briefcase}</span>
                  <span>${esc(a.label)}</span>
                  ${badge}
                </a>`;
              }
            )
            .join("")}
          <button type="button" class="drawer-user-link drawer-signout-btn" data-drawer-signout>
            <span class="drawer-item-icon" aria-hidden="true">${SITE_ICONS.logout}</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>`
    : `
      <div class="drawer-auth-buttons">
        <a href="${siteUrl("pages/login.html", root)}" class="drawer-btn drawer-btn-ghost">Đăng nhập</a>
        <a href="${siteUrl("pages/register.html", root)}" class="drawer-btn drawer-btn-primary">Đăng ký</a>
      </div>`;

  drawer.setAttribute("aria-hidden", "true");
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  drawer.setAttribute("aria-label", "Menu điều hướng");

  drawer.innerHTML = `
    <div class="site-drawer-backdrop" data-drawer-close tabindex="-1"></div>
    <div class="site-drawer-panel">
      <div class="site-drawer-head">
        <a href="${siteUrl("index.html", root)}" class="site-brand">
          <span class="site-brand-mark" aria-hidden="true">
            <svg class="brand-logo-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path class="logo-path-case" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>
              <path class="logo-path-handle" d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <path class="logo-path-prompt" d="M8 13.5l2.5-2L8 9.5"/>
              <path class="logo-path-cursor" d="M13 14h3"/>
            </svg>
          </span>
          <span class="site-brand-name">TechRecruit</span>
        </a>
        <button type="button" class="site-drawer-close" id="site-drawer-close" aria-label="Đóng menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="site-drawer-body">
        ${authHtml}
        <nav class="drawer-accordion-nav" aria-label="Menu chính">${groupsHtml}</nav>
      </div>
    </div>`;

  return drawer;
}

/** Gắn sự kiện cho drawer */
export function bindSiteDrawerEvents({ onSignOut } = {}) {
  const drawer = document.getElementById("site-drawer");
  if (!drawer) return;

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    const toggleBtn = document.getElementById("site-drawer-toggle");
    toggleBtn?.setAttribute("aria-expanded", "false");
    toggleBtn?.focus();
  }

  // Đóng khi click backdrop hoặc nút close
  drawer.querySelectorAll("[data-drawer-close], #site-drawer-close").forEach((el) => {
    el.addEventListener("click", closeDrawer);
  });

  // Accordion toggle
  drawer.querySelectorAll(".drawer-accordion-header").forEach((btn) => {
    btn.addEventListener("click", () => {
      const isExpanded = btn.getAttribute("aria-expanded") === "true";
      const bodyId = btn.getAttribute("aria-controls");
      const body = document.getElementById(bodyId);
      if (!body) return;

      btn.setAttribute("aria-expanded", isExpanded ? "false" : "true");
      body.hidden = isExpanded;
    });
  });

  // Đăng xuất từ drawer
  drawer.querySelector("[data-drawer-signout]")?.addEventListener("click", () => {
    closeDrawer();
    onSignOut?.();
  });

  // Đóng drawer khi click vào liên kết
  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });

  // Đóng bằng phím Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  });
}
