/**
 * featureHighlights.js - Dữ liệu điểm nhấn và lộ trình cho các tính năng sắp ra mắt
 * Giới hạn: < 200 dòng.
 */

export const FEATURE_HIGHLIGHTS = {
  "compound-interest": {
    tagline: "Mô phỏng sức mạnh lãi kép & hoạch định tự do tài chính (FIRE)",
    progress: 88,
    eta: "Dự kiến: Tháng 04/2026",
    highlights: [
      { icon: "trending-up", title: "Lãi suất & Lạm phát thực", desc: "Mô phỏng tăng trưởng theo tháng/năm, tự động khấu trừ tỷ lệ lạm phát thực tế." },
      { icon: "target", title: "Mục tiêu tự do FIRE", desc: "Xác định chính xác số tiền cần tích lũy và số năm đạt tự do tài chính theo thu nhập." },
      { icon: "bar-chart-2", title: "Biểu đồ trực quan hóa", desc: "Xem sự phân bổ giữa tiền gốc đóng góp và tiền lãi tích lũy qua từng cột mốc." },
    ],
  },
  "tax": {
    tagline: "Tính thuế TNCN chính xác theo biểu thuế lũy tiến từng phần 2026",
    progress: 90,
    eta: "Dự kiến: Tháng 04/2026",
    highlights: [
      { icon: "percent", title: "Biểu thuế 7 bậc mới nhất", desc: "Áp dụng đầy đủ mức giảm trừ gia cảnh bản thân và người phụ thuộc chuẩn quy định." },
      { icon: "file-text", title: "Bóc tách chi tiết từng khoản", desc: "Minh bạch từng bậc thuế, các khoản miễn trừ BHXH, bảo hiểm bắt buộc và quỹ tự nguyện." },
      { icon: "shield", title: "Gợi ý tối ưu thuế hợp pháp", desc: "Mẹo khai báo giảm trừ và các khoản hỗ trợ không chịu thuế cho nhân sự ngành công nghệ." },
    ],
  },
  "personality-test": {
    tagline: "Trắc nghiệm 16 nhóm tính cách & định hướng văn hóa làm việc IT",
    progress: 82,
    eta: "Dự kiến: Tháng 05/2026",
    highlights: [
      { icon: "user-check", title: "Bộ câu hỏi chuẩn hóa IT", desc: "Thiết kế riêng cho kỹ sư phần mềm, PM, Designer và các vai trò Tech hiện đại." },
      { icon: "compass", title: "Định vị phong cách làm việc", desc: "Thấu hiểu thiên hướng giao tiếp, giải quyết vấn đề và cách làm việc nhóm tối ưu." },
      { icon: "briefcase", title: "Gợi ý môi trường phù hợp", desc: "Khuyến nghị loại hình doanh nghiệp (Product, Outsourcing, Startup) ăn khớp với bạn." },
    ],
  },
  "unemployment-insurance": {
    tagline: "Tra cứu trợ cấp thất nghiệp, thời hạn và quy trình nhận hỗ trợ",
    progress: 85,
    eta: "Dự kiến: Tháng 04/2026",
    highlights: [
      { icon: "shield", title: "Tính mức hưởng tối đa", desc: "Xác định 60% bình quân tiền lương 6 tháng liền kề và khống chế trần theo vùng." },
      { icon: "calendar", title: "Số tháng được chi trả", desc: "Quy đổi thâm niên đóng BHTN tương ứng chính xác số tháng hưởng trợ cấp thực tế." },
      { icon: "check-circle", title: "Checklist hồ sơ 1 chạm", desc: "Hướng dẫn thủ tục nộp online qua Cổng Dịch vụ công hoặc nộp trực tiếp tại Trung tâm." },
    ],
  },
  "one-time-social-insurance": {
    tagline: "Quy đổi thời gian đóng BHXH & tính số tiền nhận một lần",
    progress: 80,
    eta: "Dự kiến: Tháng 05/2026",
    highlights: [
      { icon: "clock", title: "Hệ số trượt giá cập nhật", desc: "Áp dụng bảng hệ số trượt giá mới nhất của Bộ LĐ-TB&XH theo từng giai đoạn đóng." },
      { icon: "dollar-sign", title: "Công thức trước & sau 2014", desc: "Phân tách rõ ràng 1.5 tháng lương (trước 2014) và 2 tháng lương (từ 2014 trở đi)." },
      { icon: "alert-triangle", title: "Cảnh báo quyền lợi lâu dài", desc: "So sánh trực quan giữa việc rút 1 lần với quyền lợi hưởng lương hưu và BHYT trọn đời." },
    ],
  },
  "cv-upload": {
    tagline: "Phân tích CV tự động bằng công nghệ ATS & trích xuất kỹ năng",
    progress: 86,
    eta: "Dự kiến: Tháng 04/2026",
    highlights: [
      { icon: "upload-cloud", title: "Tải file PDF / DOCX đa định dạng", desc: "Trích xuất hồ sơ chỉ trong 3 giây không làm mất cấu trúc nội dung gốc." },
      { icon: "target", title: "Chấm điểm độ khớp với JD", desc: "So khớp từ khóa kỹ năng với các vị trí tuyển dụng thực tế trên sàn." },
      { icon: "check", title: "Tự động điền hồ sơ TechRecruit", desc: "Đồng bộ kinh nghiệm, dự án và học vấn vào hồ sơ ứng viên nhanh chóng." },
    ],
  },
  "cv-guide": {
    tagline: "Cẩm nang viết CV chuẩn ATS cho kỹ sư & nhân sự ngành Tech",
    progress: 92,
    eta: "Dự kiến: Tháng 04/2026",
    highlights: [
      { icon: "book-open", title: "Cấu trúc chuẩn recruiter quốc tế", desc: "Bố cục khoa học giúp nhà tuyển dụng nắm bắt điểm sáng trong 6 giây đầu tiên." },
      { icon: "zap", title: "Công thức thành tựu XYZ / STAR", desc: "Cách viết số liệu minh chứng tác động thực tế thay vì liệt kê nhiệm vụ chung chung." },
      { icon: "tag", title: "Bộ từ khóa công nghệ đắt giá", desc: "Danh sách Action Verbs và kỹ năng được các hệ thống lọc tự động ưu tiên hàng đầu." },
    ],
  },
  "cover-letters": {
    tagline: "Soạn thảo, quản lý & tùy biến Cover Letter chuyên nghiệp",
    progress: 84,
    eta: "Dự kiến: Tháng 05/2026",
    highlights: [
      { icon: "mail", title: "Quản lý đa phiên bản", desc: "Lưu trữ và phân loại các bức thư ứng tuyển theo từng ngành hoặc công ty mục tiêu." },
      { icon: "edit-3", title: "Trình soạn thảo trực quan", desc: "Gợi ý câu mở đầu ấn tượng, đoạn kết kêu gọi phỏng vấn lịch thiệp và thuyết phục." },
      { icon: "printer", title: "Xuất file chuẩn gửi kèm CV", desc: "Tải bản PDF đẹp mắt, đồng bộ phong cách với bộ hồ sơ xin việc của bạn." },
    ],
  },
  "cover-letter-templates": {
    tagline: "Bộ sưu tập mẫu thư ứng tuyển chuyên biệt theo vị trí IT",
    progress: 87,
    eta: "Dự kiến: Tháng 05/2026",
    highlights: [
      { icon: "copy", title: "4 phong cách thiết kế", desc: "Mẫu Dành cho Fresher, Kỹ sư dày dạn, Vị trí Lead/Quản lý và Chuyển ngành." },
      { icon: "zap", title: "Tự động điền thông tin", desc: "Liên kết trực tiếp với dữ liệu hồ sơ để tạo bức thư hoàn chỉnh chỉ với 1 click." },
      { icon: "check-square", title: "Chuẩn văn phong doanh nghiệp", desc: "Ngôn từ trau chuốt, tự nhiên, thể hiện rõ động lực và sự chuyên nghiệp." },
    ],
  },
  "interview-tips": {
    tagline: "Chiến thuật phỏng vấn Tech & bí quyết đàm phán đãi ngộ đỉnh cao",
    progress: 89,
    eta: "Dự kiến: Tháng 04/2026",
    highlights: [
      { icon: "lightbulb", title: "Xử lý câu hỏi hóc búa", desc: "Chiến thuật trả lời System Design, Live Coding và câu hỏi văn hóa ứng xử Behavioral." },
      { icon: "dollar-sign", title: "Nghệ thuật thương lượng lương", desc: "Cách deal package hấp dẫn (Base, Bonus, ESOP) mà vẫn giữ thiện cảm tốt nhất." },
      { icon: "check-circle", title: "Checklist 24h trước phỏng vấn", desc: "Bộ câu hỏi chất lượng để hỏi ngược lại công ty nhằm đánh giá văn hóa tổ chức." },
    ],
  },
  "career-roadmap": {
    tagline: "Bản đồ lộ trình thăng tiến từ Intern lên Tech Lead & Principal",
    progress: 83,
    eta: "Dự kiến: Tháng 05/2026",
    highlights: [
      { icon: "compass", title: "Ma trận kỹ năng theo cấp bậc", desc: "Yêu cầu chi tiết về Hard Skills, Soft Skills và tầm ảnh hưởng cho từng bậc." },
      { icon: "layers", title: "Phân nhánh chuyên sâu", desc: "Lộ trình rõ ràng cho Software Engineer, DevOps/SRE, Data/AI và Management Track." },
      { icon: "award", title: "Khuyến nghị chứng chỉ giá trị", desc: "Bộ chứng chỉ quốc tế uy tín (AWS, GCP, CKA, PMP) thúc đẩy bước tiến sự nghiệp." },
    ],
  },
  "matched-jobs": {
    tagline: "Thuật toán gợi ý việc làm thông minh theo hồ sơ năng lực 4 chiều",
    progress: 91,
    eta: "Dự kiến: Tháng 04/2026",
    highlights: [
      { icon: "target", title: "Độ khớp kỹ năng 60%", desc: "So khớp chính xác công nghệ cốt lõi bạn thành thạo với yêu cầu thực tế từ nhà tuyển dụng." },
      { icon: "percent", title: "Cân đối cấp bậc & lương", desc: "Lọc tự động theo mức lương kỳ vọng và văn hóa làm việc (Remote, Onsite, Hybrid)." },
      { icon: "zap", title: "Thông báo việc mới tức thì", desc: "Cập nhật các cơ hội tuyển dụng nóng hổi ngay khi nhà tuyển dụng vừa đăng bài." },
    ],
  },
};

export const DEFAULT_HIGHLIGHT = {
  tagline: "Tính năng cao cấp đang được đội ngũ kỹ sư TechRecruit dồn lực hoàn thiện",
  progress: 85,
  eta: "Dự kiến ra mắt: Quý 2/2026",
  highlights: [
    { icon: "zap", title: "Tối ưu hóa trải nghiệm", desc: "Giao diện hiện đại, tốc độ phản hồi tức thì và tương thích hoàn hảo mọi thiết bị." },
    { icon: "shield", title: "Dữ liệu chuẩn xác 100%", desc: "Dựa trên thuật toán tính toán nghiêm ngặt và quy chuẩn pháp lý hiện hành." },
    { icon: "star", title: "Đặc quyền người dùng sớm", desc: "Trải nghiệm trọn vẹn mọi tính năng nâng cao không giới hạn khi ra mắt chính thức." },
  ],
};
