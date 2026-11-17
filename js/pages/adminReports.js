/**
 * adminReports.js - Kiểm duyệt Báo cáo vi phạm (Admin)
 * - Xem danh sách báo cáo, lọc theo trạng thái, tìm kiếm
 * - Gỡ tin (RESOLVED -> job HIDDEN) hoặc Bỏ qua (REJECTED)
 * - Ghi kết quả xử lý
 */
const state = { status: "PENDING", q: "", page: 1, pageSize: 10 };
let searchTimer = null;
let latestRequest = 0;

const TABS = [
  { key: "PENDING", label: "Chờ xử lý" },
  { key: "RESOLVED", label: "Đã gỡ tin" },
  { key: "REJECTED", label: "Đã bỏ qua" },
  { key: "all", label: "Tất cả" },
];

const esc = (s) => { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; };
const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${d.toLocaleDateString("vi-VN")}`;
};

const STATUS_META = {
  PENDING: { label: "Chờ xử lý", tone: "warning" },
  RESOLVED: { label: "Đã gỡ tin", tone: "danger" },
  REJECTED: { label: "Đã bỏ qua", tone: "neutral" },
};

function statusBadge(status) {
  const meta = STATUS_META[status] || { label: status, tone: "neutral" };
  return `<span class="app-status-badge app-badge-${meta.tone}"><span class="app-badge-dot"></span>${esc(meta.label)}</span>`;
}

function renderTabs() {
  const host = document.getElementById("adm-rep-tabs");
  if (!host) return;
  host.innerHTML = TABS.map((t) => `
    <button type="button" class="ej-tab ${state.status === t.key ? "is-active" : ""}" data-status="${t.key}" aria-selected="${state.status === t.key}">
      <span>${esc(t.label)}</span>
    </button>`).join("");
  host.querySelectorAll(".ej-tab").forEach((b) =>
    b.addEventListener("click", () => {
      state.status = b.dataset.status; state.page = 1; loadData();
    })
  );
}

function renderTable(items) {
  const tbody = document.getElementById("adm-rep-tbody");
  if (!Array.isArray(items)) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:#dc2626;">Dữ liệu báo cáo không đúng định dạng.</td></tr>`;
    return;
  }
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-secondary);">Không có báo cáo nào khớp bộ lọc.</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map((r) => `
    <tr data-id="${r.id}">
      <td>#${r.id}</td>
      <td><strong style="color:var(--text-primary);">${esc(r.post_title || "—")}</strong></td>
      <td>
        <div class="adm-user-cell">
          <span class="adm-user-name">${esc(r.reporter_full_name || "—")}</span>
          <span class="adm-user-sub">${esc(r.reporter_email || "")}</span>
        </div>
      </td>
      <td><div class="adm-user-cell"><span class="adm-user-name">${esc(r.employer_full_name || "—")}</span></div></td>
      <td title="${esc(r.reason)}" style="max-width:280px;">${esc(r.reason.length > 80 ? r.reason.slice(0, 80) + "…" : r.reason)}</td>
      <td>${statusBadge(r.status)}
        ${r.resolution_result ? `<div style="font-size:12px; color:var(--text-tertiary); margin-top:4px;">${esc(r.resolution_result)}</div>` : ""}
        <div style="font-size:12px; color:var(--text-tertiary);">${fmtDateTime(r.created_at)}</div>
      </td>
      <td style="text-align:right;">
        ${r.status === "PENDING" ? `
          <button type="button" class="btn btn-sm btn-primary" data-action="resolve" data-id="${r.id}">Gỡ tin</button>
          <button type="button" class="btn btn-sm btn-outline" data-action="reject" data-id="${r.id}">Bỏ qua</button>
        ` : `<button type="button" class="btn btn-sm btn-outline" data-action="view" data-id="${r.id}">Xem</button>`}
      </td>
    </tr>`).join("");

  tbody.querySelectorAll("button[data-action]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      if (action === "resolve") openActionModal(id, "RESOLVED");
      else if (action === "reject") openActionModal(id, "REJECTED");
      else openDetailModal(id);
    })
  );
}

function renderPagination(total, pageSize) {
  const nav = document.getElementById("adm-rep-pagination");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) { nav.hidden = true; return; }
  nav.hidden = false;
  const start = Math.max(1, Math.min(state.page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const buttons = [];
  if (state.page > 1) {
    buttons.push(`<button type="button" class="ej-page-btn" data-page="${state.page - 1}" aria-label="Trang trước">‹</button>`);
  }
  for (let page = start; page <= end; page += 1) {
    buttons.push(`<button type="button" class="ej-page-btn ${page === state.page ? "is-active" : ""}" data-page="${page}"${page === state.page ? ' aria-current="page"' : ""}>${page}</button>`);
  }
  if (state.page < totalPages) {
    buttons.push(`<button type="button" class="ej-page-btn" data-page="${state.page + 1}" aria-label="Trang sau">›</button>`);
  }
  nav.innerHTML = buttons.join("");
  nav.querySelectorAll(".ej-page-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.page = Number(button.dataset.page);
      loadData();
    });
  });
}

async function loadData() {
  const tbody = document.getElementById("adm-rep-tbody");
  const requestId = ++latestRequest;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-secondary);">Đang tải dữ liệu...</td></tr>`;
  try {
    const params = { skip: (state.page - 1) * state.pageSize, limit: state.pageSize, q: state.q };
    if (state.status !== "all") params.status = state.status;
    const result = await window.api.get("/admin/reports", params);
    if (requestId !== latestRequest) return;
    const items = Array.isArray(result) ? result : result && result.items;
    if (!Array.isArray(items)) throw new Error("Dữ liệu báo cáo không đúng định dạng.");
    const total = Number.isFinite(Number(result && result.total)) ? Number(result.total) : items.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) {
      state.page = totalPages;
      return loadData();
    }
    renderTable(items);
    renderPagination(total, state.pageSize);
  } catch (err) {
    if (requestId === latestRequest) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:#dc2626;">${esc(err?.message || "Lỗi tải dữ liệu.")}</td></tr>`;
    }
  }
}

