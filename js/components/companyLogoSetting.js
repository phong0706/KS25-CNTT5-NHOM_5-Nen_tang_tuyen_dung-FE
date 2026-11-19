/**
 * companyLogoSetting.js - Quản lý tải lên & gỡ logo công ty cho nhà tuyển dụng (<= 150 dòng).
 * Kiểm tra client-side: PNG/WebP, <= 200 KB. Nút Lưu logo chỉ bật khi có thay đổi hợp lệ.
 */
import { renderCompanyLogo } from "./jobCard.js";
import { showStatusToast } from "./toast.js";

const MAX_BYTES = 200 * 1024;
const ALLOWED_TYPES = ["image/png", "image/webp"];

const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

export function initCompanyLogoSetting(company, onUpdated) {
  const stage = document.getElementById("comp-logo-stage");
  const fileInput = document.getElementById("comp-logo-input");
  const chooseBtn = document.getElementById("btn-choose-logo");
  const removeBtn = document.getElementById("btn-remove-logo");
  const saveBtn = document.getElementById("btn-save-logo");
  const errEl = document.getElementById("err-comp-logo");
  const badgeEl = document.getElementById("comp-logo-badge");

  let currentComp = { ...company };
  let selectedFile = null, isPendingRemove = false, previewBlob = null;
  const setErr = (txt) => { if (errEl) errEl.textContent = txt || ""; };

  const updatePreview = () => {
    if (!stage) return;
    stage.innerHTML = "";
    if (isPendingRemove) {
      stage.appendChild(renderCompanyLogo({ name: currentComp.name, logo_url: null }, "lg"));
    } else if (previewBlob) {
      const img = document.createElement("img");
      img.src = previewBlob;
      img.alt = `Xem trước logo ${esc(currentComp.name)}`;
      img.style.cssText = "width:56px;height:56px;border-radius:12px;object-fit:cover;";
      stage.appendChild(img);
    } else {
      stage.appendChild(renderCompanyLogo(currentComp, "lg"));
    }
  };

  const updateBadge = () => {
    if (!badgeEl) return;
    badgeEl.className = "comp-logo-status-pill";
    if (isPendingRemove) {
      badgeEl.classList.add("comp-logo-status-pill--rejected");
      badgeEl.textContent = "Sẽ gỡ logo khi bấm 'Lưu logo'.";
    } else if (selectedFile) {
      badgeEl.classList.add("comp-logo-status-pill--pending");
      badgeEl.textContent = "Đã chọn ảnh mới. Bấm 'Lưu logo' để gửi.";
    } else {
      const raw = currentComp.logo_status || (currentComp.logo_url ? "approved" : "missing");
      const isPending = raw === "pending" || raw === "pending_review";
      const isApproved = raw === "approved" || raw === "active";
      const isRejected = raw === "rejected";
      const cls = isPending ? "pending" : (isApproved ? "active" : (isRejected ? "rejected" : "missing"));
      const txt = isPending ? "Đang chờ duyệt. Logo sẽ hiện công khai sau khi quản trị viên duyệt."
        : (isApproved ? "Logo đã duyệt và đang hiển thị công khai."
        : (isRejected ? "Logo bị từ chối duyệt. Vui lòng chọn ảnh khác." : "Chưa có logo công ty."));
      badgeEl.classList.add(`comp-logo-status-pill--${cls}`);
      badgeEl.textContent = txt;
    }
    if (removeBtn) {
      const hasLogo = !isPendingRemove && (Boolean(selectedFile) || (Boolean(currentComp.logo_url) && currentComp.logo_status !== "removed"));
      removeBtn.style.display = hasLogo ? "inline-flex" : "none";
    }
  };

  updatePreview();
  updateBadge();

  chooseBtn?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    setErr("");
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
    const validExt = ext === ".png" || ext === ".webp";
    if (!validExt || !ALLOWED_TYPES.includes(f.type)) {
      setErr("Chỉ chấp nhận file ảnh định dạng PNG hoặc WebP.");
      fileInput.value = "";
      return;
    }
    if (f.size > MAX_BYTES) {
      setErr("Ảnh vượt 200 KB. Hãy nén hoặc chọn ảnh nhỏ hơn.");
      fileInput.value = "";
      return;
    }
    if (previewBlob) URL.revokeObjectURL(previewBlob);
    selectedFile = f;
    isPendingRemove = false;
    previewBlob = URL.createObjectURL(f);
    updatePreview();
    updateBadge();
    if (saveBtn) saveBtn.disabled = false;
  });

  removeBtn?.addEventListener("click", () => {
    setErr("");
    if (previewBlob) { URL.revokeObjectURL(previewBlob); previewBlob = null; }
    if (fileInput) fileInput.value = "";
    selectedFile = null;
    isPendingRemove = true;
    updatePreview();
    updateBadge();
    if (saveBtn) saveBtn.disabled = false;
  });

  saveBtn?.addEventListener("click", async () => {
    if (!selectedFile && !isPendingRemove) return;
    saveBtn.disabled = true;
    const oldTxt = saveBtn.textContent;
    saveBtn.textContent = "Đang lưu...";
    setErr("");
    try {
      if (isPendingRemove) {
        const res = await window.api.post("/company/me/logo/remove");
        currentComp = res;
        isPendingRemove = false;
        showStatusToast("Đã gỡ logo công ty thành công.", "success");
      } else if (selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        const token = window.Auth?.getToken?.() || localStorage.getItem("auth_token") || "";
        const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
        const r = await fetch(`${base}/company/me/logo`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.detail || "Không thể tải lên logo công ty.");
        currentComp = data;
        selectedFile = null;
        if (previewBlob) { URL.revokeObjectURL(previewBlob); previewBlob = null; }
        showStatusToast("Đã gửi logo lên hệ thống. Logo đang chờ duyệt.", "success");
      }
      updatePreview();
      updateBadge();
      if (onUpdated) onUpdated(currentComp);
    } catch (err) {
      setErr(err?.message || "Lỗi khi lưu logo.");
      saveBtn.disabled = false;
    } finally {
      saveBtn.textContent = oldTxt;
    }
  });
}
