/**
 * Logic cho trang Recruiter / Employer Dashboard (Vanilla JS thuần).
 * Lấy thông tin công ty liên kết của nhà tuyển dụng từ API /companies/my-company.
 */
(async function initEmployerDashboard() {
  const titleEl = document.getElementById("employer-welcome-title");
  const statusEl = document.getElementById("employer-company-status");
  if (!titleEl || !statusEl) return;

  const user = window.Auth ? window.Auth.getUser() : null;
  if (user && user.full_name) {
    titleEl.textContent = `Chào mừng trở lại, ${user.full_name}!`;
  }

  try {
    const company = await window.api.get("/companies/my-company");
    const badgeText = company.is_draft
      ? "Hồ sơ doanh nghiệp đang chờ phê duyệt"
      : "Doanh nghiệp đã được phê duyệt";
    statusEl.textContent = `Doanh nghiệp: ${company.name} · ${badgeText}`;
  } catch (err) {
    if (err && err.status === 404) {
      statusEl.textContent = "Tài khoản chưa liên kết hồ sơ công ty. Hãy cập nhật thông tin doanh nghiệp để đăng tin.";
    } else {
      statusEl.textContent = "Quản lý tin tuyển dụng và hồ sơ ứng viên của doanh nghiệp bạn.";
    }
  }
})();

