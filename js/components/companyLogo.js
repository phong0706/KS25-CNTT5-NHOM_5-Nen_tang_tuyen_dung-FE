/**
 * companyLogo.js - Component ô logo công ty duy nhất (< 200 dòng).
 * Tuân thủ techrecruit-rules & web-design-guidelines:
 * - Khung vuông cố định (size, bo 10px, overflow hidden).
 * - Ảnh: contain, padding 4px, nền trắng, kiểm tra tỉ lệ 0.6..1.6 và cạnh ngắn >= 96px.
 * - Chữ cái: 8 tông màu token theo hash(slug), contrast >= 4.5:1, dark mode riêng.
 * - Dải marquee: ảnh hiển thị thang xám grayscale(1), hover/focus hiện màu.
 */

const API_BASE = (typeof window !== "undefined" && window.API_BASE_URL)
  ? window.API_BASE_URL.replace(/\/api\/?$/, "")
  : "http://127.0.0.1:8000";

export const LOGO_TOKENS = [
  { name: "blue",    base: "#2563eb", textLight: "#1d4ed8", textDark: "#93c5fd" },
  { name: "emerald", base: "#059669", textLight: "#065f46", textDark: "#6ee7b7" },
  { name: "purple",  base: "#7c3aed", textLight: "#5b21b6", textDark: "#c4b5fd" },
  { name: "orange",  base: "#ea580c", textLight: "#9a3412", textDark: "#fdba74" },
  { name: "rose",    base: "#e11d48", textLight: "#9f1239", textDark: "#fda4af" },
  { name: "teal",    base: "#0d9488", textLight: "#115e59", textDark: "#5eead4" },
  { name: "indigo",  base: "#4f46e5", textLight: "#3730a3", textDark: "#a5b4fc" },
  { name: "amber",   base: "#d97706", textLight: "#78350f", textDark: "#fcd34d" },
];

export function getCompanyInitials(name, slug = "") {
  const s = String(slug || "").toLowerCase();
  const KNOWN = {
    "rikkeisoft": "RS", "fpt-software": "FS", "viettel-solutions": "VT",
    "vng-corporation": "VN", "momo": "MM", "vnpt-it": "VI",
  };
  if (KNOWN[s]) return KNOWN[s];

  const clean = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, " ")
    .trim();
  if (!clean) return "DN";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  const single = words[0].toUpperCase();
  return single.length >= 2 ? single.slice(0, 2) : `${single}${single}`;
}

export function hashSlug(slug = "") {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) - h + slug.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h) % LOGO_TOKENS.length;
}

export function normalizeLogoUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t || t.toLowerCase() === "null" || t.toLowerCase() === "undefined") return null;
  if (/^(?:https?:|\/\/|data:)/i.test(t)) return t;
  return t.startsWith("/") ? `${API_BASE}${t}` : `${API_BASE}/${t}`;
}

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderCompanyFallback(name, size = 40, className = "", slug = "") {
  const initials = getCompanyInitials(name, slug);
  const tokenIdx = hashSlug(slug || name);
  const token = LOGO_TOKENS[tokenIdx];
  const fontSize = Math.max(12, Math.round(size * 0.35));

  return `
    <div class="company-logo-box company-logo-fallback ${esc(className)}"
         data-token="${token.name}"
         style="width:${size}px; height:${size}px; min-width:${size}px; border-radius:10px; font-size:${fontSize}px; --logo-base:${token.base}; --logo-text-light:${token.textLight}; --logo-text-dark:${token.textDark};"
         aria-hidden="true" title="${esc(name)}">
      ${esc(initials)}
    </div>
  `.trim();
}

