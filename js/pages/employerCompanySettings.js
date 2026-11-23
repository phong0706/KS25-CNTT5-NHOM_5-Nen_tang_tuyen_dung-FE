/**
 * employerCompanySettings.js - Cài đặt công ty & Xác minh pháp nhân (<= 195 dòng).
 * Sửa BUG-01 -> BUG-07: vô hiệu hóa nút nộp khi thiếu, textarea co giãn, MST chỉ đọc.
 */
import { showStatusToast } from "../components/toast.js";


const state = { verif: null, compProfile: null, selectedFile: null, previewBlobUrl: null };
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "");
const revokePreview = () => { if (state.previewBlobUrl) { URL.revokeObjectURL(state.previewBlobUrl); state.previewBlobUrl = null; } };

function updateMissingHintAndSubmitBtn() {
  const mstVal = document.getElementById("verif-mst-input")?.value?.trim() || "";
  const hasMst = !validateMstClient(mstVal), hasFile = Boolean(state.selectedFile || state.verif?.request?.license_original_name);
  const hintEl = document.getElementById("verif-missing-hint"), submitBtn = document.getElementById("btn-submit-verification");
  const st = state.verif?.verification_status || "chua_xac_minh";
  const locked = (st === "cho_duyet" && state.verif?.request?.status === "cho_duyet") || st === "da_xac_minh";
  if (locked) {
    if (hintEl) hintEl.hidden = true;
    if (submitBtn) submitBtn.disabled = true;
    return;
  }
  const missing = (!hasMst && !hasFile) ? "Còn thiếu: Mã số thuế hợp lệ và tệp giấy phép kinh doanh."
    : (!hasMst ? "Còn thiếu: Mã số thuế hợp lệ (10 hoặc 13 chữ số)." : (!hasFile ? "Còn thiếu: Tệp ảnh hoặc bản PDF giấy phép kinh doanh." : ""));
  if (hintEl) { hintEl.hidden = !missing; hintEl.textContent = missing; }
  if (submitBtn) submitBtn.disabled = Boolean(missing);
}

async function loadExistingSubmittedPreview(req) {
  if (!req?.id) return renderLicenseStage(null, "", "");
  const blobUrl = await fetchExistingLicenseBlob(req.id);
  if (!blobUrl) return;
  revokePreview();
  state.previewBlobUrl = blobUrl;
  renderLicenseStage(state.previewBlobUrl, req.license_mime_type, req.license_original_name);
}

function renderVerificationState(data) {
  state.verif = data;
  const st = data.verification_status || "chua_xac_minh", req = data.request;
  const hasActivePendingRow = st === "cho_duyet" && req && req.status === "cho_duyet";

  const sentenceEl = document.getElementById("verif-status-sentence");
  sentenceEl.className = `verif-status-strip verif-status-strip--${st}`;
  sentenceEl.textContent = data.status_sentence || "Chưa xác minh. Bạn chỉ có thể lưu nháp tin tuyển dụng.";

  const rejBanner = document.getElementById("verif-rejection-banner");
  if ((st === "tu_choi" || st === "thu_hoi") && req?.rejection_reason) {
    const heading = st === "thu_hoi" ? "Xác minh công ty đã bị thu hồi" : "Yêu cầu xác minh chưa được duyệt";
    rejBanner.hidden = false;
    rejBanner.innerHTML = `<div class="verif-reason-callout" role="alert"><div><strong>${heading}.</strong> Lý do: ${esc(req.rejection_reason)}</div><button type="button" id="btn-focus-resubmit" class="btn btn-sm btn-outline">Gửi lại yêu cầu</button></div>`;
    document.getElementById("btn-focus-resubmit")?.addEventListener("click", () => { const m = document.getElementById("verif-mst-input"); m?.removeAttribute("disabled"); m?.focus(); });
  } else { rejBanner.hidden = true; rejBanner.innerHTML = ""; }

  const mstInp = document.getElementById("verif-mst-input"), chooseBtn = document.getElementById("btn-choose-license");
  const submitBtn = document.getElementById("btn-submit-verification"), pendingMeta = document.getElementById("verif-pending-meta");

  if (req?.mst && !mstInp.value) mstInp.value = req.mst;
  else if (data.tax_code && !mstInp.value) mstInp.value = data.tax_code;

  const lockForm = hasActivePendingRow || st === "da_xac_minh";
  mstInp.disabled = lockForm; chooseBtn.disabled = lockForm; submitBtn.hidden = lockForm;
  submitBtn.textContent = (st === "tu_choi" || st === "thu_hoi") ? "Gửi lại yêu cầu" : "Gửi xác minh";

  if (hasActivePendingRow) {
    pendingMeta.hidden = false;
    pendingMeta.textContent = `Đã gửi ngày ${fmtDate(req.submitted_at)} · Tệp: ${req.license_original_name || "Giấy phép"} (không thể sửa khi đang chờ duyệt).`;
    loadExistingSubmittedPreview(req);
  } else if (st === "da_xac_minh" && req) {
    pendingMeta.hidden = false;
    pendingMeta.textContent = `Mã số thuế đã duyệt: ${req.mst} · Duyệt ngày ${fmtDate(req.reviewed_at)}.`;
    loadExistingSubmittedPreview(req);
  } else {
    pendingMeta.hidden = true;
    if (!state.selectedFile && req) loadExistingSubmittedPreview(req);
  }
  updateMissingHintAndSubmitBtn();
}

