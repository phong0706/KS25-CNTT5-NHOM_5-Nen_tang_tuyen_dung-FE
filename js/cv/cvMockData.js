/**
 * Dữ liệu mẫu minh họa chuẩn cho ứng viên IT tiếng Việt.
 * Dùng khi người dùng chưa đăng nhập hoặc tạo CV mới tinh.
 */
export const DEMO_CV_DATA = {
  full_name: "Nguyễn Thành Long",
  headline: "Kỹ sư Phát triển Frontend (React / Vue / TypeScript)",
  email: "thanhlong.dev@gmail.com",
  phone: "0987 654 321",
  location: "Cầu Giấy, Hà Nội",
  linkedin_url: "https://linkedin.com/in/thanhlong-dev",
  github_url: "https://github.com/thanhlong-tech",
  portfolio_url: "https://thanhlong.dev",
  bio: "Lập trình viên Frontend với hơn 4 năm kinh nghiệm xây dựng ứng dụng web quy mô lớn bằng React, TypeScript và Next.js. Đam mê tối ưu hóa hiệu năng trải nghiệm người dùng (Core Web Vitals), thiết kế Design System nhất quán và tuân thủ các tiêu chuẩn trợ năng WCAG. Khả năng làm việc nhóm tốt, tư duy phản biện và sẵn sàng tiếp cận công nghệ mới.",
  skills: [
    "JavaScript (ES6+)",
    "TypeScript",
    "React.js",
    "Next.js",
    "Vue.js",
    "HTML5/CSS3/Sass",
    "Tailwind CSS",
    "Redux Toolkit / Zustand",
    "RESTful API & GraphQL",
    "Jest & Playwright",
    "Git & CI/CD GitHub Actions",
    "Webpack / Vite"
  ],
  experiences: [
    {
      title: "Senior Frontend Engineer",
      company: "Công ty Cổ phần Công nghệ Rikkei Digital",
      start_month: "2023-03",
      end_month: "",
      is_current: true,
      description: "- Chủ trì kiến trúc giao diện cho nền tảng thương mại điện tử phục vụ hơn 500.000 người dùng hoạt động hàng tháng.\n- Tái cấu trúc codebase từ JavaScript sang TypeScript, giảm 35% lỗi runtime trong quá trình phát hành.\n- Tối ưu chỉ số Core Web Vitals (LCP giảm từ 3.2s xuống 1.4s, điểm Lighthouse đạt 95+).\n- Hướng dẫn và đào tạo 4 lập trình viên junior trong nhóm áp dụng Clean Code và Unit Test."
    },
    {
      title: "Frontend Developer",
      company: "VNPAY Solution JSC",
      start_month: "2021-01",
      end_month: "2023-02",
      is_current: false,
      description: "- Phát triển các module thanh toán trực tuyến và ví điện tử tích hợp vào ứng dụng ngân hàng số.\n- Xây dựng thư viện component UI dùng chung theo chuẩn Design System, tăng 40% tốc độ dựng giao diện cho các sprint tính năng.\n- Phối hợp chặt chẽ với Backend Team thiết kế API hợp đồng (OpenAPI/Swagger) và xử lý luồng bảo mật thanh toán."
    },
    {
      title: "Junior Web Developer",
      company: "FPT Software Hà Nội",
      start_month: "2019-09",
      end_month: "2020-12",
      is_current: false,
      description: "- Tham gia phát triển hệ thống quản lý nhân sự nội bộ (HRM) cho khách hàng Nhật Bản.\n- Viết tài liệu kỹ thuật, unit test và fix bug giao diện đa trình duyệt (Chrome, Safari, Firefox, Edge)."
    }
  ],
  educations: [
    {
      school: "Đại học Bách Khoa Hà Nội",
      major: "Công nghệ Thông tin (Chương trình Tiên tiến)",
      degree: "Kỹ sư",
      start_year: "2015",
      end_year: "2020",
      description: "Tốt nghiệp loại Giỏi (GPA 3.45/4.0). Đạt học bổng khuyến khích học tập 3 kỳ liên tiếp. Giải Ba cuộc thi Sáng tạo Công nghệ Sinh viên năm 2019."
    }
  ]
};

/**
 * Chuẩn hoá dữ liệu CV từ API profile hoặc document
 */
export function normalizeCvData(raw) {
  if (!raw) return JSON.parse(JSON.stringify(DEMO_CV_DATA));
  return {
    full_name: raw.full_name || raw.name || "",
    headline: raw.headline || raw.title || "",
    email: raw.email || "",
    phone: raw.phone || "",
    location: raw.location || "",
    linkedin_url: raw.linkedin_url || "",
    github_url: raw.github_url || "",
    portfolio_url: raw.portfolio_url || "",
    bio: raw.bio || raw.summary || "",
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    experiences: Array.isArray(raw.experiences) ? raw.experiences : [],
    educations: Array.isArray(raw.educations) ? raw.educations : [],
  };
}
