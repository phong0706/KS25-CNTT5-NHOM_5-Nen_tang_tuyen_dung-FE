/**
 * companyDetailPage.js - Trang chi tiết công ty IT (/pages/company.html?slug=)
 * Tuân thủ techrecruit-rules: < 200 dòng, rel="noopener noreferrer", trạng thái 404 đẹp.
 */
import { renderJobCard, bindSaveJobButtons, bindApplyJobButtons, getCompanyLogo } from "../components/jobCard.js";
import { showStatusToast } from "../components/toast.js";
import { jobDetailUrl, companiesUrl, jobsUrl, homeUrl } from "../routes.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

function render404(container, slug) {
  const breadcrumbName = document.getElementById("breadcrumb-company-name");
  if (breadcrumbName) breadcrumbName.textContent = "Không tìm thấy";
  container.innerHTML = `
    <div class="company-404-box">
      <div class="company-404-icon" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
      </div>
      <h1 class="company-main-name" style="margin-bottom:12px;">Không tìm thấy công ty</h1>
      <p style="font-size:14.5px;color:var(--text-secondary);line-height:1.6;margin-bottom:24px;">
        Doanh nghiệp với mã <strong>"${esc(slug || "chưa xác định")}"</strong> không tồn tại hoặc đã tạm dừng hiển thị thông tin.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;">
        <a href="${companiesUrl()}" class="btn btn-primary">Xem tất cả công ty</a>
        <a href="${homeUrl()}" class="btn btn-outline">Về trang chủ</a>
      </div>
    </div>
  `;
}

function renderError(container, onRetry) {
  container.innerHTML = `
    <div class="company-404-box">
      <div class="company-404-icon" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <h1 class="company-main-name" style="margin-bottom:12px;">Lỗi kết nối máy chủ</h1>
      <p style="font-size:14.5px;color:var(--text-secondary);margin-bottom:24px;">Không thể tải dữ liệu công ty. Vui lòng thử lại.</p>
      <button type="button" class="btn btn-primary" id="company-retry-btn">Thử lại</button>
    </div>
  `;
  container.querySelector("#company-retry-btn")?.addEventListener("click", onRetry);
}

function renderCompanyDetail(comp) {
  const contentHost = document.getElementById("company-content-host");
  const breadcrumbName = document.getElementById("breadcrumb-company-name");
  if (!contentHost) return;

  if (breadcrumbName) breadcrumbName.textContent = comp.name;
  document.title = `${comp.name} - Thông tin & Tuyển dụng | TechRecruit`;

  const webLink = comp.website
    ? `<a href="${esc(comp.website)}" target="_blank" rel="noopener noreferrer" class="company-item-link">${esc(comp.website)}</a>`
    : "Đang cập nhật";

  const jobsList = Array.isArray(comp.jobs) ? comp.jobs : [];
  const jobsHtml = jobsList.length > 0
    ? jobsList.map((j) => renderJobCard(j, { showSaveBtn: true, showApplyBtn: true })).join("")
    : `
      <div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:32px;text-align:center;">
        <p style="color:var(--text-secondary);margin:0 0 12px;">Hiện công ty chưa có vị trí tuyển dụng nào mở.</p>
        <a href="${jobsUrl()}" class="btn btn-outline btn-sm">Khám phá các việc làm khác</a>
      </div>
    `;

  contentHost.innerHTML = `
    <!-- Ảnh bìa -->
    <div class="company-cover-wrap">
      ${comp.cover_url ? `<img src="${esc(comp.cover_url)}" alt="${esc(comp.name)} Cover" class="company-cover-img">` : ""}
    </div>

    <!-- Thông tin tổng quan -->
    <section class="company-profile-card">
      <div class="company-profile-head">
        <div class="company-main-logo">${getCompanyLogo(comp.name, "logo-lg")}</div>
        <div class="company-main-info">
          <h1 class="company-main-name">${esc(comp.name)}</h1>
          <div class="company-meta-tags">
            ${comp.industry_name ? `<span class="company-meta-tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>${esc(comp.industry_name)}</span>` : ""}
            ${comp.size ? `<span class="company-meta-tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>${esc(comp.size)}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="company-details-grid">
        <div class="company-detail-item">
          <span class="company-item-label">Địa chỉ trụ sở</span>
          <span class="company-item-val">${esc(comp.address || "Việt Nam")}</span>
        </div>
        <div class="company-detail-item">
          <span class="company-item-label">Website doanh nghiệp</span>
          <span class="company-item-val">${webLink}</span>
        </div>
        <div class="company-detail-item">
          <span class="company-item-label">Vị trí đang tuyển</span>
          <span class="company-item-val" style="color:var(--primary);">${comp.job_count || jobsList.length} vị trí</span>
        </div>
      </div>
    </section>

    <!-- Giới thiệu -->
    <section>
      <h2 class="company-section-title">Giới thiệu công ty</h2>
      <div class="company-about-card">
        ${esc(comp.description || "Công ty chưa cập nhật mô tả chi tiết.")}
      </div>
    </section>

    <!-- Danh sách việc làm -->
    <section>
      <h2 class="company-section-title">
        <span>Vị trí đang tuyển dụng</span>
        <span style="font-size:15px;font-weight:600;color:var(--text-light);font-variant-numeric:tabular-nums;">(${jobsList.length})</span>
      </h2>
      <div class="company-jobs-host" id="company-jobs-container">${jobsHtml}</div>
    </section>
  `;

  const jobsContainer = document.getElementById("company-jobs-container");
  if (jobsContainer) {
    bindSaveJobButtons(jobsContainer, {
      onToast: (msg, type) => showStatusToast(msg, type === "success" ? "success" : "danger"),
    });
    bindApplyJobButtons(jobsContainer, {
      onApply: (jobId) => { window.location.href = jobDetailUrl(jobId); },
    });
    jobsContainer.querySelectorAll(".job-card--clickable").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("a, button")) return;
        const href = card.dataset.jobHref;
        if (href) window.location.href = href;
      });
    });
  }
}

async function loadCompany() {
  const p = new URLSearchParams(window.location.search);
  const slug = p.get("slug")?.trim();
  const contentHost = document.getElementById("company-content-host");
  const errorHost = document.getElementById("company-error-host");

  if (!slug) {
    contentHost.hidden = true;
    errorHost.hidden = false;
    render404(errorHost, "");
    return;
  }

  contentHost.innerHTML = `<div class="job-skeleton-pulse" style="width:100%;height:300px;border-radius:16px;"></div>`;
  contentHost.hidden = false;
  errorHost.hidden = true;

  try {
    const comp = await window.api.get(`/companies/${encodeURIComponent(slug)}`);
    renderCompanyDetail(comp);
  } catch (err) {
    contentHost.hidden = true;
    errorHost.hidden = false;
    if (err?.response?.status === 404 || err?.status === 404) {
      render404(errorHost, slug);
    } else {
      renderError(errorHost, loadCompany);
    }
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadCompany);
else loadCompany();
