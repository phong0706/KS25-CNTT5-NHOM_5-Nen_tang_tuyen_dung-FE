/**
 * adminCandidateCvs.js - Quản lý & Xem CV ứng viên cho khu quản trị (/pages/admin/candidate-cvs.html)
 * Bấm xem CV qua endpoint quản trị GET /api/admin/candidate-cvs/{app_id}/file, gửi header Authorization,
 * không đưa token vào URL. Giới hạn: < 200 dòng.
 */
const state = { q: "", items: [], currentBlobUrl: null, lastTriggerBtn: null };
let searchTimer = null;
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-");

const STATUS_LABELS = {
  submitted: "Đã nộp", screening: "Đang xem xét", interview: "Phỏng vấn",
  offered: "Đề nghị nhận việc", rejected: "Không phù hợp", withdrawn: "Đã rút",
};

function getAuthToken() {
  return window.AuthCore?.getSession?.()?.token || window.Auth?.getToken?.() || localStorage.getItem("auth_token") || localStorage.getItem("access_token") || "";
}

function revokeCurrentBlob() {
  if (state.currentBlobUrl) {
    URL.revokeObjectURL(state.currentBlobUrl);
    state.currentBlobUrl = null;
  }
}

function closeCvViewer() {
  const host = document.getElementById("adm-cv-viewer-host");
  revokeCurrentBlob();
  document.querySelectorAll("tr.adm-cv-error-row").forEach((r) => r.remove());
  if (host) { host.style.display = "none"; host.innerHTML = ""; }
  if (state.lastTriggerBtn && typeof state.lastTriggerBtn.focus === "function") state.lastTriggerBtn.focus();
}

function renderInlineRowError(appId, statusCode, onRetry) {
  document.querySelectorAll("tr.adm-cv-error-row").forEach((r) => r.remove());
  const row = document.querySelector(`tr[data-app-id="${appId}"]`);
  const canRetry = statusCode === 0 || statusCode >= 500;
  let msg = "Không mở được CV. Thử lại sau, hoặc báo quản trị viên.";
  if (statusCode === 403) msg = "Bạn không có quyền xem CV này.";
  else if (statusCode === 404) msg = "Không tìm thấy file CV. Có thể file đã bị xóa hoặc đường dẫn sai.";

  const errHtml = `
    <div class="gov-alert gov-alert--error" role="alert" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <span>${esc(msg)}</span>
      <div style="display:flex; gap:8px;">
        ${canRetry ? `<button type="button" class="btn btn-sm btn-outline btn-retry-inline-cv">Thử lại</button>` : ""}
        <button type="button" class="btn btn-sm btn-outline btn-dismiss-inline-cv">Đóng</button>
      </div>
    </div>`;

  if (row) {
    const tr = document.createElement("tr");
    tr.className = "adm-cv-error-row";
    tr.innerHTML = `<td colspan="6" style="padding:8px 14px; background:#fffafa;">${errHtml}</td>`;
    row.insertAdjacentElement("afterend", tr);
    tr.querySelector(".btn-retry-inline-cv")?.addEventListener("click", onRetry);
    tr.querySelector(".btn-dismiss-inline-cv")?.addEventListener("click", () => tr.remove());
  }
}

