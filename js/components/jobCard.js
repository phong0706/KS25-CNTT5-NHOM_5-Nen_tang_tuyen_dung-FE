/**
 * jobCard.js - Render thẻ việc làm chuẩn CSS Grid (56px 1fr 150px) hoặc compact (< 150 dòng).
 */
import { companyUrl, jobDetailUrl, loginUrl } from "../routes.js";
import { renderCompanyLogo, getCompanyInitials as baseInitials } from "./companyLogo.js";

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function getCompanyInitials(name) {
  return baseInitials(name);
}

export function getCompanyLogo(companyOrName, sizeClass = "") {
  const comp = typeof companyOrName === "object" && companyOrName !== null
    ? companyOrName
    : { name: String(companyOrName || "C").trim() };
  return renderCompanyLogo(comp, { size: 56, className: sizeClass });
}

export function normalizeSkills(skills) {
  const list = Array.isArray(skills)
    ? (skills.length > 1 && skills.every((s) => typeof s === "string" && s.length === 1) ? [skills.join("")] : skills)
    : (typeof skills === "string" && skills.trim() ? [skills] : []);
  const clean = [], seen = new Set();
  for (const item of list) {
    if (typeof item !== "string") continue;
    for (let p of item.split(/[,;|/\n]/)) {
      p = p.trim().replace(/^['"\[\]]+|['"\[\]]+$/g, "").trim();
      if (p && !seen.has(p.toLowerCase())) { seen.add(p.toLowerCase()); clean.push(p); }
    }
  }
  return clean;
}

export function formatSalary(job) {
  if (!job || job.is_salary_negotiable) return "Thỏa thuận";
  const toTr = (v) => (!Number(v) ? "" : Number(v) >= 1e6 ? `${Math.round((Number(v) / 1e6) * 10) / 10} Tr` : `${Number(v).toLocaleString("vi-VN")} ₫`);
  if (job.salary_min && job.salary_max) {
    let min = Number(job.salary_min), max = Number(job.salary_max);
    if (min > max) [min, max] = [max, min];
    return `${toTr(min)} - ${toTr(max)}`;
  }
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
  const compact = Boolean(options.compact);
  const detailHref = options.detailBase ? `${options.detailBase}?id=${encodeURIComponent(job.id)}` : jobDetailUrl(job.id);
  const cleanTitle = (job.title || "").replace("[Seed]", "").trim();
  const timeInfo = formatRelativeTime(job.published_at || job.created_at);

  const allSkills = normalizeSkills(job.skills || job.tags || job.top_skills);
  const topSkills = allSkills.slice(0, 3);
  const remainingSkills = allSkills.slice(3);
  let skillsHtml = topSkills.map((s) => `<span class="job-tag">${escapeText(s)}</span>`).join("");
  if (remainingSkills.length > 0) {
    skillsHtml += `<span class="job-tag-more" title="${escapeText(remainingSkills.join(", "))}">+${remainingSkills.length}</span>`;
  }

  let matchBadgeHtml = "";
  if (job.match_score !== null && job.match_score !== undefined) {
    const score = Math.round(Number(job.match_score));
    const tooltip = `Khớp: ${(job.matched_skills || []).join(", ") || "Chưa có"} | Thiếu: ${(job.missing_skills || []).join(", ") || "Không có"}`;
    matchBadgeHtml = `<span class="job-match-badge match-high" title="${escapeText(tooltip)}">Khớp ${score}%</span>`;
  }

  const salaryInsightHtml = job.salary_insight
    ? `<span class="job-salary-insight" title="So với các tin cùng lĩnh vực và cấp bậc">${escapeText(job.salary_insight)}</span>`
    : "";
  const expiredBadgeHtml = job.is_expired ? '<span class="job-expired-badge">Đã hết hạn</span>' : "";
  const saveBtnHtml = options.showSaveBtn
    ? `<button type="button" class="job-save-btn ${job.is_saved ? "is-saved" : ""}" data-save-job="${job.id}" aria-pressed="${job.is_saved ? "true" : "false"}" aria-label="Lưu tin"><svg width="18" height="18" viewBox="0 0 24 24" fill="${job.is_saved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>`
    : "";
  const applyBtnHtml = options.showApplyBtn ? `<button type="button" class="job-apply-btn btn btn-sm btn-primary" data-apply-job="${job.id}">Ứng tuyển</button>` : "";

  const compHtml = compact
    ? (job.level ? `<span class="job-meta-level">${escapeText(job.level)}</span>` : "")
    : (job.company_slug
        ? `<a href="${escapeText(companyUrl(job.company_slug))}" class="job-meta-company job-meta-company-link" title="${escapeText(job.company_name || 'Doanh nghiệp')}">${escapeText(job.company_name)}</a>`
        : (job.company_name ? `<span class="job-meta-company" title="${escapeText(job.company_name)}">${escapeText(job.company_name)}</span>` : ""));

  const line1Parts = [];
  if (compHtml && compHtml.trim()) line1Parts.push(compHtml.trim());
  if (job.location && String(job.location).trim()) {
    line1Parts.push(`<span class="job-meta-location">${escapeText(String(job.location).trim())}</span>`);
  }
  const line1Html = line1Parts.join(' <span class="meta-dot" aria-hidden="true">·</span> ');

  const line2Parts = [];
  if (job.work_type && String(job.work_type).trim()) {
    line2Parts.push(`<span class="job-meta-worktype">${escapeText(String(job.work_type).trim())}</span>`);
  }
  if (!compact && job.level && String(job.level).trim()) {
    line2Parts.push(`<span class="job-meta-level">${escapeText(String(job.level).trim())}</span>`);
  }
  if (timeInfo?.text && String(timeInfo.text).trim()) {
    const timeHtml = `<span class="job-meta-time">${timeInfo.isNew ? '<span class="job-time-new-dot" aria-label="Mới đăng trong 24h"></span>' : ""}${escapeText(String(timeInfo.text).trim())}</span>`;
    line2Parts.push(timeHtml);
  }
  const line2Html = line2Parts.join(' <span class="meta-dot" aria-hidden="true">·</span> ');

  return `
    <article class="job-grid-card job-card--clickable${compact ? " is-compact" : ""}${job.is_expired ? " is-expired" : ""}" data-job-id="${job.id}" data-job-href="${escapeText(detailHref)}">
      ${compact ? "" : `<div class="job-card-col-logo">${getCompanyLogo({ name: job.company_name, logo_url: job.company_logo || job.logo_url || job.logo })}</div>`}
      <div class="job-card-col-content">
        <h3 class="job-title-line" title="${escapeText(cleanTitle)}"><a href="${escapeText(detailHref)}" class="job-title-link">${escapeText(cleanTitle)}</a></h3>
        <div class="job-meta-row">${line1Html}</div>
        <div class="job-meta-time-line">${line2Html}</div>
        <div class="job-tags-row"${skillsHtml ? "" : ' hidden aria-hidden="true"'}>${skillsHtml}</div>
      </div>
      <div class="job-card-col-right">
        <div class="job-salary-line"><span class="job-salary-text">${escapeText(formatSalary(job))}</span>${saveBtnHtml}</div>
        <div class="job-badges-line">${expiredBadgeHtml}${salaryInsightHtml}${matchBadgeHtml}</div>
        <div class="job-apply-box">${applyBtnHtml}</div>
      </div>
    </article>`;
}

export function renderJobCardSkeletons(container, count = 6) {
  if (!container) return;
  const card = `<div class="job-grid-card job-skeleton-card" aria-hidden="true"><div class="job-skeleton-pulse" style="width:56px;height:56px;border-radius:12px;"></div><div style="flex:1;display:flex;flex-direction:column;gap:8px;"><div class="job-skeleton-pulse" style="width:70%;height:18px;"></div><div class="job-skeleton-pulse" style="width:50%;height:14px;"></div><div class="job-skeleton-pulse" style="width:35%;height:20px;"></div></div></div>`;
  container.innerHTML = Array(count).fill(card).join("");
}

export async function toggleSave(jobId, btn, { onToast, onChanged } = {}) {
  if (!window.Auth?.isAuthenticated?.()) {
    window.location.href = loginUrl(window.location.pathname + window.location.search);
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
    const res = await window.api[nextSaved ? "post" : "delete"](`/candidate/saved-jobs/${jobId}`);
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
      e.preventDefault(); e.stopPropagation();
      toggleSave(btn.dataset.saveJob, btn, { onToast, onChanged });
    });
  });
}

export function bindApplyJobButtons(container, { onApply } = {}) {
  if (!container) return;
  container.querySelectorAll(".job-apply-btn[data-apply-job]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      onApply?.(Number(btn.dataset.applyJob), btn);
    });
  });
}
