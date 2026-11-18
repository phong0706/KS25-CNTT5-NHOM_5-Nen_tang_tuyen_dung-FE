/**
 * companiesPage.js - Trang Danh sách Công ty công khai (/pages/companies.html) (< 190 dòng).
 */
import {
  createCompanyCardElement,
  renderCompanyEmptyState,
  renderCompanyErrorState,
  renderCompanySkeletons,
} from "../components/companyCard.js";
import { attachCompanySuggest, renderActiveFilterChips } from "../components/companySuggest.js";
import { renderPagination } from "../components/pagination.js";
import { buildCompaniesSearchParams, parseCompaniesUrlState } from "../utils/companyUtils.js";

const PAGE_SIZE = 12;
let state = parseCompaniesUrlState(window.location.search);
let listAbort = null;
let lastFacets = { industry: [], location: [], size: [] };
const selects = {};
const $ = (id) => document.getElementById(id);

function syncUrl(replace = false) {
  const qs = buildCompaniesSearchParams(state).toString();
  const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history[replace ? "replaceState" : "pushState"](null, "", nextUrl);
}

function updateControlsFromState() {
  const filterCount = [state.q, state.industry, state.location, state.size, state.hiring === 0 ? "1" : ""].filter(Boolean).length;
  if ($("companies-search-input")) $("companies-search-input").value = state.q;
  if ($("filter-hiring-toggle")) $("filter-hiring-toggle").checked = state.hiring === 1;
  if ($("mobile-filter-label")) $("mobile-filter-label").textContent = `Bộ lọc (${filterCount})`;
  selects.sort?.setValue?.(state.sort);
  selects.industry?.setValue?.(state.industry);
  selects.location?.setValue?.(state.location);
  selects.size?.setValue?.(state.size);
}

function rebuildFacetSelects(facets) {
  if (!window.CustomSelect) return;
  const specs = [
    ["industry", "filter-industry-host", "Tất cả ngành", "Lọc theo ngành", facets?.industry || []],
    ["location", "filter-location-host", "Tất cả địa điểm", "Lọc theo địa điểm", facets?.location || []],
    ["size", "filter-size-host", "Tất cả quy mô", "Lọc theo quy mô", facets?.size || []],
  ];
  specs.forEach(([key, hostId, allLabel, ariaLabel, items]) => {
    const host = $(hostId);
    if (!host) return;
    const opts = [{ value: "", label: allLabel }, ...items.map((f) => ({ value: f.value, label: `${f.label} (${f.count})` }))];
    if (state[key] && !opts.some((o) => o.value === state[key])) opts.push({ value: state[key], label: `${state[key]} (0)` });
    selects[key] = new window.CustomSelect(host, {
      id: `cs-${key}`, name: key, placeholder: allLabel, ariaLabel, options: opts, value: state[key],
    });
  });
}

function applyFilterChange(key, value) {
  state[key] = value;
  state.page = 1;
  syncUrl();
  fetchCompanies();
}

function resetAllFilters() {
  state = { q: "", industry: "", location: "", size: "", hiring: 1, sort: state.sort, page: 1 };
  syncUrl();
  fetchCompanies();
}

