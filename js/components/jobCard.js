/**
 * jobCard.js - Render thẻ việc làm chuẩn CSS Grid (56px 1fr auto) hoặc compact (< 200 dòng).
 */
import { companyUrl, jobDetailUrl, loginUrl } from "../routes.js";
import { safeUrl } from "../utils/companyUtils.js";

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function getCompanyInitials(name) {
  const c = String(name || "").trim().replace(/[^\p{L}\p{N}\s]/gu, "");
  if (!c) return "CR";
  const u = c.toUpperCase();
  for (const [k, v] of [["VNG", "VN"], ["VIETTEL", "VT"], ["VNPAY", "VP"], ["FPT", "FP"]]) {
    if (u.startsWith(k)) return v;
  }
  const words = c.split(/\s+/).filter(Boolean);
  return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : (u.length >= 2 ? u.slice(0, 2) : (u || "C"));
}

const LOGO_DIMS = { sm: { px: 40, fs: 15, rad: 10, cls: "job-company-logo--sm" }, md: { px: 56, fs: 20, rad: 12, cls: "" }, lg: { px: 64, fs: 22, rad: 12, cls: "job-company-logo--lg" } };
const NEUTRAL_LOGO_STYLE = "background:var(--bg-alt,#F8FAFC);color:var(--text-secondary,#475569);border:1px solid var(--border-subtle,#E2E8F0);";

export function getCompanyLogo(companyName, sizeClass = "") {
  const name = String(companyName || "C").trim();
  const initial = getCompanyInitials(name);
  return `<div class="job-company-logo ${sizeClass}" style="${NEUTRAL_LOGO_STYLE}width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;flex-shrink:0;" aria-hidden="true">${escapeText(initial)}</div>`;
}

