/**
 * itemsModals.js - Hộp thoại xác nhận xóa tin tuyển dụng & từ chối logo công ty (<= 120 dòng).
 */
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

function trapFocus(modalEl, closeFn) {
  const onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeFn(); }
    if (e.key === "Tab") {
      const focusables = modalEl.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled])');
      if (!focusables.length) return;
      const [first, last] = [focusables[0], focusables[focusables.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", onKey, true);
  return () => document.removeEventListener("keydown", onKey, true);
}

export function openDeleteJobModal(job, triggerBtn, onSuccess, showMessage) {
  const host = document.getElementById("job-modal-host");
  if (!host) return;
  const isPending = job.status === "pending";
  const desc = isPending ? "Tin chờ duyệt sẽ bị từ chối và gỡ bỏ. Bắt buộc nhập lý do (tối thiểu 10 ký tự)." : "Tin sẽ biến khỏi trang công khai ngay.";

  host.innerHTML = `<div class="emp-modal-backdrop" id="job-del-backdrop">
    <div class="emp-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="job-del-title" style="max-width:440px; width:100%;">
      <div class="emp-modal-header"><h3 id="job-del-title" class="emp-modal-title">Xóa tin tuyển dụng</h3><button type="button" class="emp-modal-close" id="job-del-close" aria-label="Đóng">✕</button></div>
      <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.55; margin:8px 0 12px;"><strong>${esc(job.title)}</strong><br>${desc}</p>
      ${isPending ? `<div class="verif-field" style="margin-bottom:12px;">
        <label class="verif-label" for="job-del-reason" style="margin-top:0;">Lý do xóa tin (bắt buộc, tối thiểu 10 ký tự) *</label>
        <textarea id="job-del-reason" class="verif-text-input" rows="3" placeholder="Nêu rõ lý do vi phạm hoặc cần sửa đổi..." style="min-height:74px;"></textarea>
        <p id="job-del-hint" style="font-size:12px; color:var(--text-muted); margin:4px 0 0;">Còn thiếu 10 ký tự</p>
      </div>` : ""}
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button type="button" class="btn btn-outline" id="job-del-cancel">Hủy</button>
        <button type="button" class="btn btn-primary" id="job-del-ok" ${isPending ? "disabled" : ""} style="background:#b91c1c; border-color:#b91c1c; color:#fff;">Xóa tin</button>
      </div>
    </div></div>`;

  const close = () => { unbind(); host.innerHTML = ""; triggerBtn?.focus(); };
  const unbind = trapFocus(host, close);
  document.getElementById("job-del-close")?.addEventListener("click", close);
  document.getElementById("job-del-cancel")?.addEventListener("click", close);
  document.getElementById("job-del-backdrop")?.addEventListener("click", (e) => { if (e.target.id === "job-del-backdrop") close(); });

  const okBtn = document.getElementById("job-del-ok");
  const reasonInp = document.getElementById("job-del-reason");
  const hintEl = document.getElementById("job-del-hint");

  if (isPending && reasonInp) {
    reasonInp.addEventListener("input", () => {
      const len = reasonInp.value.trim().length;
      okBtn.disabled = len < 10;
      if (hintEl) {
        hintEl.textContent = len >= 10 ? "Đã đủ độ dài yêu cầu." : `Còn thiếu ${10 - len} ký tự`;
        hintEl.style.color = len >= 10 ? "#166534" : "var(--text-muted)";
      }
    });
  }

  okBtn?.addEventListener("click", async () => {
    okBtn.disabled = true;
    try {
      await window.api.delete(`/admin/jobs/${job.id}`, { reason: reasonInp?.value.trim() || null });
      close();
      showMessage(`Đã xóa tin tuyển dụng "${job.title}".`);
      onSuccess?.();
    } catch (err) {
      showMessage(err?.message || "Không thể xóa tin.", true);
      okBtn.disabled = false;
    }
  });
  setTimeout(() => (reasonInp || okBtn)?.focus(), 30);
}

export function openRejectLogoModal(item, triggerBtn, onSuccess, showMessage) {
  const host = document.getElementById("job-modal-host");
  if (!host) return;

  host.innerHTML = `<div class="emp-modal-backdrop" id="logo-rej-backdrop">
    <div class="emp-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="logo-rej-title" style="max-width:440px; width:100%;">
      <div class="emp-modal-header"><h3 id="logo-rej-title" class="emp-modal-title">Từ chối logo doanh nghiệp</h3><button type="button" class="emp-modal-close" id="logo-rej-close" aria-label="Đóng">✕</button></div>
      <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.55; margin:8px 0 12px;"><strong>${esc(item.company_name)}</strong><br>Bắt buộc nhập lý do từ chối để gửi thông báo tới nhà tuyển dụng (tối thiểu 10 ký tự).</p>
      <div class="verif-field" style="margin-bottom:12px;">
        <label class="verif-label" for="logo-rej-reason" style="margin-top:0;">Lý do từ chối logo *</label>
        <textarea id="logo-rej-reason" class="verif-text-input" rows="3" placeholder="Nêu rõ lý do (ảnh mờ, sai logo, vi phạm bản quyền...)" style="min-height:74px;"></textarea>
        <p id="logo-rej-hint" style="font-size:12px; color:var(--text-muted); margin:4px 0 0;">Còn thiếu 10 ký tự</p>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button type="button" class="btn btn-outline" id="logo-rej-cancel">Hủy</button>
        <button type="button" class="btn btn-primary" id="logo-rej-ok" disabled style="background:#b91c1c; border-color:#b91c1c; color:#fff;">Từ chối logo</button>
      </div>
    </div></div>`;

  const close = () => { unbind(); host.innerHTML = ""; triggerBtn?.focus(); };
  const unbind = trapFocus(host, close);
  document.getElementById("logo-rej-close")?.addEventListener("click", close);
  document.getElementById("logo-rej-cancel")?.addEventListener("click", close);
  document.getElementById("logo-rej-backdrop")?.addEventListener("click", (e) => { if (e.target.id === "logo-rej-backdrop") close(); });

  const okBtn = document.getElementById("logo-rej-ok");
  const reasonInp = document.getElementById("logo-rej-reason");
  const hintEl = document.getElementById("logo-rej-hint");

  reasonInp?.addEventListener("input", () => {
    const len = reasonInp.value.trim().length;
    okBtn.disabled = len < 10;
    if (hintEl) {
      hintEl.textContent = len >= 10 ? "Đã đủ độ dài yêu cầu." : `Còn thiếu ${10 - len} ký tự`;
      hintEl.style.color = len >= 10 ? "#166534" : "var(--text-muted)";
    }
  });

  okBtn?.addEventListener("click", async () => {
    okBtn.disabled = true;
    try {
      await window.api.post(`/admin/company-logos/${item.company_id}/reject`, { reason: reasonInp.value.trim() });
      close();
      showMessage(`Đã từ chối logo của công ty "${item.company_name}".`);
      onSuccess?.();
    } catch (err) {
      showMessage(err?.message || "Không thể từ chối logo.", true);
      okBtn.disabled = false;
    }
  });
  setTimeout(() => reasonInp?.focus(), 30);
}
