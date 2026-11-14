/**
 * mobileAccordion.js - Render danh sách accordion cho Drawer mobile dựa trên navConfig
 * Giới hạn: < 200 dòng.
 */
import { NAV_MEGA_CONFIG } from "../config/navConfig.js";

export function renderDrawerAccordionHtml(root = "./", currentPath = "") {
  return `
    <div class="drawer-mega-accordions">
      ${NAV_MEGA_CONFIG.map((group) => {
        const items = group.columns.flatMap((col) => col.items || []);
        return `
          <div class="drawer-accordion-group" data-group="${group.id}">
            <button type="button" class="drawer-accordion-header" aria-expanded="false">
              <span>${group.label}</span>
              <svg class="nav-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="drawer-accordion-content">
              ${items.map((it) => {
                let link = `${root}${it.path}`;
                if (it.authRequired && typeof Auth !== "undefined" && !Auth.isAuthenticated()) {
                  link = `${root}pages/login.html?redirect=${encodeURIComponent(it.path)}`;
                }
                const isActive = currentPath.endsWith(it.path);
                return `
                  <a href="${link}" class="drawer-nav-link ${isActive ? "active" : ""}">
                    <span>${it.label}</span>
                  </a>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export function bindDrawerAccordionEvents(drawerPanel) {
  if (!drawerPanel) return;
  drawerPanel.querySelectorAll(".drawer-accordion-header").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".drawer-accordion-group");
      const isOpen = group.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });
}
