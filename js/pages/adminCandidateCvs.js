/**
 * adminCandidateCvs.js - Quản lý & Xem CV ứng viên cho khu quản trị (/pages/admin/candidate-cvs.html)
 * Bấm xem CV qua endpoint quản trị GET /api/admin/candidate-cvs/{app_id}/file, không đưa token vào URL.
 * Giới hạn: < 200 dòng.
 */
const state = { q: "", items: [], currentBlobUrl: null };
let searchTimer = null;
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-");

const STATUS_LABELS = {
  submitted: "Đã nộp",
  screening: "Đang xem xét",
  interview: "Phỏng vấn",
  offered: "Đề nghị nhận việc",
  rejected: "Không phù hợp",
  withdrawn: "Đã rút",
};

function revokeCurrentBlob() {
  if (state.currentBlobUrl) {
    URL.revokeObjectURL(state.currentBlobUrl);
    state.currentBlobUrl = null;
  }
}

async function openCvViaAdminEndpoint(item) {
  const host = document.getElementById("adm-cv-viewer-host");
  if (!host) return;
  revokeCurrentBlob();
  host.style.display = "block";
  host.innerHTML = `<div class="gov-detail-panel">Đang tải tệp CV <strong>${esc(item.cv_name)}</strong> và ghi nhật ký truy cập...</div>`;

  const token = window.Auth?.getToken?.() || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${base}/admin/candidate-cvs/${item.application_id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || "Không mở được tệp CV. Hãy thử lại hoặc liên hệ quản trị viên.");
    }
    const blob = await res.blob();
    state.currentBlobUrl = URL.createObjectURL(blob);
    const isPdf = (blob.type && blob.type.includes("pdf")) || (item.cv_name || "").toLowerCase().endsWith(".pdf");

    host.innerHTML = `
      <div class="gov-detail-panel" role="region" aria-label="Bản xem trước CV ${esc(item.candidate_name)}">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div>
            <strong>${esc(item.candidate_name)}</strong> · <span>${esc(item.job_title)}</span>
            <div style="font-size:12px; color:var(--text-muted);">Tệp: ${esc(item.cv_name)} (Đã ghi nhận vào Nhật ký thay đổi)</div>
          </div>
          <div style="display:flex; gap:8px;">
            <a href="${state.currentBlobUrl}" download="${esc(item.cv_name)}" class="btn btn-sm btn-outline">Tải về máy</a>
            <button type="button" id="btn-close-cv-viewer" class="btn btn-sm btn-outline">Đóng khung xem</button>
          </div>
        </div>
        ${isPdf
          ? `<iframe src="${state.currentBlobUrl}" title="Xem CV ${esc(item.cv_name)}" style="width:100%; height:460px; border:1px solid var(--border-default); border-radius:8px; background:#fff;"></iframe>`
          : `<div class="gov-alert gov-alert--success">Đã tải tệp CV an toàn qua bộ nhớ trình duyệt. Định dạng này không hiển thị trực tiếp, vui lòng bấm <strong>Tải về máy</strong> ở trên.</div>`}
      </div>`;

    document.getElementById("btn-close-cv-viewer")?.addEventListener("click", () => {
      revokeCurrentBlob();
      host.style.display = "none";
      host.innerHTML = "";
    });
  } catch (err) {
    host.innerHTML = `
      <div class="gov-alert gov-alert--error" role="alert" style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <span>${esc(err.message || "Lỗi mở CV.")}</span>
        <button type="button" id="btn-retry-admin-cv" class="btn btn-sm btn-outline">Thử lại</button>
      </div>`;
    document.getElementById("btn-retry-admin-cv")?.addEventListener("click", () => openCvViaAdminEndpoint(item));
  }
}

function renderTable() {
  const tbody = document.getElementById("adm-cv-tbody");
  if (!state.items.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">Không có CV ứng viên nào khớp tìm kiếm.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.items.map((item) => `
    <tr data-app-id="${item.application_id}">
      <td class="col-sticky-name">
        <strong>${esc(item.candidate_name)}</strong>
        <div style="font-size:12px; color:var(--text-muted);">${esc(item.candidate_email)}</div>
      </td>
      <td class="col-sticky-status">
        <span class="gov-status-pill gov-status-pill--active">${esc(STATUS_LABELS[item.status] || item.status)}</span>
      </td>
      <td>
        <strong>${esc(item.job_title)}</strong>
        <div style="font-size:12px; color:var(--text-muted);">${esc(item.company_name)}</div>
      </td>
      <td><code>${esc(item.cv_name)}</code></td>
      <td class="gov-num">${fmtDate(item.submitted_at)}</td>
      <td style="text-align: right;">
        <button type="button" class="btn btn-sm btn-primary btn-admin-open-cv" data-app-id="${item.application_id}">Xem CV</button>
      </td>
    </tr>`).join("");

  tbody.querySelectorAll(".btn-admin-open-cv").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = state.items.find((x) => x.application_id === Number(btn.dataset.appId));
      if (target) openCvViaAdminEndpoint(target);
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

document.getElementById("adm-cv-search")?.addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = e.target.value.trim(); loadCandidateCvs(); }, 250);
});
document.getElementById("adm-cv-refresh")?.addEventListener("click", loadCandidateCvs);
window.addEventListener("beforeunload", revokeCurrentBlob);

loadCandidateCvs();
