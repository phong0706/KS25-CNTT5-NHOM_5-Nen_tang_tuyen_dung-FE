/**
 * 4 Mẫu CV tự thiết kế: Đơn giản (simple), Ấn tượng (creative), Chuyên nghiệp (professional), Học thuật (academic).
 * Chỉ mẫu 1 cột văn bản ngữ nghĩa thật mới có nhãn is_ats: true.
 */
import { safeEscape, renderLinesAsList, formatMonthDisplay, getTemplateMeta } from "./cvRenderHelpers.js";

export const CV_TEMPLATES = [
  { slug: "simple", ...getTemplateMeta("simple") },
  { slug: "creative", ...getTemplateMeta("creative") },
  { slug: "professional", ...getTemplateMeta("professional") },
  { slug: "academic", ...getTemplateMeta("academic") },
];

function renderContacts(data) {
  const parts = [];
  if (data.email) parts.push(`<span>✉ ${safeEscape(data.email)}</span>`);
  if (data.phone) parts.push(`<span>☎ ${safeEscape(data.phone)}</span>`);
  if (data.location) parts.push(`<span>📍 ${safeEscape(data.location)}</span>`);
  if (data.linkedin_url) parts.push(`<span>🔗 ${safeEscape(data.linkedin_url)}</span>`);
  if (data.github_url) parts.push(`<span>💻 ${safeEscape(data.github_url)}</span>`);
  return parts.join('<span class="cv-sep">•</span>');
}

export function renderSimple(d) {
  const expHtml = (d.experiences || []).map((e) => `
    <article class="cv-item cv-avoid-break">
      <div class="cv-item-head">
        <h3 class="cv-item-title">${safeEscape(e.title)} <span class="cv-item-sub">| ${safeEscape(e.company)}</span></h3>
        <span class="cv-item-date">${formatMonthDisplay(e.start_month)} – ${e.is_current ? "Hiện tại" : formatMonthDisplay(e.end_month)}</span>
      </div>
      ${renderLinesAsList(e.description)}
    </article>`).join("");

  const eduHtml = (d.educations || []).map((e) => `
    <article class="cv-item cv-avoid-break">
      <div class="cv-item-head">
        <h3 class="cv-item-title">${safeEscape(e.school)}</h3>
        <span class="cv-item-date">${safeEscape(e.start_year)} – ${safeEscape(e.end_year || "Nay")}</span>
      </div>
      <div class="cv-item-meta">${safeEscape(e.degree ? e.degree + " - " : "")}${safeEscape(e.major)}</div>
      ${e.description ? `<p class="cv-desc">${safeEscape(e.description)}</p>` : ""}
    </article>`).join("");

  const skillsHtml = (d.skills || []).map((s) => `<span class="cv-skill-tag">${safeEscape(s)}</span>`).join("");

  return `
    <div class="cv-doc cv-tpl-simple cv-page-print">
      <header class="cv-header-simple cv-avoid-break">
        <h1 class="cv-name">${safeEscape(d.full_name || "Họ và Tên")}</h1>
        <div class="cv-headline">${safeEscape(d.headline || "Vị trí ứng tuyển")}</div>
        <div class="cv-contacts">${renderContacts(d)}</div>
      </header>
      ${d.bio ? `<section class="cv-section cv-avoid-break"><h2 class="cv-sec-title">Giới thiệu bản thân</h2><p class="cv-bio">${safeEscape(d.bio)}</p></section>` : ""}
      ${skillsHtml ? `<section class="cv-section cv-avoid-break"><h2 class="cv-sec-title">Kỹ năng chuyên môn</h2><div class="cv-skills-cloud">${skillsHtml}</div></section>` : ""}
      ${expHtml ? `<section class="cv-section"><h2 class="cv-sec-title">Kinh nghiệm làm việc</h2>${expHtml}</section>` : ""}
      ${eduHtml ? `<section class="cv-section"><h2 class="cv-sec-title">Học vấn & Bằng cấp</h2>${eduHtml}</section>` : ""}
    </div>`;
}

