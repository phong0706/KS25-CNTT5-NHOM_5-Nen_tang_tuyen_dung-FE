/**
 * heroWorkbench.js - Quản lý khối việc làm mới nhất tại Hero trang chủ (/index.html)
 * 100% dữ liệu thật từ backend, không khung giả mockup, không logo chữ cái giả lập.
 * Tuân thủ techrecruit-rules: < 200 dòng, escape dữ liệu, không hardcode.
 */
import { formatSalary, formatRelativeTime } from "./jobCard.js";
import { renderCompanyLogo } from "./companyLogo.js";
import { jobDetailUrl, companyUrl, jobsUrl } from "../routes.js";

function esc(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function updateHeroTimestamp(serverTime) {
  const el = document.getElementById("hero-last-updated");
  if (!el) return;
  const d = serverTime ? new Date(serverTime) : new Date();
  const timeStr = !isNaN(d.getTime())
    ? d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";
  el.textContent = timeStr ? `Cập nhật ${timeStr}` : "Cập nhật hôm nay";
}

export function renderHeroWorkbenchSkeletons(container, count = 3) {
  if (!container) return;
  const items = Array.from({ length: count }, () => `
    <div class="wb-job-item wb-skeleton-item" aria-hidden="true">
      <div class="wb-skeleton-box" style="width:40px;height:40px;border-radius:max(4px, 8%);"></div>
      <div class="wb-job-col-content" style="display:flex;flex-direction:column;gap:5px;min-width:0;">
        <div class="wb-skeleton-box wb-sk-title" style="width:70%;height:14px;"></div>
        <div class="wb-skeleton-box wb-sk-meta" style="width:50%;height:11px;"></div>
        <div class="wb-skeleton-box wb-sk-meta" style="width:40%;height:11px;"></div>
      </div>
      <div class="wb-skeleton-box wb-sk-sal" style="width:48px;height:14px;"></div>
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
      <a href="${jobsUrl()}" class="btn btn-sm btn-outline">Xem tất cả việc làm</a>
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
    const jobUrl = jobDetailUrl(job.id);
    const compUrl = job.company_slug ? companyUrl(job.company_slug) : "";
    const cleanTitle = (job.title || "").replace("[Seed]", "").trim();
    const isFirst = idx === 0;

    const logoComp = {
      name: job.company_name,
      logo_url: job.company_logo || job.logo_url || job.logo,
    };
    const logoHtml = renderCompanyLogo(logoComp, { size: 40, className: "wb-comp-logo" });
    const compEl = compUrl
      ? `<a href="${esc(compUrl)}" class="wb-comp-name" tabindex="0">${esc(job.company_name || "Doanh nghiệp")}</a>`
      : `<span class="wb-comp-name">${esc(job.company_name || "Doanh nghiệp")}</span>`;
    const locPart = job.location ? `<span class="wb-loc">${esc(job.location)}</span>` : "";
    const line1Parts = [compEl, locPart].filter(Boolean);
    const line1Html = line1Parts.join('&nbsp;<span class="wb-sep" aria-hidden="true">·</span>&nbsp;');

    const workPart = job.work_type ? `<span class="wb-work-type">${esc(job.work_type)}</span>` : "";
    const timeInfo = formatRelativeTime(job.published_at || job.created_at);
    const timePart = timeInfo?.text ? `<span class="wb-time">${esc(timeInfo.text)}</span>` : "";
    const line2Parts = [workPart, timePart].filter(Boolean);
    const line2Html = line2Parts.join('&nbsp;<span class="wb-sep" aria-hidden="true">·</span>&nbsp;');

    return `
      <article class="wb-job-item is-clickable ${isFirst ? "hero-float--job" : ""}" ${isFirst ? 'id="hero-float-job"' : ""} data-job-url="${esc(jobUrl)}">
        <div class="wb-job-col-logo">
          ${compUrl ? `<a href="${esc(compUrl)}" class="wb-logo-link" title="Xem công ty ${esc(job.company_name)}" tabindex="0">${logoHtml}</a>` : `<span class="wb-logo-link">${logoHtml}</span>`}
        </div>
        <div class="wb-job-col-content ${isFirst ? "hero-float-body" : ""}">
          <h3 class="wb-job-title ${isFirst ? "hero-float-title" : ""}" ${isFirst ? 'id="hero-float-job-title"' : ""}>
            <a href="${esc(jobUrl)}" class="wb-job-link" tabindex="0">${esc(cleanTitle)}</a>
          </h3>
          <div class="wb-job-meta-line1">${line1Html}</div>
          <div class="wb-job-meta-line2">${line2Html}</div>
        </div>
        <div class="wb-job-col-salary">
          <span class="wb-job-sal ${isFirst ? "hero-float-salary" : ""}" ${isFirst ? 'id="hero-float-job-salary"' : ""}>${esc(formatSalary(job))}</span>
        </div>
      </article>
    `;
  }).join("");

  container.innerHTML = html;

  container.querySelectorAll(".wb-job-item.is-clickable").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      const url = card.dataset.jobUrl;
      if (url) window.location.href = url;
    });
  });
}

export function renderHeroFooterStats(stats) {
  const linkEl = document.getElementById("hero-view-all-link");
  if (linkEl && stats?.total_published_jobs) {
    const total = new Intl.NumberFormat("vi-VN").format(stats.total_published_jobs);
    const span = linkEl.querySelector("span");
    if (span) span.textContent = `Xem tất cả ${total} việc làm IT`;
  }
}

export function renderHeroFilterChips(container, categories, onFilterChange) {
  if (!container) return;
  const validCats = Array.isArray(categories)
    ? categories.filter(c => Number(c.job_count) > 0).slice(0, 4)
    : [];

  const chips = [
    `<button type="button" class="wb-chip active" data-category="" role="tab" aria-selected="true">Tất cả IT</button>`,
    ...validCats.map(c => `<button type="button" class="wb-chip" data-category="${esc(c.slug)}" role="tab" aria-selected="false">${esc(c.name)}</button>`)
  ];
  container.innerHTML = chips.join("");

  container.querySelectorAll(".wb-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      container.querySelectorAll(".wb-chip").forEach(c => {
        c.classList.remove("active");
        c.setAttribute("aria-selected", "false");
      });
      chip.classList.add("active");
      chip.setAttribute("aria-selected", "true");
      onFilterChange?.(chip.dataset.category || "");
    });
  });
}

export function initHeroFilterChips(onFilterChange) {
  const chips = document.querySelectorAll(".wb-toolbar .wb-chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => {
        c.classList.remove("active");
        c.setAttribute("aria-selected", "false");
      });
      chip.classList.add("active");
      chip.setAttribute("aria-selected", "true");
      const cat = chip.dataset.category || chip.dataset.query || "";
      onFilterChange?.(cat);
    });
  });
}
