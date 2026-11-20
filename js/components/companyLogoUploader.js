/**
 * companyLogoUploader.js - Trình tải & xem trước logo doanh nghiệp (< 200 dòng).
 * Kiểm tra file -> Gọi API preview -> Hiển thị chuẩn companyLogo ở 128/56/28px -> Gửi duyệt -> Trạng thái & Xóa.
 */
import { renderCompanyLogo } from "./companyLogo.js";
import { showStatusToast } from "./toast.js";

const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const getToken = () => window.Auth?.getToken?.() || localStorage.getItem("auth_token") || "";
const getApiBase = () => (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";

export function initCompanyLogoUploader(container, comp, onUpdate) {
  if (!container) return;
  let currentComp = { ...comp };

  function render() {
    const isPending = currentComp.logo_status === "pending" || !!currentComp.pending_logo;
    const hasLogo = !isPending && !!(currentComp.logo_url || currentComp.logo);
    const activeLogoUrl = isPending ? (currentComp.pending_logo?.logo_url || currentComp.logo_url) : (currentComp.logo_url || currentComp.logo);
    const activeLogoUrl2x = isPending ? (currentComp.pending_logo?.logo_url_2x || currentComp.logo_url_2x) : (currentComp.logo_url_2x || null);
    const statusLabel = isPending ? "Đang chờ admin duyệt" : (hasLogo ? "Đang sử dụng" : "Chưa có logo");
    const statusClass = isPending ? "gov-status-pill--missing" : (hasLogo ? "gov-status-pill--active" : "gov-status-pill--removed");

    container.innerHTML = `
      <div class="emp-logo-section">
        <div class="emp-logo-current-col">
          <div style="font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Logo hiện tại</div>
          ${renderCompanyLogo({ ...currentComp, logo_url: activeLogoUrl, logo_url_2x: activeLogoUrl2x }, { size: 96, lazy: false })}
          <span class="gov-status-pill ${statusClass}" style="margin-top:6px;" id="emp-logo-status-badge">${esc(statusLabel)}</span>
          ${(hasLogo || isPending) ? `<button type="button" class="btn btn-sm btn-outline" id="btn-open-delete-logo" style="color:#b91c1c; border-color:#fca5a5; margin-top:4px;">Xóa logo</button>` : ""}
        </div>
        <div class="emp-logo-details-col">
          <div class="emp-logo-dropzone" id="emp-logo-dropzone" tabindex="0" role="button" aria-label="Tải lên logo công ty">
            <input type="file" id="emp-logo-file-input" accept="image/png,image/jpeg,image/webp" hidden>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" style="margin:0 auto 8px; display:block;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <div style="font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:4px;">Kéo &amp; thả ảnh vào đây hoặc <span style="color:var(--primary); text-decoration:underline;">chọn tệp</span></div>
            <div style="font-size:12.5px; color:var(--text-muted);">PNG, JPEG hoặc WebP. Cắt viền tự động, dung lượng tối đa 2MB.</div>
          </div>
          <div id="emp-logo-error" class="verif-field-error" role="alert" style="display:none; margin-top:8px;"></div>
          ${isPending ? `<div class="verif-reason-callout" style="background:#fffbeb; border-color:#fef3c7; color:#92400e; margin-top:10px;"><strong>Đang chờ admin duyệt:</strong> Yêu cầu logo mới đã được gửi. Logo cũ vẫn hiển thị tới khi phê duyệt.</div>` : ""}
        </div>
      </div><div id="emp-logo-modal-host"></div>`;

    bindEvents();
  }

  function bindEvents() {
    const dropzone = container.querySelector("#emp-logo-dropzone"), fileInp = container.querySelector("#emp-logo-file-input");
    const errBox = container.querySelector("#emp-logo-error");
    const showErr = (m) => { errBox.textContent = m; errBox.style.display = m ? "block" : "none"; };

    dropzone?.addEventListener("click", () => fileInp?.click());
    dropzone?.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInp?.click(); } });
    ["dragenter", "dragover"].forEach((ev) => dropzone?.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("is-dragover"); }));
    ["dragleave", "drop"].forEach((ev) => dropzone?.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove("is-dragover"); }));
    dropzone?.addEventListener("drop", (e) => { const f = e.dataTransfer?.files?.[0]; if (f) handleFile(f); });
    fileInp?.addEventListener("change", () => { const f = fileInp.files?.[0]; fileInp.value = ""; if (f) handleFile(f); });

    async function handleFile(file) {
      showErr("");
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return showErr("Định dạng không được hỗ trợ. Chỉ chấp nhận ảnh PNG, JPEG hoặc WebP.");
      if (file.size > 2 * 1024 * 1024) return showErr("Dung lượng ảnh vượt quá giới hạn 2MB. Vui lòng chọn tệp nhỏ hơn.");

      const fd = new FormData(); fd.append("file", file);
      try {
        const res = await fetch(`${getApiBase()}/employer/company/logo/preview`, {
          method: "POST", headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {}, body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return showErr(data.detail || data.message || "Tệp ảnh không hợp lệ.");
        openPreviewModal(file, data);
      } catch (err) { showErr(err?.message || "Lỗi kết nối khi kiểm tra xem trước ảnh."); }
    }
    container.querySelector("#btn-open-delete-logo")?.addEventListener("click", () => openDeleteConfirm());
  }

  function openPreviewModal(file, prevData) {
    const host = container.querySelector("#emp-logo-modal-host");
    const previewComp = {
      name: currentComp.name || "Doanh nghiệp",
      logo_url: prevData.preview_url_256,
      logo_url_2x: prevData.preview_url_512,
    };

    host.innerHTML = `<div class="emp-logo-modal-backdrop" id="preview-modal-backdrop">
      <div class="emp-logo-modal" role="dialog" aria-modal="true" aria-labelledby="prev-modal-title">
        <div class="emp-logo-modal-header"><h3 id="prev-modal-title" class="emp-logo-modal-title">Xem trước Logo đã chuẩn hóa</h3><button type="button" class="adm-dialog-close" id="btn-close-prev" aria-label="Đóng">✕</button></div>
        <div class="emp-logo-modal-body">
          <div style="font-size:13.5px; font-weight:600; color:var(--text-secondary); width:100%; text-align:left;">Logo sẽ hiển thị như thế này</div>
          <div class="emp-logo-preview-strip" style="display:flex; justify-content:center; align-items:flex-end; gap:20px; padding:16px 0;">
            <div class="emp-logo-preview-item" style="text-align:center;">
              ${renderCompanyLogo(previewComp, { size: 128, lazy: false })}
              <span class="emp-logo-preview-label" style="display:block; margin-top:6px; font-size:12px; color:var(--text-muted);">128px</span>
            </div>
            <div class="emp-logo-preview-item" style="text-align:center;">
              ${renderCompanyLogo(previewComp, { size: 56, lazy: false })}
              <span class="emp-logo-preview-label" style="display:block; margin-top:6px; font-size:12px; color:var(--text-muted);">56px</span>
            </div>
            <div class="emp-logo-preview-item" style="text-align:center;">
              ${renderCompanyLogo(previewComp, { size: 28, lazy: false })}
              <span class="emp-logo-preview-label" style="display:block; margin-top:6px; font-size:12px; color:var(--text-muted);">28px</span>
            </div>
          </div>
          <div id="prev-upload-error" class="verif-field-error" style="display:none; width:100%;"></div>
        </div>
        <div class="emp-logo-modal-footer">
          <button type="button" class="btn btn-outline" id="btn-cancel-prev">Hủy</button>
          <button type="button" class="btn btn-primary" id="btn-submit-prev">Xác nhận gửi duyệt</button>
        </div>
      </div></div>`;

    const closeModal = () => { host.innerHTML = ""; };
    host.querySelector("#btn-close-prev")?.addEventListener("click", closeModal);
    host.querySelector("#btn-cancel-prev")?.addEventListener("click", closeModal);
    host.querySelector("#preview-modal-backdrop")?.addEventListener("click", (e) => { if (e.target.id === "preview-modal-backdrop") closeModal(); });

    host.querySelector("#btn-submit-prev")?.addEventListener("click", async () => {
      const btn = host.querySelector("#btn-submit-prev"); btn.disabled = true; btn.textContent = "Đang gửi duyệt...";
      const errBox = host.querySelector("#prev-upload-error"); errBox.style.display = "none";
      try {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch(`${getApiBase()}/company/me/logo`, {
          method: "POST", headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {}, body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          errBox.textContent = data.detail || data.message || "Gửi duyệt logo thất bại.";
          errBox.style.display = "block"; btn.disabled = false; btn.textContent = "Xác nhận gửi duyệt";
          return;
        }
        closeModal();
        showStatusToast("Logo đã tải lên thành công và đang chờ admin duyệt.", "success");
        currentComp.logo_status = "pending";
        currentComp.pending_logo = data;
        render();
        onUpdate?.(currentComp);
      } catch (err) {
        errBox.textContent = err?.message || "Lỗi kết nối khi gửi logo."; errBox.style.display = "block"; btn.disabled = false; btn.textContent = "Xác nhận gửi duyệt";
      }
    });
  }

  function openDeleteConfirm() {
    const host = container.querySelector("#emp-logo-modal-host");
    host.innerHTML = `<div class="emp-logo-modal-backdrop" id="del-logo-backdrop">
      <div class="emp-logo-modal" style="max-width:440px;" role="dialog" aria-modal="true" aria-labelledby="del-logo-title">
        <div class="emp-logo-modal-header"><h3 id="del-logo-title" class="emp-logo-modal-title">Xác nhận xóa logo</h3><button type="button" class="adm-dialog-close" id="btn-close-del">✕</button></div>
        <div class="emp-logo-modal-body" style="padding:20px; text-align:left; align-items:flex-start;"><p style="margin:0; font-size:14px; line-height:1.5;">Bạn có chắc chắn muốn xóa logo doanh nghiệp không? Sau khi xóa, logo sẽ trở về dạng chữ cái viết tắt.</p></div>
        <div class="emp-logo-modal-footer"><button type="button" class="btn btn-outline" id="btn-cancel-del">Hủy</button><button type="button" class="btn btn-primary" id="btn-confirm-del" style="background:#dc2626; border-color:#dc2626;">Xóa logo</button></div>
      </div></div>`;
    const closeDel = () => { host.innerHTML = ""; };
    host.querySelector("#btn-close-del")?.addEventListener("click", closeDel);
    host.querySelector("#btn-cancel-del")?.addEventListener("click", closeDel);
    host.querySelector("#del-logo-backdrop")?.addEventListener("click", (e) => { if (e.target.id === "del-logo-backdrop") closeDel(); });
    host.querySelector("#btn-confirm-del")?.addEventListener("click", async () => {
      try {
        const res = await fetch(`${getApiBase()}/company/me/logo`, { method: "DELETE", headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {} });
        if (!res.ok) throw new Error("Không thể xóa logo.");
        closeDel();
        showStatusToast("Đã xóa logo doanh nghiệp.", "success");
        currentComp.logo_url = null; currentComp.logo = null; currentComp.pending_logo = null; currentComp.logo_status = "missing";
        render(); onUpdate?.(currentComp);
      } catch (err) { showStatusToast(err?.message || "Không thể xóa logo.", "danger"); }
    });
  }

  render();
}
