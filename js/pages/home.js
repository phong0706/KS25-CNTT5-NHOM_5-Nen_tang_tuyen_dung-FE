/**
 * Logic Trang chủ TechRecruit (Pure Vanilla JS)
 * - Mặc định giao diện sáng, tối giản, chuẩn mực
 * - Tìm kiếm theo Từ khóa, Địa điểm, Mức lương & Chips lọc nhanh
 * - Dải "Danh mục phổ biến" 6 ô với Lucide icons và số lượng từ API
 * - Lưới việc làm dạng hàng ngang: logo 48px, tên vị trí 17px weight 600 (đậm nhất),
 *   công ty 14px weight 400 màu xám, lương weight 700 căn phải, tối đa 2 tag nhỏ
 * - Hover: đổi viền + nâng 2px
 */

// 1. Danh sách 6 Danh mục phổ biến (Lucide icons + số lượng)
const CATEGORIES_DATA = [
  {
    id: "backend",
    name: "Backend",
    filterKey: "Backend",
    count: 142,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`
  },
  {
    id: "frontend",
    name: "Frontend",
    filterKey: "Frontend",
    count: 98,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>`
  },
  {
    id: "ai-data",
    name: "AI & Data",
    filterKey: "AI",
    count: 64,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`
  },
  {
    id: "devops",
    name: "DevOps",
    filterKey: "DevOps",
    count: 56,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`
  },
  {
    id: "mobile",
    name: "Mobile",
    filterKey: "Mobile",
    count: 45,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`
  },
  {
    id: "qa",
    name: "QA",
    filterKey: "QA",
    count: 38,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`
  }
];

// 2. Danh sách việc làm mẫu chuẩn
const JOBS_DATA = [
  {
    id: 1,
    title: "Senior Backend Engineer (Python / FastAPI)",
    company: "FPT Software",
    companyInitial: "F",
    avatarBg: "#F0FDFA",
    avatarColor: "#0F766E",
    location: "Hà Nội",
    workMode: "Hybrid",
    salaryShort: "35 - 50 Tr",
    salaryMin: 35,
    postedTime: "Hôm nay",
    tags: ["Python", "FastAPI"],
  },
  {
    id: 2,
    title: "Frontend Tech Lead (React / TypeScript)",
    company: "VNG Corporation",
    companyInitial: "V",
    avatarBg: "#EFF6FF",
    avatarColor: "#1E40AF",
    location: "TP. Hồ Chí Minh",
    workMode: "Hybrid",
    salaryShort: "45 - 65 Tr",
    salaryMin: 45,
    postedTime: "1 ngày trước",
    tags: ["React", "TypeScript"],
  },
  {
    id: 3,
    title: "Middle DevOps & Cloud Engineer (AWS / K8s)",
    company: "Rikkeisoft",
    companyInitial: "R",
    avatarBg: "#FEF3C7",
    avatarColor: "#92400E",
    location: "Đà Nẵng",
    workMode: "Onsite",
    salaryShort: "28 - 42 Tr",
    salaryMin: 28,
    postedTime: "Hôm nay",
    tags: ["AWS", "DevOps"],
  },
  {
    id: 4,
    title: "AI & LLM Research Engineer (PyTorch)",
    company: "Viettel Solutions",
    companyInitial: "V",
    avatarBg: "#FDF2F8",
    avatarColor: "#9D174D",
    location: "Hà Nội",
    workMode: "Remote",
    salaryShort: "50 - 75 Tr",
    salaryMin: 50,
    postedTime: "2 ngày trước",
    tags: ["Python", "AI / Data"],
  },
  {
    id: 5,
    title: "Fullstack Developer (Node.js & Vue.js)",
    company: "MoMo (M-Service)",
    companyInitial: "M",
    avatarBg: "#F3E8FF",
    avatarColor: "#6B21A8",
    location: "TP. Hồ Chí Minh",
    workMode: "Onsite",
    salaryShort: "25 - 38 Tr",
    salaryMin: 25,
    postedTime: "3 ngày trước",
    tags: ["Node.js", "Vue.js"],
  },
  {
    id: 6,
    title: "Senior Java Backend Engineer (Spring Boot)",
    company: "VNPT IT",
    companyInitial: "V",
    avatarBg: "#ECFEFF",
    avatarColor: "#0E7490",
    location: "Hà Nội",
    workMode: "Onsite",
    salaryShort: "30 - 45 Tr",
    salaryMin: 30,
    postedTime: "Vừa đăng",
    tags: ["Java", "Spring Boot"],
  },
  {
    id: 7,
    title: "Software Engineer (Golang / Microservices)",
    company: "Grab Vietnam",
    companyInitial: "G",
    avatarBg: "#ECFDF5",
    avatarColor: "#065F46",
    location: "TP. Hồ Chí Minh",
    workMode: "Hybrid",
    salaryShort: "40 - 60 Tr",
    salaryMin: 40,
    postedTime: "1 ngày trước",
    tags: ["Golang", "Microservices"],
  },
  {
    id: 8,
    title: "QA Automation Engineer (Cypress / Playwright)",
    company: "CMC Telecom",
    companyInitial: "C",
    avatarBg: "#F1F5F9",
    avatarColor: "#334155",
    location: "Hà Nội",
    workMode: "Hybrid",
    salaryShort: "20 - 32 Tr",
    salaryMin: 20,
    postedTime: "4 ngày trước",
    tags: ["Automation", "QA"],
  },
];

