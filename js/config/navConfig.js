/**
 * navConfig.js - NGUỒN DỮ LIỆU DUY NHẤT cho header & mega menu (< 160 dòng).
 * Mỗi mục có cờ status: "ready" | "soon". Mục "soon" trỏ tới /pages/placeholder.html?feature=slug.
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
          { label: "Tìm việc làm IT", path: "pages/jobs.html", icon: "search", desc: "Tìm kiếm vị trí phù hợp", status: "ready" },
          { label: "Việc đã ứng tuyển", path: "pages/candidate/applications.html", icon: "briefcase", authRequired: true, desc: "Theo dõi trạng thái hồ sơ", status: "ready" },
          { label: "Việc đã lưu", path: "pages/candidate/saved-jobs.html", icon: "bookmark", authRequired: true, desc: "Danh sách việc đã lưu", status: "ready" },
          { label: "Việc làm phù hợp", path: "pages/candidate/matched-jobs.html", icon: "target", authRequired: true, desc: "Gợi ý việc theo hồ sơ", status: "ready" },
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
          { label: "Mẫu CV theo phong cách", path: "pages/cv-templates.html", icon: "file-text", desc: "Bốn bố cục trình bày", status: "ready" },
          { label: "Quản lý CV", path: "pages/candidate/cv-manage.html", icon: "folder", authRequired: true, desc: "Tải xuống các phiên bản", status: "ready" },
          { label: "Tải CV lên", path: "pages/candidate/cvs.html?upload=1", icon: "upload-cloud", authRequired: true, desc: "Dùng CV có sẵn để ứng tuyển", status: "ready" },
          {
            label: "Hướng dẫn viết CV",
            title: "Hướng dẫn viết CV",
            description: "Mục này đang được xây dựng",
            summary: "Cung cấp cấu trúc và nội dung thực tế giúp bạn hoàn thiện hồ sơ ứng tuyển IT.",
            path: "pages/placeholder.html?feature=cv-guide",
            icon: "book-open",
            desc: "Cấu trúc và nội dung nên có",
            status: "soon",
          },
        ],
      },
      {
        title: "THƯ GIỚI THIỆU",
        items: [
          { label: "Quản lý Cover Letter", path: "pages/placeholder.html?feature=cover-letters", icon: "mail", authRequired: true, desc: "Soạn và lưu nhiều phiên bản", status: "soon" },
          { label: "Mẫu Cover Letter", path: "pages/placeholder.html?feature=cover-letter-templates", icon: "copy", desc: "Bốn mẫu thư theo vị trí", status: "soon" },
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
          { label: "Câu hỏi phỏng vấn IT", path: "pages/tools/interview-questions.html", icon: "help-circle", desc: "Câu hỏi theo chuyên môn", status: "ready" },
          { label: "Trắc nghiệm tính cách", path: "pages/placeholder.html?feature=personality-test", icon: "compass", desc: "Định hướng vai trò & kỹ năng phù hợp", status: "ready" },
        ],
      },
      {
        title: "TÍNH TOÁN",
        items: [
          { label: "Lương Gross - Net", path: "pages/tools/gross-net.html", icon: "calculator", desc: "Theo biểu thuế lũy tiến", status: "ready" },
          { label: "Thuế thu nhập cá nhân", path: "pages/tools/tax.html", icon: "percent", desc: "Chi tiết theo từng bậc", status: "ready" },
          { label: "Tra cứu mức lương", path: "pages/tools/salary.html", icon: "bar-chart", desc: "Theo ngành, cấp bậc, địa điểm", status: "ready" },
          { label: "Bảo hiểm thất nghiệp", path: "pages/tools/unemployment-insurance.html", icon: "shield", desc: "Số tháng hưởng và mức hưởng", status: "ready" },
          { label: "Bảo hiểm xã hội một lần", path: "pages/placeholder.html?feature=one-time-social-insurance", icon: "clock", desc: "Quy đổi thời gian đóng", status: "soon" },
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
          { label: "Báo cáo thị trường IT", path: "pages/thi-truong.html", icon: "pie-chart", desc: "Số liệu thị trường công nghệ", status: "ready" },
          { label: "Kinh nghiệm ứng tuyển", path: "pages/placeholder.html?feature=interview-tips", icon: "lightbulb", desc: "Chuẩn bị trước phỏng vấn", status: "soon" },
          { label: "Lộ trình sự nghiệp", path: "pages/candidate/career-path.html", icon: "compass", desc: "Gợi ý vai trò và độ phủ kỹ năng", status: "ready" },
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
      { label: "Hồ sơ ứng viên", path: "pages/candidate/profile.html", icon: "user", status: "ready" },
      { label: "Việc làm phù hợp", path: "pages/candidate/matched-jobs.html", icon: "target", status: "ready" },
      { label: "Lộ trình sự nghiệp", path: "pages/candidate/career-path.html", icon: "compass", status: "ready" },
      { label: "Việc đã ứng tuyển", path: "pages/candidate/applications.html", icon: "briefcase", status: "ready" },
      { label: "Việc đã lưu", path: "pages/candidate/saved-jobs.html", icon: "bookmark", status: "ready" },
      { label: "Quản lý CV", path: "pages/candidate/cv-manage.html", icon: "folder", status: "ready" },
      { label: "Tải CV lên", path: "pages/candidate/cvs.html", icon: "upload-cloud", status: "ready" },
    ],
  },
  recruiter: {
    label: "Nhà tuyển dụng",
    actions: [
      { label: "Bảng điều khiển", path: "pages/employer/dashboard.html", icon: "dashboard", status: "ready" },
      { label: "Quản lý tuyển dụng", path: "pages/employer/recruitment.html", icon: "briefcase", status: "ready" },
      { label: "Cài đặt công ty", path: "pages/employer/company-settings.html", icon: "building", status: "ready" },
      { label: "Đăng tin mới", path: "pages/employer/job-form.html", icon: "file-text", status: "ready" },
    ],
  },
  admin: {
    label: "Quản trị viên",
    actions: [
      { label: "Bảng quản trị", path: "pages/admin/dashboard.html", icon: "dashboard", status: "ready" },
      { label: "Duyệt tin tuyển dụng", path: "pages/admin/jobs.html", icon: "check-circle", status: "ready" },
      { label: "Giám sát ứng tuyển", path: "pages/admin/applications.html", icon: "file-text", status: "ready" },
      { label: "Quản lý tin", path: "pages/items.html", icon: "briefcase", status: "ready" },
      { label: "Ngân hàng câu hỏi", path: "pages/admin/interview-questions.html", icon: "help-circle", status: "ready" },
    ],
  },
};

export const ROLE_LABELS = {
  guest: "Khách", candidate: "Ứng viên", recruiter: "Nhà tuyển dụng", admin: "Quản trị viên",
};
