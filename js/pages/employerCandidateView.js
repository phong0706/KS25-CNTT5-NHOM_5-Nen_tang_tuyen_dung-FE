/**
 * employerCandidateView.js - Giao diện hồ sơ ứng viên cho Nhà tuyển dụng (< 180 dòng).
 * Tuân thủ techrecruit-rules: 4 trạng thái, whitelist serializer, light mode, responsive.
 */
import { safeUrl } from "../utils/companyUtils.js";

const root = document.getElementById("candidate-root");
const esc = window.escapeHtml || ((str) => String(str ?? ""));

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "UV";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0][1] || "")).toUpperCase();
}

function formatPeriod(s, e, cur) {
  if (!s) return "";
  const sm = String(s).replace("-", "/");
  return cur ? `Tháng ${sm} – Hiện tại` : (e ? `Tháng ${sm} – Tháng ${String(e).replace("-", "/")}` : `Tháng ${sm}`);
}

function renderSkeleton() {
  return `
    <div class="ecv-header-card"><div class="skeleton-block" style="width:80px;height:80px;border-radius:8%;"></div><div style="flex:1;"><div class="skeleton-block" style="width:220px;height:24px;margin-bottom:8px;"></div><div class="skeleton-block" style="width:160px;height:16px;margin-bottom:8px;"></div><div class="skeleton-block" style="width:120px;height:14px;"></div></div></div>
    <div class="ecv-grid"><div><div class="ecv-card"><div class="skeleton-block" style="width:100%;height:140px;"></div></div></div><div><div class="ecv-card"><div class="skeleton-block" style="width:100%;height:200px;"></div></div></div></div>`;
}

function renderError(msg, is404 = false) {
  return `
    <div class="ecv-card" style="text-align:center;padding:48px 24px;">
      <div style="font-size:40px;margin-bottom:12px;">${is404 ? "🔒" : "⚠️"}</div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:8px;">${is404 ? "Hồ sơ không tồn tại hoặc đã bị ẩn" : "Không thể tải hồ sơ ứng viên"}</h2>
      <p style="color:var(--text-light);font-size:14px;max-width:440px;margin:0 auto 20px;">${is404 ? "Ứng viên chưa công khai hồ sơ hoặc liên kết không chính xác." : esc(msg)}</p>
      <div>${is404 ? `<a href="./recruitment.html" class="rec-btn-primary" style="text-decoration:none;display:inline-block;padding:8px 16px;">Về trang quản lý</a>` : `<button type="button" class="rec-btn-primary" id="btn-retry" style="padding:8px 16px;">Thử lại</button>`}</div>
    </div>`;
}

