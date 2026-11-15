/**
 * Trang chủ (/index.html) - 100% dữ liệu động từ FastAPI + MySQL.
 * Không chứa mảng dữ liệu cứng; mọi số liệu, danh mục, việc làm, công ty lấy từ API.
 */
import { fetchCachedMeta, buildJobsUrl } from "../utils/urlState.js";
import { getCompanyLogo, formatSalary, renderJobCard, renderJobCardSkeletons, bindSaveJobButtons, bindApplyJobButtons } from "../components/jobCard.js";
import { showStatusToast } from "../components/toast.js";
import { renderCategoryGrid, renderCategorySkeletons } from "../components/categoryGrid.js";
import { renderCompanyGrid, renderCompanySkeletons } from "../components/companyGrid.js";
import { renderCompanyMarquee, bindMarqueePause } from "../components/companyMarquee.js";
import { renderSkillGrid } from "../components/skillGrid.js";

const SALARY_UI_PRESETS = [
  // Nhãn rút gọn trong ô chọn của hero: "Mức lương" thay cho "Tất cả mức lương".
  { value: "", label: "Mức lương", min: "", max: "" },
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
 * Cột phải hero: 1 thẻ việc mới nhất + 1 thẻ "N công ty đang tuyển".
 * Dữ liệu lấy từ API /jobs (đã có sẵn trong loadHomeData) — không hardcode.
 */
function renderHeroFloat(job, companies) {
  const jobCard = document.getElementById("hero-float-job");
  const companiesCard = document.getElementById("hero-float-companies");
  const avatars = document.getElementById("hero-float-avatars");
  const note = document.getElementById("hero-float-note");

  // --- Thẻ việc mới nhất ---
  if (jobCard && job) {
    const logo = document.getElementById("hero-float-job-logo");
    const title = document.getElementById("hero-float-job-title");
    const salary = document.getElementById("hero-float-job-salary");
    const link = jobCard.querySelector("a.hero-float-link") || (() => {
      const a = document.createElement("a");
      a.className = "hero-float-link";
      while (jobCard.firstChild) a.appendChild(jobCard.firstChild);
      jobCard.appendChild(a);
      return a;
    })();
    link.href = `pages/job-detail.html?id=${encodeURIComponent(job.id)}`;
    link.setAttribute("aria-label", `${job.title} tại ${job.company_name || "doanh nghiệp"}`);
    if (logo) logo.innerHTML = getCompanyLogo(job.company_name);
    if (title) title.textContent = (job.title || "").replace("[Seed]", "").trim();
    if (salary) salary.textContent = formatSalary(job);
    jobCard.hidden = false;
  } else if (jobCard) {
    jobCard.hidden = true;
  }

  // --- Thẻ công ty đang tuyển: 3 avatar chồng nhau + số thật từ API ---
  const list = Array.isArray(companies) ? companies.filter((c) => c && c.name) : [];
  if (companiesCard && list.length) {
    if (avatars) {
      avatars.innerHTML = list.slice(0, 3).map((c) => getCompanyLogo(c.name)).join("");
    }
    if (note) note.textContent = `${list.length} công ty đang tuyển`;
    companiesCard.hidden = false;
  } else if (companiesCard) {
    companiesCard.hidden = true;
  }
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

  // Ô có giá trị 0 là tín hiệu xấu (vd. "Việc mới hôm nay: 0") -> ẩn hẳn ô đó.
  // API hiện chưa có số việc mới 7 ngày, nên không thay thế được -> ẩn.
  const cells = [...document.querySelectorAll("#home-stats-row .home-stat")];
  cells.forEach((cell) => {
    const val = Number(cell.querySelector(".home-stat-value")?.textContent?.replace(/\D/g, "") || 0);
    cell.hidden = val === 0;
  });
  // Ô đầu tiên đang hiện không có vạch phân cách bên trái.
  cells.filter((c) => !c.hidden).forEach((c, i) => {
    c.classList.toggle("is-first", i === 0);
  });

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
      // distinct_company: mỗi công ty chỉ 1 việc mới nhất -> dữ liệu hero đa dạng,
      // không lặp cùng một công ty (Rikkeisoft chiếm 3 thẻ trước đây).
      window.api.get("/jobs", { page_size: 8, sort: "newest", distinct_company: true }),
      window.api.get("/companies/featured", { limit: 12 }),
      window.api.get("/stats/home"),
    ]);

    if (locHost && window.CustomSelect) {
      locationSelect = new window.CustomSelect(locHost, {
        id: "search-location",
        name: "location",
        placeholder: "Địa điểm",
        ariaLabel: "Địa điểm",
        options: [{ value: "", label: "Địa điểm" }, ...locations.map((l) => ({ value: l.slug, label: l.name }))],
        value: "",
      });
    }

    renderPopularSkillChips(skills);
    renderHeroFloat(jobsRes.items?.[0], companies);
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
      jobsGrid.innerHTML = jobsRes.items.map((j) => renderJobCard(j, { detailBase: "pages/job-detail.html", showSaveBtn: true, showApplyBtn: true })).join("");
      bindSaveJobButtons(jobsGrid, { onToast: showStatusToast });
      bindApplyJobButtons(jobsGrid, { onApply: (id) => { window.location.href = `pages/job-detail.html?id=${id}`; } });
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
