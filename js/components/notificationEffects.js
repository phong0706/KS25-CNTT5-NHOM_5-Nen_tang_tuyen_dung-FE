/**
 * notificationEffects.js - Hiệu ứng âm thanh (<100ms), rung và in-tab toast (<= 100 dòng).
 */
export function isSoundEnabled() {
  return localStorage.getItem("notif_sound_enabled") === "1";
}

export function toggleSound() {
  const next = !isSoundEnabled();
  localStorage.setItem("notif_sound_enabled", next ? "1" : "0");
  return next;
}

export function playNotificationEffects() {
  if (document.visibilityState !== "visible") return;
  if (isSoundEnabled()) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {}
  }
  if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
    try { navigator.vibrate(50); } catch {}
  }
}

export function showNotifToast(notif, root = "./") {
  if (document.visibilityState !== "visible" || !notif) return;
  let container = document.getElementById("notif-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notif-toast-container";
    container.className = "notif-toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "notif-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const title = notif.title || "Thông báo mới";
  const body = notif.body || notif.message || "";
  const href = notif.href || notif.link || "#";

  toast.innerHTML = `
    <div style="flex:1;">
      <h4 class="notif-toast-title">${String(title).replace(/</g, "&lt;")}</h4>
      <p class="notif-toast-body">${String(body).replace(/</g, "&lt;")}</p>
    </div>
    <button type="button" class="notif-toast-close" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:16px;">✕</button>
  `;

  toast.addEventListener("click", (e) => {
    if (e.target.closest(".notif-toast-close")) {
      toast.remove();
      return;
    }
    if (href && href !== "#") window.location.href = href;
  });

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 250);
  }, 4500);
}
