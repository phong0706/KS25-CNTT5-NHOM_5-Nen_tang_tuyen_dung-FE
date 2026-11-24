/**
 * rejectApplicationModal.js - Modal xác nhận từ chối hồ sơ (đơn lẻ & hàng loạt).
 * Rộng 480px, WAI-ARIA dialog, giữ/trả focus, Esc đóng, focus mặc định nút Hủy.
 */
import { showToast } from "./toast.js";
import { auth } from "../core/auth.js";

const QUICK_MESSAGES = [
  {
    label: "Chưa phù hợp chuyên môn",
    text: "Cảm ơn bạn đã dành thời gian ứng tuyển. Hiện hồ sơ chưa phù hợp với yêu cầu chuyên môn của vị trí này.",
  },
  {
    label: "Ưu tiên ứng viên khác",
    text: "Chúng tôi trân trọng sự quan tâm của bạn, tuy nhiên vị trí hiện tại đã chọn được ứng viên phù hợp hơn.",
  },
];

export function openRejectApplicationModal({
  mode = "single",
  appId = null,
  ids = [],
  candidateName = "",
  rejectionReasons = [],
  triggerEl = null,
  onSuccess,
  onConflict,
} = {}) {
  const prevFocus = triggerEl || document.activeElement;
  const hostId = "rec-reject-modal-host";
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    document.body.appendChild(host);
  }

  const titleText =
    mode === "bulk"
      ? `Từ chối ${ids.length} hồ sơ đã chọn?`
      : `Từ chối hồ sơ của ${candidateName || "ứng viên"}?`;
  const idempotencyKey = (crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`);

  host.innerHTML = `
    <div class="rec-reject-backdrop" id="rec-rej-backdrop">
      <div class="rec-reject-dialog" role="dialog" aria-modal="true" aria-labelledby="rec-rej-title" aria-describedby="rec-rej-desc">
        <div class="rec-reject-head">
          <div class="rec-reject-head-main">
            <span class="rec-reject-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </span>
            <div>
              <h3 id="rec-rej-title" class="rec-reject-title"></h3>
              <p id="rec-rej-desc" class="rec-reject-desc">Ứng viên sẽ nhận thông báo. Lịch phỏng vấn đang hẹn (nếu có) sẽ bị hủy.</p>
            </div>
          </div>
          <button type="button" id="rec-rej-x" class="rec-rej-close" aria-label="Đóng hộp thoại">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="rec-reject-body">
          <div class="rec-form-group" style="margin-bottom:14px;">
            <label class="rec-form-label" id="rec-rej-reason-lbl">Lý do từ chối <span style="color:#dc2626">*</span></label>
            <div id="rec-rej-reason-host" aria-labelledby="rec-rej-reason-lbl"></div>
          </div>
          <div class="rec-form-group" style="margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
              <label for="rec-rej-msg" class="rec-form-label" style="margin:0;">Lời nhắn cho ứng viên (tùy chọn)</label>
              <span id="rec-rej-counter" style="font-size:12px; color:var(--text-muted); font-variant-numeric:tabular-nums;">0/500</span>
            </div>
            <textarea id="rec-rej-msg" class="rec-form-textarea" rows="3" maxlength="500" placeholder="Nhập lời nhắn lịch sự gửi tới ứng viên..."></textarea>
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
              ${QUICK_MESSAGES.map((m, i) => `<button type="button" class="rec-rej-chip" data-quick-idx="${i}">${m.label}</button>`).join("")}
            </div>
          </div>
          <div class="rec-reject-preview" aria-live="polite">
            <span class="rec-reject-preview-label">Xem trước thông báo gửi ứng viên</span>
            <span id="rec-rej-preview"></span>
          </div>
          <div id="rec-rej-err" role="alert" hidden class="rec-reject-err">
            <span id="rec-rej-err-msg"></span>
            <button type="button" id="rec-rej-retry" class="rec-btn-view-profile" style="min-height:36px;">Thử lại</button>
          </div>
        </div>
        <div class="rec-reject-actions">
          <button type="button" id="rec-rej-cancel" class="rec-btn-view-profile" style="min-height:44px; padding:0 18px; background:var(--bg-surface);">Hủy</button>
          <button type="button" id="rec-rej-submit" class="rec-btn-danger-solid" disabled style="min-height:44px; padding:0 20px;">Từ chối hồ sơ</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("rec-rej-title").textContent = titleText;

  const backdrop = document.getElementById("rec-rej-backdrop");
  const cancelBtn = document.getElementById("rec-rej-cancel");
  const submitBtn = document.getElementById("rec-rej-submit");
  const msgInput = document.getElementById("rec-rej-msg");
  const counterEl = document.getElementById("rec-rej-counter");
  const previewEl = document.getElementById("rec-rej-preview");
  const errBox = document.getElementById("rec-rej-err");
  const errMsg = document.getElementById("rec-rej-err-msg");
  const retryBtn = document.getElementById("rec-rej-retry");

  let selectedSlug = "";
  let selectedLabel = "";
  let submitting = false;

  const updatePreview = () => {
    const val = (msgInput?.value || "").trim();
    if (counterEl) counterEl.textContent = `${(msgInput?.value || "").length}/500`;
    if (submitBtn) submitBtn.disabled = !selectedSlug || submitting;
    const reasonText = selectedLabel ? `Lý do: ${selectedLabel}` : "Chưa chọn lý do";
    previewEl.textContent = val ? `Ứng viên sẽ thấy: ${reasonText}. Lời nhắn: ${val}` : `Ứng viên sẽ thấy: ${reasonText}`;
  };

  const reasonHost = document.getElementById("rec-rej-reason-host");
  if (reasonHost && typeof window.CustomSelect === "function") {
    new window.CustomSelect(reasonHost, {
      id: "rec-rej-reason-select",
      ariaLabel: "Chọn lý do từ chối",
      placeholder: "-- Chọn lý do từ chối --",
      options: (rejectionReasons || []).map((r) => ({ value: r.slug, label: r.name })),
      value: "",
      onChange: (val) => {
        selectedSlug = val || "";
        const found = (rejectionReasons || []).find((r) => r.slug === selectedSlug);
        selectedLabel = found ? found.name : "";
        updatePreview();
      },
    });
  }

  host.querySelectorAll("[data-quick-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-quick-idx"));
      if (msgInput && QUICK_MESSAGES[idx]) {
        msgInput.value = QUICK_MESSAGES[idx].text;
        updatePreview();
      }
    });
  });

  msgInput?.addEventListener("input", updatePreview);
  updatePreview();

  const closeModal = () => {
    document.removeEventListener("keydown", onKey);
    host.innerHTML = "";
    if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
  };

  const onKey = (e) => {
    if (e.key === "Escape" && !submitting) {
      e.preventDefault();
      closeModal();
    }
  };
  document.addEventListener("keydown", onKey);
  document.getElementById("rec-rej-x")?.addEventListener("click", () => { if (!submitting) closeModal(); });
  cancelBtn?.addEventListener("click", () => { if (!submitting) closeModal(); });
  backdrop?.addEventListener("click", (e) => { if (e.target === backdrop && !submitting) closeModal(); });

  const doSubmit = async () => {
    if (!selectedSlug || submitting) return;
    submitting = true;
    errBox.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang xử lý...";

    try {
      await auth.ready;
      const token = auth.getToken() || "";
      const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
      const url = mode === "bulk" ? `${base}/employer/applications/bulk-reject` : `${base}/employer/applications/${appId}/reject`;
      const payload = mode === "bulk"
        ? { ids, reason_code: selectedSlug, message: msgInput.value.trim() || null }
        : { reason_code: selectedSlug, message: msgInput.value.trim() || null };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        showToast(data?.detail || "Trạng thái hồ sơ đã thay đổi bởi người khác.", "warning");
        closeModal();
        onConflict?.();
        return;
      }
      if (!res.ok) {
        throw new Error(data?.detail || "Không thể từ chối hồ sơ.");
      }

      closeModal();
      onSuccess?.(data);
    } catch (err) {
      errMsg.textContent = err?.message || "Lỗi kết nối máy chủ. Vui lòng thử lại.";
      errBox.hidden = false;
    } finally {
      submitting = false;
      if (submitBtn) {
        submitBtn.textContent = "Từ chối hồ sơ";
        submitBtn.disabled = !selectedSlug;
      }
    }
  };

  submitBtn?.addEventListener("click", doSubmit);
  retryBtn?.addEventListener("click", doSubmit);
  cancelBtn?.focus();
}
