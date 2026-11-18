/**
 * candidateSavedJobs.js - Trang quản lý việc làm đã lưu (/pages/candidate/saved-jobs.html)
 * Tuân thủ techrecruit-rules: < 200 dòng, không confirm/alert, xử lý đủ 4 trạng thái.
 */
import { renderJobCard, renderJobCardSkeletons, bindSaveJobButtons, bindApplyJobButtons } from "../components/jobCard.js";
import { renderPagination } from "../components/pagination.js";
import { showStatusToast } from "../components/toast.js";
import { jobDetailUrl, jobsUrl, loginUrl, forbiddenUrl, hydrateDataRoutes } from "../routes.js";

let state = { q: "", sort: "newest", page: 1 };
let abortCtrl = null;
let searchTimer = null;

function readUrlState() {
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get("q") || "",
    sort: p.get("sort") || "newest",
    page: Math.max(1, parseInt(p.get("page") || "1", 10)),
  };
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.sort !== "newest") p.set("sort", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  const queryStr = p.toString() ? `?${p.toString()}` : "";
  window.history.pushState(null, "", `${window.location.pathname}${queryStr}`);
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="saved-jobs-empty">
      <div class="saved-empty-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
      </div>
      <h2 class="saved-empty-title">Chưa lưu việc nào</h2>
      <p class="saved-empty-desc">Bạn chưa lưu tin tuyển dụng nào. Hãy khám phá các cơ hội việc làm hấp dẫn ngay hôm nay!</p>
      <a href="${jobsUrl()}" class="btn btn-primary">Khám phá việc làm</a>
    </div>
  `;
}

function renderErrorState(container, onRetry) {
  container.innerHTML = `
    <div class="saved-jobs-error">
      <div class="saved-error-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <h2 class="saved-error-title">Không thể tải danh sách việc làm</h2>
      <p class="saved-error-desc">Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra đường truyền và thử lại.</p>
      <button type="button" class="btn btn-primary" id="saved-jobs-retry-btn">Thử lại</button>
    </div>
  `;
  container.querySelector("#saved-jobs-retry-btn")?.addEventListener("click", onRetry);
}

async function fetchSavedJobs() {
  if (abortCtrl) abortCtrl.abort();
  abortCtrl = new AbortController();
  const listHost = document.getElementById("saved-jobs-list-host");
  const summaryHost = document.getElementById("saved-jobs-summary");
  const pageHost = document.getElementById("saved-jobs-pagination-host");
  if (!listHost) return;

  renderJobCardSkeletons(listHost, 5);
  if (summaryHost) summaryHost.textContent = "Đang tải dữ liệu...";

  try {
    const res = await window.api.get(
      "/candidate/saved-jobs",
      { q: state.q, sort: state.sort, page: state.page, page_size: 10 },
      { signal: abortCtrl.signal }
    );
    const { items = [], total = 0, page = 1, total_pages = 1 } = res;
    if (summaryHost) {
      summaryHost.textContent = total > 0 ? `Hiển thị ${items.length} trên tổng số ${total} việc làm đã lưu` : "Chưa có việc làm nào";
    }

    if (items.length === 0) {
      renderEmptyState(listHost);
      if (pageHost) pageHost.hidden = true;
      return;
    }

    listHost.innerHTML = items.map((j) => renderJobCard(j, { showSaveBtn: true, showApplyBtn: true })).join("");

    listHost.querySelectorAll(".job-card--clickable").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("a, button")) return;
        const href = card.dataset.jobHref;
        if (href) window.location.href = href;
      });
    });

    bindSaveJobButtons(listHost, {
      onToast: (msg, type) => showStatusToast(msg, type === "success" ? "success" : "danger"),
      onChanged: (_jobId, isSaved) => {
        if (!isSaved) {
          fetchSavedJobs();
        }
      },
    });

    bindApplyJobButtons(listHost, {
      onApply: (jobId) => {
        window.location.href = jobDetailUrl(jobId);
      },
    });

    if (pageHost) {
      renderPagination(pageHost, { page, totalPages: total_pages, total }, (newPage) => {
        state.page = newPage;
        syncUrl();
        fetchSavedJobs();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  } catch (err) {
    if (err?.name === "CanceledError" || err?.name === "AbortError") return;
    if (summaryHost) summaryHost.textContent = "Lỗi tải dữ liệu";
    if (pageHost) pageHost.hidden = true;
    renderErrorState(listHost, fetchSavedJobs);
  }
}

async function init() {
  hydrateDataRoutes(document);
  if (!window.Auth?.isAuthenticated?.()) {
    window.location.href = loginUrl(window.location.pathname + window.location.search);
    return;
  }
  if (window.Auth.getRole?.() !== "candidate") {
    window.location.href = forbiddenUrl();
    return;
  }

  state = readUrlState();

  const searchInput = document.getElementById("saved-jobs-search-input");
  if (searchInput) {
    searchInput.value = state.q;
    searchInput.addEventListener("input", () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.q = searchInput.value.trim();
        state.page = 1;
        syncUrl();
        fetchSavedJobs();
      }, 300);
    });
  }

  const sortHost = document.getElementById("saved-jobs-sort-host");
  if (sortHost && window.CustomSelect) {
    new window.CustomSelect(sortHost, {
      id: "saved-jobs-sort-select",
      name: "sort",
      options: [
        { value: "newest", label: "Lưu gần nhất" },
        { value: "expiring_soon", label: "Sắp hết hạn" },
      ],
      value: state.sort,
      ariaLabel: "Sắp xếp việc làm đã lưu",
      onChange: (val) => {
        state.sort = val || "newest";
        state.page = 1;
        syncUrl();
        fetchSavedJobs();
      },
    });
  }

  window.addEventListener("popstate", () => {
    state = readUrlState();
    fetchSavedJobs();
  });

  fetchSavedJobs();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