export function renderCreative(d) {
  const skillsList = (d.skills || []).map((s) => `<li class="cv-side-skill">• ${safeEscape(s)}</li>`).join("");
  const expHtml = (d.experiences || []).map((e) => `
    <article class="cv-item cv-avoid-break">
      <div class="cv-item-head">
        <h3 class="cv-item-title">${safeEscape(e.title)}</h3>
        <span class="cv-item-date">${formatMonthDisplay(e.start_month)} – ${e.is_current ? "Hiện tại" : formatMonthDisplay(e.end_month)}</span>
      </div>
      <div class="cv-item-sub-creative">${safeEscape(e.company)}</div>
      ${renderLinesAsList(e.description)}
    </article>`).join("");

  const eduHtml = (d.educations || []).map((e) => `
    <article class="cv-item cv-avoid-break">
      <h3 class="cv-item-title">${safeEscape(e.school)}</h3>
      <div class="cv-item-meta">${safeEscape(e.major)} (${safeEscape(e.start_year)} – ${safeEscape(e.end_year || "Nay")})</div>
      ${e.description ? `<p class="cv-desc">${safeEscape(e.description)}</p>` : ""}
    </article>`).join("");

  return `
    <div class="cv-doc cv-tpl-creative cv-page-print">
      <aside class="cv-creative-sidebar">
        <div class="cv-avatar-box">
          <div class="cv-avatar-placeholder">${safeEscape(d.full_name ? d.full_name.charAt(0) : "C")}</div>
        </div>
        <h2 class="cv-side-title">Liên hệ</h2>
        <div class="cv-side-contacts">
          ${d.email ? `<div><strong>Email:</strong><br>${safeEscape(d.email)}</div>` : ""}
          ${d.phone ? `<div><strong>ĐT:</strong><br>${safeEscape(d.phone)}</div>` : ""}
          ${d.location ? `<div><strong>Đ/c:</strong><br>${safeEscape(d.location)}</div>` : ""}
          ${d.github_url ? `<div><strong>GitHub:</strong><br>${safeEscape(d.github_url)}</div>` : ""}
        </div>
        <h2 class="cv-side-title">Kỹ năng</h2>
        <ul class="cv-side-skills">${skillsList}</ul>
      </aside>
      <main class="cv-creative-main">
        <header class="cv-creative-header cv-avoid-break">
          <h1 class="cv-name">${safeEscape(d.full_name || "Họ và Tên")}</h1>
          <div class="cv-headline">${safeEscape(d.headline || "Vị trí chuyên môn")}</div>
          ${d.bio ? `<p class="cv-bio">${safeEscape(d.bio)}</p>` : ""}
        </header>
        ${expHtml ? `<section class="cv-section"><h2 class="cv-sec-title">Kinh nghiệm làm việc</h2>${expHtml}</section>` : ""}
        ${eduHtml ? `<section class="cv-section"><h2 class="cv-sec-title">Học vấn & Đào tạo</h2>${eduHtml}</section>` : ""}
      </main>
    </div>`;
}

export function renderProfessional(d) {
  const skillsHtml = (d.skills || []).map((s) => `<span class="cv-pro-badge">${safeEscape(s)}</span>`).join("");
  const expHtml = (d.experiences || []).map((e) => `
    <article class="cv-pro-timeline-item cv-avoid-break">
      <div class="cv-pro-dot"></div>
      <div class="cv-item-head">
        <h3 class="cv-item-title">${safeEscape(e.title)} – <span class="cv-pro-company">${safeEscape(e.company)}</span></h3>
        <span class="cv-item-date">${formatMonthDisplay(e.start_month)} – ${e.is_current ? "Hiện tại" : formatMonthDisplay(e.end_month)}</span>
      </div>
      ${renderLinesAsList(e.description)}
    </article>`).join("");

  const eduHtml = (d.educations || []).map((e) => `
    <article class="cv-pro-timeline-item cv-avoid-break">
      <div class="cv-pro-dot"></div>
      <div class="cv-item-head">
        <h3 class="cv-item-title">${safeEscape(e.school)}</h3>
        <span class="cv-item-date">${safeEscape(e.start_year)} – ${safeEscape(e.end_year || "Nay")}</span>
      </div>
      <div class="cv-item-meta">${safeEscape(e.degree ? e.degree + " · " : "")}${safeEscape(e.major)}</div>
      ${e.description ? `<p class="cv-desc">${safeEscape(e.description)}</p>` : ""}
    </article>`).join("");

  return `
    <div class="cv-doc cv-tpl-professional cv-page-print">
      <header class="cv-pro-banner cv-avoid-break">
        <div class="cv-pro-top">
          <h1 class="cv-name">${safeEscape(d.full_name || "Họ và Tên")}</h1>
          <div class="cv-headline">${safeEscape(d.headline || "Vị trí chuyên môn")}</div>
        </div>
        <div class="cv-pro-contacts">${renderContacts(d)}</div>
      </header>
      ${d.bio ? `<section class="cv-section cv-avoid-break"><h2 class="cv-sec-title">Tóm tắt năng lực</h2><p class="cv-bio">${safeEscape(d.bio)}</p></section>` : ""}
      ${skillsHtml ? `<section class="cv-section cv-avoid-break"><h2 class="cv-sec-title">Năng lực cốt lõi</h2><div class="cv-pro-badges">${skillsHtml}</div></section>` : ""}
      ${expHtml ? `<section class="cv-section"><h2 class="cv-sec-title">Hành trình sự nghiệp</h2><div class="cv-pro-timeline">${expHtml}</div></section>` : ""}
      ${eduHtml ? `<section class="cv-section"><h2 class="cv-sec-title">Nền tảng học vấn</h2><div class="cv-pro-timeline">${eduHtml}</div></section>` : ""}
    </div>`;
}