function openActionModal(reportId, action) {
  const host = document.getElementById("adm-rep-modal-host");
  const isResolve = action === "RESOLVED";
  const modal = document.createElement("div");
  modal.className = "emp-modal-backdrop";
  modal.innerHTML = `
    <div class="emp-modal-dialog" role="dialog" aria-modal="true" style="max-width:520px;">
      <div class="emp-modal-header">
        <h3 class="emp-modal-title">${isResolve ? "Gỡ tin vi phạm (HIDDEN)" : "Bỏ qua báo cáo"} #${reportId}</h3>
        <button type="button" class="emp-modal-close">✕</button>
      </div>
      <div style="padding:16px;">
        <label for="adm-rep-result" style="display:block; font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">
          Ghi kết quả xử lý (bắt buộc)
        </label>
        <textarea id="adm-rep-result" rows="4" minlength="5" maxlength="2000" required aria-describedby="adm-rep-action-error" style="width:100%; border:1px solid var(--border-default); border-radius:8px; padding:10px; font-size:14px; font-family:inherit;" placeholder="${isResolve ? "Tin đã được ẩn và lý do xử lý" : "Lý do kết luận báo cáo không vi phạm"}"></textarea>
        <p id="adm-rep-action-error" role="alert" style="color:#dc2626; font-size:13px; margin:6px 0 0;" hidden></p>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
          <button type="button" class="btn btn-outline" id="adm-rep-cancel">Hủy</button>
          <button type="button" class="btn ${isResolve ? "btn-primary" : "btn-outline"}" id="adm-rep-confirm">${isResolve ? "Xác nhận gỡ tin" : "Xác nhận bỏ qua"}</button>
        </div>
      </div>
    </div>`;
  host.appendChild(modal);
  const close = () => {
    document.removeEventListener("keydown", onKeyDown);
    modal.remove();
  };
  const onKeyDown = (event) => {
    if (event.key === "Escape") close();
  };
  document.addEventListener("keydown", onKeyDown);
  modal.querySelector(".emp-modal-close").addEventListener("click", close);
  modal.querySelector("#adm-rep-cancel").addEventListener("click", close);
  modal.querySelector("#adm-rep-confirm").addEventListener("click", async () => {
    const resultInput = modal.querySelector("#adm-rep-result");
    const errorEl = modal.querySelector("#adm-rep-action-error");
    const resolution_result = resultInput.value.trim();
    if (resolution_result.length < 5) {
      errorEl.textContent = "Kết quả cần có ít nhất 5 ký tự.";
      errorEl.hidden = false;
      resultInput.focus();
      return;
    }
    const confirmButton = modal.querySelector("#adm-rep-confirm");
    confirmButton.disabled = true;
    confirmButton.textContent = "Đang lưu...";
    try {
      const res = await window.api.patch(`/admin/reports/${reportId}`, { status: action, resolution_result });
      close();
      if (typeof showToast === "function") showToast(res.message || "Đã xử lý báo cáo.", "success");
      loadData();
    } catch (err) {
      errorEl.textContent = err?.message || "Có lỗi xảy ra.";
      errorEl.hidden = false;
      confirmButton.disabled = false;
      confirmButton.textContent = isResolve ? "Xác nhận gỡ tin" : "Xác nhận bỏ qua";
    }
  });
  modal.querySelector("#adm-rep-result").focus();
}

