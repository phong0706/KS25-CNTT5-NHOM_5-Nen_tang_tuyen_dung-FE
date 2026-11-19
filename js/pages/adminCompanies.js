/**
 * adminCompanies.js - Quản lý Công ty, Xét duyệt Xác minh pháp nhân & Logo (pages/admin/companies.html)
 * Giới hạn: <= 200 dòng. Không dùng alert()/confirm().
 */
import { showStatusToast } from "../components/toast.js";
import { renderVerificationBoxHtml, bindVerificationBoxEvents, revokeAdminLicenseBlob } from "../components/adminVerifPanel.js";
import { renderAdminCriteriaHtml, bindAdminCriteriaEvents, bindAdminCriteriaToggles } from "../components/adminCriteriaPanel.js";

const FILTER_DEFS = [["all", "Tất cả"], ["cho_duyet", "Đang chờ duyệt"], ["da_xac_minh", "Đã xác minh"], ["tu_choi", "Chưa được duyệt"], ["thu_hoi", "Đã thu hồi"], ["chua_xac_minh", "Chưa xác minh"]];
const urlInit = new URLSearchParams(window.location.search);
const initVerif = urlInit.get("verif_status") || "all";
const state = { q: "", logoStatus: "all", verifStatus: FILTER_DEFS.some(([k]) => k === initVerif) ? initVerif : "all", hasUnchecked: false, hasOpenReports: false, items: [], counts: {}, selectedId: null, viewerRole: "admin" };
let searchTimer = null;
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "—");
const getVerifBadge = (st, label) => `<span class="gov-status-pill ${st === "da_xac_minh" ? "gov-status-pill--active" : (st === "tu_choi" || st === "thu_hoi" ? "gov-status-pill--removed" : "gov-status-pill--missing")}">${esc(label || st)}</span>`;

function syncUrlParams(push = false) {
  const url = new URL(window.location.href);
  if (state.verifStatus && state.verifStatus !== "all") url.searchParams.set("verif_status", state.verifStatus);
  else url.searchParams.delete("verif_status");
  const next = url.pathname + url.search;
  if (window.location.pathname + window.location.search !== next) {
    if (push) window.history.pushState({}, "", next);
    else window.history.replaceState({}, "", next);
  }
}

function getLogoStatusMeta(st) {
  if (st === "active") return { label: "Đang sử dụng", cls: "gov-status-pill--active" };
  return st === "removed" ? { label: "Đã gỡ", cls: "gov-status-pill--removed" } : { label: "Chưa có logo", cls: "gov-status-pill--missing" };
}

const renderThumb = (c) => (c.logo_full_url && c.logo_status === "active" ? `<span class="gov-logo-thumb"><img src="${esc(c.logo_full_url)}" alt="Logo ${esc(c.name)}" loading="lazy"></span>` : `<span class="gov-logo-thumb" title="Chưa kích hoạt ảnh logo">${esc(c.name.slice(0, 2).toUpperCase())}</span>`);

function openConfirmDialog({ title, desc, confirmLabel, danger = false, triggerBtn, onConfirm }) {
  const host = document.getElementById("adm-comp-modal-host");
  const returnEl = triggerBtn || document.activeElement;
  host.innerHTML = `<div class="emp-modal-backdrop" id="gov-confirm-backdrop"><div class="emp-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="gov-confirm-title" style="max-width:440px;">
    <div class="emp-modal-header"><h3 id="gov-confirm-title" class="emp-modal-title">${esc(title)}</h3><button type="button" class="emp-modal-close" aria-label="Đóng">✕</button></div>
    <p style="font-size:14px; color:var(--text-secondary); line-height:1.6; margin:8px 0 18px;">${esc(desc)}</p>
    <div style="display:flex; justify-content:flex-end; gap:8px;">
      <button type="button" class="btn btn-outline" id="gov-confirm-cancel">Hủy</button>
      <button type="button" class="btn ${danger ? "btn-danger" : "btn-primary"}" id="gov-confirm-ok" style="${danger ? "background:#dc2626;color:#fff;border-color:#dc2626;" : ""}">${esc(confirmLabel)}</button>
    </div></div></div>`;
  const close = () => { host.innerHTML = ""; returnEl?.focus?.(); };
  host.querySelector(".emp-modal-close")?.addEventListener("click", close);
  host.querySelector("#gov-confirm-cancel")?.addEventListener("click", close);
  host.querySelector("#gov-confirm-ok")?.addEventListener("click", async () => { await onConfirm(); close(); });
  host.querySelector("#gov-confirm-cancel")?.focus();
}

