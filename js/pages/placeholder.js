/**
 * placeholder.js - Trình điều khiển trang khung "Đang phát triển"
 * Giới hạn: < 200 dòng.
 */

document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("placeholder-feature-name");
  const urlParams = new URLSearchParams(window.location.search);
  const feature = urlParams.get("feature");

  const titleMap = {
    "saved-jobs": "Việc làm đã lưu",
    "matched-jobs": "Việc làm phù hợp",
    "cv-manage": "Quản lý CV",
    "cv-upload": "Tải CV lên hệ thống",
    "cv-templates": "Mẫu CV theo phong cách",
    "cv-guide": "Hướng dẫn viết CV chuẩn",
    "cover-letters": "Quản lý Cover Letter",
    "cover-letter-templates": "Mẫu Cover Letter theo ngành",
    "salary-lookup": "Tra cứu mức lương IT",
    "personality-test": "Trắc nghiệm tính cách",
    "tax": "Tính thuế Thu nhập Cá nhân",
    "unemployment-insurance": "Bảo hiểm thất nghiệp",
    "one-time-social-insurance": "Bảo hiểm xã hội 1 lần",
    "compound-interest": "Tính Lãi kép tích lũy",
    "savings-plan": "Kế hoạch tiết kiệm mục tiêu",
    "companies": "Khám phá danh sách công ty IT",
    "interview-tips": "Kinh nghiệm ứng tuyển",
    "career-roadmap": "Lộ trình sự nghiệp IT",
  };

  const featureName = (feature && titleMap[feature]) || document.title.split("|")[0].trim() || "Tính năng";
  if (titleEl) titleEl.textContent = featureName;
  document.title = `${featureName} | TechRecruit`;
});
