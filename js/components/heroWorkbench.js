/**
 * heroWorkbench.js - Quản lý Panel Live Feed tại Hero trang chủ (/index.html)
 * 100% dữ liệu thật từ backend qua window.api, xử lý bộ lọc chip, skeleton, error & empty.
 * Tuân thủ techrecruit-rules: < 200 dòng, không innerHTML dữ liệu thô, không hardcode số giả.
 */
import { formatSalary, getCompanyLogo } from "./jobCard.js";

function esc(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function renderHeroWorkbenchSkeletons(container, count = 3) {
  if (!container) return;
  const items = Array.from({ length: count }, () => `
    <div class="wb-job-item wb-skeleton-item" aria-hidden="true">
      <div class="wb-skeleton-box wb-sk-logo"></div>
      <div class="wb-job-info" style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;gap:8px;">
          <div class="wb-skeleton-box wb-sk-title"></div>
          <div class="wb-skeleton-box wb-sk-sal"></div>
        </div>
        <div class="wb-skeleton-box wb-sk-meta"></div>
      </div>
    </div>
  `).join("");
  container.innerHTML = items;
}

export function renderHeroWorkbenchError(container, message, onRetry) {
  if (!container) return;
  container.innerHTML = `
    <div class="wb-empty-box" role="alert">
      <p class="wb-empty-text">${esc(message || "Không thể tải danh sách việc làm từ máy chủ.")}</p>
      <button type="button" class="btn btn-sm btn-primary wb-retry-btn">Thử lại</button>
    </div>
  `;
  container.querySelector(".wb-retry-btn")?.addEventListener("click", () => onRetry?.());
}

export function renderHeroWorkbenchEmpty(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="wb-empty-box">
      <p class="wb-empty-text">Chưa có vị trí nào trong danh mục này.</p>
      <a href="pages/jobs.html" class="btn btn-sm btn-outline">Xem tất cả việc làm</a>
    </div>
  `;
}

export function renderHeroJobsList(container, jobs) {
  if (!container) return;
  if (!Array.isArray(jobs) || jobs.length === 0) {
    renderHeroWorkbenchEmpty(container);
    return;
  }

  const html = jobs.slice(0, 3).map((job, idx) => {
    const jobUrl = `pages/job-detail.html?id=${encodeURIComponent(job.id)}`;
    const compUrl = `pages/company.html?slug=${encodeURIComponent(job.company_id || "")}`;
    const cleanTitle = (job.title || "").replace("[Seed]", "").trim();
    const isFirst = idx === 0;

    return `
      <article class="wb-job-item is-clickable ${isFirst ? "hero-float--job" : ""}" ${isFirst ? 'id="hero-float-job"' : ""} data-job-url="${esc(jobUrl)}">
        <a href="${esc(compUrl)}" class="wb-logo-link" title="Xem công ty ${esc(job.company_name)}" tabindex="0" ${isFirst ? 'id="hero-float-job-logo"' : ""}>
          ${getCompanyLogo(job.company_name)}
        </a>
        <div class="wb-job-info ${isFirst ? "hero-float-body" : ""}">
          <div class="wb-job-row1">
            <h3 class="wb-job-title ${isFirst ? "hero-float-title" : ""}" ${isFirst ? 'id="hero-float-job-title"' : ""}>
              <a href="${esc(jobUrl)}" class="wb-job-link" tabindex="0">${esc(cleanTitle)}</a>
            </h3>
            <span class="wb-job-sal ${isFirst ? "hero-float-salary" : ""}" ${isFirst ? 'id="hero-float-job-salary"' : ""}>${esc(formatSalary(job))}</span>
          </div>
          <div class="wb-job-row2">
            <a href="${esc(compUrl)}" class="wb-comp-name" tabindex="0">${esc(job.company_name || "Doanh nghiệp")}</a>
            <span>•</span>
            <span class="wb-loc">${esc(job.location || "Toàn quốc")}</span>
            ${job.work_type ? `<span class="wb-tag">${esc(job.work_type)}</span>` : ""}
            ${isFirst ? `<span class="wb-tag wb-tag-live">Mới</span>` : ""}
          </div>
        </div>
      </article>
    `;
  }).join("");

  container.innerHTML = html;

  // Bấm vào bất kỳ đâu trên thẻ (ngoại trừ thẻ link bên trong) -> mở trang chi tiết việc làm thật
  container.querySelectorAll(".wb-job-item.is-clickable").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      const url = card.dataset.jobUrl;
      if (url) window.location.href = url;
    });
  });
}

export function renderHeroFooterStats(stats, companies) {
  const footerEl = document.querySelector(".wb-footer-stats");
  if (!footerEl) return;

  const totalJobs = Number(stats?.total_published_jobs || 0);
  const compCount = Number(stats?.total_companies || (Array.isArray(companies) ? companies.length : 0));
  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);
  const firstComp = Array.isArray(companies) && companies[0] ? companies[0].name : "TechRecruit";

  footerEl.innerHTML = `
    <a href="pages/jobs.html" class="wb-stat-pill-link" title="Xem toàn bộ ${fmt(totalJobs)} việc làm IT">
      <span class="wb-stat-val">${fmt(totalJobs)}</span>
      <span class="wb-stat-lbl">Việc làm IT mở</span>
    </a>
    <div class="wb-stat-sep" aria-hidden="true"></div>
    <a href="pages/companies.html" class="wb-stat-pill-link hero-float--companies" id="hero-float-companies" title="Xem danh sách ${compCount} doanh nghiệp">
      <div class="hero-float-avatars" id="hero-float-avatars" aria-hidden="true">
        ${getCompanyLogo(firstComp)}
      </div>
      <span class="hero-float-note" id="hero-float-note">${compCount} công ty đang tuyển</span>
    </a>
    <div class="wb-stat-sep" aria-hidden="true"></div>
    <a href="pages/jobs.html?sort=newest" class="wb-stat-pill-link" title="Luồng tuyển dụng trực tiếp">
      <span class="wb-stat-val" style="display:flex;align-items:center;gap:4px;">
        <span class="wb-live-pulse" aria-hidden="true"></span>Live Feed
      </span>
      <span class="wb-stat-lbl">Cập nhật liên tục</span>
    </a>
  `;
}

export function initHeroFilterChips(onFilterChange) {
  const chips = document.querySelectorAll(".wb-toolbar .wb-chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const query = chip.dataset.query || "";
      onFilterChange?.(query);
    });
  });
}
