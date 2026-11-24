/**
 * marquee.js - Băng chuyền logo doanh nghiệp đang tuyển dụng (<= 140 dòng).
 * Thẻ logo chuẩn 180px, avatar pastel khi không có logo/lỗi ảnh, tự cuộn dừng khi hover/focus.
 */
import { companyUrl } from "../routes.js";
import { getBrandInitials, getPastelColor } from "../utils/companyBranding.js";

export { getBrandInitials, getPastelColor } from "../utils/companyBranding.js";

const API_BASE = (typeof window !== "undefined" && window.API_BASE_URL)
  ? window.API_BASE_URL.replace(/\/api\/?$/, "")
  : "http://127.0.0.1:8000";

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeLogoUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t || t.toLowerCase() === "null" || t.toLowerCase() === "undefined") return null;
  if (/^(?:https?:|\/\/|data:)/i.test(t)) return t;
  return t.startsWith("/") ? `${API_BASE}${t}` : `${API_BASE}/${t}`;
}

export function renderMarqueeAvatar(name) {
  const initials = getBrandInitials(name);
  const theme = getPastelColor(name);
  return `<div class="marquee-logo-box marquee-avatar-box" style="background-color:${theme.bg};color:${theme.text};" aria-hidden="true"><span class="marquee-avatar-text">${esc(initials)}</span></div>`;
}

function renderCardLogo(comp) {
  const name = comp.name || "Doanh nghiệp";
  const rawUrl = comp.logo_url || comp.company_logo || comp.logo;
  const logoUrl = normalizeLogoUrl(rawUrl);

  if (!logoUrl) {
    return renderMarqueeAvatar(name);
  }

  const raw2x = comp.logo_url_2x || comp.company_logo_2x || comp.logo_2x;
  const logo2x = (logoUrl.includes("_256.webp")) ? logoUrl.replace("_256.webp", "_512.webp") : normalizeLogoUrl(raw2x);
  const srcset = logo2x ? `srcset="${esc(logoUrl)} 256w, ${esc(logo2x)} 512w" sizes="48px"` : "";

  return `
    <div class="marquee-logo-box">
      <img src="${esc(logoUrl)}" alt="Logo ${esc(name)}" width="48" height="48" ${srcset} loading="lazy" class="marquee-logo-img" />
    </div>
  `.trim();
}

export function renderCard(comp, isClone = false) {
  const href = companyUrl(comp.slug || comp.id);
  const name = comp.name || "Doanh nghiệp";
  const openJobs = Number(comp.open_jobs ?? comp.job_count ?? comp.jobs_count ?? 0);
  const jobsText = `${openJobs} vị trí đang tuyển`;
  const tabAttr = isClone ? 'tabindex="-1"' : "";
  const ariaAttr = isClone ? 'aria-hidden="true"' : "";

  return `
    <a href="${esc(href)}" class="marquee-card" title="${esc(name)}" data-name="${esc(name)}" ${tabAttr} ${ariaAttr}>
      <div class="marquee-card-top">
        ${renderCardLogo(comp)}
      </div>
      <div class="marquee-card-body">
        <span class="marquee-card-name" title="${esc(name)}">${esc(name)}</span>
        <span class="marquee-card-jobs">${esc(jobsText)}</span>
      </div>
    </a>
  `.trim();
}

export function initMarquee(container, companies) {
  if (!container) return;
  const list = Array.isArray(companies) ? companies.filter((c) => c && c.name).slice(0, 16) : [];
  const section = container.closest(".marquee-section");

  if (list.length === 0) {
    if (section) section.hidden = true;
    container.innerHTML = "";
    return;
  }
  if (section) section.hidden = false;

  const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isReduced || list.length < 3) {
    const staticList = list.map((c) => renderCard(c, false)).join("");
    container.innerHTML = `<div class="marquee-static-grid">${staticList}</div>`;
    return;
  }

  container.innerHTML = `<div class="marquee-viewport"><div class="marquee-track" id="marquee-track"></div></div>`;
  const track = container.querySelector("#marquee-track");
  const viewport = container.querySelector(".marquee-viewport");

  function buildTrack() {
    if (!track || !viewport) return;
    const vpWidth = viewport.clientWidth || container.clientWidth || window.innerWidth;
    track.innerHTML = `<div class="marquee-group">${list.map((c) => renderCard(c, false)).join("")}</div>`;
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
    const duration = distance / 40; // Tốc độ di chuyển chuẩn 40px/giây

    track.style.setProperty("--marquee-distance", `-${distance}px`);
    track.style.setProperty("--marquee-duration", `${duration}s`);
    track.style.animation = `marquee-scroll ${duration}s linear infinite`;
  }

  buildTrack();

  let resizeTimer = null;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildTrack, 150);
  });
  ro.observe(viewport || container);

  const pause = () => { if (track) track.style.animationPlayState = "paused"; };
  const resume = () => { if (track) track.style.animationPlayState = "running"; };

  container.addEventListener("mouseenter", pause);
  container.addEventListener("mouseleave", resume);
  container.addEventListener("focusin", pause);
  container.addEventListener("focusout", resume);

  // Xử lý khi ảnh logo bị lỗi (404 / hỏng mạng) -> tự động chuyển sang avatar pastel
  container.addEventListener("error", (e) => {
    const target = e.target;
    if (target && target.classList && target.classList.contains("marquee-logo-img")) {
      const card = target.closest(".marquee-card");
      const name = card?.dataset?.name || target.alt.replace(/^Logo\s+/, "") || "Doanh nghiệp";
      const box = target.closest(".marquee-logo-box");
      if (box) {
        box.outerHTML = renderMarqueeAvatar(name);
      }
    }
  }, true);
}
