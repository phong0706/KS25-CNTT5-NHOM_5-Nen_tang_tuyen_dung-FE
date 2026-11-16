/**
 * Trang Quản lý tin tuyển dụng của nhà tuyển dụng (/pages/employer/jobs.html)
 */
import { renderStatusTabs } from "../components/statusTabs.js";
import { renderJobRows, renderJobSkeletons } from "../components/jobRow.js";
import { renderPagination, renderEmptyState, renderErrorState, setupBulkBar, updateBulkBarUI } from "../components/listStates.js";
import { openActionMenu, executeJobAction } from "../components/actionMenu.js";
import { openConfirmModal } from "../components/confirmModal.js";
import { showStatusToast, showUndoToast } from "../components/toast.js";

const POLL_INTERVAL_MS = 60000;
const SORT_UI_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "most_applicants", label: "Nhiều hồ sơ nhất" },
  { value: "expiring_soon", label: "Sắp hết hạn" },
];

const state = {
  status: "all",
  q: "",
  sort: "newest",
  page: 1,
  requestSeq: 0,
  selectedIds: new Set(),
  currentItems: [],
  pollTimer: null,
  searchTimer: null,
  highlightJobId: 0,
};

function readParamsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  state.status = params.get("status") || "all";
  state.q = params.get("q") || "";
  state.sort = params.get("sort") || "newest";
  const p = parseInt(params.get("page") || "1", 10);
  state.page = Number.isFinite(p) && p >= 1 ? p : 1;
  // job_id: tô đậm tin được trỏ tới (dùng khi bấm vào thông báo).
  const j = parseInt(params.get("job_id") || "0", 10);
  state.highlightJobId = Number.isFinite(j) && j > 0 ? j : 0;
}

