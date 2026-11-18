/**
 * employerCompanySettings.js - Cài đặt công ty & Khối Xác minh công ty (/pages/employer/company-settings.html)
 * Giới hạn: <= 200 dòng. Không dùng alert()/confirm().
 */
import { showStatusToast } from "../components/toast.js";

const state = { verif: null, selectedFile: null, previewBlobUrl: null };
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "");

function revokePreview() { if (state.previewBlobUrl) { URL.revokeObjectURL(state.previewBlobUrl); state.previewBlobUrl = null; } }

function validateMstClient(raw) {
  const s = String(raw || "").replace(/\s+/g, "");
  if (!s) return "Vui lòng nhập mã số thuế doanh nghiệp.";
  if (!/^[0-9-]+$/.test(s)) return "Mã số thuế chỉ được chứa chữ số (0-9) và dấu gạch nối (-).";
  if (/^\d{10}-\d{3}$/.test(s)) return "";
  const digits = s.replace(/-/g, "");
  if (digits.length === 10) return "";
  if (digits.length === 13) return s.includes("-") ? "Dấu '-' của mã chi nhánh phải đặt ngay sau 10 chữ số chính (ví dụ: 0101248141-001)." : "";
  return `Mã số thuế sai định dạng (đã nhập ${digits.length} chữ số). Nhập 10 chữ số hoặc 10 chữ số kèm '-' và 3 chữ số chi nhánh.`;
}

function setFieldErr(id, inputId, msg) {
  const el = document.getElementById(id), inp = inputId ? document.getElementById(inputId) : null;
  if (el) el.textContent = msg || "";
  if (inp) inp.setAttribute("aria-invalid", msg ? "true" : "false");
}

function renderLicenseStage(blobUrl, mimeType, fileName) {
  const stage = document.getElementById("verif-license-preview");
  if (!stage) return;
  if (!blobUrl) { stage.innerHTML = `<span style="font-size:12.5px;color:var(--text-secondary);text-align:center;padding:12px;">Chọn ảnh JPG, PNG hoặc tệp PDF để kiểm tra độ rõ nét trước khi gửi.</span>`; return; }
  const isPdf = mimeType === "application/pdf" || String(fileName).toLowerCase().endsWith(".pdf");
  stage.innerHTML = isPdf ? `<iframe src="${blobUrl}" title="Xem trước PDF ${esc(fileName)}"></iframe>` : `<img src="${blobUrl}" alt="Xem trước giấy phép ${esc(fileName)}">`;
}

async function loadExistingSubmittedPreview(req) {
  if (!req?.id) return renderLicenseStage(null, "", "");
  const token = window.Auth?.getToken?.() || localStorage.getItem("auth_token") || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${base}/employer/company-verification/${req.id}/license`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return;
    revokePreview(); state.previewBlobUrl = URL.createObjectURL(await res.blob());
    renderLicenseStage(state.previewBlobUrl, req.license_mime_type, req.license_original_name);
  } catch {}
}

function renderVerificationState(data) {
  state.verif = data;
  const st = data.verification_status || "chua_xac_minh";
  const req = data.request;
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

  const mstInp = document.getElementById("verif-mst-input");
  const chooseBtn = document.getElementById("btn-choose-license");
  const submitBtn = document.getElementById("btn-submit-verification");
  const pendingMeta = document.getElementById("verif-pending-meta");

  if (req?.mst && !mstInp.value) mstInp.value = req.mst;
  else if (data.tax_code && !mstInp.value) mstInp.value = data.tax_code;

  const lockForm = hasActivePendingRow || st === "da_xac_minh";
  mstInp.disabled = lockForm;
  chooseBtn.disabled = lockForm;
  submitBtn.hidden = lockForm;
  submitBtn.textContent = (st === "tu_choi" || st === "thu_hoi") ? "Gửi lại yêu cầu" : "Gửi xác minh";

  if (hasActivePendingRow) {
    pendingMeta.hidden = false;
    pendingMeta.textContent = `Đã gửi ngày ${fmtDate(req.submitted_at)} · Tệp đính kèm: ${req.license_original_name || "Giấy phép kinh doanh"} (không thể chỉnh sửa khi đang chờ xét duyệt).`;
    loadExistingSubmittedPreview(req);
  } else if (st === "da_xac_minh" && req) {
    pendingMeta.hidden = false;
    pendingMeta.textContent = `Mã số thuế đã duyệt: ${req.mst} · Duyệt ngày ${fmtDate(req.reviewed_at)}.`;
    loadExistingSubmittedPreview(req);
  } else {
    pendingMeta.hidden = true;
    if (!state.selectedFile && req) loadExistingSubmittedPreview(req);
  }
}

async function fetchAllData() {
  const [verifData, compProfile] = await Promise.all([
    window.api.get("/employer/company-verification"),
    window.api.get("/company/me").catch(() => null),
  ]);
  renderVerificationState(verifData);
  if (compProfile) {
    document.getElementById("comp-name-input").value = compProfile.name || "";
    document.getElementById("comp-tax-input").value = compProfile.tax_code || "";
    document.getElementById("comp-website-input").value = compProfile.website || "";
    document.getElementById("comp-address-input").value = compProfile.address || "";
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
    setFieldErr("err-verif-file", null, "Dung lượng tệp vượt quá 5 MB. Hãy chọn ảnh JPG, PNG hoặc bản PDF dưới 5 MB.");
    return;
  }
  state.selectedFile = f;
  document.getElementById("verif-chosen-filename").textContent = `${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
  revokePreview();
  state.previewBlobUrl = URL.createObjectURL(f);
  renderLicenseStage(state.previewBlobUrl, f.type, f.name);
});

