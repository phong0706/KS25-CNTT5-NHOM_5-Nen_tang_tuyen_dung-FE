/**
 * companiesPage.js - Trang danh sách công ty IT (/pages/companies.html)
 * Tuân thủ techrecruit-rules: < 200 dòng, không confirm/alert, xử lý đủ 4 trạng thái.
 */
import { getCompanyLogo } from "../components/jobCard.js";
import { renderPagination } from "../components/pagination.js";
import { companyUrl } from "../routes.js";

let state = { q: "", industry_id: "", sort: "jobs_desc", page: 1 };
let abortCtrl = null;
let searchTimer = null;

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

function readUrlState() {
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get("q") || "",
    industry_id: p.get("industry") || "",
    sort: p.get("sort") || "jobs_desc",
    page: Math.max(1, parseInt(p.get("page") || "1", 10)),
  };
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.industry_id) p.set("industry", state.industry_id);
  if (state.sort !== "jobs_desc") p.set("sort", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  const qs = p.toString() ? `?${p.toString()}` : "";
  window.history.pushState(null, "", `${window.location.pathname}${qs}`);
}

function renderSkeletons(container, count = 6) {
  const card = `<div class="company-card" style="opacity:0.6;pointer-events:none;" aria-hidden="true"><div class="company-card-top"><div class="job-skeleton-pulse" style="width:56px;height:56px;border-radius:12px;"></div><div style="flex:1;display:flex;flex-direction:column;gap:8px;"><div class="job-skeleton-pulse" style="width:70%;height:18px;"></div><div class="job-skeleton-pulse" style="width:40%;height:14px;"></div></div></div><div class="job-skeleton-pulse" style="width:90%;height:16px;margin:12px 0;"></div><div class="company-card-footer"><div class="job-skeleton-pulse" style="width:100px;height:24px;border-radius:9999px;"></div></div></div>`;
  container.innerHTML = Array(count).fill(card).join("");
}

function renderEmptyState(container, onReset) {
  container.innerHTML = `<div style="grid-column:1/-1;background:#fff;border:1px solid var(--border);border-radius:16px;padding:48px 24px;text-align:center;"><div style="width:64px;height:64px;border-radius:50%;background:#f1f5f9;color:#64748b;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div><h2 style="font-size:18px;font-weight:700;color:var(--text);margin:0 0 8px;">Không tìm thấy công ty phù hợp</h2><p style="font-size:14px;color:var(--text-secondary);max-width:420px;margin:0 auto 20px;">Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bớt tiêu chí lọc.</p><button type="button" class="btn btn-outline" id="companies-reset-btn">Đặt lại bộ lọc</button></div>`;
  container.querySelector("#companies-reset-btn")?.addEventListener("click", onReset);
}

function renderErrorState(container, onRetry) {
  container.innerHTML = `<div style="grid-column:1/-1;background:#fff;border:1px solid var(--border);border-radius:16px;padding:48px 24px;text-align:center;"><div style="width:64px;height:64px;border-radius:50%;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div><h2 style="font-size:18px;font-weight:700;color:var(--text);margin:0 0 8px;">Không thể tải danh sách công ty</h2><p style="font-size:14px;color:var(--text-secondary);max-width:420px;margin:0 auto 20px;">Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại.</p><button type="button" class="btn btn-primary" id="companies-retry-btn">Thử lại</button></div>`;
  container.querySelector("#companies-retry-btn")?.addEventListener("click", onRetry);
}

function renderCompanyCard(comp) {
  const href = companyUrl(comp.slug || comp.id);
  const countLabel = comp.job_count > 0 ? `${comp.job_count} vị trí đang tuyển` : "Đang cập nhật vị trí";
  const indTag = comp.industry_name ? `<span class="company-card-industry">${esc(comp.industry_name)}</span>` : "";
  return `<a href="${href}" class="company-card" data-company-id="${comp.id}"><div class="company-card-top">${getCompanyLogo(comp.name)}<div class="company-card-info"><h2 class="company-card-name" title="${esc(comp.name)}">${esc(comp.name)}</h2>${indTag}</div></div><div class="company-card-location" title="${esc(comp.address || 'Việt Nam')}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>${esc(comp.address || "Việt Nam")}</span></div><div class="company-card-footer"><span class="company-jobs-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>${countLabel}</span><span class="company-card-arrow" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></span></div></a>`;
}

