/**
 * jobDetail.js - Logic trang chi tiết việc làm (/pages/job-detail.html?id=...)
 * Xử lý sticky nav, chuyển tab, hành động ứng tuyển/lưu tin đồng bộ, nạp việc liên quan.
 * Tuân thủ techrecruit-rules: <= 200 dòng.
 */
import { renderJobDetailContent } from "../components/jobDetailRenderer.js";
import { renderCompanyLogo } from "../components/companyLogo.js";
import { formatSalary, toggleSave } from "../components/jobCard.js";
import { openApplyModal } from "../components/applyModal.js";
import { showStatusToast } from "../components/toast.js";
import { jobDetailUrl, appliedJobsUrl, loginUrl } from "../routes.js";

function esc(val) {
  const div = document.createElement("div");
  div.textContent = val ?? "";
  return div.innerHTML;
}

function bindExpander() {
  const content = document.getElementById("jd-desc-content");
  const btn = document.getElementById("jd-desc-expand");
  if (!content || !btn || content.scrollHeight <= 200) return;
  btn.hidden = false;
  btn.addEventListener("click", () => {
    const isExp = content.classList.toggle("is-expanded");
    btn.textContent = isExp ? "Thu gọn" : "Xem thêm";
    btn.setAttribute("aria-expanded", isExp ? "true" : "false");
  });
}

function bindStickyNav() {
  const hero = document.getElementById("jd-hero-block");
  const stickyActions = document.getElementById("jd-sticky-actions");
  if (hero && stickyActions && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { stickyActions.hidden = e.isIntersecting; }, { threshold: 0.1 }).observe(hero);
  }
  const tabDetail = document.getElementById("tab-detail"), tabRelated = document.getElementById("tab-related");
  const setTab = (activeTab, targetId) => {
    [tabDetail, tabRelated].forEach((t) => {
      if (!t) return;
      const isA = t === activeTab;
      t.classList.toggle("is-active", isA);
      t.setAttribute("aria-selected", isA ? "true" : "false");
    });
    const target = document.querySelector(targetId);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  tabDetail?.addEventListener("click", () => setTab(tabDetail, "#jd-detail-section"));
  tabRelated?.addEventListener("click", () => setTab(tabRelated, "#jd-related-card"));
}

function bindActions(job) {
  const applyBtns = [
    document.getElementById("jd-apply-btn"),
    document.getElementById("jd-sticky-apply-btn"),
    document.getElementById("jd-mobile-apply-btn"),
  ].filter(Boolean);
  const note = document.getElementById("jd-action-note");
  const role = window.Auth?.getRole?.();

  const updateApplyText = (text, disabled = false) => {
    applyBtns.forEach((b) => { b.textContent = text; b.disabled = disabled; });
  };

  if (!window.Auth?.isAuthenticated?.()) {
    if (note) note.textContent = "Ứng viên cần đăng nhập để nộp hồ sơ trực tuyến.";
    applyBtns.forEach((b) => (b.dataset.needsLogin = "1"));
  } else if (role !== "candidate") {
    updateApplyText("Chỉ ứng viên mới ứng tuyển được", true);
    if (note) note.textContent = "Tài khoản hiện tại không phải ứng viên.";
  } else if (job.applied) {
    updateApplyText("Đã ứng tuyển", false);
    applyBtns.forEach((b) => (b.dataset.applied = "1"));
    if (note) note.textContent = "Bạn đã nộp hồ sơ cho vị trí này.";
  }

  applyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
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
          updateApplyText("Đã ứng tuyển", false);
          applyBtns.forEach((b) => (b.dataset.applied = "1"));
          if (note) note.textContent = "Bạn đã nộp hồ sơ cho vị trí này.";
        },
      });
    });
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
  const card = document.getElementById("jd-related-card");
  const list = document.getElementById("jd-related-grid");
  if (!card || !list) return;

  try {
    const params = { page_size: 10, sort: "newest" };
    if (job.category_id) params.category_id = job.category_id;
    const res = await window.api.get("/jobs", params);
    const items = (res.items || [])
      .filter((j) => j.id !== job.id && !/(^test\b|\btest$|(.)\2{4,})/i.test(j.title || ""))
      .slice(0, 4);

    if (!items.length) { card.hidden = true; return; }

    list.innerHTML = items.map((j) => {
      const cleanTitle = (j.title || "").replace("[Seed]", "").trim();
      const compLogo = renderCompanyLogo({ name: j.company_name, logo_url: j.company_logo }, { size: 44, className: "jd-rel-logo" });
      return `
        <a href="${esc(jobDetailUrl(j.id))}" class="jd-rel-item" role="listitem" title="${esc(cleanTitle)}">
          <div class="jd-rel-logo-box">${compLogo}</div>
          <div class="jd-rel-body">
            <h4 class="jd-rel-title">${esc(cleanTitle)}</h4>
            <span class="jd-rel-comp" title="${esc(j.company_name || 'Doanh nghiệp')}">${esc(j.company_name || "Doanh nghiệp")}</span>
            <span class="jd-rel-sal">${esc(formatSalary(j))}</span>
          </div>
        </a>`;
    }).join("");
    card.hidden = false;
  } catch {
    card.hidden = true;
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
    bindStickyNav();
    bindActions(job);
    await loadRelatedJobs(job);
  } catch (err) {
    showError(err?.message || "Tin tuyển dụng không tồn tại hoặc đã hết hạn.");
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
