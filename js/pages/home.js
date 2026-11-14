/**
 * Trang chủ (/index.html) - 100% dữ liệu động từ FastAPI + MySQL.
 * Không chứa mảng dữ liệu cứng; mọi số liệu, danh mục, việc làm, công ty lấy từ API.
 */
import { fetchCachedMeta, buildJobsUrl } from "../utils/urlState.js";
import { getCompanyLogo, formatSalary, renderJobCard, renderJobCardSkeletons } from "../components/jobCard.js";
import { renderCategoryGrid, renderCategorySkeletons } from "../components/categoryGrid.js";
import { renderCompanyGrid, renderCompanySkeletons } from "../components/companyGrid.js";
import { renderCompanyMarquee, bindMarqueePause } from "../components/companyMarquee.js";
import { renderSkillGrid } from "../components/skillGrid.js";

const SALARY_UI_PRESETS = [
  { value: "", label: "Tất cả mức lương", min: "", max: "" },
  { value: "under20", label: "Dưới 20 triệu", min: "", max: "20000000" },
  { value: "20-35", label: "20 - 35 triệu", min: "20000000", max: "35000000" },
  { value: "35-50", label: "35 - 50 triệu", min: "35000000", max: "50000000" },
  { value: "over50", label: "Trên 50 triệu", min: "50000000", max: "" },
];

let locationSelect = null;
let salarySelect = null;

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function setupEmployerCtaVisibility() {
  const ctaSection = document.getElementById("employer-cta-section");
  if (!ctaSection || !window.Auth) return;
  const isGuest = !window.Auth.isAuthenticated();
  const isEmployer = window.Auth.hasRole("recruiter", "employer");
  ctaSection.hidden = !(isGuest || isEmployer);
}

function setupHeroSearchForm() {
  const form = document.getElementById("home-search-form");
  const kwInput = document.getElementById("search-keyword");
  const salaryHost = document.getElementById("search-salary-host");

  if (salaryHost && window.CustomSelect) {
    salarySelect = new window.CustomSelect(salaryHost, {
      id: "search-salary",
      name: "salary",
      placeholder: "Mức lương",
      ariaLabel: "Mức lương",
      options: SALARY_UI_PRESETS.map((p) => ({ value: p.value, label: p.label })),
      value: "",
    });
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const salPreset = SALARY_UI_PRESETS.find((p) => p.value === (salarySelect?.value || "")) || SALARY_UI_PRESETS[0];
    const url = buildJobsUrl({
      q: kwInput?.value || "",
      location: locationSelect?.value || "",
      salary_min: salPreset.min,
      salary_max: salPreset.max,
    }, "pages/jobs.html");
    window.location.href = url;
  });
}

/**
 * Render 3 thẻ việc làm xếp chồng lệch nhau ở cột phải hero.
 * Dữ liệu lấy từ API /jobs (đã có sẵn trong loadHomeData) — không hardcode.
 */
function renderHeroStack(jobs) {
  const stack = document.getElementById("hero-stack");
  if (!stack) return;
  const cards = stack.querySelectorAll("[data-hero-slot]");
  const list = Array.isArray(jobs) ? jobs.slice(0, cards.length) : [];

  cards.forEach((card, i) => {
    const job = list[i];
    if (!job) {
      card.hidden = true;
      return;
    }
    card.hidden = false;

    // <a> bao toàn bộ card (a11y: điều hướng được bằng bàn phím).
    // KHÔNG move DOM node — chỉ set href, tránh làm hỏng cấu trúc cây.
    let link = card.querySelector("a.hero-stack-link");
    if (!link) {
      link = document.createElement("a");
      link.className = "hero-stack-link";
      // Bọc nội dung card (trừ chính nó) bằng <a>.
      while (card.firstChild) link.appendChild(card.firstChild);
      card.appendChild(link);
    }
    link.href = `pages/job-detail.html?id=${encodeURIComponent(job.id)}`;
    link.setAttribute("aria-label", `${job.title} tại ${job.company_name || "doanh nghiệp"}`);

    const logo = link.querySelector(".hero-stack-logo");
    const title = link.querySelector(".hero-stack-title");
    const company = link.querySelector(".hero-stack-company");
    const salary = link.querySelector(".hero-stack-salary");
    const tag = link.querySelector(".hero-stack-tag");

    if (logo) logo.innerHTML = getCompanyLogo(job.company_name);
    if (title) title.textContent = (job.title || "").replace("[Seed]", "").trim();
    if (company) company.textContent = job.company_name || "Doanh nghiệp";
    if (salary) salary.textContent = formatSalary(job);
    const skill = Array.isArray(job.skills) ? job.skills[0] : "";
    if (tag) {
      tag.textContent = skill || job.level || "";
      tag.hidden = !skill && !job.level;
    }

    // Kích hoạt reveal lúc load (1 orchestrated moment duy nhất của trang).
    card.classList.add("is-entering");
  });
}

/**
 * Dải số liệu dưới hero. Toàn bộ số liệu từ API, không hardcode.
 */
