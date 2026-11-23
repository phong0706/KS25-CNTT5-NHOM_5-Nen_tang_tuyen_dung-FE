/**
 * adminVerifPanel.js - Bàn thẩm định Xác minh công ty & Hộp thoại Thu hồi có quản lý Focus/Esc.
 * Giới hạn: <= 200 dòng. Không dùng alert()/confirm().
 */
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "Chưa gửi");

let currentLicenseBlobUrl = null;
export function revokeAdminLicenseBlob() { if (currentLicenseBlobUrl) { URL.revokeObjectURL(currentLicenseBlobUrl); currentLicenseBlobUrl = null; } }

export function openReasonModal({ title, desc, confirmLabel, triggerBtn, onSubmit }) {
  const host = document.getElementById("adm-comp-modal-host");
  const returnEl = triggerBtn || document.activeElement;
  host.innerHTML = `<div class="emp-modal-backdrop" id="gov-revoke-backdrop">
    <div class="emp-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="gov-revoke-title" style="max-width:460px; width:100%;">
      <div class="emp-modal-header"><h3 id="gov-revoke-title" class="emp-modal-title">${esc(title)}</h3><button type="button" class="emp-modal-close" id="gov-revoke-close" aria-label="Đóng hộp thoại">✕</button></div>
      <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.55; margin:8px 0 12px;">${esc(desc)}</p>
      <div class="verif-field" style="margin-bottom:12px;">
        <label class="verif-label" for="input-revoke-reason">Lý do thu hồi xác minh (tối thiểu 10 ký tự) *</label>
        <textarea id="input-revoke-reason" class="verif-text-input" rows="3" placeholder="Nêu rõ căn cứ thu hồi để thông báo cho nhà tuyển dụng..." aria-describedby="err-revoke-reason" style="min-height:84px;"></textarea>
        <p id="err-revoke-reason" class="verif-field-error" role="alert"></p>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn btn-outline verif-btn" id="gov-revoke-cancel">Hủy</button>
        <button type="button" class="btn btn-primary verif-btn" id="gov-revoke-ok" style="background:#b91c1c;border-color:#b91c1c;color:#fff;">${esc(confirmLabel)}</button>
      </div>
    </div></div>`;

  const dialog = host.querySelector(".emp-modal-dialog");
  const reasonInp = document.getElementById("input-revoke-reason");
  const errEl = document.getElementById("err-revoke-reason");
  const okBtn = document.getElementById("gov-revoke-ok");
  const closeModal = () => { document.removeEventListener("keydown", onKeyDown, true); host.innerHTML = ""; if (returnEl?.focus) returnEl.focus(); };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
    if (e.key === "Tab" && dialog) {
      const focusables = dialog.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled])');
      if (!focusables.length) return;
      const [first, last] = [focusables[0], focusables[focusables.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", onKeyDown, true);

  document.getElementById("gov-revoke-close")?.addEventListener("click", closeModal);
  document.getElementById("gov-revoke-cancel")?.addEventListener("click", closeModal);
  document.getElementById("gov-revoke-backdrop")?.addEventListener("click", (e) => { if (e.target.id === "gov-revoke-backdrop") closeModal(); });

  okBtn?.addEventListener("click", async () => {
    const val = (reasonInp?.value || "").trim();
    if (val.length < 10) { errEl.textContent = "Vui lòng nhập lý do cụ thể tối thiểu 10 ký tự."; reasonInp?.setAttribute("aria-invalid", "true"); reasonInp?.focus(); return; }
    errEl.textContent = ""; okBtn.disabled = true;
    try { await onSubmit(val); closeModal(); }
    catch (err) { errEl.textContent = err?.message || "Không thể thu hồi xác minh."; okBtn.disabled = false; }
  });

  window.setTimeout(() => reasonInp?.focus(), 30);
}

export function renderVerificationBoxHtml(c) {
  const req = c.verification;
  const st = c.verification_status || "chua_xac_minh";
  if (!req) {
    return `
      <div class="verif-dossier" style="margin:14px 0 0; padding:16px;">
        <h4 style="margin:0 0 6px; font-size:15px;">Hồ sơ xác minh pháp nhân</h4>
        <p style="margin:0; font-size:13.5px; color:var(--text-secondary);">Doanh nghiệp này chưa gửi yêu cầu xác minh mã số thuế và giấy phép kinh doanh.</p>
      </div>`;
  }
  return `
    <div class="verif-dossier" style="margin:14px 0 0;">
      <div class="verif-dossier-head" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <h4 style="margin:0; font-size:15.5px;">Hồ sơ xác minh pháp nhân (Phiên bản #${req.version})</h4>
          <div class="verif-num" style="font-size:13px; color:var(--text-secondary); margin-top:3px;">
            MST đăng ký: <strong>${esc(req.mst)}</strong> · Người gửi: ${esc(req.submitted_by_name)} · Ngày gửi: ${esc(fmtTime(req.submitted_at))}
          </div>
        </div>
        <button type="button" id="btn-admin-open-license" class="btn btn-sm btn-outline verif-btn" style="min-height:38px;">Mở ảnh giấy phép</button>
      </div>
      <div id="adm-verif-inline-msg" role="status" aria-live="polite" hidden style="margin:12px 16px 0;"></div>
      <div class="verif-split-body">
        <div class="verif-form-pane">
          <div id="adm-license-stage" class="verif-license-stage">
            <span style="font-size:13px; color:var(--text-secondary); text-align:center; padding:14px;">
              Bấm nút "Mở ảnh giấy phép" để tải chứng từ riêng tư và ghi nhật ký kiểm tra.
            </span>
          </div>
        </div>
        <div class="verif-preview-pane" style="justify-content:space-between;">
          <div style="font-size:13.5px; display:flex; flex-direction:column; gap:8px;">
            <div><strong>Trạng thái hiện tại:</strong> ${esc(c.verification_label)}</div>
            <div><strong>Tệp chứng từ:</strong> <code>${esc(req.license_original_name || "giay_phep")}</code></div>
            ${req.reviewed_by_name ? `<div><strong>Người xét duyệt:</strong> ${esc(req.reviewed_by_name)} (${esc(fmtTime(req.reviewed_at))})</div>` : ""}
            ${req.rejection_reason ? `<div class="verif-reason-callout" style="margin-top:4px;"><span><strong>Lý do đã ghi:</strong> ${esc(req.rejection_reason)}</span></div>` : ""}
          </div>
          <div style="margin-top:12px;">
            ${st === "cho_duyet" ? `
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button type="button" id="btn-approve-verif" class="btn btn-primary verif-btn" style="flex:1;" disabled title="Cần tick đạt đủ toàn bộ tiêu chí kiểm tra trước khi xác minh">Xác minh</button>
                <button type="button" id="btn-toggle-reject-box" class="btn btn-outline verif-btn" style="flex:1;">Từ chối</button>
              </div>
              <div id="adm-reject-reason-box" hidden style="margin-top:12px;">
                <label class="verif-label" for="input-reject-reason">Lý do từ chối (tối thiểu 10 ký tự) *</label>
                <textarea id="input-reject-reason" class="verif-text-input" rows="3" placeholder="Ví dụ: Ảnh giấy phép bị mờ, không đọc được mã số thuế..."></textarea>
                <p id="err-reject-reason" class="verif-field-error" role="alert"></p>
                <div style="display:flex; gap:8px; margin-top:6px;">
                  <button type="button" id="btn-confirm-reject" class="btn btn-primary verif-btn" style="background:#b91c1c;border-color:#b91c1c;color:#fff;">Xác nhận từ chối</button>
                  <button type="button" id="btn-cancel-reject" class="btn btn-outline verif-btn">Hủy</button>
                </div>
              </div>
            ` : ""}
            ${st === "da_xac_minh" ? `<button type="button" id="btn-open-revoke-modal" class="btn btn-outline verif-btn" style="width:100%; color:#b91c1c; border-color:#fca5a5;">Thu hồi xác minh</button>` : ""}
          </div>
        </div>
      </div>
    </div>`;
}

export function bindVerificationBoxEvents(c, { onReload, onShowInline }) {
  const req = c.verification;
  if (!req) return;
  const idempApprove = `adm-app-${req.id}-v${req.version}`;
  const idempReject = `adm-rej-${req.id}-v${req.version}`;

  document.getElementById("btn-admin-open-license")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    const token = window.Auth?.getToken?.() || localStorage.getItem("auth_token") || "";
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    try {
      const res = await fetch(`${base}/admin/company-verifications/${req.id}/license`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Không thể mở tệp giấy phép.");
      revokeAdminLicenseBlob();
      currentLicenseBlobUrl = URL.createObjectURL(await res.blob());
      const stage = document.getElementById("adm-license-stage");
      const isPdf = req.license_mime_type === "application/pdf" || String(req.license_original_name).toLowerCase().endsWith(".pdf");
      stage.innerHTML = isPdf
        ? `<iframe src="${currentLicenseBlobUrl}" title="Giấy phép ${esc(c.name)}"></iframe>`
        : `<img src="${currentLicenseBlobUrl}" alt="Giấy phép ${esc(c.name)}">`;
      onShowInline("Đã mở chứng từ giấy phép và ghi nhật ký kiểm tra.", false);
    } catch (err) {
      onShowInline(err?.message || "Lỗi tải tệp giấy phép.", true);
    } finally { btn.disabled = false; }
  });

  document.getElementById("btn-approve-verif")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    const checked = Array.from(document.querySelectorAll(".adm-criterion-check:checked")).map((cb) => cb.dataset.code);
    try {
      await window.api.post(`/admin/company-verifications/${req.id}/approve`, { version: req.version, checked_criteria: checked }, { headers: { "Idempotency-Key": idempApprove } });
      await onReload(c.id, `Đã duyệt xác minh cho công ty ${c.name}.`);
    } catch (err) { onShowInline(err?.message || "Không thể duyệt yêu cầu.", true); btn.disabled = false; }
  });

  const rejBox = document.getElementById("adm-reject-reason-box");
  document.getElementById("btn-toggle-reject-box")?.addEventListener("click", () => {
    if (!rejBox) return;
    rejBox.hidden = !rejBox.hidden;
    if (!rejBox.hidden) document.getElementById("input-reject-reason")?.focus();
  });
  document.getElementById("btn-cancel-reject")?.addEventListener("click", () => { if (rejBox) rejBox.hidden = true; });
  document.getElementById("btn-confirm-reject")?.addEventListener("click", async (e) => {
    const inp = document.getElementById("input-reject-reason");
    const errEl = document.getElementById("err-reject-reason");
    const val = (inp?.value || "").trim();
    if (val.length < 10) {
      errEl.textContent = "Vui lòng nhập lý do từ chối tối thiểu 10 ký tự.";
      inp?.setAttribute("aria-invalid", "true"); inp?.focus(); return;
    }
    errEl.textContent = ""; e.currentTarget.disabled = true;
    try {
      await window.api.post(`/admin/company-verifications/${req.id}/reject`, { reason: val, version: req.version }, { headers: { "Idempotency-Key": idempReject } });
      await onReload(c.id, `Đã từ chối hồ sơ xác minh của ${c.name} và gửi thông báo kèm lý do.`);
    } catch (err) { errEl.textContent = err?.message || "Không thể từ chối yêu cầu."; e.currentTarget.disabled = false; }
  });

  document.getElementById("btn-open-revoke-modal")?.addEventListener("click", (e) => {
    openReasonModal({
      title: `Thu hồi xác minh: ${c.name}`,
      desc: "Các tin tuyển dụng đang mở của công ty sẽ chuyển sang trạng thái chờ xác minh lại (không bị xóa) và nhà tuyển dụng sẽ nhận thông báo kèm lý do.",
      confirmLabel: "Xác nhận thu hồi",
      triggerBtn: e.currentTarget,
      onSubmit: async (reasonText) => {
        await window.api.post(`/admin/companies/${c.id}/revoke-verification`, { reason: reasonText, version: req.version });
        await onReload(c.id, `Đã thu hồi xác minh công ty ${c.name}.`);
      },
    });
  });
}