async function fetchCompanies(scrollToGrid = false) {
  if (listAbort) listAbort.abort();
  listAbort = new AbortController();
  const grid = $("companies-grid-host");
  const summary = $("companies-summary");
  const pager = $("companies-pagination-host");
  if (!grid) return;

  renderCompanySkeletons(grid, 6);
  updateControlsFromState();
  const removeFilter = (k) => applyFilterChange(k, k === "hiring" ? 1 : "");
  renderActiveFilterChips($("companies-active-chips"), state, lastFacets, removeFilter, resetAllFilters);

  try {
    const res = await window.api.get("/companies", {
      q: state.q || undefined, industry: state.industry || undefined,
      location: state.location || undefined, size: state.size || undefined,
      hiring: state.hiring, sort: state.sort, page: state.page, page_size: PAGE_SIZE,
    }, { signal: listAbort.signal });

    lastFacets = res.facets || { industry: [], location: [], size: [] };
    rebuildFacetSelects(lastFacets);
    renderActiveFilterChips($("companies-active-chips"), state, lastFacets, removeFilter, resetAllFilters);

    const total = Number(res.total || 0);
    if (summary) {
      summary.textContent = `Tìm thấy ${total} công ty`;
      if (scrollToGrid) {
        summary.scrollIntoView({ behavior: "smooth", block: "start" });
        summary.focus({ preventScroll: true });
      }
    }
    if (!state.q && !state.industry && !state.location && !state.size && $("companies-hero-subtitle")) {
      $("companies-hero-subtitle").textContent = `${total} công ty, ${Number(res.hiring_total || 0)} vị trí đang tuyển`;
    }

    if (!res.items || res.items.length === 0) {
      renderCompanyEmptyState(grid, state, lastFacets, removeFilter, resetAllFilters);
      if (pager) pager.hidden = true;
      return;
    }

    const frag = document.createDocumentFragment();
    res.items.forEach((c) => frag.appendChild(createCompanyCardElement(c)));
    grid.replaceChildren(frag);

    if (pager) {
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      renderPagination(pager, { page: res.page || state.page, totalPages, total, pageSize: PAGE_SIZE }, (nextPage) => {
        state.page = nextPage;
        syncUrl();
        fetchCompanies(true);
      });
    }
  } catch (err) {
    if (err?.name === "CanceledError" || err?.name === "AbortError") return;
    if (summary) summary.textContent = "Không thể tải danh sách công ty";
    if (pager) pager.hidden = true;
    renderCompanyErrorState(grid, () => fetchCompanies(false));
  }
}

async function loadRecentHiringSection() {
  const sec = $("companies-recent-section");
  const grid = $("companies-recent-grid");
  if (!sec || !grid) return;
  try {
    const res = await window.api.get("/companies", { hiring: 1, sort: "recent", page: 1, page_size: 4 });
    if ($("companies-hero-subtitle") && res.total != null) {
      $("companies-hero-subtitle").textContent = `${res.total} công ty, ${Number(res.hiring_total || 0)} vị trí đang tuyển`;
    }
    if (!res.items || res.items.length === 0) { sec.hidden = true; return; }
    const frag = document.createDocumentFragment();
    res.items.slice(0, 4).forEach((c) => frag.appendChild(createCompanyCardElement(c)));
    grid.replaceChildren(frag);
    sec.hidden = false;
  } catch { sec.hidden = true; }
}

function setupControls() {
  const sortHost = $("filter-sort-host");
  if (sortHost && window.CustomSelect) {
    selects.sort = new window.CustomSelect(sortHost, {
      id: "cs-sort", name: "sort", placeholder: "Sắp xếp", ariaLabel: "Sắp xếp công ty",
      options: [{ value: "jobs", label: "Nhiều việc nhất" }, { value: "recent", label: "Mới đăng tin" }, { value: "name", label: "Tên A-Z" }],
      value: state.sort,
    });
    sortHost.addEventListener("change", (e) => applyFilterChange("sort", e.target.value || "jobs"));
  }
  [["filter-industry-host", "industry"], ["filter-location-host", "location"], ["filter-size-host", "size"]].forEach(([id, key]) => {
    $(id)?.addEventListener("change", (e) => applyFilterChange(key, e.target.value || ""));
  });
  $("filter-hiring-toggle")?.addEventListener("change", (e) => applyFilterChange("hiring", e.target.checked ? 1 : 0));

  const setDrawer = (open) => {
    $("companies-filter-panel")?.classList.toggle("is-open", open);
    if ($("companies-filter-backdrop")) $("companies-filter-backdrop").hidden = !open;
    $("btn-open-filter-drawer")?.setAttribute("aria-expanded", String(open));
  };
  $("btn-open-filter-drawer")?.addEventListener("click", () => setDrawer(true));
  $("btn-close-filter-drawer")?.addEventListener("click", () => setDrawer(false));
  $("btn-drawer-apply")?.addEventListener("click", () => setDrawer(false));
  $("companies-filter-backdrop")?.addEventListener("click", () => setDrawer(false));
  $("btn-drawer-reset")?.addEventListener("click", () => { resetAllFilters(); setDrawer(false); });

  attachCompanySuggest({
    formEl: $("companies-search-form"),
    inputEl: $("companies-search-input"),
    boxEl: $("companies-suggest-box"),
    onSubmitQuery: (q) => applyFilterChange("q", q),
  });
}

function boot() {
  setupControls();
  window.addEventListener("popstate", () => { state = parseCompaniesUrlState(window.location.search); fetchCompanies(); });
  fetchCompanies();
  loadRecentHiringSection();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
