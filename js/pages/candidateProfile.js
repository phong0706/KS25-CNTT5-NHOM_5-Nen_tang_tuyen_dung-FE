import { showStatusToast } from "../components/toast.js";
import {
  renderProfileSkeleton,
  renderProfileError,
  renderProfileSidebar,
} from "../components/profileOverview.js";
import { createProfileEditManager } from "../components/profileEditManager.js";
import { formatDuration, formatEducationYear } from "../utils/dateDuration.js";
import { openExperienceDrawer, openEducationDrawer } from "../components/profileDrawer.js";
import { openConfirmModal } from "../components/confirmModal.js";
import { openAvatarCropModal } from "../components/avatarCropModal.js";

const rootEl = document.getElementById("profile-root");
const escapeHtml = window.escapeHtml || ((v) => String(v ?? ""));

let profileState = null;

function shortenUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "") + (parsed.pathname !== "/" ? parsed.pathname.replace(/\/$/, "") : "");
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }
}

function renderLinkItem(label, url, sectionKey) {
  if (!url) {
    return `
      <div class="info-preview-item">
        <div class="info-preview-label">${label}</div>
        <div class="info-preview-value text-muted" style="display:flex;align-items:center;gap:8px;">
          <span>Chưa cập nhật</span>
          <button type="button" class="btn-text-action" data-add-field="${sectionKey}" style="background:none;border:none;color:var(--primary);cursor:pointer;font-weight:600;padding:0;font-size:13px;">+ Thêm</button>
        </div>
      </div>
    `;
  }
  const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
  const displayDomain = shortenUrl(url);
  return `
    <div class="info-preview-item">
      <div class="info-preview-label">${label}</div>
      <div class="info-preview-value">
        <a href="${escapeHtml(cleanUrl)}" target="_blank" rel="noopener noreferrer" class="profile-ext-link" style="color:var(--primary);text-decoration:none;word-break:break-all;font-weight:500;">
          ${escapeHtml(displayDomain)} ↗
        </a>
      </div>
    </div>
  `;
}

