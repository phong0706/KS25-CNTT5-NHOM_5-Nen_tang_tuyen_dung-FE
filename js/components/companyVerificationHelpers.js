/**
 * companyVerificationHelpers.js - Tiện ích kiểm tra MST và xem trước giấy phép kinh doanh (<= 90 dòng).
 */
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

export function validateMstClient(raw) {
  const s = String(raw || "").replace(/\s+/g, "");
  if (!s) return "Vui lòng nhập mã số thuế doanh nghiệp.";
  if (!/^[0-9-]+$/.test(s)) return "Mã số thuế chỉ được chứa chữ số (0-9) và dấu gạch nối (-).";
  if (/^\d{10}(-\d{3})?$/.test(s)) return "";
  const digits = s.replace(/-/g, "");
  if (digits.length === 10) return "";
  return "Mã số thuế sai định dạng (10 chữ số hoặc 10 chữ số kèm '-' và 3 chữ số chi nhánh).";
}

export function setFieldErr(id, inputId, msg) {
  const el = document.getElementById(id), inp = inputId ? document.getElementById(inputId) : null;
  if (el) el.textContent = msg || "";
  if (inp) inp.setAttribute("aria-invalid", msg ? "true" : "false");
}

export function renderLicenseStage(blobUrl, mimeType, fileName) {
  const stage = document.getElementById("verif-license-preview");
  if (!stage) return;
  if (!blobUrl) {
    stage.innerHTML = `<span style="font-size:12.5px;color:var(--text-secondary);text-align:center;padding:12px;">Chọn ảnh JPG, PNG hoặc tệp PDF để kiểm tra độ rõ nét trước khi gửi.</span>`;
    return;
  }
  const isPdf = mimeType === "application/pdf" || String(fileName).toLowerCase().endsWith(".pdf");
  stage.innerHTML = isPdf
    ? `<iframe src="${blobUrl}" title="Xem trước PDF ${esc(fileName)}"></iframe>`
    : `<img src="${blobUrl}" alt="Xem trước giấy phép ${esc(fileName)}">`;
}

export async function fetchExistingLicenseBlob(reqId) {
  if (!reqId) return null;
  const token = window.Auth?.getToken?.() || localStorage.getItem("auth_token") || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${base}/employer/company-verification/${reqId}/license`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    return URL.createObjectURL(await res.blob());
  } catch {
    return null;
  }
}
