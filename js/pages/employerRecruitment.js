/**
 * employerRecruitment.js - Quản lý tuyển dụng tập trung (Tin tuyển dụng, Ứng viên, Lịch phỏng vấn).
 * Tuân thủ techrecruit-rules: < 250 dòng, không alert/confirm/<select> gốc, WAI-ARIA tablist.
 */
import { openCandidateDrawer } from "../components/employerCandidateDrawer.js";
import { openRejectApplicationModal } from "../components/rejectApplicationModal.js";
import { initInterviewCalendar } from "../components/employerInterviewCalendar.js";
import { showToast } from "../components/toast.js";
import { auth } from "../core/auth.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function formatDateVN(iso) {
  if (!iso) return "Chưa đặt";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Chưa đặt";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const state = {
  activeTab: "jobs",
  jobId: null,
  status: "all",
  q: "",
  sort: "newest",
  page: 1,
  pageSize: 10,
  candidatesData: null,
};

let searchTimer = null;
let interviewCalendarInstance = null;

function syncUrl() {
  const params = new URLSearchParams(window.location.search);
  params.set("tab", state.activeTab);
  if (state.jobId) params.set("job", state.jobId);
  else params.delete("job");
  if (state.status && state.status !== "all") params.set("status", state.status);
  else params.delete("status");
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nextUrl);
}

function parseUrl() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  if (["jobs", "candidates", "interviews"].includes(tab)) {
    state.activeTab = tab;
  }
  const job = params.get("job") || params.get("job_id");
  if (job) state.jobId = parseInt(job, 10);
  const status = params.get("status");
  if (status) state.status = status;
}

export function switchTab(tabKey) {
  state.activeTab = tabKey;
  syncUrl();

  ["jobs", "candidates", "interviews"].forEach((k) => {
    const tabBtn = document.getElementById(`tab-${k}`);
    const panel = document.getElementById(`panel-${k}`);
    const isActive = k === tabKey;
    if (tabBtn) {
      tabBtn.classList.toggle("is-active", isActive);
      tabBtn.setAttribute("aria-selected", isActive ? "true" : "false");
      tabBtn.tabIndex = isActive ? 0 : -1;
    }
    if (panel) {
      panel.hidden = !isActive;
    }
  });

  if (tabKey === "candidates") {
    loadCandidates();
  } else if (tabKey === "interviews") {
    if (!interviewCalendarInstance) {
      interviewCalendarInstance = initInterviewCalendar(document.getElementById("panel-interviews"), {
        onReloadParent: updateHeaderCounts,
      });
    } else {
      interviewCalendarInstance.reload();
    }
  }
}

window.switchToCandidatesTab = (jobId) => {
  if (jobId) state.jobId = jobId;
  switchTab("candidates");
};

async function updateHeaderCounts() {
  await auth.ready;
  const token = auth.getToken() || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  const authHeaders = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  try {
    const [jobsRes, appsRes, ivsRes] = await Promise.all([
      fetch(`${base}/employer/jobs?page_size=1`, { headers: authHeaders }),
      fetch(`${base}/employer/applications?page_size=1`, { headers: authHeaders }),
      fetch(`${base}/employer/interviews`, { headers: authHeaders }),
    ]);

    if (jobsRes.ok) {
      const jData = await jobsRes.json();
      const countEl = document.getElementById("count-tab-jobs");
      if (countEl) countEl.textContent = jData.pagination?.total_items ?? jData.total ?? 0;
    }
    if (appsRes.ok) {
      const aData = await appsRes.json();
      const countEl = document.getElementById("count-tab-candidates");
      if (countEl) countEl.textContent = aData.total || 0;
    }
    if (ivsRes.ok) {
      const ivData = await ivsRes.json();
      const countEl = document.getElementById("count-tab-interviews");
      if (countEl) countEl.textContent = Array.isArray(ivData) ? ivData.filter(i => i.status === "scheduled").length : 0;
    }
  } catch {}
}

