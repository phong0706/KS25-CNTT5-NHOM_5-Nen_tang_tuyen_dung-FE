/**
 * adminAuditLogs.js - Nhật ký thay đổi khu quản trị (/pages/admin/audit-logs.html)
 * Đáp ứng: Phương án A (dữ liệu test), nhãn tiếng Việt, che MST/dữ liệu nhạy cảm,
 * thứ tự id giảm dần, thời gian dd/mm/yyyy hh:mm:ss, modal chi tiết, < 200 dòng.
 */
const state = { q: "", targetType: "all", hideTest: true, rawItems: [] };
let searchTimer = null, currentTrigger = null;

const pad = (n) => String(n).padStart(2, "0");
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

function fmtDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const ACTION_LABELS = {
  submit_verification: "Gửi xác minh", approve_verification: "Duyệt xác minh",
  revoke_verification: "Thu hồi xác minh", mst_changed_reverify: "Đổi mã số thuế, cần xác minh lại",
  reject_verification: "Từ chối xác minh", view_license: "Xem giấy phép",
  upload_logo: "Tải logo mới", replace_logo: "Thay logo", remove_logo: "Gỡ logo",
  view_cv: "Mở xem CV", delete_company: "Xóa công ty",
};
const RISK_ACTIONS = new Set(["revoke_verification", "reject_verification", "delete_company"]);
const STATUS_LABELS = {
  da_xac_minh: "Đã xác minh", cho_duyet: "Chờ duyệt",
  thu_hoi: "Đã thu hồi", chua_xac_minh: "Chưa xác minh", tu_choi: "Từ chối",
};
const ROLE_LABELS = {
  admin: "Quản trị viên", employer: "Nhà tuyển dụng",
  candidate: "Ứng viên", operator: "Chuyên viên vận hành",
};
const TARGET_LABELS = {
  company_verification: "Xác minh công ty", company_license: "Giấy phép công ty",
  company_logo: "Logo công ty", candidate_cv: "CV ứng viên", company: "Công ty",
};

const isTestRecord = (r) => Boolean(r.is_test);

function formatAuditValue(val, mask = true) {
  if (!val) return "";
  let s = String(val);
  for (const [k, v] of Object.entries(STATUS_LABELS)) s = s.replaceAll(k, v);
  if (mask) {
    s = s.replace(/\b\d{6}(\d{4}(?:-\d{3})?)\b/g, "····$1");
    s = s.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[Email đã ẩn]");
    s = s.replace(/(?:\+84|0)\d{9}\b/g, "[SĐT đã ẩn]");
  }
  return s;
}

