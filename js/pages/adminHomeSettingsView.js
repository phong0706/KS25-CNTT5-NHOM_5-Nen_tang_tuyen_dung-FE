/**
 * adminHomeSettingsView.js - Các hàm render HTML cho giao diện Cấu hình Trang chủ.
 * Vanilla JS ES modules. Tuân thủ techrecruit-rules: <= 195 dòng.
 */
export const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

export function renderSkills(tbody, list) {
  if (!tbody) return;
  if (!list || !list.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:16px;">Chưa có kỹ năng.</td></tr>`; return; }
  tbody.innerHTML = list.map((sk, idx) => `
    <tr>
      <td style="font-weight:600;color:#64748b;">${idx + 1}</td>
      <td><strong>${esc(sk.skill_name)}</strong></td>
      <td>${sk.sample_count} tin</td>
      <td><span style="color:#0d9488;font-weight:600;">${sk.median_salary}</span> tr/tháng</td>
      <td>
        <div class="hs-seg-control" role="group" aria-label="Chế độ ${esc(sk.skill_name)}">
          <button type="button" class="hs-seg-btn ${sk.mode === 'auto' ? 'active' : ''}" data-act="mode" data-id="${sk.skill_id}" data-val="auto">Tự động</button>
          <button type="button" class="hs-seg-btn ${sk.mode === 'pinned' ? 'active' : ''}" data-act="mode" data-id="${sk.skill_id}" data-val="pinned">Ghim</button>
          <button type="button" class="hs-seg-btn ${sk.mode === 'hidden' ? 'active' : ''}" data-act="mode" data-id="${sk.skill_id}" data-val="hidden">Ẩn</button>
        </div>
      </td>
      <td>
        <div class="hs-reorder-btns">
          <button type="button" class="hs-btn-icon" data-act="up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} aria-label="Lên">↑</button>
          <button type="button" class="hs-btn-icon" data-act="down" data-idx="${idx}" ${idx === list.length - 1 ? "disabled" : ""} aria-label="Xuống">↓</button>
        </div>
      </td>
    </tr>
  `).join("");
}

export function renderComps(tbody, list) {
  if (!tbody) return;
  if (!list || !list.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;">Chưa có doanh nghiệp.</td></tr>`; return; }
  tbody.innerHTML = list.map((c, idx) => `
    <tr>
      <td style="font-weight:600;color:#64748b;">${idx + 1}</td>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${c.open_jobs} việc làm</td>
      <td>
        <button type="button" class="hs-seg-btn ${c.position ? 'active' : ''}" data-act="comp-pin" data-id="${c.company_id}">
          ${c.position ? '★ Đang ghim' : 'Tự động'}
        </button>
      </td>
      <td>
        <div class="hs-reorder-btns">
          <button type="button" class="hs-btn-icon" data-act="comp-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} aria-label="Lên">↑</button>
          <button type="button" class="hs-btn-icon" data-act="comp-down" data-idx="${idx}" ${idx === list.length - 1 ? "disabled" : ""} aria-label="Xuống">↓</button>
        </div>
      </td>
    </tr>
  `).join("");
}

export function renderAudit(tbody, items) {
  if (!tbody) return;
  if (!items || !items.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;">Chưa có nhật ký nào.</td></tr>`; return; }
  tbody.innerHTML = items.map((a) => `
    <tr>
      <td>${new Date(a.created_at).toLocaleString("vi-VN")}</td>
      <td><strong>${esc(a.actor_name)}</strong></td>
      <td><span class="hs-pinned-badge">${esc(a.section)}</span></td>
      <td>${esc(a.action)}</td>
      <td style="max-width:240px;word-break:break-word;">${esc(a.reason)}</td>
    </tr>
  `).join("");
}
