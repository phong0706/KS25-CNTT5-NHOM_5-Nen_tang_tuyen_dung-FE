/**
 * employer-dashboard.js - Recruiter / Employer Dashboard.
 * 100% dữ liệu thật từ API: /companies/my-company, /employer/jobs, /employer/applications, /employer/interviews.
 * Giới hạn: <= 100 dòng, tuân thủ techrecruit-rules.
 */
(async function initEmployerDashboard() {
  if (window.Auth && !window.Auth.requireAuth({ roles: ["recruiter", "employer"] })) return;

  const titleEl = document.getElementById("employer-welcome-title");
  const statusEl = document.getElementById("employer-company-status");
  const kpiJobs = document.getElementById("emp-kpi-jobs");
  const kpiJobsSub = document.getElementById("emp-kpi-jobs-sub");
  const kpiApps = document.getElementById("emp-kpi-apps");
  const kpiAppsSub = document.getElementById("emp-kpi-apps-sub");
  const kpiIvs = document.getElementById("emp-kpi-interviews");
  const kpiIvsSub = document.getElementById("emp-kpi-interviews-sub");

  const user = window.Auth ? window.Auth.getUser() : null;
  if (user?.full_name && titleEl) {
    titleEl.textContent = `Chào mừng trở lại, ${user.full_name}!`;
  }

  // 1. Tải thông tin công ty
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

  // 2. Tải số liệu KPIs thật từ hệ thống
  try {
    const [jobsRes, appsRes, ivsRes] = await Promise.all([
      window.api.get("/employer/jobs?page_size=1").catch(() => null),
      window.api.get("/employer/applications?page_size=1").catch(() => null),
      window.api.get("/employer/interviews").catch(() => null),
    ]);

    if (jobsRes && kpiJobs) {
      const totalJobs = jobsRes.pagination?.total_items ?? jobsRes.total ?? 0;
      kpiJobs.textContent = totalJobs;
      if (kpiJobsSub) kpiJobsSub.textContent = totalJobs > 0 ? "● Đang hiển thị trực tuyến" : "Chưa có tin đăng nào";
    } else if (kpiJobs) {
      kpiJobs.textContent = "0";
      if (kpiJobsSub) kpiJobsSub.textContent = "Chưa có tin tuyển dụng";
    }

    if (appsRes && kpiApps) {
      const totalApps = appsRes.total || 0;
      kpiApps.textContent = totalApps;
      const unviewed = appsRes.unviewed_count || (appsRes.items || []).filter((a) => !a.is_viewed).length;
      if (kpiAppsSub) kpiAppsSub.textContent = unviewed > 0 ? `${unviewed} hồ sơ chưa xem` : "Tất cả hồ sơ đã xem";
    } else if (kpiApps) {
      kpiApps.textContent = "0";
      if (kpiAppsSub) kpiAppsSub.textContent = "Chưa có hồ sơ ứng tuyển";
    }

    if (ivsRes && kpiIvs) {
      const scheduledList = Array.isArray(ivsRes) ? ivsRes.filter((i) => i.status === "scheduled") : [];
      kpiIvs.textContent = scheduledList.length;
      if (kpiIvsSub) kpiIvsSub.textContent = scheduledList.length > 0 ? `${scheduledList.length} lịch đã lên hẹn` : "Chưa có lịch hẹn phỏng vấn";
    } else if (kpiIvs) {
      kpiIvs.textContent = "0";
      if (kpiIvsSub) kpiIvsSub.textContent = "Chưa có lịch phỏng vấn";
    }
  } catch (err) {
    if (kpiJobsSub) kpiJobsSub.textContent = "Không thể tải số liệu";
    if (kpiAppsSub) kpiAppsSub.textContent = "Không thể tải số liệu";
    if (kpiIvsSub) kpiIvsSub.textContent = "Không thể tải số liệu";
  }
})();
