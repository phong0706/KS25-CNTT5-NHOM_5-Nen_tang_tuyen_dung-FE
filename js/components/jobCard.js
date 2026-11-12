/**
 * Component thẻ việc làm dùng chung cho Trang chủ và Trang tìm việc.
 * Cung cấp getCompanyLogo(), formatSalary(), formatRelativeTime(), renderJobCard().
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

const AVATAR_PALETTES = [
  { bg: "#F0FDFA", fg: "#0F766E" },
  { bg: "#EFF6FF", fg: "#1D4ED8" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#F3E8FF", fg: "#6D28D9" },
  { bg: "#ECFDF5", fg: "#047857" },
  { bg: "#FFF1F2", fg: "#BE123C" },
];

export function getCompanyLogo(companyName, sizeClass = "") {
  const name = String(companyName || "C").trim();
  const initial = name.charAt(0).toUpperCase() || "C";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  const pal = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  return `<div class="job-company-logo ${sizeClass}" style="background:${pal.bg};color:${pal.fg};" aria-hidden="true">${escapeText(initial)}</div>`;
}

export function formatSalary(job) {
  if (!job) return "Thỏa thuận";
  if (job.is_salary_negotiable) return "Thỏa thuận";
  const toTr = (v) => {
    const n = Number(v);
    if (!n) return "";
    return n >= 1000000 ? `${Math.round((n / 1000000) * 10) / 10} Tr` : `${n.toLocaleString("vi-VN")} ₫`;
  };
  if (job.salary_min && job.salary_max) return `${toTr(job.salary_min)} - ${toTr(job.salary_max)}`;
  if (job.salary_min) return `Từ ${toTr(job.salary_min)}`;
  if (job.salary_max) return `Đến ${toTr(job.salary_max)}`;
  return "Thỏa thuận";
}

export function formatRelativeTime(isoValue) {
  if (!isoValue) return "Mới đăng";
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return "Mới đăng";
  const diffHours = Math.max(0, Math.floor((Date.now() - d.getTime()) / 3600000));
  if (diffHours < 1) return "Vừa đăng";
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

export function renderJobCard(job, options = {}) {
  const detailHref = `${options.detailBase || "pages/items.html"}?id=${job.id}`;
  const skills = Array.isArray(job.skills) ? job.skills.slice(0, 3) : [];
  const tagsHtml = skills.map((s) => `<span class="job-tag">${escapeText(s)}</span>`).join("");
  const saveBtnHtml = options.showSaveBtn
    ? `<button
        type="button"
        class="job-save-btn ${job.is_saved ? "is-saved" : ""}"
        data-save-job="${job.id}"
        aria-pressed="${job.is_saved ? "true" : "false"}"
        aria-label="${job.is_saved ? "Bỏ lưu tin" : "Lưu tin"} ${escapeText(job.title)}"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${job.is_saved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>`
    : "";

  return `
    <article class="job-card job-card--clickable" data-job-href="${escapeText(detailHref)}">
      <div class="job-card-main">
        ${getCompanyLogo(job.company_name)}
        <div class="job-card-body">
          <h3 class="job-title" title="${escapeText(job.title)}">
            <a href="${escapeText(detailHref)}">${escapeText(job.title)}</a>
          </h3>
          <div class="job-meta-line">
            <span class="job-meta-company">${escapeText(job.company_name)}</span>
            <span class="job-meta-dot">·</span>
            <span>${escapeText(job.location || "Toàn quốc")}</span>
            <span class="job-meta-dot">·</span>
            <span class="job-meta-time">${escapeText(formatRelativeTime(job.published_at || job.created_at))}</span>
          </div>
          <div class="job-tags-list">${tagsHtml}</div>
        </div>
      </div>
      <div class="job-card-right">
        <div class="job-card-right-top">
          <div class="job-salary">${escapeText(formatSalary(job))}</div>
          ${saveBtnHtml}
        </div>
        <span class="job-mode-pill">${escapeText(job.work_type || "Toàn thời gian")}</span>
      </div>
    </article>
  `;
}

export function renderJobCardSkeletons(container, count = 6) {
  if (!container) return;
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push(`
      <div class="job-skeleton-card" aria-hidden="true">
        <div class="job-skeleton-pulse" style="width:48px;height:48px;border-radius:10px;flex-shrink:0;"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
          <div class="job-skeleton-pulse" style="width:70%;height:18px;"></div>
          <div class="job-skeleton-pulse" style="width:50%;height:14px;"></div>
          <div class="job-skeleton-pulse" style="width:35%;height:20px;"></div>
        </div>
      </div>
    `);
  }
  container.innerHTML = cards.join("");
}

