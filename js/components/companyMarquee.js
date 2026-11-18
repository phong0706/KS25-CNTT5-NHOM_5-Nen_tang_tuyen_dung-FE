/**
 * companyMarquee.js - Dải logo công ty chạy ngang (marquee).
 * Dữ liệu từ GET /api/companies/featured — không hardcode.
 *
 * Accessibility: marquee là trang trí, nên:
 *  - Bản chạy bị ẩn khỏi screen reader (aria-hidden), kèm bản tĩnh cho SR.
 *  - Tự dừng khi người dùng hover / focus vào.
 *  - Tôn trọng prefers-reduced-motion (đứng yên).
 */
import { companyUrl } from "../routes.js";

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

/** Một ô logo: tên công ty dạng chữ (không phụ thuộc file logo tồn tại). */
function logoCell(company) {
  const href = companyUrl(company.slug || company.id);
  const name = company.name || "Doanh nghiệp";
  return `
    <a href="${escapeText(href)}" class="marquee-item" title="${escapeText(name)}">
      <span class="marquee-initial" aria-hidden="true">${escapeText(name.charAt(0).toUpperCase())}</span>
      <span class="marquee-name">${escapeText(name)}</span>
    </a>
  `;
}

/**
 * Render dải logo. Tạo 2 bản giống nhau để chạy liên tục không giật.
 */
export function renderCompanyMarquee(container, companies) {
  if (!container) return;
  // Tối đa 8 công ty (theo job_count desc từ API) -> dải logo gọn, không lặp.
  const list = Array.isArray(companies) ? companies.filter((c) => c && c.name).slice(0, 8) : [];
  // API trả rỗng -> ẩn CẢ dải logo lẫn tiêu đề "Doanh nghiệp đang tuyển tại TechRecruit".
  const section = container.closest(".marquee-section");
  const heading = section?.querySelector(".marquee-heading");
  if (!list.length) {
    container.innerHTML = "";
    container.hidden = true;
    if (heading) heading.hidden = true;
    if (section) section.hidden = true;
    return;
  }
  container.hidden = false;
  if (heading) heading.hidden = false;
  if (section) section.hidden = false;

  const cells = list.map(logoCell).join("");
  // aria-hidden: bản chạy. Bản tĩnh (sr-only) cho screen reader.
  container.innerHTML = `
    <div class="marquee-viewport">
      <div class="marquee-track" aria-hidden="true">
        <div class="marquee-group">${cells}</div>
        <div class="marquee-group">${cells}</div>
      </div>
    </div>
    <ul class="sr-only">
      ${list.map((c) => `<li>${escapeText(c.name)}</li>`).join("")}
    </ul>
  `;
}

/** Tự dừng marquee khi hover/focus (tránh gây rối khi người dùng tương tác). */
export function bindMarqueePause(container) {
  if (!container) return;
  const track = container.querySelector(".marquee-track");
  if (!track) return;
  const pause = () => { track.style.animationPlayState = "paused"; };
  const resume = () => { track.style.animationPlayState = "running"; };
  container.addEventListener("mouseenter", pause);
  container.addEventListener("mouseleave", resume);
  container.addEventListener("focusin", pause);
  container.addEventListener("focusout", resume);
}
