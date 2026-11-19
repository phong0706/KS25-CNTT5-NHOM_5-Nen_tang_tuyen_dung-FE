/**
 * Trang chủ (/index.html) - 100% dữ liệu động từ FastAPI + MySQL.
 * Không chứa mảng dữ liệu cứng; mọi số liệu, danh mục, việc làm, công ty lấy từ API.
 */
import { fetchCachedMeta, buildJobsUrl } from "../utils/urlState.js";
import { renderJobCard, renderJobCardSkeletons, bindSaveJobButtons, bindApplyJobButtons } from "../components/jobCard.js";
import { showStatusToast } from "../components/toast.js";
import { renderCategoryGrid, renderCategorySkeletons } from "../components/categoryGrid.js";
import { renderCompanyGrid, renderCompanySkeletons } from "../components/companyGrid.js";
import { initMarquee } from "../components/marquee.js";
import { renderSkillGrid } from "../components/skillGrid.js";
import { jobDetailUrl, jobsUrl } from "../routes.js";
import { renderHeroJobsList, renderHeroWorkbenchSkeletons, renderHeroWorkbenchError, renderHeroFooterStats, renderHeroFilterChips, updateHeroTimestamp, initHeroFilterChips } from "../components/heroWorkbench.js";

const SALARY_UI_PRESETS = [
  { value: "", label: "Mức lương", min: "", max: "" }, { value: "under20", label: "Dưới 20 triệu", min: "", max: "20000000" }, { value: "20-35", label: "20 - 35 triệu", min: "20000000", max: "35000000" }, { value: "35-50", label: "35 - 50 triệu", min: "35000000", max: "50000000" }, { value: "over50", label: "Trên 50 triệu", min: "50000000", max: "" },
];

let locationSelect = null, salarySelect = null;

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function setupEmployerCtaVisibility() {
  const cta = document.getElementById("employer-cta-section");
  if (!cta || !window.Auth) return;
  cta.hidden = !( !window.Auth.isAuthenticated() || window.Auth.hasRole("recruiter", "employer") );
}

function setupHeroSearchForm() {
  const form = document.getElementById("home-search-form");
  const kw = document.getElementById("search-keyword");
  const host = document.getElementById("search-salary-host");

  if (host && window.CustomSelect) {
    salarySelect = new window.CustomSelect(host, {
      id: "search-salary", name: "salary", placeholder: "Mức lương", ariaLabel: "Mức lương",
      options: SALARY_UI_PRESETS.map((p) => ({ value: p.value, label: p.label })), value: "",
    });
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const sal = SALARY_UI_PRESETS.find((p) => p.value === (salarySelect?.value || "")) || SALARY_UI_PRESETS[0];
    window.location.href = buildJobsUrl({
      q: kw?.value || "", location: locationSelect?.value || "",
      salary_min: sal.min, salary_max: sal.max,
    }, "pages/jobs.html");
  });
}

async function loadHeroJobs(category = "") {
  const listEl = document.getElementById("hero-live-jobs-list");
  if (!listEl) return;
  renderHeroWorkbenchSkeletons(listEl, 3);
  try {
    const params = { page_size: 3, sort: "newest" };
    if (category) params.category = category;
    const res = await window.api.get("/jobs", params);
    renderHeroJobsList(listEl, res.items || []);
    updateHeroTimestamp();
  } catch (err) {
    renderHeroWorkbenchError(listEl, "Không thể tải việc làm từ máy chủ.", () => loadHeroJobs(category));
  }
}

function renderHomeStats(benchmarks, stats) {
  const sec = document.getElementById("home-stats-section");
  const chartEl = document.getElementById("salary-skills-chart");
  if (!chartEl || !Array.isArray(benchmarks) || benchmarks.length === 0) {
    if (sec) sec.hidden = true; return;
  }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);
  const jobs = Number(stats?.total_published_jobs || 0), comps = Number(stats?.total_companies || 0);
  set("stat-jobs", fmt(jobs)); set("stat-companies", fmt(comps));
  set("cta-stat-companies", fmt(comps)); set("cta-stat-jobs", fmt(jobs));

  const maxSalary = Math.max(...benchmarks.map((b) => b.median_salary || 0), 1);
  chartEl.innerHTML = benchmarks.slice(0, 6).map((b) => {
    const pct = Math.max(8, Math.min(100, Math.round(((b.median_salary || 0) / maxSalary) * 100)));
    const url = buildJobsUrl({ skills: b.skill }, "pages/jobs.html");
    const skill = escapeText(b.skill), salary = escapeText(b.display_salary || "");
    const count = `${b.sample_count || 0} tin`;
    return `<a href="${escapeText(url)}" class="salary-skill-row" role="listitem" aria-label="${skill}: ${salary}, ${count}"><span class="skill-row-name">${skill}</span><div class="skill-row-track" aria-hidden="true"><div class="skill-row-bar" style="width: ${pct}%"></div></div><span class="skill-row-salary">${salary}</span><span class="skill-row-count">(${count})</span></a>`;
  }).join("");
  if (sec) sec.hidden = false;
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
  if (!host || !Array.isArray(skills) || skills.length === 0) return;
  const chips = [
    `<a href="${escapeText(jobsUrl())}" class="filter-chip active">Tất cả</a>`,
    ...skills.slice(0, 6).map((s) => `<a href="${escapeText(buildJobsUrl({ skills: s.name }, "pages/jobs.html"))}" class="filter-chip">${escapeText(s.name)}</a>`),
  ];
  host.innerHTML = chips.join("");
}

