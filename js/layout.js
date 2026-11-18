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
    home: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    building: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="6" x2="9.01" y2="6"></line><line x1="15" y1="6" x2="15.01" y2="6"></line><line x1="9" y1="10" x2="9.01" y2="10"></line><line x1="15" y1="10" x2="15.01" y2="10"></line><line x1="9" y1="14" x2="9.01" y2="14"></line><line x1="15" y1="14" x2="15.01" y2="14"></line><path d="M9 22v-4h6v4"></path></svg>`,
    fileText: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    history: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path><polyline points="12 7 12 12 15 15"></polyline></svg>`
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
        { path: "pages/jobs.html", label: "Khám phá việc làm" },
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
        { path: "pages/jobs.html", label: "Khám phá việc làm" },
        { path: "pages/candidate/applications.html", label: "Việc đã ứng tuyển" },
        { path: "pages/candidate/career-path.html", label: "Lộ trình sự nghiệp" },
        { path: "pages/thi-truong.html", label: "Thị trường IT" },
      ],
      quickAction: null,
      dropdown: [
        { path: "pages/candidate/applications.html", label: "Việc đã ứng tuyển", icon: "briefcase" },
        { path: "pages/candidate/career-path.html", label: "Lộ trình sự nghiệp", icon: "briefcase" },
        { path: "pages/candidate/profile.html", label: "Hồ sơ ứng viên", icon: "user" },
        { path: "pages/jobs.html", label: "Khám phá việc làm", icon: "search" },
        { path: "pages/thi-truong.html", label: "Thị trường IT", icon: "trending-up" }
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
        { path: "pages/employer/recruitment.html", label: "Quản lý tuyển dụng" },
      ],
      quickAction: {
        path: "pages/employer/job-form.html",
        label: "+ Đăng tin",
        drawerLabel: "+ Đăng tin tuyển dụng"
      },
      dropdown: [
        { path: "pages/employer/dashboard.html", label: "Bảng điều khiển", icon: "dashboard" },
        { path: "pages/employer/recruitment.html", label: "Quản lý tuyển dụng", icon: "briefcase" }
      ],
      sidebar: [
        {
          group: "Tuyển dụng",
          items: [
            { path: "pages/employer/dashboard.html", label: "Tổng quan tuyển dụng", icon: "dashboard" },
            { path: "pages/employer/recruitment.html", label: "Quản lý tuyển dụng", icon: "briefcase" }
          ]
        }
      ]
    },
    operator: {
      roleLabel: "Chuyên viên vận hành",
      badgeClass: "badge-admin",
      portalTitle: "AdminPortal",
      nav: [
        { path: "index.html", label: "Trang chủ" },
        { path: "pages/admin/companies.html", label: "Công ty" },
        { path: "pages/admin/candidate-cvs.html", label: "CV ứng viên" },
      ],
      quickAction: {
        path: "pages/admin/companies.html",
        label: "Khu vận hành",
        drawerLabel: "Vào Khu vận hành"
      },
      dropdown: [
        { path: "pages/admin/companies.html", label: "Quản lý công ty", icon: "building" },
        { path: "pages/admin/candidate-cvs.html", label: "CV ứng viên", icon: "fileText" },
        { path: "pages/admin/audit-logs.html", label: "Nhật ký thay đổi", icon: "history" }
      ],
      sidebar: [
        {
          group: "Quản trị doanh nghiệp & hồ sơ",
          items: [
            { path: "pages/admin/companies.html", label: "Công ty", icon: "building" },
            { path: "pages/admin/candidate-cvs.html", label: "CV ứng viên", icon: "fileText" },
            { path: "pages/admin/audit-logs.html", label: "Nhật ký thay đổi", icon: "history" }
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
            { path: "pages/admin/companies.html", label: "Công ty", icon: "building" },
            { path: "pages/admin/candidate-cvs.html", label: "CV ứng viên", icon: "fileText" },
            { path: "pages/admin/audit-logs.html", label: "Nhật ký thay đổi", icon: "history" },
            { path: "pages/items.html", label: "Tin tuyển dụng", icon: "briefcase" },
            { path: "pages/admin/interview-questions.html", label: "Ngân hàng câu hỏi", icon: "settings" }
          ]
        }
      ]
    }
  };

  /* ==========================================================
     3. TIỆN ÍCH HỆ THỐNG & THEME
     ========================================================== */
  function getSavedTheme() {
    let saved = null;
    try { saved = localStorage.getItem("theme") || localStorage.getItem(THEME_KEY); } catch {}
    if (saved === "dark") return "dark";
    // Mặc định luôn là light, kể cả khi hệ điều hành bật dark mode
    return "light";
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
      else if (rawRole === "operator") role = "operator";
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

    // 4.1. Header dùng chung — render bởi js/siteHeaderBoot.js (component siteHeader.js).
    //    layout.js KHÔNG render header nữa để tránh 2 bản header khác nhau.
    //    Header chỉ khởi tạo 1 lần, sau khi auth sẵn sàng.
    if (headerEl && !headerEl.dataset.siteHeaderReady) {
      headerEl.dataset.siteHeaderReady = "1";
      const boot = () => {
        const bootUrl = new URL(resolveUrl(root, "js/siteHeaderBoot.js"), window.location.href).href;
        import(bootUrl).then((m) => m.bootSiteHeader()).catch(console.error);
      };
      if (window.Auth) boot();
      else window.addEventListener("load", boot, { once: true });
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
              <li><a href="${resolveUrl(root, "pages/jobs.html")}">Việc làm IT mới nhất</a></li>
              <li><a href="${resolveUrl(root, "pages/candidate/saved-jobs.html")}">Việc đã lưu</a></li>
              <li><a href="${resolveUrl(root, "pages/cv-templates.html")}">Mẫu CV chuyên nghiệp</a></li>
            </ul>
          </div>

          <div>
            <div class="footer-col-title">Dành cho Doanh nghiệp</div>
            <ul class="footer-links-list">
              <li><a href="${resolveUrl(root, "pages/employer/job-form.html")}">Đăng tin tuyển dụng</a></li>
              <li><a href="${resolveUrl(root, "pages/employer/dashboard.html")}">Bảng quản trị tuyển dụng</a></li>
              <li><a href="${resolveUrl(root, "pages/companies.html")}">Danh bạ công ty</a></li>
            </ul>
          </div>

          <div>
            <div class="footer-col-title">Thông tin & Giới thiệu</div>
            <ul class="footer-links-list">
              <li><a href="${resolveUrl(root, "pages/about.html")}">Giới thiệu dự án</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom-bar">
          <div class="container footer-bottom-inner">
            <span>© ${new Date().getFullYear()} TechRecruit. Tất cả quyền được bảo lưu.</span>
            <span><a href="${resolveUrl(root, "pages/about.html")}" style="color:inherit;text-decoration:underline;">Giới thiệu dự án</a></span>
          </div>
        </div>
      `;
    }
  }

  function bindMainEvents(headerEl, drawerRoot) {
    // Nút gạt Dark / Light Mode
    const themeBtn = headerEl.querySelector("#btn-theme-toggle");
    if (themeBtn) {
      const syncThemeBtn = (isDark) => {
        themeBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
        themeBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
        const label = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
        themeBtn.setAttribute("aria-label", label);
        themeBtn.setAttribute("title", label);
      };
      syncThemeBtn(getSavedTheme() === "dark");
      themeBtn.addEventListener("click", () => {
        const nextTheme = getSavedTheme() === "dark" ? "light" : "dark";
        try {
          localStorage.setItem("theme", nextTheme);
          localStorage.setItem(THEME_KEY, nextTheme);
        } catch {}
        const isDark = applyTheme(nextTheme);
        syncThemeBtn(isDark);
        window.dispatchEvent(new CustomEvent("theme:change", { detail: { theme: nextTheme, isDark } }));
      });
      window.addEventListener("storage", (e) => {
        if (e.key === "theme" || e.key === THEME_KEY) {
          const isDark = e.newValue === "dark";
          applyTheme(isDark ? "dark" : "light");
          syncThemeBtn(isDark);
        }
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

    if (typeof window.__INIT_MEGA_EVENTS__ === "function") {
      window.__INIT_MEGA_EVENTS__(headerEl, drawerScope);
    }

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
     5. RENDER GIAO DIỆN QUẢN TRỊ (DÙNG CHUNG QUA components/adminLayout.js)
     ========================================================== */
  function renderAdminLayout() {
    const root = resolveRoot();
    const currentPath = window.location.pathname.replace(/\\/g, "/");
    const { user, role } = getCurrentUserAndRole();
    const adminRole = role === "admin" ? "admin" : (role === "operator" ? "operator" : "recruiter");
    const roleConfig = NAV_CONFIG[adminRole] || NAV_CONFIG.admin;

    const invokeShared = () => {
      if (window.AdminLayout && typeof window.AdminLayout.renderAdminShell === "function") {
        window.AdminLayout.renderAdminShell({
          root,
          currentPath,
          user,
          roleConfig,
          icons: ICONS,
          isPathActive,
          resolveUrl,
        });
      }
    };

    if (window.AdminLayout) {
      invokeShared();
    } else {
      // Fallback nếu trang chưa nhúng trực tiếp thẻ script components/adminLayout.js
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", resolveUrl(root, "js/components/adminLayout.js"), false);
        xhr.send(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          // eslint-disable-next-line no-new-func
          new Function(xhr.responseText)();
          invokeShared();
        }
      } catch (err) {
        console.error("[Layout] Không nạp được adminLayout.js:", err);
      }
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
