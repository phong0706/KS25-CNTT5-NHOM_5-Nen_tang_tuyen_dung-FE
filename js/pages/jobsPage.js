/**
 * Trang Tìm việc (/pages/jobs.html)
 * URL là nguồn sự thật, history.pushState, popstate Back/Forward, AbortController, debounce 300ms.
 */
import { buildJobsUrl, parseJobsQuery } from "../utils/urlState.js";
import { renderJobCard, renderJobCardSkeletons, bindSaveJobButtons, bindApplyJobButtons } from "../components/jobCard.js";
import { showStatusToast } from "../components/toast.js";
import { openApplyModal } from "../components/applyModal.js";
import { createFilterPanel } from "../components/filterPanel.js";
import { renderPagination } from "../components/pagination.js";
import { renderFilterChips, countActiveFilters } from "../components/filterChips.js";
import { createFilterDrawer } from "../components/filterDrawer.js";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "salary_desc", label: "Lương cao nhất" },
  { value: "relevant", label: "Phù hợp nhất" },
];

let state = parseJobsQuery();
let filterPanelApi = null;
let filterDrawerApi = null;
let sortSelectApi = null;
let activeController = null;
let searchTimer = null;

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function pushStateAndFetch(patch, resetPage = true) {
  state = { ...state, ...patch, page: resetPage ? 1 : (patch.page ?? state.page) };
  window.history.pushState(null, "", buildJobsUrl(state, window.location.pathname));
  fetchAndRender();
}

function resetAllFilters() {
  pushStateAndFetch({
    q: "", location: "", level: "", type: "", salary_min: "",
    salary_max: "", skills: "", category: "", company_id: "", sort: state.sort,
  }, true);
}

async function fetchAndRender(scrollToResults = false) {
  const listEl = document.getElementById("jobs-list");
  const headingEl = document.getElementById("jobs-result-heading");
  const pageEl = document.getElementById("jobs-pagination");
  const searchEl = document.getElementById("jobs-search-input");
  if (!listEl) return;

  if (searchEl && document.activeElement !== searchEl) {
    searchEl.value = state.q || "";
  }
  sortSelectApi?.setValue(state.sort || "newest", false);

  if (activeController) activeController.abort();
  activeController = new AbortController();

  if (listEl.offsetHeight > 360) listEl.style.minHeight = `${listEl.offsetHeight}px`;
  renderJobCardSkeletons(listEl, 6);
  if (pageEl) pageEl.hidden = true;

  try {
    const params = {
      q: state.q || undefined, location: state.location || undefined,
      level: state.level || undefined, type: state.type || undefined,
      salary_min: state.salary_min || undefined, salary_max: state.salary_max || undefined,
      skills: state.skills || undefined, category: state.category || undefined,
      company_id: state.company_id || undefined, sort: state.sort || "newest",
      page: state.page || 1, page_size: 10,
    };
    const data = await window.api.get("/jobs", params, { signal: activeController.signal });
    filterPanelApi?.sync(state, data.facets);
    filterDrawerApi?.updateCount(data.total);
    const activeCount = countActiveFilters(state, data.facets);
    const mobileLabel = document.getElementById("jobs-mobile-filter-label");
    if (mobileLabel) mobileLabel.textContent = activeCount > 0 ? `Bộ lọc (${activeCount})` : "Bộ lọc";

    renderFilterChips(document.getElementById("jobs-chips-host"), state, data.facets, {
      onRemove: (chip) => {
        if (chip.key === "q" || chip.key === "company_id") pushStateAndFetch({ [chip.key]: "" }, true);
        else if (chip.key === "salary") pushStateAndFetch({ salary_min: "", salary_max: "" }, true);
        else pushStateAndFetch({ [chip.key]: String(state[chip.key] || "").split(",").filter((v) => v && v !== chip.value).join(",") }, true);
      },
      onClearAll: resetAllFilters,
    });
    if (headingEl) headingEl.textContent = `Tìm thấy ${Number(data.total || 0)} việc làm`;

    if (!data.items || data.items.length === 0) {
      listEl.innerHTML = `
        <div class="home-error-card" style="border-color: var(--border-default);">
          <p class="home-error-text" style="color: var(--text-secondary);">Không có việc làm phù hợp. Thử bỏ bớt bộ lọc.</p>
          <button type="button" class="btn btn-primary" id="jobs-empty-reset">Xóa bộ lọc</button>
        </div>
      `;
      document.getElementById("jobs-empty-reset")?.addEventListener("click", resetAllFilters);
      renderPagination(pageEl, { page: 1, totalPages: 1, total: 0 }, null);
      return;
    }

    listEl.innerHTML = data.items
      .map((job) => renderJobCard(job, { detailBase: "./items.html", showSaveBtn: true, showApplyBtn: true }))
      .join("");
    listEl.style.minHeight = "";
    bindSaveJobButtons(listEl, { onToast: showStatusToast });
    bindApplyJobButtons(listEl, {
      onApply: (jobId, btn) => {
        const j = data.items.find((x) => x.id === jobId);
        if (j) openApplyModal(j, { triggerBtn: btn });
      },
    });

    const pendingApply = sessionStorage.getItem("auto_apply_job_id");
    if (pendingApply) {
      const matchJob = data.items.find((x) => String(x.id) === String(pendingApply));
      if (matchJob) {
        sessionStorage.removeItem("auto_apply_job_id");
        openApplyModal(matchJob);
      }
    }

    renderPagination(
      pageEl,
      { page: data.page, totalPages: data.total_pages, total: data.total },
      (nextPage) => {
        pushStateAndFetch({ page: nextPage }, false);
        const topEl = document.getElementById("jobs-results-top");
        topEl?.scrollIntoView({ behavior: "smooth", block: "start" });
        headingEl?.focus();
      }
    );

    if (scrollToResults) {
      document.getElementById("jobs-results-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (err) {
    if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
    listEl.innerHTML = `
      <div class="home-error-card" role="alert">
        <p class="home-error-text">${escapeText(err?.message || "Không thể tải danh sách việc làm.")}</p>
        <button type="button" class="btn btn-primary" id="jobs-retry-btn">Thử lại</button>
      </div>
    `;
    document.getElementById("jobs-retry-btn")?.addEventListener("click", () => fetchAndRender());
  }
}

function init() {
  const filterHost = document.getElementById("filter-panel-host");
  const sortHost = document.getElementById("jobs-sort-host");
  const searchInput = document.getElementById("jobs-search-input");

  filterPanelApi = createFilterPanel(filterHost, {
    initialState: state,
    onChange: (patch) => pushStateAndFetch(patch, true),
    onReset: resetAllFilters,
  });

  filterDrawerApi = createFilterDrawer({
    openBtn: document.getElementById("jobs-mobile-filter-btn"),
    panelEl: filterHost,
    layoutEl: document.querySelector(".jobs-layout"),
    onReset: resetAllFilters,
  });

  if (sortHost && window.CustomSelect) {
    sortSelectApi = new window.CustomSelect(sortHost, {
      id: "jobs-sort",
      name: "sort",
      ariaLabel: "Sắp xếp kết quả",
      options: SORT_OPTIONS,
      value: state.sort || "newest",
      onChange: (val) => pushStateAndFetch({ sort: val || "newest" }, true),
    });
  }

  if (searchInput) {
    searchInput.value = state.q || "";
    searchInput.addEventListener("input", () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        pushStateAndFetch({ q: searchInput.value.trim() }, true);
      }, 300);
    });
  }

  window.addEventListener("popstate", () => {
    state = parseJobsQuery();
    fetchAndRender();
  });

  fetchAndRender();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
