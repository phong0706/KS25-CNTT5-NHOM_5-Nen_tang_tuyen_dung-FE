/**
 * companyDetailPage.js - Trang Chi tiết Công ty (/pages/company.html?slug=) (< 170 dòng).
 */
import { renderFullCompanyProfile } from "../components/companyDetailRender.js";
import {
  renderCompanyJobsFallback,
  renderCompanyPageState,
  renderFacetChips,
} from "../components/companyDetailSections.js";
import {
  bindApplyJobButtons,
  bindSaveJobButtons,
  renderJobCard,
  renderJobCardSkeletons,
} from "../components/jobCard.js";
import { openApplyModal } from "../components/applyModal.js";
import { renderPagination } from "../components/pagination.js";
import { showStatusToast } from "../components/toast.js";
import { jobDetailUrl } from "../routes.js";

const JOBS_PAGE_SIZE = 10;
const $ = (id) => document.getElementById(id);

let jobAbort = null;
let sortSelect = null;
let state = { slug: "", location: "", level: "", sort: "latest", page: 1 };
let lastJobsItems = [];

function parseDetailState() {
  const p = new URLSearchParams(window.location.search);
  const pg = parseInt(p.get("page") || "1", 10);
  const s = (p.get("sort") || "latest").trim();
  return {
    slug: (p.get("slug") || "").trim(), location: (p.get("location") || "").trim(),
    level: (p.get("level") || "").trim(), sort: s === "salary" ? "salary" : "latest",
    page: Number.isFinite(pg) && pg >= 1 ? pg : 1,
  };
}

function syncJobsUrl(replace = false) {
  const p = new URLSearchParams();
  if (state.slug) p.set("slug", state.slug);
  if (state.location) p.set("location", state.location);
  if (state.level) p.set("level", state.level);
  if (state.sort !== "latest") p.set("sort", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  window.history[replace ? "replaceState" : "pushState"](null, "", `${window.location.pathname}?${p.toString()}`);
}

function setupRevealObserver() {
  const els = document.querySelectorAll(".company-reveal");
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-revealed")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); } });
  }, { threshold: 0.05 });
  els.forEach((el) => io.observe(el));
}

async function loadCompanyJobs(scrollToJobs = false) {
  const listEl = $("company-jobs-list"), pagerEl = $("company-jobs-pagination"), headingEl = $("company-jobs-heading"), filtersEl = $("company-jobs-filters");
  if (!listEl || !state.slug) return;
  if (jobAbort) jobAbort.abort();
  jobAbort = new AbortController();
  renderJobCardSkeletons(listEl, 3);
  if (pagerEl) pagerEl.hidden = true;
  sortSelect?.setValue?.(state.sort);

  try {
    const data = await window.api.get(`/companies/${encodeURIComponent(state.slug)}/jobs`, {
      sort: state.sort, location: state.location || undefined, level: state.level || undefined, page: state.page, page_size: JOBS_PAGE_SIZE,
    }, { signal: jobAbort.signal });

    const total = Number(data.total || 0);
    if (headingEl) headingEl.textContent = `Việc làm đang tuyển (${total})`;
    if (scrollToJobs && headingEl) { headingEl.scrollIntoView({ behavior: "smooth", block: "start" }); headingEl.focus({ preventScroll: true }); }

    renderFacetChips("company-jobs-loc-chips", data.facets?.location, state.location, (v) => { state.location = v; state.page = 1; syncJobsUrl(); loadCompanyJobs(); });
    renderFacetChips("company-jobs-lvl-chips", data.facets?.level, state.level, (v) => { state.level = v; state.page = 1; syncJobsUrl(); loadCompanyJobs(); });
    if (filtersEl) filtersEl.hidden = !$("company-jobs-loc-chips")?.children.length && !$("company-jobs-lvl-chips")?.children.length;

    lastJobsItems = Array.isArray(data.items) ? data.items : [];
    if (!lastJobsItems.length) { renderCompanyJobsFallback(listEl, { isError: false }); return; }

    listEl.innerHTML = lastJobsItems.map((j) => renderJobCard(j, { compact: true, showSaveBtn: true, showApplyBtn: true })).join("");
    bindSaveJobButtons(listEl, { onToast: (m, t) => showStatusToast(m, t === "success" ? "success" : "danger") });
    bindApplyJobButtons(listEl, {
      onApply: (jobId, trigger) => {
        const jobObj = lastJobsItems.find((x) => Number(x.id) === Number(jobId));
        if (jobObj) openApplyModal(jobObj, { triggerBtn: trigger }); else window.location.href = jobDetailUrl(jobId);
      },
    });
    listEl.querySelectorAll(".job-card--clickable").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("a, button")) return;
        if (card.dataset.jobHref) window.location.href = card.dataset.jobHref;
      });
    });

    if (pagerEl) {
      const totalPages = Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE));
      renderPagination(pagerEl, { page: data.page || state.page, totalPages, total, pageSize: JOBS_PAGE_SIZE }, (nextPage) => {
        state.page = nextPage; syncJobsUrl(); loadCompanyJobs(true);
      });
    }
  } catch (err) {
    if (err?.name === "CanceledError" || err?.name === "AbortError") return;
    if (headingEl) headingEl.textContent = "Việc làm đang tuyển";
    renderCompanyJobsFallback(listEl, { isError: true, onRetry: () => loadCompanyJobs(false) });
  }
}

function initSortControl() {
  const host = $("company-jobs-sort-host");
  if (!host || !window.CustomSelect) return;
  sortSelect = new window.CustomSelect(host, {
    id: "company-jobs-sort", name: "sort", placeholder: "Sắp xếp", ariaLabel: "Sắp xếp việc làm",
    options: [{ value: "latest", label: "Mới nhất" }, { value: "salary", label: "Lương cao nhất" }], value: state.sort,
  });
  host.addEventListener("change", (e) => {
    state.sort = e.target.value === "salary" ? "salary" : "latest";
    state.page = 1; syncJobsUrl(); loadCompanyJobs();
  });
}

async function boot() {
  state = parseDetailState();
  if (!state.slug) { renderCompanyPageState({ is404: true }); return; }
  initSortControl();
  window.addEventListener("popstate", () => {
    const prev = state.slug; state = parseDetailState();
    if (state.slug !== prev) window.location.reload(); else loadCompanyJobs();
  });
  try {
    const comp = await window.api.get(`/companies/${encodeURIComponent(state.slug)}`);
    renderFullCompanyProfile(comp);
    setupRevealObserver();
    loadCompanyJobs(false);
  } catch (err) {
    const is404 = err?.status === 404 || err?.response?.status === 404;
    renderCompanyPageState({ is404, onRetry: () => window.location.reload() });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
