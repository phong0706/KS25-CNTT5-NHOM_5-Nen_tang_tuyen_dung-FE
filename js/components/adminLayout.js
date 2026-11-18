/**
 * adminLayout.js - File layout dùng chung duy nhất cho toàn bộ khu quản trị (pages/admin/* & pages/items.html).
 * Quản lý trạng thái thu gọn qua 1 class duy nhất "admin-sidebar-collapsed" trên document.documentElement
 * và lưu vào localStorage. Giới hạn: < 200 dòng.
 */
(function () {
  "use strict";

  const COLLAPSED_CLASS = "admin-sidebar-collapsed";
  const STORAGE_KEY = "admin_sidebar_collapsed";

  function esc(s) {
    return typeof s === "string"
      ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
      : "";
  }

  function syncCollapsedState(collapsed) {
    document.documentElement.classList.toggle(COLLAPSED_CLASS, Boolean(collapsed));
    const btn = document.getElementById("btn-toggle-sidebar");
    if (btn) {
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      const label = collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("data-tooltip", label);
    }
  }

  function renderAdminShell({ root, currentPath, user, roleConfig, icons, isPathActive, resolveUrl }) {
    const pageTitle = document.body.dataset.pageTitle || document.title.split("|")[0].trim() || "Bảng quản trị";
    let savedCollapsed = false;
    try { savedCollapsed = localStorage.getItem(STORAGE_KEY) === "true"; } catch {}
    syncCollapsedState(savedCollapsed);

    const displayName = user ? (user.full_name || (user.email ? user.email.split("@")[0] : "Quản trị viên")) : "Quản trị viên";
    const userEmail = user ? (user.email || "") : "";
    const userInitial = displayName.charAt(0).toUpperCase();

    const existingShell = document.querySelector(".admin-shell");
    if (existingShell) {
      const nameEl = existingShell.querySelector(".user-name-label");
      if (nameEl) nameEl.textContent = displayName;
      const emailEl = existingShell.querySelector(".dropdown-user-email");
      if (emailEl) emailEl.textContent = userEmail;
      const avatarEl = existingShell.querySelector(".user-avatar-circle");
      if (avatarEl) avatarEl.textContent = userInitial;
      return;
    }

    let navHtml = "";
    roleConfig.sidebar.forEach((group, gIdx) => {
      navHtml += `<div class="sidebar-group-title" id="sb-group-${gIdx}">${esc(group.group)}</div>`;
      group.items.forEach((item, iIdx) => {
        const active = isPathActive(currentPath, root, item.path);
        const tipId = `sb-tip-${gIdx}-${iIdx}`;
        navHtml += `
          <a href="${resolveUrl(root, item.path)}" class="sidebar-nav-item ${active ? "active" : ""}"
             aria-label="${esc(item.label)}" aria-describedby="${tipId}" ${active ? 'aria-current="page"' : ""}>
            ${icons[item.icon] || ""}
            <span class="sidebar-item-label" id="${tipId}" role="tooltip">${esc(item.label)}</span>
          </a>`;
      });
    });

    const originalContent = document.getElementById("admin-content-outlet")?.innerHTML || document.querySelector("main")?.innerHTML || "";
    const collapseLabel = savedCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng";

    document.body.innerHTML = `
      <div class="admin-shell">
        <div class="drawer-backdrop" id="admin-sidebar-backdrop"></div>
        <aside class="admin-sidebar" id="admin-sidebar" aria-label="Điều hướng quản trị">
          <div class="sidebar-header">
            <a href="${resolveUrl(root, "index.html")}" class="sidebar-brand" aria-label="${esc(roleConfig.portalTitle || "AdminPortal")} - Về trang chủ">
              <div class="brand-icon-box" style="width: 32px; height: 32px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
              <span class="sidebar-brand-text">${esc(roleConfig.portalTitle || "Portal")}</span>
            </a>
            <button type="button" class="sidebar-mobile-close-btn" id="btn-close-admin-sidebar" aria-label="Đóng menu điều hướng">✕</button>
          </div>
          <nav class="sidebar-nav-scroll" aria-label="Danh mục quản trị">${navHtml}</nav>
          <div class="sidebar-footer">
            <a href="${resolveUrl(root, "index.html")}" class="sidebar-nav-item sidebar-home-link" aria-label="Về Website công khai" aria-describedby="sb-tip-home">
              ${icons.home}
              <span class="sidebar-item-label" id="sb-tip-home" role="tooltip">Về Website công khai</span>
            </a>
            <button type="button" class="sidebar-collapse-btn" id="btn-toggle-sidebar"
              aria-expanded="${savedCollapsed ? "false" : "true"}" aria-label="${collapseLabel}" data-tooltip="${collapseLabel}">
              <svg class="sidebar-collapse-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
              <span class="sidebar-collapse-text">Thu gọn menu</span>
            </button>
          </div>
        </aside>
        <div class="admin-body-wrap">
          <header class="admin-topbar">
            <div class="topbar-left-zone">
              <button type="button" class="mobile-menu-toggle" id="btn-admin-mobile-toggle" aria-label="Mở menu quản trị" aria-controls="admin-sidebar" aria-expanded="false">${icons.menu}</button>
              <div style="min-width:0;">
                <h1 class="topbar-page-title">${esc(pageTitle)}</h1>
                <div class="topbar-breadcrumb">
                  <a href="${resolveUrl(root, "index.html")}">Trang chủ</a><span>/</span>
                  <span>${esc(roleConfig.roleLabel)}</span><span>/</span>
                  <span style="color: var(--text-primary); font-weight: 500;">${esc(pageTitle)}</span>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <div class="user-menu-wrapper">
                <div class="user-profile-trigger" id="admin-user-trigger" tabindex="0" role="button" aria-haspopup="menu" aria-expanded="false">
                  <div class="user-avatar-circle">${esc(userInitial)}</div>
                  <div class="user-meta-text">
                    <span class="user-name-label">${esc(displayName)}</span>
                    <span class="user-role-badge ${roleConfig.badgeClass}">${esc(roleConfig.roleLabel)}</span>
                  </div>
                  ${icons.chevronDown}
                </div>
                <div class="user-dropdown-menu" id="admin-user-dropdown" role="menu">
                  <div class="dropdown-header-info">
                    <strong style="display: block; font-size: 13px; color: var(--text-primary);">${esc(displayName)}</strong>
                    <span class="dropdown-user-email">${esc(userEmail)}</span>
                  </div>
                  <a href="${resolveUrl(root, "index.html")}" class="dropdown-item" role="menuitem">${icons.home}<span>Về trang chủ công khai</span></a>
                  <div class="dropdown-divider"></div>
                  <div class="dropdown-item item-danger" id="btn-admin-logout" role="menuitem" tabindex="0">${icons.logout}<span>Đăng xuất</span></div>
                </div>
              </div>
            </div>
          </header>
          <main class="admin-main-content">${originalContent}</main>
        </div>
      </div>`;

    bindAdminShellEvents();
  }

  function bindAdminShellEvents() {
    const sidebar = document.getElementById("admin-sidebar");
    const toggleBtn = document.getElementById("btn-toggle-sidebar");
    const mobileToggleBtn = document.getElementById("btn-admin-mobile-toggle");
    const closeSidebarBtn = document.getElementById("btn-close-admin-sidebar");
    const backdrop = document.getElementById("admin-sidebar-backdrop");

    toggleBtn?.addEventListener("click", () => {
      const next = !document.documentElement.classList.contains(COLLAPSED_CLASS);
      syncCollapsedState(next);
      try { localStorage.setItem(STORAGE_KEY, next ? "true" : "false"); } catch {}
    });

    let prevFocus = null;
    const openDrawer = () => {
      if (!sidebar || !backdrop) return;
      prevFocus = document.activeElement;
      sidebar.classList.add("mobile-open"); backdrop.classList.add("active");
      mobileToggleBtn?.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      closeSidebarBtn?.focus();
    };
    const closeDrawer = () => {
      if (!sidebar || !backdrop) return;
      sidebar.classList.remove("mobile-open"); backdrop.classList.remove("active");
      mobileToggleBtn?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
    };

    mobileToggleBtn?.addEventListener("click", openDrawer);
    closeSidebarBtn?.addEventListener("click", closeDrawer);
    backdrop?.addEventListener("click", closeDrawer);

    sidebar?.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !sidebar.classList.contains("mobile-open")) return;
      const focusables = Array.from(sidebar.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const [first, last] = [focusables[0], focusables[focusables.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar?.classList.contains("mobile-open")) { e.preventDefault(); closeDrawer(); }
    });

    const trigger = document.getElementById("admin-user-trigger");
    const dropdown = document.getElementById("admin-user-dropdown");
    trigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = dropdown?.classList.toggle("show");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    trigger?.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger.click(); } });
    document.addEventListener("click", (e) => {
      if (dropdown && trigger && !dropdown.contains(e.target) && !trigger.contains(e.target)) {
        dropdown.classList.remove("show"); trigger.setAttribute("aria-expanded", "false");
      }
    });
    document.getElementById("btn-admin-logout")?.addEventListener("click", () => { if (typeof window.Auth !== "undefined") window.Auth.logout(); });
  }

  window.AdminLayout = { renderAdminShell };
})();
