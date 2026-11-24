/**
 * employer-dashboard.js - Tổng quan tuyển dụng (100% dữ liệu thật từ GET /api/employer/dashboard).
 * Giới hạn: <= 145 dòng, tuân thủ techrecruit-rules (không chuỗi số liệu tĩnh, textContent chống XSS).
 */
(function initEmployerDashboard() {
  if (window.Auth && !window.Auth.requireAuth({ roles: ["recruiter", "employer"] })) return;

  const REVIEW_STATUS_LABELS = {
    da_xac_minh: "Doanh nghiệp đã được xác minh",
    cho_duyet: "Hồ sơ xác minh đang chờ duyệt",
    tu_choi: "Hồ sơ xác minh bị từ chối",
    thu_hoi: "Xác minh doanh nghiệp đã bị thu hồi",
    chua_xac_minh: "Doanh nghiệp chưa xác minh pháp nhân",
  };

  const el = {
    title: document.getElementById("employer-welcome-title"),
    status: document.getElementById("employer-company-status"),
    alertBox: document.getElementById("emp-dash-alert"),
    alertMsg: document.getElementById("emp-dash-alert-msg"),
    settingsLink: document.getElementById("emp-dash-settings-link"),
    retryBtn: document.getElementById("emp-dash-retry-btn"),
    jobs: document.getElementById("emp-kpi-jobs"),
    jobsSub: document.getElementById("emp-kpi-jobs-sub"),
    apps: document.getElementById("emp-kpi-apps"),
    appsSub: document.getElementById("emp-kpi-apps-sub"),
    ivs: document.getElementById("emp-kpi-interviews"),
    ivsSub: document.getElementById("emp-kpi-interviews-sub"),
  };

  const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");
  let loading = false;

  function formatNearestInterview(nearest, serverTimeIso) {
    if (!nearest || !nearest.scheduled_at) return "Chưa có lịch hẹn sắp tới";
    const dt = new Date(nearest.scheduled_at);
    const ref = serverTimeIso ? new Date(serverTimeIso) : new Date();
    if (Number.isNaN(dt.getTime())) return nearest.candidate_name || "Lịch hẹn sắp tới";
    const sameDay =
      dt.getFullYear() === ref.getFullYear() &&
      dt.getMonth() === ref.getMonth() &&
      dt.getDate() === ref.getDate();
    const hm = dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const dayPrefix = sameDay ? "Hôm nay" : dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    return `${dayPrefix} ${hm}, ${nearest.candidate_name || "Ứng viên"}`;
  }

  function showError(msg, showSettings = false) {
    if (!el.alertBox || !el.alertMsg) return;
    el.alertMsg.textContent = msg;
    el.alertBox.hidden = false;
    el.alertBox.style.display = "flex";
    if (el.settingsLink) el.settingsLink.hidden = !showSettings;
  }

  function hideError() {
    if (!el.alertBox) return;
    el.alertBox.hidden = true;
    el.alertBox.style.display = "none";
  }

  function renderDashboard(data) {
    hideError();
    const comp = data.company || {};
    const reviewLabel = REVIEW_STATUS_LABELS[comp.review_status] || comp.review_status || "";
    if (el.status) {
      el.status.textContent = comp.name ? `${comp.name} · ${reviewLabel}` : reviewLabel;
    }

    const openN = Number(data.open_jobs || 0);
    const pendN = Number(data.pending_jobs || 0) + Number(data.reverify_pending_jobs || 0);
    const draftN = Number(data.draft_jobs || 0);
    if (el.jobs) el.jobs.textContent = fmtNum(openN);
    if (el.jobsSub) {
      el.jobsSub.textContent = (openN + pendN + draftN) > 0
        ? `${fmtNum(openN)} đang tuyển, ${fmtNum(pendN)} chờ duyệt, ${fmtNum(draftN)} nháp`
        : "Chưa có tin nào — bấm để tạo tin mới";
    }

    const appsTotal = Number(data.applications_total || 0);
    const appsUnseen = Number(data.applications_unseen || 0);
    if (el.apps) el.apps.textContent = fmtNum(appsTotal);
    if (el.appsSub) {
      if (appsTotal === 0) el.appsSub.textContent = "Chưa có hồ sơ nào — xem danh sách ứng viên";
      else el.appsSub.textContent = appsUnseen > 0 ? `${fmtNum(appsUnseen)} mới chưa xem` : "Tất cả hồ sơ đã xem";
    }

    const ivCount = Number(data.interviews_upcoming?.count || 0);
    const nearest = data.interviews_upcoming?.nearest || null;
    if (el.ivs) el.ivs.textContent = fmtNum(ivCount);
    if (el.ivsSub) {
      el.ivsSub.textContent = ivCount > 0
        ? formatNearestInterview(nearest, data.server_time)
        : "Chưa có lịch hẹn sắp tới — quản lý lịch phỏng vấn";
    }
  }

  async function loadDashboard() {
    if (loading) return;
    loading = true;
    const user = window.Auth ? window.Auth.getUser() : null;
    if (user?.full_name && el.title) {
      el.title.textContent = `Xin chào, ${user.full_name}`;
    }

    try {
      const data = await window.api.get("/employer/dashboard");
      renderDashboard(data);
    } catch (err) {
      const detail = err?.data?.detail;
      const msg = (typeof detail === "object" ? detail?.message : detail) || err?.message || "Không thể tải dữ liệu tổng quan tuyển dụng.";
      const isScope409 = err?.status === 409;
      showError(msg, isScope409);
      if (el.status && isScope409) el.status.textContent = msg;
      if (el.jobs) el.jobs.textContent = "0";
      if (el.apps) el.apps.textContent = "0";
      if (el.ivs) el.ivs.textContent = "0";
      if (el.jobsSub) el.jobsSub.textContent = isScope409 ? "Cập nhật doanh nghiệp để xem tin" : "Lỗi tải dữ liệu";
      if (el.appsSub) el.appsSub.textContent = isScope409 ? "Cập nhật doanh nghiệp để xem hồ sơ" : "Lỗi tải dữ liệu";
      if (el.ivsSub) el.ivsSub.textContent = isScope409 ? "Cập nhật doanh nghiệp để xem lịch" : "Lỗi tải dữ liệu";
    } finally {
      loading = false;
    }
  }

  el.retryBtn?.addEventListener("click", loadDashboard);
  window.addEventListener("focus", loadDashboard);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") loadDashboard();
  });
  window.addEventListener("techrecruit:new_application", loadDashboard);
  window.addEventListener("techrecruit:notification", loadDashboard);

  loadDashboard();
})();
