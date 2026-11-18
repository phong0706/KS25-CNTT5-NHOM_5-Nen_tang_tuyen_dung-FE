/**
 * companyDetailRender.js - Render Hero, Tooltip Xác minh, Stats & các khối trang Công ty (< 180 dòng).
 */
import { renderAboutSection, renderSidebarAndSimilar } from "./companyDetailSections.js";
import { formatRelativeTime, renderCompanyLogo } from "./jobCard.js";
import { showStatusToast } from "./toast.js";
import { formatDomain, formatSizeRange, safeUrl } from "../utils/companyUtils.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = String(text);
  return n;
};
let tooltipOutsideBound = false;

function formatDateVi(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

function formatSalaryUnits(salary) {
  if (!salary || (salary.min == null && salary.max == null)) return "";
  const toTrieu = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return "";
    return `${Math.round((n / 1e6) * 10) / 10}`;
  };
  const a = toTrieu(salary.min), b = toTrieu(salary.max);
  if (a && b) return `${a}–${b} triệu đồng/tháng`;
  if (a) return `từ ${a} triệu đồng/tháng`;
  return b ? `đến ${b} triệu đồng/tháng` : "";
}

function setupVerifiedBadge(comp) {
  const btn = $("company-verified-btn"), tip = $("company-verified-tooltip"), pending = $("company-pending-badge");
  if (!btn || !tip || !pending) return;
  btn.hidden = true; tip.hidden = true; pending.hidden = true;
  btn.removeAttribute("title");

  const st = comp.verification_status || (comp.is_verified === true ? "da_xac_minh" : "chua_xac_minh");
  if (st === "cho_duyet") { pending.hidden = false; return; }
  if (st !== "da_xac_minh") return;

  btn.hidden = false;
  btn.replaceChildren();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  [["width", "14"], ["height", "14"], ["viewBox", "0 0 24 24"], ["fill", "none"],
   ["stroke", "currentColor"], ["stroke-width", "2.4"], ["aria-hidden", "true"]].forEach(([k, v]) => svg.setAttribute(k, v));
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.setAttribute("points", "20 6 9 17 4 12");
  svg.appendChild(poly);
  btn.append(svg, el("span", "", "Đã xác minh"));

  const dateTxt = formatDateVi(comp.verified_at);
  tip.textContent = dateTxt
    ? `Đã được duyệt ngày ${dateTxt}. Mã số thuế và giấy phép đã được kiểm tra.`
    : "Mã số thuế và giấy phép đã được kiểm tra.";

  const setOpen = (open) => {
    tip.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      tip.style.left = "0"; tip.style.right = "auto";
      const r = tip.getBoundingClientRect();
      if (r.right > window.innerWidth - 16) {
        tip.style.left = `${Math.max(-r.left + 12, window.innerWidth - 16 - r.right)}px`;
      }
    }
  };
  btn.onmouseenter = () => setOpen(true);
  btn.onmouseleave = () => { if (document.activeElement !== btn) setOpen(false); };
  btn.onfocus = () => setOpen(true);
  btn.onblur = () => setOpen(false);
  btn.onclick = (e) => { e.stopPropagation(); setOpen(tip.hidden); };
  btn.onkeydown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); btn.focus(); }
  };
  if (!tooltipOutsideBound) {
    tooltipOutsideBound = true;
    document.addEventListener("click", (e) => {
      const wrap = $("company-verified-host");
      if (wrap && !wrap.contains(e.target)) {
        const t = $("company-verified-tooltip"), b = $("company-verified-btn");
        if (t && !t.hidden) { t.hidden = true; b?.setAttribute("aria-expanded", "false"); }
      }
    });
  }
}

function renderHeroSection(comp) {
  const coverEl = $("company-cover-img");
  if (coverEl) {
    const validCover = safeUrl(comp.cover_url, ["http:", "https:"], { allowRelativeUploads: true });
    coverEl.hidden = !validCover;
    coverEl.alt = "";
    if (validCover) {
      coverEl.src = validCover;
      coverEl.onerror = () => { coverEl.hidden = true; };
    } else coverEl.removeAttribute("src");
  }
  const logoHost = $("company-logo-host");
  if (logoHost) logoHost.replaceChildren(renderCompanyLogo(comp, "lg"));
  if ($("company-name-heading")) $("company-name-heading").textContent = comp.name || "Doanh nghiệp";
  setupVerifiedBadge(comp);

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
  const lines = [];
  if (Number(comp.open_jobs || 0) > 0) lines.push(`Đang tuyển: ${Number(comp.open_jobs)} vị trí đang mở`);
  const salUnitTxt = formatSalaryUnits(comp.salary_range);
  if (comp.salary_range && salUnitTxt) {
    const sample = Number(comp.salary_range.sample_size || 0);
    lines.push(sample > 0 ? `Mức lương: ${salUnitTxt}, từ ${sample} tin có công khai lương` : `Mức lương: ${salUnitTxt}`);
  }
  if (comp.latest_job_at) lines.push(`Tin mới nhất: ${formatRelativeTime(comp.latest_job_at).text}`);
  strip.hidden = lines.length === 0;
  lines.forEach((txt) => {
    const box = el("div", "company-stat-card");
    box.appendChild(el("span", "company-stat-text", txt));
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
