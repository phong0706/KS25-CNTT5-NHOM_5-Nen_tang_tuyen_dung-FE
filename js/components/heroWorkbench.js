/**
 * heroWorkbench.js - Quản lý khối việc làm mới nhất tại Hero trang chủ (/index.html)
 * 100% dữ liệu thật từ backend, không khung giả mockup, không logo chữ cái giả lập.
 * Tuân thủ techrecruit-rules: < 200 dòng, escape dữ liệu, không hardcode.
 */
import { formatSalary } from "./jobCard.js";
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
      <div class="wb-job-info" style="display:flex;flex-direction:column;gap:6px;width:100%;">
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

    const hasLogo = typeof job.company_logo === "string" && job.company_logo.trim().length > 0;
    const logoHtml = hasLogo
      ? `<img src="${esc(job.company_logo)}" alt="Logo ${esc(job.company_name)}" class="wb-comp-logo-img" width="32" height="32" loading="lazy">`
      : "";
    const compEl = compUrl
      ? `<a href="${esc(compUrl)}" class="wb-comp-name" tabindex="0">${esc(job.company_name || "Doanh nghiệp")}</a>`
      : `<span class="wb-comp-name">${esc(job.company_name || "Doanh nghiệp")}</span>`;

    return `
      <article class="wb-job-item is-clickable ${isFirst ? "hero-float--job" : ""}" ${isFirst ? 'id="hero-float-job"' : ""} data-job-url="${esc(jobUrl)}">
        ${logoHtml ? (compUrl ? `<a href="${esc(compUrl)}" class="wb-logo-link" title="Xem công ty ${esc(job.company_name)}" tabindex="0">${logoHtml}</a>` : `<span class="wb-logo-link">${logoHtml}</span>`) : ""}
        <div class="wb-job-info ${isFirst ? "hero-float-body" : ""}">
          <div class="wb-job-row1">
            <h3 class="wb-job-title ${isFirst ? "hero-float-title" : ""}" ${isFirst ? 'id="hero-float-job-title"' : ""}>
              <a href="${esc(jobUrl)}" class="wb-job-link" tabindex="0">${esc(cleanTitle)}</a>
            </h3>
            ${job.is_featured ? '<span class="wb-featured-badge">Nổi bật</span>' : ""}
            <span class="wb-job-sal ${isFirst ? "hero-float-salary" : ""}" ${isFirst ? 'id="hero-float-job-salary"' : ""}>${esc(formatSalary(job))}</span>
          </div>
          <div class="wb-job-row2">
            ${compEl}
            <span class="wb-sep" aria-hidden="true">•</span>
            <span class="wb-loc">${esc(job.location || "Toàn quốc")}</span>
            ${job.work_type ? `<span class="wb-sep" aria-hidden="true">•</span><span class="wb-work-type">${esc(job.work_type)}</span>` : ""}
          </div>
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
