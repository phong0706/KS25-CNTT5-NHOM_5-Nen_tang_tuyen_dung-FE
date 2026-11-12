/**
 * Trang Form đăng tin 4 bước (/pages/employer/job-form.html)
 * Hỗ trợ tạo mới, sửa (?id=), nhân bản (?duplicate=), tự lưu nháp 30s và xem trước trực tiếp.
 */
import { renderStepper } from "../components/stepper.js";
import { renderJobPreviewCard } from "../components/jobPreviewCard.js";
import { openConfirmModal } from "../components/confirmModal.js";
import { showStatusToast } from "../components/toast.js";
import { fetchCachedMeta, validateStepFields, applyFieldErrors, renderReviewSummary } from "../components/jobFormHelpers.js";
import { getFocusMap, buildJobPayload, formatServerHHMM, bindJobFormInputs } from "../components/jobFormBind.js";

const STEPS = ["Thông tin chung", "Mô tả & yêu cầu", "Lương & quyền lợi", "Xem lại & đăng"];
const state = {
  jobId: null, currentStep: 1, maxReachedStep: 1, dirty: false, saving: false, autoSaveTimer: null,
  draft: {
    title: "", level: "", work_type: "", location: "", quantity: 1, deadline: "",
    description: "", requirements: "", skills: [], salary_min: null, salary_max: null,
    is_salary_negotiable: false, benefits: [""], company_name: "",
  },
};

function updatePreview() {
  renderJobPreviewCard(document.getElementById("ejf-preview-host"), state.draft);
  if (state.currentStep === 4) renderReviewSummary(document.getElementById("ejf-review-summary"), state.draft);
}

function markDirty() {
  state.dirty = true;
  updatePreview();
  if (state.currentStep <= 3) applyFieldErrors(validateStepFields(state.currentStep, state.draft), getFocusMap(), false);
}

function goToStep(step) {
  state.currentStep = step;
  if (step > state.maxReachedStep) state.maxReachedStep = step;
  for (let i = 1; i <= 4; i++) {
    const panel = document.getElementById(`ejf-step-${i}`);
    if (panel) panel.hidden = i !== step;
  }
  document.getElementById("ejf-prev-btn").hidden = step === 1;
  document.getElementById("ejf-next-btn").hidden = step === 4;
  document.getElementById("ejf-submit-btn").hidden = step !== 4;
  renderStepper(document.getElementById("ejf-stepper"), STEPS, state.currentStep, state.maxReachedStep, goToStep);
  if (step === 4) renderReviewSummary(document.getElementById("ejf-review-summary"), state.draft);
}

async function persistJob(status, isAutoSave = false) {
  if (state.saving) return null;
  if (isAutoSave && (!state.dirty || !state.draft.title.trim())) return null;
  state.saving = true;
  const draftBtn = document.getElementById("ejf-save-draft-btn");
  const submitBtn = document.getElementById("ejf-submit-btn");
  const errBox = document.getElementById("ejf-submit-error");
  if (errBox) errBox.hidden = true;
  if (!isAutoSave) {
    draftBtn.disabled = true;
    submitBtn.disabled = true;
    (status === "pending" ? submitBtn : draftBtn).textContent = "Đang lưu...";
  }
  try {
    const payload = buildJobPayload(state.draft, status);
    const res = state.jobId
      ? await window.api.put(`/employer/jobs/${state.jobId}`, payload)
      : await window.api.post("/employer/jobs", payload);
    state.jobId = res.id;
    state.dirty = false;
    state.draft.company_name = res.company_name || state.draft.company_name;
    document.getElementById("ejf-autosave-status").textContent = `Đã lưu nháp lúc ${formatServerHHMM(res.server_time)}`;
    if (!isAutoSave) {
      showStatusToast(status === "pending" ? "Đã gửi duyệt tin tuyển dụng!" : "Đã lưu bản nháp.", "success");
      if (status === "pending") window.location.href = "./jobs.html?status=pending";
    }
    return res;
  } catch (err) {
    if (!isAutoSave) {
      if (errBox && state.currentStep === 4) {
        document.getElementById("ejf-submit-error-msg").textContent = err?.message || "Lỗi kết nối. Dữ liệu vẫn được giữ nguyên.";
        errBox.hidden = false;
      }
      showStatusToast(err?.message || "Lưu tin thất bại.", "error", 3500);
    }
    return null;
  } finally {
    state.saving = false;
    draftBtn.disabled = false;
    submitBtn.disabled = false;
    draftBtn.textContent = "Lưu nháp";
    submitBtn.textContent = "Gửi duyệt";
  }
}

