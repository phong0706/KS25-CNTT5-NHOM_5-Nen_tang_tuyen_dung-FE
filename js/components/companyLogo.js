/**
 * companyLogo.js - Component ô logo công ty duy nhất (< 100 dòng).
 * Chuẩn khung: --size, aspect-ratio 1, bo max(4px, 8%), viền 1px, contain, lề từ server.
 */
const API_BASE = (typeof window !== "undefined" && window.API_BASE_URL)
  ? window.API_BASE_URL.replace(/\/api\/?$/, "")
  : "http://127.0.0.1:8000";

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function getCompanyInitials(name, slug = "") {
  const s = String(slug || "").toLowerCase();
  const KNOWN = { "rikkeisoft": "RS", "fpt-software": "FS", "viettel-solutions": "VT", "vng-corporation": "VN", "momo": "MM", "vnpt-it": "VI" };
  if (KNOWN[s]) return KNOWN[s];
  const clean = String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, " ").trim();
  if (!clean) return "DN";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  const single = words[0].toUpperCase();
  return single.length >= 2 ? single.slice(0, 2) : `${single}${single}`;
}

export function normalizeLogoUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t || t.toLowerCase() === "null" || t.toLowerCase() === "undefined") return null;
  if (/^(?:https?:|\/\/|data:)/i.test(t)) return t;
  return t.startsWith("/") ? `${API_BASE}${t}` : `${API_BASE}/${t}`;
}

export function renderCompanyFallback(name, size = 40, className = "", slug = "") {
  const initials = getCompanyInitials(name, slug);
  const fz = Math.max(10, Math.round(size * 0.36));
  return `<div class="company-logo company-logo-fallback ${esc(className)}" style="--size:${size}px;" aria-hidden="true" title="${esc(name)}"><span class="company-logo-initials" style="font-size:${fz}px;">${esc(initials)}</span></div>`;
}

export function renderCompanyLogo(company, options = {}) {
  const { size = 40, className = "", lazy = true, isMarquee = false } = options;
  const name = (company && (company.name || company.company_name)) || "Doanh nghiệp";
  const slug = (company && company.slug) || "";
  const rawUrl = company && (company.logo_url || company.company_logo || company.logo);
  const rawUrl2x = company && (company.logo_url_2x || company.company_logo_2x || company.logo_2x);
  const logoUrl = normalizeLogoUrl(rawUrl);
  let logoUrl2x = (logoUrl && logoUrl.includes("_256.webp")) ? logoUrl.replace("_256.webp", "_512.webp") : normalizeLogoUrl(rawUrl2x);
  const cls = `${className} ${isMarquee ? "marquee-logo-box" : ""}`.trim();

  if (logoUrl) {
    const loading = lazy ? 'loading="lazy"' : 'loading="eager"';
    const srcset = logoUrl2x ? `srcset="${esc(logoUrl)} 256w, ${esc(logoUrl2x)} 512w" sizes="${size}px"` : "";
    const fbHtml = renderCompanyFallback(name, size, cls, slug).replace(/"/g, '&quot;');
    return `<div class="company-logo ${esc(cls)}" style="--size:${size}px;" data-company-name="${esc(name)}"><img src="${esc(logoUrl)}" alt="Logo ${esc(name)}" width="${size}" height="${size}" ${srcset} ${loading} class="company-logo-img ${isMarquee ? "marquee-logo-img" : ""}" onerror="this.onerror=null; this.parentElement.outerHTML='${fbHtml}';" /></div>`;
  }
  return renderCompanyFallback(name, size, cls, slug);
}

export function createCompanyLogoElement(company, options = {}) {
  const { size = 40, className = "", lazy = true, isMarquee = false } = options;
  const name = (company && (company.name || company.company_name)) || "Doanh nghiệp";
  const slug = (company && company.slug) || "";
  const rawUrl = company && (company.logo_url || company.company_logo || company.logo);
  const rawUrl2x = company && (company.logo_url_2x || company.company_logo_2x || company.logo_2x);
  const logoUrl = normalizeLogoUrl(rawUrl);
  let logoUrl2x = (logoUrl && logoUrl.includes("_256.webp")) ? logoUrl.replace("_256.webp", "_512.webp") : normalizeLogoUrl(rawUrl2x);

  const box = document.createElement("div");
  box.className = `company-logo ${className} ${isMarquee ? "marquee-logo-box" : ""}`.trim();
  box.style.setProperty("--size", `${size}px`);
  box.dataset.companyName = name;

  const fallback = () => {
    box.replaceChildren();
    box.className = `company-logo company-logo-fallback ${className} ${isMarquee ? "marquee-logo-box" : ""}`.trim();
    box.setAttribute("aria-hidden", "true");
    const span = document.createElement("span");
    span.className = "company-logo-initials";
    span.style.fontSize = `${Math.max(10, Math.round(size * 0.36))}px`;
    span.textContent = getCompanyInitials(name, slug);
    box.appendChild(span);
  };

  if (!logoUrl) { fallback(); return box; }
  const img = document.createElement("img");
  img.className = `company-logo-img ${isMarquee ? "marquee-logo-img" : ""}`.trim();
  img.width = size; img.height = size;
  img.loading = lazy ? "lazy" : "eager";
  img.alt = `Logo ${name}`;
  img.src = logoUrl;
  if (logoUrl2x) { img.srcset = `${logoUrl} 256w, ${logoUrl2x} 512w`; img.sizes = `${size}px`; }
  img.addEventListener("error", fallback, { once: true });
  box.appendChild(img);
  return box;
}

if (typeof window !== "undefined") {
  window.renderCompanyLogo = renderCompanyLogo;
  window.createCompanyLogoElement = createCompanyLogoElement;
  window.getCompanyInitials = getCompanyInitials;
}
