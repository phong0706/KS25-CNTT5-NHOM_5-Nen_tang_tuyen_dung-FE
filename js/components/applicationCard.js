/**
 * applicationCard.js - Thẻ hồ sơ ứng tuyển chuẩn design system TechRecruit.
 * Giới hạn: < 200 dòng.
 */
import { getCompanyLogo, formatSalary } from "./jobCard.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function renderApplicationCard(app) {
  const job = app.job || {};
  const actions = Array.isArray(app.allowed_actions) ? app.allowed_actions : [];
  const tone = app.status_tone || "neutral";

  const actionItemsHtml = actions.map((act) => `
    <button type="button" class="app-card-menu-item" data-action="${act.key}" data-app-id="${app.id}" role="menuitem">
      ${esc(act.label)}
    </button>
  `).join("");

  return `
    <article class="app-card" data-app-id="${app.id}">
      <div class="app-card-left">
        ${getCompanyLogo(job.company_name, "cv-logo-48")}
        <div class="app-card-info">
          <div class="app-card-top-row">
            <h3 class="app-card-title" title="${esc(job.title)}">
              <a href="#" class="app-card-detail-link" data-app-id="${app.id}">${esc(job.title)}</a>
            </h3>
            <span class="app-status-badge app-badge-${esc(tone)}">
              <span class="app-badge-dot" aria-hidden="true"></span>
              <span>${esc(app.status_label || app.status)}</span>
            </span>
          </div>
          <div class="app-card-meta">
            <span class="app-meta-company">${esc(job.company_name || "Công ty")}</span>
            <span class="meta-dot">·</span>
            <span class="app-meta-location">${esc(job.location || "Toàn quốc")}</span>
            <span class="meta-dot">·</span>
            <span class="app-meta-salary">${esc(formatSalary(job))}</span>
          </div>
          <div class="app-card-submeta">
            <span class="app-meta-applied">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Nộp ngày ${formatDate(app.created_at)}</span>
            </span>
            <span class="meta-dot">·</span>
            <span class="app-meta-cv" title="${esc(app.cv_name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <span class="app-cv-name">${esc(app.cv_name)}</span>
            </span>
          </div>
        </div>
      </div>
      <div class="app-card-right">
        <button type="button" class="btn btn-sm btn-outline app-btn-view" data-app-id="${app.id}" aria-label="Xem chi tiết hồ sơ ${esc(job.title)}">
          Xem chi tiết
        </button>
        ${actions.length > 0 ? `
          <div class="app-card-menu-wrapper">
            <button type="button" class="btn btn-sm btn-ghost app-menu-trigger" aria-haspopup="menu" aria-expanded="false" aria-label="Thao tác khác cho ${esc(job.title)}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
            </button>
            <div class="app-card-menu" role="menu" hidden>
              ${actionItemsHtml}
            </div>
          </div>
        ` : ""}
      </div>
    </article>
  `;
}

export function bindApplicationCardEvents(container, { onDetail, onAction }) {
  if (!container) return;

  container.querySelectorAll(".app-card").forEach((card) => {
    const appId = Number(card.dataset.appId);

    // Click link tiêu đề hoặc nút Xem chi tiết
    card.querySelectorAll(".app-card-detail-link, .app-btn-view").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        onDetail?.(appId, el);
      });
    });

    // Menu "⋯"
    const menuWrap = card.querySelector(".app-card-menu-wrapper");
    if (menuWrap) {
      const trigger = menuWrap.querySelector(".app-menu-trigger");
      const menu = menuWrap.querySelector(".app-card-menu");

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        // Đóng các menu khác
        document.querySelectorAll(".app-card-menu:not([hidden])").forEach((m) => {
          if (m !== menu) {
            m.hidden = true;
            m.parentElement.querySelector(".app-menu-trigger")?.setAttribute("aria-expanded", "false");
          }
        });
        const isHidden = menu.hidden;
        menu.hidden = !isHidden;
        trigger.setAttribute("aria-expanded", isHidden ? "true" : "false");
      });

      menu.querySelectorAll(".app-card-menu-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          menu.hidden = true;
          trigger.setAttribute("aria-expanded", "false");
          onAction?.(item.dataset.action, appId, trigger);
        });
      });
    }
  });

  // Click ra ngoài đóng menu
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".app-card-menu-wrapper")) {
      document.querySelectorAll(".app-card-menu:not([hidden])").forEach((m) => {
        m.hidden = true;
        m.parentElement.querySelector(".app-menu-trigger")?.setAttribute("aria-expanded", "false");
      });
    }
  });
}

