/**
 * companyDetailRender.js - Render Hero, Stats & kết nối các khối trang Chi tiết Công ty (< 160 dòng).
 */
import { renderAboutSection, renderSidebarAndSimilar } from "./companyDetailSections.js";
import { formatRelativeTime } from "./jobCard.js";
import { showStatusToast } from "./toast.js";
import {
  COMPANY_PALETTES,
  companyColorIndex,
  companyInitials,
  coverPattern,
  formatDomain,
  formatSalaryRangeShort,
  formatSizeRange,
  safeUrl,
} from "../utils/companyUtils.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = String(text);
  return n;
};

function buildHeroLogo(comp) {
  const host = $("company-logo-host");
  if (!host) return;
  host.replaceChildren();
  const pal = COMPANY_PALETTES[companyColorIndex(comp.slug || comp.name)];
  const fallback = () => {
    const box = el("div", "company-hero-logo-fallback", companyInitials(comp.name));
    box.style.setProperty("--comp-bg", pal.bg); box.style.setProperty("--comp-fg", pal.fg);
    box.style.setProperty("--comp-dark-bg", pal.darkBg); box.style.setProperty("--comp-dark-fg", pal.darkFg);
    box.setAttribute("aria-hidden", "true");
    host.replaceChildren(box);
  };
  const validLogo = safeUrl(comp.logo_url, ["https:"], { allowRelativeUploads: true });
  if (!validLogo) { fallback(); return; }
  const img = document.createElement("img");
  img.width = 96; img.height = 96; img.alt = `Logo ${comp.name || "công ty"}`; img.src = validLogo;
  img.addEventListener("error", fallback, { once: true });
  host.appendChild(img);
}

function renderHeroSection(comp) {
  const coverEl = $("company-cover-img");
  if (coverEl) {
    const fallbackUrl = coverPattern(comp.slug || comp.name).dataUrl;
    const validCover = safeUrl(comp.cover_url, ["https:"], { allowRelativeUploads: true });
    coverEl.alt = ""; coverEl.src = validCover || fallbackUrl;
    if (validCover) coverEl.addEventListener("error", () => { coverEl.src = fallbackUrl; }, { once: true });
  }
  buildHeroLogo(comp);

  if ($("company-name-heading")) $("company-name-heading").textContent = comp.name || "Doanh nghiệp";
  const badge = $("company-verified-host");
  if (badge) {
    badge.hidden = comp.is_verified !== true;
    if (comp.is_verified === true) {
      badge.textContent = "✓ Đã xác minh";
      badge.title = "Doanh nghiệp đã được xác minh thông tin pháp lý trên TechRecruit";
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
      const a = el("a", "company-meta-pill company-meta-link", formatDomain(web));
      a.href = web; a.target = "_blank"; a.rel = "noopener noreferrer nofollow";
      chips.appendChild(a);
    }
  }

  const viewJobsBtn = $("btn-hero-view-jobs"), zeroNote = $("hero-zero-jobs-note"), openJobs = Number(comp.open_jobs || 0);
  if (viewJobsBtn && zeroNote) {
    viewJobsBtn.hidden = openJobs <= 0; zeroNote.hidden = openJobs > 0;
    if (openJobs > 0) {
      viewJobsBtn.textContent = `Xem ${openJobs} vị trí đang tuyển`;
      viewJobsBtn.onclick = () => {
        $("jobs")?.scrollIntoView({ behavior: "smooth", block: "start" });
        $("company-jobs-heading")?.focus({ preventScroll: true });
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
      showStatusToast("Đã sao chép", "success");
    };
  }
}

function renderStatsStrip(comp) {
  const strip = $("company-stats-strip");
  if (!strip) return;
  strip.replaceChildren();
  const cards = [];
  if (Number(comp.open_jobs || 0) > 0) cards.push([`${comp.open_jobs}`, "vị trí đang tuyển"]);
  const salTxt = formatSalaryRangeShort(comp.salary_range);
  if (comp.salary_range && salTxt) cards.push([salTxt, `Lương trong các tin đang tuyển (từ ${comp.salary_range.sample_size} tin có khai lương)`]);
  if (comp.latest_job_at) cards.push([formatRelativeTime(comp.latest_job_at).text, "Tin mới nhất"]);
  strip.hidden = cards.length === 0;
  cards.slice(0, 3).forEach(([val, lbl]) => {
    const box = el("div", "company-stat-card");
    box.append(el("span", "company-stat-val", val), el("span", "company-stat-label", lbl));
    strip.appendChild(box);
  });
}

export function renderFullCompanyProfile(comp) {
  if ($("breadcrumb-company-name")) $("breadcrumb-company-name").textContent = comp.name || "Chi tiết công ty";
  document.title = `${comp.name || "Công ty"} - Tuyển dụng | TechRecruit`;
  const metaDesc = $("company-meta-description");
  const snippet = (comp.tagline || comp.description || "").trim().slice(0, 150);
  if (metaDesc && snippet) metaDesc.setAttribute("content", snippet);

  renderHeroSection(comp);
  renderStatsStrip(comp);
  renderAboutSection(comp);
  renderSidebarAndSimilar(comp);

  if ($("company-skeleton-host")) $("company-skeleton-host").hidden = true;
  if ($("company-state-host")) $("company-state-host").hidden = true;
  if ($("company-detail-root")) $("company-detail-root").hidden = false;
}
