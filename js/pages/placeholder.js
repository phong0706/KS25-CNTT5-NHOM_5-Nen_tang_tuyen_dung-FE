/**
 * placeholder.js - Trình điều khiển trang "Sắp ra mắt" & 404
 * Nguồn dữ liệu duy nhất: js/config/navConfig.js + js/config/featureHighlights.js
 * Giới hạn: < 200 dòng.
 */
import { NAV_MEGA_CONFIG, NAV_BY_ROLE } from "../config/navConfig.js";
import { MENU_ICONS } from "../config/navIcons.js";
import { FEATURE_HIGHLIGHTS, DEFAULT_HIGHLIGHT } from "../config/featureHighlights.js";
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

function renderNotifyForm(slug) {
  const saved = localStorage.getItem(`early_access_${slug}`);
  if (saved) {
    return `<div class="placeholder-notify-success">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>Đã đăng ký nhận tin với email: <strong>${esc(saved)}</strong></span>
    </div>`;
  }
  return `<form id="early-access-form" class="placeholder-notify-form" novalidate>
    <input type="email" id="early-email" class="placeholder-notify-input" placeholder="Nhập email của bạn..." required />
    <button type="submit" class="placeholder-notify-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      <span>Nhắc tôi khi ra mắt</span>
    </button>
  </form>`;
}

function initEarlyAccess(slug) {
  const form = document.getElementById("early-access-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("early-email")?.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (window.showToast) window.showToast("Vui lòng nhập địa chỉ email hợp lệ", "error");
      return;
    }
    localStorage.setItem(`early_access_${slug}`, email);
    if (window.showToast) window.showToast("Đăng ký thành công! Bạn sẽ nhận tin ngay khi tính năng ra mắt.", "success");
    const container = form.parentElement;
    if (container) {
      form.remove();
      const div = document.createElement("div");
      div.className = "placeholder-notify-success";
      div.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Đã đăng ký nhận tin với email: <strong>${esc(email)}</strong></span>`;
      container.appendChild(div);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const slug = new URLSearchParams(window.location.search).get("feature");
  const bcGroup = document.getElementById("breadcrumb-group");
  const bcSep = document.getElementById("breadcrumb-sep");
  const bcCurrent = document.getElementById("breadcrumb-current");
  const contentEl = document.getElementById("placeholder-content");
  const suggestionsEl = document.getElementById("placeholder-suggestions");

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
          <a href="../index.html" class="btn btn-primary" style="height:44px; padding:0 24px; font-size:14px; font-weight:600; display:inline-flex; align-items:center; text-decoration:none;">Về trang chủ</a>
        </div>`;
    }
    if (suggestionsEl) suggestionsEl.innerHTML = "";
    return;
  }

  const { item, group } = match;
  document.title = `${item.label} sắp ra mắt | TechRecruit`;
  if (bcGroup) { bcGroup.style.display = "inline"; bcGroup.textContent = group.label; }
  if (bcSep) bcSep.style.display = "inline";
  if (bcCurrent) bcCurrent.textContent = item.label;

  const hData = FEATURE_HIGHLIGHTS[slug] || DEFAULT_HIGHLIGHT;
  const iconSvg = getIconSvg(item.icon, 36);

  const highlightsHtml = hData.highlights.map((h) => `
    <div class="placeholder-highlight-card">
      <div class="placeholder-hl-icon">${getIconSvg(h.icon, 20)}</div>
      <div class="placeholder-hl-title">${esc(h.title)}</div>
      <div class="placeholder-hl-desc">${esc(h.desc)}</div>
    </div>`).join("");

  if (contentEl) {
    const showBanner = hData?.etaDate && !isNaN(new Date(hData.etaDate).getTime()) ? new Date(hData.etaDate) >= new Date() : Boolean(hData?.eta);
    const isDev = Boolean(window.APP_CONFIG?.isDev || localStorage.getItem("dev_mode") === "true" || new URLSearchParams(location.search).get("dev") === "1");
    contentEl.innerHTML = `
      <div class="placeholder-hero">
        ${showBanner ? `<div class="placeholder-badge"><span class="placeholder-badge-dot"></span> ĐANG TRONG GIAI ĐOẠN HOÀN THIỆN · ${esc(hData.eta)}</div>` : ""}
        <div class="placeholder-icon-wrap">${iconSvg}</div>
        <h1 class="placeholder-title">${esc(item.label)}</h1>
        <p class="placeholder-tagline">${esc(hData.tagline || item.desc)}</p>
        ${isDev ? `
        <div class="placeholder-progress-box">
          <div class="placeholder-progress-header"><span class="placeholder-progress-title">⚡ Tiến độ phát triển tính năng (Dev Mode)</span><span class="placeholder-progress-pct">${hData.progress}% hoàn thành</span></div>
          <div class="placeholder-progress-bar"><div class="placeholder-progress-fill" style="width:${hData.progress}%"></div></div>
          <div class="placeholder-milestones">
            <span class="placeholder-milestone-item done">✓ 1. Thiết kế thuật toán</span>
            <span class="placeholder-milestone-item done">✓ 2. Xây dựng giao diện</span>
            <span class="placeholder-milestone-item active">⏳ 3. Kiểm thử & Tối ưu</span>
          </div>
        </div>` : ""}
        <div class="placeholder-highlights-grid">${highlightsHtml}</div>
        <div class="placeholder-notify-box">
          <div class="placeholder-notify-title">🔔 Đăng ký nhận thông báo ngày ra mắt</div>
          <div class="placeholder-notify-desc">Hãy là người đầu tiên trải nghiệm sớm và nhận đặc quyền người dùng VIP không giới hạn.</div>
          ${renderNotifyForm(slug)}
        </div>
      </div>`;
    initEarlyAccess(slug);
  }

  const suggestions = getSuggestions(group);
  if (suggestionsEl && suggestions.length > 0) {
    const cardsHtml = suggestions.map((s) => `
      <a href="${siteUrl(s.path, "../")}" style="background:var(--bg); border:1px solid var(--border-default); border-radius:12px; padding:18px 20px; display:flex; align-items:flex-start; gap:14px; text-decoration:none; color:inherit; box-shadow:var(--shadow-sm); transition:all 0.2s;">
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
});