async function openDetailModal(reportId) {
  const host = document.getElementById("adm-rep-modal-host");
  const modal = document.createElement("div");
  modal.className = "emp-modal-backdrop";
  modal.innerHTML = `<div class="emp-modal-dialog" role="dialog" aria-modal="true" style="max-width:560px;">
    <div class="emp-modal-header"><h3 class="emp-modal-title">Chi tiết báo cáo #${reportId}</h3><button type="button" class="emp-modal-close">✕</button></div>
    <div style="padding:16px;" id="adm-rep-detail-body"><p>Đang tải...</p></div>
  </div>`;
  host.appendChild(modal);
  modal.querySelector(".emp-modal-close").addEventListener("click", () => modal.remove());
  try {
    const r = await window.api.get(`/admin/reports/${reportId}`);
    modal.querySelector("#adm-rep-detail-body").innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; font-size:13.5px;">
        <div><strong style="color:var(--text-secondary);">Tin bị báo cáo</strong><div style="font-weight:600;">${esc(r.post_title || "—")}</div></div>
        <div><strong style="color:var(--text-secondary);">Trạng thái</strong><div style="margin-top:4px;">${statusBadge(r.status)}</div></div>
        <div><strong style="color:var(--text-secondary);">Người báo cáo</strong><div>${esc(r.reporter_full_name || "—")}<br><span style="color:var(--text-tertiary);">${esc(r.reporter_email || "")}</span></div></div>
        <div><strong style="color:var(--text-secondary);">Nhà tuyển dụng</strong><div>${esc(r.employer_full_name || "—")}</div></div>
      </div>
      <div style="background:var(--bg-muted); border-radius:8px; padding:12px; margin-bottom:12px;"><strong style="font-size:13px; color:var(--text-secondary);">Lý do báo cáo</strong><p style="margin:6px 0 0; white-space:pre-wrap;">${esc(r.reason)}</p></div>
      <div><strong style="font-size:13px; color:var(--text-secondary);">Kết quả xử lý</strong><p style="margin:6px 0 0; white-space:pre-wrap;">${esc(r.resolution_result || "Chưa xử lý")}</p></div>
      <div style="font-size:12.5px; color:var(--text-tertiary); margin-top:10px;">Tạo: ${fmtDateTime(r.created_at)}</div>`;
  } catch (err) {
    modal.querySelector("#adm-rep-detail-body").innerHTML = `<p style="color:#dc2626;">${esc(err?.message || "Lỗi tải chi tiết.")}</p>`;
  }
}

function bindToolbar() {
  const search = document.getElementById("adm-rep-search");
  search?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = search.value.trim(); state.page = 1; loadData(); }, 350);
  });
  document.getElementById("adm-rep-refresh")?.addEventListener("click", () => {
    const search = document.getElementById("adm-rep-search");
    if (search) search.value = "";
    state.q = "";
    state.page = 1;
    loadData();
  });
}

function init() {
  renderTabs();
  bindToolbar();
  loadData();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();