function validateLogoClient(file) {
  if (!file) return Promise.resolve("Vui lòng chọn một tệp ảnh.");
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!["png", "webp"].includes(ext) || !["image/png", "image/webp"].includes(file.type)) return Promise.resolve("Chỉ chấp nhận ảnh PNG hoặc WebP.");
  if (file.size > 200 * 1024) return Promise.resolve("Tệp vượt quá 200 KB.");
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.width > 512 || img.height > 512 ? "Kích thước tối đa 512x512 px." : null); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve("Tệp không phải ảnh PNG/WebP hợp lệ."); };
    img.src = url;
  });
}

function renderFilterTabs() {
  const bar = document.getElementById("adm-verif-filter-bar");
  if (!bar) return;
  bar.innerHTML = FILTER_DEFS.map(([key, label]) => {
    const active = state.verifStatus === key;
    return `<button type="button" class="verif-filter-btn ${active ? "is-active" : ""}" data-verif-filter="${key}" aria-pressed="${active ? "true" : "false"}"><span>${esc(label)}</span><span class="verif-count-pill">${state.counts[key] ?? 0}</span></button>`;
  }).join("");
  bar.querySelectorAll("button[data-verif-filter]").forEach((btn) => btn.addEventListener("click", () => {
    state.verifStatus = btn.dataset.verifFilter;
    syncUrlParams(true);
    renderFilterTabs();
    loadCompanies();
  }));
}