document.getElementById("verif-submit-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setFieldErr("err-verif-mst", "verif-mst-input", "");
  setFieldErr("err-verif-file", null, "");
  const fb = document.getElementById("verif-feedback-banner");
  fb.hidden = true;

  const mstVal = document.getElementById("verif-mst-input").value;
  const mstErr = validateMstClient(mstVal);
  if (mstErr) { setFieldErr("err-verif-mst", "verif-mst-input", mstErr); document.getElementById("verif-mst-input").focus(); return; }
  if (!state.selectedFile) { setFieldErr("err-verif-file", null, "Vui lòng chọn tệp ảnh JPG, PNG hoặc bản PDF giấy phép đăng ký kinh doanh."); document.getElementById("btn-choose-license").focus(); return; }

  const btn = document.getElementById("btn-submit-verification");
  btn.disabled = true; const prevLabel = btn.textContent; btn.textContent = "Đang gửi...";

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
      const detail = payload.detail || {};
      const msg = typeof detail === "string" ? detail : (detail.message || "Không thể gửi yêu cầu xác minh.");
      if (detail.field === "mst") setFieldErr("err-verif-mst", "verif-mst-input", msg);
      else if (detail.field === "file") setFieldErr("err-verif-file", null, msg);
      else { fb.hidden = false; fb.className = "verif-reason-callout"; fb.textContent = msg; }
      return;
    }
    state.selectedFile = null;
    renderVerificationState(payload);
    showStatusToast("Đã gửi yêu cầu xác minh công ty.", "success");
  } finally {
    btn.disabled = false;
    btn.textContent = prevLabel;
  }
});

document.getElementById("company-profile-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById("comp-profile-msg");
  msgEl.textContent = "Đang lưu...";
  try {
    await window.api.put("/company/me", {
      name: document.getElementById("comp-name-input").value.trim(),
      tax_code: document.getElementById("comp-tax-input").value.trim() || null,
      website: document.getElementById("comp-website-input").value.trim() || null,
      address: document.getElementById("comp-address-input").value.trim() || null,
    });
    msgEl.style.color = "#0f766e";
    msgEl.textContent = "Đã cập nhật thông tin doanh nghiệp.";
    await fetchAllData();
  } catch (err) {
    msgEl.style.color = "#b91c1c";
    msgEl.textContent = err?.message || "Không thể lưu thông tin công ty.";
  }
});

window.addEventListener("beforeunload", revokePreview);
fetchAllData().catch((err) => showStatusToast(err?.message || "Không thể tải cài đặt công ty.", "danger"));
