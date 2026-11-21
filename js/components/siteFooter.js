/**
 * siteFooter.js - Render footer động từ NAV_MEGA_CONFIG & NAV_BY_ROLE (< 120 dòng).
 * - Chỉ hiện các link có status === "ready".
 * - Hotline/email ẩn nếu không có trong file cấu hình thật (CONFIG).
 * - Không có link giả hay text thừa.
 */
import { NAV_MEGA_CONFIG, NAV_BY_ROLE } from "../config/navConfig.js";
import { routePath } from "../routes.js";

function getRootPath() {
  return "";
}

function resolve(_root, path) {
  if (!path) return "#";
  return routePath(path);
}

export function renderSiteFooter() {
  const footerEl = document.getElementById("app-footer");
  if (!footerEl) return;

  const root = getRootPath();
  const cfg = (typeof window.CONFIG !== "undefined" && window.CONFIG) || {};

  // Lấy danh sách link ready từ navConfig
  const candidateLinks = [];
  const toolLinks = [];
  const recruiterLinks = [];

  NAV_MEGA_CONFIG.forEach((g) => {
    (g.columns || []).forEach((c) => {
      (c.items || []).forEach((item) => {
        if (item.status === "ready") {
          if (g.id === "jobs" || g.id === "cv") {
            if (!candidateLinks.some((x) => x.path === item.path)) candidateLinks.push(item);
          } else if (g.id === "tools" || g.id === "handbook") {
            if (!toolLinks.some((x) => x.path === item.path)) toolLinks.push(item);
          }
        }
      });
    });
  });

  (NAV_BY_ROLE.recruiter?.actions || []).forEach((item) => {
    if (item.status === "ready" && !recruiterLinks.some((x) => x.path === item.path)) {
      recruiterLinks.push(item);
    }
  });

  // Hỗ trợ & Liên hệ (chỉ hiện khi có trong cấu hình thật)
  const contactItems = [];
  if (cfg.SUPPORT_EMAIL) {
    contactItems.push(`<li><a href="mailto:${cfg.SUPPORT_EMAIL}">${cfg.SUPPORT_EMAIL}</a></li>`);
  }
  if (cfg.HOTLINE) {
    contactItems.push(`<li><a href="tel:${cfg.HOTLINE.replace(/\s+/g, "")}">Hotline: ${cfg.HOTLINE}</a></li>`);
  }
  if (cfg.ADDRESS) {
    contactItems.push(`<li class="footer-addr">${cfg.ADDRESS}</li>`);
  }
  contactItems.push(`<li><a href="${resolve(root, "pages/about.html")}">Giới thiệu dự án</a></li>`);

  footerEl.innerHTML = `
    <div class="container footer-top-grid">
      <div>
        <div class="footer-brand-title">
          <div class="brand-icon-box" style="width: 28px; height: 28px;">
            <svg class="brand-logo-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path class="logo-path-case" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>
              <path class="logo-path-handle" d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <path class="logo-path-prompt" d="M8 13.5l2.5-2L8 9.5"/>
              <path class="logo-path-cursor" d="M13 14h3"/>
            </svg>
          </div>
          <span>TechRecruit</span>
        </div>
        <p class="footer-desc">
          Nền tảng tuyển dụng IT kết nối kỹ sư công nghệ với các doanh nghiệp hàng đầu.
        </p>
      </div>

      <div>
        <div class="footer-col-title">Dành cho Ứng viên</div>
        <ul class="footer-links-list">
          ${candidateLinks.slice(0, 5).map((l) => `<li><a href="${resolve(root, l.path)}">${l.label}</a></li>`).join("")}
        </ul>
      </div>

      <div>
        <div class="footer-col-title">Công cụ & Tuyển dụng</div>
        <ul class="footer-links-list">
          ${toolLinks.slice(0, 3).map((l) => `<li><a href="${resolve(root, l.path)}">${l.label}</a></li>`).join("")}
          ${recruiterLinks.slice(0, 2).map((l) => `<li><a href="${resolve(root, l.path)}">${l.label}</a></li>`).join("")}
        </ul>
      </div>

      <div>
        <div class="footer-col-title">Thông tin dự án</div>
        <ul class="footer-links-list">
          ${contactItems.join("")}
        </ul>
      </div>
    </div>

    <div class="footer-bottom-bar">
      <div class="container footer-bottom-inner">
        <span>© ${new Date().getFullYear()} TechRecruit. Tất cả quyền được bảo lưu.</span>
        <span><a href="${resolve(root, "pages/about.html")}" style="color:inherit;text-decoration:underline;">Giới thiệu dự án</a></span>
      </div>
    </div>
  `;
}
