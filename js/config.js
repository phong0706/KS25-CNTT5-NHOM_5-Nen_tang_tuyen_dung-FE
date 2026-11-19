// Cấu hình chung của frontend.
// Đổi API_BASE_URL nếu backend chạy ở địa chỉ/cổng khác (hoặc khi deploy).
const CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000/api",
  APP_NAME: "KS25 Base",
};

// Dọn dẹp khóa theme cũ nếu còn sót trong localStorage
try {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("theme");
    localStorage.removeItem("techrecruit_theme");
  }
} catch (e) {}