export function renderCompanyLogo(company, options = {}) {
  const { size = 40, className = "", lazy = true, isMarquee = false } = options;
  const name = (company && (company.name || company.company_name)) || "Doanh nghiệp";
  const slug = (company && company.slug) || "";
  const rawUrl = company && (company.logo_url || company.company_logo || company.logo);
  const logoUrl = normalizeLogoUrl(rawUrl);

  const extraClass = `${className} ${isMarquee ? "marquee-logo-box" : ""}`.trim();

  if (logoUrl) {
    const loadingAttr = lazy ? 'loading="lazy"' : 'loading="eager"';
    const escapedUrl = esc(logoUrl);
    const escapedName = esc(name);
    const escapedClass = esc(extraClass);
    const fallbackHtml = renderCompanyFallback(name, size, extraClass, slug).replace(/"/g, '&quot;').replace(/\n/g, "");

    return `
      <div class="company-logo-box company-logo-img-box ${escapedClass}"
           style="width:${size}px; height:${size}px; min-width:${size}px; border-radius:10px; overflow:hidden;"
           data-company-name="${escapedName}">
        <img
          src="${escapedUrl}"
          alt="Logo ${escapedName}"
          width="${size}"
          height="${size}"
          ${loadingAttr}
          class="company-logo-img ${isMarquee ? "marquee-logo-img" : ""}"
          style="width:100%; height:100%; object-fit:contain; padding:4px;"
          onload="const w=this.naturalWidth,h=this.naturalHeight,r=w/h;if(r<0.6||r>1.6||Math.min(w,h)<96){this.parentElement.outerHTML='${fallbackHtml}';}"
          onerror="this.onerror=null; this.parentElement.outerHTML='${fallbackHtml}';"
        />
      </div>
    `.trim();
  }

  return renderCompanyFallback(name, size, extraClass, slug);
}

export function createCompanyLogoElement(company, options = {}) {
  const { size = 40, className = "", lazy = true, isMarquee = false } = options;
  const name = (company && (company.name || company.company_name)) || "Doanh nghiệp";
  const slug = (company && company.slug) || "";
  const rawUrl = company && (company.logo_url || company.company_logo || company.logo);
  const logoUrl = normalizeLogoUrl(rawUrl);

  const box = document.createElement("div");
  box.className = `company-logo-box ${className} ${isMarquee ? "marquee-logo-box" : ""}`.trim();
  box.style.width = `${size}px`;
  box.style.height = `${size}px`;
  box.style.minWidth = `${size}px`;
  box.style.borderRadius = "10px";
  box.style.overflow = "hidden";
  box.dataset.companyName = name;

  const fallback = () => {
    box.replaceChildren();
    box.className = `company-logo-box company-logo-fallback ${className} ${isMarquee ? "marquee-logo-box" : ""}`.trim();
    const token = LOGO_TOKENS[hashSlug(slug || name)];
    box.style.fontSize = `${Math.max(12, Math.round(size * 0.35))}px`;
    box.style.setProperty("--logo-base", token.base);
    box.style.setProperty("--logo-text-light", token.textLight);
    box.style.setProperty("--logo-text-dark", token.textDark);
    box.setAttribute("aria-hidden", "true");
    box.textContent = getCompanyInitials(name, slug);
  };

  if (!logoUrl) {
    fallback();
    return box;
  }

  box.classList.add("company-logo-img-box");
  const img = document.createElement("img");
  img.className = `company-logo-img ${isMarquee ? "marquee-logo-img" : ""}`.trim();
  img.width = size;
  img.height = size;
  img.loading = lazy ? "lazy" : "eager";
  img.alt = `Logo ${name}`;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.padding = "4px";
  img.src = logoUrl;

  img.addEventListener("load", () => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const r = w / h;
    if (r < 0.6 || r > 1.6 || Math.min(w, h) < 96) fallback();
  }, { once: true });

  img.addEventListener("error", fallback, { once: true });

  box.appendChild(img);
  return box;
}

if (typeof window !== "undefined") {
  window.renderCompanyLogo = renderCompanyLogo;
  window.createCompanyLogoElement = createCompanyLogoElement;
  window.getCompanyInitials = getCompanyInitials;
}
