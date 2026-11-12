/**
 * Tiện ích đồng bộ URL state và cache danh mục meta 5 phút.
 */

const META_TTL_MS = 5 * 60 * 1000;
const metaCache = new Map();

export async function fetchCachedMeta(endpoint) {
  const now = Date.now();
  const mem = metaCache.get(endpoint);
  if (mem && now - mem.ts < META_TTL_MS) return mem.data;

  const key = `tr_meta_v2_${endpoint}`;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && now - parsed.ts < META_TTL_MS) {
        metaCache.set(endpoint, parsed);
        return parsed.data;
      }
    }
  } catch {
    // Bỏ qua lỗi sessionStorage
  }

  const data = await window.api.get(endpoint);
  const entry = { ts: now, data };
  metaCache.set(endpoint, entry);
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Bỏ qua lỗi quota
  }
  return data;
}

export function buildJobsSearchParams(state = {}) {
  const params = new URLSearchParams();
  if (state.q && String(state.q).trim()) params.set("q", String(state.q).trim());
  if (state.location) params.set("location", state.location);
  if (state.level) params.set("level", state.level);
  if (state.type) params.set("type", state.type);
  if (state.salary_min !== null && state.salary_min !== undefined && state.salary_min !== "") {
    params.set("salary_min", String(state.salary_min));
  }
  if (state.salary_max !== null && state.salary_max !== undefined && state.salary_max !== "") {
    params.set("salary_max", String(state.salary_max));
  }
  if (state.skills) params.set("skills", state.skills);
  if (state.category) params.set("category", state.category);
  if (state.company_id) params.set("company_id", String(state.company_id));
  if (state.sort && state.sort !== "newest") params.set("sort", state.sort);
  if (state.page && Number(state.page) > 1) params.set("page", String(state.page));
  return params;
}

export function buildJobsUrl(state = {}, basePath = "pages/jobs.html") {
  const qs = buildJobsSearchParams(state).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function parseJobsQuery(search = window.location.search) {
  const p = new URLSearchParams(search);
  const pageNum = parseInt(p.get("page") || "1", 10);
  return {
    q: p.get("q") || "",
    location: p.get("location") || "",
    level: p.get("level") || "",
    type: p.get("type") || "",
    salary_min: p.get("salary_min") || "",
    salary_max: p.get("salary_max") || "",
    skills: p.get("skills") || "",
    category: p.get("category") || "",
    company_id: p.get("company_id") || "",
    sort: p.get("sort") || "newest",
    page: Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1,
  };
}

