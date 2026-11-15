/**
 * placeholder.js - Trình điều khiển trang khung "Sắp ra mắt" & 404
 * Nguồn dữ liệu duy nhất: js/config/navConfig.js (Cấm viết cứng danh sách).
 * Giới hạn: < 200 dòng.
 */
import { NAV_MEGA_CONFIG, NAV_BY_ROLE } from "../config/navConfig.js";
import { MENU_ICONS } from "../config/navIcons.js";
import { siteUrl } from "../components/siteHeader.js";

function esc(v) {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
}

function getIconSvg(iconKey, size = 32) {
  const raw = MENU_ICONS[iconKey] || MENU_ICONS.briefcase;
  return raw.replace(/width="18"\s+height="18"/, `width="${size}" height="${size}"`);
}

function findFeatureInConfig(slug) {
  if (!slug) return null;
  const target = `feature=${slug.trim()}`;

  // 1. Tìm trong NAV_MEGA_CONFIG
  for (const group of NAV_MEGA_CONFIG) {
    for (const col of group.columns || []) {
      for (const item of col.items || []) {
        if (item.path && item.path.includes(target)) {
          return { item, group, col };
        }
      }
    }
  }

  // 2. Tìm trong NAV_BY_ROLE
  for (const [roleKey, roleObj] of Object.entries(NAV_BY_ROLE)) {
    for (const action of roleObj.actions || []) {
      if (action.path && action.path.includes(target)) {
        return {
          item: action,
          group: { label: roleObj.label || "Tài khoản", id: roleKey },
          col: { title: roleObj.label },
        };
      }
    }
  }

  return null;
}

