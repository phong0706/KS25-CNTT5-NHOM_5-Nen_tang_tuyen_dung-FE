/**
 * megaInit.js - Module nạp dữ liệu động từ API và đồng bộ Mega Menu & Mobile Drawer
 * Giới hạn: < 200 dòng.
 */
import { fetchMegaNavMeta, renderMegaNavHtml, initMegaMenuEvents } from "./components/megaMenu.js";
import { renderDrawerAccordionHtml, bindDrawerAccordionEvents } from "./components/mobileAccordion.js";

function getRoot() {
  const r = document.body?.dataset?.root;
  if (r) return r.endsWith("/") ? r : r + "/";
  const p = window.location.pathname.replace(/\\/g, "/");
  return p.includes("/pages/admin/") || p.includes("/pages/employer/") || p.includes("/pages/candidate/") ? "../../" : (p.includes("/pages/") ? "../" : "./");
}

async function bootMegaMenu() {
  await fetchMegaNavMeta();
  const root = getRoot();
  const currentPath = window.location.pathname.replace(/\\/g, "/");

  window.__MEGA_NAV_HTML__ = renderMegaNavHtml(currentPath);
  window.__DRAWER_ACCORDION_HTML__ = renderDrawerAccordionHtml(root, currentPath);

  window.__INIT_MEGA_EVENTS__ = (headerEl, drawerScope) => {
    initMegaMenuEvents(headerEl);
    bindDrawerAccordionEvents(drawerScope);
  };

  // Nếu layout đã render trước đó, thay thế lại navbar
  const navContainer = document.querySelector(".header-nav");
  if (navContainer) {
    navContainer.innerHTML = window.__MEGA_NAV_HTML__;
    initMegaMenuEvents(document.getElementById("app-header"));
  }

  const drawerNav = document.querySelector(".drawer-body");
  if (drawerNav) {
    const existingAccordion = drawerNav.querySelector(".drawer-mega-accordions");
    if (!existingAccordion) {
      const div = document.createElement("div");
      div.innerHTML = window.__DRAWER_ACCORDION_HTML__;
      drawerNav.insertBefore(div.firstElementChild, drawerNav.firstChild);
      bindDrawerAccordionEvents(document.getElementById("app-drawer-root") || document);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootMegaMenu);
} else {
  bootMegaMenu();
}
