/**
 * cvActionModal.js - Accessible modal cho Đổi tên, Xác nhận xóa và Cảnh báo xóa CV bị chặn.
 * Tuân thủ techrecruit-rules: <= 150 dòng, không dùng alert/confirm.
 */
function esc(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

export function showCvModal({ title, bodyHtml, confirmText = "Xác nhận", confirmClass = "btn btn-primary", cancelText = "Hủy bỏ", onConfirm, callerBtn = null }) {
  let overlay = document.getElementById("cv-action-modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "cv-action-modal-overlay";
    overlay.className = "cv-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="cv-modal-box" role="document">
      <div class="cv-modal-head">
        <h3 class="cv-modal-title" id="cv-modal-title">${esc(title)}</h3>
        <button type="button" class="cv-modal-close" id="cv-modal-close-btn" aria-label="Đóng">&times;</button>
      </div>
      <div class="cv-modal-body" id="cv-modal-body">${bodyHtml}</div>
      <div class="cv-modal-foot">
        <button type="button" class="btn btn-outline" id="cv-modal-cancel-btn">${esc(cancelText)}</button>
        ${confirmText ? `<button type="button" class="${confirmClass}" id="cv-modal-confirm-btn">${esc(confirmText)}</button>` : ""}
      </div>
    </div>`;

  overlay.removeAttribute("hidden");
  const close = () => {
    overlay.setAttribute("hidden", "true");
    overlay.innerHTML = "";
    document.removeEventListener("keydown", onKey);
    callerBtn?.focus?.();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);

  overlay.querySelector("#cv-modal-close-btn")?.addEventListener("click", close);
  overlay.querySelector("#cv-modal-cancel-btn")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  const confirmBtn = overlay.querySelector("#cv-modal-confirm-btn");
  if (confirmBtn && onConfirm) {
    confirmBtn.addEventListener("click", async () => {
      confirmBtn.disabled = true;
      confirmBtn.setAttribute("aria-busy", "true");
      const origText = confirmBtn.textContent;
      confirmBtn.textContent = confirmText.includes("Xóa") ? "Đang xóa..." : "Đang xử lý...";
      try {
        if (await onConfirm() !== false) close();
        else {
          confirmBtn.disabled = false;
          confirmBtn.removeAttribute("aria-busy");
          confirmBtn.textContent = origText;
        }
      } catch {
        confirmBtn.disabled = false;
        confirmBtn.removeAttribute("aria-busy");
        confirmBtn.textContent = origText;
      }
    });
  }

  const input = overlay.querySelector("input");
  if (input) { input.focus(); input.select(); } else confirmBtn?.focus();
  return { close };
}

export function promptRenameCv(cv, onSave) {
  const currentName = cv.original_name.replace(/\.[^/.]+$/, "");
  const ext = cv.original_name.substring(cv.original_name.lastIndexOf("."));
  showCvModal({
    title: "Đổi tên file CV",
    bodyHtml: `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <label for="cv-rename-input" style="font-weight:600; color:var(--text); font-size:0.875rem;">Tên hiển thị mới:</label>
        <div style="display:flex; align-items:center; gap:4px;">
          <input type="text" id="cv-rename-input" class="form-input" value="${esc(currentName)}" maxlength="110" style="flex:1;" />
          <span style="font-size:0.875rem; color:var(--text-muted); font-weight:600;">${esc(ext)}</span>
        </div>
        <span style="font-size:0.75rem; color:var(--text-muted);">Tối đa 120 ký tự (bao gồm phần mở rộng).</span>
        <div id="cv-rename-error" style="color:#dc2626; font-size:0.8125rem;" hidden></div>
      </div>`,
    confirmText: "Lưu thay đổi",
    onConfirm: async () => {
      const input = document.getElementById("cv-rename-input");
      const errBox = document.getElementById("cv-rename-error");
      const val = (input?.value || "").trim();
      if (!val) {
        if (errBox) { errBox.textContent = "Vui lòng nhập tên CV."; errBox.hidden = false; }
        return false;
      }
      await onSave(`${val}${ext}`);
      return true;
    },
  });
}

export function promptDeleteCv(cv, onConfirmDelete, callerBtn = null) {
  const isUsed = cv.used_count > 0;
  const isDefault = Boolean(cv.is_default);

  const usageNotice = isUsed
    ? `<div class="cv-modal-note is-warning">Đang dùng trong ${cv.used_count} hồ sơ. Các đơn đã nộp vẫn giữ bản CV này.</div>`
    : `<div class="cv-modal-note">CV này chưa dùng trong hồ sơ nào. Tệp sẽ bị xóa hoàn toàn.</div>`;

  const defaultNotice = isDefault
    ? `<div class="cv-modal-note is-info">CV này đang được đặt làm mặc định. Khi xóa, hệ thống sẽ tự động chuyển mặc định sang CV mới nhất còn lại (hoặc không còn mặc định nếu hết CV).</div>`
    : "";

  showCvModal({
    title: "Xác nhận xóa CV",
    bodyHtml: `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <p style="margin:0; color:var(--text); font-size:0.9375rem;">
          Bạn có chắc chắn muốn xóa bản CV <strong>${esc(cv.original_name)}</strong> không?
        </p>
        ${usageNotice}
        ${defaultNotice}
      </div>`,
    confirmText: "Xóa CV",
    confirmClass: "btn btn-danger",
    cancelText: "Giữ lại",
    callerBtn,
    onConfirm: onConfirmDelete,
  });
}

export function showBlockedDeleteCv(cv, activeJobs = []) {
  const jobsList = activeJobs.map((j) => `<li><strong>${esc(j)}</strong></li>`).join("");
  showCvModal({
    title: "Không thể xóa CV",
    bodyHtml: `<div style="display:flex; flex-direction:column; gap:10px;"><p style="margin:0; color:#b45309;">CV <strong>${esc(cv.original_name)}</strong> đang được dùng trong các tin tuyển dụng đang hoạt động:</p><ul style="margin:0; padding-left:20px; font-size:0.875rem; color:var(--text); line-height:1.6;">${jobsList || "<li>Hồ sơ ứng tuyển đang chờ duyệt</li>"}</ul><p style="margin:0; font-size:0.8125rem; color:var(--text-muted);">Vui lòng rút hồ sơ hoặc chờ quy trình tuyển dụng kết thúc trước khi xóa CV này.</p></div>`,
    confirmText: "Đã hiểu",
    confirmClass: "btn btn-primary",
    onConfirm: () => true,
  });
}

export async function openOrDownloadCv(cv, showToast) {
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  const token = (window.AuthCore?.getSession()?.token) || (window.Auth?.getToken?.()) || "";
  try {
    showToast?.("Đang mở file...", "info", 1200);
    const res = await fetch(`${base}/candidate/cvs/${cv.id}/file`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể tải file.");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if ((cv.mime_type || cv.mime || "").includes("pdf")) {
      window.open(url, "_blank");
    } else {
      const a = document.createElement("a");
      a.href = url; a.download = cv.original_name || "CV_Download";
      document.body.appendChild(a); a.click(); a.remove();
    }
  } catch (err) { showToast?.(err.message || "Lỗi khi mở file", "error"); }
}
