/**
 * withdrawModal.js - Modal web xác nhận rút hồ sơ: lý do động từ API, CustomSelect, focus Hủy mặc định.
 * Giới hạn: < 200 dòng.
 */
import { showStatusToast } from "./toast.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

export async function openWithdrawModal({ app, triggerBtn, onSuccess }) {
  const returnFocus = triggerBtn || document.activeElement;
  const backdrop = document.createElement("div");
  backdrop.className = "withdraw-modal-backdrop";
  const titleId = `wm-title-${app.id}`;
  const descId = `wm-desc-${app.id}`;

  backdrop.innerHTML = `
    <div class="withdraw-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}" aria-describedby="${descId}">
      <div class="withdraw-modal-header">
        <h2 id="${titleId}" class="withdraw-modal-title">Xác nhận rút hồ sơ ứng tuyển</h2>
        <button type="button" class="withdraw-modal-close" aria-label="Đóng popup">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="withdraw-modal-body">
        <p id="${descId}" class="withdraw-modal-warning">
          <strong>Hậu quả:</strong> Nhà tuyển dụng sẽ không còn thấy hồ sơ này trong danh sách ứng viên. Bạn có thể nộp lại sau 7 ngày nếu vị trí vẫn mở.
        </p>
        <div class="withdraw-field-group">
          <label for="withdraw-reason-select" class="withdraw-label">Lý do rút hồ sơ <span class="withdraw-opt">(tùy chọn)</span></label>
          <div id="withdraw-custom-select-host"></div>
        </div>
        <div id="withdraw-err-box" class="withdraw-err-box" role="alert" hidden></div>
      </div>
      <div class="withdraw-modal-footer">
        <button type="button" class="btn btn-outline withdraw-cancel-btn">Hủy bỏ</button>
        <button type="button" class="btn btn-danger withdraw-confirm-btn">
          <span class="btn-spinner" aria-hidden="true" hidden></span>
          <span class="btn-text">Rút hồ sơ</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");

  const cancelBtn = backdrop.querySelector(".withdraw-cancel-btn");
  const confirmBtn = backdrop.querySelector(".withdraw-confirm-btn");
  const closeBtn = backdrop.querySelector(".withdraw-modal-close");
  const errBox = backdrop.querySelector("#withdraw-err-box");
  const selectHost = backdrop.querySelector("#withdraw-custom-select-host");

  let isSubmitting = false;
  let selectedReason = "";

  // Lấy lý do động từ API
  try {
    const res = await http.get("/meta/withdraw-reasons");
    const reasons = Array.isArray(res.data) ? res.data : [];
    const options = [
      { value: "", label: "-- Chọn lý do rút hồ sơ --" },
      ...reasons.map((r) => ({ value: r.name, label: r.name })),
    ];
    if (window.CustomSelect) {
      new window.CustomSelect(selectHost, {
        id: "withdraw-reason-select",
        name: "reason",
        options,
        value: "",
        ariaLabel: "Chọn lý do rút hồ sơ",
        onChange: (val) => { selectedReason = val || ""; },
      });
    } else {
      selectHost.innerHTML = `
        <div class="custom-select-fallback">
          <button type="button" class="btn btn-outline" style="width:100%;text-align:left;">-- Chọn lý do rút hồ sơ --</button>
        </div>
      `;
    }
  } catch {
    selectHost.innerHTML = `<p class="text-muted" style="font-size:0.8125rem;">Không tải được danh mục lý do.</p>`;
  }

  const closeModal = () => {
    document.removeEventListener("keydown", handleKeydown, true);
    backdrop.remove();
    document.body.classList.remove("modal-open");
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
  };

  const handleKeydown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); if (!isSubmitting) closeModal(); return; }
    if (e.key === "Tab") {
      const focusables = backdrop.querySelectorAll('button:not([disabled]), [tabindex="0"], a[href]');
      if (!focusables.length) return;
      const [first, last] = [focusables[0], focusables[focusables.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", handleKeydown, true);

  cancelBtn.addEventListener("click", () => { if (!isSubmitting) closeModal(); });
  closeBtn.addEventListener("click", () => { if (!isSubmitting) closeModal(); });
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop && !isSubmitting) closeModal(); });

  confirmBtn.addEventListener("click", async () => {
    if (isSubmitting) return;
    isSubmitting = true;
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    confirmBtn.querySelector(".btn-spinner").hidden = false;
    confirmBtn.querySelector(".btn-text").textContent = "Đang xử lý...";
    errBox.hidden = true;

    try {
      const res = await http.post(`/candidate/applications/${app.id}/withdraw`, {
        reason: selectedReason || "Ứng viên chủ động rút hồ sơ",
      });
      showStatusToast(res.data?.message || "Đã rút hồ sơ thành công.", "success");
      onSuccess?.();
      closeModal();
    } catch (err) {
      isSubmitting = false;
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      confirmBtn.querySelector(".btn-spinner").hidden = true;
      confirmBtn.querySelector(".btn-text").textContent = "Rút hồ sơ";
      const status = err.response?.status;
      const msg = err.response?.data?.detail || err.message || "Không thể rút hồ sơ lúc này.";
      errBox.textContent = msg;
      errBox.hidden = false;
      if (status === 409) {
        confirmBtn.disabled = true;
      }
    }
  });

  // Focus mặc định vào nút HỦY (quy tắc an toàn của web accessible dialog)
  window.setTimeout(() => cancelBtn.focus(), 60);
}

