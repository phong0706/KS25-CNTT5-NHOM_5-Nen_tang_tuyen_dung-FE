/**
 * employerInterviewModal.js - Modal Đổi lịch & Hủy lịch phỏng vấn WAI-ARIA (<= 200 dòng)
 */
import { showToast } from "./toast.js";

const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const formatVN = (d) => ({
  date: d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }),
  time: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
});

export function openRescheduleModal(iv, { base, authHeaders, onUpdated, triggerEl }) {
  document.getElementById("rec-reschedule-modal")?.remove();
  const oldDt = new Date(iv.scheduled_at);
  const now = new Date();
  const [oldDateStr, oldTimeStr, todayStr] = [toDateStr(oldDt), toTimeStr(oldDt), toDateStr(now)];
  const def = oldDt > now ? { date: oldDateStr, time: oldTimeStr } : { date: toDateStr(new Date(now.getTime() + 86400000)), time: "09:00" };

  const modal = document.createElement("div");
  modal.id = "rec-reschedule-modal";
  modal.className = "rec-modal-overlay";
  modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "reschedule-modal-title");

  const oldVn = formatVN(oldDt);
  modal.innerHTML = `
    <div class="rec-modal-card">
      <div class="rec-modal-header">
        <div>
          <h2 id="reschedule-modal-title" class="rec-modal-title">Đổi lịch phỏng vấn</h2>
          <div class="rec-modal-sub"><span class="rec-modal-cand-name"><strong>${esc(iv.candidate_name)}</strong></span><span class="rec-modal-sep"> · </span><span class="rec-modal-job-title">${esc(iv.job_title)}</span></div>
        </div>
        <button type="button" class="rec-modal-close" id="btn-close-reschedule" aria-label="Đóng">✕</button>
      </div>
      <div class="rec-modal-body">
        <div class="rec-diff-box" id="reschedule-diff-box">
          <div class="rec-diff-col is-old"><span class="rec-diff-label">Lịch hiện tại</span><span class="rec-diff-val is-old">${oldVn.date}, ${oldVn.time}</span><span class="rec-diff-sub">Thời lượng: ${iv.duration_min || 45} phút</span></div>
          <div class="rec-diff-arrow" aria-hidden="true">→</div>
          <div class="rec-diff-col is-new" id="reschedule-diff-new"><span class="rec-diff-label">Lịch mới dự kiến</span><span class="rec-diff-val is-new" id="reschedule-preview-val">Chưa có thay đổi</span><span class="rec-diff-sub" id="reschedule-preview-sub">Thời lượng giữ nguyên ${iv.duration_min || 45} phút</span></div>
        </div>
        <form id="reschedule-form" class="rec-modal-form" novalidate>
          <div class="rec-form-grid">
            <div class="rec-form-field">
              <label for="reschedule-input-date" class="rec-form-label">Ngày phỏng vấn mới <span class="req">*</span></label>
              <input type="date" id="reschedule-input-date" class="rec-form-input" min="${todayStr}" value="${def.date}" required>
              <span id="reschedule-date-err" class="rec-field-error" role="alert" hidden></span>
            </div>
            <div class="rec-form-field">
              <label for="reschedule-input-time" class="rec-form-label">Giờ phỏng vấn <span class="req">*</span></label>
              <input type="time" id="reschedule-input-time" class="rec-form-input" step="900" value="${def.time}" required>
              <span id="reschedule-time-err" class="rec-field-error" role="alert" hidden></span>
            </div>
          </div>
          <div id="reschedule-inline-error" class="rec-form-error" role="alert" hidden></div>
          <div class="rec-modal-footer">
            <span id="reschedule-unchanged-hint" class="rec-unchanged-hint" hidden>Chưa có thay đổi</span>
            <button type="button" class="rec-btn-cancel" id="btn-cancel-reschedule">Hủy</button>
            <button type="submit" class="rec-btn-submit" id="btn-submit-reschedule">Lưu lịch mới</button>
          </div>
        </form>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const [dateIn, timeIn] = [modal.querySelector("#reschedule-input-date"), modal.querySelector("#reschedule-input-time")];
  const [previewVal, diffNew] = [modal.querySelector("#reschedule-preview-val"), modal.querySelector("#reschedule-diff-new")];
  const [dateErr, timeErr, errBox] = [modal.querySelector("#reschedule-date-err"), modal.querySelector("#reschedule-time-err"), modal.querySelector("#reschedule-inline-error")];
  const [hintEl, submitBtn] = [modal.querySelector("#reschedule-unchanged-hint"), modal.querySelector("#btn-submit-reschedule")];

  const close = () => { modal.remove(); document.removeEventListener("keydown", onKey); triggerEl?.focus(); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  modal.querySelector("#btn-close-reschedule")?.addEventListener("click", close);
  modal.querySelector("#btn-cancel-reschedule")?.addEventListener("click", close);

  const validateAndPreview = () => {
    dateErr.hidden = true; timeErr.hidden = true; errBox.hidden = true;
    const [curD, curT] = [dateIn.value, timeIn.value];
    if (!curD || !curT) {
      previewVal.textContent = "Chưa chọn đủ ngày giờ"; diffNew.classList.remove("has-changed");
      submitBtn.disabled = true; hintEl.hidden = true; return false;
    }
    const isSame = (curD === oldDateStr && curT === oldTimeStr);
    const [y, m, d] = curD.split("-").map(Number); const [h, min] = curT.split(":").map(Number);
    const targetDt = new Date(y, m - 1, d, h, min); const newVn = formatVN(targetDt);
    if (isSame) {
      previewVal.textContent = `${newVn.date}, ${newVn.time}`; diffNew.classList.remove("has-changed");
      submitBtn.disabled = true; hintEl.hidden = false; return false;
    }
    hintEl.hidden = true; diffNew.classList.add("has-changed"); previewVal.textContent = `${newVn.date}, ${newVn.time}`;
    if (curD < toDateStr(new Date())) {
      dateErr.textContent = "Ngày phỏng vấn không thể ở trong quá khứ."; dateErr.hidden = false; submitBtn.disabled = true; return false;
    }
    if (targetDt <= new Date()) {
      timeErr.textContent = "Giờ phỏng vấn đã qua so với thời điểm hiện tại."; timeErr.hidden = false; submitBtn.disabled = true; return false;
    }
    submitBtn.disabled = false; return true;
  };

  dateIn.addEventListener("input", validateAndPreview);
  timeIn.addEventListener("input", validateAndPreview);
  validateAndPreview(); dateIn.focus();

  modal.querySelector("#reschedule-form").addEventListener("submit", async (e) => {
    e.preventDefault(); if (!validateAndPreview()) return;
    submitBtn.disabled = true; submitBtn.textContent = "Đang lưu lịch...";
    const [y, m, d] = dateIn.value.split("-").map(Number); const [h, min] = timeIn.value.split(":").map(Number);
    const targetDt = new Date(y, m - 1, d, h, min);
    const dtStr = `${targetDt.getFullYear()}-${pad(targetDt.getMonth() + 1)}-${pad(targetDt.getDate())}T${pad(targetDt.getHours())}:${pad(targetDt.getMinutes())}:00`;
    try {
      const res = await fetch(`${base}/employer/interviews/${iv.id}/reschedule`, {
        method: "PATCH", headers: authHeaders,
        body: JSON.stringify({ scheduled_at: dtStr, duration_min: iv.duration_min || 45, force: false }),
      });
      if (res.status === 409) {
        const dJson = await res.json(); const c = dJson.detail?.conflict;
        throw new Error(`Giờ này đã có lịch phỏng vấn khác ${c ? `(với ${c.candidate_name} - ${c.job_title})` : ""}. Vui lòng chọn giờ khác.`);
      }
      if (!res.ok) { const dJson = await res.json().catch(() => ({})); throw new Error(dJson.detail || "Đổi lịch phỏng vấn thất bại."); }
      close();
      const vn = formatVN(targetDt);
      showToast(`Đã đổi lịch sang ${vn.date}, ${vn.time}`, "success");
      onUpdated?.(dtStr);
    } catch (err) {
      errBox.textContent = err.message; errBox.hidden = false; submitBtn.disabled = false; submitBtn.textContent = "Lưu lịch mới";
    }
  });
}

export function openCancelInterviewModal(iv, { base, authHeaders, onCancelled, triggerEl }) {
  document.getElementById("rec-cancel-modal")?.remove();
  const modal = document.createElement("div");
  modal.id = "rec-cancel-modal"; modal.className = "rec-modal-overlay";
  modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "cancel-modal-title");

  modal.innerHTML = `
    <div class="rec-modal-card rec-modal-card--sm">
      <div class="rec-modal-header"><h2 id="cancel-modal-title" class="rec-modal-title">Hủy lịch phỏng vấn?</h2><button type="button" class="rec-modal-close" id="btn-close-cancel" aria-label="Đóng">✕</button></div>
      <div class="rec-modal-body">
        <p style="font-size:14px;color:var(--text-secondary);margin:0 0 12px;">Hủy lịch hẹn với ứng viên <strong>${esc(iv.candidate_name)}</strong>?</p>
        <div class="rec-form-field">
          <label for="cancel-reason-input" class="rec-form-label">Lý do hủy lịch <span class="req">*</span></label>
          <textarea id="cancel-reason-input" class="rec-form-input" rows="3" placeholder="Nhập lý do hủy (sẽ gửi thông báo đến ứng viên)..." required></textarea>
        </div>
        <div id="cancel-inline-error" class="rec-form-error" role="alert" hidden></div>
        <div class="rec-modal-footer">
          <button type="button" class="rec-btn-cancel" id="btn-keep-iv">Giữ lịch</button>
          <button type="button" class="rec-btn-danger" id="btn-confirm-cancel">Hủy lịch phỏng vấn</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const [reasonIn, errBox, submitBtn] = [modal.querySelector("#cancel-reason-input"), modal.querySelector("#cancel-inline-error"), modal.querySelector("#btn-confirm-cancel")];
  const close = () => { modal.remove(); document.removeEventListener("keydown", onKey); triggerEl?.focus(); };
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
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || "Hủy lịch phỏng vấn thất bại."); }
      close(); showToast("Đã hủy lịch phỏng vấn", "success"); onCancelled?.();
    } catch (err) {
      errBox.textContent = err.message; errBox.hidden = false; submitBtn.disabled = false; submitBtn.textContent = "Hủy lịch phỏng vấn";
    }
  });
}
