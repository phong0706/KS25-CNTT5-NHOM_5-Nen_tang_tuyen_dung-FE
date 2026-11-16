/**
 * employerApplications.js - Quản lý ứng viên & Lịch phỏng vấn cho Nhà tuyển dụng
 * Giới hạn: < 200 dòng.
 */
import { showStatusToast } from "../components/toast.js";

const state = { status: "all", q: "", jobId: "", page: 1, jobs: [] };
let searchTimer = null;
const esc = (s) => { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; };
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const formatDateTime = (iso) => (iso ? `${new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${formatDate(iso)}` : "");

function renderTabs(tabs = []) {
  const host = document.getElementById("emp-app-tabs");
  if (!host) return;
  host.innerHTML = tabs.map((t) => `
    <button type="button" class="ej-tab ${t.key === state.status ? "is-active" : ""}" data-status="${t.key}">
      <span>${esc(t.label)}</span><span class="ej-tab-count">${t.count}</span>
    </button>`).join("");
  host.querySelectorAll(".ej-tab").forEach((b) => b.addEventListener("click", () => {
    state.status = b.dataset.status; state.page = 1; loadApplications();
  }));
}

function createModal(html, onSubmit) {
  const host = document.getElementById("emp-app-modal-host");
  const modal = document.createElement("div");
  modal.className = "emp-modal-backdrop";
  modal.innerHTML = html;
  host.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelectorAll(".emp-modal-close, .btn-modal-cancel").forEach((b) => b.addEventListener("click", close));
  modal.querySelector("form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await onSubmit(modal, close);
  });
}

function openInterviewModal(app) {
  createModal(`
    <div class="emp-modal-dialog" role="dialog" aria-modal="true">
      <div class="emp-modal-header"><h3 class="emp-modal-title">Lên lịch phỏng vấn - ${esc(app.candidate.full_name)}</h3><button type="button" class="emp-modal-close">✕</button></div>
      <form style="display:flex; flex-direction:column; gap:12px;">
        <div class="emp-form-group"><label class="emp-form-label">Thời gian *</label><input type="datetime-local" id="iv-time" class="emp-form-control" required /></div>
        <div class="emp-form-group"><label class="emp-form-label">Hình thức *</label>
          <select id="iv-mode" class="emp-form-control">
            <option value="Trực tuyến qua Google Meet">Trực tuyến qua Google Meet</option><option value="Trực tuyến qua Zoom">Trực tuyến qua Zoom</option>
            <option value="Trực tiếp tại văn phòng">Trực tiếp tại văn phòng</option>
          </select></div>
        <div class="emp-form-group"><label class="emp-form-label">Địa chỉ / Link họp *</label><input type="text" id="iv-loc" class="emp-form-control" placeholder="https://meet.google.com/..." required /></div>
        <div class="emp-form-group"><label class="emp-form-label">Lời nhắn gửi ứng viên</label><textarea id="iv-note" class="emp-form-control" placeholder="Ghi chú thêm..."></textarea></div>
        <div style="display:flex; justify-content:flex-end; gap:8px;"><button type="button" class="btn btn-outline btn-modal-cancel">Hủy</button><button type="submit" class="btn btn-primary">Xác nhận lên lịch</button></div>
      </form></div>`, async (modal, close) => {
    const timeVal = modal.querySelector("#iv-time").value;
    if (!timeVal) return;
    try {
      await window.api.post(`/employer/applications/${app.id}/interview`, {
        interview_at: new Date(timeVal).toISOString(), interview_mode: modal.querySelector("#iv-mode").value,
        interview_location: modal.querySelector("#iv-loc").value.trim(), note: modal.querySelector("#iv-note").value.trim() || undefined,
      });
      showStatusToast("Đã lên lịch hẹn phỏng vấn thành công!", "success"); close(); loadApplications();
    } catch (err) { showStatusToast(err?.message || "Lỗi lên lịch", "danger"); }
  });
}

