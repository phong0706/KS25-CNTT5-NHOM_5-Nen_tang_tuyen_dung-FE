/**
 * items.js - Duyệt tin tuyển dụng & Logo doanh nghiệp (Admin).
 * Giới hạn: <= 195 dòng, tuân thủ techrecruit-rules.
 */
import { openDeleteJobModal, openRejectLogoModal } from "../components/itemsModals.js";

const state = { status: "pending", q: "", items: [], counts: { pending: 0, published: 0, logo_pending: 0 } };
let searchTimer = null;
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

function showMessage(text, isError = false) {
  const el = document.getElementById("adm-job-msg");
  if (!el) return;
  el.textContent = text;
  el.style.background = isError ? "#fef2f2" : "#f0fdf4";
  el.style.color = isError ? "#b91c1c" : "#166534";
  el.style.border = `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`;
  el.hidden = false;
  setTimeout(() => { if (el) el.hidden = true; }, 4000);
}

function updateBadges() {
  ["pending", "published", "logo-pending"].forEach((k) => {
    const el = document.getElementById(`badge-${k}`);
    const key = k === "logo-pending" ? "logo_pending" : k;
    if (el) el.textContent = state.counts[key] || 0;
  });
}

function renderTable() {
  const tbody = document.getElementById("job-table-body");
  const thead = document.querySelector("#job-table thead tr");
  if (!tbody || !thead) return;

  if (state.status === "logo_pending") {
    thead.innerHTML = `<th class="col-sticky-name">Logo xem trước & Công ty</th><th>Mã công ty</th><th>Người gửi</th><th>Ngày gửi</th><th>Trạng thái</th><th class="text-right">Thao tác</th>`;
    if (!state.items.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:36px; color:var(--text-muted);">Không có logo nào đang chờ duyệt.</td></tr>`;
      return;
    }
    tbody.innerHTML = state.items.map((it) => `
      <tr data-company-id="${it.company_id}">
        <td class="col-sticky-name"><div style="display:flex; align-items:center; gap:12px;">
          <img src="${esc(it.logo_url)}" alt="Logo" style="width:44px; height:44px; border-radius:8px; object-fit:cover; border:1px solid var(--border-default); background:#fff;">
          <div><strong>${esc(it.company_name)}</strong></div>
        </div></td>
        <td><code>#${it.company_id}</code></td>
        <td>${esc(it.employer_name || it.employer_email)}</td>
        <td class="gov-num">${fmtDate(it.logo_uploaded_at)}</td>
        <td><span class="gov-status-pill gov-status-pill--warning">Chờ duyệt logo</span></td>
        <td class="text-right"><div style="display:flex; justify-content:flex-end; gap:6px;">
          <button type="button" class="btn btn-sm btn-primary" data-action="approve-logo" data-id="${it.company_id}">Duyệt logo</button>
          <button type="button" class="btn btn-sm btn-outline" data-action="reject-logo" data-id="${it.company_id}" style="color:#b91c1c; border-color:#fca5a5;">Từ chối</button>
        </div></td>
      </tr>`).join("");
    return;
  }

  thead.innerHTML = `<th class="col-sticky-name">Vị trí tuyển dụng</th><th>Công ty</th><th>Người gửi</th><th>Ngày gửi</th><th>Trạng thái</th><th class="text-right">Thao tác</th>`;
  if (!state.items.length) {
    const emptyText = state.status === "pending" ? "Không có tin nào đang chờ duyệt." : "Không có tin nào đang hiển thị.";
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:36px; color:var(--text-muted);">${emptyText}</td></tr>`;
    return;
  }
  tbody.innerHTML = state.items.map((j) => {
    const isPending = j.status === "pending";
    const approveBtn = isPending ? `<button type="button" class="btn btn-sm btn-primary" data-action="approve" data-id="${j.id}">Duyệt</button>` : "";
    return `
      <tr data-job-id="${j.id}">
        <td class="col-sticky-name"><strong>${esc(j.title)}</strong><div style="font-size:12px; color:var(--text-muted);">Mã tin #${j.id}</div></td>
        <td>${esc(j.company_name)}</td>
        <td>${esc(j.employer_name || j.employer_email)}</td>
        <td class="gov-num">${fmtDate(j.created_at)}</td>
        <td><span class="gov-status-pill gov-status-pill--${isPending ? "warning" : "active"}">${isPending ? "Chờ duyệt" : "Đang tuyển"}</span></td>
        <td class="text-right"><div style="display:flex; justify-content:flex-end; gap:6px;">
          ${approveBtn}<button type="button" class="btn btn-sm btn-outline" data-action="delete" data-id="${j.id}" style="color:#b91c1c; border-color:#fca5a5;">Xóa</button>
        </div></td>
      </tr>`;
  }).join("");
}

