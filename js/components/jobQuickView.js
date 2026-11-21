/**
 * jobQuickView.js - Quick View Drawer cho màn hình Desktop (<= 180 dòng).
 * Điều hướng phím mũi tên lên/xuống, Esc đóng, URL ?job=ID, focus trap, sticky footer.
 */
import { renderJobDetailContent, renderActionBar } from "./jobDetailRenderer.js";
import { openApplyModal } from "./applyModal.js";
import { toggleSave } from "./jobCard.js";
import { showStatusToast } from "./toast.js";
import { jobDetailUrl, loginUrl, appliedJobsUrl } from "../routes.js";

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function initJobQuickView({ onSelectJob } = {}) {
  let drawerEl = document.getElementById("job-quick-view-drawer");
  let overlayEl = document.getElementById("job-quick-view-overlay");
  let currentList = [], currentJobId = null, lastActiveElement = null;

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
    drawerEl.setAttribute("aria-label", "Chi tiết việc làm");
    drawerEl.setAttribute("tabindex", "-1");
    drawerEl.hidden = true;
    document.body.appendChild(drawerEl);
  }

  function close() {
    drawerEl.hidden = true;
    drawerEl.classList.remove("is-open");
    overlayEl.hidden = true;
    document.body.style.overflow = "";
    currentJobId = null;
    const url = new URL(window.location.href);
    if (url.searchParams.has("job")) {
      url.searchParams.delete("job");
      window.history.pushState(null, "", url.toString());
    }
    if (lastActiveElement?.focus) lastActiveElement.focus();
  }

  overlayEl.addEventListener("click", close);

  async function open(jobId) {
    if (!lastActiveElement) lastActiveElement = document.activeElement;
    currentJobId = jobId;
    const url = new URL(window.location.href);
    url.searchParams.set("job", jobId);
    window.history.pushState(null, "", url.toString());

    document.body.style.overflow = "hidden";
    drawerEl.hidden = false;
    overlayEl.hidden = false;
    setTimeout(() => drawerEl.classList.add("is-open"), 10);
    drawerEl.innerHTML = `<div class="quick-view-loading" style="padding:40px; text-align:center; color:var(--text-secondary);">Đang tải thông tin chi tiết...</div>`;

    try {
      const job = await window.api.get(`/jobs/${jobId}`);
      renderDrawer(job);
    } catch {
      drawerEl.innerHTML = `<div style="padding:32px; text-align:center;"><h2 style="font-size:18px; font-weight:700; margin-bottom:8px; color:var(--text);">Không tìm thấy tin</h2><p style="color:var(--text-secondary); margin-bottom:16px;">Tin tuyển dụng không tồn tại hoặc đã được gỡ bỏ.</p><button type="button" class="btn btn-outline" id="qv-close-err">Đóng</button></div>`;
      document.getElementById("qv-close-err")?.addEventListener("click", close);
      document.getElementById("qv-close-err")?.focus();
    }
  }

  function bindDrawerActions(j) {
    const applyBtn = drawerEl.querySelector("#jd-apply-btn");
    const saveBtn = drawerEl.querySelector("#jd-save-btn");
    const note = drawerEl.querySelector("#jd-action-note");
    const isAuth = window.Auth?.isAuthenticated?.();
    const role = window.Auth?.getRole?.();

    if (!isAuth) {
      if (note) note.textContent = "Ứng viên cần đăng nhập để nộp hồ sơ trực tuyến.";
      if (applyBtn) applyBtn.dataset.needsLogin = "1";
    } else if (role !== "candidate") {
      if (applyBtn) { applyBtn.disabled = true; applyBtn.textContent = "Chỉ ứng viên mới ứng tuyển được"; }
      if (note) note.textContent = "Tài khoản hiện tại không phải ứng viên.";
    } else if (j.applied) {
      if (applyBtn) { applyBtn.textContent = "Đã ứng tuyển"; applyBtn.dataset.applied = "1"; }
      if (note) note.textContent = "Bạn đã nộp hồ sơ cho vị trí này.";
    }

    applyBtn?.addEventListener("click", () => {
      if (applyBtn.dataset.needsLogin === "1") { window.location.href = loginUrl(window.location.pathname + window.location.search); return; }
      if (applyBtn.dataset.applied === "1") { window.location.href = appliedJobsUrl(); return; }
      openApplyModal(j, { triggerBtn: applyBtn });
    });

    saveBtn?.addEventListener("click", () => {
      toggleSave(j.id, saveBtn, {
        onToast: (msg, type) => showStatusToast(msg, type === "success" ? "success" : "danger"),
        onChanged: (_id, saved) => {
          saveBtn.classList.toggle("is-saved", Boolean(saved));
          saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
          const icon = saveBtn.querySelector(".jd-save-icon");
          if (icon) icon.textContent = saved ? "★" : "☆";
          const label = saveBtn.querySelector("#jd-save-label");
          if (label) label.textContent = saved ? "Đã lưu tin" : "Lưu tin";
        },
      });
    });
  }

  function renderDrawer(j) {
    drawerEl.innerHTML = `
      <div class="quick-view-header">
        <a href="${esc(jobDetailUrl(j.id))}" class="quick-view-open-link" target="_blank" rel="noopener">
          <span>Mở trang đầy đủ</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
        <button type="button" class="quick-view-close-btn" id="qv-close-btn" aria-label="Đóng xem nhanh">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="quick-view-body" id="qv-body">
        ${renderJobDetailContent(j, { isDrawer: true })}
      </div>
      <div class="quick-view-footer">
        ${renderActionBar(j)}
      </div>`;

    drawerEl.querySelector("#qv-close-btn")?.addEventListener("click", close);
    bindDrawerActions(j);
    const body = drawerEl.querySelector("#qv-body");
    if (body) body.scrollTop = 0;
    drawerEl.querySelector("#qv-close-btn")?.focus();
  }

  function handleKeydown(e) {
    if (drawerEl.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab") {
      const focusables = Array.from(drawerEl.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); stepJob(1); }
    else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); stepJob(-1); }
  }

  function stepJob(direction) {
    if (!currentList.length || !currentJobId) return;
    const idx = currentList.findIndex((it) => it.id === currentJobId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < currentList.length) open(currentList[nextIdx].id);
  }

  window.addEventListener("keydown", handleKeydown);

  return {
    setList(list) { currentList = list; },
    openJob(jobId) { open(jobId); },
    closeJob() { close(); },
    checkInitialUrl() {
      const urlJob = new URLSearchParams(window.location.search).get("job");
      if (urlJob && window.innerWidth >= 1280) open(Number(urlJob));
    },
  };
}
