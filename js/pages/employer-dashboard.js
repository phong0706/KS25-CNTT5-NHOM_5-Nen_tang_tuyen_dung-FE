/**
 * employer-dashboard.js - Recruiter / Employer Dashboard.
 * Dữ liệu dashboard từ /employer/dashboard/stats.
 */
(async function initEmployerDashboard() {
  if (window.Auth && !window.Auth.requireAuth({ roles: ["recruiter", "employer"] })) return;

  const titleEl = document.getElementById("employer-welcome-title");
  const statusEl = document.getElementById("employer-company-status");
  const fromInput = document.getElementById("emp-stats-from");
  const toInput = document.getElementById("emp-stats-to");
  const messageEl = document.getElementById("emp-stats-message");

  const user = window.Auth ? window.Auth.getUser() : null;
  if (user?.full_name && titleEl) {
    titleEl.textContent = `Chào mừng trở lại, ${user.full_name}!`;
  }

  try {
    const company = await window.api.get("/companies/my-company");
    const badgeText = company.is_draft ? "Hồ sơ doanh nghiệp đang chờ phê duyệt" : "Doanh nghiệp đã được phê duyệt";
    if (statusEl) statusEl.textContent = `Doanh nghiệp: ${company.name} · ${badgeText}`;
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = err?.status === 404
        ? "Tài khoản chưa liên kết hồ sơ công ty. Hãy cập nhật thông tin doanh nghiệp để đăng tin."
        : "Quản lý tin tuyển dụng và hồ sơ ứng viên của doanh nghiệp bạn.";
    }
  }

  const dateValue = (value) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 29);
  fromInput.value = dateValue(monthAgo);
  toInput.value = dateValue(today);

  const statusLabels = {
    submitted: "Đã nộp",
    reviewing: "Đang xem xét",
    interview: "Phỏng vấn",
    offered: "Đã nhận offer",
    rejected: "Từ chối",
    withdrawn: "Đã rút",
  };
  let latestRequest = 0;
  async function loadStats() {
    const requestId = ++latestRequest;
    const params = {};
    if (fromInput.value) params.from_date = fromInput.value;
    if (toInput.value) params.to_date = toInput.value;
    messageEl.textContent = "Đang tải thống kê...";
    try {
      const stats = await window.api.get("/employer/dashboard/stats", params);
      if (requestId !== latestRequest) return;
      document.getElementById("emp-kpi-jobs").textContent = stats.total_jobs;
      document.getElementById("emp-kpi-jobs-sub").textContent =
        `${stats.active_jobs} đang tuyển · ${stats.draft_jobs} nháp · ${stats.closed_jobs} đã đóng`;
      document.getElementById("emp-kpi-apps").textContent = stats.total_applications;
      document.getElementById("emp-kpi-apps-sub").textContent =
        `${stats.unviewed_applications} chưa xem trong khoảng lọc`;
      document.getElementById("emp-kpi-interviews").textContent = stats.upcoming_interviews;
      document.getElementById("emp-kpi-interviews-sub").textContent = "Lịch sắp tới trong khoảng lọc";
      document.getElementById("emp-kpi-views").textContent = Number(stats.total_views).toLocaleString("vi-VN");
      document.getElementById("emp-kpi-hiring-rate").textContent = `${stats.hiring_rate}%`;
      const breakdown = document.getElementById("emp-applications-by-status");
      breakdown.innerHTML = "";
      Object.entries(stats.applications_by_status || {}).forEach(([status, count]) => {
        const item = document.createElement("li");
        item.textContent = `${statusLabels[status] || "Khác"}: ${count}`;
        breakdown.appendChild(item);
      });
      if (!breakdown.children.length) {
        const empty = document.createElement("li");
        empty.textContent = "Chưa có hồ sơ trong khoảng thời gian này.";
        breakdown.appendChild(empty);
      }
      document.getElementById("emp-kpi-jobs-sub").textContent +=
        ` · ${stats.period_jobs_created} tin tạo trong khoảng lọc`;
      messageEl.textContent = "Số tin và lượt xem là số liệu hiện tại/tích lũy; hồ sơ và số tin mới áp dụng khoảng ngày đã chọn. Lịch phỏng vấn đếm các lịch sắp tới.";
    } catch (err) {
      if (requestId === latestRequest) {
        messageEl.textContent = err?.message || "Không thể tải thống kê.";
      }
    }
  }

  document.getElementById("emp-stats-apply").addEventListener("click", loadStats);
  document.getElementById("emp-stats-clear").addEventListener("click", () => {
    fromInput.value = "";
    toInput.value = "";
    loadStats();
  });
  loadStats();
})();
