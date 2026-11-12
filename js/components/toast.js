/**
 * Toast thông báo trạng thái chuẩn truy cập (role="status", tự ẩn sau 2 giây).
 */
export function showStatusToast(message, type = "success", duration = 2000) {
  let container = document.getElementById("profile-toast-region");
  if (!container) {
    container = document.createElement("div");
    container.id = "profile-toast-region";
    container.className = "profile-toast-region";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `profile-toast profile-toast-${type}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = message;
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 180);
  }, duration);
}

/**
 * Toast có nút "Hoàn tác" (mặc định 5 giây) để gọi API đảo trạng thái thật.
 */
export function showUndoToast(message, onUndo, duration = 5000) {
  let container = document.getElementById("profile-toast-region");
  if (!container) {
    container = document.createElement("div");
    container.id = "profile-toast-region";
    container.className = "profile-toast-region";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "profile-toast profile-toast-success ej-toast-undo";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const textSpan = document.createElement("span");
  textSpan.textContent = message;

  const undoBtn = document.createElement("button");
  undoBtn.type = "button";
  undoBtn.className = "ej-toast-undo-btn";
  undoBtn.textContent = "Hoàn tác";

  toast.appendChild(textSpan);
  toast.appendChild(undoBtn);
  container.appendChild(toast);

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 180);
  };

  const timer = window.setTimeout(dismiss, duration);

  undoBtn.addEventListener("click", async () => {
    window.clearTimeout(timer);
    undoBtn.disabled = true;
    undoBtn.textContent = "Đang hoàn tác...";
    try {
      await onUndo?.();
    } finally {
      dismiss();
    }
  });
}

