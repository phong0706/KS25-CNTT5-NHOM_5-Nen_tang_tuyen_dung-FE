/**
 * applyModal.js - Popup ứng tuyển: chọn/tải CV, thư giới thiệu, kết quả (WAI-ARIA).
 * Giới hạn: < 200 dòng.
 */
import { CvPicker } from "./cvPicker.js";
import { CvUploader } from "./cvUploader.js";
import { CoverLetterField } from "./coverLetterField.js";
import { openConfirmModal } from "./confirmModal.js";
import { getCompanyLogo, formatSalary } from "./jobCard.js";
import { showStatusToast } from "./toast.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

export function openApplyModal(job, { triggerBtn, onSuccess } = {}) {
  const returnFocus = triggerBtn || document.activeElement;
  if (!Auth.isAuthenticated()) {
    const here = window.location.pathname + window.location.search;
    sessionStorage.setItem("auto_apply_job_id", String(job.id));
    window.location.href = `../pages/login.html?redirect=${encodeURIComponent(here)}`;
    return;
  }
  if (Auth.getRole() !== "candidate") {
    showStatusToast("Chỉ tài khoản Ứng viên mới có thể nộp hồ sơ ứng tuyển.", "danger");
    return;
  }

  const backdrop = document.createElement("div");
  backdrop.className = "apply-modal-backdrop";
  const titleId = `apply-title-${job.id}`;
  backdrop.innerHTML = `
    <div class="apply-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      <div class="apply-modal-header">
        <div class="apply-job-compact">
          ${getCompanyLogo(job.company_name, "cv-logo-48")}
          <div class="apply-job-text">
            <h2 id="${titleId}" class="apply-job-title">${esc(job.title)}</h2>
            <div class="apply-job-meta">
              <span>${esc(job.company_name || "")}</span><span class="meta-dot">·</span>
              <span class="apply-job-salary">${esc(formatSalary(job))}</span>
            </div>
          </div>
        </div>
        <button type="button" class="apply-modal-close" aria-label="Đóng popup">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="apply-modal-body" id="apply-modal-content">
        <div class="apply-section-label"><span>Chọn CV ứng tuyển</span><span class="apply-label-req">*</span></div>
        <div id="apply-cv-picker-host"></div>
        <div class="apply-section-label" style="margin-top: 8px;"><span>Tải CV mới</span></div>
        <div id="apply-cv-uploader-host"></div>
        <div id="apply-cl-host" style="margin-top: 8px;"></div>
        <div id="apply-error-banner" class="apply-error-banner" role="alert" hidden></div>
      </div>
      <div class="apply-modal-footer" id="apply-modal-footer">
        <button type="button" class="btn btn-outline apply-cancel-btn">Hủy</button>
        <button type="button" class="btn btn-primary apply-submit-btn" disabled>
          <span class="btn-spinner" aria-hidden="true" hidden></span><span class="btn-text">Nộp hồ sơ</span>
        </button>
      </div>
      <div id="apply-disabled-reason" class="apply-disabled-reason" aria-live="polite">Vui lòng chọn một CV để tiếp tục</div>
    </div>
  `;
  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");

  const [submitBtn, cancelBtn, closeBtn, reasonText, errBanner] = [
    ".apply-submit-btn", ".apply-cancel-btn", ".apply-modal-close", "#apply-disabled-reason", "#apply-error-banner"
  ].map((sel) => backdrop.querySelector(sel));

  let selectedCv = null;
  let isSubmitting = false;
  const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`;
  const coverField = new CoverLetterField({ container: backdrop.querySelector("#apply-cl-host"), jobId: job.id });

  const picker = new CvPicker({
    container: backdrop.querySelector("#apply-cv-picker-host"),
    onSelect: (cv) => {
      selectedCv = cv;
      errBanner.hidden = true;
      submitBtn.disabled = !selectedCv;
      reasonText.textContent = selectedCv ? "" : "Vui lòng chọn một CV để tiếp tục";
    },
    onEmpty: (empty) => {
      if (empty) { submitBtn.disabled = true; reasonText.textContent = "Bạn chưa có CV. Vui lòng tải CV mới bên dưới."; }
    },
  });
  picker.load();

  new CvUploader({
    container: backdrop.querySelector("#apply-cv-uploader-host"),
    onUploaded: (newCv) => { picker.addAndSelect(newCv); showStatusToast("Tải CV lên thành công!", "success"); },
  });

  const destroyModal = () => {
    document.removeEventListener("keydown", handleKeydown, true);
    backdrop.remove();
    document.body.classList.remove("modal-open");
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus();
  };

  const requestClose = () => {
    if (isSubmitting) return;
    if (coverField.isDirty()) {
      openConfirmModal({
        title: "Đóng cửa sổ ứng tuyển?",
        description: "Thư giới thiệu của bạn đã được tự động lưu nháp. Bạn có muốn thoát?",
        confirmLabel: "Đóng", cancelLabel: "Ở lại", danger: false, onConfirm: destroyModal,
      });
      return;
    }
    destroyModal();
  };

  const handleKeydown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); requestClose(); return; }
    if (e.key === "Tab") {
      const focusables = backdrop.querySelectorAll('button:not([disabled]), [tabindex="0"], a[href], textarea');
      if (!focusables.length) return;
      const [first, last] = [focusables[0], focusables[focusables.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", handleKeydown, true);

  cancelBtn.addEventListener("click", requestClose);
  closeBtn.addEventListener("click", requestClose);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) requestClose(); });

  submitBtn.addEventListener("click", async () => {
    if (!selectedCv || isSubmitting) return;
    isSubmitting = true;
    submitBtn.disabled = true; cancelBtn.disabled = true;
    submitBtn.querySelector(".btn-spinner").hidden = false;
    submitBtn.querySelector(".btn-text").textContent = "Đang gửi...";
    errBanner.hidden = true;

    try {
      const res = await http.post(`/jobs/${job.id}/apply`, {
        cv_id: selectedCv.id, cover_letter: coverField.getValue() || null,
      }, { headers: { "Idempotency-Key": idempotencyKey } });
      renderSuccessState(backdrop, job);
      onSuccess?.(res.data);
    } catch (err) {
      isSubmitting = false;
      submitBtn.disabled = false; cancelBtn.disabled = false;
      submitBtn.querySelector(".btn-spinner").hidden = true;
      submitBtn.querySelector(".btn-text").textContent = "Nộp hồ sơ";
      const status = err.response?.status;
      const msg = err.response?.data?.detail || err.message || "Có lỗi xảy ra, vui lòng thử lại.";
      errBanner.innerHTML = status === 409
        ? `<p>${esc(msg)}</p><a href="./pages/candidate/applications.html" class="btn btn-sm btn-outline" style="margin-top:6px;">Xem hồ sơ đã ứng tuyển</a>`
        : `<p>${esc(msg)}</p><button type="button" class="btn btn-sm btn-outline" id="apply-retry-btn" style="margin-top:6px;">Thử lại</button>`;
      errBanner.hidden = false;
      errBanner.querySelector("#apply-retry-btn")?.addEventListener("click", () => submitBtn.click());
      if (status === 409 || status === 422) { submitBtn.disabled = true; reasonText.textContent = msg; }
    }
  });

  window.setTimeout(() => closeBtn.focus(), 50);
}

function renderSuccessState(backdrop, job) {
  const content = backdrop.querySelector("#apply-modal-content");
  const footer = backdrop.querySelector("#apply-modal-footer");
  backdrop.querySelector("#apply-disabled-reason")?.remove();
  content.innerHTML = `
    <div class="apply-success-view" aria-live="polite">
      <div class="apply-success-icon" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <h3 class="apply-success-title">Nộp hồ sơ thành công!</h3>
      <p class="apply-success-desc">Hồ sơ ứng tuyển của bạn đã được chuyển tới nhà tuyển dụng <strong>${esc(job.company_name || "")}</strong>.</p>
    </div>
  `;
  footer.innerHTML = `
    <button type="button" class="btn btn-outline" id="apply-continue-btn">Tiếp tục tìm việc</button>
    <a href="./pages/candidate/applications.html" class="btn btn-primary" id="apply-view-btn">Xem hồ sơ đã ứng tuyển</a>
  `;
  footer.querySelector("#apply-continue-btn")?.addEventListener("click", () => {
    backdrop.remove(); document.body.classList.remove("modal-open");
  });
}
