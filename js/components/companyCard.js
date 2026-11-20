/**
 * companyCard.js - Component thẻ Công ty dùng chung (< 120 dòng).
 */
import { companyUrl } from "../routes.js";
import { createCompanyLogoElement } from "./companyLogo.js";
import { formatSalaryRangeShort } from "../utils/companyUtils.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function createVerifiedIcon() {
  const icon = el("span", "company-verified-icon");
  icon.title = "Doanh nghiệp đã xác minh";
  icon.setAttribute("aria-label", "Đã xác minh");
  icon.setAttribute("role", "img");
  icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor"/><polyline points="6 10 9 13 14 7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return icon;
}

export function createCompanyCardElement(comp, { compact = false } = {}) {
  const card = el("a", compact ? "company-card is-compact" : "company-card");
  card.href = companyUrl(comp?.slug || comp?.id || "");
  const head = el("div", "company-card-top");
  head.appendChild(createCompanyLogoElement(comp, { size: compact ? 40 : 56 }));
  const info = el("div", "company-card-info");
  const nameEl = el("h2", "company-card-name", comp?.name || "Doanh nghiệp");
  nameEl.title = comp?.name || "";
  info.appendChild(nameEl);
  const metaParts = [comp?.industry?.name, comp?.location].filter(Boolean);
  const metaText = metaParts.join(" · ") || "Việt Nam";
  const metaEl = el("p", "company-card-meta", metaText);
  metaEl.title = metaText;
  info.appendChild(metaEl);
  head.appendChild(info);
  if (comp?.is_verified) head.appendChild(createVerifiedIcon());
  card.appendChild(head);

  if (!compact) {
    const rawSkills = Array.isArray(comp?.top_skills) ? comp.top_skills : [];
    const skillsRow = el("div", "company-card-skills");
    rawSkills.slice(0, 3).forEach((s) => skillsRow.appendChild(el("span", "company-skill-chip", s)));
    if (rawSkills.length > 3) skillsRow.appendChild(el("span", "company-skill-chip company-skill-more", `+${rawSkills.length - 3}`));
    card.appendChild(skillsRow);
  }

  const footer = el("div", "company-card-footer");
  const openJobs = Number(comp?.open_jobs ?? comp?.job_count ?? 0);
  const jobsStat = el("span", `company-jobs-status ${openJobs > 0 ? "is-hiring" : "is-idle"}`);
  if (openJobs > 0) {
    jobsStat.appendChild(el("span", "company-hiring-dot"));
    jobsStat.appendChild(document.createTextNode(`${openJobs} vị trí đang tuyển`));
  } else { jobsStat.textContent = "Chưa có vị trí đang tuyển"; }
  footer.appendChild(jobsStat);
  if (!compact && openJobs > 0) {
    const salaryTxt = formatSalaryRangeShort(comp?.salary);
    if (salaryTxt) footer.appendChild(el("span", "company-card-salary", salaryTxt));
  }
  card.appendChild(footer);
  return card;
}

export function renderCompanySkeletons(container, count = 6, compact = false) {
  if (!container) return;
  container.replaceChildren();
  for (let i = 0; i < count; i += 1) {
    const sk = el("div", `company-card company-card-skeleton ${compact ? "is-compact" : ""}`);
    sk.setAttribute("aria-hidden", "true");
    sk.innerHTML = `<div class="company-card-top"><div class="job-skeleton-pulse sk-logo"></div><div class="company-card-info"><div class="job-skeleton-pulse sk-line-lg"></div><div class="job-skeleton-pulse sk-line-sm"></div></div></div>${compact ? "" : '<div class="company-card-skills"><div class="job-skeleton-pulse sk-chip"></div><div class="job-skeleton-pulse sk-chip"></div></div>'}<div class="company-card-footer"><div class="job-skeleton-pulse sk-foot"></div></div>`;
    container.appendChild(sk);
  }
}

export function renderCompanyEmptyState(container, state, facets, onRemoveFilter, onResetAll) {
  if (!container) return;
  container.replaceChildren();
  const box = el("div", "companies-state-box");
  box.appendChild(el("h2", "companies-state-title", "Không tìm thấy công ty phù hợp"));
  box.appendChild(el("p", "companies-state-desc", "Thử bỏ bớt điều kiện lọc dưới đây hoặc xóa toàn bộ bộ lọc."));
  const wrap = el("div", "companies-empty-actions");
  const sumFacet = (arr) => (Array.isArray(arr) ? arr.reduce((s, x) => s + Number(x.count || 0), 0) : 0);
  const hints = [
    state?.industry && ["industry", `Bỏ lọc Ngành (${sumFacet(facets?.industry)})`],
    state?.location && ["location", `Bỏ lọc Địa điểm (${sumFacet(facets?.location)})`],
    state?.size && ["size", `Bỏ lọc Quy mô (${sumFacet(facets?.size)})`],
    state?.q && ["q", "Bỏ từ khóa tìm kiếm"],
    state?.hiring === 1 && ["hiring", "Xem cả công ty chưa tuyển"]
  ].filter(Boolean);
  hints.forEach(([key, label]) => {
    const b = el("button", "btn btn-sm btn-outline", label);
    b.type = "button";
    b.addEventListener("click", () => onRemoveFilter?.(key));
    wrap.appendChild(b);
  });
  const resetBtn = el("button", "btn btn-sm btn-primary", "Xóa bộ lọc");
  resetBtn.type = "button";
  resetBtn.id = "companies-reset-btn";
  resetBtn.addEventListener("click", () => onResetAll?.());
  wrap.appendChild(resetBtn);
  box.appendChild(wrap);
  container.appendChild(box);
}

export function renderCompanyErrorState(container, onRetry) {
  if (!container) return;
  container.replaceChildren();
  const box = el("div", "companies-state-box is-error");
  box.appendChild(el("h2", "companies-state-title", "Không thể tải danh sách công ty"));
  box.appendChild(el("p", "companies-state-desc", "Kết nối tới máy chủ gặp sự cố. Vui lòng thử lại."));
  const retryBtn = el("button", "btn btn-primary", "Thử lại");
  retryBtn.type = "button";
  retryBtn.id = "companies-retry-btn";
  retryBtn.addEventListener("click", () => onRetry?.());
  box.appendChild(retryBtn);
  container.appendChild(box);
}
