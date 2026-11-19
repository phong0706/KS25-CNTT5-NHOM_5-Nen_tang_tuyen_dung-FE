/**
 * companyUtils.js - Module hàm thuần cho trang Danh sách & Chi tiết Công ty (< 180 dòng).
 */

export const COMPANY_PALETTES = [
  { bg: "#F0FDFA", fg: "#0F766E", border: "#CCFBF1", darkBg: "#134E4A", darkFg: "#5EEAD4" },
  { bg: "#EFF6FF", fg: "#1D4ED8", border: "#DBEAFE", darkBg: "#1E3A8A", darkFg: "#93C5FD" },
  { bg: "#ECFDF5", fg: "#047857", border: "#D1FAE5", darkBg: "#064E3B", darkFg: "#6EE7B7" },
  { bg: "#FEF3C7", fg: "#B45309", border: "#FDE68A", darkBg: "#78350F", darkFg: "#FCD34D" },
  { bg: "#ECFEFF", fg: "#0E7490", border: "#CFFAFE", darkBg: "#164E63", darkFg: "#67E8F9" },
  { bg: "#EEF2FF", fg: "#4338CA", border: "#E0E7FF", darkBg: "#312E81", darkFg: "#A5B4FC" },
  { bg: "#F5F3FF", fg: "#6D28D9", border: "#EDE9FE", darkBg: "#4C1D95", darkFg: "#C4B5FD" },
  { bg: "#FFF1F2", fg: "#BE123C", border: "#FFE4E6", darkBg: "#881337", darkFg: "#FDA4AF" },
];

const COVER_THEMES = [
  { gradientStart: "#0F766E", gradientEnd: "#134E4A", dotColor: "rgba(255,255,255,0.16)", angle: 135, dotSpacing: 20 },
  { gradientStart: "#0D9488", gradientEnd: "#1E293B", dotColor: "rgba(240,253,250,0.18)", angle: 120, dotSpacing: 22 },
  { gradientStart: "#115E59", gradientEnd: "#0F172A", dotColor: "rgba(94,234,212,0.15)", angle: 145, dotSpacing: 18 },
  { gradientStart: "#0369A1", gradientEnd: "#0F766E", dotColor: "rgba(255,255,255,0.16)", angle: 130, dotSpacing: 24 },
  { gradientStart: "#047857", gradientEnd: "#1E293B", dotColor: "rgba(167,243,208,0.16)", angle: 140, dotSpacing: 20 },
  { gradientStart: "#0E7490", gradientEnd: "#1E293B", dotColor: "rgba(207,250,254,0.16)", angle: 125, dotSpacing: 22 },
];

const SIZE_LABELS = {
  "1-50": "1 - 50 nhân viên",
  "51-200": "51 - 200 nhân viên",
  "201-500": "201 - 500 nhân viên",
  "501-1000": "501 - 1.000 nhân viên",
  "1000+": "1.000+ nhân viên",
};

const VALID_SORTS = new Set(["jobs", "recent", "name"]);

export function stripVietnamese(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function companyInitials(name) {
  const clean = stripVietnamese(name)
    .replace(/[^A-Za-z0-9\s]+/g, " ")
    .trim();
  if (!clean) return "CT";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  const single = words[0].toUpperCase();
  return single.length >= 2 ? single.slice(0, 2) : `${single}${single}`;
}

function hashSlug(str) {
  const s = String(str || "company");
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function companyColorIndex(slug, paletteCount = COMPANY_PALETTES.length) {
  if (!paletteCount || paletteCount < 1) return 0;
  return hashSlug(String(slug || "").trim().toLowerCase()) % paletteCount;
}

export function coverPattern(slug) {
  const key = String(slug || "company").trim().toLowerCase();
  const idx = hashSlug(`cover:${key}`) % COVER_THEMES.length;
  const theme = COVER_THEMES[idx];
  const r = theme.dotSpacing;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="240" viewBox="0 0 1200 240">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">` +
    `<stop offset="0%" stop-color="${theme.gradientStart}"/>` +
    `<stop offset="100%" stop-color="${theme.gradientEnd}"/>` +
    `</linearGradient>` +
    `<pattern id="dots" width="${r}" height="${r}" patternUnits="userSpaceOnUse">` +
    `<circle cx="${r / 2}" cy="${r / 2}" r="1.5" fill="${theme.dotColor}"/>` +
    `</pattern>` +
    `</defs>` +
    `<rect width="1200" height="240" fill="url(#bg)"/>` +
    `<rect width="1200" height="240" fill="url(#dots)"/>` +
    `</svg>`;
  return {
    index: idx,
    ...theme,
    dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}

export function safeUrl(url, protocols = ["http:", "https:"], options = {}) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return null;
  if (options.allowRelativeUploads && trimmed.startsWith("/uploads/")) {
    if (trimmed.includes("..") || trimmed.includes("\\") || /[\s"'<>]/.test(trimmed)) return null;
    return trimmed;
  }
  if (/^\s*[\w+.-]*\s+:/i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    const allowed = new Set(protocols.map((p) => String(p).toLowerCase()));
    if (!allowed.has(parsed.protocol.toLowerCase()) || !parsed.hostname) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function formatSizeRange(sizeRange) {
  return SIZE_LABELS[String(sizeRange || "").trim()] || "";
}

export function formatDomain(url) {
  const valid = safeUrl(url, ["http:", "https:"]);
  if (!valid) return "";
  return new URL(valid).hostname.replace(/^www\./i, "");
}

export function formatSalaryRangeShort(salary) {
  if (!salary || (salary.min == null && salary.max == null)) return "";
  const toTr = (v) => {
    const num = Number(v);
    if (!Number.isFinite(num) || num <= 0) return "";
    return `${Math.round((num / 1e6) * 10) / 10}`;
  };
  const minStr = toTr(salary.min);
  const maxStr = toTr(salary.max);
  if (minStr && maxStr) return `${minStr} - ${maxStr} Tr`;
  if (minStr) return `Từ ${minStr} Tr`;
  return maxStr ? `Đến ${maxStr} Tr` : "";
}

export function parseCompaniesUrlState(search = "") {
  const p = new URLSearchParams(search);
  const rawPage = parseInt(p.get("page") || "1", 10);
  const rawSort = (p.get("sort") || "jobs").trim().toLowerCase();
  return {
    q: (p.get("q") || "").trim(),
    industry: (p.get("industry") || "").trim().toLowerCase(),
    location: (p.get("location") || "").trim().toLowerCase(),
    size: (p.get("size") || "").trim(),
    hiring: p.get("hiring") === "0" ? 0 : 1,
    sort: VALID_SORTS.has(rawSort) ? rawSort : "jobs",
    page: Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1,
  };
}

export function buildCompaniesSearchParams(state = {}) {
  const p = new URLSearchParams();
  if (state.q && String(state.q).trim()) p.set("q", String(state.q).trim());
  if (state.industry) p.set("industry", String(state.industry).trim().toLowerCase());
  if (state.location) p.set("location", String(state.location).trim().toLowerCase());
  if (state.size) p.set("size", String(state.size).trim());
  if (state.hiring === 0 || state.hiring === "0") p.set("hiring", "0");
  if (state.sort && VALID_SORTS.has(state.sort) && state.sort !== "jobs") p.set("sort", state.sort);
  if (state.page && Number(state.page) > 1) p.set("page", String(Math.floor(Number(state.page))));
  return p;
}