async function loadCandidates() {
  const listEl = document.getElementById("rec-cand-list");
  if (!listEl) return;
  listEl.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--text-secondary);">Đang tải danh sách ứng viên...</div>`;

  await auth.ready;
  const token = auth.getToken() || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  const authHeaders = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  let url = `${base}/employer/applications?page=${state.page}&page_size=${state.pageSize}&sort=${state.sort}`;
  if (state.jobId) url += `&job_id=${state.jobId}`;
  if (state.status && state.status !== "all") url += `&status=${state.status}`;
  if (state.q.trim()) url += `&q=${encodeURIComponent(state.q.trim())}`;

  try {
    const res = await fetch(url, { headers: authHeaders });
    if (!res.ok) throw new Error("Không thể tải danh sách ứng viên");
    const data = await res.json();
    state.candidatesData = data;
    renderStatusBar(data.tabs || []);
    renderJobFilter(data.jobs || []);
    renderSortFilter();
    renderCandidateRows(data.items || []);
    renderCandidatesPagination(data.total);
    updateHeaderCounts();
  } catch (err) {
    listEl.innerHTML = `<div style="padding: 32px; text-align: center; color: red;">${esc(err.message)}</div>`;
  }
}

function renderStatusBar(tabs) {
  const host = document.getElementById("rec-cand-status-bar");
  if (!host) return;

  host.innerHTML = tabs.map((t) => {
    const isActive = state.status === t.key || (!state.status && t.key === "all");
    return `
      <button type="button" class="rec-status-btn ${isActive ? 'is-active' : ''}" data-status="${t.key}" role="tab" aria-selected="${isActive}">
        <span>${esc(t.label)}</span>
        <span class="rec-status-badge">${t.count}</span>
      </button>
    `;
  }).join("");

  host.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.status = btn.getAttribute("data-status");
      state.page = 1;
      syncUrl();
      loadCandidates();
    });
  });
}

function renderJobFilter(jobs) {
  const host = document.getElementById("rec-cand-job-select");
  if (!host || host.dataset.rendered) return;
  host.dataset.rendered = "true";

  const options = [
    { value: "", label: "Tất cả tin tuyển dụng" },
    ...jobs.map((j) => ({ value: String(j.id), label: j.title })),
  ];

  if (window.CustomSelect) {
    new window.CustomSelect(host, {
      options,
      value: state.jobId ? String(state.jobId) : "",
      placeholder: "Tất cả tin tuyển dụng",
      onChange: (val) => {
        state.jobId = val ? parseInt(val, 10) : null;
        state.page = 1;
        syncUrl();
        loadCandidates();
      },
    });
  }
}

function renderSortFilter() {
  const host = document.getElementById("rec-cand-sort-host");
  if (!host || host.dataset.rendered) return;
  host.dataset.rendered = "true";

  const options = [
    { value: "newest", label: "Mới nhất" },
    { value: "match_score", label: "Khớp nhất" },
  ];

  if (window.CustomSelect) {
    new window.CustomSelect(host, {
      options,
      value: state.sort,
      placeholder: "Sắp xếp",
      onChange: (val) => {
        state.sort = val;
        state.page = 1;
        loadCandidates();
      },
    });
  }
}

