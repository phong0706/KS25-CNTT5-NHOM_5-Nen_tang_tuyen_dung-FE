/**
 * companyDeleteDialog.js - Hộp thoại xác nhận xóa công ty bằng cách gõ chính xác tên.
 * Giới hạn: <= 200 dòng. Không dùng alert()/confirm().
 */
import { isDeleteConfirmExact } from "../utils/companyDialogRules.js";

const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

export function openDeleteConfirmDialog({ targetName, companyId, triggerBtn, onSuccess }) {
  const host = document.getElementById("adm-comp-modal-host");
  const returnEl = triggerBtn || document.activeElement;
  host.innerHTML = `<div class="adm-dialog-backdrop" id="delete-confirm-backdrop">
    <div class="adm-company-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" style="max-width:440px;">
      <div class="adm-dialog-header">
        <h3 id="delete-confirm-title" class="adm-dialog-title" style="font-size:16px;">Xác nhận xóa công ty</h3>
        <button type="button" class="adm-dialog-close" id="btn-cancel-delete" aria-label="Đóng">✕</button>
      </div>
      <div class="adm-dialog-body" style="gap:12px;">
        <p style="font-size:13.5px; margin:0; color:var(--text-secondary); line-height:1.5;">Hành động này sẽ xóa vĩnh viễn công ty và các dữ liệu liên quan. Nhập chính xác tên sau để tiếp tục:</p>
        <div style="padding:8px 12px; background:var(--bg-page); border:1px solid var(--border-default); border-radius:6px; font-weight:600; font-size:13px; user-select:all;">${esc(targetName)}</div>
        <input type="text" id="input-confirm-name" class="adm-search-input" placeholder="Gõ đúng tên công ty để mở khóa nút xóa..." autocomplete="off">
        <p id="delete-name-error" style="margin:0; font-size:12px; color:#b91c1c;" role="alert"></p>
      </div>
      <div class="adm-dialog-footer" style="justify-content:flex-end;">
        <button type="button" class="btn btn-outline" id="btn-abort-delete">Hủy</button>
        <button type="button" class="adm-btn-danger-outline" id="btn-execute-delete" disabled style="opacity:0.5; cursor:not-allowed;">Xóa vĩnh viễn</button>
      </div>
    </div></div>`;

  const inp = document.getElementById("input-confirm-name");
  const execBtn = document.getElementById("btn-execute-delete");
  const close = () => { host.innerHTML = ""; if (returnEl?.focus) returnEl.focus(); };

  inp?.addEventListener("input", () => {
    const matched = isDeleteConfirmExact(targetName, inp.value);
    execBtn.disabled = !matched;
    execBtn.style.opacity = matched ? "1" : "0.5";
    execBtn.style.cursor = matched ? "pointer" : "not-allowed";
  });

  document.getElementById("btn-cancel-delete")?.addEventListener("click", close);
  document.getElementById("btn-abort-delete")?.addEventListener("click", close);
  execBtn?.addEventListener("click", async () => {
    execBtn.disabled = true;
    try {
      await window.api.delete(`/admin/companies/${companyId}`, { confirm_name: inp.value });
      close();
      onSuccess?.();
    } catch (err) {
      document.getElementById("delete-name-error").textContent = err?.message || "Lỗi xóa công ty.";
      execBtn.disabled = false;
    }
  });

  window.setTimeout(() => inp?.focus(), 30);
}
