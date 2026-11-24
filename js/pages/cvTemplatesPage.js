/**
 * Logic hiển thị Thư viện Mẫu CV (/pages/cv-templates.html)
 * Tuân thủ techrecruit-rules & yêu cầu:
 * - 1 nguồn auth duy nhất từ js/core/auth.js (chờ auth.ready)
 * - 5 trạng thái banner rõ ràng (Khách, Candidate đủ, Candidate thiếu, Employer/Admin, Lỗi API)
 * - Lấy trạng thái chuẩn ATS trực tiếp từ API /api/meta/cv-templates
 * - Lưới thẻ 4 cột (>= 1280px), 2 cột (>= 768px), 1 cột (< 768px), bằng chiều cao
 * - Vùng xem trước aspect-ratio 1/1.414, background --bg-alt, transform: scale đồng nhất
 * - Nút "Xem lớn" mở modal A4 cuộn được, Esc đóng, focus trap, nút "Dùng mẫu này"
 */
import { auth } from "../core/auth.js";
import { DEMO_CV_DATA, normalizeCvData } from "../cv/cvMockData.js";
import { CV_TEMPLATES, renderCvDocument } from "../cv/cvTemplates.js";
import { cvBuilderUrl, cvTemplatesUrl, loginUrl, candidateProfileUrl } from "../routes.js";

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let activeModal = null;

