/**
 * adminApplications.js - Giám sát toàn bộ hồ sơ ứng tuyển & trao đổi (Admin)
 * Giới hạn: < 200 dòng.
 */
const state = { status: "all", q: "", page: 1 };
let searchTimer = null;
const esc = (s) => { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; };
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const formatDateTime = (iso) => (iso ? `${new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${formatDate(iso)}` : "");

function renderTabs(tabs = []) {
  const host = document.getElementById("adm-app-tabs");
  if (!host) return;
  host.innerHTML = tabs.map((t) => `
    <button type="button" class="ej-tab ${t.key === state.status ? "is-active" : ""}" data-status="${t.key}">
      <span>${esc(t.label)}</span><span class="ej-tab-count">${t.count}</span>
    </button>`).join("");
  host.querySelectorAll(".ej-tab").forEach((b) => b.addEventListener("click", () => {
    state.status = b.dataset.status; state.page = 1; loadData();
  }));
}

function openAuditModal(detail) {
  const host = document.getElementById("adm-app-modal-host");
  const modal = document.createElement("div");
  modal.className = "emp-modal-backdrop";
  const historyHtml = (detail.history || []).map((h) => `
    <div class="adm-timeline-item">
      <div class="adm-timeline-dot"></div>
      <div class="adm-timeline-time">${formatDateTime(h.changed_at)} · <strong>${esc(h.status_label)}</strong></div>
      <div class="adm-timeline-note">${esc(h.note || "Cập nhật trạng thái")}</div>
    </div>`).join("");

  modal.innerHTML = `
    <div class="emp-modal-dialog" role="dialog" aria-modal="true" style="max-width:640px;">
      <div class="emp-modal-header">
        <h3 class="emp-modal-title">Nội dung trao đổi &amp; Giám sát hồ sơ #${detail.id}</h3>
        <button type="button" class="emp-modal-close">✕</button>
      </div>
      <div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; background:var(--bg-muted); padding:14px; border-radius:10px; margin-bottom:16px; font-size:13.5px;">
          <div>
            <strong style="color:var(--text-secondary);">ỨNG VIÊN</strong>
            <div style="font-weight:600; font-size:15px; margin-top:2px;">${esc(detail.candidate.full_name)}</div>
            <div>✉️ ${esc(detail.candidate.email)}</div>
            <div>📞 ${esc(detail.candidate.phone || "Chưa có SĐT")}</div>
          </div>
          <div>
            <strong style="color:var(--text-secondary);">NHÀ TUYỂN DỤNG &amp; CÔNG TY</strong>
            <div style="font-weight:600; font-size:15px; margin-top:2px;">${esc(detail.employer.company_name || detail.employer.full_name)}</div>
            <div>👤 ${esc(detail.employer.full_name)}</div>
            <div>✉️ ${esc(detail.employer.email)}</div>
          </div>
        </div>
        <p style="margin-bottom:8px;"><strong>Vị trí ứng tuyển:</strong> ${esc(detail.job.title)} (Nộp ngày ${formatDate(detail.created_at)})</p>
        ${detail.cover_letter ? `<div style="background:var(--bg); border:1px solid var(--border-default); padding:12px; border-radius:8px; margin-bottom:14px;"><strong style="font-size:13px; color:var(--text-secondary);">Thư giới thiệu của ứng viên:</strong><p style="margin:4px 0 0; white-space:pre-wrap; font-size:13.5px;">${esc(detail.cover_letter)}</p></div>` : ""}
        ${detail.interview?.interview_at ? `
          <div style="background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.25); border-radius:8px; padding:12px; margin-bottom:16px;">
            <strong style="color:#d97706; font-size:13.5px;">🗓️ Lịch phỏng vấn do NTD thiết lập:</strong>
            <div style="font-size:13.5px; margin-top:4px;"><strong>Thời gian:</strong> ${formatDateTime(detail.interview.interview_at)}</div>
            <div style="font-size:13.5px;"><strong>Hình thức:</strong> ${esc(detail.interview.interview_mode)}</div>
            ${detail.interview.interview_location ? `<div style="font-size:13.5px;"><strong>Địa điểm / Link họp:</strong> <a href="${esc(detail.interview.interview_location)}" target="_blank" rel="noopener">${esc(detail.interview.interview_location)}</a></div>` : ""}
          </div>` : ""}
        <div>
          <strong style="font-size:14px;">Lịch sử tương tác &amp; Ghi chú qua lại (${(detail.history || []).length}):</strong>
          <div class="adm-timeline-list">${historyHtml || "<p>Chưa có ghi chú nào.</p>"}</div>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border-default); padding-top:14px; margin-top:12px;">
        <button type="button" class="btn btn-primary" id="audit-close">Đóng</button>
      </div>
    </div>`;
  host.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector(".emp-modal-close").addEventListener("click", close);
  modal.querySelector("#audit-close").addEventListener("click", close);
}

