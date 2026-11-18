/**
 * employerCriteriaBlock.js - Khối "Xác thực tài khoản" cho nhà tuyển dụng (<= 155 dòng).
 * Hiển thị đủ tiêu chí trên trang (không giấu trong tooltip), tóm tắt đếm trên tiêu chí đã kiểm tra.
 */

const STATUS_TEXT = { dat: "Đạt", chua_dat: "Chưa đạt", chua_kiem_tra: "Chưa kiểm tra" };
const ICONS = {
  dat: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  chua_dat: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  chua_kiem_tra: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
};

const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
};

let docClickBound = false;

function bindSummaryTooltip(host) {
  const btn = host.querySelector("#emp-criteria-tip-btn");
  const box = host.querySelector("#emp-criteria-tip-box");
  if (!btn || !box) return;
  const setOpen = (open) => { box.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); };
  btn.addEventListener("mouseenter", () => setOpen(true));
  btn.addEventListener("mouseleave", () => { if (document.activeElement !== btn) setOpen(false); });
  btn.addEventListener("focus", () => setOpen(true));
  btn.addEventListener("blur", () => setOpen(false));
  btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(box.hidden); });
  btn.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); setOpen(false); btn.focus(); } });
  if (!docClickBound) {
    docClickBound = true;
    document.addEventListener("click", (e) => {
      const b = document.getElementById("emp-criteria-tip-box"), t = document.getElementById("emp-criteria-tip-btn");
      if (b && !b.hidden && t && !t.contains(e.target) && !b.contains(e.target)) { b.hidden = true; t.setAttribute("aria-expanded", "false"); }
    });
  }
}

export function renderEmployerCriteriaBlock(data) {
  const host = document.getElementById("employer-criteria-block");
  if (!host || !data) return;

  const passed = Number(data.passed_count || 0);
  const checked = Number(data.checked_count || 0);
  const unchecked = Number(data.unchecked_count || 0);
  const summaryMain = checked > 0 ? `${passed} trên ${checked} tiêu chí đạt.` : "Chưa có tiêu chí nào đã kiểm tra.";
  const uncheckedNote = unchecked > 0 ? ` (${unchecked} tiêu chí chưa kiểm tra)` : "";
  const rowsHtml = (data.criteria || []).map((c) => {
    const st = STATUS_TEXT[c.status] ? c.status : "chua_kiem_tra";
    const dateTxt = fmtDate(c.checked_at);
    const hintHtml = st !== "dat" && c.action_hint
      ? `<p class="criterion-hint">Việc cần làm: ${esc(c.action_hint)}</p>`
      : "";
    return `
      <div class="criterion-row" data-criterion-code="${esc(c.code)}">
        <div class="criterion-main">
          <span class="criterion-icon criterion-icon--${st}" aria-hidden="true">${ICONS[st]}</span>
          <div class="criterion-body">
            <h3 class="criterion-label">${esc(c.label)}</h3>
            <p class="criterion-reason">${esc(c.reason)}</p>
            ${hintHtml}
          </div>
        </div>
        <div class="criterion-side">
          <span class="criterion-badge criterion-badge--${st}">${esc(STATUS_TEXT[st])}</span>
          ${dateTxt ? `<span class="criterion-date">Kiểm tra: ${esc(dateTxt)}</span>` : ""}
        </div>
      </div>`;
  }).join("");

  host.innerHTML = `
    <div class="criteria-head">
      <div>
        <h2 id="emp-criteria-heading" class="criteria-title">Xác thực tài khoản</h2>
        <p class="criteria-sub">Đối chiếu tiêu chí từ hồ sơ doanh nghiệp và trạng thái hoạt động thực tế.</p>
      </div>
      <div class="criteria-summary-wrap">
        <span class="criteria-summary-pill" id="emp-criteria-summary">${esc(summaryMain)}${esc(uncheckedNote)}</span>
        <button type="button" id="emp-criteria-tip-btn" class="criteria-tip-btn" aria-describedby="emp-criteria-tip-box" aria-expanded="false">Giải thích cách tính</button>
        <div id="emp-criteria-tip-box" role="tooltip" class="criteria-tip-box" hidden>
          Tóm tắt "${esc(summaryMain)}" chỉ tính trên ${checked} tiêu chí đã kiểm tra (${passed} đạt). Các tiêu chí "Chưa kiểm tra" không được tính là đạt.
        </div>
      </div>
    </div>
    <div class="criteria-list" id="emp-criteria-list">${rowsHtml}</div>`;

  bindSummaryTooltip(host);
}

export async function loadEmployerCriteriaBlock() {
  const host = document.getElementById("employer-criteria-block");
  if (!host) return;
  try {
    const data = await window.api.get("/employer/verification-criteria");
    renderEmployerCriteriaBlock(data);
  } catch (err) {
    host.innerHTML = `<div class="criteria-head"><div><h2 id="emp-criteria-heading" class="criteria-title">Xác thực tài khoản</h2><p class="criteria-sub">${esc(err?.message || "Không thể tải danh sách tiêu chí xác thực.")}</p></div></div>`;
  }
}
