<<<<<<< HEAD
/**
 * Core API Module - TechRecruit (Pure Vanilla JS + Axios)
 * - Tự động đính kèm Bearer JWT từ localStorage vào mọi request.
 * - Tự động bắt lỗi 401 (hết hạn / token không hợp lệ): xoá session và chuyển hướng về trang đăng nhập.
 * - Trích xuất thông báo lỗi chuẩn từ FastAPI.
 */

// Lớp đóng gói lỗi API
class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Khóa lưu token trong localStorage
const AUTH_TOKEN_KEY = "auth_token";

/**
 * Helper tính toán đường dẫn tương đối về thư mục frontend/
 */
function getAppRootPath() {
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

// Khởi tạo axios instance dùng chung
const http = axios.create({
  baseURL: (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL)
    ? CONFIG.API_BASE_URL
    : "http://127.0.0.1:8000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

/* ==========================================================
   REQUEST INTERCEPTOR: Tự động đính kèm Bearer token
   ========================================================== */
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ==========================================================
   RESPONSE INTERCEPTOR: Xử lý 401 (hết hạn), 403 & parse lỗi
   ========================================================== */
=======
// Module gọi API bằng axios: cấu hình 1 lần, mọi trang dùng chung.
// (axios được nạp từ CDN bằng thẻ <script> trong từng trang HTML, trước file này)
//
// Cách dùng (trong các file js/pages/*.js):
//   const items = await api.get("/items");
//   const items = await api.get("/items", { q: "com" });          // -> /items?q=com
//   const created = await api.post("/items", { name: "Trà đá", price: 5000 });
//   await api.put("/items/1", { name: "Tên mới" });
//   await api.delete("/items/1");
//
// Các hàm trả về thẳng dữ liệu JSON (đã lấy sẵn response.data).
// Nếu lỗi, hàm sẽ throw ApiError -> bắt bằng try/catch và hiện error.message cho người dùng.

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status; // mã HTTP: 404, 422, 500... (0 = không gọi được server)
    this.data = data; // nội dung lỗi gốc server trả về
  }
}

// Instance axios dùng chung: mọi request tự nối thêm baseURL phía trước
const http = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000, // quá 10 giây không phản hồi thì báo lỗi
  headers: { "Content-Type": "application/json" },
});

// Muốn gửi token đăng nhập cho mọi request (khi nhóm làm chức năng login), bỏ comment đoạn dưới:
// http.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// Lấy câu thông báo lỗi dễ đọc từ response của FastAPI
function getErrorMessage(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  // Lỗi 422 (dữ liệu không hợp lệ): detail là mảng [{ loc: [...], msg: "..." }]
  if (data && Array.isArray(data.detail)) {
    return data.detail.map((e) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join("; ");
  }
  return `Lỗi ${status}`;
}

// Gom xử lý lỗi một chỗ: đổi lỗi của axios thành ApiError dễ dùng
>>>>>>> origin/develop
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
<<<<<<< HEAD
      const { status, data } = error.response;

      // Trích xuất thông báo lỗi thân thiện từ FastAPI
      let message = `Lỗi ${status}`;
      if (data && typeof data.detail === "string") {
        message = data.detail;
      } else if (data && Array.isArray(data.detail)) {
        message = data.detail.map((err) => `${err.loc?.[err.loc.length - 1] || "dữ liệu"}: ${err.msg}`).join("; ");
      }

      // Xử lý 401: Token hết hạn hoặc không hợp lệ
      if (status === 401) {
        console.warn("[API] 401 Unauthorized - Hết hạn phiên đăng nhập.");
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_role");

        window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: { message } }));

        const currentPath = window.location.pathname.toLowerCase();
        const isAuthPage = currentPath.includes("login.html") || currentPath.includes("register.html");

        if (!isAuthPage) {
          const root = getAppRootPath();
          const redirectParam = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `${root}pages/login.html?redirect=${redirectParam}&expired=1`;
        }

        return Promise.reject(new ApiError(message, 401, data));
      }

      // Xử lý 403: Không có quyền truy cập
      if (status === 403) {
        console.warn("[API] 403 Forbidden - Không có quyền truy cập.");
        window.dispatchEvent(new CustomEvent("auth:forbidden", { detail: { message } }));
        return Promise.reject(new ApiError(message || "Bạn không có quyền thực hiện thao tác này.", 403, data));
      }

      return Promise.reject(new ApiError(message, status, data));
    }

    // Không kết nối được tới server
    return Promise.reject(new ApiError("Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra lại kết nối.", 0));
  }
);

// Đối tượng gọi API toàn cục
const api = {
  raw: http,
  ApiError: ApiError,
  get: (path, params = {}) => http.get(path, { params }).then((res) => res.data),
  post: (path, body = {}, config = {}) => http.post(path, body, config).then((res) => res.data),
  put: (path, body = {}, config = {}) => http.put(path, body, config).then((res) => res.data),
  patch: (path, body = {}, config = {}) => http.patch(path, body, config).then((res) => res.data),
  delete: (path, params = {}) => http.delete(path, { params }).then((res) => res.data),
};

window.api = api;
window.ApiClient = api;
=======
      // Server có trả lời nhưng là lỗi (4xx, 5xx)
      const { status, data } = error.response;
      return Promise.reject(new ApiError(getErrorMessage(data, status), status, data));
    }
    // Không có response: server tắt, sai URL, bị chặn CORS, hoặc quá thời gian chờ
    return Promise.reject(new ApiError(
      "Không kết nối được backend. Backend đã chạy chưa? Kiểm tra CONFIG.API_BASE_URL.", 0,
    ));
  },
);

const api = {
  get: (path, params) => http.get(path, { params }).then((res) => res.data),
  post: (path, body) => http.post(path, body).then((res) => res.data),
  put: (path, body) => http.put(path, body).then((res) => res.data),
  delete: (path) => http.delete(path).then((res) => res.data),
};
>>>>>>> origin/develop