function renderProfile(d, publicId) {
  const isFull = d.access === "full", initials = getInitials(d.full_name), avatarSrc = safeUrl(d.avatar);
  const banner = isFull
    ? `<div class="ecv-access-banner ecv-banner-full"><span>ℹ️</span><div><strong>Quyền xem đầy đủ:</strong> Ứng viên đã nộp đơn vào tin tuyển dụng của bạn. Bạn có thể liên hệ trực tiếp.</div></div>`
    : `<div class="ecv-access-banner ecv-banner-public"><span>🛡️</span><div><strong>Hồ sơ công khai:</strong> Ứng viên chưa nộp đơn vào tin của bạn. SĐT/email và CV được bảo mật; bạn có thể xem kinh nghiệm, học vấn và kỹ năng.</div></div>`;

  const match = d.match ? `
    <div class="ecv-card">
      <div class="ecv-card-title">Độ phù hợp với tin tuyển dụng</div>
      <div class="ecv-match-score-wrap"><div class="ecv-match-number">${d.match.score}%</div><div class="ecv-match-bar-track"><div class="ecv-match-bar-fill" style="width:${d.match.score}%;"></div></div></div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div><span style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:6px;">KỸ NĂNG KHỚP (${d.match.matched_skills.length})</span><div class="ecv-skills-wrap">${d.match.matched_skills.map((s) => `<span class="ecv-skill-chip ecv-skill-matched">✓ ${esc(s)}</span>`).join("") || `<span style="font-size:12px;color:var(--text-muted);">Không có</span>`}</div></div>
        <div><span style="font-size:12px;font-weight:600;color:var(--text-light);display:block;margin-bottom:6px;">CẦN BỔ SUNG (${d.match.missing_skills.length})</span><div class="ecv-skills-wrap">${d.match.missing_skills.map((s) => `<span class="ecv-skill-chip ecv-skill-missing">${esc(s)}</span>`).join("") || `<span style="font-size:12px;color:var(--text-muted);">Đã đủ toàn bộ</span>`}</div></div>
      </div>
    </div>` : "";

  const exps = d.experiences?.length ? d.experiences.map((e) => `
    <div class="ecv-timeline-item"><div class="ecv-timeline-dot"></div><div class="ecv-timeline-title">${esc(e.title)}</div><div class="ecv-timeline-org">${esc(e.company)}</div><div class="ecv-timeline-time">${formatPeriod(e.start_month, e.end_month, e.is_current)}</div>${e.description ? `<p class="ecv-timeline-desc">${esc(e.description)}</p>` : ""}</div>`).join("") : `<p style="font-size:13.5px;color:var(--text-muted);margin:0;">Chưa cập nhật kinh nghiệm.</p>`;

  const edus = d.educations?.length ? d.educations.map((ed) => `
    <div class="ecv-timeline-item"><div class="ecv-timeline-dot"></div><div class="ecv-timeline-title">${esc(ed.degree)} · ${esc(ed.major)}</div><div class="ecv-timeline-org">${esc(ed.school)}</div><div class="ecv-timeline-time">${ed.start_year || ""} – ${ed.end_year || "Hiện tại"}</div></div>`).join("") : `<p style="font-size:13.5px;color:var(--text-muted);margin:0;">Chưa cập nhật học vấn.</p>`;

  const skills = d.skills?.length ? d.skills.map((s) => `<span class="ecv-skill-chip ecv-skill-missing" style="background:#f8fafc;font-weight:600;">${esc(s)}</span>`).join("") : `<p style="font-size:13.5px;color:var(--text-muted);margin:0;">Chưa cập nhật kỹ năng.</p>`;

  const apps = (isFull && d.applications_to_you?.length) ? `
    <div class="ecv-card"><div class="ecv-card-title">Đơn nộp vào công ty bạn (${d.applications_to_you.length})</div><div style="display:flex;flex-direction:column;gap:10px;">
      ${d.applications_to_you.map((a) => `
        <div style="padding:10px;border:1px solid var(--border);border-radius:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div><div style="font-size:13.5px;font-weight:600;">${esc(a.job_title)}</div><div style="font-size:12px;color:var(--text-muted);">Trạng thái: <strong>${esc(a.status)}</strong></div></div>
          ${a.has_cv ? `<button type="button" class="rec-btn-view-profile btn-download-cv" data-app-id="${a.application_id}" style="font-size:12px;cursor:pointer;padding:5px 10px;border-radius:6px;background:var(--primary);color:#fff;border:none;">Xem CV đã nộp ↗</button>` : `<span style="font-size:12px;color:var(--text-muted);">Không đính kèm CV</span>`}
        </div>`).join("")}
    </div></div>` : "";

  const links = [];
  if (d.social_links?.github) links.push({ name: "GitHub", url: safeUrl(d.social_links.github) });
  if (d.social_links?.linkedin) links.push({ name: "LinkedIn", url: safeUrl(d.social_links.linkedin) });
  if (d.social_links?.portfolio) links.push({ name: "Portfolio", url: safeUrl(d.social_links.portfolio) });

  return `
    ${banner}
    <div class="ecv-header-card">
      <div class="ecv-avatar">${avatarSrc ? `<img src="${avatarSrc}" alt="${esc(d.full_name)}">` : `<span>${esc(initials)}</span>`}</div>
      <div class="ecv-header-info">
        <h1 class="ecv-name">${esc(d.full_name)}</h1>
        <div class="ecv-headline">${esc(d.headline || "Ứng viên chuyên môn")}</div>
        <div class="ecv-location">📍 ${esc(d.city || "Việt Nam")}</div>
      </div>
    </div>
    <div class="ecv-grid">
      <div>
        ${match}
        <div class="ecv-card"><div class="ecv-card-title">Giới thiệu bản thân</div><p class="ecv-timeline-desc">${esc(d.bio || "Chưa có giới thiệu bản thân.")}</p></div>
        <div class="ecv-card"><div class="ecv-card-title">Kinh nghiệm làm việc</div><div class="ecv-timeline">${exps}</div></div>
        <div class="ecv-card"><div class="ecv-card-title">Học vấn</div><div class="ecv-timeline">${edus}</div></div>
        <div class="ecv-card"><div class="ecv-card-title">Kỹ năng chuyên môn</div><div class="ecv-skills-wrap">${skills}</div></div>
      </div>
      <div>
        <div class="ecv-card">
          <div class="ecv-card-title">Thông tin liên hệ</div>
          <div class="ecv-contact-list">
            <div class="ecv-contact-item"><span class="ecv-contact-label">Số điện thoại</span><div class="ecv-contact-val">${isFull && d.phone ? `<a href="tel:${esc(d.phone)}">${esc(d.phone)}</a>` : `<span class="ecv-contact-locked">🔒 Chỉ hiển thị sau khi ứng viên ứng tuyển</span>`}</div></div>
            <div class="ecv-contact-item"><span class="ecv-contact-label">Email</span><div class="ecv-contact-val">${isFull && d.email ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : `<span class="ecv-contact-locked">🔒 Chỉ hiển thị sau khi ứng viên ứng tuyển</span>`}</div></div>
            <div class="ecv-contact-item"><span class="ecv-contact-label">Địa điểm sinh sống</span><div class="ecv-contact-val">${esc(d.city || "Chưa cập nhật")}</div></div>
          </div>
        </div>
        ${apps}
        ${links.length ? `
          <div class="ecv-card"><div class="ecv-card-title">Liên kết hồ sơ</div><div class="ecv-contact-list">
            ${links.map((l) => `<div class="ecv-contact-item"><span class="ecv-contact-label">${esc(l.name)}</span><div class="ecv-contact-val"><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.url)} ↗</a></div></div>`).join("")}
          </div></div>` : ""}
      </div>
    </div>`;
}

