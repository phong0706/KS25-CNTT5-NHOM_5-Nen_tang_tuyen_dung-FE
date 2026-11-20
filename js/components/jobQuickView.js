/**
 * Quick View Drawer cho màn hình Desktop (>= 1280px)
 * Điều hướng phím mũi tên lên/xuống, Esc đóng, URL ?job=ID.
 */
import { renderJobDetailContent } from "./jobDetailRenderer.js";
import { openApplyModal } from "./applyModal.js";
import { jobDetailUrl } from "../routes.js";

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function initJobQuickView({ onSelectJob }) {
  let drawerEl = document.getElementById("job-quick-view-drawer");
  let overlayEl = document.getElementById("job-quick-view-overlay");
  let currentList = [];
  let currentJobId = null;

  if (!drawerEl) {
    overlayEl = document.createElement("div");
    overlayEl.id = "job-quick-view-overlay";
    overlayEl.className = "quick-view-overlay";
    overlayEl.hidden = true;
    document.body.appendChild(overlayEl);

    drawerEl = document.createElement("div");
    drawerEl.id = "job-quick-view-drawer";
    drawerEl.className = "quick-view-drawer";
    drawerEl.setAttribute("role", "dialog");
    drawerEl.setAttribute("aria-modal", "true");
    drawerEl.setAttribute("aria-label", "Xem nhanh việc làm");
    drawerEl.hidden = true;
    document.body.appendChild(drawerEl);
  }

  function close() {
    drawerEl.hidden = true;
    drawerEl.classList.remove("is-open");
    overlayEl.hidden = true;
    currentJobId = null;
    const url = new URL(window.location.href);
    if (url.searchParams.has("job")) {
      url.searchParams.delete("job");
      window.history.pushState(null, "", url.toString());
    }
  }

  overlayEl.addEventListener("click", close);

  async function open(jobId) {
    currentJobId = jobId;
    const url = new URL(window.location.href);
    url.searchParams.set("job", jobId);
    window.history.pushState(null, "", url.toString());

    drawerEl.hidden = false;
    overlayEl.hidden = false;
    setTimeout(() => drawerEl.classList.add("is-open"), 10);
    drawerEl.innerHTML = `<div class="quick-view-loading" style="padding:32px; text-align:center; color:var(--text-secondary);">Đang tải thông tin chi tiết...</div>`;

    try {
      const job = await window.api.get(`/jobs/${jobId}`);
      renderDrawer(job);
    } catch {
      drawerEl.innerHTML = `
        <div style="padding:24px;">
          <p style="color:var(--danger-600);">Không thể tải thông tin chi tiết việc làm.</p>
          <button type="button" class="btn btn-sm btn-outline" id="qv-close-err">Đóng</button>
        </div>
      `;
      document.getElementById("qv-close-err")?.addEventListener("click", close);
    }
  }

  function renderDrawer(j) {
    drawerEl.innerHTML = `
      <div class="quick-view-header">
        <div style="flex:1; min-width:0;">
          <a href="${escapeHtml(jobDetailUrl(j.id))}" class="btn btn-sm btn-outline" target="_blank" rel="noopener">Mở trang đầy đủ</a>
        </div>
        <button type="button" class="quick-view-close-btn" id="qv-close-btn" aria-label="Đóng">&times;</button>
      </div>
      <div class="quick-view-body">
        ${renderJobDetailContent(j)}
      </div>
    `;

    document.getElementById("qv-close-btn")?.addEventListener("click", close);
    document.getElementById("jd-apply-btn")?.addEventListener("click", () => {
      openApplyModal(j);
    });
  }

  function handleKeydown(e) {
    if (drawerEl.hidden) return;
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      stepJob(1);
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      stepJob(-1);
    }
  }

  function stepJob(direction) {
    if (!currentList.length || !currentJobId) return;
    const idx = currentList.findIndex((it) => it.id === currentJobId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < currentList.length) {
      open(currentList[nextIdx].id);
    }
  }

  window.addEventListener("keydown", handleKeydown);

  return {
    setList(list) { currentList = list; },
    openJob(jobId) { open(jobId); },
    closeJob() { close(); },
    checkInitialUrl() {
      const urlJob = new URLSearchParams(window.location.search).get("job");
      if (urlJob && window.innerWidth >= 1280) {
        open(Number(urlJob));
      }
    },
  };
}
