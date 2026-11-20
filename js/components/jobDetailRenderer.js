/**
 * jobDetailRenderer.js - Module render chi tiết việc làm dùng chung toàn site.
 * Tuân thủ techrecruit-rules, frontend-design, web-design-guidelines:
 *  - 1 hàm renderJobDetailContent phục vụ cả trang riêng và quick view.
 *  - Khối đầu: Tiêu đề, Doanh nghiệp (link), Logo qua renderCompanyLogo (72px).
 *  - Nút Ứng tuyển ngay + Lưu tin đặt 1 lần duy nhất ngay sau khối đầu.
 *  - 1 cột đọc trọng tâm <= 680px, danh sách có bullet ul/li chuẩn.
 *  - Kỹ năng là thẻ nhãn bấm được mở bộ lọc jobs.html?skills=...
 *  - Tuyệt đối không dùng tracked-out ALL-CAPS, không dấu "·", không "→".
 */
import { renderCompanyLogo } from "./companyLogo.js";
import { formatSalary } from "./jobCard.js";
import { companyUrl, jobsUrl, jobDetailUrl } from "../routes.js";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parseSkillsList(skills) {
  if (Array.isArray(skills)) {
    return skills.map((s) => String(s || "").trim()).filter(Boolean);
  }
  if (typeof skills === "string" && skills.trim()) {
    return skills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  }
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

export function renderDefinitionList(items, ariaLabel = "") {
  if (!Array.isArray(items) || !items.length) return "";
  const filtered = items.filter((it) => it.val && String(it.val).trim() && it.val !== "—");
  if (!filtered.length) return "";
  const ariaAttr = ariaLabel ? ` role="region" aria-label="${esc(ariaLabel)}"` : "";
  return `
    <dl class="jd-info-list"${ariaAttr}>
      ${filtered.map((it) => `
        <div class="jd-info-row">
          <dt class="jd-info-label">${esc(it.label)}</dt>
          <dd class="jd-info-value">${esc(it.val)}</dd>
        </div>
      `).join("")}
    </dl>`;
}

export function renderQuickStats(job) {
  const sal = formatSalary(job);
  const deadlineStr = formatDateVi(job.deadline);
  const items = [
    { label: "Mức lương", val: sal }, { label: "Địa điểm", val: job.location || "Toàn quốc" },
    { label: "Hình thức", val: job.type || job.work_type }, { label: "Cấp bậc", val: job.level },
    { label: "Hạn nộp hồ sơ", val: deadlineStr },
  ];
  return renderDefinitionList(items, "Thông tin nhanh việc làm");
}

export function renderJobDetailContent(job, options = {}) {
  const skills = parseSkillsList(job.skills);
  const descHtml = formatBulletContent(job.description);
  const reqHtml = formatBulletContent(job.requirements, true);
  const benHtml = formatBulletContent(job.benefits, true);
  const hasDescOrReq = Boolean(descHtml || reqHtml);

  const compUrl = job.company_slug ? companyUrl(job.company_slug) : "";
  const compName = job.company_name || "Doanh nghiệp tuyển dụng";
  const compEl = compUrl
    ? `<a href="${esc(compUrl)}" class="jd-company-link">${esc(compName)}</a>`
    : `<span class="jd-company-text">${esc(compName)}</span>`;

  // Logo lớn 72px chuẩn hóa
  const logoComp = {
    name: compName,
    logo_url: job.company_logo || job.logo_url || job.logo,
  };
  const logoHtml = renderCompanyLogo(logoComp, { size: 72, className: "jd-hero-logo" });

  const skillsHtml = skills.length
    ? `<div class="jd-skills-row" role="list" aria-label="Kỹ năng yêu cầu">${skills.map((s) => `
        <a href="${esc(jobsUrl())}?skills=${encodeURIComponent(s)}" class="jd-skill-pill" role="listitem" title="Tìm việc theo kỹ năng ${esc(s)}">${esc(s)}</a>
      `).join("")}</div>`
    : "";

  const facts = [
    { label: "Ngành nghề", val: job.category_name },
    { label: "Kinh nghiệm yêu cầu", val: job.experience || job.level },
    { label: "Số lượng tuyển", val: job.quantity ? `${job.quantity} nhân sự` : "" },
    { label: "Ngày đăng tin", val: formatDateVi(job.published_at || job.created_at) },
  ].filter((f) => f.val && f.val.trim() && f.val !== "—");

  return `
    <article class="jd-single-column">
      <!-- 1. KHỐI ĐẦU -->
      <header class="jd-hero-block">
        <div class="jd-hero-header">
          <div class="jd-hero-logo-box">${logoHtml}</div>
          <div class="jd-hero-title-group">
            <h1 class="jd-title" id="jd-main-title">${esc((job.title || "").replace("[Seed]", "").trim())}</h1>
            <p class="jd-company-row">Doanh nghiệp: ${compEl}</p>
          </div>
        </div>
        ${renderQuickStats(job)}
        <!-- NÚT ỨNG TUYỂN & LƯU TIN ĐẶT 1 LẦN DUY NHẤT -->
        <div class="jd-action-bar">
          <button type="button" class="btn btn-primary jd-cta-apply" id="jd-apply-btn" data-job-id="${job.id}">
            ${job.applied ? "Đã ứng tuyển" : "Ứng tuyển ngay"}
          </button>
          <button type="button" class="btn btn-outline jd-cta-save ${job.is_saved ? "is-saved" : ""}" id="jd-save-btn" data-job-id="${job.id}" aria-pressed="${job.is_saved ? "true" : "false"}">
            <span class="jd-save-icon" aria-hidden="true">${job.is_saved ? "★" : "☆"}</span>
            <span id="jd-save-label">${job.is_saved ? "Đã lưu tin" : "Lưu tin"}</span>
          </button>
        </div>
        <p class="jd-action-note" id="jd-action-note">${job.applied ? "Bạn đã nộp hồ sơ cho vị trí này." : "Ứng viên cần đăng nhập để nộp hồ sơ trực tuyến."}</p>
      </header>

      <!-- 2. THÂN BÀI -->
      <div class="jd-body-sections">
        ${!hasDescOrReq ? `<div class="jd-empty-notice"><p>Nhà tuyển dụng chưa cập nhật mô tả.</p></div>` : ""}

        ${descHtml ? `
          <section class="jd-section" aria-labelledby="sec-desc">
            <h2 class="jd-section-title" id="sec-desc">Mô tả công việc</h2>
            <div class="jd-prose-wrap" id="jd-desc-wrap">
              <div class="jd-prose jd-prose--collapsible" id="jd-desc-content">${descHtml}</div>
              <button type="button" class="jd-expand-btn" id="jd-desc-expand" hidden aria-expanded="false">Xem thêm</button>
            </div>
          </section>
        ` : ""}

        ${reqHtml ? `
          <section class="jd-section" aria-labelledby="sec-req">
            <h2 class="jd-section-title" id="sec-req">Yêu cầu ứng viên</h2>
            <div class="jd-prose">${reqHtml}</div>
          </section>
        ` : ""}

        ${benHtml ? `
          <section class="jd-section" aria-labelledby="sec-ben">
            <h2 class="jd-section-title" id="sec-ben">Quyền lợi được hưởng</h2>
            <div class="jd-prose">${benHtml}</div>
          </section>
        ` : ""}

        ${skillsHtml ? `
          <section class="jd-section" aria-labelledby="sec-skills">
            <h2 class="jd-section-title" id="sec-skills">Kỹ năng yêu cầu</h2>
            ${skillsHtml}
          </section>
        ` : ""}

        ${facts.length ? `
          <section class="jd-section" aria-labelledby="sec-facts">
            <h2 class="jd-section-title" id="sec-facts">Thông tin chung</h2>
            ${renderDefinitionList(facts, "Thông tin chung")}
          </section>
        ` : ""}

        <!-- KHỐI VIỆC LIÊN QUAN -->
        <section class="jd-section jd-related-section" id="jd-related-section" aria-labelledby="sec-rel" hidden>
          <h2 class="jd-section-title" id="sec-rel">Việc làm liên quan</h2>
          <div class="jd-related-grid" id="jd-related-grid"></div>
        </section>
      </div>
    </article>
  `;
}
