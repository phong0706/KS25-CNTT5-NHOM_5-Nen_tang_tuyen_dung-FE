/**
 * companyDetailModal.js - Hộp thoại Quản lý Chi tiết Công ty (pages/admin/companies.html)
 * Giới hạn: <= 200 dòng. Không dùng alert()/confirm().
 */
import { showStatusToast } from "./toast.js";
import { renderVerificationBoxHtml, bindVerificationBoxEvents, revokeAdminLicenseBlob } from "./adminVerifPanel.js";
import { openDeleteConfirmDialog } from "./companyDeleteDialog.js";
import { isDateOrderInvalid, resolveLogoDisplay, formatDateTime, getCriteriaEvaluations } from "../utils/companyDialogRules.js";
import { renderAdminCompanyLogoHtml, bindAdminCompanyLogoEvents } from "./adminCompanyLogoSection.js";

const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

function renderSkeletonHtml() {
  return `<div class="adm-dialog-header">
    <div><div class="adm-skeleton-line" style="width:260px; height:20px; margin-bottom:8px;"></div>
    <div class="adm-skeleton-line" style="width:180px; height:13px;"></div></div>
    <button type="button" class="adm-dialog-close" id="btn-close-company-dialog" aria-label="Đóng">✕</button></div>
    <div class="adm-dialog-body" style="min-height:360px;">
      <div class="adm-dialog-grid">
        <div class="adm-dialog-card"><div class="adm-skeleton-line" style="height:120px;"></div></div>
        <div class="adm-dialog-card"><div class="adm-skeleton-line" style="height:120px;"></div></div>
      </div>
      <div class="adm-skeleton-line" style="height:140px;"></div>
    </div>`;
}

