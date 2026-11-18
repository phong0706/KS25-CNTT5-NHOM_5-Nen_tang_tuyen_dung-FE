/**
 * adminAuditLogs.js - Trang Nhật ký thay đổi khu quản trị (/pages/admin/audit-logs.html)
 * Hiển thị: người thực hiện, đối tượng, hành động, giá trị cũ, giá trị mới, thời gian.
 * Giới hạn: < 200 dòng.
 */
const state = { q: "", targetType: "all", items: [] };
let searchTimer = null;
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "-");

const ACTION_LABELS = {
  upload_logo: "Tải logo mới",
  replace_logo: "Thay logo",
  remove_logo: "Gỡ logo",
  view_cv: "Mở xem CV",
  delete_company: "Xóa công ty",
};

const TARGET_LABELS = {
  company_logo: "Logo công ty",
  candidate_cv: "CV ứng viên",
  company: "Công ty",
};

function renderTable() {
  const tbody = document.getElementById("adm-audit-tbody");
  if (!state.items.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">Chưa có bản ghi nhật ký thay đổi nào.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.items.map((r) => `
    <tr>
      <td class="col-sticky-name">
        <strong>${esc(r.actor_name)}</strong>
        <div style="font-size:12px; color:var(--text-muted);">Vai trò: ${esc(r.actor_role)} (#${r.actor_id})</div>
      </td>
      <td class="col-sticky-status">
        <span class="gov-status-pill gov-status-pill--active">${esc(ACTION_LABELS[r.action] || r.action)}</span>
      </td>
      <td>
        <strong>${esc(r.target_label || `#${r.target_id}`)}</strong>
        <div style="font-size:12px; color:var(--text-muted);">${esc(TARGET_LABELS[r.target_type] || r.target_type)} #${r.target_id}</div>
      </td>
      <td style="max-width:240px; word-break:break-all; font-size:12.5px;">${r.old_value ? `<code>${esc(r.old_value)}</code>` : `<span style="color:var(--text-muted);">Không có</span>`}</td>
      <td style="max-width:240px; word-break:break-all; font-size:12.5px;">${r.new_value ? `<code>${esc(r.new_value)}</code>` : `<span style="color:var(--text-muted);">Không có</span>`}</td>
      <td class="gov-num" style="white-space:nowrap;">${fmtDateTime(r.created_at)}</td>
    </tr>`).join("");
}

async function loadAuditLogs() {
  try {
    const res = await window.api.get("/admin/audit-logs", { target_type: state.targetType, q: state.q });
    state.items = res.items || [];
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
document.getElementById("adm-audit-refresh")?.addEventListener("click", loadAuditLogs);

loadAuditLogs();
