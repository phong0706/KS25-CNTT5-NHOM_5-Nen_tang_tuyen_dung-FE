/**
 * megaMenu.js - Trình điều khiển Mega Menu tương tác chuẩn WAI-ARIA & Design System TechRecruit.
 * Giới hạn: < 200 dòng.
 */
import { NAV_MEGA_CONFIG } from "../config/navConfig.js";

const LUCIDE_ICONS = {
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  bookmark: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
  briefcase: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  target: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
  building: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg>`,
  tag: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
  "map-pin": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  "file-text": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  folder: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  "upload-cloud": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path></svg>`,
  "book-open": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
  mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  copy: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  calculator: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>`,
  percent: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>`,
  shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  "trending-up": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
  "piggy-bank": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"></path><path d="M16 9h.01"></path></svg>`,
  "bar-chart": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>`,
  "help-circle": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  "user-check": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7.5" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>`,
  "pie-chart": `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`,
  lightbulb: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5h6.18z"></path></svg>`,
  compass: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
  chevronDown: `<svg class="nav-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`
};

function getRoot() {
  const r = document.body?.dataset?.root;
  if (r) return r.endsWith("/") ? r : r + "/";
  const p = window.location.pathname.replace(/\\/g, "/");
  return p.includes("/pages/admin/") || p.includes("/pages/employer/") || p.includes("/pages/candidate/") ? "../../" : (p.includes("/pages/") ? "../" : "./");
}

let dynamicMeta = { by_category: [], by_location: [] };

export async function fetchMegaNavMeta() {
  try {
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const res = await fetch(`${base}/meta/nav`);
    if (res.ok) dynamicMeta = await res.json();
  } catch (e) {
    console.warn("[MegaMenu] Failed to fetch dynamic nav meta", e);
  }
}

export function renderMegaNavHtml(currentPath = "") {
  const root = getRoot();
  return NAV_MEGA_CONFIG.map((group) => {
    const panelId = `mega-panel-${group.id}`;
    const badgeHtml = group.badge ? `<span class="nav-badge">${group.badge}</span>` : "";
    return `
      <div class="mega-nav-item" data-group="${group.id}">
        <button type="button" class="mega-nav-trigger" aria-expanded="false" aria-controls="${panelId}">
          <span>${group.label}</span>
          ${badgeHtml}
          ${LUCIDE_ICONS.chevronDown}
        </button>
        <div class="mega-panel" id="${panelId}" role="region" aria-label="${group.label}">
          <div class="mega-panel-grid columns-${group.columns.length}">
            ${renderMegaColumns(group.columns, root, currentPath)}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderMegaColumns(columns, root, currentPath) {
  return columns.map((col) => {
    let itemsHtml = "";
    if (col.dynamicKey && dynamicMeta[col.dynamicKey]) {
      const list = dynamicMeta[col.dynamicKey];
      itemsHtml = list.map((item) => {
        const link = `${root}${col.basePath}${encodeURIComponent(item.slug || item.id)}`;
        return `
          <a href="${link}" class="mega-menu-link">
            <span class="mega-link-icon">${LUCIDE_ICONS[col.icon] || ""}</span>
            <span class="mega-link-text">
              <span class="mega-link-title">${item.name}</span>
              <span class="mega-link-count">${item.job_count} tin</span>
            </span>
          </a>
        `;
      }).join("");
    } else if (Array.isArray(col.items)) {
      itemsHtml = col.items.map((item) => {
        let link = `${root}${item.path}`;
        if (item.authRequired && typeof Auth !== "undefined" && !Auth.isAuthenticated()) {
          link = `${root}pages/login.html?redirect=${encodeURIComponent(item.path)}`;
        }
        const isActive = currentPath.endsWith(item.path);
        const badge = item.badge ? `<span class="mega-item-badge">${item.badge}</span>` : "";
        return `
          <a href="${link}" class="mega-menu-link ${isActive ? "is-active" : ""}">
            <span class="mega-link-icon">${LUCIDE_ICONS[item.icon] || ""}</span>
            <span class="mega-link-text">
              <span class="mega-link-title">${item.label} ${badge}</span>
              ${item.desc ? `<span class="mega-link-desc">${item.desc}</span>` : ""}
            </span>
          </a>
        `;
      }).join("");
    }
    return `
      <div class="mega-col">
        <h3 class="mega-col-title">${col.title}</h3>
        <div class="mega-col-list">${itemsHtml}</div>
      </div>
    `;
  }).join("");
}

export function initMegaMenuEvents(container) {
  if (!container) return;
  const items = container.querySelectorAll(".mega-nav-item");
  let activeItem = null;
  let hoverTimer = null;

  function openItem(item) {
    if (activeItem && activeItem !== item) closeItem(activeItem);
    activeItem = item;
    item.classList.add("is-open");
    item.querySelector(".mega-nav-trigger")?.setAttribute("aria-expanded", "true");
  }

  function closeItem(item) {
    if (!item) return;
    item.classList.remove("is-open");
    item.querySelector(".mega-nav-trigger")?.setAttribute("aria-expanded", "false");
    if (activeItem === item) activeItem = null;
  }

  items.forEach((item) => {
    const trigger = item.querySelector(".mega-nav-trigger");
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      item.classList.contains("is-open") ? closeItem(item) : openItem(item);
    });
    item.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => openItem(item), 150);
    });
    item.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => closeItem(item), 150);
    });
  });

  document.addEventListener("click", (e) => {
    if (activeItem && !activeItem.contains(e.target)) closeItem(activeItem);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeItem) {
      const trigger = activeItem.querySelector(".mega-nav-trigger");
      closeItem(activeItem);
      trigger?.focus();
    }
  });
}
