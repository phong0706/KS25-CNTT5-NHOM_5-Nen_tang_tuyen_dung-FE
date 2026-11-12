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