function renderValueItem(label, value, sectionKey) {
  if (!value || !String(value).trim()) {
    return `
      <div class="info-preview-item">
        <div class="info-preview-label">${label}</div>
        <div class="info-preview-value text-muted" style="display:flex;align-items:center;gap:8px;">
          <span>Chưa cập nhật</span>
          <button type="button" class="btn-text-action" data-add-field="${sectionKey}" style="background:none;border:none;color:var(--primary);cursor:pointer;font-weight:600;padding:0;font-size:13px;">+ Thêm</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="info-preview-item">
      <div class="info-preview-label">${label}</div>
      <div class="info-preview-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function renderContent(data) {
  const skillsHtml = data.skills?.length
    ? `<div class="skills-preview-list">${data.skills.map((s) => `<span class="skill-chip">${escapeHtml(s)}</span>`).join("")}</div>`
    : `<div class="empty-section-box"><span>Chưa có kỹ năng. Thêm kỹ năng nổi bật của bạn.</span></div>`;

  const experiencesHtml = data.experiences?.length
    ? `<div class="profile-timeline-list">
        ${data.experiences.map((exp) => {
          let durationStr = "";
          try {
            durationStr = formatDuration(exp.start_month, exp.end_month, exp.is_current);
          } catch {
            durationStr = `${exp.start_month || ""} – ${exp.is_current ? "Hiện tại" : (exp.end_month || "")}`;
          }
          return `
            <div class="profile-timeline-item" data-id="${exp.id}">
              <div class="profile-timeline-track">
                <div class="profile-timeline-dot"></div>
                <div class="profile-timeline-line"></div>
              </div>
              <div class="profile-timeline-content">
                <div class="profile-timeline-head">
                  <div>
                    <h3 class="profile-timeline-title">${escapeHtml(exp.title)}</h3>
                    <div class="profile-timeline-subtitle">${escapeHtml(exp.company)}</div>
                    <div class="profile-timeline-time">${escapeHtml(durationStr)}</div>
                  </div>
                  <div class="profile-item-menu">
                    <button type="button" class="profile-dots-trigger" aria-label="Thao tác kinh nghiệm ${escapeHtml(exp.title)}" data-menu-id="exp-${exp.id}">•••</button>
                    <div class="profile-dots-dropdown" id="menu-exp-${exp.id}">
                      <button type="button" class="profile-dots-item" data-action="edit-exp" data-id="${exp.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Sửa</span>
                      </button>
                      <button type="button" class="profile-dots-item danger-item" data-action="delete-exp" data-id="${exp.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
                ${exp.description ? `<p class="profile-timeline-desc">${escapeHtml(exp.description)}</p>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>`
    : `<div class="empty-section-box">
        <span>Chưa có kinh nghiệm. Thêm công việc đầu tiên.</span>
        <button type="button" class="section-action-btn" data-section-action="experiences">+ Thêm</button>
      </div>`;

  const educationsHtml = data.educations?.length
    ? `<div class="profile-timeline-list">
        ${data.educations.map((edu) => {
          const durationStr = formatEducationYear(edu.start_year, edu.end_year);
          return `
            <div class="profile-timeline-item" data-id="${edu.id}">
              <div class="profile-timeline-track">
                <div class="profile-timeline-dot"></div>
                <div class="profile-timeline-line"></div>
              </div>
              <div class="profile-timeline-content">
                <div class="profile-timeline-head">
                  <div>
                    <h3 class="profile-timeline-title">${escapeHtml(edu.degree)} · ${escapeHtml(edu.major)}</h3>
                    <div class="profile-timeline-subtitle">${escapeHtml(edu.school)}</div>
                    <div class="profile-timeline-time">${escapeHtml(durationStr)}</div>
                  </div>
                  <div class="profile-item-menu">
                    <button type="button" class="profile-dots-trigger" aria-label="Thao tác học vấn ${escapeHtml(edu.school)}" data-menu-id="edu-${edu.id}">•••</button>
                    <div class="profile-dots-dropdown" id="menu-edu-${edu.id}">
                      <button type="button" class="profile-dots-item" data-action="edit-edu" data-id="${edu.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Sửa</span>
                      </button>
                      <button type="button" class="profile-dots-item danger-item" data-action="delete-edu" data-id="${edu.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>`
    : `<div class="empty-section-box">
        <span>Chưa có thông tin học vấn. Thêm quá trình đào tạo của bạn.</span>
        <button type="button" class="section-action-btn" data-section-action="educations">+ Thêm</button>
      </div>`;

  return `
    <div class="profile-content">
      <section class="profile-card" id="section-basic-info" tabindex="-1" aria-labelledby="heading-basic-info">
        <div class="section-card-head">
          <h2 class="section-card-title" id="heading-basic-info">Thông tin cá nhân</h2>
          <button type="button" class="section-action-btn" data-section-action="basic">Sửa</button>
        </div>
        <div class="info-preview-grid">
          <div class="info-preview-item"><div class="info-preview-label">Họ tên</div><div class="info-preview-value">${escapeHtml(data.full_name || "—")}</div></div>
          ${renderValueItem("Chức danh", data.headline, "headline")}
          <div class="info-preview-item"><div class="info-preview-label">Email</div><div class="info-preview-value">${escapeHtml(data.email || "—")}</div></div>
          ${renderValueItem("Số điện thoại", data.phone, "phone")}
          ${renderValueItem("Địa điểm", data.location, "location")}
          ${renderLinkItem("GitHub", data.github_url, "github_url")}
          ${renderLinkItem("LinkedIn", data.linkedin_url, "linkedin_url")}
          ${renderLinkItem("Portfolio", data.portfolio_url, "portfolio_url")}
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
        ${experiencesHtml}
      </section>

      <section class="profile-card" id="section-educations" tabindex="-1" aria-labelledby="heading-educations">
        <div class="section-card-head">
          <h2 class="section-card-title" id="heading-educations">Học vấn</h2>
          <button type="button" class="section-action-btn" data-section-action="educations">Thêm</button>
        </div>
        ${educationsHtml}
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

let cachedLocations = null;
async function fetchLocations() {
  if (cachedLocations) return cachedLocations;
  try {
    cachedLocations = await window.api.get("/meta/locations");
    return cachedLocations;
  } catch {
    return [];
  }
}

let editManager = null;

function render() {
  if (!rootEl || !profileState) return;
  rootEl.innerHTML = renderProfileSidebar(profileState) + renderContent(profileState);
  bindEvents();
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

  editManager = createProfileEditManager({
    getState: () => profileState,
    setState: (next) => { profileState = next; },
    onUpdated: () => render(),
    getLocations: fetchLocations,
  });

  rootEl.querySelectorAll("[data-section-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.sectionAction;
      if (action === "basic" || action === "bio" || action === "skills") {
        editManager.openSection(action);
      } else if (action === "experiences") {
        openExperienceDrawer({
          item: null,
          onSave: async (payload) => {
            profileState = await window.api.post("/candidate/profile/experiences", payload);
            render();
            showStatusToast("Đã thêm kinh nghiệm");
          },
        });
      } else if (action === "educations") {
        openEducationDrawer({
          item: null,
          onSave: async (payload) => {
            profileState = await window.api.post("/candidate/profile/educations", payload);
            render();
            showStatusToast("Đã thêm học vấn");
          },
        });
      }
    });
  });

  // 3-dots menus toggle
  rootEl.querySelectorAll(".profile-dots-trigger").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const menuId = trigger.dataset.menuId;
      const dropdown = document.getElementById(`menu-${menuId}`);
      const wasOpen = dropdown?.classList.contains("is-open");

      // Đóng tất cả dropdown đang mở
      document.querySelectorAll(".profile-dots-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));

      if (!wasOpen && dropdown) {
        dropdown.classList.add("is-open");
      }
    });
  });

  // Đóng dropdown khi bấm ra ngoài
  document.addEventListener("click", () => {
    document.querySelectorAll(".profile-dots-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
  });

  // Thao tác sửa / xóa kinh nghiệm & học vấn
  rootEl.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = Number(btn.dataset.id);

      if (action === "edit-exp") {
        const exp = profileState.experiences?.find((item) => item.id === id);
        if (exp) {
          openExperienceDrawer({
            item: exp,
            onSave: async (payload) => {
              profileState = await window.api.put(`/candidate/profile/experiences/${id}`, payload);
              render();
              showStatusToast("Đã cập nhật kinh nghiệm");
            },
          });
        }
      } else if (action === "delete-exp") {
        const exp = profileState.experiences?.find((item) => item.id === id);
        if (exp) {
          openConfirmModal({
            title: "Xóa kinh nghiệm",
            description: `Bạn có chắc chắn muốn xóa mục kinh nghiệm "${exp.title} tại ${exp.company}"?`,
            confirmLabel: "Xóa",
            cancelLabel: "Hủy",
            danger: true,
            onConfirm: async () => {
              profileState = await window.api.delete(`/candidate/profile/experiences/${id}`);
              render();
              showStatusToast("Đã xóa kinh nghiệm");
            },
          });
        }
      } else if (action === "edit-edu") {
        const edu = profileState.educations?.find((item) => item.id === id);
        if (edu) {
          openEducationDrawer({
            item: edu,
            onSave: async (payload) => {
              profileState = await window.api.put(`/candidate/profile/educations/${id}`, payload);
              render();
              showStatusToast("Đã cập nhật học vấn");
            },
          });
        }
      } else if (action === "delete-edu") {
        const edu = profileState.educations?.find((item) => item.id === id);
        if (edu) {
          openConfirmModal({
            title: "Xóa học vấn",
            description: `Bạn có chắc chắn muốn xóa mục học vấn tại "${edu.school}"?`,
            confirmLabel: "Xóa",
            cancelLabel: "Hủy",
            danger: true,
            onConfirm: async () => {
              profileState = await window.api.delete(`/candidate/profile/educations/${id}`);
              render();
              showStatusToast("Đã xóa học vấn");
            },
          });
        }
      }
    });
  });

  rootEl.querySelectorAll("[data-add-field]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.addField;
      editManager.openSection("basic", field);
    });
  });

  // Avatar Upload & Crop
  let avatarFileInput = document.getElementById("avatar-file-input");
  if (!avatarFileInput) {
    avatarFileInput = document.createElement("input");
    avatarFileInput.type = "file";
    avatarFileInput.id = "avatar-file-input";
    avatarFileInput.accept = "image/png,image/jpeg,image/webp";
    avatarFileInput.style.display = "none";
    document.body.appendChild(avatarFileInput);
  }

  const avatarBtn = document.getElementById("avatar-upload-trigger");
  if (avatarBtn) {
    avatarBtn.addEventListener("click", () => {
      avatarFileInput.click();
    });
  }

  avatarFileInput.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showStatusToast("Dung lượng ảnh tối đa 5MB", "error");
      avatarFileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      openAvatarCropModal({
        imageSrc: reader.result,
        hasAvatar: Boolean(profileState.avatar_url),
        onUpload: async (blob) => {
          const formData = new FormData();
          formData.append("file", blob, "avatar.webp");
          try {
            const updated = await window.api.post("/candidate/profile/avatar", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            profileState = updated;
            render();
            showStatusToast("Cập nhật ảnh đại diện thành công");
          } catch (err) {
            showStatusToast(err.message || "Không thể tải lên ảnh đại diện", "error");
            throw err;
          }
        },
        onDelete: async () => {
          openConfirmModal({
            title: "Xóa ảnh đại diện",
            description: "Bạn có chắc chắn muốn xóa ảnh đại diện hiện tại?",
            confirmLabel: "Xóa ảnh",
            cancelLabel: "Hủy",
            danger: true,
            onConfirm: async () => {
              const updated = await window.api.delete("/candidate/profile/avatar");
              profileState = updated;
              render();
              showStatusToast("Đã xóa ảnh đại diện");
            },
          });
        },
      });
      avatarFileInput.value = "";
    };
    reader.readAsDataURL(file);
  };

  const publicBtn = document.getElementById("btn-public-switch");
  if (publicBtn) {
    publicBtn.addEventListener("click", async () => {
      const nextVal = publicBtn.getAttribute("aria-checked") !== "true";
      publicBtn.disabled = true;
      try {
        const updated = await window.api.patch("/candidate/profile", { is_public: nextVal });
        profileState.is_public = updated.is_public;
        publicBtn.setAttribute("aria-checked", profileState.is_public ? "true" : "false");
        showStatusToast(nextVal ? "Đã bật công khai hồ sơ" : "Đã tắt công khai hồ sơ");
      } catch (err) {
        showStatusToast(err.message || "Không thể cập nhật trạng thái", "error");
      } finally {
        publicBtn.disabled = false;
      }
    });
  }

  const copyBtn = document.getElementById("btn-copy-public-link");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const pubId = profileState?.public_id;
      if (!pubId) return;
      const url = `${window.location.origin}/pages/employer/candidate.html?id=${encodeURIComponent(pubId)}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          showStatusToast("Đã sao chép liên kết hồ sơ công khai");
        }).catch(() => {
          prompt("Sao chép liên kết:", url);
        });
      } else {
        prompt("Sao chép liên kết:", url);
      }
    });
  }
}

async function loadProfile() {
  if (!rootEl) return;
  rootEl.innerHTML = renderProfileSkeleton();
  try {
    const [profile, views] = await Promise.all([
      window.api.get("/candidate/profile"),
      window.api.get("/candidate/profile/views-summary").catch(() => ({ views_30d: 0 })),
    ]);
    profileState = { ...profile, views_30d: views?.views_30d || 0 };
    render();
  } catch (err) {
    rootEl.innerHTML = renderProfileError(err.message || "Không thể kết nối máy chủ.");
    const retryBtn = document.getElementById("btn-retry-profile");
    if (retryBtn) retryBtn.addEventListener("click", loadProfile);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});