export function renderAcademic(d) {
  const eduHtml = (d.educations || []).map((e) => `
    <article class="cv-item cv-avoid-break">
      <div class="cv-item-head">
        <h3 class="cv-academic-title">${safeEscape(e.school)}</h3>
        <span class="cv-item-date">${safeEscape(e.start_year)} – ${safeEscape(e.end_year || "Hiện tại")}</span>
      </div>
      <div class="cv-academic-meta"><strong>${safeEscape(e.degree || "Bằng cấp")}:</strong> ${safeEscape(e.major)}</div>
      ${e.description ? `<p class="cv-desc">${safeEscape(e.description)}</p>` : ""}
    </article>`).join("");

  const expHtml = (d.experiences || []).map((e) => `
    <article class="cv-item cv-avoid-break">
      <div class="cv-item-head">
        <h3 class="cv-academic-title">${safeEscape(e.title)}, <em>${safeEscape(e.company)}</em></h3>
        <span class="cv-item-date">${formatMonthDisplay(e.start_month)} – ${e.is_current ? "Hiện tại" : formatMonthDisplay(e.end_month)}</span>
      </div>
      ${renderLinesAsList(e.description)}
    </article>`).join("");

  const skillsHtml = (d.skills || []).map((s) => safeEscape(s)).join(" • ");

  return `
    <div class="cv-doc cv-tpl-academic cv-page-print">
      <header class="cv-academic-header cv-avoid-break">
        <h1 class="cv-name">${safeEscape(d.full_name || "Họ và Tên")}</h1>
        <div class="cv-headline">${safeEscape(d.headline || "Chuyên ngành nghiên cứu / Kỹ thuật")}</div>
        <div class="cv-contacts">${renderContacts(d)}</div>
      </header>
      ${d.bio ? `<section class="cv-section cv-avoid-break"><h2 class="cv-sec-title">Giới thiệu bản thân / Mục tiêu</h2><p class="cv-bio">${safeEscape(d.bio)}</p></section>` : ""}
      ${skillsHtml ? `<section class="cv-section cv-avoid-break"><h2 class="cv-sec-title">I. Kỹ năng & Công cụ chuyên ngành</h2><p class="cv-academic-skills">${skillsHtml}</p></section>` : ""}
      ${expHtml ? `<section class="cv-section"><h2 class="cv-sec-title">II. Kinh nghiệm làm việc & Thực tế</h2>${expHtml}</section>` : ""}
      ${eduHtml ? `<section class="cv-section"><h2 class="cv-sec-title">III. Học vấn & Chứng chỉ</h2>${eduHtml}</section>` : ""}
    </div>`;
}

export function renderCvDocument(templateSlug, data) {
  switch (templateSlug) {
    case "creative": return renderCreative(data);
    case "professional": return renderProfessional(data);
    case "academic": return renderAcademic(data);
    case "simple":
    default:
      return renderSimple(data);
  }
}
