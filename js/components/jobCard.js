/**
 * jobCard.js - Render thẻ việc làm chuẩn CSS Grid (56px 1fr auto)
 * Giới hạn: < 200 dòng.
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

const AVATAR_PALETTES = [
  { bg: "#F0FDFA", fg: "#0F766E" }, { bg: "#EFF6FF", fg: "#1D4ED8" },
  { bg: "#FEF3C7", fg: "#B45309" }, { bg: "#F3E8FF", fg: "#6D28D9" },
  { bg: "#ECFDF5", fg: "#047857" }, { bg: "#FFF1F2", fg: "#BE123C" },
];

export function getCompanyLogo(companyName, sizeClass = "") {
  const name = String(companyName || "C").trim();
  const initial = name.charAt(0).toUpperCase() || "C";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  const pal = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  return `<div class="job-company-logo ${sizeClass}" style="background:${pal.bg};color:${pal.fg};width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;flex-shrink:0;" aria-hidden="true">${escapeText(initial)}</div>`;
}

export function formatSalary(job) {
  if (!job || job.is_salary_negotiable) return "Thỏa thuận";
  const toTr = (v) => (!Number(v) ? "" : Number(v) >= 1e6 ? `${Math.round((Number(v) / 1e6) * 10) / 10} Tr` : `${Number(v).toLocaleString("vi-VN")} ₫`);
  if (job.salary_min && job.salary_max) return `${toTr(job.salary_min)} - ${toTr(job.salary_max)}`;
  return job.salary_min ? `Từ ${toTr(job.salary_min)}` : (job.salary_max ? `Đến ${toTr(job.salary_max)}` : "Thỏa thuận");
}

export function formatRelativeTime(isoValue) {
  if (!isoValue) return { text: "Mới đăng", isNew: true };
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return { text: "Mới đăng", isNew: true };
  const diffHours = Math.max(0, Math.floor((Date.now() - d.getTime()) / 3600000));
  const isNew = diffHours < 24;
  if (diffHours < 1) return { text: "Vừa đăng", isNew };
  if (diffHours < 24) return { text: `${diffHours} giờ trước`, isNew };
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return { text: "Hôm qua", isNew: false };
  if (diffDays < 30) return { text: `${diffDays} ngày trước`, isNew: false };
  return { text: d.toLocaleDateString("vi-VN"), isNew: false };
}

export function renderJobCard(job, options = {}) {
  const detailHref = `${options.detailBase || "pages/job-detail.html"}?id=${encodeURIComponent(job.id)}`;
  const cleanTitle = (job.title || "").replace("[Seed]", "").trim();
  const timeInfo = formatRelativeTime(job.published_at || job.created_at);

  // Kỹ năng: Tối đa 3 thẻ + số dư "+N"
  const allSkills = Array.isArray(job.skills) ? job.skills : [];
  const topSkills = allSkills.slice(0, 3);
  const remainingCount = allSkills.length - 3;
  let skillsHtml = topSkills.map(s => `<span class="job-tag">${escapeText(s)}</span>`).join("");
  if (remainingCount > 0) skillsHtml += `<span class="job-tag-more">+${remainingCount}</span>`;

  // Điểm khớp (Match score)
  let matchBadgeHtml = "";
  if (job.match_score !== null && job.match_score !== undefined) {
    const score = job.match_score;
    const toneClass = score >= 70 ? "match-high" : (score >= 40 ? "match-mid" : "match-low");
    const matchedStr = (job.matched_skills || []).join(", ");
    const missingStr = (job.missing_skills || []).join(", ");
    const tooltip = `Khớp: ${matchedStr || "Chưa có"} | Thiếu: ${missingStr || "Không có"}`;
    matchBadgeHtml = `<span class="job-match-badge ${toneClass}" title="${escapeText(tooltip)}">Khớp ${score}%</span>`;
  }

  // So sánh lương (Salary insight)
  const salaryInsightHtml = job.salary_insight
    ? `<span class="job-salary-insight ${job.salary_insight.includes("Cao") ? "insight-high" : "insight-low"}">${escapeText(job.salary_insight)}</span>`
    : "";
  const expiredBadgeHtml = job.is_expired ? '<span class="job-expired-badge">Đã hết hạn</span>' : "";

  const saveBtnHtml = options.showSaveBtn
    ? `<button type="button" class="job-save-btn ${job.is_saved ? "is-saved" : ""}" data-save-job="${job.id}" aria-pressed="${job.is_saved ? "true" : "false"}" aria-label="Lưu tin">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${job.is_saved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
      </button>`
    : "";

  const applyBtnHtml = options.showApplyBtn
    ? `<button type="button" class="job-apply-btn btn btn-sm btn-primary" data-apply-job="${job.id}">Ứng tuyển</button>`
    : "";

  return `
    <article class="job-grid-card job-card--clickable${job.is_expired ? " is-expired" : ""}" data-job-id="${job.id}" data-job-href="${escapeText(detailHref)}">
      <!-- Cột 1: Logo 56px -->
      <div class="job-card-col-logo">
        ${getCompanyLogo(job.company_name)}
      </div>

      <!-- Cột 2: Nội dung vị trí, công ty, tags -->
      <div class="job-card-col-content">
        <h3 class="job-title-line" title="${escapeText(cleanTitle)}">
          <a href="${escapeText(detailHref)}" class="job-title-link">${escapeText(cleanTitle)}</a>
        </h3>
        <div class="job-meta-row">
          <span class="job-meta-company">${escapeText(job.company_name)}</span>
          <span class="meta-dot">·</span>
          <span class="job-meta-location">${escapeText(job.location || "Toàn quốc")}</span>
          <span class="meta-dot">·</span>
          <span class="job-meta-worktype">${escapeText(job.work_type || "Toàn thời gian")}</span>
          <span class="meta-dot">·</span>
          <span class="job-meta-time">
            ${timeInfo.isNew ? `<span class="job-time-new-dot" aria-label="Mới đăng trong 24h"></span>` : ""}
            ${escapeText(timeInfo.text)}
          </span>
        </div>
        <div class="job-tags-row"${skillsHtml ? "" : ' hidden aria-hidden="true"'}>${skillsHtml}</div>
      </div>

      <!-- Cột 3: Lương, Match badge & Tác vụ -->
      <div class="job-card-col-right">
        <div class="job-salary-line">
          <span class="job-salary-text">${escapeText(formatSalary(job))}</span>
          ${saveBtnHtml}
        </div>
        <div class="job-badges-line">
          ${expiredBadgeHtml}
          ${salaryInsightHtml}
          ${matchBadgeHtml}
        </div>
        <div class="job-apply-box">
          ${applyBtnHtml}
        </div>
      </div>
    </article>
  `;
}

export function renderJobCardSkeletons(container, count = 6) {
  if (!container) return;
  const card = `<div class="job-grid-card job-skeleton-card" aria-hidden="true"><div class="job-skeleton-pulse" style="width:56px;height:56px;border-radius:12px;"></div><div style="flex:1;display:flex;flex-direction:column;gap:8px;"><div class="job-skeleton-pulse" style="width:70%;height:18px;"></div><div class="job-skeleton-pulse" style="width:50%;height:14px;"></div><div class="job-skeleton-pulse" style="width:35%;height:20px;"></div></div></div>`;
  container.innerHTML = Array(count).fill(card).join("");
}

export async function toggleSave(jobId, btn, { onToast, onChanged } = {}) {
  if (!window.Auth?.isAuthenticated?.()) {
    const p = window.location.pathname.replace(/\\/g, "/");
    const root = p.includes("/pages/admin/") || p.includes("/pages/employer/") || p.includes("/pages/candidate/") ? "../../" : (p.includes("/pages/") ? "../" : "./");
    window.location.href = `${root}pages/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return;
  }
  const wasSaved = btn?.classList.contains("is-saved") ?? false;
  const nextSaved = !wasSaved;
  if (btn) {
    btn.classList.toggle("is-saved", nextSaved);
    btn.setAttribute("aria-pressed", nextSaved ? "true" : "false");
    btn.querySelector("svg")?.setAttribute("fill", nextSaved ? "currentColor" : "none");
  }
  try {
    const method = nextSaved ? "post" : "delete";
    const res = await window.api[method](`/candidate/saved-jobs/${jobId}`);
    onToast?.(res?.message || (nextSaved ? "Đã lưu việc làm" : "Đã bỏ lưu"), "success");
    onChanged?.(jobId, nextSaved);
  } catch (err) {
    if (btn) {
      btn.classList.toggle("is-saved", wasSaved);
      btn.setAttribute("aria-pressed", wasSaved ? "true" : "false");
      btn.querySelector("svg")?.setAttribute("fill", wasSaved ? "currentColor" : "none");
    }
    onToast?.(err?.message || "Thao tác thất bại", "error");
  }
}

export function bindSaveJobButtons(container, { onToast, onChanged } = {}) {
  if (!container) return;
  container.querySelectorAll(".job-save-btn[data-save-job]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSave(btn.dataset.saveJob, btn, { onToast, onChanged });
    });
  });
}

export function bindApplyJobButtons(container, { onApply } = {}) {
  if (!container) return;
  container.querySelectorAll(".job-apply-btn[data-apply-job]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onApply?.(Number(btn.dataset.applyJob), btn);
    });
  });
}