const getDialog = () => document.getElementById("adm-audit-detail-dialog");
function openDetailModal(item, triggerEl) {
  currentTrigger = triggerEl;
  const d = getDialog();
  if (!d) return;
  document.getElementById("adm-modal-sub").textContent = `Mã bản ghi: #${item.id}`;
  const isTest = isTestRecord(item);
  document.getElementById("adm-modal-body").innerHTML = `
    <dl class="adm-dl">
      <dt class="adm-dt">Thời gian:</dt>
      <dd class="adm-dd"><strong>${fmtDateTime(item.created_at)}</strong></dd>
      <dt class="adm-dt">Người thực hiện:</dt>
      <dd class="adm-dd"><strong>${esc(item.actor_name)}</strong> <span style="color:var(--text-muted); font-size:12px;">(${esc(ROLE_LABELS[item.actor_role] || item.actor_role || "Hệ thống")}, ID: #${item.actor_id || "N/A"})</span></dd>
      <dt class="adm-dt">Đối tượng:</dt>
      <dd class="adm-dd"><strong>${esc(item.target_label || `#${item.target_id}`)}</strong> ${isTest ? `<span class="adm-badge-test">[Thử nghiệm]</span>` : ""}<br><span style="color:var(--text-muted); font-size:12px;">Loại: ${esc(TARGET_LABELS[item.target_type] || item.target_type)}, ID: #${item.target_id}</span></dd>
      <dt class="adm-dt">Hành động:</dt>
      <dd class="adm-dd"><strong>${esc(ACTION_LABELS[item.action] || "Thao tác khác")}</strong> <span style="color:var(--text-muted); font-size:12px;">(mã: <code>${esc(item.action)}</code>)</span></dd>
      <dt class="adm-dt">Trước thay đổi:</dt>
      <dd class="adm-dd">${item.old_value ? esc(formatAuditValue(item.old_value, false)) : '<span class="adm-val-empty">Không có</span>'}</dd>
      <dt class="adm-dt">Sau thay đổi:</dt>
      <dd class="adm-dd">${item.new_value ? esc(formatAuditValue(item.new_value, false)) : '<span class="adm-val-empty">Không có</span>'}</dd>
      <dt class="adm-dt">Ghi chú / Lý do:</dt>
      <dd class="adm-dd">${item.reason ? esc(item.reason) : '<span class="adm-val-empty">Không có</span>'}</dd>
    </dl>`;
  d.showModal();
  document.getElementById("adm-modal-dismiss-btn")?.focus();
}

function closeDetailModal() {
  getDialog()?.close();
  currentTrigger?.focus();
}

function renderTable() {
  const tbody = document.getElementById("adm-audit-tbody");
  const filtered = state.rawItems
    .filter((r) => !state.hideTest || !isTestRecord(r))
    .sort((a, b) => b.id - a.id);

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">Không tìm thấy bản ghi nhật ký phù hợp.</td></tr>`;
    return;
  }

  const countMap = {};
  for (const r of state.rawItems) {
    const k = `${r.actor_name}|${r.target_id}|${(r.created_at || "").slice(0, 19)}`;
    countMap[k] = (countMap[k] || 0) + 1;
  }

  tbody.innerHTML = filtered.map((r) => {
    const isRisk = RISK_ACTIONS.has(r.action);
    const pillClass = isRisk ? "gov-status-pill--danger" : "gov-status-pill--neutral";
    const actionText = ACTION_LABELS[r.action] ? esc(ACTION_LABELS[r.action]) : `<span title="${esc(r.action)}">Thao tác khác</span>`;
    const isTest = isTestRecord(r);
    const groupKey = `${r.actor_name}|${r.target_id}|${(r.created_at || "").slice(0, 19)}`;
    const isGrouped = countMap[groupKey] > 1;

    return `
      <tr class="adm-audit-row is-clickable" tabindex="0" role="button" data-id="${r.id}" aria-label="Xem chi tiết bản ghi #${r.id}">
        <td class="col-sticky-name">
          <strong>${esc(r.actor_name)}</strong>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${esc(ROLE_LABELS[r.actor_role] || r.actor_role || "Hệ thống")}</div>
        </td>
        <td class="col-sticky-status">
          <span class="gov-status-pill ${pillClass}">${actionText}</span>
          ${isGrouped ? `<br><span class="adm-badge-group">Thao tác liên hoàn</span>` : ""}
        </td>
        <td>
          <div style="font-weight:600; color:var(--text-heading);">${esc(r.target_label || `#${r.target_id}`)} ${isTest ? `<span class="adm-badge-test">[Thử nghiệm]</span>` : ""}</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${esc(TARGET_LABELS[r.target_type] || r.target_type)}</div>
        </td>
        <td class="adm-val-text">${r.old_value ? esc(formatAuditValue(r.old_value, true)) : `<span class="adm-val-empty">Không có</span>`}</td>
        <td class="adm-val-text">${r.new_value ? esc(formatAuditValue(r.new_value, true)) : `<span class="adm-val-empty">Không có</span>`}</td>
        <td class="gov-num" style="white-space:nowrap; font-size:12.5px;">${fmtDateTime(r.created_at)}</td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll(".adm-audit-row").forEach((tr) => {
    const id = Number(tr.dataset.id);
    const item = filtered.find((x) => x.id === id);
    tr.addEventListener("click", () => openDetailModal(item, tr));
    tr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetailModal(item, tr); }
    });
  });
}

async function loadAuditLogs() {
  try {
    const res = await window.api.get("/admin/audit-logs", { target_type: state.targetType, q: state.q, limit: 250 });
    state.rawItems = res.items || [];
    renderTable();
  } catch (err) {
    document.getElementById("adm-audit-tbody").innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px; color:#b91c1c;">${esc(err?.message || "Lỗi tải nhật ký thay đổi.")}</td></tr>`;
  }
}

document.getElementById("adm-audit-search")?.addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = e.target.value.trim(); loadAuditLogs(); }, 250);
});
document.getElementById("adm-audit-type")?.addEventListener("change", (e) => {
  state.targetType = e.target.value; loadAuditLogs();
});
document.getElementById("adm-audit-hide-test")?.addEventListener("change", (e) => {
  state.hideTest = e.target.checked; renderTable();
});
document.getElementById("adm-audit-refresh")?.addEventListener("click", loadAuditLogs);
document.addEventListener("click", (e) => {
  if (e.target.closest("#adm-modal-close-btn") || e.target.closest("#adm-modal-dismiss-btn")) closeDetailModal();
  const d = getDialog();
  if (d && e.target === d) closeDetailModal();
});

loadAuditLogs();