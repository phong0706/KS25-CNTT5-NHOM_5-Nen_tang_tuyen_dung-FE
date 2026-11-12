/**
 * Component hiển thị từng hàng tin tuyển dụng (và skeleton khi tải).
 * Không chứa dữ liệu cứng; mọi nhãn trạng thái, số liệu và allowed_actions lấy từ API.
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
  if (tone === "muted") {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
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
        <div class="ej-job-main">
          <div class="ej-skeleton-line" style="width: 68%; height: 18px;"></div>
          <div class="ej-skeleton-line" style="width: 48%; height: 14px; margin-top: 4px;"></div>
        </div>
        <div><div class="ej-skeleton-line" style="width: 96px; height: 24px; border-radius: 999px;"></div></div>
        <div><div class="ej-skeleton-line" style="width: 56px; height: 22px;"></div></div>
        <div><div class="ej-skeleton-line" style="width: 88px; height: 14px;"></div></div>
        <div class="ej-actions-col">
          <div class="ej-skeleton-line" style="width: 64px; height: 36px; border-radius: 8px;"></div>
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

  container.innerHTML = items
    .map((job) => {
      const metaParts = [
        job.location || "Chưa chọn địa điểm",
        job.work_type || "Chưa chọn hình thức",
        `Hạn nộp: ${formatDateVN(job.deadline)}`,
      ];
      const dateValue = job.published_at || job.created_at;
      const datePrefix = job.published_at ? "Đăng" : "Tạo";
      const newBadge =
        Number(job.new_applicants_count) > 0
          ? `<span class="ej-applicants-new"><span class="ej-teal-dot" aria-hidden="true"></span>${Number(job.new_applicants_count)} mới</span>`
          : "";

      return `
        <article class="ej-row" data-job-id="${job.id}">
          <div class="ej-job-main">
            <h3 class="ej-job-title" title="${escapeText(job.title)}">${escapeText(job.title)}</h3>
            <div class="ej-job-meta">${escapeText(metaParts.join(" · "))}</div>
          </div>

          <div>
            <span class="ej-badge ej-badge--${escapeText(job.status_tone || "neutral")}">
              ${getToneIcon(job.status_tone)}
              <span>${escapeText(job.status_label)}</span>
            </span>
          </div>

          <div>
            <button
              type="button"
              class="ej-applicants-btn"
              data-action="view-applicants"
              data-job-id="${job.id}"
              aria-label="Xem ${Number(job.applicants_count)} hồ sơ ứng tuyển cho ${escapeText(job.title)}"
            >
              <span class="ej-applicants-num">${Number(job.applicants_count)}</span>
              ${newBadge}
            </button>
          </div>

          <div class="ej-stats-col">
            <span class="ej-stat-line">${Number(job.views_count).toLocaleString("vi-VN")} lượt xem</span>
            <span class="ej-stat-line">${datePrefix} ${formatDateVN(dateValue)}</span>
          </div>

          <div class="ej-actions-col">
            <a
              href="./job-form.html?id=${job.id}"
              class="ej-btn-edit"
              aria-label="Sửa tin ${escapeText(job.title)}"
            >Sửa</a>
            <button
              type="button"
              class="ej-btn-more"
              data-action="open-menu"
              data-job-id="${job.id}"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-label="Thêm thao tác cho ${escapeText(job.title)}"
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
