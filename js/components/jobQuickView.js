/**
 * Panel xem chi tiết việc làm trên trang danh sách (?job=<id>) (< 190 dòng).
 * Desktop: drawer 40% bên phải có nền mờ; Mobile: toàn màn hình với thanh ứng tuyển đáy.
 */
import { formatSalary, renderCompanyLogo } from "./jobCard.js";
import { jobDetailUrl, jobsUrl } from "../routes.js";
import { bindSharedJobActions, cleanJobProse, cleanStr, formatDateVi, renderSharedJobContent } from "../pages/jobDetailView.js";

const CLOSE_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const FOCUSABLE_SEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initJobQuickView({ onSaveChanged, onOpen, onClose } = {}) {
  let drawerEl = document.getElementById("job-quick-view-drawer"), overlayEl = document.getElementById("job-quick-view-overlay");
  let currentJobId = null, lastTriggerEl = null;

  if (!drawerEl) {
    overlayEl = Object.assign(document.createElement("div"), { id: "job-quick-view-overlay", className: "quick-view-overlay", hidden: true });
    overlayEl.setAttribute("aria-hidden", "true");
    drawerEl = Object.assign(document.createElement("div"), { id: "job-quick-view-drawer", className: "quick-view-drawer", hidden: true });
    drawerEl.setAttribute("role", "dialog"); drawerEl.setAttribute("aria-modal", "true"); drawerEl.setAttribute("aria-labelledby", "qv-title");
    document.body.append(overlayEl, drawerEl);
  }

  const findCardTarget = (id) => (id ? document.querySelector(`.job-grid-card[data-job-id="${id}"]`) : null)?.querySelector(".job-title-link") || null;
  const focusTitle = () => {
    const t = document.getElementById("qv-title");
    if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }
  };

  function close({ fromPopstate = false, restoreFocus = true } = {}) {
    if (drawerEl.hidden && !currentJobId) return;
    const closedId = currentJobId;
    const target = restoreFocus ? ((lastTriggerEl && document.contains(lastTriggerEl) ? lastTriggerEl : null) || findCardTarget(closedId)) : null;
    drawerEl.classList.remove("is-open"); drawerEl.hidden = true; overlayEl.hidden = true;
    document.body.classList.remove("qv-open");
    currentJobId = null; lastTriggerEl = null;
    if (!fromPopstate) {
      const url = new URL(window.location.href);
      if (url.searchParams.has("job")) { url.searchParams.delete("job"); window.history.replaceState(null, "", url.toString()); }
    }
    onClose?.();
    target?.focus?.({ preventScroll: true });
  }

  overlayEl.addEventListener("click", () => close());

  async function open(jobId, { triggerEl = null, pushHistory = true } = {}) {
    const idNum = Number(jobId);
    if (!idNum || idNum <= 0) return;
    currentJobId = idNum; onOpen?.(idNum); lastTriggerEl = triggerEl || lastTriggerEl || findCardTarget(idNum);
    if (pushHistory) {
      const url = new URL(window.location.href);
      if (url.searchParams.get("job") !== String(idNum)) { url.searchParams.set("job", String(idNum)); window.history.pushState({ quickViewJobId: idNum }, "", url.toString()); }
    }
    overlayEl.hidden = false; drawerEl.hidden = false; document.body.classList.add("qv-open");
    void drawerEl.offsetWidth; drawerEl.classList.add("is-open");
    drawerEl.innerHTML = `<div class="quick-view-header"><div class="quick-view-header-main"><div class="quick-view-header-text"><h2 class="quick-view-title" id="qv-title">Đang tải...</h2></div></div><button type="button" class="quick-view-close-btn" id="qv-close-btn" aria-label="Đóng">${CLOSE_ICON}</button></div><div class="quick-view-body"><p class="quick-view-loading">Đang tải thông tin chi tiết...</p></div>`;
    document.getElementById("qv-close-btn")?.addEventListener("click", () => close());
    focusTitle();

    try {
      const job = await window.api.get(`/jobs/${idNum}`);
      if (currentJobId === idNum && !drawerEl.hidden) { renderDrawer(job); focusTitle(); }
    } catch {
      if (currentJobId !== idNum || drawerEl.hidden) return;
      drawerEl.innerHTML = `<div class="quick-view-header"><div class="quick-view-header-main"><div class="quick-view-header-text"><h2 class="quick-view-title" id="qv-title">Không thể tải tin tuyển dụng</h2></div></div><button type="button" class="quick-view-close-btn" id="qv-close-btn" aria-label="Đóng">${CLOSE_ICON}</button></div><div class="quick-view-body"><p class="quick-view-error">Tin không tồn tại hoặc đã ngừng hiển thị.</p><button type="button" class="btn btn-outline" id="qv-close-err">Đóng</button></div>`;
      document.getElementById("qv-close-btn")?.addEventListener("click", () => close());
      document.getElementById("qv-close-err")?.addEventListener("click", () => close());
      focusTitle();
    }
  }

  function renderDrawer(j) {
    const sal = (j.salary_min || j.salary_max || j.is_salary_negotiable) ? formatSalary(j) : "";
    const lvlRaw = cleanStr(j.level), lvlVal = lvlRaw && lvlRaw !== "Tất cả" ? lvlRaw : "";
    const expVal = cleanStr(j.experience || j.experience_level);
    const deadlineVal = formatDateVi(j.deadline), pubVal = formatDateVi(j.published_at || j.created_at);
    const hasDesc = Boolean(cleanJobProse(j.description)), hasReq = Boolean(cleanJobProse(j.requirements));

    drawerEl.innerHTML = `
      <div class="quick-view-header">
        <div class="quick-view-header-main">
          <div class="quick-view-logo" id="qv-logo"></div>
          <div class="quick-view-header-text">
            <h2 class="quick-view-title" id="qv-title"></h2>
            <p class="quick-view-company" id="qv-company"></p>
          </div>
        </div>
        <button type="button" class="quick-view-close-btn" id="qv-close-btn" aria-label="Đóng">${CLOSE_ICON}</button>
      </div>
      <div class="quick-view-body">
        <div class="quick-view-meta-grid" id="qv-meta-grid">
          <div class="quick-view-meta-item" id="qv-meta-salary"><span class="quick-view-meta-label">Mức lương</span><strong class="quick-view-meta-value" id="qv-val-salary"></strong></div>
          <div class="quick-view-meta-item" id="qv-meta-location"><span class="quick-view-meta-label">Địa điểm</span><strong class="quick-view-meta-value" id="qv-val-location"></strong></div>
          <div class="quick-view-meta-item" id="qv-meta-exp"><span class="quick-view-meta-label">Kinh nghiệm</span><strong class="quick-view-meta-value" id="qv-val-exp"></strong></div>
          <div class="quick-view-meta-item" id="qv-meta-deadline"><span class="quick-view-meta-label">Hạn ứng tuyển</span><strong class="quick-view-meta-value" id="qv-val-deadline"></strong></div>
        </div>
        <section class="quick-view-section" id="qv-sec-skills" aria-labelledby="qv-h-skills" hidden><h3 class="quick-view-section-title" id="qv-h-skills">Kỹ năng</h3><div class="quick-view-skills-wrap" id="qv-skills"></div></section>
        <section class="quick-view-section" id="qv-sec-desc" aria-labelledby="qv-h-desc"><h3 class="quick-view-section-title" id="qv-h-desc">Mô tả công việc</h3><div class="quick-view-text quick-view-desc-clamp" id="qv-desc"></div><button type="button" class="btn-link quick-view-more-btn" id="qv-desc-toggle" hidden>Xem thêm</button><p class="quick-view-empty-desc" id="qv-empty-desc" hidden>Nhà tuyển dụng chưa cập nhật mô tả.</p></section>
        <section class="quick-view-section" id="qv-sec-req" aria-labelledby="qv-h-req"><h3 class="quick-view-section-title" id="qv-h-req">Yêu cầu ứng viên</h3><div class="quick-view-text" id="qv-req"></div></section>
        <section class="quick-view-section" id="qv-sec-ben" aria-labelledby="qv-h-ben"><h3 class="quick-view-section-title" id="qv-h-ben">Quyền lợi</h3><div class="quick-view-text" id="qv-ben"></div></section>
        <section class="quick-view-section quick-view-general-info" id="qv-sec-general"><h3 class="quick-view-section-title">Thông tin chung</h3><div class="quick-view-fact-list" id="qv-facts"></div></section>
      </div>
      <div class="quick-view-footer">
        <button type="button" class="btn btn-primary quick-view-apply-btn" id="qv-apply-btn">Ứng tuyển ngay</button>
        <p class="quick-view-lock-note" id="qv-apply-note" aria-live="polite" hidden></p>
        <div class="quick-view-secondary-actions">
          <a href="${jobDetailUrl(j.id)}" class="btn btn-outline quick-view-detail-link" id="qv-detail-link">Xem trang đầy đủ</a>
          <button type="button" class="btn btn-outline quick-view-save-btn" id="qv-save-btn" aria-pressed="false"><span id="qv-save-label">Lưu tin</span></button>
        </div>
      </div>`;
    const $id = (id) => document.getElementById(id);
    $id("qv-logo")?.replaceChildren(renderCompanyLogo({ name: j.company_name, logo_url: j.company_logo }, "md"));

    renderSharedJobContent(j, {
      titleEl: $id("qv-title"), companyEl: $id("qv-company"), quickGridEl: $id("qv-meta-grid"),
      quickItems: [[$id("qv-meta-salary"), $id("qv-val-salary"), sal], [$id("qv-meta-location"), $id("qv-val-location"), j.location], [$id("qv-meta-exp"), $id("qv-val-exp"), expVal], [$id("qv-meta-deadline"), $id("qv-val-deadline"), deadlineVal]],
      sections: [[$id("qv-sec-desc"), $id("qv-desc"), j.description], [$id("qv-sec-req"), $id("qv-req"), j.requirements], [$id("qv-sec-ben"), $id("qv-ben"), j.benefits]],
    });

    $id("qv-sec-desc").hidden = false;
    $id("qv-desc").hidden = !hasDesc;
    $id("qv-empty-desc").hidden = hasDesc;

    const descEl = $id("qv-desc"), toggleBtn = $id("qv-desc-toggle");
    if (descEl && toggleBtn && hasDesc) {
      requestAnimationFrame(() => {
        if (descEl.scrollHeight > descEl.clientHeight + 6) {
          toggleBtn.hidden = false;
          toggleBtn.onclick = () => { toggleBtn.textContent = descEl.classList.toggle("is-expanded") ? "Thu gọn" : "Xem thêm"; };
        }
      });
    }

    const skills = Array.isArray(j.skills) ? j.skills.map(cleanStr).filter(Boolean) : [];
    if (skills.length) {
      $id("qv-sec-skills").hidden = false;
      $id("qv-skills").innerHTML = skills.map((s) => `<a href="${jobsUrl({ skills: s })}" class="quick-view-skill-tag">${s}</a>`).join("");
    }

    const wt = cleanStr(j.work_type || j.type), et = cleanStr(j.employment_type || j.job_type);
    const factRows = [];
    if (wt && et && wt.toLowerCase() === et.toLowerCase()) factRows.push(["Hình thức / Loại hình", wt]);
    else { if (wt) factRows.push(["Hình thức làm việc", wt]); if (et) factRows.push(["Loại hình làm việc", et]); }
    if (lvlVal) factRows.push(["Cấp bậc", lvlVal]);
    if (pubVal) factRows.push(["Ngày đăng", pubVal]);

    if (factRows.length) {
      $id("qv-facts").innerHTML = factRows.map(([lbl, v]) => `<div class="quick-view-fact-item"><span class="quick-view-fact-label">${lbl}:</span> <strong>${v}</strong></div>`).join("");
    } else $id("qv-sec-general").hidden = true;

    bindSharedJobActions(j, {
      applyBtns: [$id("qv-apply-btn")], saveBtns: [$id("qv-save-btn")], saveLabels: [$id("qv-save-label")],
      noteEl: $id("qv-apply-note"), primaryLabel: "Ứng tuyển ngay", onSaveChanged: (saved) => onSaveChanged?.(j.id, saved),
    });
    $id("qv-close-btn")?.addEventListener("click", () => close());
  }

  function handleKeydown(e) {
    if (drawerEl.hidden || document.querySelector(".apply-modal-backdrop")) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const focusables = [...drawerEl.querySelectorAll(FOCUSABLE_SEL)].filter((n) => n.offsetParent !== null);
    if (!focusables.length) { e.preventDefault(); focusTitle(); return; }
    const first = focusables[0], last = focusables[focusables.length - 1], active = document.activeElement;
    if (!focusables.includes(active)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  function syncWithUrl() {
    const idNum = Number(new URLSearchParams(window.location.search).get("job"));
    if (idNum > 0) { if (currentJobId !== idNum || drawerEl.hidden) open(idNum, { pushHistory: false }); }
    else if (!drawerEl.hidden) close({ fromPopstate: true });
  }

  window.addEventListener("keydown", handleKeydown);
  return {
    getCurrentJobId() { return currentJobId; },
    setList() {},
    openJob(jobId, triggerEl = null) { open(jobId, { triggerEl, pushHistory: true }); },
    closeJob(opts) { close(opts); },
    syncWithUrl,
    checkInitialUrl() {
      const idNum = Number(new URLSearchParams(window.location.search).get("job"));
      if (!idNum || idNum <= 0) return;
      const targetUrl = window.location.href, base = new URL(targetUrl); base.searchParams.delete("job");
      window.history.replaceState(null, "", base.toString());
      window.history.pushState({ quickViewJobId: idNum }, "", targetUrl);
      open(idNum, { pushHistory: false });
    },
  };
}