async function loadHomeData() {
  const catGrid = document.getElementById("categories-grid");
  const jobsGrid = document.getElementById("jobs-grid");
  const compGrid = document.getElementById("companies-grid");
  const locHost = document.getElementById("search-location-host");
  const heroList = document.getElementById("hero-live-jobs-list");

  renderCategorySkeletons(catGrid, 6);
  renderJobCardSkeletons(jobsGrid, 8);
  renderCompanySkeletons(compGrid, 4);
  renderHeroWorkbenchSkeletons(heroList, 3);

  try {
    const [locations, skills, categories, jobsRes, companies, stats, benchmarks] = await Promise.all([
      fetchCachedMeta("/meta/locations"),
      fetchCachedMeta("/meta/skills"),
      fetchCachedMeta("/meta/categories"),
      window.api.get("/jobs", { page_size: 8, sort: "newest", distinct_company: true }),
      window.api.get("/companies", { hiring: 1, page_size: 16, sort: "jobs" }).catch(() => ({ items: [], total: 0 })),
      window.api.get("/stats/home"),
      window.api.get("/salary/skills-benchmark").catch(() => []),
    ]);

    if (locHost && window.CustomSelect) {
      locationSelect = new window.CustomSelect(locHost, {
        id: "search-location", name: "location", placeholder: "Địa điểm", ariaLabel: "Địa điểm",
        options: [{ value: "", label: "Địa điểm" }, ...locations.map((l) => ({ value: l.slug, label: l.name }))],
        value: "",
      });
    }

    renderPopularSkillChips(skills);
    renderHeroJobsList(heroList, jobsRes.items || []);
    updateHeroTimestamp();
    const wbToolbar = document.getElementById("hero-wb-toolbar");
    renderHeroFilterChips(wbToolbar, categories, (cat) => loadHeroJobs(cat));
    renderHeroFooterStats(stats);
    renderHomeStats(benchmarks, stats);

    const hList = companies?.items || (Array.isArray(companies) ? companies : []);
    const hTotal = companies?.total ?? hList.length;
    const hSub = document.querySelector(".marquee-subtitle");
    if (hSub) hSub.textContent = `${hTotal} công ty đang có vị trí mở trên TechRecruit`;
    initMarquee(document.getElementById("company-marquee"), hList);

    const skillsGrid = document.getElementById("skills-grid");
    renderSkillGrid(skillsGrid, skills, { limit: 12 });
    const skillsSec = document.getElementById("skills-section");
    if (skillsSec && (!Array.isArray(skills) || skills.length === 0)) skillsSec.hidden = true;

    const catSec = document.getElementById("categories-section");
    if (categories.length === 0 && catSec) catSec.hidden = true;
    else renderCategoryGrid(catGrid, categories);

    const jobsCount = document.getElementById("jobs-count");
    if (jobsCount) jobsCount.textContent = String(jobsRes.total || 0);
    const jobsSec = document.getElementById("jobs-section");
    if (!jobsRes.items || jobsRes.items.length === 0) {
      if (jobsSec) jobsSec.hidden = true;
    } else {
      jobsGrid.innerHTML = jobsRes.items.map((j) => renderJobCard(j, { showSaveBtn: true, showApplyBtn: true })).join("");
      bindSaveJobButtons(jobsGrid, { onToast: showStatusToast });
      bindApplyJobButtons(jobsGrid, { onApply: (id) => { window.location.href = jobDetailUrl(id); } });
    }

    const compSec = document.getElementById("companies-section");
    if (!hList || hList.length === 0) { if (compSec) compSec.hidden = true; }
    else renderCompanyGrid(compGrid, hList);
  } catch (err) {
    renderSectionError(jobsGrid, err?.message || "Không thể tải dữ liệu việc làm từ máy chủ.", loadHomeData);
    if (catGrid) catGrid.innerHTML = ""; if (compGrid) compGrid.innerHTML = "";
    const statsSec = document.getElementById("home-stats-section");
    if (statsSec) statsSec.hidden = true;
    renderHeroWorkbenchError(heroList, "Lỗi kết nối máy chủ.", loadHomeData);
  }
}

function init() {
  setupEmployerCtaVisibility();
  setupHeroSearchForm();
  initHeroFilterChips((query) => loadHeroJobs(query));
  loadHomeData();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