function renderTable(items) {
  const tbody = document.getElementById("adm-app-tbody");
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-secondary);">Không tìm thấy hồ sơ nào.</td></tr>`;
    return;
  }
  const token = localStorage.getItem("auth_token") || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";

  tbody.innerHTML = items.map((app) => {
    const cvUrl = app.cv_id ? `${base}/candidate/cvs/${app.cv_id}/file?token=${encodeURIComponent(token)}` : "#";
    const ivHtml = app.interview?.interview_at
      ? `<span class="adm-interview-pill">🗓️ ${formatDateTime(app.interview.interview_at)}<br>${esc(app.interview.interview_mode)}</span>`
      : `<span style="color:var(--text-tertiary);">Chưa xếp lịch</span>`;

    return `
      <tr data-id="${app.id}">
        <td><div class="adm-user-cell"><span class="adm-user-name">${esc(app.candidate.full_name)}</span><span class="adm-user-sub">${esc(app.candidate.email)} · ${esc(app.candidate.phone || "No phone")}</span></div></td>
        <td><strong style="color:var(--text-primary);">${esc(app.job.title)}</strong><div style="font-size:12px; color:var(--text-tertiary);">Nộp: ${formatDate(app.created_at)}</div></td>
        <td><div class="adm-user-cell"><span class="adm-user-name">${esc(app.employer.company_name || app.employer.full_name)}</span><span class="adm-user-sub">${esc(app.employer.email)}</span></div></td>
        <td><span class="app-status-badge app-badge-${esc(app.status_tone)}"><span class="app-badge-dot"></span>${esc(app.status_label)}</span></td>
        <td>${ivHtml}</td>
        <td style="text-align: right; white-space: nowrap;">
          ${app.cv_id ? `<a href="${cvUrl}" target="_blank" class="btn btn-sm btn-outline" style="margin-right:6px;">Xem CV</a>` : ""}
          <button type="button" class="btn btn-sm btn-primary btn-audit" data-id="${app.id}">Xem trao đổi (${app.history_count})</button>
        </td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll(".btn-audit").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const detail = await window.api.get(`/admin/applications/${btn.dataset.id}`);
        openAuditModal(detail);
      } catch (err) { alert(err?.message || "Lỗi tải chi tiết"); }
    });
  });
}

async function loadData() {
  const tbody = document.getElementById("adm-app-tbody");
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px;">Đang tải danh sách hồ sơ...</td></tr>`;
  try {
    const res = await window.api.get("/admin/applications", {
      status: state.status === "all" ? "" : state.status, q: state.q.trim(), page: state.page,
    });
    renderTabs(res.tabs);
    renderTable(res.items);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--danger);">Lỗi: ${esc(err?.message)}</td></tr>`;
  }
}

function init() {
  const sInput = document.getElementById("adm-app-search");
  sInput?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = sInput.value; state.page = 1; loadData(); }, 300);
  });
  loadData();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
