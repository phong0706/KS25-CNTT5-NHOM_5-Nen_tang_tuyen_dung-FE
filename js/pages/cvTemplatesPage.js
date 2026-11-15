/**
 * Logic hiển thị Thư viện Mẫu CV (/pages/cv-templates.html)
 * Tuân thủ techrecruit-rules: dữ liệu động, XSS safe, phân biệt đăng nhập / minh hoạ.
 */
import { DEMO_CV_DATA, normalizeCvData } from "../cv/cvMockData.js";
import { CV_TEMPLATES, renderCvDocument } from "../cv/cvTemplates.js";

async function initTemplatesPage() {
  const bannerEl = document.getElementById("data-source-banner");
  const gridEl = document.getElementById("templates-grid");
  if (!gridEl) return;

  let cvData = DEMO_CV_DATA;
  let isDemo = true;

  // 1. Kiểm tra trạng thái đăng nhập
  const currentUser = window.Auth ? window.Auth.getUser() : null;
  if (currentUser) {
    try {
      const res = await window.api.get("/candidate/profile");
      if (res) {
        cvData = normalizeCvData(res.data || res);
        isDemo = false;
      }
    } catch {
      // Nếu chưa có profile hoặc lỗi nhẹ, fallback về demo
      isDemo = true;
    }
  }

  // 2. Render thông báo nguồn dữ liệu
  if (bannerEl) {
    if (isDemo) {
      bannerEl.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; background:var(--primary-50, #f0fdf4); border:1px solid var(--primary-200, #bbf7d0); padding:12px 18px; border-radius:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge" style="background:#fef08a; color:#854d0e; font-weight:700; padding:4px 8px; border-radius:6px; font-size:12px;">Dữ liệu minh họa</span>
            <span style="font-size:13.5px; color:var(--text-secondary);">Bạn đang xem các mẫu với dữ liệu mẫu IT. Hãy đăng nhập để xem trước với hồ sơ thật của chính bạn!</span>
          </div>
          <a href="../pages/login.html?redirect=pages/cv-templates.html" class="btn btn-outline" style="font-size:12.5px; padding:6px 14px; text-decoration:none;">Đăng nhập ngay</a>
        </div>`;
    } else {
      bannerEl.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; background:#eff6ff; border:1px solid #bfdbfe; padding:12px 18px; border-radius:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="badge" style="background:#dbeafe; color:#1e40af; font-weight:700; padding:4px 8px; border-radius:6px; font-size:12px;">Hồ sơ của bạn</span>
            <span style="font-size:13.5px; color:#1e3a8a;">Đang tải trực tiếp thông tin từ hồ sơ ứng viên: <strong>${escapeHtml(cvData.full_name || currentUser.full_name)}</strong></span>
          </div>
          <a href="../pages/candidate/profile.html" class="btn btn-outline" style="font-size:12.5px; padding:6px 14px; text-decoration:none;">Cập nhật hồ sơ gốc</a>
        </div>`;
    }
  }

  // 3. Render lưới 4 mẫu
  gridEl.innerHTML = CV_TEMPLATES.map((tpl) => {
    const atsBadge = tpl.is_ats
      ? `<span class="badge" style="background:#ccfbf1; color:#0f766e; font-weight:600; padding:3px 8px; border-radius:4px; font-size:11.5px;">✓ Chuẩn ATS</span>`
      : "";
    const previewHtml = renderCvDocument(tpl.slug, cvData);

    return `
      <div class="template-card" style="background:var(--bg); border:1px solid var(--border-default); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:var(--shadow-sm); transition:transform 0.2s, box-shadow 0.2s;">
        <div style="padding:16px 20px 12px; border-bottom:1px solid var(--border-default); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2 style="font-size:16px; font-weight:700; color:var(--text-primary); margin:0 0 2px;">Mẫu ${escapeHtml(tpl.name)}</h2>
            <div style="font-size:12px; color:var(--text-tertiary);">${escapeHtml(tpl.category)}</div>
          </div>
          ${atsBadge}
        </div>
        <p style="font-size:12.5px; color:var(--text-secondary); margin:0; padding:10px 20px; line-height:1.45; min-height:42px;">
          ${escapeHtml(tpl.tagline)}
        </p>
        <div style="background:#f8fafc; border-top:1px solid var(--border-default); border-bottom:1px solid var(--border-default); height:320px; overflow:hidden; position:relative; display:flex; justify-content:center;">
          <div style="transform:scale(0.38); transform-origin:top center; pointer-events:none; width:210mm; background:#fff; padding:15mm; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
            ${previewHtml}
          </div>
        </div>
        <div style="padding:16px 20px; margin-top:auto; display:flex; gap:10px; justify-content:space-between; align-items:center;">
          <a href="../pages/candidate/cv-builder.html?template=${tpl.slug}" class="btn btn-primary" style="flex:1; text-align:center; text-decoration:none; padding:10px 16px; font-size:13.5px; font-weight:600;">
            Dùng mẫu này
          </a>
        </div>
      </div>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", initTemplatesPage);
