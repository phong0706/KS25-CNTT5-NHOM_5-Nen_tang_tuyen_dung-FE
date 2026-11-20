/**
 * candidateMatchedJobs.js - Xử lý hiển thị việc làm phù hợp cho ứng viên.
 * Tuân thủ techrecruit-rules: <= 200 dòng, không số khớp giả lập, cập nhật tức thì.
 */
import { jobDetailUrl, companyUrl } from "../routes.js";

const state = { page: 1, size: 10, total: 0, settings: null, data: null };
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

function fmtSalary(j) {
  if (j.is_salary_negotiable && (!j.salary_min && !j.salary_max)) return "Thỏa thuận";
  const toM = (v) => (!v ? "" : (v >= 100000 ? (v / 1000000).toFixed(0) : v));
  const min = toM(j.salary_min), max = toM(j.salary_max);
  if (min && max) return `${min} - ${max} triệu/tháng`;
  return max ? `Tới ${max} triệu/tháng` : min ? `Từ ${min} triệu/tháng` : "Thỏa thuận";
}

function renderStateCard(iconSvg, title, desc, actionHtml) {
  return `<div class="matched-state-card" role="status">
    <div class="matched-state-icon" style="background:var(--primary-50,#f0f9ff); color:var(--primary,#0284c7);">${iconSvg}</div>
    <h2 class="matched-state-title">${esc(title)}</h2>
    <p class="matched-state-desc">${esc(desc)}</p>
    <div class="matched-state-actions">${actionHtml}</div>
  </div>`;
}

function formatLogo(u) {
  if (!u) return "../../assets/img/logo-mark.svg";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const b = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL.replace(/\/api\/?$/, "") : "http://127.0.0.1:8000";
  return `${b}${u.startsWith("/") ? "" : "/"}${u}`;
}

function renderJobCard(item) {
  const pct = item.match_percentage;
  const badgeClass = pct >= 70 ? "high" : pct >= 50 ? "medium" : "moderate";
  const jUrl = jobDetailUrl(item.job_id);
  const cUrl = companyUrl(item.company?.slug || item.company?.id);
  const logo = formatLogo(item.company?.logo_url);
  const matchedHtml = (item.matched_skills || []).map((sk) => `<span class="breakdown-pill skill-match" title="Kỹ năng khớp">✓ ${esc(sk)}</span>`).join("");
  const missingHtml = (item.missing_required || []).map((sk) => `<span class="breakdown-pill skill-missing" title="Kỹ năng bắt buộc còn thiếu">! ${esc(sk)}</span>`).join("");
  const alignHtml = [item.labels?.level, item.labels?.place, item.labels?.salary].filter(Boolean).map((lbl) => `<span class="breakdown-pill alignment">${esc(lbl)}</span>`).join("");

  return `
    <article class="matched-job-card">
      <div class="matched-card-top">
        <div class="matched-card-main">
          <img src="${esc(logo)}" alt="${esc(item.company?.name || 'Logo')}" class="matched-company-logo" onerror="this.onerror=null;this.src='../../assets/img/logo-mark.svg'">
          <div class="matched-job-info">
            <a href="${esc(jUrl)}" class="matched-job-title">${esc(item.title)}</a>
            <a href="${esc(cUrl)}" class="matched-company-name">${esc(item.company?.name || 'Doanh nghiệp ẩn danh')}</a>
          </div>
        </div>
        <div class="match-score-badge ${badgeClass}" aria-label="Độ phù hợp ${pct}%">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span>Khớp ${pct}%</span>
        </div>
      </div>
      <div class="matched-meta-row">
        <span class="matched-meta-item matched-salary-highlight">💰 ${esc(fmtSalary(item))}</span>
        <span class="matched-meta-item">📍 ${esc(item.location || 'Toàn quốc')}</span>
        <span class="matched-meta-item">🎯 ${esc(item.level || 'Tất cả cấp bậc')}</span>
      </div>
      <div class="matched-breakdown-row">${matchedHtml}${missingHtml}${alignHtml}</div>
    </article>`;
}

function renderPagination(total, page, size) {
  const host = document.getElementById("matched-pagination-host");
  if (!host) return;
  const totalPages = Math.ceil(total / size);
  if (totalPages <= 1) { host.innerHTML = ""; return; }
  let html = page > 1 ? `<button type="button" class="btn btn-outline btn-sm" data-page="${page - 1}">Trang trước</button>` : "";
  html += `<span style="font-size:13.5px; padding:6px 12px; color:var(--text-secondary,#64748b);">Trang ${page} / ${totalPages}</span>`;
  if (page < totalPages) html += `<button type="button" class="btn btn-outline btn-sm" data-page="${page + 1}">Trang sau</button>`;
  host.innerHTML = html;
  host.querySelectorAll("button[data-page]").forEach((b) => {
    b.addEventListener("click", () => { state.page = parseInt(b.dataset.page, 10); loadMatches(); });
  });
}

