/**
 * jobDetail.js - Trang chi tiết việc làm (/pages/job-detail.html?id=...)
 * Sử dụng renderJobDetailContent dùng chung, xử lý hành động ứng tuyển/lưu tin và việc liên quan.
 * Tuân thủ techrecruit-rules: < 190 dòng.
 */
import { renderJobDetailContent } from "../components/jobDetailRenderer.js";
import { renderCompanyLogo } from "../components/companyLogo.js";
import { formatSalary, toggleSave } from "../components/jobCard.js";
import { openApplyModal } from "../components/applyModal.js";
import { showStatusToast } from "../components/toast.js";
import { jobDetailUrl, appliedJobsUrl, loginUrl } from "../routes.js";

function esc(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function bindExpander() {
  const content = document.getElementById("jd-desc-content");
  const btn = document.getElementById("jd-desc-expand");
  if (!content || !btn) return;
  if (content.scrollHeight > 185) {
    btn.hidden = false;
    btn.addEventListener("click", () => {
      const isExp = content.classList.toggle("is-expanded");
      btn.textContent = isExp ? "Thu gọn" : "Xem thêm";
      btn.setAttribute("aria-expanded", isExp ? "true" : "false");
    });
  }
}

function bindActions(job) {
  const applyBtn = document.getElementById("jd-apply-btn");
  const note = document.getElementById("jd-action-note");
  const role = window.Auth?.getRole?.();

  if (!window.Auth?.isAuthenticated?.()) {
    if (note) note.textContent = "Ứng viên cần đăng nhập để nộp hồ sơ trực tuyến.";
    if (applyBtn) applyBtn.dataset.needsLogin = "1";
  } else if (role !== "candidate") {
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.textContent = "Chỉ ứng viên mới ứng tuyển được";
    }
    if (note) note.textContent = "Tài khoản hiện tại không phải ứng viên.";
  } else if (job.applied) {
    if (applyBtn) {
      applyBtn.textContent = "Đã ứng tuyển";
      applyBtn.dataset.applied = "1";
    }
    if (note) note.textContent = "Bạn đã nộp hồ sơ cho vị trí này.";
  } else {
    if (note) note.textContent = "Ứng tuyển nhanh chóng chỉ mất khoảng 2 phút.";
  }

  applyBtn?.addEventListener("click", () => {
    if (applyBtn.dataset.needsLogin === "1") {
      const here = window.location.pathname + window.location.search;
      window.location.href = loginUrl(here);
      return;
    }
    if (applyBtn.dataset.applied === "1") {
      window.location.href = appliedJobsUrl();
      return;
    }
    openApplyModal(job, { triggerBtn: applyBtn });
  });

  const saveBtn = document.getElementById("jd-save-btn");
  const saveLabel = document.getElementById("jd-save-label");
  saveBtn?.addEventListener("click", () => {
    toggleSave(job.id, saveBtn, {
      onToast: (msg, type) => showStatusToast(msg, type === "success" ? "success" : "danger"),
      onChanged: (_id, saved) => {
        saveBtn.classList.toggle("is-saved", Boolean(saved));
        saveBtn.setAttribute("aria-pressed", saved ? "true" : "false");
        const icon = saveBtn.querySelector(".jd-save-icon");
        if (icon) icon.textContent = saved ? "★" : "☆";
        if (saveLabel) saveLabel.textContent = saved ? "Đã lưu tin" : "Lưu tin";
      },
    });
  });
}

async function loadRelatedJobs(job) {
  const sec = document.getElementById("jd-related-section");
  const grid = document.getElementById("jd-related-grid");
  if (!sec || !grid) return;

  try {
    const params = { page_size: 8, sort: "newest" };
    if (job.category_id) params.category_id = job.category_id;
    const res = await window.api.get("/jobs", params);
    const items = (res.items || [])
      .filter((j) => j.id !== job.id && !/(mmmmmm|test\b)/i.test(j.title))
      .slice(0, 4);

    if (!items.length) {
      sec.hidden = true;
      return;
    }

    grid.innerHTML = items.map((j) => {
      const cleanTitle = (j.title || "").replace("[Seed]", "").trim();
      const compLogo = renderCompanyLogo({ name: j.company_name, logo_url: j.company_logo }, { size: 44 });
      return `
        <a href="${esc(jobDetailUrl(j.id))}" class="jd-rel-card" title="${esc(cleanTitle)}">
          <div style="flex-shrink:0;">${compLogo}</div>
          <div class="jd-rel-info">
            <span class="jd-rel-title">${esc(cleanTitle)}</span>
            <span class="jd-rel-comp" title="${esc(j.company_name || 'Doanh nghiệp')}">${esc(j.company_name || "Doanh nghiệp")}</span>
            <span class="jd-rel-sal">${esc(formatSalary(j))}</span>
          </div>
        </a>
      `;
    }).join("");
    sec.hidden = false;
  } catch {
    sec.hidden = true;
  }
}

function showError(msg) {
  document.getElementById("jd-loading")?.setAttribute("hidden", "");
  const errBox = document.getElementById("jd-error");
  if (errBox) errBox.removeAttribute("hidden");
  const msgEl = document.getElementById("jd-error-msg");
  if (msgEl) msgEl.textContent = msg || "Tin tuyển dụng này có thể đã được gỡ bỏ.";
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get("id") || params.get("job");
  const id = Number(rawId);

  // Chuẩn hóa URL sang ?id= nếu đang vào bằng ?job=
  if (params.has("job") && !params.has("id") && id > 0) {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("job");
    newUrl.searchParams.set("id", String(id));
    window.history.replaceState(null, "", newUrl.toString());
  }

  if (!id || id <= 0) {
    showError("Thiếu mã tin tuyển dụng trên đường dẫn.");
    return;
  }

  try {
    const job = await window.api.get(`/jobs/${id}`);
    document.title = `${job.title} | TechRecruit`;
    const crumb = document.getElementById("jd-crumb-title");
    if (crumb) crumb.textContent = job.title;

    const host = document.getElementById("jd-content");
    if (host) {
      host.innerHTML = renderJobDetailContent(job);
      host.removeAttribute("hidden");
    }
    document.getElementById("jd-loading")?.setAttribute("hidden", "");

    bindExpander();
    bindActions(job);
    await loadRelatedJobs(job);
  } catch (err) {
    showError(err?.message || "Tin tuyển dụng không tồn tại hoặc đã hết hạn.");
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
