/**
 * Component hiển thị từng hàng tin tuyển dụng (và skeleton khi tải).
 * Dữ liệu động từ API; không chứa số liệu mẫu hoặc lượt xem không theo dõi.
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function formatDateVN(value) {
  if (!value) return "Chưa đặt";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Chưa đặt";
  return d.toLocaleDateString("vi-VN");
}

function getToneIcon(tone) {
  if (tone === "success") {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  }
  if (tone === "warning") {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 14"></polyline></svg>`;
  }
  if (tone === "danger") {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>`;
  }
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
}

export function renderJobSkeletons(container, count = 6) {
  if (!container) return;
  container.setAttribute("aria-busy", "true");
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(`
      <div class="ej-row" aria-hidden="true">
        <div><div class="ej-skeleton-line" style="width: 18px; height: 18px;"></div></div>
        <div class="ej-job-main">
          <div style="display:flex; gap:8px; align-items:center;">
            <div class="ej-skeleton-line" style="width: 55%; height: 18px;"></div>
            <div class="ej-skeleton-line" style="width: 80px; height: 20px; border-radius: 4px;"></div>
          </div>
          <div class="ej-skeleton-line" style="width: 42%; height: 14px; margin-top: 6px;"></div>
        </div>
        <div class="ej-apps-col">
          <div class="ej-skeleton-line" style="width: 76px; height: 16px;"></div>
          <div class="ej-skeleton-line" style="width: 90px; height: 13px; margin-top: 4px;"></div>
        </div>
        <div class="ej-actions-col">
          <div class="ej-skeleton-line" style="width: 52px; height: 36px; border-radius: 8px;"></div>
          <div class="ej-skeleton-line" style="width: 36px; height: 36px; border-radius: 8px;"></div>
        </div>
      </div>
    `);
  }
  container.innerHTML = rows.join("");
}

export function renderJobRows(container, items, handlers = {}) {
  if (!container) return;
  container.removeAttribute("aria-busy");
  const selectedIds = handlers.selectedIds || new Set();

  container.innerHTML = items
    .map((job) => {
      const isChecked = selectedIds.has(job.id);
      const metaParts = [
        job.location || "Chưa chọn địa điểm",
        job.work_type || "Chưa chọn hình thức",
        `Hạn nộp: ${formatDateVN(job.deadline)}`,
      ];
      const dateValue = job.published_at || job.created_at;
      const datePrefix = job.published_at ? "Đăng" : "Tạo";
      const appCount = Number(job.applicants_count) || 0;
      const newCount = Number(job.new_applicants_count) || 0;
      const newBadge =
        newCount > 0
          ? `<span class="ej-applicants-new"><span class="ej-teal-dot" aria-hidden="true"></span>${newCount} mới</span>`
          : "";

      const applicantsMarkup =
        appCount > 0
          ? `<button
              type="button"
              class="ej-applicants-btn"
              data-action="view-applicants"
              data-job-id="${job.id}"
              aria-label="Xem ${appCount} hồ sơ ứng tuyển cho ${escapeText(job.title)}"
            >
              <span class="ej-applicants-num">${appCount} hồ sơ</span>
              ${newBadge}
            </button>`
          : `<span class="ej-applicants-empty">Chưa có hồ sơ</span>`;

      const isDeleted = job.status === "rejected" || job.status === "deleted";
      const statusLabel = isDeleted ? "Bị xóa" : (job.status === "pending" ? "Chờ duyệt" : (job.status === "published" || job.status === "open" ? "Đang tuyển" : "Bản nháp"));
      const statusTone = isDeleted ? "danger" : (job.status === "pending" ? "warning" : (job.status === "published" || job.status === "open" ? "success" : "neutral"));

      const pendingNote =
        job.status === "pending"
          ? `<div class="ej-pending-note" role="note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Đang chờ ban quản trị xét duyệt nội dung</span>
            </div>`
          : (isDeleted && job.review_note)
          ? `<div class="ej-pending-note" role="note" style="color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;padding:4px 8px;border-radius:6px;margin-top:6px;display:flex;align-items:center;gap:6px;font-size:12px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>Lý do xóa: ${escapeText(job.review_note)}</span>
            </div>`
          : "";

      const titleHtml = isDeleted
        ? `<span class="ej-job-title-link" style="color:var(--text-secondary); cursor:not-allowed;">${escapeText(job.title)}</span>`
        : `<a href="./job-form.html?id=${job.id}" class="ej-job-title-link">${escapeText(job.title)}</a>`;

      const editBtnHtml = isDeleted
        ? ""
        : `<a href="./job-form.html?id=${job.id}" class="ej-btn-edit" aria-label="Sửa tin ${escapeText(job.title)}">Sửa</a>`;

      return `
        <article class="ej-row" data-job-id="${job.id}">
          <label class="ej-check-wrap">
            <input type="checkbox" class="ej-checkbox" data-select-job="${job.id}" ${isChecked ? "checked" : ""} aria-label="Chọn tin ${escapeText(job.title)}">
          </label>
          <div class="ej-job-main">
            <div class="ej-job-header-row">
              <h3 class="ej-job-title" title="${escapeText(job.title)}">
                ${titleHtml}
              </h3>
              <span class="ej-badge ej-badge--${escapeText(statusTone)}">
                ${getToneIcon(statusTone)}
                <span>${escapeText(statusLabel)}</span>
              </span>
            </div>
            <div class="ej-job-meta">${escapeText(metaParts.join(" · "))}</div>
            ${pendingNote}
          </div>

          <div class="ej-apps-col">
            ${applicantsMarkup}
            <span class="ej-date-sub">${datePrefix} ${formatDateVN(dateValue)}</span>
          </div>

          <div class="ej-actions-col">
            ${editBtnHtml}
            <button
              type="button"
              class="ej-btn-more"
              data-action="open-menu"
              data-job-id="${job.id}"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-label="Thao tác khác cho ${escapeText(job.title)}"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="19" cy="12" r="2"></circle>
              </svg>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  container.querySelectorAll('input[data-select-job]').forEach((cb) => {
    cb.addEventListener("change", () => {
      handlers.onToggleSelect?.(Number(cb.dataset.selectJob), cb.checked);
    });
  });

  container.querySelectorAll('[data-action="view-applicants"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const jobId = Number(btn.dataset.jobId);
      const job = items.find((item) => item.id === jobId);
      if (job) handlers.onViewApplicants?.(job);
    });
  });

  container.querySelectorAll('[data-action="open-menu"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const jobId = Number(btn.dataset.jobId);
      const job = items.find((item) => item.id === jobId);
      if (job) handlers.onOpenMenu?.(job, btn);
    });
  });
}
