/**
 * Component lưới 6 ngành nghề nổi bật (lấy từ GET /api/meta/categories).
 */
import { buildJobsUrl } from "../utils/urlState.js";

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

const CATEGORY_ICONS = {
  server: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="8" rx="2"></rect><rect x="2" y="14" width="20" height="8" rx="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`,
  layout: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
  cpu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"></path></svg>`,
  cloud: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
  smartphone: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>`,
};

export function renderCategorySkeletons(container, count = 6) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count })
    .map(() => `<div class="category-card" aria-hidden="true"><div class="job-skeleton-pulse" style="width:40px;height:40px;border-radius:10px;"></div><div class="job-skeleton-pulse" style="width:70%;height:16px;margin-top:8px;"></div><div class="job-skeleton-pulse" style="width:40%;height:13px;"></div></div>`)
    .join("");
}

export function renderCategoryGrid(container, categories) {
  if (!container) return;
  container.innerHTML = categories
    .slice(0, 6)
    .map((cat) => {
      const iconSvg = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS.server;
      const href = buildJobsUrl({ category: cat.slug }, "pages/jobs.html");
      return `
        <a href="${escapeText(href)}" class="category-card">
          <div class="category-icon">${iconSvg}</div>
          <div class="category-name">${escapeText(cat.name)}</div>
          <div class="category-count">${Number(cat.job_count || 0)} việc làm</div>
        </a>
      `;
    })
    .join("");
}

