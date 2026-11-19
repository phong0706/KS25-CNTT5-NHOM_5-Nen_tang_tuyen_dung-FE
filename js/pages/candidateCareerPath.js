/**
 * candidateCareerPath.js - Trang Lộ trình sự nghiệp cho ứng viên (/pages/candidate/career-path.html)
 * Hiển thị theo thứ tự: Hiện tại, Tiếp theo, Sau nữa. Giới hạn: <= 200 dòng.
 */
import { jobDetailUrl, jobsUrl, hydrateDataRoutes } from "../routes.js";

const state = { data: null, selectedRoleSlug: null, allStepsMap: {} };
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

function fmtMillion(v) {
  if (!v || v <= 0) return "";
  const m = v >= 100000 ? v / 1000000 : v;
  return Number.isInteger(m) ? String(m) : m.toFixed(1).replace(/\.0$/, "");
}

function formatJobSalary(j) {
  if (j.is_salary_negotiable || (!j.salary_min && !j.salary_max)) return "Thỏa thuận";
  const smin = fmtMillion(j.salary_min), smax = fmtMillion(j.salary_max);
  return smin && smax ? `${smin} - ${smax} triệu/tháng` : smax ? `Tới ${smax} triệu/tháng` : `Từ ${smin} triệu/tháng`;
}

function renderStepCard(step) {
  if (!step) return "";
  state.allStepsMap[step.role_slug] = step;
  const isSelected = state.selectedRoleSlug === step.role_slug;
  const isOk = step.status === "ok";
  const salaryStr = step.salary_median ? `Lương trung vị ~${fmtMillion(step.salary_median)} triệu/tháng` : "Chưa đủ mẫu công khai lương";

  return `
    <button type="button" class="cp-step-card ${isSelected ? "is-selected" : ""}" data-role-slug="${esc(step.role_slug)}" aria-expanded="${isSelected}">
      <h3 class="cp-step-role">${esc(step.role)}</h3>
      <div class="cp-step-meta"><span>Cấp bậc: <strong>${esc(step.level)}</strong></span><span>·</span><span class="cp-sample-note">dựa trên ${step.sample_size} tin</span></div>
      ${isOk ? `
        <div class="cp-coverage-bar-track" aria-hidden="true"><div class="cp-coverage-bar-fill" style="width: ${step.coverage_percent}%;"></div></div>
        <div class="cp-badge-row"><span class="cp-coverage-text">Độ phủ: ${esc(step.coverage_label)} (${step.coverage_percent}% trọng số)</span><span class="cp-missing-count">Thiếu ${step.missing_skill_count} kỹ năng</span></div>
        <div class="cp-sample-note">${esc(salaryStr)}</div>
      ` : `<div class="cp-insufficient-box">${esc(step.reason || `Chưa đủ dữ liệu mẫu (hiện có ${step.sample_size}/5 tin).`)}</div>`}
      ${step.transition_note ? `<div class="cp-sample-note">Chuyển nhánh: ${esc(step.transition_note)}</div>` : ""}
    </button>`;
}