function openPreviewModal(tpl, cvData, triggerBtn) {
  const returnFocus = triggerBtn || document.activeElement;
  const backdrop = document.createElement("div");
  backdrop.className = "cv-modal-backdrop";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-label", `Xem lớn mẫu ${tpl.name}`);

  const previewHtml = renderCvDocument(tpl.slug, cvData);

  backdrop.innerHTML = `
    <div class="cv-modal-box">
      <div class="cv-modal-header">
        <div>
          <h2 style="font-size:18px; font-weight:700; margin:0 0 2px; color:var(--text-primary);">Mẫu ${escapeHtml(tpl.name)} (Xem trước A4)</h2>
          <span style="font-size:13px; color:var(--text-secondary);">${escapeHtml(tpl.tagline)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <a href="${cvBuilderUrl({ template: tpl.slug })}" class="btn btn-primary" style="padding:6px 16px; font-size:13px; text-decoration:none; font-weight:600;">Dùng mẫu này</a>
          <button type="button" class="cv-modal-close" aria-label="Đóng xem trước" style="background:transparent; border:none; cursor:pointer; font-size:24px; color:var(--text-secondary); padding:4px 8px; border-radius:6px;">&times;</button>
        </div>
      </div>
      <div class="cv-modal-body" style="padding:24px; overflow-y:auto; max-height:calc(85vh - 70px); display:flex; justify-content:center; background:var(--bg-subtle, #f8fafc);">
        <div class="cv-paper-sheet" style="box-shadow:0 8px 30px rgba(0,0,0,0.12); width:210mm; min-height:297mm; background:#fff; padding:18mm 16mm;">
          ${previewHtml}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";

  const closeBtn = backdrop.querySelector(".cv-modal-close");
  const useBtn = backdrop.querySelector(".btn-primary");

  const close = () => {
    document.removeEventListener("keydown", onKeyDown, true);
    backdrop.remove();
    document.body.style.overflow = "";
    activeModal = null;
    if (returnFocus && typeof returnFocus.focus === "function") {
      returnFocus.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      const focusables = [closeBtn, useBtn].filter(Boolean);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener("keydown", onKeyDown, true);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });
  closeBtn.addEventListener("click", close);

  activeModal = { close };
  window.requestAnimationFrame(() => closeBtn.focus());
}

export async function initTemplatesPage() {
  const bannerEl = document.getElementById("data-source-banner");
  const gridEl = document.getElementById("templates-grid");
  if (!gridEl) return;

  // 1. Chờ auth.ready hoàn tất
  await auth.ready;
  const session = auth.getSession();
  const { user, role, isAuthenticated } = session;

  let cvData = JSON.parse(JSON.stringify(DEMO_CV_DATA));
  let bannerState = "guest"; // "guest" | "complete" | "incomplete" | "employer_admin" | "error"
  let missingFields = [];
  let apiErrorMsg = "";

  // 2. Tải cấu hình mẫu từ API (bao gồm chuẩn ATS)
  let templatesMeta = [];
  try {
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const tplRes = await fetch(`${base}/meta/cv-templates`);
    if (tplRes.ok) {
      templatesMeta = await tplRes.json();
    }
  } catch {
    // Nếu API meta tạm ngắt, fallback sang CV_TEMPLATES cấu hình sẵn
  }

  const atsMap = {};
  if (Array.isArray(templatesMeta)) {
    templatesMeta.forEach((t) => {
      atsMap[t.slug] = Boolean(t.ats_friendly);
    });
  }

  // 3. Quyết định nguồn dữ liệu & trạng thái banner
  if (!isAuthenticated || !user) {
    bannerState = "guest";
  } else if (role === "recruiter" || role === "employer" || role === "admin") {
    bannerState = "employer_admin";
  } else if (role === "candidate") {
    try {
      const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
      const profileRes = await fetch(`${base}/candidate/profile`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (!profileRes.ok) {
        throw new Error(`Mã lỗi ${profileRes.status}`);
      }

      const pData = await profileRes.json();
      const norm = normalizeCvData(pData.data || pData);

      // Kiểm tra tiêu chuẩn hồ sơ đủ: họ tên, chức danh, >= 1 kinh nghiệm hoặc học vấn
      const hasName = Boolean((norm.full_name || "").trim());
      const hasHeadline = Boolean((norm.headline || "").trim());
      const hasExp = Array.isArray(norm.experiences) && norm.experiences.length > 0;
      const hasEdu = Array.isArray(norm.educations) && norm.educations.length > 0;

      if (!hasExp) missingFields.push({ label: "kinh nghiệm", section: "section-experiences" });
      if (!hasEdu) missingFields.push({ label: "học vấn", section: "section-educations" });

      if (hasName && hasHeadline && (hasExp || hasEdu)) {
        if (hasExp && hasEdu) {
          bannerState = "complete";
          cvData = norm;
        } else {
          bannerState = "incomplete";
          // Trộn phần thiếu bằng dữ liệu minh họa
          cvData = {
            ...norm,
            experiences: hasExp ? norm.experiences : DEMO_CV_DATA.experiences,
            educations: hasEdu ? norm.educations : DEMO_CV_DATA.educations,
            _isPartialDemo: {
              experiences: !hasExp,
              educations: !hasEdu,
            },
          };
        }
      } else {
        bannerState = "incomplete";
        if (!hasHeadline) missingFields.unshift({ label: "chức danh", section: "headline" });
        if (!hasName) missingFields.unshift({ label: "họ tên", section: "full_name" });
        cvData = {
          ...norm,
          full_name: norm.full_name || DEMO_CV_DATA.full_name,
          headline: norm.headline || DEMO_CV_DATA.headline,
          experiences: hasExp ? norm.experiences : DEMO_CV_DATA.experiences,
          educations: hasEdu ? norm.educations : DEMO_CV_DATA.educations,
          _isPartialDemo: {
            experiences: !hasExp,
            educations: !hasEdu,
          },
        };
      }
    } catch (err) {
      bannerState = "error";
      apiErrorMsg = err?.message || "Không thể kết nối đến máy chủ";
    }
  }

  // 4. Render Banner theo 5 trạng thái
  if (bannerEl) {
    if (bannerState === "guest") {
      bannerEl.innerHTML = `
        <div class="cv-status-banner cv-banner-guest" role="status" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; background:var(--bg-subtle, #f8fafc); border:1px solid var(--border-default, #e2e8f0); padding:14px 20px; border-radius:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge" style="background:#fef08a; color:#854d0e; font-weight:700; padding:4px 8px; border-radius:6px; font-size:12px;">Dữ liệu minh họa</span>
            <span style="font-size:13.5px; color:var(--text-secondary);">Bạn đang xem các mẫu với dữ liệu mẫu IT. Hãy đăng nhập để xem trước với hồ sơ thật của chính bạn!</span>
          </div>
          <a href="${loginUrl(cvTemplatesUrl())}" class="btn btn-outline" style="font-size:12.5px; padding:6px 14px; text-decoration:none; font-weight:600;">Đăng nhập ngay</a>
        </div>`;
    } else if (bannerState === "complete") {
      // Ứng viên có hồ sơ đủ: KHÔNG hiện banner theo yêu cầu
      bannerEl.innerHTML = "";
    } else if (bannerState === "incomplete") {
      const missingList = missingFields.map((f) => `<a href="${candidateProfileUrl(f.section)}" style="color:var(--primary-700, #0f766e); font-weight:600; text-decoration:none;">${escapeHtml(f.label)}</a>`).join(", ");
      bannerEl.innerHTML = `
        <div class="cv-status-banner cv-banner-incomplete" role="status" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; background:#fefce8; border:1px solid #fef08a; padding:14px 20px; border-radius:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge" style="background:#fef9c3; color:#a16207; font-weight:700; padding:4px 8px; border-radius:6px; font-size:12px;">Hồ sơ còn thiếu</span>
            <span style="font-size:13.5px; color:#854d0e;">
              Hồ sơ còn thiếu: ${missingList}. Phần thiếu đang dùng dữ liệu minh họa.
            </span>
          </div>
          <a href="${candidateProfileUrl()}" class="btn btn-outline" style="font-size:12.5px; padding:6px 14px; text-decoration:none; font-weight:600; background:#fff;">Bổ sung hồ sơ</a>
        </div>`;
    } else if (bannerState === "employer_admin") {
      bannerEl.innerHTML = `
        <div class="cv-status-banner cv-banner-employer" role="status" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; background:var(--bg-subtle, #f8fafc); border:1px solid var(--border-default, #e2e8f0); padding:14px 20px; border-radius:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700; padding:4px 8px; border-radius:6px; font-size:12px;">Dành cho ứng viên</span>
            <span style="font-size:13.5px; color:var(--text-secondary);">Mẫu CV dành cho ứng viên. Bạn đang xem với dữ liệu minh họa mẫu IT.</span>
          </div>
        </div>`;
    } else if (bannerState === "error") {
      bannerEl.innerHTML = `
        <div class="cv-status-banner cv-banner-error" role="alert" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; background:#fff1f2; border:1px solid #fecdd3; padding:14px 20px; border-radius:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge" style="background:#ffe4e6; color:#be123c; font-weight:700; padding:4px 8px; border-radius:6px; font-size:12px;">Lỗi tải hồ sơ</span>
            <span style="font-size:13.5px; color:#9f1239;">Không thể tải dữ liệu hồ sơ (${escapeHtml(apiErrorMsg)}). Vui lòng thử lại.</span>
          </div>
          <button type="button" id="cv-retry-btn" class="btn btn-outline" style="font-size:12.5px; padding:6px 14px; cursor:pointer; font-weight:600; background:#fff;">Thử lại</button>
        </div>`;
      document.getElementById("cv-retry-btn")?.addEventListener("click", () => {
        initTemplatesPage();
      });
    }
  }

  // 5. Render lưới thẻ mẫu CV
  // Lưới 4 cột (>= 1280px), 2 cột (>= 768px), 1 cột (< 768px)
  gridEl.className = "cv-templates-responsive-grid";
  gridEl.innerHTML = CV_TEMPLATES.map((tpl) => {
    // Nhãn chuẩn ATS: Chỉ hiện khi API trả true (hoặc atsMap trả true)
    const isAts = atsMap[tpl.slug] !== undefined ? atsMap[tpl.slug] : Boolean(tpl.is_ats);
    const atsBadge = isAts
      ? `<span class="badge cv-ats-badge" style="background:#ccfbf1; color:#0f766e; font-weight:600; padding:3px 8px; border-radius:4px; font-size:11.5px;">✓ Chuẩn ATS</span>`
      : "";

    const previewHtml = renderCvDocument(tpl.slug, cvData);

    return `
      <div class="template-card" data-slug="${escapeHtml(tpl.slug)}" style="background:var(--bg-surface, #fff); border:1px solid var(--border-default, #e2e8f0); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:transform 0.2s, box-shadow 0.2s; height:100%;">
        <div style="padding:16px 20px 12px; border-bottom:1px solid var(--border-default, #e2e8f0); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2 style="font-size:16px; font-weight:700; color:var(--text-primary); margin:0 0 2px;">Mẫu ${escapeHtml(tpl.name)}</h2>
            <div style="font-size:12px; color:var(--text-tertiary);">${escapeHtml(tpl.category)}</div>
          </div>
          ${atsBadge}
        </div>
        <p style="font-size:12.5px; color:var(--text-secondary); margin:0; padding:10px 20px; line-height:1.45; min-height:42px;">
          ${escapeHtml(tpl.tagline)}
        </p>
        <div class="cv-preview-container" style="background:var(--bg-subtle, #f8fafc); border-top:1px solid var(--border-default, #e2e8f0); border-bottom:1px solid var(--border-default, #e2e8f0); aspect-ratio:1/1.414; width:100%; overflow:hidden; position:relative; display:flex; justify-content:center; align-items:flex-start;">
          <div class="cv-scaled-paper" style="transform:scale(0.34); transform-origin:top center; pointer-events:none; width:210mm; min-height:297mm; background:#fff; padding:16mm 14mm; box-shadow:0 4px 14px rgba(0,0,0,0.06); box-sizing:border-box;">
            ${previewHtml}
          </div>
        </div>
        <div style="padding:14px 18px; margin-top:auto; display:flex; gap:10px; justify-content:space-between; align-items:center;">
          <button type="button" class="btn btn-outline cv-preview-btn" data-preview-slug="${escapeHtml(tpl.slug)}" style="flex:1; text-align:center; padding:9px 12px; font-size:13px; font-weight:600; cursor:pointer;">
            Xem lớn
          </button>
          <a href="${cvBuilderUrl({ template: tpl.slug })}" class="btn btn-primary" style="flex:1; text-align:center; text-decoration:none; padding:9px 12px; font-size:13px; font-weight:600;">
            Dùng mẫu này
          </a>
        </div>
      </div>`;
  }).join("");

  // Gắn sự kiện "Xem lớn"
  gridEl.querySelectorAll(".cv-preview-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slug = btn.dataset.previewSlug;
      const tpl = CV_TEMPLATES.find((t) => t.slug === slug);
      if (tpl) openPreviewModal(tpl, cvData, btn);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTemplatesPage);
} else {
  initTemplatesPage();
}
