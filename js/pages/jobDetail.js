/**
 * jobDetail.js - Trang chi tiết việc làm (/pages/job-detail.html?id=...)
 * Hiển thị đầy đủ mô tả, yêu cầu, quyền lợi; nút Ứng tuyển + Lưu tin; gợi ý việc liên quan.
 */
import { getCompanyLogo, formatSalary, toggleSave } from "../components/jobCard.js";
import { openApplyModal } from "../components/applyModal.js";
import { showStatusToast } from "../components/toast.js";
import { jobDetailUrl, appliedJobsUrl, loginUrl } from "../routes.js";

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

/** Escape + chuyển \n thành <br> (mô tả công việc là nội dung người dùng nhập). */
function proseHtml(value) {
  if (!value) return "";
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function formatDateVi(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderMeta(job) {
  const host = document.getElementById("jd-meta-row");
  if (!host) return;
  const chips = [];
  if (job.category_name) chips.push(job.category_name);
  if (job.published_at || job.created_at) {
    chips.push(`Đăng ${formatDateVi(job.published_at || job.created_at)}`);
  }
  host.innerHTML = chips.map((c) => `<span class="jd-meta-chip">${escapeHtml(c)}</span>`).join("");
}

function renderTags(job) {
  const host = document.getElementById("jd-tags");
  if (!host) return;
  const skills = Array.isArray(job.skills) ? job.skills : [];
  host.innerHTML = skills.map((s) => `<span class="jd-tag">${escapeHtml(s)}</span>`).join("");
}

function renderSideSkills(job) {
  const host = document.getElementById("jd-skills");
  if (!host) return;
  const skills = Array.isArray(job.skills) ? job.skills : [];
  if (!skills.length) {
    host.innerHTML = `<p class="jd-muted">Chưa có kỹ năng được liệt kê.</p>`;
    return;
  }
  host.innerHTML = skills.map((s) => `<span class="jd-side-tag">${escapeHtml(s)}</span>`).join("");
}

function renderFacts(job) {
  const host = document.getElementById("jd-facts");
  if (!host) return;
  const facts = [
    ["Ngành nghề", job.category_name || "—"],
    ["Hình thức làm việc", job.type || job.work_type || "—"],
    ["Cấp bậc", job.level || "—"],
    ["Địa điểm", job.location || "Toàn quốc"],
    ["Ngày đăng", formatDateVi(job.published_at || job.created_at)],
  ];
  host.innerHTML = facts
    .map(([k, v]) => `<div class="jd-fact"><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`)
    .join("");
}

function renderApplyState(job) {
  const btn = document.getElementById("jd-apply-btn");
  const note = document.getElementById("jd-side-note");
  const role = window.Auth?.getRole?.();

  if (!window.Auth?.isAuthenticated?.()) {
    if (note) note.textContent = "Đăng nhập để ứng tuyển vị trí này.";
    if (btn) btn.dataset.needsLogin = "1";
    return;
  }
  if (role !== "candidate") {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Chỉ ứng viên mới ứng tuyển được";
    }
    if (note) note.textContent = "Tài khoản của bạn không phải ứng viên.";
    return;
  }
  if (note) note.textContent = "Ứng tuyển chỉ mất khoảng 2 phút.";
}

function renderSaveState(isSaved) {
  const btn = document.getElementById("jd-save-btn");
  const label = document.getElementById("jd-save-label");
  if (!btn) return;
  btn.classList.toggle("is-saved", Boolean(isSaved));
  btn.setAttribute("aria-pressed", isSaved ? "true" : "false");
  if (label) label.textContent = isSaved ? "Đã lưu tin" : "Lưu tin tuyển dụng";
}

async function renderRelated(job) {
  const host = document.getElementById("jd-related");
  if (!host) return;
  try {
    const params = { page_size: 6, sort: "newest" };
    if (job.category_id) params.category_id = job.category_id;
    const data = await window.api.get("/jobs", params);
    const items = (data.items || []).filter((j) => j.id !== job.id).slice(0, 4);
    if (!items.length) {
      host.innerHTML = `<p class="jd-muted">Chưa có việc làm liên quan.</p>`;
      return;
    }
    host.innerHTML = items
      .map(
        (j) => `
        <a class="jd-related-item" href="${escapeHtml(jobDetailUrl(j.id))}">
          <span class="jd-related-title">${escapeHtml((j.title || "").replace("[Seed]", "").trim())}</span>
          <span class="jd-related-meta">${escapeHtml(j.company_name || "")} · ${escapeHtml(formatSalary(j))}</span>
        </a>`
      )
      .join("");
  } catch {
    host.innerHTML = `<p class="jd-muted">Không tải được việc làm liên quan.</p>`;
  }
}

function renderJob(job) {
  document.title = `${job.title} | TechRecruit`;
  setText("jd-crumb-title", job.title);
  setText("jd-title", job.title);
  setText("jd-company", job.company_name || "Doanh nghiệp tuyển dụng");
  setText("jd-salary", formatSalary(job));
  setText("jd-location", job.location || "Toàn quốc");
  setText("jd-worktype", job.type || job.work_type || "Toàn thời gian");
  setText("jd-level", job.level || "Tất cả");

  const logoHost = document.getElementById("jd-logo");
  if (logoHost) logoHost.innerHTML = getCompanyLogo(job.company_name);

  renderMeta(job);
  renderTags(job);
  renderSideSkills(job);
  renderFacts(job);
  renderApplyState(job);
  renderSaveState(Boolean(job.is_saved));

  // Ứng viên đã ứng tuyển rồi -> nút chuyển thành "Xem hồ sơ".
  if (job.applied) {
    const applyBtn = document.getElementById("jd-apply-btn");
    const note = document.getElementById("jd-side-note");
    if (applyBtn) {
      applyBtn.textContent = "Đã ứng tuyển";
      applyBtn.dataset.applied = "1";
    }
    if (note) note.textContent = "Bạn đã nộp hồ sơ cho vị trí này.";
  }

  const desc = document.getElementById("jd-description");
  if (desc) desc.innerHTML = proseHtml(job.description) || `<p class="jd-muted">Chưa có mô tả chi tiết.</p>`;
  const req = document.getElementById("jd-requirements");
  if (req) req.innerHTML = proseHtml(job.requirements) || `<p class="jd-muted">Chưa có yêu cầu chi tiết.</p>`;
  const ben = document.getElementById("jd-benefits");
  if (ben) ben.innerHTML = proseHtml(job.benefits) || `<p class="jd-muted">Chưa có thông tin quyền lợi.</p>`;

  document.getElementById("jd-loading")?.setAttribute("hidden", "");
  document.getElementById("jd-content")?.removeAttribute("hidden");
}

function bindActions(job) {
  const applyBtn = document.getElementById("jd-apply-btn");
  applyBtn?.addEventListener("click", () => {
    if (applyBtn.dataset.needsLogin === "1") {
      const here = window.location.pathname + window.location.search;
      window.location.href = loginUrl(here);
      return;
    }
    if (applyBtn.dataset.applied === "1") {
      window.location.href = appliedJobsUrl();
      return;
    }
    openApplyModal(job, { triggerBtn: applyBtn });
  });

  const saveBtn = document.getElementById("jd-save-btn");
  saveBtn?.addEventListener("click", () => {
    toggleSave(job.id, saveBtn, {
      onToast: (msg, type) => showStatusToast(msg, type === "success" ? "success" : "danger"),
      onChanged: (_id, saved) => renderSaveState(saved),
    });
  });
}

async function checkSavedState(job) {
  // API /jobs/{id} đã trả sẵn is_saved nên không cần gọi thêm endpoint.
  renderSaveState(Boolean(job.is_saved));
}

function showError(message) {
  document.getElementById("jd-loading")?.setAttribute("hidden", "");
  const errBox = document.getElementById("jd-error");
  if (errBox) errBox.removeAttribute("hidden");
  setText("jd-error-msg", message || "Tin tuyển dụng này có thể đã được gỡ bỏ.");
}

async function init() {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  if (!id || id <= 0) {
    showError("Thiếu mã tin tuyển dụng trên đường dẫn.");
    return;
  }
  try {
    const job = await window.api.get(`/jobs/${id}`);
    renderJob(job);
    bindActions(job);
    checkSavedState(job);
    renderRelated(job);
  } catch (err) {
    showError(err?.message);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
