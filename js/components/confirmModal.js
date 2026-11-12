/**
 * Modal xác nhận web chuẩn truy cập:
 * - Mô tả hậu quả rõ ràng
 * - Nút "Hủy" được focus mặc định
 * - Nút hành động đỏ cho thao tác nguy hiểm
 * - Giữ focus bên trong modal (focus trap), Esc đóng và trả lại focus cũ.
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function openConfirmModal({
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  danger = true,
  returnFocusTo = null,
  onConfirm,
}) {
  const previousFocus = returnFocusTo || document.activeElement;
  const backdrop = document.createElement("div");
  backdrop.className = "confirm-modal-backdrop ej-modal-backdrop";

  const titleId = `ej-modal-title-${Date.now()}`;
  const descId = `ej-modal-desc-${Date.now()}`;

  backdrop.innerHTML = `
    <div
      class="confirm-modal-dialog ej-modal-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${titleId}"
      aria-describedby="${descId}"
    >
      <h2 id="${titleId}" class="confirm-modal-title">${escapeText(title)}</h2>
      <p id="${descId}" class="confirm-modal-desc">${escapeText(description)}</p>
      <div class="confirm-modal-actions">
        <button type="button" class="confirm-modal-cancel ej-modal-btn" data-role="cancel">${escapeText(cancelLabel)}</button>
        <button type="button" class="${danger ? "confirm-modal-danger" : "ej-btn-primary"} ej-modal-btn" data-role="confirm">${escapeText(confirmLabel)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const cancelBtn = backdrop.querySelector('[data-role="cancel"]');
  const confirmBtn = backdrop.querySelector('[data-role="confirm"]');
  let isBusy = false;

  const close = () => {
    document.removeEventListener("keydown", onKeyDown, true);
    backdrop.remove();
    if (previousFocus && typeof previousFocus.focus === "function" && document.contains(previousFocus)) {
      previousFocus.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      if (isBusy) return;
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      const focusables = [cancelBtn, confirmBtn].filter((el) => el && !el.disabled);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener("keydown", onKeyDown, true);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop && !isBusy) close();
  });

  cancelBtn.addEventListener("click", () => {
    if (!isBusy) close();
  });

  confirmBtn.addEventListener("click", async () => {
    if (isBusy) return;
    isBusy = true;
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    confirmBtn.textContent = "Đang xử lý...";
    try {
      await onConfirm?.();
      close();
    } catch {
      isBusy = false;
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      confirmBtn.textContent = confirmLabel;
    }
  });

  // Focus mặc định vào nút Hủy
  window.requestAnimationFrame(() => cancelBtn?.focus());
}