function renderDetailPanel(step) {
  const host = document.getElementById("cp-step-detail-host");
  if (!step) { host.innerHTML = ""; return; }

  const missingHtml = step.status !== "ok" ? `<div class="cp-insufficient-box">${esc(step.reason)}</div>`
    : (step.missing_skills.length === 0 ? `<div class="cp-insufficient-box">Bạn đã đáp ứng toàn bộ ${step.total_skill_count}/${step.total_skill_count} kỹ năng trọng tâm của vai trò này.</div>`
      : `<ul class="cp-skill-list">${step.missing_skills.map((sk) => `<li class="cp-skill-item"><strong>${esc(sk.name)}</strong><span class="cp-weight-pill">Trọng số w = ${sk.weight.toFixed(2)} (${sk.job_count}/${sk.total_role_jobs} tin)</span></li>`).join("")}</ul>`);

  const matchedHtml = step.status === "ok" && step.matched_skills.length > 0
    ? `<div style="margin-top:14px;"><h4 style="margin:0 0 8px; font-size:14px;">Kỹ năng bạn đã có (${step.matched_skill_count}/${step.total_skill_count})</h4>
        <ul class="cp-skill-list">${step.matched_skills.map((sk) => `<li class="cp-skill-item"><span>${esc(sk.name)}</span><span class="cp-weight-pill">w = ${sk.weight.toFixed(2)} (${sk.job_count}/${sk.total_role_jobs} tin)</span></li>`).join("")}</ul></div>` : "";

  const jobs = step.related_jobs || [];
  const jobsHtml = jobs.length === 0 ? `<div class="cp-insufficient-box">Hiện chưa có tin tuyển dụng nào đang mở cho vai trò này.</div>`
    : `<div class="cp-job-list">${jobs.map((j) => `<a href="${esc(j.id ? jobDetailUrl(j.id) : jobsUrl({ q: j.title }))}" class="cp-job-link"><div style="font-weight:700; font-size:14px; color:#0f172a;">${esc(j.title)}</div><div style="font-size:13px; color:#334155; margin-top:2px;">${esc(j.company_name || "Doanh nghiệp")} · ${esc(j.location || "Toàn quốc")}</div><div style="font-size:12.5px; color:#0f766e; font-weight:600; margin-top:4px;">${esc(formatJobSalary(j))}</div></a>`).join("")}</div>`;

  host.innerHTML = `
    <div class="cp-detail-panel" id="cp-detail-panel">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid var(--border-default); padding-bottom:12px;">
        <div><h3 style="margin:0; font-size:18px;">Chi tiết bước: ${esc(step.role)}</h3><span class="cp-sample-note">Cấp bậc ${esc(step.level)} · dựa trên ${step.sample_size} tin tuyển dụng · tính ngày ${esc(step.data_as_of || "-")}</span></div>
        <a href="${esc(jobsUrl({ category: step.family_slug }))}" class="btn btn-sm btn-outline">Xem tất cả việc làm họ ${esc(step.family_name)}</a>
      </div>
      <div class="cp-detail-grid">
        <div><h4 style="margin:0 0 10px; font-size:15px;">Kỹ năng còn thiếu (sắp giảm dần theo trọng số w)</h4>${missingHtml}${matchedHtml}</div>
        <div><h4 style="margin:0 0 10px; font-size:15px;">Việc làm liên quan đang mở</h4>${jobsHtml}</div>
      </div>
    </div>`;
}

function renderAll() {
  const d = state.data;
  if (!d) return;
  state.allStepsMap = {};
  document.getElementById("cp-data-summary").textContent = `Dữ liệu trọng số kỹ năng tính ngày ${d.data_as_of || "hôm nay"} (ngưỡng tối thiểu ${d.min_sample_size} tin/vai trò). Kỹ năng của bạn: ${d.candidate_skills.length ? d.candidate_skills.join(", ") : "Chưa nhập"}.`;
  document.getElementById("cp-col-current").innerHTML = renderStepCard(d.current_step);
  const nextCombined = [...(d.next_steps || []), ...(d.insufficient_next_steps || [])];
  document.getElementById("cp-col-next").innerHTML = nextCombined.length ? nextCombined.map(renderStepCard).join("") : `<div class="cp-insufficient-box">${esc(d.reason || "Chưa có bước tiếp theo khả dụng.")}</div>`;
  const furtherList = d.further_steps || [];
  document.getElementById("cp-col-further").innerHTML = furtherList.length ? furtherList.map(renderStepCard).join("") : `<div class="cp-insufficient-box">Bạn đang ở gần bậc cao nhất của lộ trình hoặc các bậc sau nữa chưa đủ tối thiểu ${d.min_sample_size} tin làm mẫu.</div>`;

  document.querySelectorAll(".cp-step-card[data-role-slug]").forEach((btn) => {
    btn.addEventListener("click", () => { state.selectedRoleSlug = btn.getAttribute("data-role-slug"); renderAll(); });
  });
  const activeStep = state.allStepsMap[state.selectedRoleSlug] || d.next_steps?.[0] || d.current_step;
  if (activeStep) { state.selectedRoleSlug = activeStep.role_slug; renderDetailPanel(activeStep); }
}

function checkRoleAccess() {
  const role = window.Auth?.getRole?.() || "";
  if (role !== "admin" && role !== "operator" && role !== "recruiter" && role !== "employer") return true;
  const root = document.body?.dataset?.root || "../../";
  const isAdmin = role === "admin" || role === "operator";
  const title = isAdmin ? "quản trị viên" : "nhà tuyển dụng";
  const dest = isAdmin ? `${root}pages/admin/dashboard.html` : `${root}pages/employer/dashboard.html`;
  const label = isAdmin ? "Về trang quản trị" : "Về trang nhà tuyển dụng";

  const form = document.getElementById("cp-filter-form"), grid = document.getElementById("cp-stages-grid"), host = document.getElementById("cp-state-host");
  if (form) form.hidden = true;
  if (grid) grid.hidden = true;
  if (host) {
    host.innerHTML = `<div class="cp-insufficient-box" role="alert" style="border-color:#fca5a5; background:#fef2f2; color:#991b1b; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;"><span>Trang này dành cho ứng viên. Bạn đang đăng nhập bằng tài khoản ${title}.</span><a href="${dest}" class="btn btn-sm btn-primary">${label}</a></div>`;
  }
  return false;
}

