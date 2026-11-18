/**
 * companyCard.js - Render thẻ Công ty công khai & các trạng thái lưới (< 180 dòng).
 * Mọi dữ liệu từ DB được gán bằng textContent để chống XSS tuyệt đối.
 */
import { companyUrl } from "../routes.js";
import {
  COMPANY_PALETTES,
  companyColorIndex,
  companyInitials,
  formatSalaryRangeShort,
  safeUrl,
} from "../utils/companyUtils.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

function createVerifiedIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "13");
  svg.setAttribute("height", "13");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2.4");
  svg.setAttribute("aria-hidden", "true");
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.setAttribute("points", "20 6 9 17 4 12");
  svg.appendChild(poly);
  return svg;
}

function buildLogoNode(comp) {
  const pal = COMPANY_PALETTES[companyColorIndex(comp.slug || comp.name)];
  const fallback = () => {
    const box = el("div", "company-logo-box company-logo-fallback", companyInitials(comp.name));
    box.style.setProperty("--comp-bg", pal.bg);
    box.style.setProperty("--comp-fg", pal.fg);
    box.style.setProperty("--comp-border", pal.border);
    box.style.setProperty("--comp-dark-bg", pal.darkBg);
    box.style.setProperty("--comp-dark-fg", pal.darkFg);
    box.setAttribute("aria-hidden", "true");
    return box;
  };
  const validLogo = safeUrl(comp.logo_url, ["https:"], { allowRelativeUploads: true });
  if (!validLogo) return fallback();

  const wrap = el("div", "company-logo-box");
  const img = document.createElement("img");
  img.className = "company-logo-img";
  img.width = 56;
  img.height = 56;
  img.loading = "lazy";
  img.alt = `Logo ${comp.name || "công ty"}`;
  img.src = validLogo;
  img.addEventListener("error", () => wrap.replaceWith(fallback()), { once: true });
  wrap.appendChild(img);
  return wrap;
}

export function createCompanyCardElement(comp) {
  const card = el("a", "company-card");
  card.href = companyUrl(comp.slug || "");

  const top = el("div", "company-card-top");
  top.appendChild(buildLogoNode(comp));

  const info = el("div", "company-card-info");
  const titleRow = el("div", "company-card-title-row");
  const nameEl = el("h2", "company-card-name", comp.name || "Doanh nghiệp");
  nameEl.title = comp.name || "";
  titleRow.appendChild(nameEl);
  if (comp.is_verified === true) {
    const badge = el("span", "company-verified-badge");
    badge.title = "Doanh nghiệp đã được xác minh thông tin pháp lý trên TechRecruit";
    badge.appendChild(createVerifiedIcon());
    badge.appendChild(document.createTextNode("Đã xác minh"));
    titleRow.appendChild(badge);
  }
  info.appendChild(titleRow);

  const metaParts = [comp.industry?.name, comp.location].filter(Boolean);
  const metaText = metaParts.join(" · ") || "Việt Nam";
  const metaEl = el("p", "company-card-meta", metaText);
  metaEl.title = metaText;
  info.appendChild(metaEl);
  top.appendChild(info);
  card.appendChild(top);

  const skills = Array.isArray(comp.top_skills) ? comp.top_skills.slice(0, 3) : [];
  const skillsRow = el("div", "company-card-skills");
  skills.forEach((s) => skillsRow.appendChild(el("span", "company-skill-chip", s)));
  card.appendChild(skillsRow);

  const footer = el("div", "company-card-footer");
  const openJobs = Number(comp.open_jobs || 0);
  if (openJobs > 0) {
    const jobsStat = el("span", "company-jobs-status is-hiring");
    jobsStat.appendChild(el("span", "company-hiring-dot"));
    jobsStat.appendChild(document.createTextNode(`${openJobs} vị trí đang tuyển`));
    footer.appendChild(jobsStat);
  } else {
    footer.appendChild(el("span", "company-jobs-status is-idle", "Chưa có vị trí đang tuyển"));
  }

  const salaryTxt = formatSalaryRangeShort(comp.salary);
  if (salaryTxt && openJobs > 0) {
    footer.appendChild(el("span", "company-card-salary", `Lương ${salaryTxt}`));
  }
  card.appendChild(footer);
  return card;
}

export function renderCompanySkeletons(container, count = 6) {
  container.replaceChildren();
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i += 1) {
    const sk = el("div", "company-card company-card-skeleton");
    sk.setAttribute("aria-hidden", "true");
    sk.innerHTML =
      `<div class="company-card-top">` +
      `<div class="job-skeleton-pulse sk-logo"></div>` +
      `<div class="company-card-info"><div class="job-skeleton-pulse sk-line-lg"></div><div class="job-skeleton-pulse sk-line-sm"></div></div>` +
      `</div>` +
      `<div class="company-card-skills"><div class="job-skeleton-pulse sk-chip"></div><div class="job-skeleton-pulse sk-chip"></div></div>` +
      `<div class="company-card-footer"><div class="job-skeleton-pulse sk-foot"></div></div>`;
    frag.appendChild(sk);
  }
  container.appendChild(frag);
}

export function renderCompanyEmptyState(container, state, facets, onRemoveFilter, onResetAll) {
  container.replaceChildren();
  const box = el("div", "companies-state-box");
  box.appendChild(el("h2", "companies-state-title", "Không tìm thấy công ty phù hợp"));
  box.appendChild(el("p", "companies-state-desc", "Thử bỏ bớt điều kiện lọc dưới đây hoặc xóa toàn bộ bộ lọc."));

  const relaxWrap = el("div", "companies-empty-actions");
  const hints = [];
  const sumFacet = (arr) => (Array.isArray(arr) ? arr.reduce((s, x) => s + Number(x.count || 0), 0) : 0);
  if (state.industry) hints.push({ key: "industry", label: `Bỏ lọc Ngành (${sumFacet(facets?.industry)})` });
  if (state.location) hints.push({ key: "location", label: `Bỏ lọc Địa điểm (${sumFacet(facets?.location)})` });
  if (state.size) hints.push({ key: "size", label: `Bỏ lọc Quy mô (${sumFacet(facets?.size)})` });
  if (state.q) hints.push({ key: "q", label: "Bỏ từ khóa tìm kiếm" });
  if (state.hiring === 1) hints.push({ key: "hiring", label: "Xem cả công ty chưa tuyển" });

  hints.forEach((h) => {
    const btn = el("button", "btn btn-sm btn-outline", h.label);
    btn.type = "button";
    btn.addEventListener("click", () => onRemoveFilter?.(h.key));
    relaxWrap.appendChild(btn);
  });

  const resetBtn = el("button", "btn btn-sm btn-primary", "Xóa bộ lọc");
  resetBtn.type = "button";
  resetBtn.id = "companies-reset-btn";
  resetBtn.addEventListener("click", () => onResetAll?.());
  relaxWrap.appendChild(resetBtn);
  box.appendChild(relaxWrap);
  container.appendChild(box);
}

export function renderCompanyErrorState(container, onRetry) {
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