function renderDetailPanel(c) {
  const host = document.getElementById("adm-comp-detail-host");
  revokeAdminLicenseBlob();
  if (!c) { host.innerHTML = ""; return; }
  const st = getLogoStatusMeta(c.logo_status);
  const fullUrl = c.logo_full_url || "Chưa có đường dẫn logo";
  const previewHtml = c.logo_full_url && c.logo_status === "active"
    ? `<img src="${esc(c.logo_full_url)}" alt="Logo ${esc(c.name)}">`
    : `<span style="font-size:12px; font-weight:600; color:var(--text-muted); text-align:center; padding:8px;">${esc(st.label)}</span>`;

  host.innerHTML = `<div class="gov-detail-panel" id="adm-comp-detail-panel" role="region" aria-label="Chi tiết công ty ${esc(c.name)}">
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid var(--border-default); padding-bottom:12px;">
      <div><h3 style="margin:0; font-size:17px; font-weight:700;">Chi tiết công ty: ${esc(c.name)}</h3><span style="font-size:13px; color:var(--text-muted);">Mã công ty #${c.id} · Chủ sở hữu: ${esc(c.employer_name)} (${esc(c.employer_email)})</span></div>
      <div style="display:flex; gap:8px;">${state.viewerRole === "admin" ? `<button type="button" id="btn-delete-company" class="btn btn-sm btn-outline" style="color:#b91c1c; border-color:#fca5a5;">Xóa công ty</button>` : ""}<button type="button" id="btn-close-detail" class="btn btn-sm btn-outline">Đóng chi tiết</button></div>
    </div>
    ${renderVerificationBoxHtml(c)}
    ${renderAdminCriteriaHtml(c)}
    <div class="gov-detail-grid" style="margin-top:16px;">
      <div class="gov-logo-box">
        <div style="display:flex; gap:14px; align-items:center;">
          <div class="gov-logo-preview-stage" id="detail-logo-preview">${previewHtml}</div>
          <div style="flex:1; display:flex; flex-direction:column; gap:6px; font-size:13px;">
            <div><strong>Trạng thái logo:</strong> <span class="gov-status-pill ${st.cls}" id="detail-logo-status">${esc(st.label)}</span></div>
            <div><strong>Người tải lên:</strong> <span id="detail-logo-uploader">${esc(c.logo_uploaded_by_name || "Chưa ghi nhận")}</span></div>
          </div>
        </div>
        <div class="gov-url-copy-row"><input type="text" id="detail-logo-url-input" class="gov-url-input" value="${esc(fullUrl)}" readonly aria-label="Đường dẫn đầy đủ của logo"><button type="button" id="btn-copy-logo-url" class="btn btn-sm btn-outline" ${!c.logo_full_url ? "disabled" : ""}>Sao chép</button></div>
        <div id="detail-logo-feedback" role="alert" style="display:none;"></div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;"><input type="file" id="input-upload-logo" accept="image/png,image/webp" hidden><button type="button" id="btn-trigger-upload-logo" class="btn btn-sm btn-primary">Thay logo</button><button type="button" id="btn-remove-logo" class="btn btn-sm btn-outline" ${c.logo_status !== "active" ? "disabled" : ""}>Gỡ logo</button></div>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; font-size:13.5px;">
        <div><strong>Mã số thuế trên hồ sơ:</strong> <span class="verif-num">${esc(c.tax_code || "Chưa có")}</span></div>
        <div><strong>Số tin tuyển dụng đang mở:</strong> <span class="gov-num">${c.open_jobs_count}</span> tin</div>
        <div><strong>Website:</strong> ${c.website ? `<a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website)}</a>` : "Chưa cập nhật"}</div>
        <div><strong>Địa chỉ:</strong> ${esc(c.address || "Chưa cập nhật")}</div>
      </div>
    </div>
  </div>`;

  const showVerifInline = (msg, isErr = false) => {
    const box = document.getElementById("adm-verif-inline-msg");
    if (box) { box.hidden = false; box.className = `gov-alert ${isErr ? "gov-alert--error" : "gov-alert--success"}`; box.textContent = msg; }
  };
  const reloadWithBanner = async (keepId, bannerMsg) => {
    await loadCompanies(keepId);
    const g = document.getElementById("adm-comp-global-msg");
    if (g && bannerMsg) { g.hidden = false; g.className = "gov-alert gov-alert--success"; g.textContent = bannerMsg; }
  };
  bindVerificationBoxEvents(c, { onShowInline: showVerifInline, onReload: reloadWithBanner });
  bindAdminCriteriaEvents(c, { onShowInline: showVerifInline, onReload: reloadWithBanner });

  const fb = document.getElementById("detail-logo-feedback");
  const showLogoFb = (msg, isErr = true) => { fb.style.display = "block"; fb.className = `gov-alert ${isErr ? "gov-alert--error" : "gov-alert--success"}`; fb.textContent = msg; };
  document.getElementById("btn-close-detail")?.addEventListener("click", () => { state.selectedId = null; renderTable(); host.innerHTML = ""; });
  document.getElementById("btn-copy-logo-url")?.addEventListener("click", async () => { if (c.logo_full_url) { try { await navigator.clipboard.writeText(c.logo_full_url); } catch {} showLogoFb("Đã sao chép đường dẫn logo.", false); } });

  const fileInput = document.getElementById("input-upload-logo");
  document.getElementById("btn-trigger-upload-logo")?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0]; fileInput.value = "";
    if (!file) return;
    const err = await validateLogoClient(file);
    if (err) return showLogoFb(err, true);
    const fd = new FormData(); fd.append("file", file);
    const token = window.Auth?.getToken?.() || "", base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const res = await fetch(`${base}/admin/companies/${c.id}/logo`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return showLogoFb(data.detail || "Không thể tải lên logo.", true);
    await loadCompanies(c.id); showLogoFb("Đã cập nhật logo công ty.", false);
  });

  document.getElementById("btn-remove-logo")?.addEventListener("click", (e) => openConfirmDialog({
    title: "Xác nhận gỡ logo công ty", desc: `Gỡ trạng thái hiển thị logo của "${c.name}" (tệp vật lý vẫn được giữ nguyên)?`,
    confirmLabel: "Xác nhận gỡ logo", triggerBtn: e.currentTarget,
    onConfirm: async () => { await window.api.post(`/admin/companies/${c.id}/logo/remove`, {}); await loadCompanies(c.id); showStatusToast("Đã chuyển logo sang Đã gỡ.", "success"); },
  }));
  document.getElementById("btn-delete-company")?.addEventListener("click", (e) => openConfirmDialog({
    title: "Xóa công ty khỏi hệ thống", desc: `Xóa công ty "${c.name}"? Chỉ Quản trị viên cấp cao mới có quyền thực hiện.`,
    confirmLabel: "Xóa vĩnh viễn", danger: true, triggerBtn: e.currentTarget,
    onConfirm: async () => { await window.api.delete(`/admin/companies/${c.id}`); state.selectedId = null; await loadCompanies(); showStatusToast("Đã xóa công ty.", "success"); },
  }));
}

