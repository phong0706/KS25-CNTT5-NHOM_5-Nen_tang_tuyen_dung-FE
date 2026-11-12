/**
 * Trang chủ (/index.html) - 100% dữ liệu động từ FastAPI + MySQL.
 * Không chứa mảng dữ liệu cứng; mọi số liệu, danh mục, việc làm, công ty lấy từ API.
 */
import { fetchCachedMeta, buildJobsUrl } from "../utils/urlState.js";
import { getCompanyLogo, formatSalary, renderJobCard, renderJobCardSkeletons } from "../components/jobCard.js";
import { renderCategoryGrid, renderCategorySkeletons } from "../components/categoryGrid.js";
import { renderCompanyGrid, renderCompanySkeletons } from "../components/companyGrid.js";

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

function renderHeroFloatingCards(jobs, stats) {
  const floatCard = document.getElementById("hero-float-job");
  const floatLogo = document.getElementById("hero-float-logo");
  const floatTitle = document.getElementById("hero-float-title");
  const floatSalary = document.getElementById("hero-float-salary");
  if (floatCard && jobs && jobs.length > 0) {
    const topJob = jobs[0];
    floatCard.href = `pages/items.html?id=${topJob.id}`;
    if (floatLogo) floatLogo.innerHTML = getCompanyLogo(topJob.company_name);
    if (floatTitle) floatTitle.textContent = topJob.title;
    if (floatSalary) floatSalary.textContent = formatSalary(topJob);
  } else if (floatCard) {
    floatCard.hidden = true;
  }

  const todayCard = document.getElementById("hero-today-card");
  const todayLabel = document.getElementById("hero-today-label");
  const avatarStack = document.getElementById("hero-avatar-stack");
  if (todayCard && stats && Number(stats.today_new_jobs) > 0) {
    todayCard.hidden = false;
    if (todayLabel) todayLabel.textContent = `${stats.today_new_jobs} việc mới hôm nay`;
    if (avatarStack && jobs?.length) {
      avatarStack.innerHTML = jobs
        .slice(0, 3)
        .map((j) => `<span class="hero-avatar-dot">${escapeText((j.company_name || "C").charAt(0).toUpperCase())}</span>`)
        .join("");
    }
  } else if (todayCard) {
    todayCard.hidden = true;
  }
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
      window.api.get("/companies/featured", { limit: 4 }),
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
    renderHeroFloatingCards(jobsRes.items, stats);

    const catSection = document.getElementById("categories-section");
    if (categories.length === 0 && catSection) catSection.hidden = true;
    else renderCategoryGrid(catGrid, categories);

    const jobsSection = document.getElementById("jobs-section");
    const jobsCountEl = document.getElementById("jobs-count");
    if (jobsCountEl) jobsCountEl.textContent = String(jobsRes.total || 0);
    if (!jobsRes.items || jobsRes.items.length === 0) {
      if (jobsSection) jobsSection.hidden = true;
    } else {
      jobsGrid.innerHTML = jobsRes.items.map((j) => renderJobCard(j, { detailBase: "pages/items.html" })).join("");
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