function renderCareerError(err, params = {}) {
  const host = document.getElementById("cp-state-host"), grid = document.getElementById("cp-stages-grid");
  if (grid) grid.hidden = true;
  if (!host) return;

  const root = document.body?.dataset?.root || "../../";
  const status = Number(err?.status || 0);
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  let msg = "", action = `<button type="button" id="cp-retry-btn" class="btn btn-sm btn-outline">Thử lại</button>`;

  if (status === 0) {
    msg = "Không kết nối được máy chủ. Kiểm tra backend đang chạy ở cổng 8000, rồi thử lại.";
  } else if (status === 401) {
    msg = "Phiên đăng nhập đã hết. Đăng nhập lại để xem lộ trình.";
    action = `<a href="${root}pages/login.html?redirect=${redirect}" class="btn btn-sm btn-primary">Đăng nhập</a>`;
  } else if (status === 403) {
    const role = window.Auth?.getRole?.() || "";
    const isAdmin = role === "admin" || role === "operator", isEmp = role === "recruiter" || role === "employer";
    msg = isAdmin ? "Trang này dành cho ứng viên. Bạn đang đăng nhập bằng tài khoản quản trị viên."
      : isEmp ? "Trang này dành cho ứng viên. Bạn đang đăng nhập bằng tài khoản nhà tuyển dụng."
      : "Trang này dành cho ứng viên. Bạn không có quyền truy cập lộ trình này.";
    const target = isAdmin ? `${root}pages/admin/dashboard.html` : isEmp ? `${root}pages/employer/dashboard.html` : `${root}index.html`;
    const label = isAdmin ? "Về trang quản trị" : isEmp ? "Về trang nhà tuyển dụng" : "Về trang chủ";
    action = `<a href="${target}" class="btn btn-sm btn-primary">${label}</a>`;
  } else if (status === 404) {
    msg = err?.message || "Chưa có dữ liệu lộ trình cho lựa chọn này.";
  } else if (status >= 500) {
    msg = "Máy chủ gặp lỗi khi xử lý lộ trình. Vui lòng thử lại sau.";
  } else {
    msg = err?.message || "Không thể tải dữ liệu lộ trình sự nghiệp.";
  }

  host.innerHTML = `<div class="cp-insufficient-box" role="alert" style="border-color:#fca5a5; background:#fef2f2; color:#991b1b; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;"><span>${esc(msg)}</span><div>${action}</div></div>`;
  document.getElementById("cp-retry-btn")?.addEventListener("click", () => fetchCareerPath(params));
}

async function fetchCareerPath(params = {}) {
  if (!checkRoleAccess()) return;
  const stateHost = document.getElementById("cp-state-host"), grid = document.getElementById("cp-stages-grid");
  if (stateHost) stateHost.innerHTML = `<div class="cp-insufficient-box">Đang tải dữ liệu lộ trình sự nghiệp và trọng số kỹ năng...</div>`;
  if (grid) grid.hidden = true;
  try {
    const q = {};
    if (params.userId) q.user_id = params.userId;
    if (params.family) q.family = params.family;
    if (params.level) q.level = params.level;
    if (params.skills) q.skills = params.skills;

    const res = await window.api.get("/career-path", q);
    state.data = res;
    if (stateHost) stateHost.innerHTML = "";
    if (grid) grid.hidden = false;

    const famSelect = document.getElementById("cp-family-select"), lvlSelect = document.getElementById("cp-level-select"), skInput = document.getElementById("cp-skills-input");
    if (res.current_step) {
      if (famSelect) famSelect.value = res.current_step.family_slug;
      if (lvlSelect) lvlSelect.value = res.current_step.level_slug;
    }
    if (skInput && !skInput.value && Array.isArray(res.candidate_skills)) skInput.value = res.candidate_skills.join(", ");
    state.selectedRoleSlug = res.next_steps?.[0]?.role_slug || res.current_step?.role_slug;
    renderAll();
  } catch (err) {
    renderCareerError(err, params);
  }
}

document.getElementById("cp-filter-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  fetchCareerPath({
    family: document.getElementById("cp-family-select")?.value,
    level: document.getElementById("cp-level-select")?.value,
    skills: document.getElementById("cp-skills-input")?.value.trim(),
  });
});

hydrateDataRoutes(document);
if (checkRoleAccess()) {
  const urlParams = new URLSearchParams(window.location.search);
  fetchCareerPath({
    userId: urlParams.get("user_id") || window.Auth?.getUser?.()?.id || 29,
    family: urlParams.get("family") || "backend",
    level: urlParams.get("level") || "middle",
    skills: urlParams.get("skills") || undefined,
  });
}