function renderContent(res) {
  const host = document.getElementById("matched-jobs-host");
  const summaryEl = document.getElementById("matched-summary-text");
  const badgeEl = document.getElementById("matched-formula-badge");
  if (!host) return;

  if (badgeEl) badgeEl.textContent = res.formula_version ? `Phiên bản: ${res.formula_version}` : "";

  if (res.status === "can_them_ky_nang") {
    if (summaryEl) summaryEl.textContent = "Chưa đủ dữ liệu kỹ năng hồ sơ";
    host.innerHTML = renderStateCard(
      `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
      "Cần bổ sung tối thiểu 3 kỹ năng",
      "Hệ thống tính điểm đòi hỏi tối thiểu 3 kỹ năng được chuẩn hóa trong hồ sơ để phân tích cơ hội việc làm chuẩn xác nhất.",
      `<a href="profile.html" class="btn btn-primary">Cập nhật kỹ năng ngay</a>`
    );
    renderPagination(0, 1, state.size);
    return;
  }

  if (res.status === "da_tat") {
    if (summaryEl) summaryEl.textContent = "Gợi ý việc làm đang tắt";
    host.innerHTML = renderStateCard(
      `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`,
      "Tính năng gợi ý đang được tắt",
      "Bạn đã chủ động tắt gợi ý việc làm. Bật lại bất cứ lúc nào để hệ thống quét việc làm phù hợp cho bạn.",
      `<button type="button" id="btn-turn-on-matching" class="btn btn-primary">Bật lại gợi ý</button>`
    );
    document.getElementById("btn-turn-on-matching")?.addEventListener("click", () => {
      updateSettings({ is_enabled: true });
    });
    renderPagination(0, 1, state.size);
    return;
  }

  if (res.status === "rong" || !res.items || res.items.length === 0) {
    if (summaryEl) summaryEl.textContent = "Không tìm thấy việc làm phù hợp";
    host.innerHTML = renderStateCard(
      `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
      "Chưa có tin tuyển dụng nào đạt ngưỡng khớp",
      "Hiện tại chưa có tin tuyển dụng đạt mức điểm phù hợp tối thiểu (30% tổng thể và 20% kỹ năng). Hãy bổ sung kỹ năng hoặc thử tìm kiếm chung.",
      `<a href="../jobs.html" class="btn btn-primary">Xem tất cả việc làm</a>`
    );
    renderPagination(0, 1, state.size);
    return;
  }

  if (summaryEl) summaryEl.textContent = `Tìm thấy ${res.total} việc làm phù hợp với hồ sơ của bạn`;
  host.innerHTML = `<div class="matched-jobs-list">${res.items.map(renderJobCard).join("")}</div>`;
  renderPagination(res.total, res.page, res.size);
}

async function loadMatches() {
  const host = document.getElementById("matched-jobs-host");
  if (host) host.innerHTML = `<div class="matched-state-card" style="padding:32px;"><p>Đang quét và tính điểm việc làm phù hợp...</p></div>`;
  try {
    const res = await window.api.get("/candidate/job-matches", { page: state.page, size: state.size });
    state.data = res;
    renderContent(res);
  } catch (err) {
    if (host) host.innerHTML = `<div class="matched-state-card" style="color:#b91c1c; border-color:#fca5a5; background:#fef2f2;"><p>Không thể tải gợi ý việc làm: ${esc(err?.message || "Lỗi máy chủ")}</p></div>`;
  }
}

function syncSettingsUI(s) {
  const t = document.getElementById("matched-toggle-input");
  const r = document.getElementById("matched-relocate-input");
  if (t) t.checked = !!s.is_enabled;
  if (r) r.checked = !!s.open_to_relocate;
}

async function initSettings() {
  try {
    state.settings = await window.api.get("/candidate/job-matches/settings");
    syncSettingsUI(state.settings);
  } catch (e) { console.warn("Lỗi đọc cài đặt:", e); }
}

async function updateSettings(patch) {
  try {
    state.settings = await window.api.put("/candidate/job-matches/settings", patch);
    syncSettingsUI(state.settings);
    state.page = 1;
    loadMatches();
  } catch (err) { alert("Không thể cập nhật cài đặt: " + (err?.message || "Lỗi kết nối")); }
}

document.addEventListener("DOMContentLoaded", async () => {
  const role = window.Auth?.getRole?.() || "";
  if (!window.Auth?.isAuthenticated?.()) {
    window.location.href = `../../pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
  if (role !== "candidate") {
    const host = document.getElementById("matched-jobs-host");
    if (host) {
      host.innerHTML = renderStateCard(
        `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
        "Khu vực dành riêng cho ứng viên", "Vui lòng đăng nhập với tư cách ứng viên để xem việc làm phù hợp.",
        `<a href="../../index.html" class="btn btn-primary">Về trang chủ</a>`
      );
    }
    return;
  }

  await initSettings();
  loadMatches();

  document.getElementById("matched-toggle-input")?.addEventListener("change", (e) => {
    updateSettings({ is_enabled: e.target.checked });
  });

  document.getElementById("matched-relocate-input")?.addEventListener("change", (e) => {
    updateSettings({ open_to_relocate: e.target.checked });
  });
});
