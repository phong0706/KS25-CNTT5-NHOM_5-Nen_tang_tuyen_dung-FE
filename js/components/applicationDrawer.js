/**
 * applicationDrawer.js - Drawer trượt bên phải hiển thị chi tiết hồ sơ (WAI-ARIA).
 * Mobile: Toàn màn hình. Giới hạn: < 200 dòng.
 */
import { renderStatusTimeline } from "./statusTimeline.js";
import { getCompanyLogo, formatSalary } from "./jobCard.js";
import { openWithdrawModal } from "./withdrawModal.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

function formatInterviewTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
}

export function openApplicationDrawer(app, { metaStatuses, triggerBtn, onUpdated } = {}) {
  const returnFocus = triggerBtn || document.activeElement;
  const backdrop = document.createElement("div");
  backdrop.className = "app-drawer-backdrop";
  const titleId = `drawer-title-${app.id}`;

  const job = app.job || {};
  const iv = app.interview;
  const canWithdraw = Array.isArray(app.allowed_actions) && app.allowed_actions.some((a) => a.key === "withdraw");
  const token = localStorage.getItem("auth_token") || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  const cvUrl = app.cv_id ? `${base}/candidate/cvs/${app.cv_id}/file?token=${encodeURIComponent(token)}` : "#";

  backdrop.innerHTML = `
    <div class="app-drawer-dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      <div class="app-drawer-header">
        <div class="app-drawer-heading-wrap">
          <span class="app-drawer-tag">Chi tiết hồ sơ ứng tuyển</span>
          <h2 id="${titleId}" class="app-drawer-title">${esc(job.title)}</h2>
        </div>
        <button type="button" class="app-drawer-close" aria-label="Đóng bảng chi tiết">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="app-drawer-body">
        <div class="drawer-section drawer-job-card">
          ${getCompanyLogo(job.company_name, "cv-logo-48")}
          <div class="drawer-job-info">
            <div class="drawer-company-name">${esc(job.company_name || "Công ty")}</div>
            <div class="drawer-meta-line">
              <span>${esc(job.location || "Toàn quốc")}</span><span class="meta-dot">·</span>
              <span class="drawer-salary">${esc(formatSalary(job))}</span>
            </div>
            <a href="../jobs.html?q=${encodeURIComponent(job.title || "")}" class="drawer-link-job" target="_blank" rel="noopener">
              <span>Xem trang tin tuyển dụng</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>

        ${iv ? `
          <div class="drawer-section drawer-interview-card">
            <div class="drawer-interview-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Lịch phỏng vấn đã xếp</span>
            </div>
            <div class="drawer-interview-row"><strong>Thời gian:</strong> <span>${formatInterviewTime(iv.interview_at)}</span></div>
            <div class="drawer-interview-row"><strong>Hình thức:</strong> <span>${esc(iv.interview_mode || "Trực tuyến")}</span></div>
            ${iv.interview_location ? `<div class="drawer-interview-row"><strong>Địa điểm / Link:</strong> <span class="drawer-interview-loc">${esc(iv.interview_location)}</span></div>` : ""}
          </div>
        ` : ""}

        <div class="drawer-section">
          <h3 class="drawer-sec-title">Tiến trình xét duyệt</h3>
          <div class="drawer-timeline-host">
            ${renderStatusTimeline(app.history || [], metaStatuses || [], app.status)}
          </div>
        </div>

        <div class="drawer-section">
          <h3 class="drawer-sec-title">CV đã sử dụng</h3>
          <div class="drawer-cv-row">
            <span class="drawer-cv-name">${esc(app.cv_name)}</span>
            ${app.cv_id ? `
              <a href="${cvUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline drawer-btn-cv">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>Xem CV</span>
              </a>
            ` : ""}
          </div>
        </div>

        ${app.cover_letter ? `
          <div class="drawer-section">
            <h3 class="drawer-sec-title">Thư giới thiệu đã gửi</h3>
            <div class="drawer-cover-letter-box">${esc(app.cover_letter)}</div>
          </div>
        ` : ""}
      </div>

      <div class="app-drawer-footer">
        ${canWithdraw ? `
          <button type="button" class="btn btn-outline-danger drawer-btn-withdraw">
            Rút hồ sơ
          </button>
        ` : `<span class="text-muted" style="font-size:0.8125rem;">Hồ sơ đã ở trạng thái hoàn tất</span>`}
        <button type="button" class="btn btn-outline drawer-btn-close">Đóng</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");

  const closeBtn = backdrop.querySelector(".app-drawer-close");
  const bottomCloseBtn = backdrop.querySelector(".drawer-btn-close");
  const withdrawBtn = backdrop.querySelector(".drawer-btn-withdraw");

  const closeDrawer = () => {
    document.removeEventListener("keydown", handleKeydown, true);
    backdrop.remove();
    document.body.classList.remove("modal-open");
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
  };

  const handleKeydown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeDrawer(); return; }
    if (e.key === "Tab") {
      const focusables = backdrop.querySelectorAll('button:not([disabled]), [tabindex="0"], a[href]');
      if (!focusables.length) return;
      const [first, last] = [focusables[0], focusables[focusables.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", handleKeydown, true);

  closeBtn.addEventListener("click", closeDrawer);
  bottomCloseBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeDrawer(); });

  withdrawBtn?.addEventListener("click", () => {
    openWithdrawModal({
      app,
      triggerBtn: withdrawBtn,
      onSuccess: () => {
        closeDrawer();
        onUpdated?.();
      },
    });
  });

  window.setTimeout(() => closeBtn.focus(), 60);
}