function openStatusModal(app) {
  createModal(`
    <div class="emp-modal-dialog" role="dialog" aria-modal="true" style="max-width:440px;">
      <div class="emp-modal-header"><h3 class="emp-modal-title">Đổi trạng thái hồ sơ</h3><button type="button" class="emp-modal-close">✕</button></div>
      <form style="display:flex; flex-direction:column; gap:12px;">
        <div class="emp-form-group"><label class="emp-form-label">Chọn trạng thái</label>
          <select id="st-val" class="emp-form-control">
            <option value="screening" ${app.status === "screening" ? "selected" : ""}>Đang xem xét</option>
            <option value="interview" ${app.status === "interview" ? "selected" : ""}>Phỏng vấn</option>
            <option value="offered" ${app.status === "offered" ? "selected" : ""}>Đề nghị nhận việc</option>
            <option value="rejected" ${app.status === "rejected" ? "selected" : ""}>Không phù hợp</option>
          </select></div>
        <div class="emp-form-group"><label class="emp-form-label">Ghi chú trao đổi</label><textarea id="st-note" class="emp-form-control" placeholder="Ghi chú..."></textarea></div>
        <div style="display:flex; justify-content:flex-end; gap:8px;"><button type="button" class="btn btn-outline btn-modal-cancel">Hủy</button><button type="submit" class="btn btn-primary">Lưu</button></div>
      </form></div>`, async (modal, close) => {
    try {
      await window.api.patch(`/employer/applications/${app.id}/status`, {
        status: modal.querySelector("#st-val").value, note: modal.querySelector("#st-note").value.trim() || undefined,
      });
      showStatusToast("Cập nhật trạng thái thành công!", "success"); close(); loadApplications();
    } catch (err) { showStatusToast(err?.message || "Lỗi", "danger"); }
  });
}

function openDetailModal(app) {
  createModal(`
    <div class="emp-modal-dialog" role="dialog" aria-modal="true">
      <div class="emp-modal-header"><h3 class="emp-modal-title">Hồ sơ ứng viên: ${esc(app.candidate.full_name)}</h3><button type="button" class="emp-modal-close">✕</button></div>
      <div><p><strong>Vị trí:</strong> ${esc(app.job.title)}</p><p><strong>Email:</strong> ${esc(app.candidate.email)} · <strong>SĐT:</strong> ${esc(app.candidate.phone || "Chưa có")}</p>
        <p><strong>Nộp ngày:</strong> ${formatDate(app.created_at)}</p>
        ${app.cover_letter ? `<div style="background:var(--bg-muted); padding:12px; border-radius:8px; margin:10px 0;"><strong>Thư giới thiệu:</strong><p style="margin:4px 0 0; white-space:pre-wrap;">${esc(app.cover_letter)}</p></div>` : "<p><em>Không có thư giới thiệu.</em></p>"}
        ${app.interview?.interview_at ? `<div class="emp-app-interview-alert">🗓️ Lịch phỏng vấn: ${formatDateTime(app.interview.interview_at)} (${esc(app.interview.interview_mode)})<br>Địa điểm: ${esc(app.interview.interview_location || "")}</div>` : ""}
      </div><div style="display:flex; justify-content:flex-end;"><button type="button" class="btn btn-primary btn-modal-cancel">Đóng</button></div></div>`, () => {});
}

