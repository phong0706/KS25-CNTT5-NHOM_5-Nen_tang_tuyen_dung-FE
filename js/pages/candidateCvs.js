/**
 * candidateCvs.js - Quản lý và Tải lên CV cho Ứng viên TechRecruit.
 * Tuân thủ techrecruit-rules: <= 200 dòng, không alert/confirm, accessibility WAI-ARIA.
 */
import { CvUploader } from "../components/cvUploader.js";
import { showToast } from "../components/toast.js";
import { promptRenameCv, promptDeleteCv, showBlockedDeleteCv, openOrDownloadCv } from "../components/cvActionModal.js";
import { loginUrl, forbiddenUrl, hydrateDataRoutes } from "../routes.js";

const MAX_CVS = 5;
let cvs = [];

const esc = (s) => { const d = document.createElement("div"); d.textContent = s || ""; return d.innerHTML; };

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 KB";
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
}

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");

function closeAllDropdowns() {
  document.querySelectorAll(".cv-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
  document.querySelectorAll(".cv-btn-kebab[aria-expanded='true']").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

function renderCvCard(cv) {
  const isPdf = (cv.mime_type || cv.mime || "").includes("pdf");
  const isDoc = (cv.mime_type || cv.mime || "").includes("word") || (cv.mime_type || cv.mime || "").includes("msword");
  const iconClass = isPdf ? "is-pdf" : isDoc ? "is-doc" : "is-pdf";
  const iconText = isPdf ? "PDF" : "DOC";

  const usageHtml = cv.used_count > 0
    ? `<span class="cv-tag-used"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> Đang dùng trong ${cv.used_count} hồ sơ</span>`
    : `<span class="cv-tag-unused">Chưa dùng trong hồ sơ nào</span>`;

  return `
    <article class="cv-card ${cv.is_default ? "is-default" : ""}" data-cv-id="${cv.id}">
      <div class="cv-card-top">
        <div class="cv-file-icon ${iconClass}" aria-hidden="true"><span style="font-size:0.6875rem; font-weight:800;">${iconText}</span></div>
        <div class="cv-card-meta">
          <div class="cv-name-row">
            <h2 class="cv-card-name" title="${esc(cv.original_name)}">${esc(cv.original_name)}</h2>
            ${cv.is_default ? `<span class="cv-badge-def">Mặc định</span>` : ""}
          </div>
          <div class="cv-sub-meta">
            <span>${formatBytes(cv.size_bytes || cv.size)}</span><span>&bull;</span><span>Tải lên: ${formatDate(cv.created_at || cv.uploaded_at)}</span>
          </div>
        </div>
      </div>
      <div class="cv-card-usage">${usageHtml}</div>
      <div class="cv-card-actions">
        <button type="button" class="cv-btn-view" data-action="view" aria-label="Xem tệp ${esc(cv.original_name)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <span>${isPdf ? "Xem file" : "Tải về"}</span>
        </button>
        <div class="cv-menu-wrap">
          <button type="button" class="cv-btn-kebab" data-action="toggle-menu" aria-label="Tùy chọn cho CV ${esc(cv.original_name)}" aria-haspopup="true" aria-expanded="false">&ctdot;</button>
          <div class="cv-dropdown" role="menu">
            ${!cv.is_default ? `<button type="button" class="cv-dropdown-item" data-action="set-default" role="menuitem"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Đặt mặc định</button>` : ""}
            <button type="button" class="cv-dropdown-item" data-action="rename" role="menuitem"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Đổi tên</button>
            <button type="button" class="cv-dropdown-item is-danger" data-action="delete" role="menuitem"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Xóa CV</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function bindCardEvents(container) {
  container.querySelectorAll(".cv-card").forEach((card) => {
    const cvId = Number(card.dataset.cvId);
    const cv = cvs.find((c) => c.id === cvId);
    if (!cv) return;

    card.querySelector('[data-action="view"]')?.addEventListener("click", () => openOrDownloadCv(cv, showToast));
    const kebabBtn = card.querySelector('[data-action="toggle-menu"]');
    const dropdown = card.querySelector(".cv-dropdown");

    kebabBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains("is-open");
      closeAllDropdowns();
      if (!isOpen) { dropdown.classList.add("is-open"); kebabBtn.setAttribute("aria-expanded", "true"); }
    });

    card.querySelector('[data-action="set-default"]')?.addEventListener("click", async () => {
      closeAllDropdowns();
      try {
        await window.api.post(`/candidate/cvs/${cv.id}/default`);
        showToast("Đã đặt làm CV mặc định!", "success");
        await loadCvs();
      } catch (err) { showToast(err.message || "Không thể đặt mặc định", "error"); }
    });

    card.querySelector('[data-action="rename"]')?.addEventListener("click", () => {
      closeAllDropdowns();
      promptRenameCv(cv, async (newName) => {
        try {
          await window.api.patch(`/candidate/cvs/${cv.id}`, { name: newName });
          showToast("Đổi tên CV thành công!", "success");
          await loadCvs();
        } catch (err) { showToast(err.message || "Không thể đổi tên CV", "error"); throw err; }
      }, kebabBtn);
    });

    card.querySelector('[data-action="delete"]')?.addEventListener("click", () => {
      closeAllDropdowns();
      promptDeleteCv(cv, async () => {
        try {
          await window.api.delete(`/candidate/cvs/${cv.id}`);
          showToast("Đã xóa CV thành công!", "success");
          await loadCvs();
          return true;
        } catch (err) {
          const detail = err.response?.data?.detail || err.data?.detail || err.detail;
          const msg = typeof detail === "string" ? detail : (detail?.message || err.message || "Không thể xóa CV");
          showToast(msg, "error");
          throw err;
        }
      }, kebabBtn);
    });
  });
}

function render() {
  const countEl = document.getElementById("cvs-count-badge");
  const maxAlert = document.getElementById("cvs-max-alert");
  const uploadSec = document.getElementById("cvs-upload-section");
  const gridEl = document.getElementById("cvs-grid-container");

  const count = cvs.length;
  if (countEl) {
    countEl.textContent = `${count}/${MAX_CVS} CV đã tải lên`;
    countEl.classList.toggle("is-max", count >= MAX_CVS);
  }
  if (maxAlert) maxAlert.hidden = count < MAX_CVS;
  if (uploadSec) uploadSec.style.display = count >= MAX_CVS ? "none" : "block";

  if (!gridEl) return;
  if (count === 0) {
    gridEl.innerHTML = `
      <div class="cvs-empty">
        <div class="cvs-empty-icon" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
        <h2 class="cvs-empty-title">Bạn chưa có CV nào</h2>
        <p class="cvs-empty-desc">Tải lên file PDF, DOC hoặc DOCX (tối đa 5MB) để sẵn sàng nộp hồ sơ vào các vị trí công nghệ mơ ước.</p>
      </div>`;
    return;
  }
  gridEl.innerHTML = `<div class="cvs-grid">${cvs.map(renderCvCard).join("")}</div>`;
  bindCardEvents(gridEl);
}

async function loadCvs() {
  try {
    const res = await window.api.get("/candidate/cvs");
    cvs = Array.isArray(res) ? res : [];
    render();
  } catch (err) { showToast(err.message || "Không thể tải danh sách CV", "error"); }
}

document.addEventListener("DOMContentLoaded", async () => {
  hydrateDataRoutes(document);
  if (!window.Auth?.isAuthenticated?.()) { window.location.href = loginUrl(window.location.pathname + window.location.search); return; }
  if (window.Auth?.getRole?.() !== "candidate") { window.location.href = forbiddenUrl(); return; }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".cv-menu-wrap")) closeAllDropdowns();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openDrop = document.querySelector(".cv-dropdown.is-open");
      const btn = openDrop?.closest(".cv-menu-wrap")?.querySelector(".cv-btn-kebab");
      closeAllDropdowns();
      btn?.focus();
    }
  });

  const uploadMount = document.getElementById("cv-uploader-mount");
  if (uploadMount) {
    new CvUploader({
      container: uploadMount,
      onUploaded: async () => { showToast("Tải lên CV thành công!", "success"); await loadCvs(); },
      onError: (msg) => { if (msg) showToast(msg, "error"); },
    });
  }
  await loadCvs();

  const params = new URLSearchParams(window.location.search);
  if (params.get("upload") === "1" || params.get("upload") === "true") {
    const uploadBox = document.getElementById("cv-drop-zone");
    uploadBox?.scrollIntoView({ behavior: "smooth", block: "center" });
    uploadBox?.focus();
    setTimeout(() => document.getElementById("cv-file-input")?.click(), 300);
  }
});