function setupNavigationAndDrawer() {
  document.getElementById("ejf-next-btn").addEventListener("click", () => {
    const ok = applyFieldErrors(validateStepFields(state.currentStep, state.draft), getFocusMap(), true);
    if (ok && state.currentStep < 4) goToStep(state.currentStep + 1);
  });
  document.getElementById("ejf-prev-btn").addEventListener("click", () => {
    if (state.currentStep > 1) goToStep(state.currentStep - 1);
  });
  document.getElementById("ejf-save-draft-btn").addEventListener("click", () => persistJob("draft", false));
  document.getElementById("ejf-submit-btn").addEventListener("click", () => persistJob("pending", false));
  document.getElementById("ejf-retry-submit-btn").addEventListener("click", () => persistJob("pending", false));

  const previewCol = document.getElementById("ejf-preview-col");
  const openBtn = document.getElementById("ejf-mobile-preview-btn");
  const closeBtn = document.getElementById("ejf-close-drawer-btn");
  const closeDrawer = () => { previewCol.classList.remove("is-drawer-open"); openBtn.focus(); };
  openBtn.addEventListener("click", () => { previewCol.classList.add("is-drawer-open"); closeBtn.focus(); });
  closeBtn.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && previewCol.classList.contains("is-drawer-open")) closeDrawer();
  });

  window.addEventListener("beforeunload", (e) => {
    if (state.dirty) { e.preventDefault(); e.returnValue = ""; }
  });
  document.getElementById("ejf-back-link").addEventListener("click", (e) => {
    if (!state.dirty) return;
    e.preventDefault();
    openConfirmModal({
      title: "Rời trang khi chưa lưu?",
      description: "Các thay đổi chưa lưu sẽ bị mất nếu bạn rời khỏi biểu mẫu ngay bây giờ.",
      confirmLabel: "Rời trang", danger: true, returnFocusTo: e.currentTarget,
      onConfirm: () => { state.dirty = false; window.location.href = "./jobs.html"; },
    });
  });
}

async function init() {
  if (window.ProtectedRoute && !window.ProtectedRoute.requireAuth({ roles: ["recruiter", "employer"] })) return;
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const dupId = params.get("duplicate");
  try {
    const [locations, levels, workTypes] = await Promise.all([
      fetchCachedMeta("/meta/locations"),
      fetchCachedMeta("/meta/levels"),
      fetchCachedMeta("/meta/work-types"),
    ]);
    if (editId || dupId) {
      const job = await window.api.get(`/employer/jobs/${editId || dupId}`);
      Object.assign(state.draft, job, {
        title: dupId ? `${job.title} (Bản sao)` : job.title,
        benefits: job.benefits?.length ? job.benefits : [""],
      });
      if (editId) {
        state.jobId = job.id;
        state.maxReachedStep = 4;
        document.getElementById("ejf-heading").textContent = "Chỉnh sửa tin tuyển dụng";
      }
    }
    const mkSelect = (sel, id, placeholder, items, key) => new window.CustomSelect(document.querySelector(sel), {
      id, name: key, placeholder, options: items.map((o) => ({ value: o.name, label: o.name })),
      value: state.draft[key] || "", onChange: (v) => { state.draft[key] = v; markDirty(); },
    });
    mkSelect("#ejf-level-select", "ejf-level", "Chọn cấp bậc", levels, "level");
    mkSelect("#ejf-worktype-select", "ejf-worktype", "Chọn hình thức", workTypes, "work_type");
    mkSelect("#ejf-location-select", "ejf-location", "Chọn địa điểm", locations, "location");

    bindJobFormInputs(state.draft, markDirty);
    setupNavigationAndDrawer();
    goToStep(1);
    updatePreview();
    state.autoSaveTimer = window.setInterval(() => persistJob("draft", true), 30000);
  } catch (err) {
    document.getElementById("ejf-layout").hidden = true;
    document.getElementById("ejf-network-error").hidden = false;
    document.getElementById("ejf-network-error-msg").textContent = err?.message || "Lỗi kết nối máy chủ.";
    document.getElementById("ejf-retry-init-btn").onclick = () => window.location.reload();
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