function syncUrl() {
  const params = new URLSearchParams(window.location.search);
  if (state.status && state.status !== "all") params.set("status", state.status);
  else if (params.get("tab") === "jobs") params.delete("status");
  if (state.q.trim()) params.set("q", state.q.trim());
  else params.delete("q");
  if (state.sort && state.sort !== "newest") params.set("sort", state.sort);
  else params.delete("sort");
  if (state.page > 1) params.set("page", String(state.page));
  else params.delete("page");
  const qs = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? "?" + qs : ""}`);
}

function clearSearchFilter() {
  state.q = "";
  state.page = 1;
  const input = document.getElementById("ej-search-input");
  const clearBtn = document.getElementById("ej-search-clear");
  if (input) input.value = "";
  if (clearBtn) clearBtn.hidden = true;
  syncUrl();
  loadJobs();
}

async function loadJobs(options = {}) {
  const rowsEl = document.getElementById("ej-rows");
  const tabsEl = document.getElementById("ej-tablist");
  const paginationEl = document.getElementById("ej-pagination");
  const listHeadEl = document.getElementById("ej-list-head");
  if (!rowsEl) return;

  const seq = ++state.requestSeq;
  if (!options.silent) {
    renderJobSkeletons(rowsEl, 6);
    if (paginationEl) paginationEl.hidden = true;
  }
  try {
    const data = await window.api.get("/employer/jobs", {
      status: state.status === "all" ? "" : state.status,
      q: state.q.trim(),
      sort: state.sort,
      page: state.page,
    });
    if (seq !== state.requestSeq) return;
    if (!(data.tabs || []).some((t) => t.key === state.status) && state.status !== "hidden") {
      state.status = "all";
      syncUrl();
    }
    renderStatusTabs(tabsEl, data.tabs, state.status, (nextStatus) => {
      state.status = nextStatus;
      state.page = 1;
      syncUrl();
      loadJobs();
    });
    if (!data.items || data.items.length === 0) {
      state.currentItems = [];
      updateBulkBarUI(state.selectedIds, []);
      if (listHeadEl) listHeadEl.hidden = true;
      renderEmptyState(rowsEl, { status: state.status, query: state.q, tabs: data.tabs }, clearSearchFilter);
      renderPagination(paginationEl, null, state.page, null);
      return;
    }
    state.currentItems = data.items;
    if (listHeadEl) listHeadEl.hidden = false;
    renderJobRows(rowsEl, data.items, {
      selectedIds: state.selectedIds,
      onToggleSelect: (jobId, checked) => {
        if (checked) state.selectedIds.add(jobId);
        else state.selectedIds.delete(jobId);
        updateBulkBarUI(state.selectedIds, state.currentItems);
      },
      onViewApplicants: (job) => {
        if (typeof window.switchToCandidatesTab === "function") {
          window.switchToCandidatesTab(job.id);
        } else {
          window.location.href = `./recruitment.html?tab=candidates&job=${job.id}`;
        }
      },
      onOpenMenu: (job, triggerEl) =>
        openActionMenu(triggerEl, job.allowed_actions, (key) =>
          executeJobAction(job, key, triggerEl, { openConfirmModal, showStatusToast, showUndoToast, onReload: loadJobs })
        ),
    });
    updateBulkBarUI(state.selectedIds, state.currentItems);
    renderPagination(paginationEl, data.pagination, state.page, (nextPage) => {
      state.page = nextPage;
      syncUrl();
      loadJobs();
    });
  } catch (err) {
    if (seq !== state.requestSeq) return;
    if (listHeadEl) listHeadEl.hidden = true;
    renderErrorState(rowsEl, err?.message, () => loadJobs());
    if (paginationEl) paginationEl.hidden = true;
  }
}

function setupToolbar() {
  const searchInput = document.getElementById("ej-search-input");
  const clearBtn = document.getElementById("ej-search-clear");
  const sortHost = document.getElementById("ej-sort-select");

  if (searchInput) {
    searchInput.value = state.q;
    if (clearBtn) clearBtn.hidden = !state.q;
    searchInput.addEventListener("input", () => {
      const val = searchInput.value;
      if (clearBtn) clearBtn.hidden = !val;
      window.clearTimeout(state.searchTimer);
      state.searchTimer = window.setTimeout(() => {
        state.q = val;
        state.page = 1;
        syncUrl();
        loadJobs();
      }, 300);
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener("click", () => {
      clearSearchFilter();
      searchInput.focus();
    });
  }

  if (sortHost && window.CustomSelect) {
    new window.CustomSelect(sortHost, {
      id: "ej-sort",
      name: "sort",
      ariaLabel: "Sắp xếp danh sách tin",
      options: SORT_UI_OPTIONS,
      value: state.sort,
      onChange: (nextVal) => {
        state.sort = nextVal || "newest";
        state.page = 1;
        syncUrl();
        loadJobs();
      },
    });
  }
}

function setupAutoRefresh() {
  const startPolling = () => {
    window.clearInterval(state.pollTimer);
    if (!document.hidden) state.pollTimer = window.setInterval(() => !document.hidden && loadJobs({ silent: true }), POLL_INTERVAL_MS);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.clearInterval(state.pollTimer);
    else { loadJobs({ silent: true }); startPolling(); }
  });
  window.addEventListener("focus", () => !document.hidden && loadJobs({ silent: true }));
  startPolling();
}

function init() {
  if (window.ProtectedRoute && !window.ProtectedRoute.requireAuth({ roles: ["recruiter", "employer"] })) return;
  readParamsFromUrl();
  setupToolbar();
  setupBulkBar({ selectedIds: state.selectedIds, getCurrentItems: () => state.currentItems, openConfirmModal, showStatusToast, onReload: loadJobs });
  loadJobs().then(highlightTargetJob);
  setupAutoRefresh();
}

/**
 * Tô đậm tin tuyển dụng được trỏ tới từ thông báo (?job_id=123).
 * Xoá job_id khỏi URL sau khi dùng để F5 không nhảy lại.
 */
function highlightTargetJob() {
  const jobId = state.highlightJobId;
  if (!jobId) return;
  state.highlightJobId = 0;

  const params = new URLSearchParams(window.location.search);
  params.delete("job_id");
  const qs = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? "?" + qs : ""}`);

  const row = document.querySelector(`[data-job-id="${jobId}"]`);
  if (!row) return;
  row.classList.add("is-highlighted");
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => row.classList.remove("is-highlighted"), 4000);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