async function handleCvClick(e, publicId) {
  const btn = e.target.closest(".btn-download-cv");
  if (!btn) return;
  const appId = btn.dataset.appId, orig = btn.textContent;
  btn.disabled = true; btn.textContent = "Đang mở...";
  try {
    const token = (window.AuthCore ? window.AuthCore.getSession().token : null) || localStorage.getItem("auth_token");
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const res = await fetch(`${base}/employer/candidates/${encodeURIComponent(publicId)}/cv/${appId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Không thể tải file CV hoặc hồ sơ đã bị rút.");
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), "_blank");
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
  } finally {
    btn.disabled = false; btn.textContent = orig;
  }
}

async function loadCandidate() {
  if (!root) return;
  const p = new URLSearchParams(window.location.search);
  const publicId = (p.get("id") || "").trim(), jobId = p.get("job_id");
  if (!publicId) return (root.innerHTML = renderError("Thiếu mã định danh ứng viên (id)", true));

  root.innerHTML = renderSkeleton();
  const q = jobId ? `?job_id=${encodeURIComponent(jobId)}` : "";
  try {
    const data = await window.api.get(`/employer/candidates/${encodeURIComponent(publicId)}${q}`);
    root.innerHTML = renderProfile(data, publicId);
    root.addEventListener("click", (e) => handleCvClick(e, publicId));
  } catch (err) {
    const status = err.response?.status || err.status;
    root.innerHTML = renderError(err.message || "Không thể tải hồ sơ", status === 404);
    const retry = document.getElementById("btn-retry");
    if (retry) retry.addEventListener("click", loadCandidate);
  }
}

document.addEventListener("DOMContentLoaded", loadCandidate);
