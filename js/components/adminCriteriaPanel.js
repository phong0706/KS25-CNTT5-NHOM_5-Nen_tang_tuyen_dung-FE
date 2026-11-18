/**
 * adminCriteriaPanel.js - Bảng tiêu chí chi tiết & duyệt thủ công trong khu quản trị (<= 175 dòng).
 */

const STATUS_LABELS = { dat: "Đạt", chua_dat: "Chưa đạt", chua_kiem_tra: "Chưa kiểm tra" };
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtTime = (iso) => {
  if (!iso) return "Chưa kiểm tra";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Chưa kiểm tra" : d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export function renderAdminCriteriaHtml(c) {
  const sum = c.criteria_summary;
  if (!sum) return "";
  const rowsHtml = (sum.criteria || []).map((it) => {
    const st = STATUS_LABELS[it.status] ? it.status : "chua_kiem_tra";
    const canApprove = st !== "dat";
    return `
      <div class="criterion-row" data-admin-criterion="${esc(it.code)}">
        <div class="criterion-main" style="display:flex; gap:12px; align-items:flex-start;">
          <input type="checkbox" class="adm-criterion-check" data-code="${esc(it.code)}" ${it.status === "dat" ? "checked" : ""} style="width:18px; height:18px; margin-top:3px; accent-color:var(--primary, #0d9488); cursor:pointer;" aria-label="Đạt tiêu chí ${esc(it.label)}">
          <div class="criterion-body" style="flex:1;">
            <h5 class="criterion-label">${esc(it.label)}</h5>
            <p class="criterion-reason">${esc(it.reason)}</p>
            <p class="criterion-meta-line">Nguồn: ${esc(it.source)} · Ngày kiểm tra: ${esc(fmtTime(it.checked_at))}</p>
            <div class="criteria-manual-box" id="adm-manual-box-${esc(it.code)}" hidden>
              <label class="verif-label" for="adm-manual-reason-${esc(it.code)}" style="margin-top:0;">Lý do duyệt thủ công (bắt buộc) *</label>
              <textarea id="adm-manual-reason-${esc(it.code)}" rows="2" placeholder="Nhập căn cứ kiểm tra thực tế trước khi duyệt thủ công..."></textarea>
              <p id="adm-manual-err-${esc(it.code)}" class="verif-field-error" role="alert"></p>
              <div class="criteria-manual-actions">
                <button type="button" class="btn btn-sm btn-outline adm-manual-cancel" data-code="${esc(it.code)}">Hủy</button>
                <button type="button" class="btn btn-sm btn-primary adm-manual-submit" data-code="${esc(it.code)}">Xác nhận duyệt</button>
              </div>
            </div>
          </div>
        </div>
        <div class="criterion-side">
          <span class="criterion-badge criterion-badge--${st}">${esc(STATUS_LABELS[st])}</span>
          ${canApprove ? `<button type="button" class="btn btn-sm btn-outline adm-btn-manual-open" data-code="${esc(it.code)}">Duyệt thủ công</button>` : ""}
        </div>
      </div>`;
  }).join("");

  const logs = Array.isArray(sum.logs) ? sum.logs : [];
  const logsHtml = logs.length
    ? `<ul class="criteria-logs-list">${logs.map((l) => `
        <li class="criteria-log-item">
          <strong>${esc(fmtTime(l.created_at))}</strong> — <strong>${esc(l.actor_name)}</strong> duyệt tiêu chí
          <em>"${esc(l.criterion_label)}"</em>. Lý do: "${esc(l.reason)}"
        </li>`).join("")}</ul>`
    : `<p class="criteria-sub">Chưa có thao tác duyệt thủ công nào cho doanh nghiệp này.</p>`;

  return `
    <div class="verif-dossier" id="adm-criteria-panel" style="margin:14px 0 0;">
      <div class="criteria-head">
        <div>
          <h4 class="criteria-title" style="font-size:15.5px;">Tiêu chí xác thực nhà tuyển dụng</h4>
          <p class="criteria-sub">${esc(sum.summary_text)} · ${Number(sum.unchecked_count || 0)} chưa kiểm tra · ${Number(sum.open_reports_count || 0)} báo cáo đang mở</p>
        </div>
      </div>
      <div class="criteria-list">${rowsHtml}</div>
      <div class="criteria-logs-wrap">
        <h5 class="criteria-logs-title">Nhật ký duyệt thủ công</h5>
        ${logsHtml}
      </div>
    </div>`;
}

export function bindAdminCriteriaToggles(state, onToggle) {
  [["adm-filter-unchecked", "hasUnchecked"], ["adm-filter-reports", "hasOpenReports"]].forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener("click", (e) => {
      state[key] = !state[key];
      e.currentTarget.setAttribute("aria-pressed", state[key] ? "true" : "false");
      onToggle();
    });
  });
}

export function syncApproveButtonState() {
  const btn = document.getElementById("btn-approve-verif");
  if (!btn) return;
  const checks = document.querySelectorAll(".adm-criterion-check");
  const allTicked = checks.length > 0 && Array.from(checks).every((c) => c.checked);
  btn.disabled = !allTicked;
  if (allTicked) btn.removeAttribute("title");
  else btn.setAttribute("title", "Cần tick đạt đủ toàn bộ tiêu chí kiểm tra trước khi xác minh");
}

export function bindAdminCriteriaEvents(c, { onReload, onShowInline }) {
  const panel = document.getElementById("adm-criteria-panel");
  if (!panel) return;

  panel.querySelectorAll(".adm-criterion-check").forEach((cb) => {
    cb.addEventListener("change", syncApproveButtonState);
  });
  syncApproveButtonState();

  panel.querySelectorAll(".adm-btn-manual-open").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      const box = document.getElementById(`adm-manual-box-${code}`);
      if (!box) return;
      box.hidden = !box.hidden;
      if (!box.hidden) document.getElementById(`adm-manual-reason-${code}`)?.focus();
    });
  });

  panel.querySelectorAll(".adm-manual-cancel").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = document.getElementById(`adm-manual-box-${btn.dataset.code}`);
      if (box) box.hidden = true;
    });
  });

  panel.querySelectorAll(".adm-manual-submit").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = btn.dataset.code;
      const inp = document.getElementById(`adm-manual-reason-${code}`);
      const errEl = document.getElementById(`adm-manual-err-${code}`);
      const reason = (inp?.value || "").trim();
      if (reason.length < 5) {
        if (errEl) errEl.textContent = "Vui lòng nhập lý do duyệt thủ công (tối thiểu 5 ký tự).";
        inp?.setAttribute("aria-invalid", "true");
        inp?.focus();
        return;
      }
      if (errEl) errEl.textContent = "";
      btn.disabled = true;
      try {
        await window.api.post(`/admin/companies/${c.id}/criteria/${encodeURIComponent(code)}/approve`, { reason });
        await onReload(c.id, `Đã duyệt thủ công tiêu chí cho ${c.name}.`);
      } catch (err) {
        if (errEl) errEl.textContent = err?.message || "Không thể duyệt thủ công tiêu chí.";
        onShowInline?.(err?.message || "Không thể duyệt thủ công tiêu chí.", true);
        btn.disabled = false;
      }
    });
  });
}