function syncProfileForm(comp) {
  if (!comp) return;
  state.compProfile = comp;
  document.getElementById("comp-name-input").value = comp.name || "";
  document.getElementById("comp-tax-readonly").value = comp.tax_code || "Chưa có mã số thuế";
  document.getElementById("comp-website-input").value = comp.website || "";
  const addrEl = document.getElementById("comp-address-input");
  addrEl.value = comp.address || "";
  document.getElementById("comp-address-count").textContent = `${(comp.address || "").length}/500 ký tự`;
}

async function fetchAllData() {
  const [verifData, compProfile] = await Promise.all([
    window.api.get("/employer/company-verification"),
    window.api.get("/company/me").catch(() => null),
    loadEmployerCriteriaBlock(),
  ]);
  renderVerificationState(verifData);
  if (compProfile) {

  }
}

const fileInput = document.getElementById("verif-license-input");
document.getElementById("btn-choose-license")?.addEventListener("click", () => fileInput?.click());
fileInput?.addEventListener("change", () => {
  const f = fileInput.files?.[0] || null;
  setFieldErr("err-verif-file", null, "");
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) {
    state.selectedFile = null;
    setFieldErr("err-verif-file", null, "Dung lượng tệp vượt quá 5 MB.");
    updateMissingHintAndSubmitBtn();
    return;
  }
  state.selectedFile = f;
  document.getElementById("verif-chosen-filename").textContent = `${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
  revokePreview();
  state.previewBlobUrl = URL.createObjectURL(f);
  renderLicenseStage(state.previewBlobUrl, f.type, f.name);
  updateMissingHintAndSubmitBtn();
});

document.getElementById("verif-mst-input")?.addEventListener("input", updateMissingHintAndSubmitBtn);

document.getElementById("comp-address-input")?.addEventListener("input", (e) => {
  e.target.style.height = "auto";
  e.target.style.height = `${e.target.scrollHeight}px`;
  document.getElementById("comp-address-count").textContent = `${e.target.value.length}/500 ký tự`;
});

document.getElementById("btn-reset-profile")?.addEventListener("click", () => {
  if (state.compProfile) syncProfileForm(state.compProfile);
});

document.getElementById("verif-submit-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setFieldErr("err-verif-mst", "verif-mst-input", "");
  setFieldErr("err-verif-file", null, "");
  const mstVal = document.getElementById("verif-mst-input").value;
  const mstErr = validateMstClient(mstVal);
  if (mstErr) { setFieldErr("err-verif-mst", "verif-mst-input", mstErr); return; }
  if (!state.selectedFile) { setFieldErr("err-verif-file", null, "Vui lòng chọn tệp giấy phép."); return; }

  const btn = document.getElementById("btn-submit-verification");
  btn.disabled = true; const prev = btn.textContent; btn.textContent = "Đang gửi...";
  try {
    const fd = new FormData();
    fd.append("mst", mstVal.trim());
    fd.append("file", state.selectedFile);
    const token = window.Auth?.getToken?.() || localStorage.getItem("auth_token") || "";
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const res = await fetch(`${base}/employer/company-verification`, {
      method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = payload.detail || {}, msg = typeof detail === "string" ? detail : (detail.message || "Lỗi gửi xác minh.");
      setFieldErr(detail.field === "mst" ? "err-verif-mst" : "err-verif-file", detail.field === "mst" ? "verif-mst-input" : null, msg);
      return;
    }
    state.selectedFile = null;
    renderVerificationState(payload);
    showStatusToast("Đã gửi yêu cầu xác minh công ty thành công.", "success");
  } finally {
    btn.disabled = false; btn.textContent = prev; updateMissingHintAndSubmitBtn();
  }
});

document.getElementById("company-profile-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById("comp-profile-msg");
  msgEl.textContent = "Đang lưu...";
  try {
    const res = await window.api.put("/company/me", {
      name: document.getElementById("comp-name-input").value.trim(),
      website: document.getElementById("comp-website-input").value.trim() || null,
      address: document.getElementById("comp-address-input").value.trim() || null,
    });
    msgEl.style.color = "#0f766e";
    msgEl.textContent = "Đã lưu thông tin công ty.";
    syncProfileForm(res);
    showStatusToast("Đã cập nhật thông tin doanh nghiệp.", "success");
  } catch (err) {
    msgEl.style.color = "#b91c1c";
    msgEl.textContent = err?.message || "Không thể lưu thông tin công ty.";
  }
});

window.addEventListener("beforeunload", revokePreview);
fetchAllData().catch((err) => showStatusToast(err?.message || "Không thể tải cài đặt công ty.", "danger"));
