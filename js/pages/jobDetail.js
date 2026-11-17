/**
 * jobDetail.js - Trang chi tiết việc làm (/pages/job-detail.html?id=...)
 * Hiển thị đầy đủ mô tả, yêu cầu, quyền lợi; nút Ứng tuyển + Lưu tin; gợi ý việc liên quan.
 */
import { getCompanyLogo, formatSalary, toggleSave } from "../components/jobCard.js";
import { openApplyModal } from "../components/applyModal.js";
import { showStatusToast } from "../components/toast.js";

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
        <a class="jd-related-item" href="./job-detail.html?id=${encodeURIComponent(j.id)}">
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
      window.location.href = `./login.html?redirect=${encodeURIComponent(here)}`;
      return;
    }
    if (applyBtn.dataset.applied === "1") {
      window.location.href = "./candidate/applications.html";
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

  bindReportButton(job);
}

function openReportModal(job) {
  const host = document.createElement("div");
  host.className = "jd-report-modal-backdrop";
  const returnFocus = document.activeElement;
  host.innerHTML = `
    <div class="jd-report-dialog" role="dialog" aria-modal="true" aria-labelledby="jd-report-title">
      <div class="jd-report-header">
        <h3 id="jd-report-title">Báo cáo tin vi phạm</h3>
        <button type="button" class="jd-report-close" id="jd-report-close" aria-label="Đóng">✕</button>
      </div>
      <div class="jd-report-body">
        <p style="margin:0 0 10px; font-size:13.5px; color:var(--text-secondary);">
          Bạn đang báo cáo tin <strong>${escapeHtml(job.title)}</strong> tại ${escapeHtml(job.company_name || "")}.
        </p>
        <label for="jd-report-reason" style="font-size:13px; font-weight:600;">Lý do báo cáo</label>
        <select id="jd-report-reason" style="width:100%; padding:8px 10px; border:1px solid var(--border-default); border-radius:8px; margin:6px 0 12px; font-size:14px;">
          <option value="Lừa đảo / Yêu cầu nộp tiền">Lừa đảo / Yêu cầu nộp tiền</option>
          <option value="Sai thông tin công việc">Sai thông tin công việc</option>
          <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
          <option value="Tin đã hết hạn / không còn tuyển">Tin đã hết hạn / không còn tuyển</option>
          <option value="Khác">Khác</option>
        </select>
        <label for="jd-report-detail" style="font-size:13px; font-weight:600;">Chi tiết bổ sung (không bắt buộc)</label>
        <textarea id="jd-report-detail" rows="4" maxlength="1800" placeholder="Mô tả thêm về hành vi vi phạm..." style="width:100%; padding:8px 10px; border:1px solid var(--border-default); border-radius:8px; margin-top:6px; font-family:inherit; font-size:14px;"></textarea>
        <p id="jd-report-error" role="alert" style="color:#dc2626; font-size:13px; margin:8px 0 0;" hidden></p>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px; padding:0 16px 16px;">
        <button type="button" class="btn btn-outline" id="jd-report-cancel">Hủy</button>
        <button type="button" class="btn btn-danger" id="jd-report-submit">Gửi báo cáo</button>
      </div>
    </div>`;
  document.body.appendChild(host);
  const close = () => {
    document.removeEventListener("keydown", onKeyDown);
    host.remove();
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
  };
  const onKeyDown = (event) => {
    if (event.key === "Escape") close();
  };
  document.addEventListener("keydown", onKeyDown);
  host.querySelector("#jd-report-close").addEventListener("click", close);
  host.querySelector("#jd-report-cancel").addEventListener("click", close);
  host.addEventListener("click", (e) => { if (e.target === host) close(); });

  host.querySelector("#jd-report-submit").addEventListener("click", async () => {
    const reasonType = host.querySelector("#jd-report-reason").value;
    const detail = host.querySelector("#jd-report-detail").value.trim();
    const reason = `${reasonType}${detail ? ` - ${detail}` : ""}`;
    const errorEl = host.querySelector("#jd-report-error");
    if (reason.trim().length < 5) {
      errorEl.textContent = "Vui lòng nhập lý do báo cáo (tối thiểu 5 ký tự).";
      errorEl.hidden = false;
      host.querySelector("#jd-report-reason").focus();
      return;
    }
    const submitBtn = host.querySelector("#jd-report-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi...";
    errorEl.hidden = true;
    try {
      await window.api.post("/reports", { post_id: job.id, reason });
      close();
      showStatusToast("Đã gửi báo cáo. Cảm ơn bạn đã góp ý!", "success");
    } catch (err) {
      errorEl.textContent = err?.message || "Gửi báo cáo thất bại. Vui lòng thử lại.";
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Gửi báo cáo";
    }
  });
}

function bindReportButton(job) {
  const btn = document.getElementById("jd-report-btn");
  if (!btn) return;
  // Chỉ hiển thị nút với ứng viên đã đăng nhập
  if (!window.Auth?.isAuthenticated?.() || window.Auth?.getRole?.() !== "candidate") {
    btn.style.display = "none";
    return;
  }
  btn.addEventListener("click", () => {
    if (!window.Auth?.isAuthenticated?.()) {
      window.location.href = `./login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    openReportModal(job);
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
