/**
 * marquee.js - Băng chuyền logo vô tận chuẩn xác (<= 120 dòng).
 * Thuật toán: k = ceil(khung / nhóm), 2k nhóm, translateX từ 0 đến -(k*nhóm) ở tốc độ 40px/s.
 */
import { companyUrl } from "../routes.js";
import { renderCompanyLogo } from "./companyLogo.js";

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCard(comp, isClone = false) {
  const href = companyUrl(comp.slug || comp.id);
  const name = comp.name || "Doanh nghiệp";
  const tabAttr = isClone ? 'tabindex="-1"' : "";
  return `
    <a href="${esc(href)}" class="marquee-item" title="${esc(name)}" ${tabAttr}>
      ${renderCompanyLogo(comp, { size: 36, isMarquee: true })}
      <span class="marquee-name">${esc(name)}</span>
    </a>
  `.trim();
}

export function initMarquee(container, companies) {
  if (!container) return;
  const list = Array.isArray(companies) ? companies.filter((c) => c && c.name).slice(0, 16) : [];
  const section = container.closest(".marquee-section");

  if (list.length < 3) {
    if (section) section.hidden = true;
    container.innerHTML = "";
    return;
  }
  if (section) section.hidden = false;

  const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isReduced) {
    const staticList = list.slice(0, 12).map((c) => renderCard(c, false)).join("");
    container.innerHTML = `<div class="marquee-static-grid">${staticList}</div>`;
    return;
  }

  const host = document.getElementById("marquee-controls-host") || section?.querySelector("#marquee-controls-host");
  const toggleBtnHtml = `<button type="button" class="marquee-toggle-btn" aria-label="Tạm dừng chuyển động" aria-pressed="false">⏸ Tạm dừng</button>`;
  if (host) {
    host.innerHTML = toggleBtnHtml;
    container.innerHTML = `<div class="marquee-viewport"><div class="marquee-track" id="marquee-track"></div></div>`;
  } else {
    container.innerHTML = `
      <div class="marquee-controls">${toggleBtnHtml}</div>
      <div class="marquee-viewport"><div class="marquee-track" id="marquee-track"></div></div>
    `;
  }

  const track = container.querySelector("#marquee-track");
  const viewport = container.querySelector(".marquee-viewport");
  const toggleBtn = (host || container).querySelector(".marquee-toggle-btn");
  let isPausedManually = false;

  function buildTrack() {
    if (!track || !viewport) return;
    const vpWidth = viewport.clientWidth || container.clientWidth || window.innerWidth;
    const baseGroupHtml = `<div class="marquee-group">${list.map((c) => renderCard(c, false)).join("")}</div>`;

    track.innerHTML = baseGroupHtml;
    const group0 = track.firstElementChild;
    const groupWidth = group0 ? group0.getBoundingClientRect().width : 700;

    const k = Math.max(1, Math.ceil(vpWidth / Math.max(groupWidth, 1)));
    const totalGroups = k * 2;
    const groupsHtml = [];

    for (let i = 0; i < totalGroups; i++) {
      const isClone = i > 0;
      const ariaAttr = isClone ? 'aria-hidden="true"' : "";
      const cards = list.map((c) => renderCard(c, isClone)).join("");
      groupsHtml.push(`<div class="marquee-group" ${ariaAttr}>${cards}</div>`);
    }

    track.innerHTML = groupsHtml.join("");
    const distance = k * groupWidth;
    const duration = distance / 40; // 40px / giây

    track.style.setProperty("--marquee-distance", `-${distance}px`);
    track.style.setProperty("--marquee-duration", `${duration}s`);
    track.style.animation = `marquee-scroll ${duration}s linear infinite`;
    if (isPausedManually) track.style.animationPlayState = "paused";
  }

  buildTrack();

  let resizeTimer = null;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildTrack, 150);
  });
  ro.observe(viewport || container);

  const pause = () => { if (!isPausedManually) track.style.animationPlayState = "paused"; };
  const resume = () => { if (!isPausedManually) track.style.animationPlayState = "running"; };

  container.addEventListener("mouseenter", pause);
  container.addEventListener("mouseleave", resume);
  container.addEventListener("focusin", pause);
  container.addEventListener("focusout", resume);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      isPausedManually = !isPausedManually;
      toggleBtn.setAttribute("aria-pressed", String(isPausedManually));
      if (isPausedManually) {
        track.style.animationPlayState = "paused";
        toggleBtn.innerHTML = `<span class="marquee-btn-icon">▶</span> <span class="marquee-btn-text">Tiếp tục</span>`;
        toggleBtn.setAttribute("aria-label", "Tiếp tục chuyển động");
      } else {
        track.style.animationPlayState = "running";
        toggleBtn.innerHTML = `<span class="marquee-btn-icon">⏸</span> <span class="marquee-btn-text">Tạm dừng</span>`;
        toggleBtn.setAttribute("aria-label", "Tạm dừng chuyển động");
      }
    });
  }
}
