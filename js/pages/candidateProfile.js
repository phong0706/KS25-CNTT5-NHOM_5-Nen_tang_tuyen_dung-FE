import { showStatusToast } from "../components/toast.js";
import {
  renderProfileSkeleton,
  renderProfileError,
  renderProfileSidebar,
} from "../components/profileOverview.js";

const rootEl = document.getElementById("profile-root");
const escapeHtml = window.escapeHtml || ((v) => String(v ?? ""));

let profileState = null;

function renderContent(data) {
  const skillsHtml = data.skills?.length
    ? `<div class="skills-preview-list">${data.skills.map((s) => `<span class="skill-chip">${escapeHtml(s)}</span>`).join("")}</div>`
    : `<div class="empty-section-box"><span>Chưa có kỹ năng. Thêm kỹ năng nổi bật của bạn.</span></div>`;

  return `
    <div class="profile-content">
      <section class="profile-card" id="section-basic-info" tabindex="-1" aria-labelledby="heading-basic-info">
        <div class="section-card-head">
          <h2 class="section-card-title" id="heading-basic-info">Thông tin cá nhân</h2>
          <button type="button" class="section-action-btn" data-section-action="basic">Sửa</button>
        </div>
        <div class="info-preview-grid">
          <div class="info-preview-item"><div class="info-preview-label">Họ tên</div><div class="info-preview-value">${escapeHtml(data.full_name || "—")}</div></div>
          <div class="info-preview-item"><div class="info-preview-label">Chức danh</div><div class="info-preview-value">${escapeHtml(data.headline || "—")}</div></div>
          <div class="info-preview-item"><div class="info-preview-label">Email</div><div class="info-preview-value">${escapeHtml(data.email || "—")}</div></div>
          <div class="info-preview-item"><div class="info-preview-label">Số điện thoại</div><div class="info-preview-value">${escapeHtml(data.phone || "—")}</div></div>
          <div class="info-preview-item"><div class="info-preview-label">Địa điểm</div><div class="info-preview-value">${escapeHtml(data.location || "—")}</div></div>
          <div class="info-preview-item"><div class="info-preview-label">GitHub / LinkedIn</div><div class="info-preview-value">${escapeHtml(data.github_url || data.linkedin_url || "—")}</div></div>
        </div>
      </section>

      <section class="profile-card" id="section-bio" tabindex="-1" aria-labelledby="heading-bio">
        <div class="section-card-head">
          <h2 class="section-card-title" id="heading-bio">Giới thiệu bản thân</h2>
          <button type="button" class="section-action-btn" data-section-action="bio">Sửa</button>
        </div>
        <p class="info-preview-value" style="margin:0;line-height:1.6;">${escapeHtml(data.bio || "Chưa có phần giới thiệu bản thân.")}</p>
      </section>

      <section class="profile-card" id="section-skills" tabindex="-1" aria-labelledby="heading-skills">
        <div class="section-card-head">
          <h2 class="section-card-title" id="heading-skills">Kỹ năng</h2>
          <button type="button" class="section-action-btn" data-section-action="skills">Sửa</button>
        </div>
        ${skillsHtml}
      </section>

      <section class="profile-card" id="section-experiences" tabindex="-1" aria-labelledby="heading-experiences">
        <div class="section-card-head">
          <h2 class="section-card-title" id="heading-experiences">Kinh nghiệm làm việc</h2>
          <button type="button" class="section-action-btn" data-section-action="experiences">Thêm</button>
        </div>
        ${data.experiences?.length ? `<p class="info-preview-value" style="margin:0;">${data.experiences.length} mục kinh nghiệm (chi tiết sẽ hoàn thiện ở Bước 3).</p>` : `<div class="empty-section-box"><span>Chưa có kinh nghiệm. Thêm công việc đầu tiên.</span></div>`}
      </section>

      <section class="profile-card" id="section-educations" tabindex="-1" aria-labelledby="heading-educations">
        <div class="section-card-head">
          <h2 class="section-card-title" id="heading-educations">Học vấn</h2>
          <button type="button" class="section-action-btn" data-section-action="educations">Thêm</button>
        </div>
        ${data.educations?.length ? `<p class="info-preview-value" style="margin:0;">${data.educations.length} mục học vấn (chi tiết sẽ hoàn thiện ở Bước 3).</p>` : `<div class="empty-section-box"><span>Chưa có thông tin học vấn. Thêm quá trình đào tạo của bạn.</span></div>`}
      </section>
    </div>
  `;
}

function scrollToTarget(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  target.focus({ preventScroll: true });
}

function bindEvents() {
  const fillBar = document.getElementById("completion-fill-bar");
  if (fillBar) {
    requestAnimationFrame(() => {
      fillBar.style.width = `${fillBar.dataset.percent || 0}%`;
    });
  }

  rootEl.querySelectorAll(".missing-task-btn").forEach((btn) => {
    btn.addEventListener("click", () => scrollToTarget(btn.dataset.target));
  });

  rootEl.querySelectorAll("[data-section-action], #avatar-upload-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      showStatusToast("Tính năng chỉnh sửa sẽ được mở ở bước tiếp theo.");
    });
  });

  const switchBtn = document.getElementById("btn-visibility-switch");
  if (switchBtn) {
    switchBtn.addEventListener("click", async () => {
      const nextVal = switchBtn.getAttribute("aria-checked") !== "true";
      switchBtn.disabled = true;
      try {
        profileState = await window.api.patch("/candidate/profile", { is_searchable: nextVal });
        switchBtn.setAttribute("aria-checked", profileState.is_searchable ? "true" : "false");
        showStatusToast("Đã lưu");
      } catch (err) {
        showStatusToast(err.message || "Không thể cập nhật trạng thái", "error");
      } finally {
        switchBtn.disabled = false;
      }
    });
  }
}

async function loadProfile() {
  if (!rootEl) return;
  rootEl.innerHTML = renderProfileSkeleton();
  try {
    profileState = await window.api.get("/candidate/profile");
    rootEl.innerHTML = renderProfileSidebar(profileState) + renderContent(profileState);
    bindEvents();
  } catch (err) {
    rootEl.innerHTML = renderProfileError(err.message || "Không thể kết nối máy chủ.");
    const retryBtn = document.getElementById("btn-retry-profile");
    if (retryBtn) retryBtn.addEventListener("click", loadProfile);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});
