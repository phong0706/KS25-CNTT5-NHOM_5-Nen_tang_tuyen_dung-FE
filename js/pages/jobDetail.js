/**
 * jobDetail.js - Điều phối trang chi tiết việc làm (/pages/job-detail.html?id=...).
 */
import { toggleSave } from "../components/jobCard.js";
import { openApplyModal } from "../components/applyModal.js";
import { showStatusToast } from "../components/toast.js";
import { appliedJobsUrl, loginUrl } from "../routes.js";
import { fetchCachedMeta } from "../utils/urlState.js";
import {
  cleanStr,
  renderCompanyCard,
  renderJobHeaderAndBody,
  renderRelatedFilters,
} from "./jobDetailView.js";

function renderApplyState(job) {
  const buttons = [document.getElementById("jd-apply-btn"), document.getElementById("jd-mobile-apply-btn")].filter(Boolean);
  const note = document.getElementById("jd-side-note");
  const authed = Boolean(window.Auth?.isAuthenticated?.());
  const role = window.Auth?.getRole?.();

  buttons.forEach((btn) => {
    btn.disabled = false;
    delete btn.dataset.needsLogin;
    delete btn.dataset.applied;
    btn.textContent = "Ứng tuyển";
  });

  if (job.applied) {
    buttons.forEach((btn) => {
      btn.textContent = "Đã ứng tuyển";
      btn.dataset.applied = "1";
    });
    if (note) {
      note.textContent = "Bạn đã nộp hồ sơ cho vị trí này. Bấm nút trên để xem lịch sử ứng tuyển.";
      note.hidden = false;
    }
    return;
  }

  if (!authed) {
    buttons.forEach((btn) => { btn.dataset.needsLogin = "1"; });
    if (note) {
      note.textContent = "Vui lòng đăng nhập bằng tài khoản ứng viên để nộp hồ sơ.";
      note.hidden = false;
    }
    return;
  }

  if (role !== "candidate") {
    buttons.forEach((btn) => {
      btn.disabled = true;
      btn.textContent = "Chỉ ứng viên mới ứng tuyển được";
    });
    if (note) {
      note.textContent = "Tài khoản của bạn không thuộc vai trò ứng viên nên chức năng ứng tuyển đang bị khóa.";
      note.hidden = false;
    }
    return;
  }

  if (note) {
    note.textContent = "";
    note.hidden = true;
  }
}

function renderSaveState(isSaved) {
  const saved = Boolean(isSaved);
  [
    ["jd-save-btn", "jd-save-label"],
    ["jd-mobile-save-btn", "jd-mobile-save-label"],
  ].forEach(([btnId, labelId]) => {
    const btn = document.getElementById(btnId);
    const label = document.getElementById(labelId);
    if (btn) {
      btn.classList.toggle("is-saved", saved);
      btn.setAttribute("aria-pressed", saved ? "true" : "false");
    }
    if (label) label.textContent = saved ? "Đã lưu tin" : "Lưu tin";
  });
}

function bindActions(job) {
  const handleApply = (btn) => {
    if (btn.disabled) return;
    if (btn.dataset.needsLogin === "1") {
      window.location.href = loginUrl(window.location.pathname + window.location.search);
      return;
    }
    if (btn.dataset.applied === "1") {
      window.location.href = appliedJobsUrl();
      return;
    }
    openApplyModal(job, {
      triggerBtn: btn,
      onSuccess: () => {
        job.applied = true;
        renderApplyState(job);
      },
    });
  };

  [document.getElementById("jd-apply-btn"), document.getElementById("jd-mobile-apply-btn")]
    .filter(Boolean)
    .forEach((btn) => btn.addEventListener("click", () => handleApply(btn)));

  [document.getElementById("jd-save-btn"), document.getElementById("jd-mobile-save-btn")]
    .filter(Boolean)
    .forEach((btn) => btn.addEventListener("click", () => {
      toggleSave(job.id, btn, {
        onToast: (msg, type) => showStatusToast(msg, type === "success" ? "success" : "danger"),
        onChanged: (_id, saved) => renderSaveState(saved),
      });
    }));
}

async function hydrateSideDetails(job) {
  const slug = cleanStr(job.company_slug);
  const [compRes, catRes, locRes] = await Promise.allSettled([
    slug ? window.api.get(`/companies/${encodeURIComponent(slug)}`) : Promise.resolve(null),
    fetchCachedMeta("/meta/categories"),
    fetchCachedMeta("/meta/locations"),
  ]);
  if (compRes.status === "fulfilled" && compRes.value) {
    renderCompanyCard(job, compRes.value);
  }
  const categories = catRes.status === "fulfilled" && Array.isArray(catRes.value) ? catRes.value : [];
  const locations = locRes.status === "fulfilled" && Array.isArray(locRes.value) ? locRes.value : [];
  renderRelatedFilters(job, categories, locations);
}

function showError(message) {
  document.getElementById("jd-loading")?.setAttribute("hidden", "");
  document.getElementById("jd-mobile-bar")?.setAttribute("hidden", "");
  document.getElementById("jd-error")?.removeAttribute("hidden");
  const msgEl = document.getElementById("jd-error-msg");
  if (msgEl) msgEl.textContent = message || "Tin tuyển dụng này có thể đã được gỡ bỏ hoặc chưa được công bố.";
}

async function init() {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  if (!id || id <= 0) {
    showError("Thiếu mã tin tuyển dụng trên đường dẫn.");
    return;
  }
  try {
    const job = await window.api.get(`/jobs/${id}`);
    renderJobHeaderAndBody(job);
    renderApplyState(job);
    renderSaveState(Boolean(job.is_saved));
    bindActions(job);
    document.getElementById("jd-loading")?.setAttribute("hidden", "");
    document.getElementById("jd-content")?.removeAttribute("hidden");
    document.getElementById("jd-mobile-bar")?.removeAttribute("hidden");
    hydrateSideDetails(job);
  } catch (err) {
    showError(err?.message);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
