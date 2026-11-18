# TechRecruit Frontend — HTML5 · CSS3 · Vanilla JS (ES Modules)

Giao diện web cho nền tảng tuyển dụng CNTT **TechRecruit** (Nhóm 5 — HN-KS25-CNTT5). Sử dụng Vanilla JavaScript (ES Modules) + Axios CDN, không cần bước build.

---

## 1. Repo Backend liên kết & Địa chỉ API

- **Repo Backend**: https://github.com/phong0706/KS25-CNTT5-NHOM_5-Nen_tang_tuyen_dung-BE.git *(nhánh `add/chucnang`)*
- **Nhánh Frontend hiện tại**: `chore/restructure-project`
- **Địa chỉ API gốc duy nhất** (khai báo tại `js/config.js`):
  ```js
  const CONFIG = {
    API_BASE_URL: "http://127.0.0.1:8000/api",
    APP_NAME: "KS25 Base",
  };
  ```
  *(Mọi lệnh gọi API qua `js/api.js` và `fetch` đều đọc từ `CONFIG.API_BASE_URL`.)*

---

## 2. Cách chạy Frontend

1. Khởi động Backend trước theo hướng dẫn tại `backend/README.md` (`uvicorn app.main:app --reload --port 8000`).
2. Mở thư mục `frontend/` bằng **VS Code**.
3. Cài đặt extension **Live Server** (Ritwick Dey) và cấu hình chạy ở cổng **`5501`** hoặc **`5502`** (chuột phải `index.html` → **Open with Live Server**).
   *(Lưu ý: repo frontend thuần HTML/CSS/JS không có `package.json`, nên không cần chạy `npm install`.)*

---

## 3. Địa chỉ mở trang

- Khi mở trực tiếp từ thư mục `frontend/` bằng Live Server:
  - **http://127.0.0.1:5502/index.html** *(hoặc cổng `5501`: `http://127.0.0.1:5501/index.html`)*
- Module `js/routes.js` tự động nhận diện gốc trang đang mở để tạo liên kết đúng cho mọi vai trò (Ứng viên, Nhà tuyển dụng, Quản trị viên).

---

## 4. Kiểm tra kết nối Backend

1. Mở DevTools trình duyệt (**F12**), chọn đồng thời tab **Console** và **Network**.
2. Tải lại trang `http://127.0.0.1:5502/index.html`:
   - Tab **Console**: không có lỗi CORS (`blocked by CORS policy`) hoặc lỗi JavaScript chưa bắt.
   - Tab **Network**: các request tới `http://127.0.0.1:8000/api/jobs`, `/api/meta/...`, `/api/stats/home` trả trạng thái `200 OK`, không có `404` hoặc `500`.
   - Giao diện trang chủ hiển thị danh sách việc làm, ngành nghề và công ty thật từ MySQL.

---

## 5. Lưu ý quan trọng về CORS (`127.0.0.1` vs `localhost`)

Trình duyệt coi **`http://127.0.0.1:5502`** và **`http://localhost:5502`** là **hai origin khác nhau**. Do đó, trong file `.env` của Backend, biến `CORS_ORIGINS` phải khai báo **đầy đủ cả hai** (cho cả cổng `5501` và `5502`):

```env
CORS_ORIGINS=http://127.0.0.1:5501,http://localhost:5501,http://127.0.0.1:5502,http://localhost:5502
```