/** Tạo phần tử logo công ty theo kích thước (sm/md/lg), tự fallback sang chữ cái đầu trên nền trung tính cố định. */
export function renderCompanyLogo(companyOrName, size = "md") {
  const isObj = companyOrName && typeof companyOrName === "object";
  const name = String((isObj ? (companyOrName.name || companyOrName.company_name) : companyOrName) || "C").trim();
  const dim = LOGO_DIMS[size] || LOGO_DIMS.md;
  const makeFallback = () => {
    const box = document.createElement("div");
    box.className = `job-company-logo ${dim.cls}`.trim();
    box.style.cssText = `${NEUTRAL_LOGO_STYLE}width:${dim.px}px;height:${dim.px}px;border-radius:${dim.rad}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${dim.fs}px;flex-shrink:0;`;
    box.setAttribute("aria-hidden", "true");
    box.textContent = getCompanyInitials(name);
    return box;
  };
  const rawUrl = isObj ? (companyOrName.logo_url || companyOrName.company_logo || "") : "";
  const validLogo = safeUrl(rawUrl, ["http:", "https:"], { allowRelativeUploads: true });
  if (!validLogo) return makeFallback();
  const resolvedSrc = validLogo.startsWith("/uploads/") && window.CONFIG?.API_BASE_URL
    ? new URL(validLogo, window.CONFIG.API_BASE_URL).href : validLogo;
  const wrap = document.createElement("div");
  wrap.className = `job-company-logo job-company-logo--img ${dim.cls}`.trim();
  wrap.style.cssText = `width:${dim.px}px;height:${dim.px}px;border-radius:${dim.rad}px;overflow:hidden;flex-shrink:0;`;
  const img = document.createElement("img");
  img.className = "company-logo-img";
  img.width = dim.px; img.height = dim.px; img.loading = "lazy";
  img.alt = `Logo ${name}`;
  img.src = resolvedSrc;
  img.addEventListener("error", () => wrap.replaceWith(makeFallback()), { once: true });
  wrap.appendChild(img);
  return wrap;
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
  const compact = Boolean(options.compact);
  const detailHref = options.detailBase ? `${options.detailBase}?id=${encodeURIComponent(job.id)}` : jobDetailUrl(job.id);
  const cleanTitle = (job.title || "").replace("[Seed]", "").trim();
  const timeInfo = formatRelativeTime(job.published_at || job.created_at);

  const allSkills = Array.isArray(job.skills) ? job.skills : [];
  const topSkills = allSkills.slice(0, 3);
  const remainingCount = allSkills.length - 3;
  let skillsHtml = topSkills.map((s) => `<span class="job-tag">${escapeText(s)}</span>`).join("");
  if (remainingCount > 0) skillsHtml += `<span class="job-tag-more">+${remainingCount}</span>`;

  let matchBadgeHtml = "";
  if (job.match_score !== null && job.match_score !== undefined) {
    const score = job.match_score;
    const toneClass = score >= 70 ? "match-high" : (score >= 40 ? "match-mid" : "match-low");
    const tooltip = `Khớp: ${(job.matched_skills || []).join(", ") || "Chưa có"} | Thiếu: ${(job.missing_skills || []).join(", ") || "Không có"}`;
    matchBadgeHtml = `<span class="job-match-badge ${toneClass}" title="${escapeText(tooltip)}">Khớp ${score}%</span>`;
  }

  const salaryInsightHtml = job.salary_insight ? `<span class="job-salary-insight ${job.salary_insight.includes("Cao") ? "insight-high" : "insight-low"}">${escapeText(job.salary_insight)}</span>` : "";
  const expiredBadgeHtml = job.is_expired ? '<span class="job-expired-badge">Đã hết hạn</span>' : "";
  const saveBtnHtml = options.showSaveBtn
    ? `<button type="button" class="job-save-btn ${job.is_saved ? "is-saved" : ""}" data-save-job="${job.id}" aria-pressed="${job.is_saved ? "true" : "false"}" aria-label="Lưu tin"><svg width="18" height="18" viewBox="0 0 24 24" fill="${job.is_saved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></button>`
    : "";
  const applyBtnHtml = options.showApplyBtn ? `<button type="button" class="job-apply-btn btn btn-sm btn-primary" data-apply-job="${job.id}">Ứng tuyển</button>` : "";
  const metaParts = [];
  if (compact && job.level) {
    metaParts.push(`<span class="job-meta-item job-meta-level">${escapeText(job.level)}</span>`);
  } else if (!compact && job.company_name) {
    const cName = escapeText(job.company_name);
    metaParts.push(`<span class="job-meta-item job-meta-company">${job.company_slug ? `<a href="${escapeText(companyUrl(job.company_slug))}" class="job-meta-company-link">${cName}</a>` : cName}</span>`);
  }
  if (job.location) metaParts.push(`<span class="job-meta-item job-meta-location">${escapeText(job.location)}</span>`);
  if (job.work_type) metaParts.push(`<span class="job-meta-item job-meta-worktype">${escapeText(job.work_type)}</span>`);
  if (timeInfo.text) {
    metaParts.push(`<span class="job-meta-item job-meta-time">${timeInfo.isNew ? '<span class="job-time-new-dot" aria-label="Mới đăng trong 24h"></span>' : ""}${escapeText(timeInfo.text)}</span>`);
  }

  return `
    <article class="job-grid-card job-card--clickable${compact ? " is-compact" : ""}${job.is_expired ? " is-expired" : ""}" data-job-id="${job.id}" data-job-href="${escapeText(detailHref)}">
      ${compact ? "" : `<div class="job-card-col-logo">${getCompanyLogo(job.company_name)}</div>`}
      <div class="job-card-col-content">
        <h3 class="job-title-line" title="${escapeText(cleanTitle)}"><a href="${escapeText(detailHref)}" class="job-title-link">${escapeText(cleanTitle)}</a></h3>
        <div class="job-meta-row">${metaParts.join("")}</div>
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
  const wasSaved = btn?.classList.contains("is-saved") ?? false, nextSaved = !wasSaved;
  const setVisual = (s) => {
    if (!btn) return;
    btn.classList.toggle("is-saved", s);
    btn.setAttribute("aria-pressed", s ? "true" : "false");
    btn.querySelector("svg")?.setAttribute("fill", s ? "currentColor" : "none");
  };
  setVisual(nextSaved);
  try {
    const res = await window.api[nextSaved ? "post" : "delete"](`/candidate/saved-jobs/${jobId}`);
    onToast?.(res?.message || (nextSaved ? "Đã lưu việc làm" : "Đã bỏ lưu"), "success");
    onChanged?.(jobId, nextSaved);
  } catch (err) {
    setVisual(wasSaved);
    onToast?.(err?.message || "Thao tác thất bại", "error");
  }
}

export function bindSaveJobButtons(container, { onToast, onChanged } = {}) {
  if (!container) return;
  container.querySelectorAll(".job-save-btn[data-save-job]").forEach((btn) => {
    btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggleSave(btn.dataset.saveJob, btn, { onToast, onChanged }); });
  });
}

export function bindApplyJobButtons(container, { onApply } = {}) {
  if (!container) return;
  container.querySelectorAll(".job-apply-btn[data-apply-job]").forEach((btn) => {
    btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); onApply?.(Number(btn.dataset.applyJob), btn); });
  });
}
