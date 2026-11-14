/**
 * navConfig.js - Cấu hình Mega Menu 4 nhóm chính cho TechRecruit:
 * "Việc làm", "Tạo CV", "Công cụ", "Cẩm nang"
 * Giới hạn: < 200 dòng.
 */

export const NAV_MEGA_CONFIG = [
  {
    id: "jobs",
    label: "Việc làm",
    badge: null,
    columns: [
      {
        title: "CƠ HỘI NGHỀ NGHIỆP",
        items: [
          { label: "Tìm việc làm IT", path: "pages/jobs.html", icon: "search", desc: "Hơn 1,000+ tin tuyển dụng mới nhất" },
          { label: "Việc làm đã lưu", path: "pages/candidate/saved-jobs.html", icon: "bookmark", authRequired: true, desc: "Danh sách việc bạn đang quan tâm" },
          { label: "Việc đã ứng tuyển", path: "pages/candidate/applications.html", icon: "briefcase", authRequired: true, desc: "Theo dõi trạng thái và lịch phỏng vấn", badge: "Live" },
          { label: "Việc làm phù hợp", path: "pages/candidate/matched-jobs.html", icon: "target", authRequired: true, desc: "Gợi ý thông minh theo kỹ năng hồ sơ", badge: "AI" },
          { label: "Danh sách công ty", path: "pages/companies.html", icon: "building", desc: "Khám phá văn hóa & môi trường làm việc" },
        ]
      },
      {
        title: "THEO LĨNH VỰC",
        dynamicKey: "by_category",
        basePath: "pages/jobs.html?category=",
        icon: "tag"
      },
      {
        title: "THEO ĐỊA ĐIỂM",
        dynamicKey: "by_location",
        basePath: "pages/jobs.html?location=",
        icon: "map-pin"
      }
    ]
  },
  {
    id: "cv",
    label: "Tạo CV",
    badge: "Mới",
    columns: [
      {
        title: "QUẢN LÝ & MẪU CV",
        items: [
          { label: "Mẫu CV theo phong cách", path: "pages/cv-templates.html", icon: "file-text", desc: "4 phong cách thiết kế chuẩn ATS" },
          { label: "Quản lý CV đã tạo", path: "pages/candidate/cv-manage.html", icon: "folder", authRequired: true, desc: "Chỉnh sửa, tải xuống bản PDF" },
          { label: "Tải CV lên (PDF/DOCX)", path: "pages/candidate/cv-upload.html", icon: "upload-cloud", authRequired: true, desc: "Ứng tuyển nhanh chóng không cần gõ lại" },
          { label: "Hướng dẫn viết CV chuẩn", path: "pages/cv-guide.html", icon: "book-open", desc: "Bí quyết gây ấn tượng với nhà tuyển dụng" },
        ]
      },
      {
        title: "THƯ GIỚI THIỆU (COVER LETTER)",
        items: [
          { label: "Quản lý Cover Letter", path: "pages/candidate/cover-letters.html", icon: "mail", authRequired: true, desc: "Tạo, sửa thư ứng tuyển cá nhân" },
          { label: "Mẫu Cover Letter theo ngành", path: "pages/cover-letter-templates.html", icon: "copy", desc: "Kho mẫu chuyên nghiệp điền sẵn biến", badge: "Hot" },
        ]
      }
    ]
  },
  {
    id: "tools",
    label: "Công cụ",
    badge: null,
    columns: [
      {
        title: "TÍNH TOÁN LƯƠNG & BẢO HIỂM",
        items: [
          { label: "Tính lương Gross - Net", path: "pages/tools/gross-net.html", icon: "calculator", desc: "Chuẩn quy định mới nhất 2024 - 2026", badge: "Phổ biến" },
          { label: "Tính Thuế TNCN chi tiết", path: "pages/tools/tax.html", icon: "percent", desc: "Bảng phân tích lũy tiến từng bậc thuế" },
          { label: "Bảo hiểm thất nghiệp", path: "pages/tools/unemployment-insurance.html", icon: "shield", desc: "Dự toán mức hưởng & số tháng nhận" },
          { label: "Bảo hiểm xã hội 1 lần", path: "pages/tools/one-time-social-insurance.html", icon: "clock", desc: "Quy đổi thời gian đóng bảo hiểm" },
        ]
      },
      {
        title: "TÀI CHÍNH & PHÁT TRIỂN",
        items: [
          { label: "Tính Lãi kép tích lũy", path: "pages/tools/compound-interest.html", icon: "trending-up", desc: "Kế hoạch đầu tư & tăng trưởng vốn" },
          { label: "Kế hoạch tiết kiệm", path: "pages/tools/savings-plan.html", icon: "piggy-bank", desc: "Tính số tiền cần góp hàng tháng" },
          { label: "Tra cứu mức lương IT", path: "pages/tools/salary-lookup.html", icon: "bar-chart", desc: "Thống kê mức lương thật theo vị trí" },
          { label: "Câu hỏi phỏng vấn IT", path: "pages/interview-questions.html", icon: "help-circle", desc: "Ngân hàng câu hỏi & gợi ý câu trả lời", badge: "Hay" },
          { label: "Trắc nghiệm tính cách", path: "pages/personality-test.html", icon: "user-check", desc: "Định hướng phong cách làm việc" },
        ]
      }
    ]
  },
  {
    id: "handbook",
    label: "Cẩm nang",
    badge: null,
    columns: [
      {
        title: "CẨM NANG NGHỀ NGHIỆP",
        items: [
          { label: "Báo cáo thị trường IT", path: "pages/thi-truong.html", icon: "pie-chart", desc: "Xu hướng tuyển dụng & công nghệ 2026" },
          { label: "Kinh nghiệm ứng tuyển", path: "pages/placeholder.html?feature=interview-tips", icon: "lightbulb", desc: "Kỹ năng đàm phán lương và trả lời HR" },
          { label: "Lộ trình sự nghiệp IT", path: "pages/placeholder.html?feature=career-roadmap", icon: "compass", desc: "Từ Junior lên Senior & Tech Lead" },
        ]
      }
    ]
  }
];
