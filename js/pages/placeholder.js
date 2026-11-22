/**
 * placeholder.js - Trình điều khiển trang "Sắp ra mắt" & Công cụ Định hướng vai trò
 * Giới hạn: < 200 dòng.
 */
import { NAV_MEGA_CONFIG, NAV_BY_ROLE } from "../config/navConfig.js";
import { MENU_ICONS } from "../config/navIcons.js";
import { FEATURE_HIGHLIGHTS, DEFAULT_HIGHLIGHT } from "../config/featureHighlights.js";
import { siteUrl } from "../components/siteHeader.js";
import { homeUrl, hydrateDataRoutes } from "../routes.js";
import { initRoleOrientation } from "./roleOrientation.js";

function esc(v) {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
}

function getIconSvg(iconKey, size = 32) {
  const raw = MENU_ICONS[iconKey] || MENU_ICONS.briefcase;
  return raw.replace(/width="18"\s+height="18"/, `width="${size}" height="${size}"`);
}

function findFeature(slug) {
  if (!slug) return null;
  const target = `feature=${slug.trim()}`;
  for (const group of NAV_MEGA_CONFIG) {
    for (const col of group.columns || []) {
      for (const item of col.items || []) {
        if (item.path && item.path.includes(target)) return { item, group, col };
      }
    }
  }
  for (const [roleKey, roleObj] of Object.entries(NAV_BY_ROLE)) {
    for (const action of roleObj.actions || []) {
      if (action.path && action.path.includes(target)) {
        return { item: action, group: { label: roleObj.label || "Tài khoản", id: roleKey }, col: { title: roleObj.label } };
      }
    }
  }
  return null;
}

function getSuggestions(group) {
  const list = [];
  const searchGroup = (g) => {
    for (const c of g?.columns || []) {
      for (const it of c.items || []) {
        if (it.status === "ready" && it.path && !it.path.includes("placeholder.html") && !list.some((x) => x.path === it.path)) {
          list.push(it);
          if (list.length >= 3) return;
        }
      }
    }
  };
  searchGroup(group);
  if (list.length < 3) {
    for (const g of NAV_MEGA_CONFIG) {
      if (g.id !== group?.id) searchGroup(g);
      if (list.length >= 3) break;
    }
  }
  return list.slice(0, 3);
}

document.addEventListener("DOMContentLoaded", () => {
  const slug = new URLSearchParams(window.location.search).get("feature");
  const bcGroup = document.getElementById("breadcrumb-group");
  const bcSep = document.getElementById("breadcrumb-sep");
  const bcCurrent = document.getElementById("breadcrumb-current");
  const contentEl = document.getElementById("placeholder-content");
  const suggestionsEl = document.getElementById("placeholder-suggestions");

  // Xử lý riêng cho tính năng Định hướng vai trò (thay thế trắc nghiệm tính cách cũ)
  if (slug === "cv-upload") {
    window.location.replace(siteUrl("pages/candidate/cvs.html?upload=1"));
    return;
  }
  if (slug === "unemployment-insurance") {
    window.location.replace(siteUrl("pages/tools/unemployment-insurance.html"));
    return;
  }
  if (slug === "personality-test" || slug === "role-orientation") {
    document.title = "Định hướng vai trò IT | TechRecruit";
    if (bcGroup) { bcGroup.style.display = "inline"; bcGroup.textContent = "Công cụ"; }
    if (bcSep) bcSep.style.display = "inline";
    if (bcCurrent) bcCurrent.textContent = "Định hướng vai trò";
    if (suggestionsEl) suggestionsEl.innerHTML = "";
    if (contentEl) initRoleOrientation(contentEl);
    hydrateDataRoutes(document);
    return;
  }

  const match = findFeature(slug);
  if (!match) {
    document.title = "Không tìm thấy trang | TechRecruit";
    if (bcGroup) bcGroup.style.display = "none";
    if (bcSep) bcSep.style.display = "none";
    if (bcCurrent) bcCurrent.textContent = "Không tìm thấy trang";
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="max-width:560px; margin:80px auto; text-align:center;">
          <h1 style="font-size:28px; font-weight:700; color:var(--text-primary); margin-bottom:12px;">Không tìm thấy trang</h1>
          <p style="font-size:15px; color:var(--text-secondary); margin-bottom:24px;">Trang bạn yêu cầu không tồn tại hoặc đã được cập nhật đường dẫn mới.</p>
          <a href="${homeUrl()}" class="btn btn-primary" style="height:44px; padding:0 24px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; text-decoration:none;">Về trang chủ</a>
        </div>`;
    }
    if (suggestionsEl) suggestionsEl.innerHTML = "";
    hydrateDataRoutes(document);
    return;
  }

  const { item, group } = match;
  document.title = `${item.label} đang hoàn thiện | TechRecruit`;
  if (bcGroup) { bcGroup.style.display = "inline"; bcGroup.textContent = group.label; }
  if (bcSep) bcSep.style.display = "inline";
  if (bcCurrent) bcCurrent.textContent = item.label;

  const hData = FEATURE_HIGHLIGHTS[slug] || DEFAULT_HIGHLIGHT;
  const iconSvg = getIconSvg(item.icon, 36);

  const highlightsHtml = (hData.highlights || []).map((h) => `
    <div class="placeholder-highlight-card">
      <div class="placeholder-hl-icon">${getIconSvg(h.icon, 20)}</div>
      <div class="placeholder-hl-title">${esc(h.title)}</div>
      <div class="placeholder-hl-desc">${esc(h.desc)}</div>
    </div>`).join("");

  if (contentEl) {
    contentEl.innerHTML = `
      <div class="placeholder-hero">
        <div class="placeholder-badge"><span class="placeholder-badge-dot"></span> ĐANG TRONG GIAI ĐOẠN PHÁT TRIỂN</div>
        <div class="placeholder-icon-wrap">${iconSvg}</div>
        <h1 class="placeholder-title">${esc(item.label)}</h1>
        <p class="placeholder-tagline">${esc(hData.tagline || item.desc)}</p>
        <div class="placeholder-highlights-grid">${highlightsHtml}</div>
      </div>`;
  }

  const suggestions = getSuggestions(group);
  if (suggestionsEl && suggestions.length > 0) {
    const cardsHtml = suggestions.map((s) => `
      <a href="${siteUrl(s.path)}" style="background:var(--bg); border:1px solid var(--border-default); border-radius:12px; padding:18px 20px; display:flex; align-items:flex-start; gap:14px; text-decoration:none; color:inherit; box-shadow:var(--shadow-sm); transition:all 0.2s;">
        <div style="width:40px; height:40px; border-radius:8px; background:var(--primary-50, #f0fdf4); color:var(--primary, #0d9488); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          ${getIconSvg(s.icon, 20)}
        </div>
        <div>
          <div style="font-size:14.5px; font-weight:600; color:var(--text-primary); margin-bottom:4px;">${esc(s.label)}</div>
          <div style="font-size:12.5px; color:var(--text-secondary); line-height:1.4;">${esc(s.desc || "")}</div>
        </div>
      </a>`).join("");

    suggestionsEl.innerHTML = `
      <div style="border-top:1px solid var(--border-default); padding-top:40px; margin:20px 0 40px;">
        <h2 style="font-size:14px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; text-align:center; margin-bottom:24px;">
          Khám phá các công cụ đã sẵn sàng trong nhóm ${esc(group.label)}
        </h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">${cardsHtml}</div>
      </div>`;
  }
  hydrateDataRoutes(document);
});
