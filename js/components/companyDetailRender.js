/**
 * companyDetailRender.js - Render Hero, Annotation & Tabs trang Chi tiết Công ty (< 160 dòng).
 */
import { renderAboutSection, renderSidebarAndSimilar } from "./companyDetailSections.js";
import { formatRelativeTime } from "./jobCard.js";
import { showStatusToast } from "./toast.js";
import { createCompanyLogoElement } from "./companyLogo.js";
import { formatDomain, formatSizeRange, safeUrl } from "../utils/companyUtils.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = String(text);
  return n;
};

function renderHeroCover(comp) {
  const frame = $("company-cover-frame");
  const img = $("company-cover-img");
  if (!frame || !img) return;
  const validCover = safeUrl(comp.cover_url, ["https:"], { allowRelativeUploads: true });
  if (validCover) {
    img.src = validCover;
    frame.hidden = false;
    img.onerror = () => { frame.hidden = true; };
  } else {
    frame.hidden = true;
  }
}

function renderHeroSection(comp) {
  renderHeroCover(comp);
  const host = $("company-logo-host");
  if (host) host.replaceChildren(createCompanyLogoElement(comp, { size: 128 }));

  if ($("company-name-heading")) $("company-name-heading").textContent = comp.name || "Doanh nghiệp";

  const badge = $("company-verified-host");
  if (badge) {
    const hasVerifiedDate = Boolean(comp.verified_at);
    badge.hidden = !hasVerifiedDate;
    if (hasVerifiedDate) {
      let dateStr = "";
      try {
        const d = new Date(comp.verified_at);
        if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString("vi-VN");
      } catch {}
      const tip = dateStr ? `Đã xác minh ngày ${dateStr}` : "Doanh nghiệp đã được xác minh trên TechRecruit";
      badge.innerHTML = `<svg class="company-verified-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Doanh nghiệp đã xác minh" title="${tip}"><circle cx="12" cy="12" r="10" fill="var(--primary, #0d9488)"/><path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
  }

  const tagEl = $("company-tagline");
  if (tagEl) { tagEl.hidden = !comp.tagline; tagEl.textContent = comp.tagline || ""; }

  const chips = $("company-meta-chips");
  if (chips) {
    chips.replaceChildren();
    if (comp.industry?.name) chips.appendChild(el("span", "company-meta-pill", comp.industry.name));
    if (comp.location) chips.appendChild(el("span", "company-meta-pill", comp.location));
    const sz = formatSizeRange(comp.size_range);
    if (sz) chips.appendChild(el("span", "company-meta-pill", sz));
    if (comp.founded_year) chips.appendChild(el("span", "company-meta-pill", `Thành lập ${comp.founded_year}`));
    const web = safeUrl(comp.website, ["http:", "https:"]);
    if (web) {
      const a = el("a", "company-meta-pill company-meta-link");
      a.href = web; a.target = "_blank"; a.rel = "noopener noreferrer nofollow";
      a.innerHTML = `${formatDomain(web)} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
      chips.appendChild(a);
    }
  }

  const viewJobsBtn = $("btn-hero-view-jobs"), zeroNote = $("hero-zero-jobs-note"), openJobs = Number(comp.open_jobs || 0);
  if (viewJobsBtn && zeroNote) {
    viewJobsBtn.hidden = openJobs <= 0; zeroNote.hidden = openJobs > 0;
    if (openJobs > 0) {
      viewJobsBtn.textContent = `Xem ${openJobs} vị trí đang tuyển`;
      viewJobsBtn.onclick = () => {
        const tabJobs = $("tab-btn-jobs");
        if (tabJobs) tabJobs.click();
        else $("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
  }

  const copyBtn = $("btn-copy-company-link");
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try { await navigator.clipboard.writeText(window.location.href); } catch {
        const ta = document.createElement("textarea");
        ta.value = window.location.href; ta.style.cssText = "position:fixed;opacity:0;";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch {}
        ta.remove();
      }
      showStatusToast("Đã sao chép liên kết", "success");
    };
  }
}

function renderSalaryAnnotation(comp) {
  const noteEl = $("company-salary-annotation");
  if (!noteEl) return;
  const parts = [];
  const sal = comp.salary_range;
  if (sal && sal.sample_size >= 2) {
    const toTr = (v) => {
      const tr = v / 1_000_000;
      return Number.isInteger(tr) ? `${tr}` : tr.toFixed(1).replace(".0", "").replace(".", ",");
    };
    const medVal = sal.median || sal.min;
    if (medVal) {
      const p25Str = sal.p25 ? toTr(sal.p25) : (sal.min ? toTr(sal.min) : null);
      const p75Str = sal.p75 ? toTr(sal.p75) : (sal.max ? toTr(sal.max) : null);
      const rangeStr = (p25Str && p75Str) ? ` (p25-p75: ${p25Str} - ${p75Str} Tr, từ ${sal.sample_size} tin có khai lương)` : ` (từ ${sal.sample_size} tin có khai lương)`;
      parts.push(`Lương trung vị ${toTr(medVal)} Tr${rangeStr}`);
    }
  }
  if (comp.latest_job_at) {
    const rel = formatRelativeTime(comp.latest_job_at);
    if (rel?.text) parts.push(`Tin mới nhất ${rel.text}`);
  }
  noteEl.hidden = parts.length === 0;
  noteEl.textContent = parts.join(" · ");
}

function setupCompanyTabs(comp) {
  const tabAbout = $("tab-btn-about"), tabJobs = $("tab-btn-jobs"), countEl = $("company-tab-jobs-count");
  if (countEl) countEl.textContent = `(${Number(comp.open_jobs || 0)})`;

  const switchTab = (tab, updateHash = true) => {
    if (tab === "jobs") {
      tabJobs?.classList.add("is-active");
      tabJobs?.setAttribute("aria-selected", "true");
      tabAbout?.classList.remove("is-active");
      tabAbout?.setAttribute("aria-selected", "false");
      if (updateHash && window.location.hash !== "#jobs") history.replaceState(null, "", "#jobs");
    } else {
      tabAbout?.classList.add("is-active");
      tabAbout?.setAttribute("aria-selected", "true");
      tabJobs?.classList.remove("is-active");
      tabJobs?.setAttribute("aria-selected", "false");
      if (updateHash && window.location.hash !== "#about" && window.location.hash !== "") history.replaceState(null, "", "#about");
    }
  };

  tabAbout?.addEventListener("click", () => {
    switchTab("about");
    $("company-about-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  tabJobs?.addEventListener("click", () => {
    switchTab("jobs");
    $("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  if (window.location.hash === "#jobs") switchTab("jobs", false);
  else switchTab("about", false);

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#jobs") switchTab("jobs", false);
    else if (window.location.hash === "#about") switchTab("about", false);
  });
}

export function renderFullCompanyProfile(comp) {
  if ($("breadcrumb-company-name")) $("breadcrumb-company-name").textContent = comp.name || "Chi tiết công ty";
  document.title = `${comp.name || "Công ty"} - Tuyển dụng | TechRecruit`;
  const metaDesc = $("company-meta-description");
  const snippet = (comp.tagline || comp.description || "").trim().slice(0, 150);
  if (metaDesc && snippet) metaDesc.setAttribute("content", snippet);

  renderHeroSection(comp);
  renderSalaryAnnotation(comp);
  setupCompanyTabs(comp);
  renderAboutSection(comp);
  renderSidebarAndSimilar(comp);

  if ($("company-skeleton-host")) $("company-skeleton-host").hidden = true;
  if ($("company-state-host")) $("company-state-host").hidden = true;
  if ($("company-detail-root")) $("company-detail-root").hidden = false;
}