// 3. Danh sách công ty nổi bật
const COMPANIES_DATA = [
  {
    name: "FPT Software",
    initial: "F",
    avatarBg: "#F0FDFA",
    avatarColor: "#0F766E",
    openJobs: 45,
    location: "Hà Nội, TP. HCM, Đà Nẵng",
  },
  {
    name: "VNG Corporation",
    initial: "V",
    avatarBg: "#EFF6FF",
    avatarColor: "#1E40AF",
    openJobs: 32,
    location: "TP. Hồ Chí Minh, Hà Nội",
  },
  {
    name: "Viettel Solutions",
    initial: "V",
    avatarBg: "#FDF2F8",
    avatarColor: "#9D174D",
    openJobs: 28,
    location: "Hà Nội, Toàn quốc",
  },
  {
    name: "Rikkeisoft",
    initial: "R",
    avatarBg: "#FEF3C7",
    avatarColor: "#92400E",
    openJobs: 24,
    location: "Hà Nội, Đà Nẵng, Tokyo",
  },
  {
    name: "MoMo (M-Service)",
    initial: "M",
    avatarBg: "#F3E8FF",
    avatarColor: "#6B21A8",
    openJobs: 18,
    location: "TP. Hồ Chí Minh",
  },
  {
    name: "Grab Vietnam",
    initial: "G",
    avatarBg: "#ECFDF5",
    avatarColor: "#065F46",
    openJobs: 14,
    location: "TP. Hồ Chí Minh",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const jobsGridEl = document.getElementById("jobs-grid");
  const jobsCountEl = document.getElementById("jobs-count");
  const categoriesGridEl = document.getElementById("categories-grid");
  const searchForm = document.getElementById("home-search-form");
  const keywordInput = document.getElementById("search-keyword");
  const locationSelect = document.getElementById("search-location");
  const salarySelect = document.getElementById("search-salary");
  const chipsWrap = document.getElementById("quick-filter-chips");
  const companiesGridEl = document.getElementById("companies-grid");

  let activeFilterChip = "";

  // Helper escape HTML
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 1. Render Dải "Danh mục phổ biến" (6 ô)
  function renderCategories(categories) {
    if (!categoriesGridEl) return;
    categoriesGridEl.innerHTML = categories.map((c) => `
      <a href="pages/items.html?q=${encodeURIComponent(c.filterKey)}" class="category-card" data-category="${c.filterKey}">
        <div class="category-icon-box" aria-hidden="true">
          ${c.icon}
        </div>
        <div class="category-info">
          <h3 class="category-name">${escapeHtml(c.name)}</h3>
          <span class="category-count" id="count-cat-${c.id}">${Number(c.count).toLocaleString("vi-VN")} việc làm</span>
        </div>
      </a>
    `).join("");

    // Hỗ trợ click trực tiếp để lọc nhanh việc làm trên trang chủ
    categoriesGridEl.querySelectorAll(".category-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // Nếu không nhấn phím Ctrl/Meta (mở tab mới), lọc luôn trên trang hiện tại
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          const filterKey = card.dataset.category;
          if (keywordInput) {
            keywordInput.value = filterKey;
          }
          activeFilterChip = "";
          if (chipsWrap) {
            chipsWrap.querySelectorAll(".filter-chip").forEach((b) => b.classList.remove("active"));
          }
          filterJobs();
          const jobsSec = document.querySelector(".jobs-section");
          if (jobsSec) {
            jobsSec.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });
  }

  // 2. Render việc làm dạng hàng ngang
  function renderJobs(list) {
    if (!jobsGridEl) return;

    if (jobsCountEl) {
      jobsCountEl.textContent = list.length;
    }

    if (list.length === 0) {
      jobsGridEl.innerHTML = `
        <div class="jobs-empty-box">
          <div style="color: var(--primary-700); margin-bottom: 12px; display: inline-flex;" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="14" width="44" height="36" rx="8" stroke="currentColor" stroke-width="2.5" stroke-opacity="0.35" />
              <circle cx="32" cy="31" r="8" stroke="currentColor" stroke-width="2.5" />
              <path d="M38 37L44 43" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </svg>
          </div>
          <p style="margin: 0 0 6px 0; font-weight: 600; color: var(--text-primary);">Không tìm thấy việc làm phù hợp</p>
          <p style="margin: 0; font-size: 13.5px; color: var(--text-muted);">Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
        </div>
      `;
      return;
    }

    jobsGridEl.innerHTML = list
      .map((job) => {
        // Tối đa 2 tag nhỏ
        const tagsHtml = (job.tags || [])
          .slice(0, 2)
          .map((t) => `<span class="job-tag">${escapeHtml(t)}</span>`)
          .join("");

        return `
          <article class="job-card" role="article">
            <div class="job-card-main">
              ${getCompanyLogo(job)}
              <div class="job-card-body">
                <!-- Tên vị trí 17px weight 600: Luôn đậm nhất trong thẻ -->
                <h3 class="job-title" title="${escapeHtml(job.title)}">
                  <a href="pages/items.html?q=${encodeURIComponent(job.title.split("(")[0].trim())}">
                    ${escapeHtml(job.title)}
                  </a>
                </h3>
                <!-- Công ty 14px weight 400 màu xám -->
                <div class="job-meta-line">
                  <span class="job-meta-company">${escapeHtml(job.company)}</span>
                  <span class="job-meta-dot">·</span>
                  <span>${escapeHtml(job.location)}</span>
                  <span class="job-meta-dot">·</span>
                  <span class="job-meta-time">${escapeHtml(job.postedTime)}</span>
                </div>
                <!-- Tối đa 2 tag nhỏ -->
                <div class="job-tags-list">
                  ${tagsHtml}
                </div>
              </div>
            </div>
            <!-- Cột phải: Lương weight 700 căn phải -->
            <div class="job-card-right">
              <div class="job-salary">${escapeHtml(job.salaryShort)}</div>
              <span class="job-mode-pill">${escapeHtml(job.workMode)}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  // 3. Lọc danh sách việc làm
  function filterJobs() {
    const keyword = (keywordInput ? keywordInput.value.trim().toLowerCase() : "");
    const loc = (locationSelect ? locationSelect.value : "");
    const salary = (salarySelect ? salarySelect.value : "");

    const filtered = JOBS_DATA.filter((job) => {
      // Lọc từ khóa
      if (keyword) {
        const textMatch =
          job.title.toLowerCase().includes(keyword) ||
          job.company.toLowerCase().includes(keyword) ||
          job.tags.some((t) => t.toLowerCase().includes(keyword));
        if (!textMatch) return false;
      }

      // Lọc chip
      if (activeFilterChip) {
        const chipMatch =
          job.title.toLowerCase().includes(activeFilterChip.toLowerCase()) ||
          job.tags.some((t) => t.toLowerCase().includes(activeFilterChip.toLowerCase()));
        if (!chipMatch) return false;
      }

      // Lọc địa điểm
      if (loc) {
        if (loc === "Remote") {
          if (job.workMode !== "Remote") return false;
        } else if (!job.location.includes(loc)) {
          return false;
        }
      }

      // Lọc dải lương
      if (salary) {
        if (salary === "under20" && job.salaryMin >= 20) return false;
        if (salary === "20-35" && (job.salaryMin < 20 || job.salaryMin > 35)) return false;
        if (salary === "35-50" && (job.salaryMin < 35 || job.salaryMin > 50)) return false;
        if (salary === "over50" && job.salaryMin < 50) return false;
      }

      return true;
    });

    renderJobs(filtered);
  }

  // 4. Sự kiện tìm kiếm & chips
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      filterJobs();
    });
  }

  if (keywordInput) {
    keywordInput.addEventListener("input", filterJobs);
  }

  if (locationSelect) {
    locationSelect.addEventListener("change", filterJobs);
  }

  if (salarySelect) {
    salarySelect.addEventListener("change", filterJobs);
  }

  if (chipsWrap) {
    chipsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      chipsWrap.querySelectorAll(".filter-chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilterChip = btn.dataset.filter || "";
      filterJobs();
    });
  }

  // 5. Render dải logo công ty đối tác & danh sách công ty nổi bật
  const partnersStripEl = document.getElementById("partners-strip");
  if (partnersStripEl) {
    partnersStripEl.innerHTML = COMPANIES_DATA.slice(0, 6).map((c) => `
      <a href="pages/items.html?q=${encodeURIComponent(c.name)}" class="partner-logo-item">
        ${getCompanyLogo(c)}
        <span class="partner-logo-name">${escapeHtml(c.name)}</span>
      </a>
    `).join("");
  }

  if (companiesGridEl) {
    companiesGridEl.innerHTML = COMPANIES_DATA.map((c) => `
      <a href="pages/items.html?q=${encodeURIComponent(c.name)}" class="company-card">
        ${getCompanyLogo(c)}
        <div class="company-card-info">
          <h3 class="company-card-name">${escapeHtml(c.name)}</h3>
          <div class="company-card-meta">${c.openJobs} việc làm đang tuyển · ${escapeHtml(c.location)}</div>
        </div>
      </a>
    `).join("");
  }

  function renderJobsSkeleton(count = 4) {
    if (!jobsGridEl) return;
    jobsGridEl.innerHTML = Array.from({ length: count }).map(() => `
      <div class="job-skeleton-card" aria-hidden="true">
        <div class="job-skeleton-pulse" style="width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0;"></div>
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px;">
          <div class="job-skeleton-pulse" style="height: 16px; width: 65%;"></div>
          <div class="job-skeleton-pulse" style="height: 12px; width: 45%;"></div>
        </div>
        <div class="job-skeleton-pulse" style="height: 18px; width: 72px; flex-shrink: 0;"></div>
      </div>
    `).join("");
  }

  function initScrollReveal() {
    const targets = document.querySelectorAll(".reveal-on-scroll");
    if (!targets.length) return;
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    targets.forEach((el) => observer.observe(el));
  }

  // 6. Khởi tạo danh mục, skeleton việc làm và reveal khi cuộn
  renderCategories(CATEGORIES_DATA);
  renderJobsSkeleton(4);
  initScrollReveal();

  // 7. Hai thẻ nổi Hero: việc mới nhất & số việc mới hôm nay từ API
  function updateHeroFloatJob(item, isFromApi) {
    const cardEl = document.getElementById("hero-float-job");
    const logoEl = document.getElementById("hero-float-logo");
    const titleEl = document.getElementById("hero-float-title");
    const salaryEl = document.getElementById("hero-float-salary");

    if (!cardEl || !item) return;

    if (isFromApi) {
      const name = item.name || item.title || "Vị trí IT";
      const company = item.company || name;
      const price = item.price ? `${Number(item.price).toLocaleString("vi-VN")} đ` : "Thỏa thuận";
      if (logoEl) logoEl.innerHTML = getCompanyLogo({ name: company });
      if (titleEl) titleEl.textContent = name;
      if (salaryEl) salaryEl.textContent = price;
      cardEl.href = `pages/items.html?q=${encodeURIComponent(name)}`;
    } else {
      if (logoEl) logoEl.innerHTML = getCompanyLogo(item);
      if (titleEl) titleEl.textContent = item.title;
      if (salaryEl) salaryEl.textContent = item.salaryShort;
      cardEl.href = `pages/items.html?q=${encodeURIComponent(item.title.split("(")[0].trim())}`;
    }
  }

  function updateHeroTodayCard(backendItems) {
    const todayCard = document.getElementById("hero-today-card");
    const stackEl = document.getElementById("hero-avatar-stack");
    const labelEl = document.getElementById("hero-today-label");
    if (!todayCard || !stackEl || !labelEl) return;

    const todayStr = new Date().toDateString();
    const todayItems = Array.isArray(backendItems)
      ? backendItems.filter((item) => item.created_at && new Date(item.created_at).toDateString() === todayStr)
      : [];

    if (todayItems.length === 0) {
      todayCard.hidden = true;
      return;
    }

    const palette = [
      { bg: "#CCFBF1", color: "#0F766E" },
      { bg: "#DBEAFE", color: "#1E40AF" },
      { bg: "#FEE2E2", color: "#991B1B" },
    ];

    stackEl.innerHTML = todayItems.slice(0, 3).map((item, idx) => {
      const label = item.company || item.name || item.title || "T";
      const initial = String(label).trim().charAt(0).toUpperCase() || "T";
      const tone = palette[idx % palette.length];
      return `<span class="hero-avatar-chip" style="background-color: ${tone.bg}; color: ${tone.color};">${escapeHtml(initial)}</span>`;
    }).join("");

    labelEl.textContent = `${todayItems.length} việc mới hôm nay`;
    todayCard.hidden = false;
  }

  // Khởi tạo thẻ nổi Hero ban đầu
  updateHeroFloatJob(JOBS_DATA[0], false);
  updateHeroTodayCard([]);

  (async function syncBackendCount() {
    try {
      if (typeof api !== "undefined") {
        const backendItems = await api.get("/items");
        if (Array.isArray(backendItems) && backendItems.length > 0) {
          updateHeroFloatJob(backendItems[0], true);
          updateHeroTodayCard(backendItems);

          if (jobsCountEl) {
            jobsCountEl.textContent = JOBS_DATA.length + backendItems.length;
          }
          // Cập nhật số việc trong từng danh mục dựa trên items backend
          backendItems.forEach((item) => {
            const title = (item.name || item.title || "").toLowerCase();
            const desc = (item.description || "").toLowerCase();
            CATEGORIES_DATA.forEach((cat) => {
              if (title.includes(cat.filterKey.toLowerCase()) || desc.includes(cat.filterKey.toLowerCase())) {
                cat.count++;
                const el = document.getElementById(`count-cat-${cat.id}`);
                if (el) el.textContent = `${Number(cat.count).toLocaleString("vi-VN")} việc làm`;
              }
            });
          });
        }
      }
    } catch (e) {
      // Giữ nguyên dữ liệu chuẩn nếu API chưa có dữ liệu
    } finally {
      filterJobs();
    }
  })();

  // 8. XỬ LÝ THANH DEBUG: CHỈ RENDER KHI CÓ ?debug=1 TRÊN URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("debug") === "1") {
    const debugContainer = document.getElementById("debug-status-container");
    if (debugContainer) {
      debugContainer.hidden = false;
      debugContainer.className = "debug-ticker";
      debugContainer.innerHTML = `
        <div class="container debug-ticker-inner">
          <div>
            <strong>[Debug Mode]</strong> API: <code>${typeof CONFIG !== "undefined" ? CONFIG.API_BASE_URL : "http://127.0.0.1:8000/api"}</code>
            <span id="debug-health-text" style="margin-left: 8px;">Đang kiểm tra kết nối...</span>
          </div>
          <button type="button" id="btn-debug-recheck" class="filter-chip" style="font-size: 11px; padding: 2px 8px;">Kiểm tra lại</button>
        </div>
      `;

      async function checkHealth() {
        const healthEl = document.getElementById("debug-health-text");
        if (!healthEl) return;
        try {
          const res = await api.get("/health");
          healthEl.innerHTML = `<span style="color: #0F766E; font-weight: 600;">● Kết nối tốt (MySQL: ${res.database})</span>`;
        } catch (err) {
          healthEl.innerHTML = `<span style="color: #BE123C; font-weight: 600;">● Lỗi kết nối: ${escapeHtml(err.message)}</span>`;
        }
      }

      const recheckBtn = document.getElementById("btn-debug-recheck");
      if (recheckBtn) recheckBtn.addEventListener("click", checkHealth);
      checkHealth();
    }
  }
});
