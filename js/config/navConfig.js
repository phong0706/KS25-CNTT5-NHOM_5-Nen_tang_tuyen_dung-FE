/**
 * navConfig.js - NGUỒN DỮ LIỆU DUY NHẤT cho header & mega menu.
 * ---------------------------------------------------------------------------
 * Nguyên tắc nội dung trung thực:
 *  - KHÔNG bịa số liệu ("Hơn 1,000+"). Số thật lấy từ GET /api/meta/nav lúc runtime.
 *  - KHÔNG badge quảng cáo tự tạo (LIVE/HOT/AI/PHỔ BIẾN/"Mới").
 *  - KHÔNG lời hứa không có dữ liệu chứng minh ("chuẩn ATS", "quy định mới nhất").
 *  - Icon lĩnh vực lấy theo trường `icon` của meta_categories trong DB.
 * Giới hạn: < 200 dòng.
 */
import { MENU_ICONS } from "./navIcons.js";

export const CATEGORY_ICONS = {
  server: MENU_ICONS.server, layout: MENU_ICONS.layout, cpu: MENU_ICONS.cpu,
  cloud: MENU_ICONS.cloud, smartphone: MENU_ICONS.smartphone, shield: MENU_ICONS.shield,
};

export const DEFAULT_CATEGORY_ICON = MENU_ICONS.briefcase;

export const NAV_MEGA_CONFIG = [
  {
    id: "jobs",
    label: "Việc làm",
    columns: [
      {
        title: "TÌM VIỆC",
        items: [
          { label: "Tìm việc làm IT", path: "pages/jobs.html", icon: "search", desc: "" },
          { label: "Việc đã ứng tuyển", path: "pages/candidate/applications.html", icon: "briefcase", authRequired: true, desc: "Theo dõi trạng thái hồ sơ", status: "ready" },
          { label: "Việc đã lưu", path: "pages/candidate/saved-jobs.html", icon: "bookmark", authRequired: true, desc: "Danh sách việc đã lưu", status: "ready" },
          { label: "Việc làm phù hợp", path: "pages/candidate/matched-jobs.html", icon: "target", authRequired: true, desc: "Gợi ý việc theo hồ sơ" },
          { label: "Công ty", path: "pages/companies.html", icon: "building", desc: "Doanh nghiệp công nghệ", status: "ready" },
        ],
      },
      { title: "THEO LĨNH VỰC", dynamicKey: "by_category", basePath: "pages/jobs.html?category=", icon: "tag" },
      { title: "THEO ĐỊA ĐIỂM", dynamicKey: "by_location", basePath: "pages/jobs.html?location=", icon: "map-pin" },
    ],
  },
  {
    id: "cv",
    label: "Tạo CV",
    columns: [
      {
        title: "MẪU & HƯỚNG DẪN",
        items: [
          { label: "Mẫu CV theo phong cách", path: "pages/cv-templates.html", icon: "file-text", desc: "Bốn bố cục trình bày" },
          { label: "Quản lý CV", path: "pages/candidate/cv-manage.html", icon: "folder", authRequired: true, desc: "Tải xuống các phiên bản" },
          { label: "Tải CV lên", path: "pages/candidate/cv-upload.html", icon: "upload-cloud", authRequired: true, desc: "Dùng CV có sẵn để ứng tuyển" },
          { label: "Hướng dẫn viết CV", path: "pages/cv-guide.html", icon: "book-open", desc: "Cấu trúc và nội dung nên có" },
        ],
      },
      {
        title: "THƯ GIỚI THIỆU",
        items: [
          { label: "Quản lý Cover Letter", path: "pages/candidate/cover-letters.html", icon: "mail", authRequired: true, desc: "Soạn và lưu nhiều phiên bản" },
          { label: "Mẫu Cover Letter", path: "pages/cover-letter-templates.html", icon: "copy", desc: "Bốn mẫu thư theo vị trí" },
        ],
      },
    ],
  },
  {
    id: "tools",
    label: "Công cụ",
    columns: [
      {
        title: "PHÁT TRIỂN BẢN THÂN",
        items: [
          { label: "Câu hỏi phỏng vấn IT", path: "pages/interview-questions.html", icon: "help-circle", desc: "Câu hỏi theo chuyên môn" },
          { label: "Trắc nghiệm tính cách", path: "pages/personality-test.html", icon: "user-check", desc: "Định hướng phong cách làm việc" },
        ],
      },
      {
        title: "TÍNH TOÁN",
        items: [
          { label: "Lương Gross - Net", path: "pages/tools/gross-net.html", icon: "calculator", desc: "Theo biểu thuế lũy tiến" },
          { label: "Thuế thu nhập cá nhân", path: "pages/tools/tax.html", icon: "percent", desc: "Chi tiết theo từng bậc" },
          { label: "Tra cứu mức lương", path: "pages/tools/salary.html", icon: "bar-chart", desc: "Theo ngành, cấp bậc, địa điểm", status: "ready" },
          { label: "Lãi kép tích lũy", path: "pages/tools/compound-interest.html", icon: "trending-up", desc: "Tăng trưởng theo kỳ hạn" },
          { label: "Bảo hiểm thất nghiệp", path: "pages/tools/unemployment-insurance.html", icon: "shield", desc: "Số tháng hưởng và mức hưởng" },
          { label: "Bảo hiểm xã hội một lần", path: "pages/tools/one-time-social-insurance.html", icon: "clock", desc: "Quy đổi thời gian đóng" },
          { label: "Kế hoạch tiết kiệm", path: "pages/tools/savings-plan.html", icon: "target", desc: "Số tiền góp mỗi tháng" },
        ],
      },
    ],
  },
  {
    id: "handbook",
    label: "Cẩm nang",
    columns: [
      {
        title: "CẨM NANG & XU HƯỚNG",
        items: [
          { label: "Báo cáo thị trường IT", path: "pages/thi-truong.html", icon: "pie-chart", desc: "" },
          { label: "Kinh nghiệm ứng tuyển", path: "pages/placeholder.html?feature=interview-tips", icon: "lightbulb", desc: "Chuẩn bị trước phỏng vấn" },
          { label: "Lộ trình sự nghiệp", path: "pages/placeholder.html?feature=career-roadmap", icon: "compass", desc: "Từ junior đến senior" },
        ],
      },
    ],
  },
];