export function openCompanyModal(companyId, { triggerEl, viewerRole = "admin", onReload, onClose } = {}) {
  const host = document.getElementById("adm-comp-detail-host");
  const returnEl = triggerEl || document.activeElement;
  revokeAdminLicenseBlob();
  document.body.style.overflow = "hidden";

  const u = new URL(window.location);
  u.searchParams.set("company", companyId);
  window.history.replaceState({}, "", u);

  host.innerHTML = `<div class="adm-dialog-backdrop" id="adm-company-dialog-backdrop">
    <div class="adm-company-dialog" role="dialog" aria-modal="true" aria-labelledby="adm-dialog-title" tabindex="-1">
      ${renderSkeletonHtml()}
    </div></div>`;

  const dialog = host.querySelector(".adm-company-dialog");
  const closeModal = () => {
    document.removeEventListener("keydown", onKeyDown, true);
    revokeAdminLicenseBlob();
    document.body.style.overflow = "";
    host.innerHTML = "";
    const cleanUrl = new URL(window.location);
    cleanUrl.searchParams.delete("company");
    window.history.replaceState({}, "", cleanUrl);
    if (returnEl?.focus) returnEl.focus();
    onClose?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
    if ((e.key === "j" || e.key === "J" || e.key === "k" || e.key === "K") && !["input", "textarea", "select"].includes(document.activeElement?.tagName?.toLowerCase())) {
      const rows = Array.from(document.querySelectorAll("#adm-comp-tbody tr[data-id]"));
      if (rows.length > 1) {
        const idx = rows.findIndex((r) => Number(r.dataset.id) === Number(companyId));
        if (idx !== -1) {
          const nextIdx = (e.key === "j" || e.key === "J") ? (idx + 1) % rows.length : (idx - 1 + rows.length) % rows.length;
          const nextId = Number(rows[nextIdx].dataset.id);
          if (nextId) { e.preventDefault(); closeModal(); openCompanyModal(nextId, { triggerEl: rows[nextIdx], viewerRole, onReload, onClose }); return; }
        }
      }
    }
    if (e.key === "Tab" && dialog) {
      const focusables = dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const [first, last] = [focusables[0], focusables[focusables.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", onKeyDown, true);
  host.querySelector("#adm-company-dialog-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "adm-company-dialog-backdrop") closeModal();
  });

  async function loadDetail() {
    try {
      const c = await window.api.get(`/admin/companies/${companyId}`);
      renderLoadedDialog(c);
    } catch (err) {
      dialog.innerHTML = `<div class="adm-dialog-header"><h3 class="adm-dialog-title">Lỗi tải dữ liệu</h3><button type="button" class="adm-dialog-close" id="btn-err-close">✕</button></div>
        <div class="adm-dialog-body" style="text-align:center; padding:40px 20px;">
          <p style="color:#b91c1c; margin-bottom:16px;">${esc(err?.message || "Không thể tải chi tiết công ty.")}</p>
          <button type="button" class="btn btn-outline" id="btn-dialog-retry">Thử lại</button>
        </div>`;
      dialog.querySelector("#btn-err-close")?.addEventListener("click", closeModal);
      dialog.querySelector("#btn-dialog-retry")?.addEventListener("click", () => { dialog.innerHTML = renderSkeletonHtml(); loadDetail(); });
    }
  }

  function renderLoadedDialog(c) {
    const req = c.verification;
    const isDateErr = isDateOrderInvalid(req?.submitted_at, req?.reviewed_at);
    const logoMeta = resolveLogoDisplay(c.logo_status, c.logo_full_url || c.logo_path);
    const evals = getCriteriaEvaluations(c);
    const logoFullUrl = c.logo_full_url || "";

    dialog.innerHTML = `<div class="adm-dialog-header">
      <div>
        <h3 id="adm-dialog-title" class="adm-dialog-title" tabindex="-1">${esc(c.name)}</h3>
        <p class="adm-dialog-subtitle">Mã số thuế: <strong>${esc(c.tax_code || req?.mst || "Chưa có")}</strong> · Chủ sở hữu: ${esc(c.employer_name || "Chưa gán")} (${esc(c.employer_email || "N/A")})</p>
      </div>
      <button type="button" class="adm-dialog-close" id="btn-close-company-dialog" aria-label="Đóng hộp thoại">✕</button>
    </div>
    <div class="adm-dialog-body">
      ${isDateErr ? `<div class="adm-dialog-warning-callout" role="alert"><span>⚠️ Dữ liệu thời gian không hợp lệ. Cần kiểm tra.</span></div>` : ""}
      <div class="adm-dialog-grid">
        <div class="adm-dialog-card">
          <h4 class="adm-dialog-section-title">Thông tin doanh nghiệp</h4>
          <div style="font-size:13px; display:flex; flex-direction:column; gap:8px;">
            <div><strong>Website:</strong> ${c.website ? `<a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website)}</a>` : "Chưa cập nhật"}</div>
            <div><strong>Địa chỉ:</strong> ${esc(c.address || "Chưa cập nhật")}</div>
            <div><strong>Tin tuyển dụng đang mở:</strong> <span class="gov-num" id="dialog-open-jobs-count">${c.open_jobs_count ?? 0}</span> tin</div>
            <div><strong>Ngày gửi hồ sơ:</strong> ${formatDateTime(req?.submitted_at)}</div>
            <div><strong>Ngày duyệt hồ sơ:</strong> ${formatDateTime(req?.reviewed_at)}</div>
            <div><strong>Người duyệt:</strong> ${esc(req?.reviewed_by_name || "Chưa có")}</div>
          </div>
        </div>
        <div class="adm-dialog-card">
          <h4 class="adm-dialog-section-title">Tiêu chí xác thực</h4>
          <div class="adm-dialog-criteria-list">
            ${evals.map((ev) => `<div class="adm-dialog-criteria-item"><span>${esc(ev.name)}</span><span class="adm-criteria-status-badge ${ev.pass ? "adm-criteria-status--pass" : (ev.statusText.includes("Còn") ? "adm-criteria-status--info" : "adm-criteria-status--fail")}">${esc(ev.statusText)}</span></div>`).join("")}
          </div>
        </div>
      </div>
      ${renderVerificationBoxHtml(c)}
      ${renderAdminCompanyLogoHtml(c)}
    </div>
    <div class="adm-dialog-footer">
      <div></div>
      <div style="display:flex; gap:8px;">
        ${viewerRole === "admin" ? `<button type="button" id="btn-dialog-delete-company" class="adm-btn-danger-outline">Xóa công ty</button>` : ""}
        <button type="button" id="btn-dialog-close-footer" class="btn btn-outline">Đóng</button>
      </div>
    </div>`;

    dialog.querySelector("#btn-close-company-dialog")?.addEventListener("click", closeModal);
    dialog.querySelector("#btn-dialog-close-footer")?.addEventListener("click", closeModal);
    dialog.querySelector("#btn-dialog-delete-company")?.addEventListener("click", (e) => {
      openDeleteConfirmDialog({
        targetName: c.name, companyId: c.id, triggerBtn: e.currentTarget,
        onSuccess: async () => { closeModal(); await onReload?.(); showStatusToast("Đã xóa công ty thành công.", "success"); },
      });
    });

    bindVerificationBoxEvents(c, {
      onShowInline: (msg, isErr) => {
        const box = document.getElementById("adm-verif-inline-msg");
        if (box) { box.hidden = false; box.className = `gov-alert ${isErr ? "gov-alert--error" : "gov-alert--success"}`; box.textContent = msg; }
      },
      onReload: async (_id, bannerMsg) => {
        await onReload?.();
        loadDetail();
        if (bannerMsg) showStatusToast(bannerMsg, "success");
      },
    });

    bindAdminCompanyLogoEvents(c, {
      onReload: async () => {
        await onReload?.();
        loadDetail();
      },
    });
    window.setTimeout(() => dialog.querySelector("#adm-dialog-title")?.focus?.(), 25);
  }

  loadDetail();
}