function renderCandidateRows(items) {
  const host = document.getElementById("rec-cand-list");
  if (!host) return;

  if (items.length === 0) {
    host.innerHTML = `
      <div style="padding: 48px 16px; text-align: center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-muted); margin-bottom:12px;"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 1 0-16 0"></path></svg>
        <p style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px;">Chưa có hồ sơ ứng viên</p>
        <p style="font-size: 13.5px; color: var(--text-secondary); margin: 0;">Hiện chưa có hồ sơ nào phù hợp với bộ lọc đã chọn.</p>
      </div>
    `;
    return;
  }

  host.innerHTML = items.map((item) => {
    const isNew = !item.is_viewed;
    const tone = item.status_tone || "neutral";
    return `
      <article class="rec-cand-item" data-app-id="${item.id}">
        <div class="rec-cand-info">
          <input type="checkbox" class="rec-cand-check" data-bulk-id="${item.id}" aria-label="Chọn hồ sơ của ${esc(item.candidate.full_name)}">
          <div class="rec-cand-avatar-wrap">
            <span class="rec-cand-avatar">${esc((item.candidate.full_name || "U").charAt(0).toUpperCase())}</span>
            ${isNew ? `<span class="rec-dot-new" role="status" aria-label="Hồ sơ mới chưa xem" title="Hồ sơ mới chưa xem"><span class="sr-only">Hồ sơ mới</span></span>` : ""}
          </div>

          <div class="rec-cand-meta">
            <div class="rec-cand-name-row">
              <span class="rec-cand-name">${esc(item.candidate.full_name)}</span>
              <span class="rec-cand-app-id" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); background:var(--bg-subtle, #f1f5f9); padding:2px 7px; border-radius:4px; border:1px solid var(--border-subtle, #e2e8f0);" title="Mã hồ sơ ứng tuyển">#APP-${item.id}</span>
              <span class="rec-badge-score">Khớp ${item.match_score}%</span>
              ${isNew ? `<span class="rec-badge-new">MỚI</span>` : ""}
            </div>
            <div class="rec-cand-job-line">
              <span class="rec-cand-job-title">${esc(item.job.title)}</span>
              <span class="meta-dot">·</span>
              <span>Nộp ${formatDateVN(item.created_at)}</span>
            </div>
          </div>
        </div>

        <div class="rec-cand-status-wrap">
          <span class="rec-status-pill rec-status-pill--${tone}">${esc(item.status_label)}</span>
          <button type="button" class="rec-btn-view-profile" data-action="view-candidate" data-id="${item.id}">
            <span>Xem hồ sơ</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </article>
    `;
  }).join("") + `
    <div id="rec-bulk-bar" class="rec-bulk-bar" hidden>
      <span id="rec-bulk-count" style="font-size:13.5px; font-weight:600;">Đã chọn 0 hồ sơ</span>
      <div style="display:flex; gap:8px;">
        <button type="button" id="rec-bulk-clear" class="rec-btn-view-profile" style="min-height:40px; padding:0 12px;">Bỏ chọn</button>
        <button type="button" id="rec-bulk-reject-btn" class="rec-btn-danger-solid" style="min-height:40px; padding:0 16px;">Từ chối (0)</button>
      </div>
    </div>
  `;

  const selectedIds = new Set();
  const bulkBar = document.getElementById("rec-bulk-bar");
  const bulkCount = document.getElementById("rec-bulk-count");
  const bulkRejBtn = document.getElementById("rec-bulk-reject-btn");
  const updateBulkBar = () => {
    const n = selectedIds.size;
    if (bulkBar) bulkBar.hidden = n === 0;
    if (bulkCount) bulkCount.textContent = `Đã chọn ${n} hồ sơ`;
    if (bulkRejBtn) bulkRejBtn.textContent = `Từ chối (${n})`;
  };

  host.querySelectorAll(".rec-cand-check").forEach((chk) => {
    chk.addEventListener("change", () => {
      const id = Number(chk.getAttribute("data-bulk-id"));
      if (chk.checked) selectedIds.add(id);
      else selectedIds.delete(id);
      updateBulkBar();
    });
  });

  document.getElementById("rec-bulk-clear")?.addEventListener("click", () => {
    selectedIds.clear();
    host.querySelectorAll(".rec-cand-check").forEach((c) => { c.checked = false; });
    updateBulkBar();
  });

  bulkRejBtn?.addEventListener("click", async (e) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    let reasons = [];
    try {
      const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
      const r = await fetch(`${base}/meta/rejection-reasons`);
      if (r.ok) reasons = await r.json();
    } catch {}
    openRejectApplicationModal({
      mode: "bulk",
      ids,
      rejectionReasons: reasons,
      triggerEl: e.currentTarget,
      onSuccess: (res) => {
        showToast(`Đã từ chối ${res.rejected_count}, bỏ qua ${res.skipped_count} (đã ở trạng thái cuối)`, res.rejected_count > 0 ? "success" : "info");
        selectedIds.clear();
        loadCandidates();
      },
    });
  });

  host.querySelectorAll("[data-action='view-candidate']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openCandidateDrawer(id, {
        onUpdated: () => loadCandidates(),
        onMarkViewed: (appId) => {
          const row = host.querySelector(`[data-app-id='${appId}']`);
          row?.querySelector(".rec-dot-new")?.remove();
          row?.querySelector(".rec-badge-new")?.remove();
          updateHeaderCounts();
        },
      });
    });
  });
}

