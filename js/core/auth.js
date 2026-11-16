/**
 * Core Auth Module (ES Module) - Nguồn chân lý duy nhất cho toàn bộ Frontend.
 * Cung cấp:
 *  - getSession(): { token, user, role, isAuthenticated }
 *  - auth.ready: Promise hoàn tất việc khởi tạo phiên & đồng bộ profile từ backend nếu cần
 *  - subscribe(callback)
 *  - login(email, password)
 *  - logout(redirectUrl)
 *  - clearSession()
 *  - setSession(token, user)
 */

const STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "auth_user",
  ROLE: "auth_role",
};

function normalizeRole(role) {
  if (!role) return "";
  const lower = String(role).toLowerCase().trim();
  if (lower === "employer") return "recruiter";
  return lower;
}

let currentToken = null;
let currentUser = null;
const listeners = new Set();

try {
  currentToken = localStorage.getItem(STORAGE_KEYS.TOKEN) || null;
  const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (rawUser) currentUser = JSON.parse(rawUser);
} catch {
  currentUser = null;
}

function notifySubscribers() {
  const session = getSession();
  listeners.forEach((fn) => {
    try {
      fn(session);
    } catch (err) {
      console.error("[Auth] Listener error:", err);
    }
  });
}

export function getSession() {
  return {
    token: currentToken,
    user: currentUser,
    role: normalizeRole(currentUser?.role || (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ROLE) : "")),
    isAuthenticated: Boolean(currentToken),
  };
}

let resolveReady;
export const ready = new Promise((resolve) => {
  resolveReady = resolve;
});

async function initAuth() {
  if (!currentToken) {
    resolveReady(getSession());
    return;
  }

  // Nếu đã có token nhưng chưa có user (hoặc để xác thực token còn sống)
  if (!currentUser) {
    try {
      const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
      const res = await fetch(`${base}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        currentUser = await res.json();
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        localStorage.setItem(STORAGE_KEYS.ROLE, normalizeRole(currentUser.role));
      } else if (res.status === 401 || res.status === 403) {
        clearSession(false);
      }
    } catch {
      // Giữ token nếu lỗi mạng tạm thời
    }
  }

  resolveReady(getSession());
  notifySubscribers();
}

export function setSession(token, user = null) {
  currentToken = token;
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  if (user) {
    currentUser = user;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (user.role) {
      localStorage.setItem(STORAGE_KEYS.ROLE, normalizeRole(user.role));
    }
  } else if (!token) {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
  }
  notifySubscribers();
}

export function clearSession(notify = true) {
  currentToken = null;
  currentUser = null;
  [
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.USER,
    STORAGE_KEYS.ROLE,
    "accessToken",
    "refreshToken",
    "refresh_token",
    "user",
  ].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
  if (notify) notifySubscribers();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function login(email, password) {
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Đăng nhập thất bại");
  }

  const data = await res.json();
  const token = data.access_token;

  let user = null;
  try {
    const meRes = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (meRes.ok) user = await meRes.json();
  } catch {}

  setSession(token, user);
  return { token, user };
}

export function logout(redirectUrl) {
  clearSession(true);
  if (redirectUrl) {
    window.location.href = redirectUrl;
  } else {
    const root = document.body?.dataset?.root || "../";
    window.location.href = `${root}index.html`;
  }
}

export const auth = {
  ready,
  getSession,
  setSession,
  clearSession,
  subscribe,
  login,
  logout,
  getUser: () => currentUser,
  getRole: () => getSession().role,
  getToken: () => currentToken,
  isAuthenticated: () => Boolean(currentToken),
};

if (typeof window !== "undefined") {
  window.AuthCore = auth;
  // Khởi động đồng bộ auth ngay khi import
  initAuth();
}

export default auth;
