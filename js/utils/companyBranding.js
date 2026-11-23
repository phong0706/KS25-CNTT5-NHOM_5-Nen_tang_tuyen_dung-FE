/**
 * companyBranding.js - Pure functions for brand initial extraction & pastel palettes.
 * Tuân thủ chuẩn pure function, độc lập DOM, dễ kiểm thử (<= 100 dòng).
 */

const PREFIX_REGEX = /^(?:t[ậa]p\s+đo[àa]n|t[ổo]ng\s+c[ôo]ng\s+ty|c[ôo]ng\s+ty(?:\s+(?:c[ổo]\s+ph[ầa]n|tnhh(?:\s+mtv)?))?|tnhh(?:\s+mtv)?|ctcp|ct\s+tnhh|trung\s+t[âa]m(?:\s+nghi[êe]n\s+c[ứu]u(?:\s+v[àa]\s+ph[áa]t\s+tri[ểe]n(?:\s+h[ạa]\s+t[ầa]ng(?:\s+tr[íi]\s+tu[ệe]\s+nh[âa]n\s+t[ạa]o)?)?)?)?|trung\s+t[âa]m|kh[ởo]i\s+nghi[ệe]p|t[ựu]\s+đ[ộo]ng\s+h[oó]a(?:\s+ki[ểe]m\s+th[ửu])?|t[ựu]\s+đ[ộo]ng\s+h[oó]a|ki[ểe]m\s+th[ửu]|an\s+ninh\s+m[ạa]ng|d[ữư]\s+li[ệe]u\s+l[ớo]n|doanh\s+nghi[ệe]p|vi[ệe]n|đ[ạa]i(?:\s+d[ưu][ơo]ng)?)\b/i;
const SUFFIX_REGEX = /\b(?:corporation|corp|holdings?|group|jsc|ltd|llc|inc|solutions|software|technolog(?:y|ies))\b/ig;

export const PASTEL_PALETTE = [
  { bg: "#e0e7ff", text: "#3730a3", name: "indigo" }, // Indigo: 7.5:1 contrast
  { bg: "#ccfbf1", text: "#115e59", name: "teal" },   // Teal: 7.8:1 contrast
  { bg: "#ffe4e6", text: "#9f1239", name: "rose" },   // Rose: 7.4:1 contrast
  { bg: "#fef3c7", text: "#92400e", name: "amber" },  // Amber: 7.6:1 contrast
  { bg: "#ede9fe", text: "#5b21b6", name: "violet" }, // Violet: 7.9:1 contrast
  { bg: "#e0f2fe", text: "#075985", name: "sky" },    // Sky: 7.5:1 contrast
  { bg: "#dcfce7", text: "#166534", name: "green" },  // Green: 7.7:1 contrast
  { bg: "#fae8ff", text: "#86198f", name: "fuchsia" },// Fuchsia: 7.8:1 contrast
];

export function cleanBrandName(name) {
  if (!name || typeof name !== "string") return "";
  let s = name.replace(/\([^)]*\)/g, "").trim();
  while (true) {
    const next = s.replace(PREFIX_REGEX, "").trim().replace(/^[-–—:,.\s]+/, "");
    if (next === s || !next) break;
    s = next;
  }
  const cleanAfterSuffix = s.replace(SUFFIX_REGEX, "").trim().replace(/[-–—:,.\s]+$/, "");
  return cleanAfterSuffix || s || name.trim();
}

export function getBrandInitials(name) {
  if (!name || typeof name !== "string") return "DN";
  const brand = cleanBrandName(name);
  const normalized = brand
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^\w\s]/gi, " ")
    .trim();

  if (!normalized) return "DN";
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "DN";
  if (words.length === 1) {
    const w = words[0].toUpperCase();
    return w.length >= 2 ? w.slice(0, 2) : `${w}${w}`;
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function hashString(str) {
  let hash = 0;
  const s = String(str || "").trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getPastelColor(name) {
  const idx = hashString(name) % PASTEL_PALETTE.length;
  return PASTEL_PALETTE[idx];
}
