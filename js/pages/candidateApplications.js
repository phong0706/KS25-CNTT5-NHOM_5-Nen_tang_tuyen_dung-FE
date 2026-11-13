/**
 * candidateApplications.js - Trang Quản lý hồ sơ đã ứng tuyển (/pages/candidate/applications.html)
 * Giới hạn: < 200 dòng.
 */
import { renderApplicationCard, bindApplicationCardEvents } from "../components/applicationCard.js";
import { openApplicationDrawer } from "../components/applicationDrawer.js";
import { openWithdrawModal } from "../components/withdrawModal.js";
import { renderPagination } from "../components/pagination.js";
import { showStatusToast } from "../components/toast.js";

let state = { status: "all", q: "", sort: "newest", page: 1 };
let metaStatuses = [];
let abortCtrl = null;
let searchTimer = null;
let pollTimer = null;

function esc(s) { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; }

function readUrlState() {
  const p = new URLSearchParams(window.location.search);
  return {
    status: p.get("status") || "all", q: p.get("q") || "",
    sort: p.get("sort") || "newest", page: Math.max(1, parseInt(p.get("page") || "1", 10)),
  };
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.status !== "all") p.set("status", state.status);
  if (state.q) p.set("q", state.q);
  if (state.sort !== "newest") p.set("sort", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  window.history.pushState(null, "", `${window.location.pathname}${p.toString() ? `?${p.toString()}` : ""}`);
}

function renderTabs(tabs = []) {
  const tablist = document.getElementById("apps-tablist");
  if (!tablist) return;
  tablist.innerHTML = tabs.map((t) => {
    const isActive = t.key === state.status;
    return `
      <button type="button" class="app-tab-btn ${isActive ? "is-active" : ""}" role="tab"
        id="tab-${t.key}" aria-selected="${isActive ? "true" : "false"}" tabindex="${isActive ? "0" : "-1"}" data-key="${t.key}">
        <span>${esc(t.label)}</span>
        <span class="app-tab-badge" aria-label="${t.count} hồ sơ">${t.count}</span>
      </button>
    `;
  }).join("");

  tablist.querySelectorAll(".app-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.status = btn.dataset.key; state.page = 1; syncUrl(); fetchApplications();
    });
  });
}

function renderSkeletons(container, count = 5) {
  container.innerHTML = Array(count).fill(`
    <div class="app-card" style="opacity:0.6;pointer-events:none;" aria-hidden="true">
      <div style="width:48px;height:48px;border-radius:8px;background:var(--bg-muted);"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
        <div style="width:50%;height:18px;background:var(--bg-muted);border-radius:4px;"></div>
        <div style="width:35%;height:14px;background:var(--bg-muted);border-radius:4px;"></div>
      </div>
    </div>
  `).join("");
}

async function fetchApplications() {
  if (abortCtrl) abortCtrl.abort();
  abortCtrl = new AbortController();
  const listHost = document.getElementById("apps-list-host");
  const metaHost = document.getElementById("apps-count-summary");
  const pageHost = document.getElementById("apps-pagination-host");
  renderSkeletons(listHost);

  try {
    const res = await http.get("/candidate/applications", {
      params: { status: state.status, q: state.q, sort: state.sort, page: state.page },
      signal: abortCtrl.signal,
    });
    const { items, tabs, total, page, page_size } = res.data;
    renderTabs(tabs);
    metaHost.textContent = `Hiển thị ${items.length} trên tổng số ${total} hồ sơ ứng tuyển`;

    if (items.length === 0) {
      listHost.innerHTML = `
        <div class="apply-no-cv" style="padding:40px 16px;">
          <p>Bạn chưa có hồ sơ nào ở mục này.</p>
          <a href="../jobs.html" class="btn btn-primary" style="margin-top:8px;">Khám phá việc làm ngay</a>
        </div>
      `;
      pageHost.hidden = true;
      return;
    }

    listHost.innerHTML = items.map(renderApplicationCard).join("");
    bindApplicationCardEvents(listHost, {
      onDetail: async (appId, trigger) => {
        try {
          const detailRes = await http.get(`/candidate/applications/${appId}`);
          openApplicationDrawer(detailRes.data, { metaStatuses, triggerBtn: trigger, onUpdated: fetchApplications });
        } catch { showStatusToast("Không thể mở chi tiết hồ sơ.", "danger"); }
      },
      onAction: async (action, appId, trigger) => {
        if (action === "withdraw") {
          const item = items.find((x) => x.id === appId);
          if (item) openWithdrawModal({ app: item, triggerBtn: trigger, onSuccess: fetchApplications });
        } else if (action === "view_job") {
          const item = items.find((x) => x.id === appId);
          window.open(`../jobs.html?q=${encodeURIComponent(item?.job?.title || "")}`, "_blank");
        } else if (action === "view_cv") {
          const item = items.find((x) => x.id === appId);
          const t = localStorage.getItem("auth_token") || "";
          const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
          window.open(`${base}/candidate/cvs/${item?.cv_id}/file?token=${encodeURIComponent(t)}`, "_blank");
        }
      },
    });

    renderPagination(pageHost, { page, totalPages: Math.ceil(total / page_size), total }, (nextPage) => {
      state.page = nextPage;
      syncUrl();
      fetchApplications();
    });
  } catch (err) {
    if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
    listHost.innerHTML = `
      <div class="apply-error-banner" role="alert" style="padding:24px;text-align:center;">
        <p>Lỗi tải danh sách hồ sơ: ${esc(err.message || "")}</p>
        <button type="button" class="btn btn-outline" id="apps-retry-btn" style="margin-top:8px;">Thử lại</button>
      </div>
    `;
    document.getElementById("apps-retry-btn")?.addEventListener("click", fetchApplications);
  }
}

function startPolling() {
  stopPolling();
  pollTimer = window.setInterval(() => { if (document.visibilityState === "visible") fetchApplications(); }, 60000);
}
function stopPolling() { if (pollTimer) window.clearInterval(pollTimer); }

async function init() {
  if (!Auth.isAuthenticated()) {
    const here = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `../login.html?redirect=${here}`;
    return;
  }
  if (Auth.getRole() !== "candidate") {
    window.location.href = "../403.html";
    return;
  }

  state = readUrlState();
  try {
    const sRes = await http.get("/meta/application-statuses");
    metaStatuses = Array.isArray(sRes.data) ? sRes.data : [];
  } catch {}

  const searchInput = document.getElementById("apps-search-input");
  if (searchInput) {
    searchInput.value = state.q;
    searchInput.addEventListener("input", () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.q = searchInput.value.trim();
        state.page = 1;
        syncUrl();
        fetchApplications();
      }, 300);
    });
  }

  const sortHost = document.getElementById("apps-sort-host");
  if (sortHost && window.CustomSelect) {
    new window.CustomSelect(sortHost, {
      id: "apps-sort-select", name: "sort",
      options: [{ value: "newest", label: "Mới nhất" }, { value: "updated", label: "Cập nhật gần nhất" }],
      value: state.sort, ariaLabel: "Sắp xếp hồ sơ",
      onChange: (val) => { state.sort = val || "newest"; state.page = 1; syncUrl(); fetchApplications(); },
    });
  }

  ["popstate", "focus"].forEach((evt) => window.addEventListener(evt, () => {
    if (evt === "popstate") state = readUrlState();
    fetchApplications();
  }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") fetchApplications();
  });

  fetchApplications();
  startPolling();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