function renderCards(items) {
  const listEl = document.getElementById("emp-app-list");
  if (!items.length) {
    listEl.innerHTML = `<div style="text-align:center; padding:48px 16px; color:var(--text-secondary);">Chưa có hồ sơ ứng tuyển nào theo bộ lọc này.</div>`; return;
  }
  const token = localStorage.getItem("auth_token") || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";

  listEl.innerHTML = items.map((app) => {
    const initials = (app.candidate.full_name || "UV").split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
    const cvUrl = app.cv_id ? `${base}/candidate/cvs/${app.cv_id}/file?token=${encodeURIComponent(token)}` : "#";
    return `
      <div class="emp-app-card" data-id="${app.id}">
        <div class="emp-app-left">
          <div class="emp-app-avatar">${initials}</div>
          <div class="emp-app-main-info">
            <div class="emp-app-top-row">
              <h4 class="emp-app-name">${esc(app.candidate.full_name)}</h4>
              <span class="emp-app-job-pill">${esc(app.job.title)}</span>
              <span class="app-status-badge app-badge-${esc(app.status_tone)}"><span class="app-badge-dot"></span>${esc(app.status_label)}</span>
            </div>
            <div class="emp-app-meta-row">
              <span>✉️ ${esc(app.candidate.email)}</span><span>📞 ${esc(app.candidate.phone || "Chưa có SĐT")}</span><span>📅 Nộp ngày ${formatDate(app.created_at)}</span>
            </div>
            ${app.interview?.interview_at ? `
              <div class="emp-app-interview-alert">
                🗓️ Phỏng vấn: ${formatDateTime(app.interview.interview_at)} (${esc(app.interview.interview_mode)}) - ${esc(app.interview.interview_location || "")}
              </div>` : ""}
          </div>
        </div>
        <div class="emp-app-actions">
          ${app.cv_id ? `<a href="${cvUrl}" target="_blank" class="btn btn-sm btn-outline">Xem CV</a>` : ""}
          <button type="button" class="btn btn-sm btn-outline btn-detail">Chi tiết</button>
          <button type="button" class="btn btn-sm btn-outline btn-status">Đổi trạng thái</button>
          <button type="button" class="btn btn-sm btn-primary btn-interview">Hẹn phỏng vấn</button>
        </div>
      </div>`;
  }).join("");

  listEl.querySelectorAll(".emp-app-card").forEach((card) => {
    const app = items.find((x) => x.id === Number(card.dataset.id));
    if (!app) return;
    card.querySelector(".btn-detail")?.addEventListener("click", () => openDetailModal(app));
    card.querySelector(".btn-status")?.addEventListener("click", () => openStatusModal(app));
    card.querySelector(".btn-interview")?.addEventListener("click", () => openInterviewModal(app));
  });
}

async function loadApplications() {
  const listEl = document.getElementById("emp-app-list");
  listEl.innerHTML = `<div style="padding:32px; text-align:center;">Đang tải danh sách hồ sơ...</div>`;
  try {
    const res = await window.api.get("/employer/applications", {
      status: state.status === "all" ? "" : state.status, job_id: state.jobId || undefined, q: state.q.trim(), page: state.page,
    });
    renderTabs(res.tabs);
    if (!state.jobs.length && res.jobs) { state.jobs = res.jobs; setupJobSelect(); }
    renderCards(res.items);
  } catch (err) {
    listEl.innerHTML = `<div style="text-align:center; padding:32px; color:var(--danger);">Lỗi tải hồ sơ: ${esc(err?.message)}</div>`;
  }
}

function setupJobSelect() {
  const host = document.getElementById("emp-app-job-select-host");
  if (!host || !window.CustomSelect) return;
  const options = [{ value: "", label: "Tất cả tin tuyển dụng" }, ...state.jobs.map((j) => ({ value: String(j.id), label: j.title }))];
  new window.CustomSelect(host, {
    id: "job-filter-select", name: "job_id", options, value: state.jobId,
    onChange: (val) => { state.jobId = val || ""; state.page = 1; loadApplications(); },
  });
}

function init() {
  const p = new URLSearchParams(window.location.search);
  state.jobId = p.get("job_id") || "";
  const appId = parseInt(p.get("app_id") || "0", 10) || 0;
  const sInput = document.getElementById("emp-app-search");
  sInput?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = sInput.value; state.page = 1; loadApplications(); }, 300);
  });
  loadApplications().then(async () => {
    if (!appId) return;
    const clean = new URLSearchParams(window.location.search);
    clean.delete("app_id");
    window.history.replaceState(null, "", `${window.location.pathname}${clean.toString() ? `?${clean}` : ""}`);
    try {
      const detail = await window.api.get(`/employer/applications/${appId}`);
      openDetailModal(detail);
    } catch { showStatusToast("Không tìm thấy hồ sơ yêu cầu.", "danger"); }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
