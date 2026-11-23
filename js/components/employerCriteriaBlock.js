/**
 * employerCriteriaBlock.js - Khối "Xác thực tài khoản" nhà tuyển dụng (<= 150 dòng).
 * Phân 3 nhóm hành động ("Cần bạn làm", "Đang chờ", "Đã đạt"), thanh tiến độ mảnh, không dùng pill.
 */
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "");

let docClickBound = false;
function bindSummaryTooltip(host) {
  const btn = host.querySelector("#emp-criteria-tip-btn"), box = host.querySelector("#emp-criteria-tip-box");
  if (!btn || !box) return;
  const setOpen = (open) => { box.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); };
  btn.addEventListener("mouseenter", () => setOpen(true));
  btn.addEventListener("mouseleave", () => setOpen(false));
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

function parseWaitText(c) {
  const m = String(c.action_hint || c.reason || "").match(/(\d+)\s*ngày/i);
  return m ? `Còn ${m[1]} ngày để đủ 180 ngày hoạt động.` : (c.reason || "Đang tích lũy thời gian hoạt động theo quy định.");
}

function renderGroup(title, titleMod, items, tagCls, tagTxt, isCheck) {
  if (!items.length) return "";
  const iconHtml = isCheck
    ? '<span class="criteria-check-icon" aria-hidden="true">✓</span>'
    : `<span class="criteria-dot criteria-dot--${tagCls}" aria-hidden="true"></span>`;
  return `
    <section class="criteria-group" aria-label="${esc(title)}">
      <h3 class="criteria-group-title ${titleMod}">${esc(title)}</h3>
      <div class="criteria-group-items">
        ${items.map((c) => `
          <div class="criteria-item" data-criterion-code="${esc(c.code)}">
            <div class="criteria-item-main">
              <div class="criteria-item-label">${iconHtml}<span>${esc(c.label)}</span></div>
              <p class="criteria-item-desc">${esc(tagCls === "waiting" ? parseWaitText(c) : (c.reason || ""))}</p>
              ${tagCls === "action" && c.action_hint ? `<div class="criteria-action-box">Việc cần làm: ${esc(c.action_hint)}</div>` : ""}
            </div>
            <span class="criteria-tag criteria-tag--${tagCls}">${esc(tagTxt)}</span>
          </div>`).join("")}
      </div>
    </section>`;
}

export function renderEmployerCriteriaBlock(data) {
  const host = document.getElementById("employer-criteria-block");
  if (!host || !data) return;

  const raw = data.criteria || [];
  const dates = raw.map((c) => c.checked_at).filter(Boolean);
  const latestDate = dates.length ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))) : null;
  const latestDateTxt = latestDate && !Number.isNaN(latestDate.getTime()) ? fmtDate(latestDate) : "";

  const actionItems = [], waitingItems = [], passedItems = [], unsupportedItems = [];
  for (const c of raw) {
    const isOtp = c.code === "phone_verified" || String(c.label || "").toLowerCase().includes("điện thoại") || c.status === "chua_ho_tro";
    const isAge = c.code === "account_age" || c.status === "cho_thoi_gian";
    if (isOtp) unsupportedItems.push(c);
    else if (c.status === "dat") passedItems.push(c);
    else if (isAge && c.status !== "dat") waitingItems.push(c);
    else actionItems.push(c);
  }

  const autoItems = raw.filter((c) => c.code !== "phone_verified" && c.status !== "chua_ho_tro");
  const totalAuto = autoItems.length || 4, passedCount = passedItems.length;
  const pct = Math.round((passedCount / totalAuto) * 100);

  const unsuppHtml = unsupportedItems.length ? `
    <div class="criteria-unsupported-group">
      ${unsupportedItems.map((c) => `<div><strong>Chưa hỗ trợ tự động:</strong> ${esc(c.label)} — Quản trị viên đối chiếu và duyệt thủ công khi cần.</div>`).join("")}
    </div>` : "";

  host.innerHTML = `
    <div class="criteria-head">
      <div>
        <h2 id="emp-criteria-heading" class="criteria-title">Xác thực tài khoản</h2>
        <p class="criteria-sub">Đối chiếu tiêu chí từ hồ sơ doanh nghiệp và trạng thái hoạt động thực tế.${latestDateTxt ? ` · Ngày kiểm tra: ${esc(latestDateTxt)}` : ""}</p>
      </div>
      <div class="criteria-progress-section">
        <div class="criteria-progress-meta">
          <span class="criteria-progress-text" id="emp-criteria-summary">${passedCount} trên ${totalAuto} tiêu chí đạt</span>
          <button type="button" id="emp-criteria-tip-btn" class="criteria-link-btn" aria-describedby="emp-criteria-tip-box" aria-expanded="false">Giải thích cách tính</button>
          <div id="emp-criteria-tip-box" role="tooltip" class="criteria-tip-box" hidden>
            Tiến độ tính trên ${totalAuto} tiêu chí tự động (${passedCount} đã đạt). Tiêu chí đang chờ thời gian và chưa hỗ trợ tự động không tính là đạt.
          </div>
        </div>
        <div class="criteria-progress-track" role="progressbar" aria-valuenow="${passedCount}" aria-valuemin="0" aria-valuemax="${totalAuto}" aria-label="Tiến độ xác thực tài khoản: ${passedCount} trên ${totalAuto} tiêu chí đạt">
          <div class="criteria-progress-fill" style="width:${pct}%;"></div>
        </div>
      </div>
    </div>
    <div class="criteria-list" id="emp-criteria-list">
      ${renderGroup("Cần bạn làm", "criteria-group-title--action", actionItems, "action", "Cần làm", false)}
      ${renderGroup("Đang chờ", "", waitingItems, "waiting", "Đang chờ", false)}
      ${renderGroup("Đã đạt", "", passedItems, "passed", "Đạt", true)}
      ${unsuppHtml}
    </div>`;

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
