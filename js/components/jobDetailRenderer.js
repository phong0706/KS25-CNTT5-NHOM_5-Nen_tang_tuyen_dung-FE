/**
 * jobDetailRenderer.js - Module render chi tiết việc làm chuẩn 2 cột TechRecruit (<= 200 dòng).
 */
import { renderCompanyLogo } from "./companyLogo.js";
import { formatSalary } from "./jobCard.js";
import { companyUrl, jobsUrl } from "../routes.js";

const IC = (d) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${d}</svg>`;
const ICONS = {
  loc: IC('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>'),
  type: IC('<rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>'),
  level: IC('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>'),
  date: IC('<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'),
  shield: IC('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline>'),
};

function esc(val) {
  return String(val ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function parseSkillsList(skills) {
  if (Array.isArray(skills)) return skills.map((s) => String(s || "").trim()).filter(Boolean);
  if (typeof skills === "string" && skills.trim()) return skills.split(/[,;\n]/).map((s) => s.trim().replace(/^['"\[\]]+|['"\[\]]+$/g, "")).filter(Boolean);
  return [];
}

export function formatBulletContent(rawText, forceList = false) {
  if (!rawText || !rawText.trim()) return "";
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";
  const isB = (l) => forceList || /^[-*•+]\s+/.test(l) || /^\d+[.)]\s+/.test(l);
  const cln = (l) => l.replace(/^[-*•+]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
  let html = "", inL = false;
  for (const l of lines) {
    if (isB(l)) {
      if (!inL) { html += '<ul class="jd-bullet-list">'; inL = true; }
      html += `<li>${esc(cln(l))}</li>`;
    } else {
      if (inL) { html += "</ul>"; inL = false; }
      html += `<p class="jd-paragraph">${esc(l)}</p>`;
    }
  }
  return inL ? html + "</ul>" : html;
}

export function formatDateVi(val) {
  if (!val) return "";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

export function renderInfoGrid(items, ariaLabel = "") {
  const f = (items || []).filter((it) => it && it.val && String(it.val).trim() && it.val !== "—");
  if (!f.length) return "";
  const aria = ariaLabel ? ` role="region" aria-label="${esc(ariaLabel)}"` : "";
  return `<div class="jd-meta-grid"${aria}>${f.map((it) => `
    <div class="jd-grid-item">
      <div class="jd-grid-item-head">${it.icon || ""}<span>${esc(it.label)}</span></div>
      <span class="jd-grid-item-value">${esc(it.val)}</span>
    </div>`).join("")}</div>`;
}

export function renderStickyNav(job) {
  return `
    <nav class="jd-sticky-nav" id="jd-sticky-nav" aria-label="Điều hướng trang chi tiết">
      <div class="jd-sticky-nav-inner">
        <div class="jd-nav-tabs" role="tablist">
          <button type="button" role="tab" class="jd-nav-tab is-active" id="tab-detail" aria-selected="true" aria-controls="jd-detail-section" data-target="#jd-detail-section">Chi tiết tin</button>
          <button type="button" role="tab" class="jd-nav-tab" id="tab-related" aria-selected="false" aria-controls="jd-related-card" data-target="#jd-related-card">Việc làm liên quan</button>
        </div>
        <div class="jd-sticky-actions" id="jd-sticky-actions" hidden>
          <span class="jd-sticky-salary">${esc(formatSalary(job))}</span>
          <button type="button" class="btn btn-primary btn-sm jd-sticky-apply-btn" id="jd-sticky-apply-btn">Ứng tuyển</button>
        </div>
      </div>
    </nav>`;
}

export function renderActionBar(job) {
  return `
    <div class="jd-hero-actions">
      <button type="button" class="btn btn-primary jd-cta-apply" id="jd-apply-btn" data-job-id="${job.id}">${job.applied ? "Đã ứng tuyển" : "Ứng tuyển ngay"}</button>
      <button type="button" class="btn btn-outline jd-cta-save ${job.is_saved ? "is-saved" : ""}" id="jd-save-btn" data-job-id="${job.id}" aria-pressed="${job.is_saved ? "true" : "false"}">
        <span class="jd-save-icon" aria-hidden="true">${job.is_saved ? "★" : "☆"}</span><span id="jd-save-label">${job.is_saved ? "Đã lưu tin" : "Lưu tin"}</span>
      </button>
    </div>
    <p class="jd-action-note" id="jd-action-note">${job.applied ? "Bạn đã nộp hồ sơ cho vị trí này." : "Ứng viên cần đăng nhập để nộp hồ sơ trực tuyến."}</p>`;
}

export function renderHeaderBlock(job, { isDrawer = false } = {}) {
  const compUrl = job.company_slug ? companyUrl(job.company_slug) : "";
  const compName = job.company_name || "Doanh nghiệp tuyển dụng";
  const cleanTitle = (job.title || "").replace("[Seed]", "").trim();
  const levelText = (job.level === "Tất cả" || job.level === "tat-ca") ? "Mọi cấp bậc" : (job.level || "");
  const compEl = compUrl
    ? `<a href="${esc(compUrl)}" class="jd-company-link" title="${esc(compName)}">${esc(compName)}</a>`
    : `<span class="jd-company-text" title="${esc(compName)}">${esc(compName)}</span>`;

  const logoHtml = renderCompanyLogo({ name: compName, logo_url: job.company_logo || job.logo_url || job.logo }, { size: 60, className: "jd-hero-logo" });
  const quickItems = [
    { icon: ICONS.loc, label: "Địa điểm", val: job.location || "Toàn quốc" },
    { icon: ICONS.type, label: "Hình thức", val: job.type || job.work_type },
    { icon: ICONS.level, label: "Cấp bậc", val: levelText },
    { icon: ICONS.date, label: "Hạn nộp hồ sơ", val: formatDateVi(job.deadline) },
  ];

  return `
    <header class="jd-hero-block" id="jd-hero-block">
      <div class="jd-hero-top">
        <div class="jd-hero-logo-box">${logoHtml}</div>
        <div class="jd-hero-title-group">
          <h1 class="jd-title" id="jd-main-title">${esc(cleanTitle)}</h1>
          <p class="jd-company-row">Doanh nghiệp: ${compEl}</p>
        </div>
      </div>
      <div class="jd-salary-row"><span class="jd-salary-label">Mức lương</span><span class="jd-salary-value">${esc(formatSalary(job))}</span></div>
      ${renderInfoGrid(quickItems, "Thông tin tổng quan")}
      ${isDrawer ? "" : renderActionBar(job)}
    </header>`;
}

export function renderLeftColumn(job) {
  const skills = parseSkillsList(job.skills);
  const descHtml = formatBulletContent(job.description);
  const reqHtml = formatBulletContent(job.requirements, true);
  const benHtml = formatBulletContent(job.benefits, true);
  const skillsHtml = skills.length ? `<div class="jd-skills-row" role="list" aria-label="Chuyên môn và kỹ năng yêu cầu">${skills.map((s) => `
    <a href="${esc(jobsUrl())}?skills=${encodeURIComponent(s)}" class="jd-skill-pill" role="listitem" title="Tìm việc theo kỹ năng ${esc(s)}">${esc(s)}</a>
  `).join("")}</div>` : "";

  return `
    <div class="jd-main-column" id="jd-detail-section">
      ${skillsHtml ? `<section class="jd-section jd-skills-section" aria-labelledby="sec-skills"><h2 class="jd-section-title" id="sec-skills">Chuyên môn & Kỹ năng yêu cầu</h2>${skillsHtml}</section>` : ""}
      ${descHtml ? `<section class="jd-section" aria-labelledby="sec-desc">
        <h2 class="jd-section-title" id="sec-desc">Mô tả công việc</h2>
        <div class="jd-prose-wrap" id="jd-desc-wrap">
          <div class="jd-prose jd-prose--collapsible" id="jd-desc-content">${descHtml}</div>
          <button type="button" class="jd-expand-btn" id="jd-desc-expand" hidden aria-expanded="false">Xem thêm</button>
        </div>
      </section>` : ""}
      ${reqHtml ? `<section class="jd-section" aria-labelledby="sec-req"><h2 class="jd-section-title" id="sec-req">Yêu cầu ứng viên</h2><div class="jd-prose">${reqHtml}</div></section>` : ""}
      ${benHtml ? `<section class="jd-section" aria-labelledby="sec-ben"><h2 class="jd-section-title" id="sec-ben">Quyền lợi được hưởng</h2><div class="jd-prose">${benHtml}</div></section>` : ""}
      ${job.location ? `<section class="jd-section" aria-labelledby="sec-loc"><h2 class="jd-section-title" id="sec-loc">Địa điểm & Thời gian làm việc</h2><div class="jd-prose"><p class="jd-paragraph">Địa điểm: ${esc(job.location)}</p><p class="jd-paragraph">Hình thức: ${esc(job.type || "Toàn thời gian")}</p></div></section>` : ""}
    </div>`;
}

export function renderRightColumn(job) {
  const compUrl = job.company_slug ? companyUrl(job.company_slug) : "";
  const compName = job.company_name || "Doanh nghiệp tuyển dụng";
  const logoHtml = renderCompanyLogo({ name: compName, logo_url: job.company_logo || job.logo_url || job.logo }, { size: 64, className: "jd-comp-card-logo" });
  const trustCard = job.company_is_verified ? `
    <div class="jd-card jd-trust-card" role="note" aria-label="Xác thực doanh nghiệp">
      <div class="jd-trust-head"><span class="jd-trust-icon" aria-hidden="true">${ICONS.shield}</span><span class="jd-trust-title">Nhà tuyển dụng xác thực</span></div>
      <p class="jd-trust-text">Tin đăng từ nhà tuyển dụng đã được xác minh.</p>
    </div>` : "";

  return `
    <aside class="jd-sidebar-column">
      <div class="jd-card jd-company-card">
        <div class="jd-comp-head">
          <div class="jd-comp-logo-box">${logoHtml}</div>
          <div class="jd-comp-meta"><h3 class="jd-comp-name">${esc(compName)}</h3>${job.category_name ? `<span class="jd-comp-cat">${esc(job.category_name)}</span>` : ""}</div>
        </div>
        <div class="jd-comp-details">
          ${job.company_size ? `<div class="jd-comp-detail-row"><span class="jd-comp-label">Quy mô</span><span class="jd-comp-val">${esc(job.company_size)}</span></div>` : ""}
          ${(job.company_address || job.location) ? `<div class="jd-comp-detail-row"><span class="jd-comp-label">Địa điểm</span><span class="jd-comp-val">${esc(job.company_address || job.location)}</span></div>` : ""}
          ${job.company_website ? `<div class="jd-comp-detail-row"><span class="jd-comp-label">Website</span><a href="${esc(job.company_website)}" class="jd-comp-val jd-comp-link" target="_blank" rel="noopener noreferrer">${esc(job.company_website.replace(/^https?:\/\//, ""))}</a></div>` : ""}
        </div>
        ${compUrl ? `<div class="jd-comp-foot"><a href="${esc(compUrl)}" class="btn btn-outline btn-sm jd-view-comp-btn">Xem trang công ty</a></div>` : ""}
      </div>
      ${trustCard}
      <div class="jd-card jd-related-card" id="jd-related-card">
        <h3 class="jd-sidebar-title">Việc làm liên quan</h3>
        <div class="jd-related-list" id="jd-related-grid" role="list"></div>
      </div>
      <div class="jd-card jd-tax-card">
        <h3 class="jd-sidebar-title">Khám phá theo danh mục</h3>
        <div class="jd-tax-links">
          ${job.category_slug ? `<a href="${esc(jobsUrl())}?category=${encodeURIComponent(job.category_slug)}" class="jd-tax-link">Việc làm ${esc(job.category_name || "cùng ngành")}</a>` : ""}
          ${job.location ? `<a href="${esc(jobsUrl())}?location=${encodeURIComponent(job.location)}" class="jd-tax-link">Việc làm tại ${esc(job.location)}</a>` : ""}
        </div>
      </div>
    </aside>`;
}

export function renderJobDetailContent(job, options = {}) {
  if (options.isDrawer) {
    return `<article class="jd-drawer-view">${renderHeaderBlock(job, { isDrawer: true })}${renderLeftColumn(job)}</article>`;
  }
  return `
    ${renderStickyNav(job)}
    ${renderHeaderBlock(job)}
    <div class="jd-detail-layout">${renderLeftColumn(job)}${renderRightColumn(job)}</div>
    <div class="jd-mobile-bar" id="jd-mobile-bar" aria-label="Thanh hành động ứng tuyển">
      <div class="jd-mobile-bar-info"><span class="jd-mobile-bar-label">Mức lương</span><span class="jd-mobile-bar-sal">${esc(formatSalary(job))}</span></div>
      <div class="jd-mobile-bar-btns"><button type="button" class="btn btn-primary btn-sm jd-mobile-apply-btn" id="jd-mobile-apply-btn">${job.applied ? "Đã ứng tuyển" : "Ứng tuyển"}</button></div>
    </div>`;
}
