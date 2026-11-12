/**
 * Component Thẻ xem trước trực tiếp (cùng cấu trúc .job-card của trang chủ).
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function formatSalaryShort(draft) {
  if (draft.is_salary_negotiable) return "Thỏa thuận";
  const min = draft.salary_min;
  const max = draft.salary_max;
  const toTr = (v) => {
    const n = Number(v);
    if (!n) return "";
    return n >= 1000000 ? `${Math.round((n / 1000000) * 10) / 10} Tr` : `${n.toLocaleString("vi-VN")} ₫`;
  };
  if (min && max) return `${toTr(min)} - ${toTr(max)}`;
  if (min) return `Từ ${toTr(min)}`;
  if (max) return `Đến ${toTr(max)}`;
  return "Chưa nhập lương";
}

function formatDateVN(value) {
  if (!value) return "Chưa đặt";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "Chưa đặt" : d.toLocaleDateString("vi-VN");
}

export function renderJobPreviewCard(container, draft) {
  if (!container) return;
  const title = draft.title?.trim() || "Tên vị trí tuyển dụng";
  const company = draft.company_name || "Doanh nghiệp của bạn";
  const initial = company.trim().charAt(0).toUpperCase() || "C";
  const location = draft.location || "Chưa chọn địa điểm";
  const workType = draft.work_type || "Hình thức";
  const salaryText = formatSalaryShort(draft);
  const skills = Array.isArray(draft.skills) ? draft.skills : [];
  const tagsHtml = skills
    .slice(0, 3)
    .map((s) => `<span class="job-tag">${escapeText(s)}</span>`)
    .join("");

  container.innerHTML = `
    <article class="job-card ejf-preview-card" role="article">
      <div class="job-card-main">
        <div class="job-company-logo" style="background: #F0FDFA; color: #0F766E;" aria-hidden="true">${escapeText(initial)}</div>
        <div class="job-card-body">
          <h3 class="job-title" title="${escapeText(title)}">${escapeText(title)}</h3>
          <div class="job-meta-line">
            <span class="job-meta-company">${escapeText(company)}</span>
            <span class="job-meta-dot">·</span>
            <span>${escapeText(location)}</span>
            <span class="job-meta-dot">·</span>
            <span class="job-meta-time">Vừa tạo</span>
          </div>
          <div class="job-tags-list">
            ${tagsHtml || '<span class="job-tag">Chưa chọn kỹ năng</span>'}
          </div>
        </div>
      </div>
      <div class="job-card-right">
        <div class="job-salary">${escapeText(salaryText)}</div>
        <span class="job-mode-pill">${escapeText(workType)}</span>
      </div>
    </article>

    <div class="ejf-preview-meta">
      <div class="ejf-preview-row"><span>Cấp bậc</span><strong>${escapeText(draft.level || "Chưa chọn")}</strong></div>
      <div class="ejf-preview-row"><span>Số lượng</span><strong>${Number(draft.quantity || 1)} người</strong></div>
      <div class="ejf-preview-row"><span>Hạn nộp</span><strong>${escapeText(formatDateVN(draft.deadline))}</strong></div>
      <div class="ejf-preview-row"><span>Quyền lợi</span><strong>${(draft.benefits || []).length} mục</strong></div>
    </div>
  `;
}