function renderTable() {
  const tbody = document.getElementById("adm-comp-tbody");
  if (!state.items.length) { tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:var(--text-muted);">Không có công ty nào ở bộ lọc này.</td></tr>`; return; }
  tbody.innerHTML = state.items.map((c) => `
    <tr class="is-clickable ${c.id === state.selectedId ? "is-selected" : ""}" data-id="${c.id}" tabindex="0" role="button" aria-label="Xem chi tiết ${esc(c.name)}">
      <td class="col-sticky-name"><strong>${esc(c.name)}</strong></td><td class="col-sticky-status">${getVerifBadge(c.verification_status, c.verification_label)}</td>
      <td class="verif-num">${esc(c.criteria_summary ? `${c.criteria_summary.passed_count}/${c.criteria_summary.checked_count} đạt` : "—")}</td><td class="verif-num">${esc(c.criteria_summary ? `${c.criteria_summary.unchecked_count} chưa KT` : "—")}</td>
      <td class="verif-num">${esc(c.verification?.mst || c.tax_code || "Chưa gửi")}</td><td class="verif-num">${c.verification?.submitted_at ? esc(fmtTime(c.verification.submitted_at)) : "—"}</td>
      <td>${esc(c.verification?.submitted_by_name || c.employer_name)}</td><td>${renderThumb(c)}</td><td class="gov-num">${c.open_jobs_count} tin</td>
    </tr>`).join("");
  tbody.querySelectorAll("tr[data-id]").forEach((row) => {
    const selectRow = () => { state.selectedId = Number(row.dataset.id); renderTable(); renderDetailPanel(state.items.find((x) => x.id === state.selectedId)); };
    row.addEventListener("click", selectRow);
    row.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectRow(); } });
  });
}

async function loadCompanies(keepSelectedId = state.selectedId) {
  syncUrlParams();
  try {
    const res = await window.api.get("/admin/company-verifications", { q: state.q, verif_status: state.verifStatus, logo_status: state.logoStatus, has_unchecked: state.hasUnchecked || undefined, has_open_reports: state.hasOpenReports || undefined });
    state.items = res.items || []; state.counts = res.counts || {};
    state.viewerRole = res.viewer_role || window.Auth?.getRole?.() || "admin";
    state.selectedId = keepSelectedId;
    renderFilterTabs(); renderTable(); renderDetailPanel(state.items.find((x) => x.id === state.selectedId) || null);
  } catch (err) {
    document.getElementById("adm-comp-tbody").innerHTML = `<tr><td colspan="9" style="text-align:center; padding:28px; color:#b91c1c;">${esc(err?.message || "Không thể tải danh sách công ty.")}</td></tr>`;
  }
}

window.addEventListener("popstate", () => {
  const p = new URLSearchParams(window.location.search).get("verif_status") || "all";
  if (state.verifStatus !== p) { state.verifStatus = FILTER_DEFS.some(([k]) => k === p) ? p : "all"; renderFilterTabs(); loadCompanies(); }
});

bindAdminCriteriaToggles(state, () => loadCompanies());
document.getElementById("adm-comp-search")?.addEventListener("input", (e) => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { state.q = e.target.value.trim(); loadCompanies(); }, 250); });
document.getElementById("adm-comp-logo-filter")?.addEventListener("change", (e) => { state.logoStatus = e.target.value; loadCompanies(); });
document.getElementById("adm-comp-refresh-btn")?.addEventListener("click", () => loadCompanies());
loadCompanies();
