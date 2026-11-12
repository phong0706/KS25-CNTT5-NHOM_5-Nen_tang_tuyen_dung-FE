/**
 * Layout Module - TechRecruit (Pure Vanilla JS)
 * - Tự động quản lý Header/Footer linh hoạt theo 4 vai trò: Khách, Ứng viên, Nhà tuyển dụng, Admin.
 * - Hỗ trợ Mobile Drawer trượt mượt mà trên thiết bị di động (touch target >= 44px).
 * - Hỗ trợ AdminLayout (Sidebar cố định thu gọn được + Topbar) cho trang quản trị.
 * - Cơ chế Theme (Light/Dark) lưu vào localStorage và tự nhận diện theme hệ thống.
 * - Tối ưu bảo trì: cấu hình menu tập trung tại NAV_CONFIG, không làm hỏng event listener khi cập nhật.
 */

(function () {
  "use strict";

  const THEME_KEY = "techrecruit_theme";
  const SIDEBAR_COLLAPSED_KEY = "admin_sidebar_collapsed";

  /* ==========================================================
     1. KHO BIỂU TƯỢNG (ICONS) DÙNG CHUNG
     ========================================================== */
  const ICONS = {
    sun: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    briefcase: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    dashboard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    users: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    logout: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
    menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    chevronDown: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    home: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
  };

  /* ==========================================================
     2. CẤU HÌNH MENU TẬP TRUNG (NAV_CONFIG)
     - Sửa hoặc thêm menu tại đây, toàn bộ Header, Drawer, 
       Dropdown và Sidebar sẽ tự động đồng bộ theo.
     ========================================================== */
  const NAV_CONFIG = {
    guest: {
      roleLabel: "Khách",
      badgeClass: "",
      nav: [
        { path: "index.html", label: "Trang chủ" },
        { path: "pages/items.html", label: "Khám phá việc làm" },
        { path: "pages/thi-truong.html", label: "Thị trường IT" },
      ],
      quickAction: null,
      dropdown: [],
      sidebar: []
    },
    candidate: {
      roleLabel: "Ứng viên",
      badgeClass: "badge-candidate",
      nav: [
        { path: "index.html", label: "Trang chủ" },
        { path: "pages/items.html", label: "Khám phá việc làm" },
        { path: "pages/thi-truong.html", label: "Thị trường IT" },
      ],
      quickAction: null,
      dropdown: [
        { path: "pages/items.html", label: "Khám phá việc làm", icon: "search" },
        { path: "pages/thi-truong.html", label: "Thị trường IT", icon: "briefcase" }
      ],
      sidebar: []
    },
    recruiter: {
      roleLabel: "Nhà tuyển dụng",
      badgeClass: "badge-recruiter",
      portalTitle: "RecruiterHub",
      nav: [
        { path: "index.html", label: "Trang chủ" },
        { path: "pages/employer/dashboard.html", label: "Bảng điều khiển" },
        { path: "pages/items.html", label: "Quản lý tin đăng" },
      ],
      quickAction: {
        path: "pages/items.html",
        label: "+ Đăng tin",
        drawerLabel: "+ Đăng tin tuyển dụng"
      },
      dropdown: [
        { path: "pages/employer/dashboard.html", label: "Bảng điều khiển", icon: "dashboard" },
        { path: "pages/items.html", label: "Quản lý tin tuyển dụng", icon: "briefcase" }
      ],
      sidebar: [
        {
          group: "Tuyển dụng",
          items: [
            { path: "pages/employer/dashboard.html", label: "Tổng quan tuyển dụng", icon: "dashboard" },
            { path: "pages/items.html", label: "Quản lý tin đăng", icon: "briefcase" }
          ]
        }
      ]
    },
    admin: {
      roleLabel: "Quản trị viên",
      badgeClass: "badge-admin",
      portalTitle: "AdminPortal",
      nav: [
        { path: "index.html", label: "Trang chủ" },
        { path: "pages/admin/dashboard.html", label: "Bảng quản trị" },
        { path: "pages/items.html", label: "Quản lý tin đăng" },
      ],
      quickAction: {
        path: "pages/admin/dashboard.html",
        label: "Admin Panel",
        drawerLabel: "Vào Admin Panel"
      },
      dropdown: [
        { path: "pages/admin/dashboard.html", label: "Quản trị hệ thống", icon: "settings" }
      ],
      sidebar: [
        {
          group: "Tổng quan",
          items: [
            { path: "pages/admin/dashboard.html", label: "Bảng điều khiển", icon: "dashboard" }
          ]
        },
        {
          group: "Quản trị dữ liệu",
          items: [
            { path: "pages/admin/dashboard.html", label: "Quản lý tài khoản", icon: "users" },
            { path: "pages/items.html", label: "Tin tuyển dụng", icon: "briefcase" }
          ]
        }
      ]
    }
  };

  /* ==========================================================
     3. TIỆN ÍCH HỆ THỐNG & THEME
     ========================================================== */
  function getSavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    // Nhận diện theo theme hệ thống nếu chưa từng lưu
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    return isDark;
  }

  // Khởi động theme sớm nhất có thể
  applyTheme(getSavedTheme());

  function resolveRoot() {
    const rootAttr = document.body ? document.body.dataset.root : null;
    if (rootAttr) return rootAttr.endsWith("/") ? rootAttr : rootAttr + "/";
    const path = window.location.pathname.replace(/\\/g, "/");
    if (path.includes("/pages/admin/") || path.includes("/pages/employer/") || path.includes("/pages/candidate/")) {
      return "../../";
    } else if (path.includes("/pages/")) {
      return "../";
    }
    return "./";
  }

  function resolveUrl(root, relativePath) {
    if (!relativePath) return "#";
    if (relativePath.startsWith("http://") || relativePath.startsWith("https://") || relativePath.startsWith("#")) {
      return relativePath;
    }
    return root + relativePath;
  }

  function isPathActive(currentPath, root, itemPath) {
    const target = (root + itemPath).replace(/\\/g, "/");
    if (itemPath === "index.html") {
      return currentPath.endsWith("/") || currentPath.endsWith("/index.html");
    }
    return currentPath.endsWith(itemPath);
  }

  function safeEscape(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCurrentUserAndRole() {
    const isAuth = typeof Auth !== "undefined" && Auth.isAuthenticated();
    const user = isAuth ? Auth.getUser() : null;
    let role = "guest";
    if (isAuth) {
      const rawRole = (Auth.getRole() || "").toLowerCase();
      if (rawRole === "employer" || rawRole === "recruiter") role = "recruiter";
      else if (rawRole === "admin") role = "admin";
      else role = "candidate";
    }
    return { isAuth, user, role };
  }

  /* ==========================================================
     4. RENDER GIAO DIỆN CHÍNH (MAIN LAYOUT)
     ========================================================== */
  function renderMainLayout() {
    const headerEl = document.getElementById("app-header");
    const footerEl = document.getElementById("app-footer");
    const root = resolveRoot();
    const currentPath = window.location.pathname.replace(/\\/g, "/");
    const { isAuth, user, role } = getCurrentUserAndRole();
    const roleConfig = NAV_CONFIG[role] || NAV_CONFIG.guest;

    // 4.1. Render Header
    if (headerEl) {
      const navHtml = roleConfig.nav
        .map((item) => {
          const active = isPathActive(currentPath, root, item.path);
          return `<a href="${resolveUrl(root, item.path)}" class="nav-link ${active ? "active" : ""}">${safeEscape(item.label)}</a>`;
        })
        .join("");

      let rightSideHtml = "";
      let drawerUserHtml = "";
      let drawerQuickAction = "";

      if (isAuth && user) {
        const displayName = user.full_name || (user.email ? user.email.split("@")[0] : "Tài khoản");
        const userInitial = displayName.charAt(0).toUpperCase();

        let quickActionBtn = "";
        if (roleConfig.quickAction) {
          quickActionBtn = `<a href="${resolveUrl(root, roleConfig.quickAction.path)}" class="header-btn header-btn-primary header-quick-action" style="padding: 6px 12px; font-size: 13px;">${safeEscape(roleConfig.quickAction.label)}</a>`;
          drawerQuickAction = `<a href="${resolveUrl(root, roleConfig.quickAction.path)}" class="drawer-nav-link">${ICONS.dashboard}<span>${safeEscape(roleConfig.quickAction.drawerLabel || roleConfig.quickAction.label)}</span></a>`;
        }

        const dropdownItemsHtml = roleConfig.dropdown
          .map((item) => {
            const iconSvg = ICONS[item.icon] || "";
            return `
              <a href="${resolveUrl(root, item.path)}" class="dropdown-item">
                ${iconSvg}
                <span>${safeEscape(item.label)}</span>
              </a>
            `;
          })
          .join("");

        rightSideHtml = `
          ${quickActionBtn}
          <div class="user-menu-wrapper">
            <div class="user-profile-trigger" id="header-user-trigger" tabindex="0" role="button" aria-haspopup="true">
              <div class="user-avatar-circle">${safeEscape(userInitial)}</div>
              <div class="user-meta-text">
                <span class="user-name-label">${safeEscape(displayName)}</span>
                <span class="user-role-badge ${roleConfig.badgeClass}">${safeEscape(roleConfig.roleLabel)}</span>
              </div>
              ${ICONS.chevronDown}
            </div>

            <div class="user-dropdown-menu" id="header-user-dropdown">
              <div class="dropdown-header-info">
                <strong style="display: block; font-size: 13px; color: var(--text-primary, #0f172a);">${safeEscape(displayName)}</strong>
                <span class="dropdown-user-email">${safeEscape(user.email || "")}</span>
              </div>
              ${dropdownItemsHtml}
              <div class="dropdown-divider"></div>
              <div class="dropdown-item item-danger" id="btn-dropdown-logout" role="button">
                ${ICONS.logout}
                <span>Đăng xuất</span>
              </div>
            </div>
          </div>
        `;

        drawerUserHtml = `
          <div class="drawer-user-summary">
            <div class="user-avatar-circle">${safeEscape(userInitial)}</div>
            <div style="min-width: 0; flex: 1;">
              <div style="font-weight: 600; font-size: 14px; color: var(--text-primary, #0f172a); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${safeEscape(displayName)}</div>
              <div style="font-size: 12px; color: var(--text-muted, #64748b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${safeEscape(user.email || "")}</div>
            </div>
          </div>
          <button type="button" id="btn-drawer-logout" class="drawer-logout-btn">${ICONS.logout}<span>Đăng xuất</span></button>
        `;
      } else {
        rightSideHtml = `
          <a href="${resolveUrl(root, "pages/login.html")}" class="header-btn header-btn-ghost">Đăng nhập</a>
          <a href="${resolveUrl(root, "pages/register.html")}" class="header-btn header-btn-primary">Đăng ký</a>
        `;

        drawerUserHtml = `
          <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 12px;">
            <a href="${resolveUrl(root, "pages/login.html")}" class="btn-submit" style="height: 44px; text-decoration: none; background: var(--bg-subtle, #f1f5f9); color: var(--text-primary, #0f172a); border: 1px solid var(--border-default, #cbd5e1); border-radius: 10px;">Đăng nhập</a>
            <a href="${resolveUrl(root, "pages/register.html")}" class="btn-submit" style="height: 44px; text-decoration: none; border-radius: 10px;">Tạo tài khoản mới</a>
          </div>
        `;
      }

      const isCurrentDark = getSavedTheme() === "dark";

      headerEl.innerHTML = `
        <div class="container main-header-inner">
          <a href="${resolveUrl(root, "index.html")}" class="header-brand">
            <div class="brand-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <span>TechRecruit</span>
          </a>

          <nav class="header-nav">${navHtml}</nav>

          <div class="header-actions">
            <button
              type="button"
              class="theme-toggle-btn"
              id="btn-theme-toggle"
              aria-label="${isCurrentDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}"
              aria-pressed="${isCurrentDark ? "true" : "false"}"
              title="Chuyển đổi Sáng / Tối"
            >
              ${isCurrentDark ? ICONS.sun : ICONS.moon}
            </button>
            ${rightSideHtml}
            <button type="button" class="mobile-menu-toggle" id="btn-mobile-toggle" aria-label="Mở Menu" aria-expanded="false" aria-controls="main-drawer-panel">
              ${ICONS.menu}
            </button>
          </div>
        </div>
      `;

      let drawerRoot = document.getElementById("app-drawer-root");
      if (!drawerRoot) {
        drawerRoot = document.createElement("div");
        drawerRoot.id = "app-drawer-root";
        document.body.appendChild(drawerRoot);
      }

      drawerRoot.innerHTML = `
        <div class="drawer-backdrop" id="main-drawer-backdrop" aria-hidden="true"></div>
        <div class="mobile-drawer-panel" id="main-drawer-panel" role="dialog" aria-modal="true" aria-label="Menu điều hướng" aria-hidden="true" inert>
          <div class="drawer-header">
            <div style="font-weight: 700; color: var(--text-primary, #0f172a); display: flex; align-items: center; gap: 8px;">
              <div class="brand-icon-box" style="width: 26px; height: 26px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
              TechRecruit
            </div>
            <button type="button" class="drawer-close-btn" id="btn-drawer-close" aria-label="Đóng menu">✕</button>
          </div>
          <nav class="drawer-body" aria-label="Điều hướng chính">
            ${roleConfig.nav.map((item) => `<a href="${resolveUrl(root, item.path)}" class="drawer-nav-link">${safeEscape(item.label)}</a>`).join("")}
            ${drawerQuickAction}
            ${drawerUserHtml}
          </nav>
        </div>
      `;

      bindMainEvents(headerEl, drawerRoot);
    }

    // 4.2. Render Footer (4 cột thẳng hàng, không thụt lề, cùng bảng màu sáng)
    if (footerEl) {
      footerEl.innerHTML = `
        <div class="container footer-top-grid">
          <div>
            <div class="footer-brand-title">
              <div class="brand-icon-box" style="width: 28px; height: 28px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
              <span>TechRecruit</span>
            </div>
            <p class="footer-desc">
              Nền tảng tuyển dụng công nghệ kết nối trực tiếp kỹ sư IT với các doanh nghiệp hàng đầu.
            </p>
          </div>

          <div>
            <div class="footer-col-title">Dành cho Ứng viên</div>
            <ul class="footer-links-list">
              <li><a href="${resolveUrl(root, "pages/items.html")}">Việc làm IT mới nhất</a></li>
              <li><a href="${resolveUrl(root, "pages/items.html")}">Tìm kiếm việc làm</a></li>
              <li><a href="${resolveUrl(root, "pages/thi-truong.html")}">Thị trường & Bản đồ lương</a></li>
            </ul>
          </div>

          <div>
            <div class="footer-col-title">Dành cho Doanh nghiệp</div>
            <ul class="footer-links-list">
              <li><a href="${resolveUrl(root, "pages/items.html")}">Đăng tin tuyển dụng</a></li>
              <li><a href="${resolveUrl(root, "pages/employer/dashboard.html")}">Bảng quản trị tuyển dụng</a></li>
              <li><a href="${resolveUrl(root, "pages/register.html")}">Đăng ký nhà tuyển dụng</a></li>
            </ul>
          </div>

          <div>
            <div class="footer-col-title">Hỗ trợ & Liên hệ</div>
            <ul class="footer-links-list">
              <li><a href="mailto:support@techrecruit.com">support@techrecruit.com</a></li>
              <li><a href="tel:0901234567">Hotline: 090 123 4567</a></li>
              <li><a href="#">Quy chế hoạt động</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom-bar">
          <div class="container footer-bottom-inner">
            <span>© ${new Date().getFullYear()} TechRecruit. Tất cả quyền được bảo lưu.</span>
            <span>Dự án Thực tập Doanh nghiệp · Nhóm 5 RIKKEILAB (HN-KS25-CNTT1)</span>
          </div>
        </div>
      `;
    }
  }

  function bindMainEvents(headerEl, drawerRoot) {
    // Nút gạt Dark / Light Mode
    const themeBtn = headerEl.querySelector("#btn-theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const nextTheme = getSavedTheme() === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, nextTheme);
        const isDark = applyTheme(nextTheme);
        themeBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
        themeBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
        themeBtn.setAttribute("aria-label", isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối");
        window.dispatchEvent(new CustomEvent("theme:change", { detail: { theme: nextTheme, isDark } }));
      });
    }

    // User Dropdown
    const trigger = headerEl.querySelector("#header-user-trigger");
    const dropdown = headerEl.querySelector("#header-user-dropdown");
    if (trigger && dropdown) {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("show");
      });

      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
          dropdown.classList.remove("show");
        }
      });
    }

    // Xử lý Đăng xuất ngay lập tức qua Auth.logout() duy nhất
    const handleLogout = () => {
      if (typeof Auth !== "undefined") Auth.logout();
    };

    const drawerScope = drawerRoot || document;
    const logoutBtn = headerEl.querySelector("#btn-dropdown-logout");
    const drawerLogoutBtn = drawerScope.querySelector("#btn-drawer-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
    if (drawerLogoutBtn) drawerLogoutBtn.addEventListener("click", handleLogout);

    // Mobile Drawer
    const mobileToggle = headerEl.querySelector("#btn-mobile-toggle");
    const drawer = drawerScope.querySelector("#main-drawer-panel");
    const backdrop = drawerScope.querySelector("#main-drawer-backdrop");
    const closeBtn = drawerScope.querySelector("#btn-drawer-close");

    function getDrawerFocusable() {
      if (!drawer) return [];
      return Array.from(
        drawer.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
    }

    function openDrawer() {
      if (!drawer || !backdrop) return;
      drawer.removeAttribute("inert");
      drawer.setAttribute("aria-hidden", "false");
      drawer.classList.add("open");
      backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
      if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "true");
      if (closeBtn) {
        requestAnimationFrame(() => closeBtn.focus());
      }
    }

    function closeDrawer(restoreFocus = true) {
      if (!drawer || !backdrop) return;
      drawer.classList.remove("open");
      backdrop.classList.remove("active");
      drawer.setAttribute("aria-hidden", "true");
      drawer.setAttribute("inert", "");
      document.body.style.overflow = "";
      if (mobileToggle) {
        mobileToggle.setAttribute("aria-expanded", "false");
        if (restoreFocus && mobileToggle.offsetParent !== null) {
          mobileToggle.focus();
        }
      }
    }

    if (mobileToggle) mobileToggle.addEventListener("click", openDrawer);
    if (closeBtn) closeBtn.addEventListener("click", () => closeDrawer(true));
    if (backdrop) backdrop.addEventListener("click", () => closeDrawer(true));

    document.addEventListener("keydown", (e) => {
      if (!drawer?.classList.contains("open")) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer(true);
        return;
      }

      if (e.key === "Tab") {
        const focusable = getDrawerFocusable();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !drawer.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last || !drawer.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ==========================================================
     5. RENDER GIAO DIỆN QUẢN TRỊ (ADMIN LAYOUT)
     - Giữ nguyên DOM content outlet, không làm mất event listeners.
     ========================================================== */
  function renderAdminLayout() {
    const root = resolveRoot();
    const currentPath = window.location.pathname.replace(/\\/g, "/");
    const { user, role } = getCurrentUserAndRole();
    const adminRole = role === "admin" ? "admin" : "recruiter";
    const roleConfig = NAV_CONFIG[adminRole] || NAV_CONFIG.admin;

    const pageTitle = document.body.dataset.pageTitle || document.title.split("|")[0].trim() || "Bảng quản trị";
    const isCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";

    const displayName = user ? (user.full_name || (user.email ? user.email.split("@")[0] : "Quản trị viên")) : "Quản trị viên";
    const userEmail = user ? (user.email || "") : "";
    const userInitial = displayName.charAt(0).toUpperCase();

    // 5.1. Nếu .admin-shell đã được tạo trước đó (ví dụ Auth.subscribe kích hoạt lại), chỉ cập nhật thông tin động
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

    // 5.2. Tạo HTML cho Sidebar Navigation
    let navHtml = "";
    roleConfig.sidebar.forEach((group) => {
      navHtml += `<div class="sidebar-group-title">${safeEscape(group.group)}</div>`;
      group.items.forEach((item) => {
        const isActive = isPathActive(currentPath, root, item.path);
        const iconSvg = ICONS[item.icon] || "";
        navHtml += `
          <a href="${resolveUrl(root, item.path)}" class="sidebar-nav-item ${isActive ? "active" : ""}" title="${safeEscape(item.label)}">
            ${iconSvg}
            <span>${safeEscape(item.label)}</span>
          </a>
        `;
      });
    });

    const originalContent = document.getElementById("admin-content-outlet")?.innerHTML ||
      document.querySelector("main")?.innerHTML || "";

    document.body.innerHTML = `
      <div class="admin-shell">
        <div class="drawer-backdrop" id="admin-sidebar-backdrop"></div>

        <aside class="admin-sidebar ${isCollapsed ? "collapsed" : ""}" id="admin-sidebar">
          <div class="sidebar-header">
            <a href="${resolveUrl(root, "index.html")}" class="sidebar-brand">
              <div class="brand-icon-box" style="width: 30px; height: 30px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
              <span>${safeEscape(roleConfig.portalTitle || "Portal")}</span>
            </a>
            <button class="sidebar-collapse-btn" id="btn-toggle-sidebar" title="Thu gọn/mở rộng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button class="sidebar-mobile-close-btn" id="btn-close-admin-sidebar" aria-label="Đóng menu">✕</button>
          </div>

          <nav class="sidebar-nav-scroll">
            ${navHtml}
          </nav>

          <div class="sidebar-footer">
            <a href="${resolveUrl(root, "index.html")}" class="sidebar-nav-item" style="color: var(--text-muted, #64748b);" title="Về trang chủ">
              ${ICONS.home}
              <span>Về Website công khai</span>
            </a>
          </div>
        </aside>

        <div class="admin-body-wrap">
          <header class="admin-topbar">
            <div class="topbar-left-zone">
              <button class="mobile-menu-toggle" id="btn-admin-mobile-toggle" aria-label="Mở menu quản trị">
                ${ICONS.menu}
              </button>
              <div>
                <h1 class="topbar-page-title">${safeEscape(pageTitle)}</h1>
                <div class="topbar-breadcrumb">
                  <a href="${resolveUrl(root, "index.html")}">Trang chủ</a>
                  <span>/</span>
                  <span>${safeEscape(roleConfig.roleLabel)}</span>
                  <span>/</span>
                  <span style="color: var(--text-primary, #0f172a); font-weight: 500;">${safeEscape(pageTitle)}</span>
                </div>
              </div>
            </div>

            <div class="header-actions">
              <div class="user-menu-wrapper">
                <div class="user-profile-trigger" id="admin-user-trigger" tabindex="0">
                  <div class="user-avatar-circle">${safeEscape(userInitial)}</div>
                  <div class="user-meta-text">
                    <span class="user-name-label">${safeEscape(displayName)}</span>
                    <span class="user-role-badge ${roleConfig.badgeClass}">${safeEscape(roleConfig.roleLabel)}</span>
                  </div>
                  ${ICONS.chevronDown}
                </div>

                <div class="user-dropdown-menu" id="admin-user-dropdown">
                  <div class="dropdown-header-info">
                    <strong style="display: block; font-size: 13px; color: var(--text-primary, #0f172a);">${safeEscape(displayName)}</strong>
                    <span class="dropdown-user-email">${safeEscape(userEmail)}</span>
                  </div>
                  <a href="${resolveUrl(root, "index.html")}" class="dropdown-item">
                    ${ICONS.home}
                    <span>Về trang chủ công khai</span>
                  </a>
                  <div class="dropdown-divider"></div>
                  <div class="dropdown-item item-danger" id="btn-admin-logout" role="button">
                    ${ICONS.logout}
                    <span>Đăng xuất</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main class="admin-main-content">
            ${originalContent}
          </main>
        </div>
      </div>
    `;

    bindAdminEvents();
  }

  function bindAdminEvents() {
    const sidebar = document.getElementById("admin-sidebar");
    const toggleBtn = document.getElementById("btn-toggle-sidebar");
    const mobileToggleBtn = document.getElementById("btn-admin-mobile-toggle");
    const closeSidebarBtn = document.getElementById("btn-close-admin-sidebar");
    const backdrop = document.getElementById("admin-sidebar-backdrop");

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        const isCollapsed = sidebar.classList.contains("collapsed");
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed ? "true" : "false");
      });
    }

    function openMobileSidebar() {
      if (!sidebar || !backdrop) return;
      sidebar.classList.add("mobile-open");
      backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeMobileSidebar() {
      if (!sidebar || !backdrop) return;
      sidebar.classList.remove("mobile-open");
      backdrop.classList.remove("active");
      document.body.style.overflow = "";
    }

    if (mobileToggleBtn) mobileToggleBtn.addEventListener("click", openMobileSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeMobileSidebar);
    if (backdrop) backdrop.addEventListener("click", closeMobileSidebar);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar?.classList.contains("mobile-open")) {
        closeMobileSidebar();
      }
    });

    const trigger = document.getElementById("admin-user-trigger");
    const dropdown = document.getElementById("admin-user-dropdown");
    const logoutBtn = document.getElementById("btn-admin-logout");

    if (trigger && dropdown) {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("show");
      });

      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
          dropdown.classList.remove("show");
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (typeof Auth !== "undefined") Auth.logout();
      });
    }
  }

  /* ==========================================================
     6. KHỞI TẠO VÀ LẮNG NGHE SỰ KIỆN AUTH
     ========================================================== */
  function initLayout() {
    const layout = document.body ? document.body.dataset.layout : "main";
    if (layout === "admin") {
      renderAdminLayout();
    } else {
      renderMainLayout();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLayout);
  } else {
    initLayout();
  }

  if (typeof Auth !== "undefined" && typeof Auth.subscribe === "function") {
    Auth.subscribe(() => {
      initLayout();
    });
  }
})();