function renderCandidatesPagination(total) {
  const host = document.getElementById("rec-cand-pagination");
  if (!host) return;
  const totalPages = Math.ceil((total || 0) / state.pageSize);
  if (totalPages <= 1) {
    host.hidden = true;
    return;
  }
  host.hidden = false;
  host.innerHTML = `
    <button type="button" class="ej-page-btn" id="rec-cand-prev" ${state.page <= 1 ? "disabled" : ""}>Trước</button>
    <span style="font-size:13px; color:var(--text-secondary); align-self:center;">Trang ${state.page} / ${totalPages}</span>
    <button type="button" class="ej-page-btn" id="rec-cand-next" ${state.page >= totalPages ? "disabled" : ""}>Sau</button>
  `;
  document.getElementById("rec-cand-prev")?.addEventListener("click", () => {
    if (state.page > 1) { state.page--; loadCandidates(); }
  });
  document.getElementById("rec-cand-next")?.addEventListener("click", () => {
    if (state.page < totalPages) { state.page++; loadCandidates(); }
  });
}

function setupCandidateSearch() {
  const input = document.getElementById("rec-cand-search");
  const clearBtn = document.getElementById("rec-cand-search-clear");
  input?.addEventListener("input", (e) => {
    const val = e.target.value;
    if (clearBtn) clearBtn.hidden = !val;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.q = val;
      state.page = 1;
      loadCandidates();
    }, 300);
  });
  clearBtn?.addEventListener("click", () => {
    input.value = "";
    clearBtn.hidden = true;
    state.q = "";
    state.page = 1;
    loadCandidates();
  });
}

async function init() {
  await auth.ready;
  parseUrl();

  // Tab buttons click & keyboard navigation
  ["jobs", "candidates", "interviews"].forEach((k) => {
    document.getElementById(`tab-${k}`)?.addEventListener("click", () => switchTab(k));
  });

  setupCandidateSearch();
  updateHeaderCounts();

  window.addEventListener("techrecruit:new_application", () => {
    updateHeaderCounts();
    if (state.activeTab === "candidates") {
      let banner = document.getElementById("rec-new-cand-banner");
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "rec-new-cand-banner";
        banner.style.cssText = "margin: 12px 0; display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #f0fdfa; border: 1px solid #0f766e; border-radius: 8px; font-weight: 500; color: #0f766e;";
        const host = document.getElementById("rec-cand-list");
        host?.parentNode?.insertBefore(banner, host);
      }
      banner.innerHTML = `<span>Có 1 hồ sơ mới, bấm để tải lại</span><button type="button" class="btn btn-sm btn-primary" id="btn-reload-new-cand" style="padding: 4px 12px; font-size: 13px;">Tải lại</button>`;
      banner.querySelector("#btn-reload-new-cand")?.addEventListener("click", () => {
        banner.remove();
        loadCandidates();
      });
    }
  });

  // Import and run employerJobs for tab 1
  try {
    await import("./employerJobs.js");
  } catch {}

  // Switch to initial tab from URL
  switchTab(state.activeTab);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
