/**
 * Profile Edit Manager for Candidate Profile
 * Manages inline editing for Basic Info, Bio, and Skills sections.
 * Features:
 * - Single section open at a time
 * - Unsaved changes prompt via openConfirmModal
 * - Real-time validation with natural Vietnamese error messages
 * - Versioning check (OCC 409 Conflict handling)
 * - Safe Save button loading / double-click prevention
 */

import { showStatusToast } from "./toast.js";
import { openConfirmModal } from "./confirmModal.js";
import { renderBasicInfoForm, renderBioForm, renderSkillsForm } from "./profileEditForms.js";
import { createProfileSkillsTagInput } from "./profileSkillsInput.js";

const PHONE_REGEX = /^(0\d{9}|\+84\d{9,10})$/;
const GITHUB_REGEX = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_\-\.\/]+$/;
const LINKEDIN_REGEX = /^https:\/\/(www\.)?linkedin\.com\/.*$/;
const URL_REGEX = /^https:\/\/.*$/;

export function createProfileEditManager({ getState, setState, onUpdated, getLocations }) {
  let activeSection = null;
  let initialFormData = null;
  let currentSkills = [];

  // Helper check dirty
  function isDirty() {
    if (!activeSection) return false;
    if (activeSection === "basic") {
      const form = document.getElementById("form-edit-basic");
      if (!form) return false;
      const data = new FormData(form);
      const locVal = form.querySelector('[name="location"]')?.value || "";
      const current = {
        full_name: (data.get("full_name") || "").toString().trim(),
        headline: (data.get("headline") || "").toString().trim(),
        phone: (data.get("phone") || "").toString().trim(),
        location: locVal.trim(),
        github_url: (data.get("github_url") || "").toString().trim(),
        linkedin_url: (data.get("linkedin_url") || "").toString().trim(),
        portfolio_url: (data.get("portfolio_url") || "").toString().trim(),
      };
      return Object.keys(current).some((k) => (current[k] || "") !== (initialFormData[k] || ""));
    }
    if (activeSection === "bio") {
      const textarea = document.getElementById("bio-textarea");
      if (!textarea) return false;
      return textarea.value.trim() !== (initialFormData.bio || "").trim();
    }
    if (activeSection === "skills") {
      const init = (initialFormData.skills || []).map((s) => s.trim().toLowerCase());
      const cur = currentSkills.map((s) => s.trim().toLowerCase());
      if (init.length !== cur.length) return true;
      return cur.some((s, idx) => s !== init[idx]);
    }
    return false;
  }

  // Prompt if switching with unsaved changes
  async function canSwitch() {
    if (!isDirty()) return true;
    return new Promise((resolve) => {
      openConfirmModal({
        title: "Thay đổi chưa lưu",
        description: "Bạn có thay đổi chưa lưu trong phần này. Bạn có chắc muốn rời đi mà không lưu?",
        confirmLabel: "Bỏ thay đổi",
        cancelLabel: "Ở lại",
        danger: true,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }

  // Window beforeunload guard
  window.addEventListener("beforeunload", (e) => {
    if (isDirty()) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // Open inline edit
  async function openSection(sectionKey, focusField = null) {
    if (activeSection === sectionKey) return;
    const ok = await canSwitch();
    if (!ok) return;

    // Close any previous
    if (activeSection) {
      closeSection(activeSection, false);
    }

    const state = getState();
    activeSection = sectionKey;

    if (sectionKey === "basic") {
      await openBasicInfoEdit(state, focusField);
    } else if (sectionKey === "bio") {
      openBioEdit(state);
    } else if (sectionKey === "skills") {
      openSkillsEdit(state);
    }
  }

  function closeSection(sectionKey, checkDirtyPrompt = true) {
    const doClose = () => {
      activeSection = null;
      initialFormData = null;
      onUpdated({ refreshOnly: true });
    };

    if (checkDirtyPrompt && isDirty()) {
      openConfirmModal({
        title: "Thay đổi chưa lưu",
        description: "Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy chỉnh sửa?",
        confirmLabel: "Bỏ thay đổi",
        cancelLabel: "Ở lại",
        danger: true,
        onConfirm: doClose,
      });
    } else {
      doClose();
    }
  }

  /* ==========================================================
     BASIC INFO EDIT
     ========================================================== */
  async function openBasicInfoEdit(state, focusField) {
    const card = document.getElementById("section-basic-info");
    if (!card) return;

    const actionBtn = card.querySelector('[data-section-action="basic"]');
    if (actionBtn) actionBtn.style.display = "none";

    const bodyEl = card.querySelector(".info-preview-grid");
    if (!bodyEl) return;

    initialFormData = {
      full_name: (state.full_name || "").trim(),
      headline: (state.headline || "").trim(),
      phone: (state.phone || "").trim(),
      location: (state.location || "").trim(),
      github_url: (state.github_url || "").trim(),
      linkedin_url: (state.linkedin_url || "").trim(),
      portfolio_url: (state.portfolio_url || "").trim(),
    };

    const locations = await getLocations();
    bodyEl.outerHTML = `<div id="basic-info-form-wrapper">${renderBasicInfoForm(state, locations)}</div>`;

    // Khởi tạo CustomSelect cho địa điểm
    const locHost = document.getElementById("basic-location-host");
    if (locHost && window.CustomSelect) {
      const locOptions = [
        { value: "", label: "-- Chọn địa điểm --" },
        ...locations.map((loc) => ({ value: loc.name, label: loc.name })),
      ];
      new window.CustomSelect(locHost, {
        id: "basic-location",
        name: "location",
        placeholder: "-- Chọn địa điểm --",
        options: locOptions,
        value: state.location || "",
      });
    }

    const form = document.getElementById("form-edit-basic");
    const saveBtn = document.getElementById("btn-save-basic");
    const cancelBtn = form.querySelector('[data-cancel-action="basic"]');

    cancelBtn?.addEventListener("click", () => closeSection("basic"));

    // Realtime validation
    const setErr = (id, msg) => {
      const el = document.getElementById(`err-${id}`);
      if (el) el.textContent = msg || "";
    };

    const validateField = (name, val) => {
      const clean = (val || "").trim();
      if (name === "full_name") {
        if (!clean) return "Họ và tên không được để trống";
        if (clean.length < 2) return "Họ và tên tối thiểu 2 ký tự";
        return "";
      }
      if (name === "phone" && clean) {
        if (!PHONE_REGEX.test(clean)) return "Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)";
        return "";
      }
      if (name === "github_url" && clean) {
        if (!GITHUB_REGEX.test(clean)) return "Đường dẫn GitHub phải bắt đầu bằng https:// và thuộc tên miền github.com";
        return "";
      }
      if (name === "linkedin_url" && clean) {
        if (!LINKEDIN_REGEX.test(clean)) return "Đường dẫn LinkedIn phải bắt đầu bằng https:// và thuộc tên miền linkedin.com";
        return "";
      }
      if (name === "portfolio_url" && clean) {
        if (!URL_REGEX.test(clean)) return "Đường dẫn Portfolio phải bắt đầu bằng https://";
        return "";
      }
      return "";
    };

    form.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("input", () => {
        const err = validateField(inp.name, inp.value);
        setErr(inp.name, err);
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get("full_name") || "").toString().trim();
      const headline = (fd.get("headline") || "").toString().trim();
      const phone = (fd.get("phone") || "").toString().trim();
      const location = (form.querySelector('[name="location"]')?.value || "").toString().trim();
      const github_url = (fd.get("github_url") || "").toString().trim();
      const linkedin_url = (fd.get("linkedin_url") || "").toString().trim();
      const portfolio_url = (fd.get("portfolio_url") || "").toString().trim();

      const errors = {
        full_name: validateField("full_name", name),
        phone: validateField("phone", phone),
        github_url: validateField("github_url", github_url),
        linkedin_url: validateField("linkedin_url", linkedin_url),
        portfolio_url: validateField("portfolio_url", portfolio_url),
      };

      let hasError = false;
      let firstInvalid = null;
      Object.entries(errors).forEach(([k, err]) => {
        setErr(k, err);
        if (err) {
          hasError = true;
          if (!firstInvalid) firstInvalid = form.querySelector(`[name="${k}"]`);
        }
      });

      if (hasError) {
        firstInvalid?.focus();
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Đang lưu...";

      try {
        const payload = {
          full_name: name,
          headline: headline || null,
          phone: phone || null,
          location: location || null,
          github_url: github_url || null,
          linkedin_url: linkedin_url || null,
          portfolio_url: portfolio_url || null,
          version: getState().version,
        };

        const updated = await window.api.patch("/candidate/profile", payload);
        setState(updated);
        activeSection = null;
        initialFormData = null;
        showStatusToast("Đã lưu");
        onUpdated({ full_name: updated.full_name, headline: updated.headline });
      } catch (err) {
        if (err.status === 409 || err.response?.status === 409) {
          showStatusToast("Dữ liệu đã được cập nhật ở nơi khác. Vui lòng tải lại trang.", "error");
        } else {
          showStatusToast(err.message || "Không thể lưu thông tin", "error");
        }
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Lưu";
      }
    });

    if (focusField) {
      const targetInp = form.querySelector(`[name="${focusField}"]`);
      targetInp?.focus();
    } else {
      form.querySelector("#basic-full-name")?.focus();
    }
  }

  /* ==========================================================
     BIO EDIT
     ========================================================== */
  function openBioEdit(state) {
    const card = document.getElementById("section-bio");
    if (!card) return;

    const actionBtn = card.querySelector('[data-section-action="bio"]');
    if (actionBtn) actionBtn.style.display = "none";

    const bodyEl = card.querySelector(".info-preview-value");
    if (!bodyEl) return;

    initialFormData = { bio: (state.bio || "").trim() };
    bodyEl.outerHTML = `<div id="bio-form-wrapper">${renderBioForm(state)}</div>`;

    const form = document.getElementById("form-edit-bio");
    const saveBtn = document.getElementById("btn-save-bio");
    const textarea = document.getElementById("bio-textarea");
    const charCount = document.getElementById("bio-char-count");
    const cancelBtn = form.querySelector('[data-cancel-action="bio"]');

    cancelBtn?.addEventListener("click", () => closeSection("bio"));

    textarea?.addEventListener("input", () => {
      const len = textarea.value.length;
      if (charCount) charCount.textContent = `${len}/500`;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const val = textarea.value.trim();
      if (val.length > 500) {
        document.getElementById("err-bio").textContent = "Giới thiệu tối đa 500 ký tự";
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Đang lưu...";

      try {
        const payload = {
          bio: val || null,
          version: getState().version,
        };
        const updated = await window.api.patch("/candidate/profile", payload);
        setState(updated);
        activeSection = null;
        initialFormData = null;
        showStatusToast("Đã lưu");
        onUpdated({});
      } catch (err) {
        if (err.status === 409 || err.response?.status === 409) {
          showStatusToast("Dữ liệu đã được cập nhật ở nơi khác. Vui lòng tải lại trang.", "error");
        } else {
          showStatusToast(err.message || "Không thể lưu giới thiệu", "error");
        }
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Lưu";
      }
    });

    textarea?.focus();
  }

  /* ==========================================================
     SKILLS EDIT
     ========================================================== */
  function openSkillsEdit(state) {
    const card = document.getElementById("section-skills");
    if (!card) return;

    const actionBtn = card.querySelector('[data-section-action="skills"]');
    if (actionBtn) actionBtn.style.display = "none";

    const bodyEl = card.querySelector(".skills-preview-list, .empty-section-box");
    if (!bodyEl) return;

    initialFormData = { skills: [...(state.skills || [])] };
    currentSkills = [...(state.skills || [])];

    bodyEl.outerHTML = `<div id="skills-form-wrapper">${renderSkillsForm(state)}</div>`;

    const hostEl = document.getElementById("skills-tag-input-host");
    if (hostEl) {
      createProfileSkillsTagInput({
        hostEl,
        initialTags: currentSkills,
        maxTags: 30,
        onChange: (tags) => {
          currentSkills = tags;
        },
      });
    }

    const form = document.getElementById("form-edit-skills");
    const saveBtn = document.getElementById("btn-save-skills");
    const cancelBtn = form.querySelector('[data-cancel-action="skills"]');

    cancelBtn?.addEventListener("click", () => closeSection("skills"));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      saveBtn.disabled = true;
      saveBtn.textContent = "Đang lưu...";

      try {
        const payload = {
          skills: currentSkills,
          version: getState().version,
        };
        const updated = await window.api.put("/candidate/profile/skills", payload);
        setState(updated);
        activeSection = null;
        initialFormData = null;
        showStatusToast("Đã lưu");
        onUpdated({});
      } catch (err) {
        if (err.status === 409 || err.response?.status === 409) {
          showStatusToast("Dữ liệu đã được cập nhật ở nơi khác. Vui lòng tải lại trang.", "error");
        } else {
          showStatusToast(err.message || "Không thể lưu kỹ năng", "error");
        }
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Lưu";
      }
    });
  }

  return {
    openSection,
    closeSection,
    isDirty,
  };
}