export const NAV_BY_ROLE = {
  guest: { label: "Khách", actions: [] },
  candidate: {
    label: "Ứng viên",
    actions: [
      { label: "Hồ sơ ứng viên", path: "pages/candidate/profile.html", icon: "user" },
      { label: "Việc đã ứng tuyển", path: "pages/candidate/applications.html", icon: "briefcase", status: "ready" },
      { label: "Việc đã lưu", path: "pages/candidate/saved-jobs.html", icon: "bookmark", status: "ready" },
      { label: "Quản lý CV", path: "pages/candidate/cv-manage.html", icon: "folder" },
    ],
  },
  recruiter: {
    label: "Nhà tuyển dụng",
    actions: [
      { label: "Bảng điều khiển", path: "pages/employer/dashboard.html", icon: "dashboard" },
      { label: "Quản lý tin tuyển dụng", path: "pages/employer/jobs.html", icon: "briefcase" },
      { label: "Đăng tin mới", path: "pages/employer/job-form.html", icon: "file-text" },
    ],
  },
  admin: {
    label: "Quản trị viên",
    actions: [
      { label: "Bảng quản trị", path: "pages/admin/dashboard.html", icon: "dashboard" },
      { label: "Quản lý tin", path: "pages/items.html", icon: "briefcase" },
    ],
  },
};

export const ROLE_LABELS = {
  guest: "Khách", candidate: "Ứng viên", recruiter: "Nhà tuyển dụng", admin: "Quản trị viên",
};