async function openCvViaAdminEndpoint(item, triggerBtn) {
  const host = document.getElementById("adm-cv-viewer-host");
  if (!host || !item.cv_id || triggerBtn?.disabled) return;

  state.lastTriggerBtn = triggerBtn || state.lastTriggerBtn;
  document.querySelectorAll("tr.adm-cv-error-row").forEach((r) => r.remove());
  revokeCurrentBlob();

  const origLabel = triggerBtn ? triggerBtn.textContent : "Xem CV";
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.setAttribute("aria-busy", "true");
    triggerBtn.textContent = "Đang tải...";
  }

  const token = getAuthToken();
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";

  try {
    const res = await fetch(`${base}/admin/candidate-cvs/${item.application_id}/file`, {
      method: "GET", headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      host.style.display = "none"; host.innerHTML = "";
      renderInlineRowError(item.application_id, res.status, () => openCvViaAdminEndpoint(item, triggerBtn));
      return;
    }

    const blob = await res.blob();
    state.currentBlobUrl = URL.createObjectURL(blob);
    const cvName = item.cv_name || "CV.pdf";
    const isPdf = (blob.type && blob.type.includes("pdf")) || cvName.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      const a = document.createElement("a");
      a.href = state.currentBlobUrl; a.download = cvName;
      document.body.appendChild(a); a.click(); a.remove();
    }

    const tableScroll = document.querySelector(".gov-table-scroll");
    if (tableScroll && host.nextElementSibling !== tableScroll) {
      tableScroll.parentNode.insertBefore(host, tableScroll);
      host.style.margin = "0 0 16px 0";
    }
    host.style.display = "block";
    host.innerHTML = `
      <div class="gov-detail-panel" id="adm-cv-modal-panel" role="region" aria-label="Bản xem trước CV ${esc(item.candidate_name)}" style="margin-top:0; max-width:100%; box-sizing:border-box;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div style="min-width:0;">
            <strong>${esc(item.candidate_name)}</strong> · <span>${esc(item.job_title)}</span>
            <div style="font-size:12px; color:var(--text-muted); word-break:break-word;">Tệp: ${esc(cvName)} (Đã ghi nhận vào Nhật ký thay đổi)</div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <a href="${state.currentBlobUrl}" download="${esc(cvName)}" class="btn btn-sm btn-outline">Tải về máy</a>
            <button type="button" id="btn-close-cv-viewer" class="btn btn-sm btn-outline">Đóng khung xem</button>
          </div>
        </div>
        ${isPdf
          ? `<iframe src="${state.currentBlobUrl}" title="Xem CV ${esc(cvName)}" style="width:100%; max-width:100%; height:440px; border:1px solid var(--border-default); border-radius:8px; background:#fff; display:block;"></iframe>`
          : `<div class="gov-alert gov-alert--success">Đã tự động tải tệp <strong>${esc(cvName)}</strong> về máy vì định dạng DOC/TXT không hiển thị trực tiếp trong trình duyệt.</div>`}
      </div>`;

    const closeBtn = document.getElementById("btn-close-cv-viewer");
    closeBtn?.addEventListener("click", closeCvViewer);
    host.scrollIntoView({ behavior: "smooth", block: "nearest" });
    closeBtn?.focus({ preventScroll: true });
  } catch {
    host.style.display = "none"; host.innerHTML = "";
    renderInlineRowError(item.application_id, 0, () => openCvViaAdminEndpoint(item, triggerBtn));
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.removeAttribute("aria-busy");
      triggerBtn.textContent = origLabel;
    }
  }
}

function renderTable() {
  const tbody = document.getElementById("adm-cv-tbody");
  if (!state.items.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">Không có CV ứng viên nào khớp tìm kiếm.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.items.map((item) => {
    const hasCv = Boolean(item.cv_id);
    return `
    <tr data-app-id="${item.application_id}">
      <td class="col-sticky-name"><strong>${esc(item.candidate_name)}</strong><div style="font-size:12px; color:var(--text-muted);">${esc(item.candidate_email)}</div></td>
      <td class="col-sticky-status"><span class="gov-status-pill gov-status-pill--active">${esc(STATUS_LABELS[item.status] || item.status)}</span></td>
      <td><strong>${esc(item.job_title)}</strong><div style="font-size:12px; color:var(--text-muted);">${esc(item.company_name)}</div></td>
      <td>${hasCv ? `<code>${esc(item.cv_name)}</code>` : `<span style="color:var(--text-muted); font-size:12.5px;">Chưa có CV</span>`}</td>
      <td class="gov-num">${fmtDate(item.submitted_at)}</td>
      <td style="text-align: right; white-space: nowrap;">
        ${hasCv
          ? `<button type="button" class="btn btn-sm btn-primary btn-admin-open-cv" data-app-id="${item.application_id}">Xem CV</button>`
          : `<button type="button" class="btn btn-sm btn-outline btn-admin-open-cv" disabled aria-disabled="true" title="Chưa có CV">Chưa có CV</button>`}
      </td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll(".btn-admin-open-cv:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = state.items.find((x) => x.application_id === Number(btn.dataset.appId));
      if (target) openCvViaAdminEndpoint(target, btn);
    });
  });
}

async function loadCandidateCvs() {
  try {
    const res = await window.api.get("/admin/candidate-cvs", { q: state.q });
    state.items = res.items || [];
    renderTable();
  } catch (err) {
    document.getElementById("adm-cv-tbody").innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px; color:#b91c1c;">${esc(err?.message || "Lỗi tải danh sách CV.")}</td></tr>`;
  }
}

document.addEventListener("keydown", (e) => {
  const host = document.getElementById("adm-cv-viewer-host");
  if (e.key === "Escape" && host && host.style.display !== "none" && host.innerHTML.trim() !== "") {
    e.preventDefault(); closeCvViewer();
  }
});
document.getElementById("adm-cv-search")?.addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = e.target.value.trim(); loadCandidateCvs(); }, 250);
});
document.getElementById("adm-cv-refresh")?.addEventListener("click", loadCandidateCvs);
window.addEventListener("beforeunload", revokeCurrentBlob);

loadCandidateCvs();
