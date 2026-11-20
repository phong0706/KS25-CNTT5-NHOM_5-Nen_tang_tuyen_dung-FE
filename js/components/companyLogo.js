/**
 * companyLogo.js - Component ô logo công ty duy nhất (< 200 dòng).
 * Tuân thủ techrecruit-rules & web-design-guidelines:
 * - Khung .company-logo: --size, aspect-ratio: 1, border-radius: 22% (squircle app icon), nền trắng cố định, viền 1px --border, overflow: hidden.
 * - <img>: width/height cố định bằng --size, object-fit: contain, padding: 4px.
 * - srcset="... 256w, ... 512w" sizes="..." khi có logo_url_2x, loading="lazy", alt="Logo {tên_công_ty}".
 * - Fallback: chữ cái đầu 8 tông màu token theo hash(slug), cùng bo góc 22%, contrast >= 4.5:1.
 */

const API_BASE = (typeof window !== "undefined" && window.API_BASE_URL)
  ? window.API_BASE_URL.replace(/\/api\/?$/, "")
  : "http://127.0.0.1:8000";

export const LOGO_TOKENS = [
  { name: "blue", base: "#2563eb", textLight: "#1d4ed8" },
  { name: "emerald", base: "#059669", textLight: "#065f46" },
  { name: "purple", base: "#7c3aed", textLight: "#5b21b6" },
  { name: "orange", base: "#ea580c", textLight: "#9a3412" },
  { name: "rose", base: "#e11d48", textLight: "#9f1239" },
  { name: "teal", base: "#0d9488", textLight: "#115e59" },
  { name: "indigo", base: "#4f46e5", textLight: "#3730a3" },
  { name: "amber", base: "#d97706", textLight: "#78350f" },
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
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
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
  const fontSize = Math.max(12, Math.round(size * 0.36));

  return `
    <div class="company-logo company-logo-box company-logo-fallback ${esc(className)}"
         style="--size:${size}px; width:${size}px; height:${size}px; min-width:${size}px; aspect-ratio:1; border-radius:22%; font-size:${fontSize}px; font-weight:600; letter-spacing:0.04em; background:var(--bg-alt, #f1f5f9); color:var(--text, #0f172a); border:1px solid var(--border-color, var(--border, #e2e8f0));"
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
  const rawUrl2x = company && (company.logo_url_2x || company.company_logo_2x || company.logo_2x);

  const logoUrl = normalizeLogoUrl(rawUrl);
  let logoUrl2x = normalizeLogoUrl(rawUrl2x);
  if (!logoUrl2x && logoUrl && logoUrl.includes("_256.webp")) {
    logoUrl2x = logoUrl.replace("_256.webp", "_512.webp");
  }

  const extraClass = `${className} ${isMarquee ? "marquee-logo-box" : ""}`.trim();

  if (logoUrl) {
    const loadingAttr = lazy ? 'loading="lazy"' : 'loading="eager"';
    const escapedUrl = esc(logoUrl);
    const escapedName = esc(name);
    const escapedClass = esc(extraClass);
    const fallbackHtml = renderCompanyFallback(name, size, extraClass, slug).replace(/"/g, '&quot;').replace(/\n/g, "");
    const srcsetAttribute = logoUrl2x ? `srcset="${escapedUrl} 256w, ${esc(logoUrl2x)} 512w" sizes="${size}px"` : "";

    return `
      <div class="company-logo company-logo-box company-logo-img-box ${escapedClass}"
           style="--size:${size}px; width:${size}px; height:${size}px; min-width:${size}px; aspect-ratio:1; border-radius:22%; background:#ffffff; border:1px solid var(--border-color, var(--border, #e2e8f0)); overflow:hidden;"
           data-company-name="${escapedName}">
        <img
          src="${escapedUrl}"
          alt="Logo ${escapedName}"
          width="${size}"
          height="${size}"
          ${srcsetAttribute}
          ${loadingAttr}
          class="company-logo-img ${isMarquee ? "marquee-logo-img" : ""}"
          style="width:100%; height:100%; object-fit:contain; padding:4px; display:block;"
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
  const rawUrl2x = company && (company.logo_url_2x || company.company_logo_2x || company.logo_2x);

  const logoUrl = normalizeLogoUrl(rawUrl);
  let logoUrl2x = normalizeLogoUrl(rawUrl2x);
  if (!logoUrl2x && logoUrl && logoUrl.includes("_256.webp")) {
    logoUrl2x = logoUrl.replace("_256.webp", "_512.webp");
  }

  const box = document.createElement("div");
  box.className = `company-logo company-logo-box ${className} ${isMarquee ? "marquee-logo-box" : ""}`.trim();
  box.style.setProperty("--size", `${size}px`);
  box.style.width = `${size}px`;
  box.style.height = `${size}px`;
  box.style.minWidth = `${size}px`;
  box.style.aspectRatio = "1";
  box.style.borderRadius = "22%";
  box.style.backgroundColor = "#ffffff";
  box.style.border = "1px solid var(--border-color, var(--border, #e2e8f0))";
  box.style.overflow = "hidden";
  box.dataset.companyName = name;

  const fallback = () => {
    box.replaceChildren();
    box.className = `company-logo company-logo-box company-logo-fallback ${className} ${isMarquee ? "marquee-logo-box" : ""}`.trim();
    box.style.fontSize = `${Math.max(12, Math.round(size * 0.36))}px`;
    box.style.fontWeight = "600";
    box.style.letterSpacing = "0.04em";
    box.style.backgroundColor = "var(--bg-alt, #f1f5f9)";
    box.style.color = "var(--text, #0f172a)";
    box.style.border = "1px solid var(--border-color, var(--border, #e2e8f0))";
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
  img.style.display = "block";
  img.src = logoUrl;

  if (logoUrl2x) {
    img.srcset = `${logoUrl} 256w, ${logoUrl2x} 512w`;
    img.sizes = `${size}px`;
  }

  img.addEventListener("error", fallback, { once: true });
  box.appendChild(img);
  return box;
}

if (typeof window !== "undefined") {
  window.renderCompanyLogo = renderCompanyLogo;
  window.createCompanyLogoElement = createCompanyLogoElement;
  window.getCompanyInitials = getCompanyInitials;
}
