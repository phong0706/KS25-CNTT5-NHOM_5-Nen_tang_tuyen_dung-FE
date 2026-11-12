/**
 * Component lưới công ty nổi bật (lấy từ GET /api/companies/featured).
 */
import { getCompanyLogo } from "./jobCard.js";
import { buildJobsUrl } from "../utils/urlState.js";

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function renderCompanySkeletons(container, count = 4) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count })
    .map(() => `<div class="company-card" aria-hidden="true"><div class="job-skeleton-pulse" style="width:48px;height:48px;border-radius:10px;"></div><div style="flex:1;"><div class="job-skeleton-pulse" style="width:65%;height:16px;"></div><div class="job-skeleton-pulse" style="width:45%;height:13px;margin-top:6px;"></div></div></div>`)
    .join("");
}

export function renderCompanyGrid(container, companies) {
  if (!container) return;
  container.innerHTML = companies
    .slice(0, 4)
    .map((comp) => {
      const href = buildJobsUrl({ company_id: comp.id }, "pages/jobs.html");
      return `
        <a href="${escapeText(href)}" class="company-card">
          ${getCompanyLogo(comp.name, "company-logo-box")}
          <div class="company-card-info">
            <div class="company-card-name">${escapeText(comp.name)}</div>
            <div class="company-card-jobs">${Number(comp.job_count || 0)} vị trí đang tuyển</div>
          </div>
        </a>
      `;
    })
    .join("");
}