function renderHomeStats(stats, categories) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  const jobs = Number(stats?.total_published_jobs || 0);
  const companies = Number(stats?.total_companies || 0);
  const today = Number(stats?.today_new_jobs || 0);
  const cats = Array.isArray(categories) ? categories.length : 0;

  // Định dạng số có dấu phân cách nghìn theo chuẩn Việt Nam.
  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);

  set("stat-jobs", fmt(jobs));
  set("stat-companies", fmt(companies));
  set("stat-today", fmt(today));
  set("stat-categories", fmt(cats));

  // Dùng lại cho CTA cuối trang.
  set("cta-stat-companies", fmt(companies));
  set("cta-stat-jobs", fmt(jobs));
}

function renderSectionError(container, message, onRetry) {
  if (!container) return;
  container.innerHTML = `
    <div class="home-error-card" role="alert">
      <p class="home-error-text">${escapeText(message || "Không thể kết nối đến máy chủ.")}</p>
      <button type="button" class="btn btn-primary home-retry-btn">Thử lại</button>
    </div>
  `;
  container.querySelector(".home-retry-btn")?.addEventListener("click", () => onRetry?.());
}

function renderPopularSkillChips(skills) {
  const host = document.getElementById("quick-filter-chips");
  if (!host) return;
  if (!Array.isArray(skills) || skills.length === 0) {
    host.innerHTML = "";
    return;
  }
  const chips = [
    `<a href="pages/jobs.html" class="filter-chip active">Tất cả</a>`,
    ...skills.slice(0, 6).map((s) => `<a href="${escapeText(buildJobsUrl({ skills: s.name }, "pages/jobs.html"))}" class="filter-chip">${escapeText(s.name)}</a>`),
  ];
  host.innerHTML = chips.join("");
}

async function loadHomeData() {
  const catGrid = document.getElementById("categories-grid");
  const jobsGrid = document.getElementById("jobs-grid");
  const compGrid = document.getElementById("companies-grid");
  const locHost = document.getElementById("search-location-host");

  renderCategorySkeletons(catGrid, 6);
  renderJobCardSkeletons(jobsGrid, 8);
  renderCompanySkeletons(compGrid, 4);

  try {
    const [locations, skills, categories, jobsRes, companies, stats] = await Promise.all([
      fetchCachedMeta("/meta/locations"),
      fetchCachedMeta("/meta/skills"),
      fetchCachedMeta("/meta/categories"),
      window.api.get("/jobs", { page_size: 8, sort: "newest" }),
      window.api.get("/companies/featured", { limit: 12 }),
      window.api.get("/stats/home"),
    ]);

    if (locHost && window.CustomSelect) {
      locationSelect = new window.CustomSelect(locHost, {
        id: "search-location",
        name: "location",
        placeholder: "Địa điểm",
        ariaLabel: "Địa điểm",
        options: [{ value: "", label: "Tất cả địa điểm" }, ...locations.map((l) => ({ value: l.slug, label: l.name }))],
        value: "",
      });
    }

    renderPopularSkillChips(skills);
    renderHeroStack(jobsRes.items);
    renderHomeStats(stats, categories);

    // Dải logo marquee + lưới kỹ năng
    const marqueeEl = document.getElementById("company-marquee");
    renderCompanyMarquee(marqueeEl, companies);
    bindMarqueePause(marqueeEl);
    const skillsGrid = document.getElementById("skills-grid");
    renderSkillGrid(skillsGrid, skills, { limit: 12 });
    // Ẩn section kỹ năng nếu không có dữ liệu
    const skillsSection = document.getElementById("skills-section");
    if (skillsSection && (!Array.isArray(skills) || skills.length === 0)) {
      skillsSection.hidden = true;
    }

    const catSection = document.getElementById("categories-section");
    if (categories.length === 0 && catSection) catSection.hidden = true;
    else renderCategoryGrid(catGrid, categories);

    const jobsSection = document.getElementById("jobs-section");
    const jobsCountEl = document.getElementById("jobs-count");
    if (jobsCountEl) jobsCountEl.textContent = String(jobsRes.total || 0);
    if (!jobsRes.items || jobsRes.items.length === 0) {
      if (jobsSection) jobsSection.hidden = true;
    } else {
      jobsGrid.innerHTML = jobsRes.items.map((j) => renderJobCard(j, { detailBase: "pages/job-detail.html" })).join("");
    }

    const compSection = document.getElementById("companies-section");
    if (!companies || companies.length === 0) {
      if (compSection) compSection.hidden = true;
    } else {
      renderCompanyGrid(compGrid, companies);
    }
  } catch (err) {
    renderSectionError(jobsGrid, err?.message || "Không thể tải dữ liệu việc làm từ máy chủ.", loadHomeData);
    if (catGrid) catGrid.innerHTML = "";
    if (compGrid) compGrid.innerHTML = "";
  }
}

function init() {
  setupEmployerCtaVisibility();
  setupHeroSearchForm();
  loadHomeData();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
