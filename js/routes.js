/**
 * routes.js - Nguồn tạo đường dẫn tuyệt đối tập trung cho toàn bộ Frontend (< 130 dòng).
 * Tự động phát hiện tiền tố gốc (/frontend khi chạy từ thư mục cha base, hoặc "" khi chạy từ frontend/)
 * dựa trên import.meta.url hoặc window.location.pathname, giúp link không bao giờ bị lặp thư mục tương đối.
 */

export function detectFrontendPrefix(pathnameOverride) {
  if (typeof pathnameOverride === "string") {
    const clean = pathnameOverride.replace(/\\/g, "/");
    return clean === "/frontend" || clean.startsWith("/frontend/") ? "/frontend" : "";
  }
  try {
    if (typeof import.meta !== "undefined" && import.meta.url && /^https?:\/\//i.test(import.meta.url)) {
      const basePath = new URL("..", import.meta.url).pathname.replace(/\/+$/, "");
      return basePath === "/" ? "" : basePath;
    }
  } catch {}
  if (typeof window !== "undefined" && window.location?.pathname) {
    const p = window.location.pathname.replace(/\\/g, "/");
    return p === "/frontend" || p.startsWith("/frontend/") ? "/frontend" : "";
  }
  return "/frontend";
}

export function routePath(subPath = "", prefixOverride) {
  if (!subPath) return "#";
  if (/^(https?:|mailto:|tel:|#|blob:|data:)/i.test(subPath)) return subPath;
  const prefix = detectFrontendPrefix(prefixOverride);
  const clean = String(subPath).replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "");
  return `${prefix}/${clean}`;
}

export function jobDetailUrl(id, prefixOverride) {
  return `${routePath("pages/job-detail.html", prefixOverride)}?id=${encodeURIComponent(id ?? "")}`;
}

export function savedJobsUrl(prefixOverride) {
  return routePath("pages/candidate/saved-jobs.html", prefixOverride);
}

export function appliedJobsUrl(prefixOverride) {
  return routePath("pages/candidate/applications.html", prefixOverride);
}

export function companyUrl(idOrSlug, prefixOverride) {
  return `${routePath("pages/company.html", prefixOverride)}?slug=${encodeURIComponent(idOrSlug ?? "")}`;
}

export function companiesUrl(prefixOverride) {
  return routePath("pages/companies.html", prefixOverride);
}

export function homeUrl(prefixOverride) {
  return routePath("index.html", prefixOverride);
}

export function jobsUrl(params = {}, prefixOverride) {
  const base = routePath("pages/jobs.html", prefixOverride);
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export function loginUrl(redirect = "", prefixOverride) {
  const base = routePath("pages/login.html", prefixOverride);
  return redirect ? `${base}?redirect=${encodeURIComponent(redirect)}` : base;
}

export function registerUrl(prefixOverride) {
  return routePath("pages/register.html", prefixOverride);
}

export function forbiddenUrl(prefixOverride) {
  return routePath("pages/403.html", prefixOverride);
}

export function cvTemplatesUrl(prefixOverride) {
  return routePath("pages/cv-templates.html", prefixOverride);
}

export function cvManageUrl(prefixOverride) {
  return routePath("pages/candidate/cv-manage.html", prefixOverride);
}

export function candidateCvsUrl(params = {}, prefixOverride) {
  const base = routePath("pages/candidate/cvs.html", prefixOverride);
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export function cvBuilderUrl(params = {}, prefixOverride) {
  const base = routePath("pages/candidate/cv-builder.html", prefixOverride);
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export function candidateProfileUrl(hash = "", prefixOverride) {
  const base = routePath("pages/candidate/profile.html", prefixOverride);
  return hash ? `${base}#${String(hash).replace(/^#/, "")}` : base;
}

export function careerPathUrl(prefixOverride) {
  return routePath("pages/candidate/career-path.html", prefixOverride);
}

export function employerCompanySettingsUrl(prefixOverride) {
  return routePath("pages/employer/company-settings.html", prefixOverride);
}

export function employerDashboardUrl(prefixOverride) {
  return routePath("pages/employer/dashboard.html", prefixOverride);
}

export function employerJobsUrl(params = {}, prefixOverride) {
  const base = routePath("pages/employer/jobs.html", prefixOverride);
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export function employerJobFormUrl(params = {}, prefixOverride) {
  const base = routePath("pages/employer/job-form.html", prefixOverride);
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export function employerRecruitmentUrl(params = {}, prefixOverride) {
  const base = routePath("pages/employer/recruitment.html", prefixOverride);
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

const STATIC_ROUTE_MAP = {
  home: () => homeUrl(),
  jobs: () => jobsUrl(),
  "saved-jobs": () => savedJobsUrl(),
  "applied-jobs": () => appliedJobsUrl(),
  companies: () => companiesUrl(),
  "cv-templates": () => cvTemplatesUrl(),
  "cv-manage": () => cvManageUrl(),
  "candidate-cvs": () => candidateCvsUrl(),
  "cv-builder": () => cvBuilderUrl(),
  profile: () => candidateProfileUrl(),
  "career-path": () => careerPathUrl(),
  "employer-dashboard": () => employerDashboardUrl(),
  "employer-jobs": () => employerJobsUrl(),
  "employer-job-form": () => employerJobFormUrl(),
  "employer-recruitment": () => employerRecruitmentUrl(),
  "employer-company-settings": () => employerCompanySettingsUrl(),
  "login-self": () => loginUrl(typeof window !== "undefined" ? window.location.pathname + window.location.search : ""),
};

export function hydrateDataRoutes(rootEl = document) {
  if (!rootEl?.querySelectorAll) return;
  rootEl.querySelectorAll("a[data-route]").forEach((a) => {
    const fn = STATIC_ROUTE_MAP[a.dataset.route];
    if (fn) a.setAttribute("href", fn());
  });
}
