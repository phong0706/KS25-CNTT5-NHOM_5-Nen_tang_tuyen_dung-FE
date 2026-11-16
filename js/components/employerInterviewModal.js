/**
 * employerInterviewModal.js - Modal Đổi lịch & Hủy lịch phỏng vấn WAI-ARIA
 * Tuân thủ techrecruit-rules: <= 200 dòng, không alert/confirm/prompt.
 */
import { showToast } from "./toast.js";

function esc(s) { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; }
function formatDateVN(d) { return d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }); }
function formatTimeVN(d) { return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }); }
function toInputDT(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

export function openRescheduleModal(iv, { base, authHeaders, onUpdated, triggerEl }) {
  document.getElementById("rec-reschedule-modal")?.remove();
  const oldDt = new Date(iv.scheduled_at);
  const now = new Date();
  const def = toInputDT(oldDt > now ? oldDt : new Date(now.getTime() + 86400000));
  const todayStr = toInputDT(now).date;

  const modal = document.createElement("div");
  modal.id = "rec-reschedule-modal";
  modal.className = "rec-modal-overlay";
  modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "reschedule-modal-title");

  modal.innerHTML = `
    <div class="rec-modal-card">
      <div class="rec-modal-header">
        <div>
          <h2 id="reschedule-modal-title" class="rec-modal-title">Đổi lịch phỏng vấn</h2>
          <p class="rec-modal-sub">Ứng viên: <strong>${esc(iv.candidate_name)}</strong> · ${esc(iv.job_title)}</p>
        </div>
        <button type="button" class="rec-modal-close" id="btn-close-reschedule" aria-label="Đóng">✕</button>
      </div>
      <div class="rec-modal-body">
        <div class="rec-diff-box">
          <div class="rec-diff-col">
            <span class="rec-diff-label">Lịch hiện tại</span>
            <span class="rec-diff-val is-old">${formatDateVN(oldDt)}, ${formatTimeVN(oldDt)}</span>
            <span class="rec-diff-sub">Thời lượng: ${iv.duration_min || 45} phút</span>
          </div>
          <div class="rec-diff-arrow" aria-hidden="true">→</div>
          <div class="rec-diff-col">
            <span class="rec-diff-label">Lịch mới dự kiến</span>
            <span class="rec-diff-val is-new" id="reschedule-preview-val">Chưa chọn</span>
            <span class="rec-diff-sub">Thời lượng giữ nguyên ${iv.duration_min || 45} phút</span>
          </div>
        </div>
        <form id="reschedule-form" class="rec-modal-form" novalidate>
          <div class="rec-form-grid">
            <div class="rec-form-field">
              <label for="reschedule-input-date" class="rec-form-label">Ngày phỏng vấn mới <span class="req">*</span></label>
              <input type="date" id="reschedule-input-date" class="rec-form-input" min="${todayStr}" value="${def.date}" required>
            </div>
            <div class="rec-form-field">
              <label for="reschedule-input-time" class="rec-form-label">Giờ phỏng vấn <span class="req">*</span></label>
              <input type="time" id="reschedule-input-time" class="rec-form-input" step="900" value="${def.time}" required>
            </div>
          </div>
          <div id="reschedule-inline-error" class="rec-form-error" role="alert" hidden></div>
          <div class="rec-modal-footer">
            <button type="button" class="rec-btn-secondary" id="btn-cancel-reschedule">Hủy</button>
            <button type="submit" class="rec-btn-primary" id="btn-submit-reschedule">Lưu lịch mới</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const dateIn = modal.querySelector("#reschedule-input-date");
  const timeIn = modal.querySelector("#reschedule-input-time");
  const preview = modal.querySelector("#reschedule-preview-val");
  const errBox = modal.querySelector("#reschedule-inline-error");
  const submitBtn = modal.querySelector("#btn-submit-reschedule");

  const close = () => {
    modal.remove(); document.removeEventListener("keydown", onKey);
    if (triggerEl && document.contains(triggerEl)) triggerEl.focus();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  modal.querySelector("#btn-close-reschedule")?.addEventListener("click", close);
  modal.querySelector("#btn-cancel-reschedule")?.addEventListener("click", close);

  const updatePrev = () => {
    errBox.hidden = true; errBox.textContent = "";
    if (!dateIn.value || !timeIn.value) { preview.textContent = "Chưa chọn đủ ngày giờ"; return; }
    const [y, m, d] = dateIn.value.split("-").map(Number);
    const [h, min] = timeIn.value.split(":").map(Number);
    preview.textContent = `${formatDateVN(new Date(y, m - 1, d, h, min))}, ${formatTimeVN(new Date(y, m - 1, d, h, min))}`;
  };
  dateIn.addEventListener("input", updatePrev); timeIn.addEventListener("input", updatePrev);
  updatePrev(); dateIn.focus();

  modal.querySelector("#reschedule-form").addEventListener("submit", async (e) => {
    e.preventDefault(); errBox.hidden = true;
    if (!dateIn.value || !timeIn.value) {
      errBox.textContent = "Vui lòng chọn đầy đủ ngày và giờ phỏng vấn mới."; errBox.hidden = false; return;
    }
    const [y, m, d] = dateIn.value.split("-").map(Number);
    const [h, min] = timeIn.value.split(":").map(Number);
    const targetDt = new Date(y, m - 1, d, h, min);
    if (targetDt <= new Date()) {
      errBox.textContent = "Thời gian phỏng vấn không thể ở trong quá khứ. Vui lòng chọn thời điểm trong tương lai.";
      errBox.hidden = false; return;
    }
    submitBtn.disabled = true; submitBtn.textContent = "Đang lưu...";
    const pad = (n) => String(n).padStart(2, "0");
    const dtStr = `${targetDt.getFullYear()}-${pad(targetDt.getMonth() + 1)}-${pad(targetDt.getDate())}T${pad(targetDt.getHours())}:${pad(targetDt.getMinutes())}:00`;

    try {
      const res = await fetch(`${base}/employer/interviews/${iv.id}/reschedule`, {
        method: "PATCH", headers: authHeaders,
        body: JSON.stringify({ scheduled_at: dtStr, duration_min: iv.duration_min || 45, force: false }),
      });
      if (res.status === 409) {
        const d = await res.json();
        const c = d.detail?.conflict;
        const desc = c ? `(với ${c.candidate_name} - ${c.job_title})` : "";
        throw new Error(`Giờ này đã có lịch phỏng vấn khác ${desc}. Vui lòng chọn giờ khác hoặc đổi ngày.`);
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Đổi lịch phỏng vấn thất bại.");
      }
      close();
      showToast(`Đã đổi lịch sang ${formatDateVN(targetDt)}, ${formatTimeVN(targetDt)}`, "success");
      onUpdated?.();
    } catch (err) {
      errBox.textContent = err.message; errBox.hidden = false;
    } finally {
      submitBtn.disabled = false; submitBtn.textContent = "Lưu lịch mới";
    }
  });
}

export function openCancelInterviewModal(iv, { base, authHeaders, onCancelled, triggerEl }) {
  document.getElementById("rec-cancel-modal")?.remove();
  const modal = document.createElement("div");
  modal.id = "rec-cancel-modal"; modal.className = "rec-modal-overlay";
  modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "cancel-modal-title");

  modal.innerHTML = `
    <div class="rec-modal-card rec-modal-card--sm">
      <div class="rec-modal-header">
        <h2 id="cancel-modal-title" class="rec-modal-title">Hủy lịch phỏng vấn?</h2>
        <button type="button" class="rec-modal-close" id="btn-close-cancel" aria-label="Đóng">✕</button>
      </div>
      <div class="rec-modal-body">
        <p style="font-size:14px; color:var(--text-secondary); margin:0 0 12px;">Hủy lịch hẹn với ứng viên <strong>${esc(iv.candidate_name)}</strong>?</p>
        <div class="rec-form-field">
          <label for="cancel-reason-input" class="rec-form-label">Lý do hủy lịch <span class="req">*</span></label>
          <textarea id="cancel-reason-input" class="rec-form-input" rows="3" placeholder="Nhập lý do hủy (sẽ gửi thông báo đến ứng viên)..." required></textarea>
        </div>
        <div id="cancel-inline-error" class="rec-form-error" role="alert" hidden></div>
        <div class="rec-modal-footer">
          <button type="button" class="rec-btn-secondary" id="btn-keep-iv">Giữ lịch</button>
          <button type="button" class="rec-btn-danger" id="btn-confirm-cancel">Hủy lịch phỏng vấn</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const reasonIn = modal.querySelector("#cancel-reason-input");
  const errBox = modal.querySelector("#cancel-inline-error");
  const submitBtn = modal.querySelector("#btn-confirm-cancel");
  const close = () => { modal.remove(); document.removeEventListener("keydown", onKey); if (triggerEl && document.contains(triggerEl)) triggerEl.focus(); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  modal.querySelector("#btn-close-cancel")?.addEventListener("click", close);
  modal.querySelector("#btn-keep-iv")?.addEventListener("click", close);
  reasonIn.focus();

  submitBtn.addEventListener("click", async () => {
    const reason = reasonIn.value.trim();
    if (!reason) { errBox.textContent = "Vui lòng nhập lý do hủy lịch."; errBox.hidden = false; reasonIn.focus(); return; }
    submitBtn.disabled = true; submitBtn.textContent = "Đang hủy...";
    try {
      const res = await fetch(`${base}/employer/interviews/${iv.id}/cancel`, {
        method: "POST", headers: authHeaders, body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Hủy lịch phỏng vấn thất bại.");
      }
      close(); showToast("Đã hủy lịch phỏng vấn", "success"); onCancelled?.();
    } catch (err) {
      errBox.textContent = err.message; errBox.hidden = false;
      submitBtn.disabled = false; submitBtn.textContent = "Hủy lịch phỏng vấn";
    }
  });
}
