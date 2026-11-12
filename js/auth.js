/**
 * Auth & Route Guard Module - TechRecruit (Vanilla JS thuần)
 * - Quản lý phiên đăng nhập: token, user profile, role (candidate, recruiter, admin).
 * - Cung cấp hàm bảo vệ tuyến đường (Guard) chặn truy cập trái phép theo role.
 */

(function () {
  const STORAGE_KEYS = {
    TOKEN: "auth_token",
    USER: "auth_user",
    ROLE: "auth_role",
  };

  const listeners = new Set();

  function normalizeRole(role) {
    if (!role) return "";
    const lower = String(role).toLowerCase().trim();
    if (lower === "employer") return "recruiter";
    return lower;
  }

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

  function getDashboardForRole(role) {
    const root = resolveRoot();
    const r = normalizeRole(role);
    if (r === "admin") return `${root}pages/admin/dashboard.html`;
    if (r === "recruiter") return `${root}pages/employer/dashboard.html`;
    return `${root}index.html`;
  }

  // Load state từ localStorage
  let currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN) || null;
  let currentUser = null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) currentUser = JSON.parse(saved);
  } catch (e) {
    currentUser = null;
  }

  function notifySubscribers() {
    const state = {
      isAuthenticated: !!currentToken,
      user: currentUser,
      role: normalizeRole(currentUser?.role || localStorage.getItem(STORAGE_KEYS.ROLE)),
      token: currentToken,
    };
    listeners.forEach((fn) => {
      try { fn(state); } catch (err) { console.error(err); }
    });
  }

  window.addEventListener("auth:unauthorized", () => {
    Auth.clearSession(false);
  });

  const Auth = {
    isAuthenticated() {
      return !!currentToken;
    },

    getToken() {
      return currentToken;
    },

    getUser() {
      return currentUser;
    },

    getRole() {
      if (currentUser?.role) return normalizeRole(currentUser.role);
      return normalizeRole(localStorage.getItem(STORAGE_KEYS.ROLE));
    },

    hasRole(...roles) {
      if (!this.isAuthenticated()) return false;
      const myRole = this.getRole();
      if (!myRole) return false;
      const targets = roles.map(normalizeRole);
      return targets.includes(myRole);
    },

    setSession(token, user = null) {
      currentToken = token;
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      if (user) {
        currentUser = user;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        if (user.role) {
          localStorage.setItem(STORAGE_KEYS.ROLE, normalizeRole(user.role));
        }
      }
      notifySubscribers();
    },

    clearSession(notify = true) {
      currentToken = null;
      currentUser = null;
      const appKeys = [
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.ROLE,
        "accessToken",
        "refreshToken",
        "refresh_token",
        "user",
      ];
      appKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      if (notify) notifySubscribers();
    },

    async login(email, password) {
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password: password,
      });
      const token = res.access_token;
      this.setSession(token, null);

      try {
        const user = await api.get("/auth/me");
        this.setSession(token, user);
        return { user, token };
      } catch (err) {
        this.clearSession(true);
        throw err;
      }
    },

    async register(data) {
      return api.post("/auth/register", data);
    },

    logout(redirectUrl) {
      // 1. Đóng dropdown avatar & mobile drawer trước khi chuyển trang
      document.querySelectorAll(".user-dropdown-menu.show").forEach((el) => {
        el.classList.remove("show");
      });
      document.querySelectorAll(".mobile-drawer-panel.open").forEach((el) => {
        el.classList.remove("open");
      });
      document.querySelectorAll(".drawer-backdrop.active").forEach((el) => {
        el.classList.remove("active");
      });
      if (document.body) {
        document.body.style.overflow = "";
      }

      // 2. Gọi POST /auth/logout (không await, bắt lỗi im lặng để không chặn người dùng)
      try {
        if (typeof api !== "undefined" && typeof api.post === "function") {
          Promise.resolve(api.post("/auth/logout", {})).catch(() => {});
        }
      } catch (e) {
        // Bỏ qua lỗi mạng
      }

      // 3. Xóa token, dữ liệu user trong storage và reset state
      this.clearSession(true);

      // 4. Chuyển về trang đăng nhập bằng location.replace() để nút Back không quay lại được
      const root = resolveRoot();
      const target = redirectUrl || `${root}pages/login.html`;
      window.location.replace(target);
    },

    subscribe(callback) {
      listeners.add(callback);
      callback({
        isAuthenticated: this.isAuthenticated(),
        user: this.getUser(),
        role: this.getRole(),
        token: this.getToken(),
      });
      return () => listeners.delete(callback);
    },

    /* ==========================================================
       ROUTE GUARDS: Chặn quyền truy cập theo vai trò
       ========================================================== */
    canAccess(roles) {
      if (!this.isAuthenticated()) return false;
      if (!roles || roles.length === 0 || roles === "*") return true;
      const targetRoles = Array.isArray(roles) ? roles : [roles];
      return this.hasRole(...targetRoles);
    },

    requireAuth(options = {}) {
      const root = resolveRoot();
      const currentUrl = window.location.pathname + window.location.search;

      // 1. Kiểm tra đăng nhập
      if (!this.isAuthenticated()) {
        console.warn("[Guard] Chưa đăng nhập. Điều hướng về trang login.");
        if (document.body) document.body.style.display = "none";
        const loginUrl = options.redirectIfUnauthorized || `${root}pages/login.html`;
        window.location.replace(`${loginUrl}?redirect=${encodeURIComponent(currentUrl)}`);
        return false;
      }

      // 2. Kiểm tra vai trò (Role)
      const allowedRoles = options.roles;
      if (allowedRoles && allowedRoles.length > 0 && allowedRoles !== "*") {
        if (!this.canAccess(allowedRoles)) {
          const userRole = this.getRole();
          console.warn(`[Guard] Quyền không hợp lệ: Cần [${allowedRoles}], role hiện tại là [${userRole}].`);
          if (document.body) document.body.style.display = "none";
          const fallback = options.redirectIfForbidden || `${root}pages/403.html`;
          window.location.replace(fallback);
          return false;
        }
      }

      if (document.body) document.body.style.display = "";
      return true;
    },

    guestOnly(redirectUrl) {
      if (this.isAuthenticated()) {
        const target = redirectUrl || getDashboardForRole(this.getRole());
        if (document.body) document.body.style.display = "none";
        window.location.replace(target);
        return false;
      }
      return true;
    },

    autoGuard() {
      const body = document.body;
      if (!body) return;

      if (body.dataset.guestOnly === "true") {
        this.guestOnly();
        return;
      }

      if (body.dataset.protected === "true") {
        const roles = body.dataset.roles ? body.dataset.roles.split(",").map((r) => r.trim()) : null;
        this.requireAuth({ roles });
      }
    },

    getDashboardUrl: getDashboardForRole,
  };

  // Tự động kích hoạt Guard khi DOM nạp xong
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => Auth.autoGuard());
    } else {
      Auth.autoGuard();
    }
  }

  window.Auth = Auth;
  window.AuthState = Auth;
  window.ProtectedRoute = Auth;
})();