function getGroupReadySuggestions(group) {
  const readyItems = [];
  if (group && group.columns) {
    for (const col of group.columns) {
      for (const item of col.items || []) {
        if (item.status === "ready" && item.path && !item.path.includes("placeholder.html")) {
          readyItems.push(item);
        }
      }
    }
  }

  // Bổ sung thêm từ các nhóm khác nếu chưa đủ 3
  if (readyItems.length < 3) {
    for (const otherGroup of NAV_MEGA_CONFIG) {
      if (otherGroup.id === group?.id) continue;
      for (const col of otherGroup.columns || []) {
        for (const item of col.items || []) {
          if (item.status === "ready" && item.path && !item.path.includes("placeholder.html")) {
            if (!readyItems.some((r) => r.path === item.path)) {
              readyItems.push(item);
              if (readyItems.length >= 3) break;
            }
          }
        }
        if (readyItems.length >= 3) break;
      }
      if (readyItems.length >= 3) break;
    }
  }
  return readyItems.slice(0, 3);
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("feature");

  const bcGroup = document.getElementById("breadcrumb-group");
  const bcSep = document.getElementById("breadcrumb-sep");
  const bcCurrent = document.getElementById("breadcrumb-current");
  const contentEl = document.getElementById("placeholder-content");
  const suggestionsEl = document.getElementById("placeholder-suggestions");

  const match = findFeatureInConfig(slug);

  // 1. Trường hợp 404: Không tìm thấy slug trong navConfig
  if (!match) {
    document.title = "Không tìm thấy trang | TechRecruit";
    if (bcGroup) bcGroup.style.display = "none";
    if (bcSep) bcSep.style.display = "none";
    if (bcCurrent) bcCurrent.textContent = "Không tìm thấy trang";

    if (contentEl) {
      contentEl.innerHTML = `
        <div style="max-width:560px; margin:96px auto 0; text-align:center;">
          <div style="width:64px; height:64px; border-radius:50%; background:#fee2e2; color:#dc2626; display:flex; align-items:center; justify-content:center; margin:0 auto;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h1 style="font-size:28px; font-weight:600; color:var(--text-primary); margin:20px 0 10px; line-height:1.3;">Không tìm thấy trang</h1>
          <p style="font-size:16px; color:var(--text-secondary); margin:0 0 28px; line-height:1.6;">
            Tính năng hoặc trang bạn đang tìm kiếm không tồn tại hoặc đã được cập nhật đường dẫn mới.
          </p>
          <div style="display:flex; justify-content:center;">
            <a href="../index.html" class="btn btn-primary" style="height:44px; padding:0 24px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; justify-content:center; text-decoration:none;">
              Về trang chủ
            </a>
          </div>
        </div>`;
    }
    if (suggestionsEl) suggestionsEl.innerHTML = "";
    return;
  }

  // 2. Trường hợp tìm thấy tính năng "soon"
  const { item, group } = match;
  document.title = `${item.label} sắp ra mắt | TechRecruit`;

  if (bcGroup) {
    bcGroup.style.display = "inline";
    bcGroup.textContent = group.label;
  }
  if (bcSep) bcSep.style.display = "inline";
  if (bcCurrent) bcCurrent.textContent = item.label;

  const iconSvg = getIconSvg(item.icon, 32);

  if (contentEl) {
    contentEl.innerHTML = `
      <div style="max-width:560px; margin:96px auto 0; text-align:center;">
        <div style="width:64px; height:64px; border-radius:50%; background:var(--primary-50, #f0fdf4); color:var(--primary, #0d9488); display:flex; align-items:center; justify-content:center; margin:0 auto;">
          ${iconSvg}
        </div>
        <h1 style="font-size:28px; font-weight:600; color:var(--text-primary); margin:20px 0 10px; line-height:1.3;">
          ${esc(item.label)} sắp ra mắt
        </h1>
        <p style="font-size:16px; color:var(--text-secondary); margin:0 0 28px; line-height:1.6;">
          ${esc(item.desc || "Tính năng đang được đội ngũ TechRecruit phát triển để mang lại trải nghiệm tối ưu nhất cho bạn.")}
        </p>
        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-bottom:48px;">
          <a href="../pages/jobs.html" class="btn btn-primary" style="height:44px; padding:0 24px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; justify-content:center; text-decoration:none;">
            Khám phá việc làm
          </a>
          <a href="../index.html" class="btn btn-outline" style="height:44px; padding:0 20px; font-size:14px; font-weight:500; display:inline-flex; align-items:center; justify-content:center; text-decoration:none;">
            Về trang chủ
          </a>
        </div>
      </div>`;
  }

  // 3. Render 3 thẻ gợi ý cùng nhóm có status ready
  const suggestions = getGroupReadySuggestions(group);
  if (suggestionsEl && suggestions.length > 0) {
    const cardsHtml = suggestions
      .map((s) => {
        const sIcon = getIconSvg(s.icon, 20);
        return `
          <a href="${siteUrl(s.path, "../")}" style="background:var(--bg); border:1px solid var(--border-default); border-radius:12px; padding:18px 20px; display:flex; align-items:flex-start; gap:14px; text-decoration:none; color:inherit; box-shadow:var(--shadow-sm); transition:transform 0.2s, box-shadow 0.2s;">
            <div style="width:40px; height:40px; border-radius:8px; background:var(--primary-50, #f0fdf4); color:var(--primary, #0d9488); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${sIcon}
            </div>
            <div>
              <div style="font-size:14.5px; font-weight:600; color:var(--text-primary); margin-bottom:4px;">${esc(s.label)}</div>
              <div style="font-size:12.5px; color:var(--text-secondary); line-height:1.4;">${esc(s.desc || "")}</div>
            </div>
          </a>`;
      })
      .join("");

    suggestionsEl.innerHTML = `
      <div style="border-top:1px solid var(--border-default); padding-top:40px; margin-top:24px;">
        <h2 style="font-size:14px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; text-align:center; margin-bottom:20px;">
          Tính năng sẵn sàng trong nhóm ${esc(group.label)}
        </h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
          ${cardsHtml}
        </div>
      </div>`;
  }
});
