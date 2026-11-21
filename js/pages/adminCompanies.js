/**
 * adminCompanies.js - Quản lý Công ty & Xét duyệt Pháp nhân (pages/admin/companies.html)
 * Giới hạn: <= 200 dòng. Không dùng alert()/confirm().
 */
import { openCompanyModal } from "../components/companyDetailModal.js";
import { renderCompanyLogo } from "../components/companyLogo.js";
import { resolveLogoDisplay } from "../utils/companyDialogRules.js";

const urlInit = new URLSearchParams(window.location.search);
const state = {
  q: "",
  logoStatus: "all",
  verifStatus: urlInit.get("verif_status") || "all",
  items: [],
  counts: {},
  selectedId: null,
  viewerRole: "admin",
  initialCompanyChecked: false,
};
let searchTimer = null;

const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "—");
const FILTER_DEFS = [["all", "Tất cả"], ["cho_duyet", "Đang chờ duyệt"], ["da_xac_minh", "Đã xác minh"], ["tu_choi", "Chưa được duyệt"], ["thu_hoi", "Đã thu hồi"], ["chua_xac_minh", "Chưa xác minh"]];

const getVerifBadge = (st, label) => `<span class="gov-status-pill ${st === "da_xac_minh" ? "gov-status-pill--active" : (st === "tu_choi" || st === "thu_hoi" ? "gov-status-pill--removed" : "gov-status-pill--missing")}">${esc(label || st)}</span>`;

const renderThumb = (c) => {
  const isPending = c.logo_status === "pending" || Boolean(c.pending_logo);
  const disp = resolveLogoDisplay(c.logo_status, c.logo_full_url || c.logo_path);
  const logoUrl = isPending ? (c.pending_logo?.logo_full_url || c.logo_full_url) : (disp.showUrl ? (c.logo_full_url || c.logo_path) : null);
  const logoHtml = renderCompanyLogo({ name: c.name, slug: c.slug, logo_url: logoUrl }, { size: 40 });
  if (isPending) {
    return `<div style="display:inline-flex; align-items:center; gap:6px;">${logoHtml}<span class="gov-status-pill gov-status-pill--missing" style="font-size:11px; padding:2px 6px;">Chờ duyệt</span></div>`;
  }
  return logoHtml;
};

function renderFilterTabs() {
  const bar = document.getElementById("adm-verif-filter-bar");
  if (!bar) return;
  bar.innerHTML = FILTER_DEFS.map(([key, label]) => {
    const active = state.verifStatus === key;
    return `<button type="button" class="verif-filter-btn ${active ? "is-active" : ""}" data-verif-filter="${key}" aria-pressed="${active ? "true" : "false"}"><span>${esc(label)}</span><span class="verif-count-pill">${state.counts[key] ?? 0}</span></button>`;
  }).join("");
  bar.querySelectorAll("button[data-verif-filter]").forEach((btn) => btn.addEventListener("click", () => {
    state.verifStatus = btn.dataset.verifFilter;
    loadCompanies();
  }));
}

function handleOpenModal(companyId, triggerEl) {
  state.selectedId = companyId;
  renderTableHighlight();
  openCompanyModal(companyId, {
    triggerEl,
    viewerRole: state.viewerRole,
    onReload: async () => { await loadCompanies(companyId); },
    onClose: () => {
      state.selectedId = null;
      renderTableHighlight();
    },
  });
}

function renderTableHighlight() {
  document.querySelectorAll("#adm-comp-tbody tr[data-id]").forEach((row) => {
    const isSel = Number(row.dataset.id) === state.selectedId;
    row.classList.toggle("is-selected", isSel);
    row.setAttribute("aria-selected", isSel ? "true" : "false");
  });
}

function renderTable() {
  const tbody = document.getElementById("adm-comp-tbody");
  if (!tbody) return;
  if (!state.items.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted);">Không có công ty nào ở bộ lọc này.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.items.map((c) => {
    const req = c.verification;
    const isSel = c.id === state.selectedId;
    return `<tr class="is-clickable ${isSel ? "is-selected" : ""}" data-id="${c.id}" tabindex="0" role="button" aria-selected="${isSel ? "true" : "false"}" aria-label="Xem chi tiết ${esc(c.name)}">
      <td class="col-sticky-name"><strong>${esc(c.name)}</strong></td>
      <td class="col-sticky-status">${getVerifBadge(c.verification_status, c.verification_label)}</td>
      <td class="verif-num">${esc(req?.mst || c.tax_code || "Chưa gửi")}</td>
      <td class="verif-num">${req?.submitted_at ? esc(fmtTime(req.submitted_at)) : "—"}</td>
      <td>${esc(req?.submitted_by_name || c.employer_name)}</td>
      <td>${renderThumb(c)}</td>
      <td class="gov-num">${c.open_jobs_count ?? 0} tin</td>
      <td style="text-align:right;"><button type="button" class="btn btn-sm btn-outline btn-view-company" data-action-view="${c.id}" aria-label="Xem chi tiết ${esc(c.name)}">Xem</button></td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll("tr[data-id]").forEach((row) => {
    const id = Number(row.dataset.id);
    row.addEventListener("click", (e) => {
      if (e.target.closest(".btn-view-company")) return;
      handleOpenModal(id, row);
    });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpenModal(id, row);
      }
    });
  });

  tbody.querySelectorAll(".btn-view-company").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.actionView);
      const row = btn.closest("tr");
      handleOpenModal(id, row || btn);
    });
  });
}

async function loadCompanies(keepSelectedId = state.selectedId) {
  try {
    const res = await window.api.get("/admin/company-verifications", {
      q: state.q,
      verif_status: state.verifStatus,
      logo_status: state.logoStatus,
    });
    state.items = res.items || [];
    state.counts = res.counts || {};
    state.viewerRole = res.viewer_role || window.Auth?.getRole?.() || "admin";
    state.selectedId = keepSelectedId;
    renderFilterTabs();
    renderTable();

    // Khởi tạo mở modal từ URL (?company=<id>) đúng một lần lúc tải trang
    if (!state.initialCompanyChecked) {
      state.initialCompanyChecked = true;
      const paramCompany = urlInit.get("company");
      if (paramCompany && !Number.isNaN(Number(paramCompany))) {
        const targetRow = document.querySelector(`tr[data-id="${paramCompany}"]`);
        handleOpenModal(Number(paramCompany), targetRow);
      }
    }
  } catch (err) {
    const tbody = document.getElementById("adm-comp-tbody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:28px; color:#b91c1c;">${esc(err?.message || "Không thể tải danh sách công ty.")}</td></tr>`;
  }
}

document.getElementById("adm-comp-search")?.addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = e.target.value.trim(); loadCompanies(); }, 250);
});
document.getElementById("adm-comp-logo-filter")?.addEventListener("change", (e) => {
  state.logoStatus = e.target.value;
  loadCompanies();
});
document.getElementById("adm-comp-refresh-btn")?.addEventListener("click", () => loadCompanies());

loadCompanies();
