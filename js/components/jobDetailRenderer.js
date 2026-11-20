/**
 * jobDetailRenderer.js - Module render chi tiết việc làm dùng chung (<= 180 dòng).
 * Phục vụ cả màn Drawer xem nhanh và trang chi tiết độc lập.
 */
import { renderCompanyLogo } from "./companyLogo.js";
import { formatSalary } from "./jobCard.js";
import { companyUrl, jobsUrl } from "../routes.js";

const IC = (d) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${d}</svg>`;
const ICONS = {
  loc: IC('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>'),
  type: IC('<rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>'),
  level: IC('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>'),
  date: IC('<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'),
  cat: IC('<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>'),
  exp: IC('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline>'),
  qty: IC('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>'),
  pub: IC('<rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'),
};

function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function parseSkillsList(skills) {
  if (Array.isArray(skills)) return skills.map((s) => String(s || "").trim()).filter(Boolean);
  if (typeof skills === "string" && skills.trim()) return skills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

export function formatBulletContent(rawText, forceList = false) {
  if (!rawText || !rawText.trim()) return "";
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";
  const isBullet = (l) => forceList || /^[-*•+]\s+/.test(l) || /^\d+[.)]\s+/.test(l);
  const clean = (l) => l.replace(/^[-*•+]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
  let html = "", inList = false;
  for (const line of lines) {
    if (isBullet(line)) {
      if (!inList) { html += '<ul class="jd-bullet-list">'; inList = true; }
      html += `<li>${esc(clean(line))}</li>`;
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p class="jd-paragraph">${esc(line)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

export function formatDateVi(val) {
  if (!val) return "";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

export function renderInfoGrid(items, ariaLabel = "") {
  if (!Array.isArray(items) || !items.length) return "";
  const filtered = items.filter((it) => it && it.val && String(it.val).trim() && it.val !== "—");
  if (!filtered.length) return "";
  const ariaAttr = ariaLabel ? ` role="region" aria-label="${esc(ariaLabel)}"` : "";
  return `<div class="jd-meta-grid"${ariaAttr}>${filtered.map((it) => `
    <div class="jd-grid-item">
      <div class="jd-grid-item-head">${it.icon || ""}<span>${esc(it.label)}</span></div>
      <span class="jd-grid-item-value">${esc(it.val)}</span>
    </div>`).join("")}</div>`;
}

export function renderHeaderBlock(job, { isDrawer = false } = {}) {
  const compUrl = job.company_slug ? companyUrl(job.company_slug) : "";
  const compName = job.company_name || "Doanh nghiệp";
  const cleanTitle = (job.title || "").replace("[Seed]", "").trim();
  const levelText = (job.level === "Tất cả" || job.level === "tat-ca") ? "Mọi cấp bậc" : (job.level || "");
  const compEl = compUrl
    ? `<a href="${esc(compUrl)}" class="jd-company-link" title="${esc(compName)}">${esc(compName)}</a>`
    : `<span class="jd-company-text" title="${esc(compName)}">${esc(compName)}</span>`;

  const logoComp = { name: compName, logo_url: job.company_logo || job.logo_url || job.logo };
  const logoHtml = renderCompanyLogo(logoComp, { size: 56, className: "jd-hero-logo" });
  const quickItems = [
    { icon: ICONS.loc, label: "Địa điểm", val: job.location || "Toàn quốc" },
    { icon: ICONS.type, label: "Hình thức", val: job.type || job.work_type },
    { icon: ICONS.level, label: "Cấp bậc", val: levelText },
    { icon: ICONS.date, label: "Hạn nộp hồ sơ", val: formatDateVi(job.deadline) },
  ];

  return `
    <header class="jd-hero-block">
      <div class="jd-hero-header">
        <div class="jd-hero-logo-box">${logoHtml}</div>
        <div class="jd-hero-title-group">
          <h1 class="jd-title" id="jd-main-title">${esc(cleanTitle)}</h1>
          <p class="jd-company-row">Doanh nghiệp: ${compEl}</p>
        </div>
      </div>
      <div class="jd-salary-row">
        <span class="jd-salary-label">Mức lương</span>
        <span class="jd-salary-value">${esc(formatSalary(job))}</span>
      </div>
      ${renderInfoGrid(quickItems, "Thông tin tổng quan")}
    </header>`;
}

export function renderActionBar(job) {
  return `
    <div class="jd-action-bar">
      <button type="button" class="btn btn-primary jd-cta-apply" id="jd-apply-btn" data-job-id="${job.id}">
        ${job.applied ? "Đã ứng tuyển" : "Ứng tuyển ngay"}
      </button>
      <button type="button" class="btn btn-outline jd-cta-save ${job.is_saved ? "is-saved" : ""}" id="jd-save-btn" data-job-id="${job.id}" aria-pressed="${job.is_saved ? "true" : "false"}">
        <span class="jd-save-icon" aria-hidden="true">${job.is_saved ? "★" : "☆"}</span>
        <span id="jd-save-label">${job.is_saved ? "Đã lưu tin" : "Lưu tin"}</span>
      </button>
    </div>
    <p class="jd-action-note" id="jd-action-note">${job.applied ? "Bạn đã nộp hồ sơ cho vị trí này." : "Ứng viên cần đăng nhập để nộp hồ sơ trực tuyến."}</p>`;
}

export function renderBodySections(job) {
  const skills = parseSkillsList(job.skills);
  const descHtml = formatBulletContent(job.description);
  const reqHtml = formatBulletContent(job.requirements, true);
  const benHtml = formatBulletContent(job.benefits, true);
  const levelText = (job.level === "Tất cả" || job.level === "tat-ca") ? "Mọi cấp bậc" : (job.level || "");

  const skillsHtml = skills.length ? `<div class="jd-skills-row" role="list" aria-label="Kỹ năng yêu cầu">${skills.map((s) => `
    <a href="${esc(jobsUrl())}?skills=${encodeURIComponent(s)}" class="jd-skill-pill" role="listitem" title="Tìm việc theo kỹ năng ${esc(s)}">${esc(s)}</a>
  `).join("")}</div>` : "";

  const facts = [
    { icon: ICONS.cat, label: "Ngành nghề", val: job.category_name },
    { icon: ICONS.exp, label: "Kinh nghiệm yêu cầu", val: job.experience || levelText },
    { icon: ICONS.qty, label: "Số lượng tuyển", val: job.quantity ? `${job.quantity} nhân sự` : "" },
    { icon: ICONS.pub, label: "Ngày đăng tin", val: formatDateVi(job.published_at || job.created_at) },
  ];

  return `
    <div class="jd-body-sections">
      <section class="jd-section" aria-labelledby="sec-desc">
        <h2 class="jd-section-title" id="sec-desc">Mô tả công việc</h2>
        ${descHtml ? `<div class="jd-prose-wrap" id="jd-desc-wrap">
          <div class="jd-prose jd-prose--collapsible" id="jd-desc-content">${descHtml}</div>
          <button type="button" class="jd-expand-btn" id="jd-desc-expand" hidden aria-expanded="false">Xem thêm</button>
        </div>` : `<p class="jd-empty-text">Nhà tuyển dụng chưa cập nhật mô tả.</p>`}
      </section>
      ${reqHtml ? `<section class="jd-section" aria-labelledby="sec-req"><h2 class="jd-section-title" id="sec-req">Yêu cầu ứng viên</h2><div class="jd-prose">${reqHtml}</div></section>` : ""}
      ${benHtml ? `<section class="jd-section" aria-labelledby="sec-ben"><h2 class="jd-section-title" id="sec-ben">Quyền lợi được hưởng</h2><div class="jd-prose">${benHtml}</div></section>` : ""}
      ${skillsHtml ? `<section class="jd-section" aria-labelledby="sec-skills"><h2 class="jd-section-title" id="sec-skills">Kỹ năng yêu cầu</h2>${skillsHtml}</section>` : ""}
      ${facts.some((f) => f.val) ? `<section class="jd-section" aria-labelledby="sec-facts"><h2 class="jd-section-title" id="sec-facts">Thông tin chung</h2>${renderInfoGrid(facts, "Thông tin chi tiết")}</section>` : ""}
    </div>`;
}

export function renderJobDetailContent(job, options = {}) {
  const isDrawer = Boolean(options.isDrawer);
  if (isDrawer) {
    return `<article class="jd-drawer-view">${renderHeaderBlock(job, { isDrawer: true })}${renderBodySections(job)}</article>`;
  }
  return `
    <div class="jd-detail-layout">
      <div class="jd-main-column">
        ${renderHeaderBlock(job, { isDrawer: false })}
        ${renderBodySections(job)}
        <section class="jd-section jd-related-section" id="jd-related-section" aria-labelledby="sec-rel" hidden>
          <h2 class="jd-section-title" id="sec-rel">Việc làm liên quan</h2>
          <div class="jd-related-grid" id="jd-related-grid"></div>
        </section>
      </div>
      <aside class="jd-sidebar-column">
        <div class="jd-sidebar-card">
          <div class="jd-sidebar-salary-label">Mức lương hàng tháng</div>
          <div class="jd-sidebar-salary-val">${esc(formatSalary(job))}</div>
          ${renderActionBar(job)}
        </div>
      </aside>
    </div>`;
}