async function fetchCompanies() {
  if (abortCtrl) abortCtrl.abort();
  abortCtrl = new AbortController();
  const gridHost = document.getElementById("companies-grid-host");
  const summaryHost = document.getElementById("companies-summary");
  const pageHost = document.getElementById("companies-pagination-host");
  if (!gridHost) return;

  renderSkeletons(gridHost, 6);
  if (summaryHost) summaryHost.textContent = "Đang tải dữ liệu...";

  try {
    const res = await window.api.get(
      "/companies",
      { q: state.q, industry_id: state.industry_id || undefined, sort: state.sort, page: state.page, page_size: 12 },
      { signal: abortCtrl.signal }
    );
    const { items = [], total = 0, page = 1, total_pages = 1 } = res;
    if (summaryHost) summaryHost.textContent = total > 0 ? `Hiển thị ${items.length} trên tổng số ${total} công ty IT` : "Không có công ty nào";

    if (items.length === 0) {
      renderEmptyState(gridHost, () => {
        state.q = ""; state.industry_id = ""; state.sort = "jobs_desc"; state.page = 1;
        const sInput = document.getElementById("companies-search-input");
        if (sInput) sInput.value = "";
        syncUrl(); fetchCompanies();
      });
      if (pageHost) pageHost.hidden = true;
      return;
    }

    gridHost.innerHTML = items.map(renderCompanyCard).join("");
    if (pageHost) {
      renderPagination(pageHost, { page, totalPages: total_pages, total }, (newPage) => {
        state.page = newPage; syncUrl(); fetchCompanies(); window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  } catch (err) {
    if (err?.name === "CanceledError" || err?.name === "AbortError") return;
    if (summaryHost) summaryHost.textContent = "Lỗi tải dữ liệu";
    if (pageHost) pageHost.hidden = true;
    renderErrorState(gridHost, fetchCompanies);
  }
}

async function init() {
  state = readUrlState();
  const sInput = document.getElementById("companies-search-input");
  if (sInput) {
    sInput.value = state.q;
    sInput.addEventListener("input", () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        state.q = sInput.value.trim(); state.page = 1; syncUrl(); fetchCompanies();
      }, 300);
    });
  }

  let indOpts = [{ value: "", label: "Tất cả ngành nghề" }];
  try {
    const cats = await window.api.get("/meta/categories");
    if (Array.isArray(cats)) indOpts = indOpts.concat(cats.map((c) => ({ value: String(c.id), label: c.name })));
  } catch {}

  const indHost = document.getElementById("companies-industry-host");
  if (indHost && window.CustomSelect) {
    new window.CustomSelect(indHost, {
      id: "companies-industry-select", name: "industry", options: indOpts, value: state.industry_id,
      ariaLabel: "Lọc theo ngành nghề", onChange: (val) => { state.industry_id = val || ""; state.page = 1; syncUrl(); fetchCompanies(); },
    });
  }

  const sortHost = document.getElementById("companies-sort-host");
  if (sortHost && window.CustomSelect) {
    new window.CustomSelect(sortHost, {
      id: "companies-sort-select", name: "sort",
      options: [{ value: "jobs_desc", label: "Nhiều việc nhất" }, { value: "name_asc", label: "Tên công ty A-Z" }, { value: "newest", label: "Mới nhất" }],
      value: state.sort, ariaLabel: "Sắp xếp danh sách",
      onChange: (val) => { state.sort = val || "jobs_desc"; state.page = 1; syncUrl(); fetchCompanies(); },
    });
  }

  window.addEventListener("popstate", () => { state = readUrlState(); fetchCompanies(); });
  fetchCompanies();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