async function loadData() {
  const tbody = document.getElementById("job-table-body");
  if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">Đang tải danh sách...</td></tr>`;

  try {
    if (state.status === "logo_pending") {
      const [logoRes, jobCounts] = await Promise.all([
        window.api.get("/admin/company-logos", { status: "pending", q: state.q }),
        window.api.get("/admin/jobs", { status: "pending", limit: 1 }).catch(() => null),
      ]);
      state.items = logoRes.items || [];
      state.counts.logo_pending = logoRes.counts?.pending ?? logoRes.total ?? 0;
      if (jobCounts?.counts) {
        state.counts.pending = jobCounts.counts.pending || 0;
        state.counts.published = jobCounts.counts.published || 0;
      }
    } else {
      const res = await window.api.get("/admin/jobs", { status: state.status, q: state.q });
      state.items = res.items || [];
      state.counts = res.counts || state.counts;
    }
    updateBadges(); renderTable();
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#b91c1c;">${esc(err?.message || "Lỗi tải dữ liệu.")}</td></tr>`;
  }
}

async function handleApprove(job) {
  try {
    await window.api.post(`/admin/jobs/${job.id}/approve`, { version: job.version });
    showMessage(`Đã duyệt tin tuyển dụng "${job.title}" thành công.`);
    await loadData();
  } catch (err) {
    showMessage(err?.message || "Không thể duyệt tin.", true);
  }
}

async function handleApproveLogo(item) {
  try {
    await window.api.post(`/admin/company-logos/${item.company_id}/approve`);
    showMessage(`Đã phê duyệt logo cho công ty "${item.company_name}".`);
    await loadData();
  } catch (err) {
    showMessage(err?.message || "Không thể duyệt logo.", true);
  }
}

function initTabs() {
  const tabs = [{ id: "tab-pending", key: "pending" }, { id: "tab-published", key: "published" }, { id: "tab-logo-pending", key: "logo_pending" }];
  tabs.forEach(({ id, key }) => {
    document.getElementById(id)?.addEventListener("click", () => {
      state.status = key;
      tabs.forEach((t) => {
        const btn = document.getElementById(t.id);
        const active = t.key === key;
        btn?.classList.toggle("is-active", active);
        btn?.setAttribute("aria-selected", active ? "true" : "false");
      });
      loadData();
    });
  });
}

function initEvents() {
  initTabs();
  document.getElementById("search-input")?.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = e.target.value.trim(); loadData(); }, 250);
  });
  document.getElementById("btn-refresh")?.addEventListener("click", loadData);
  document.getElementById("job-table-body")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    const numId = Number(id);
    if (action === "approve") {
      const job = state.items.find((it) => it.id === numId);
      if (job) handleApprove(job);
    } else if (action === "delete") {
      const job = state.items.find((it) => it.id === numId);
      if (job) openDeleteJobModal(job, btn, loadData, showMessage);
    } else if (action === "approve-logo") {
      const it = state.items.find((x) => x.company_id === numId);
      if (it) handleApproveLogo(it);
    } else if (action === "reject-logo") {
      const it = state.items.find((x) => x.company_id === numId);
      if (it) openRejectLogoModal(it, btn, loadData, showMessage);
    }
  });
}

initEvents();
loadData();
