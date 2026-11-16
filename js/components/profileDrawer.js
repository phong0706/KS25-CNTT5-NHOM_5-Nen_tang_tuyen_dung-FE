/**
 * Side Drawer Component cho Kinh nghiệm & Học vấn (/pages/candidate/profile.html)
 * Trượt từ phải trên desktop (480px), full-screen sheet trên mobile (<640px).
 * Tuân thủ techrecruit-rules: cấm modal lơ lửng cho form dài, không confirm/alert, CustomSelect.
 */

import { openConfirmModal } from "./confirmModal.js";
import { showStatusToast } from "./toast.js";

function esc(val) {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const DEGREE_OPTIONS = [
  { value: "Cử nhân", label: "Cử nhân" },
  { value: "Kỹ sư", label: "Kỹ sư" },
  { value: "Thạc sĩ", label: "Thạc sĩ" },
  { value: "Tiến sĩ", label: "Tiến sĩ" },
  { value: "Cao đẳng", label: "Cao đẳng" },
  { value: "Chứng chỉ", label: "Chứng chỉ" },
  { value: "Khác", label: "Khác" },
];

export function openExperienceDrawer({ item = null, onSave }) {
  const isEdit = Boolean(item && item.id);
  const titleText = isEdit ? "Chỉnh sửa kinh nghiệm" : "Thêm kinh nghiệm làm việc";

  const backdrop = document.createElement("div");
  backdrop.className = "profile-drawer-backdrop";

  backdrop.innerHTML = `
    <div class="profile-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div class="profile-drawer-header">
        <h3 class="profile-drawer-title" id="drawer-title">${titleText}</h3>
        <button type="button" class="profile-drawer-close" aria-label="Đóng">&times;</button>
      </div>
      <form id="drawer-form-experience" novalidate style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
        <div class="profile-drawer-body">
          <div class="form-group">
            <label for="exp-title" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Chức danh / Vị trí <span style="color:#dc2626;">*</span></label>
            <input type="text" id="exp-title" name="title" class="form-input" value="${esc(item?.title || "")}" placeholder="Vd: Senior Backend Engineer" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
            <div class="field-error-msg" id="err-exp-title" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
          </div>

          <div class="form-group">
            <label for="exp-company" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Công ty <span style="color:#dc2626;">*</span></label>
            <input type="text" id="exp-company" name="company" class="form-input" value="${esc(item?.company || "")}" placeholder="Vd: Rikkei Digital" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
            <div class="field-error-msg" id="err-exp-company" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
          </div>

          <div class="form-group" style="display:flex;align-items:center;gap:8px;margin-top:-4px;">
            <input type="checkbox" id="exp-is-current" name="is_current" ${item?.is_current ? "checked" : ""} style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer;">
            <label for="exp-is-current" style="font-size:13.5px;color:var(--text);cursor:pointer;font-weight:500;">Tôi đang làm việc tại đây</label>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label for="exp-start-month" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Tháng bắt đầu <span style="color:#dc2626;">*</span></label>
              <input type="month" id="exp-start-month" name="start_month" class="form-input" value="${esc(item?.start_month || "")}" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
              <div class="field-error-msg" id="err-exp-start_month" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
            </div>

            <div class="form-group" id="wrap-exp-end-month" style="${item?.is_current ? "opacity:0.4;pointer-events:none;" : ""}">
              <label for="exp-end-month" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Tháng kết thúc <span style="color:#dc2626;">*</span></label>
              <input type="month" id="exp-end-month" name="end_month" class="form-input" value="${esc(item?.end_month || "")}" ${item?.is_current ? "disabled" : ""} style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
              <div class="field-error-msg" id="err-exp-end_month" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
            </div>
          </div>

          <div class="form-group">
            <label for="exp-desc" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Mô tả công việc & Thành tựu nổi bật</label>
            <textarea id="exp-desc" name="description" class="form-textarea" placeholder="Nêu trách nhiệm chính, các công nghệ sử dụng và kết quả đạt được..." style="width:100%;height:120px;resize:none;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;line-height:1.6;">${esc(item?.description || "")}</textarea>
            <div class="field-error-msg" id="err-exp-description" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
          </div>
        </div>

        <div class="profile-drawer-footer">
          <button type="button" class="btn-cancel-drawer section-action-btn" style="padding:9px 20px;">Hủy</button>
          <button type="submit" id="btn-save-drawer-exp" class="btn-save-drawer" style="background:var(--primary);color:#fff;border:none;padding:9px 24px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit;">Lưu</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add("is-open"));

  const form = backdrop.querySelector("#drawer-form-experience");
  const closeBtn = backdrop.querySelector(".profile-drawer-close");
  const cancelBtn = backdrop.querySelector(".btn-cancel-drawer");
  const saveBtn = backdrop.querySelector("#btn-save-drawer-exp");
  const isCurrentCb = backdrop.querySelector("#exp-is-current");
  const endMonthWrap = backdrop.querySelector("#wrap-exp-end-month");
  const endMonthInp = backdrop.querySelector("#exp-end-month");

  isCurrentCb.addEventListener("change", () => {
    if (isCurrentCb.checked) {
      endMonthWrap.style.opacity = "0.4";
      endMonthWrap.style.pointerEvents = "none";
      endMonthInp.disabled = true;
      endMonthInp.value = "";
      document.getElementById("err-exp-end_month").textContent = "";
    } else {
      endMonthWrap.style.opacity = "1";
      endMonthWrap.style.pointerEvents = "auto";
      endMonthInp.disabled = false;
    }
  });

  const getFormData = () => {
    const fd = new FormData(form);
    return {
      title: (fd.get("title") || "").toString().trim(),
      company: (fd.get("company") || "").toString().trim(),
      is_current: isCurrentCb.checked,
      start_month: (fd.get("start_month") || "").toString().trim(),
      end_month: isCurrentCb.checked ? null : (fd.get("end_month") || "").toString().trim(),
      description: (fd.get("description") || "").toString().trim(),
    };
  };

  const initialValues = getFormData();

  const isDirty = () => {
    const cur = getFormData();
    return Object.keys(cur).some((k) => (cur[k] || "") !== (initialValues[k] || ""));
  };

  const close = (force = false) => {
    const doClose = () => {
      backdrop.classList.remove("is-open");
      setTimeout(() => backdrop.remove(), 260);
    };

    if (!force && isDirty()) {
      openConfirmModal({
        title: "Thay đổi chưa lưu",
        description: "Bạn có thay đổi chưa lưu trong biểu mẫu. Bạn có chắc muốn đóng?",
        confirmLabel: "Bỏ thay đổi",
        cancelLabel: "Ở lại",
        danger: true,
        onConfirm: doClose,
      });
    } else {
      doClose();
    }
  };

  closeBtn.addEventListener("click", () => close());
  cancelBtn.addEventListener("click", () => close());
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  // Validation
  const setErr = (id, msg) => {
    const el = document.getElementById(`err-exp-${id}`);
    if (el) el.textContent = msg || "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = getFormData();

    let hasError = false;
    if (!data.title) {
      setErr("title", "Chức danh không được để trống");
      hasError = true;
    } else setErr("title", "");

    if (!data.company) {
      setErr("company", "Tên công ty không được để trống");
      hasError = true;
    } else setErr("company", "");

    if (!data.start_month) {
      setErr("start_month", "Vui lòng chọn tháng bắt đầu");
      hasError = true;
    } else {
      const now = new Date();
      const [sy, sm] = data.start_month.split("-").map(Number);
      if (sy > now.getFullYear() || (sy === now.getFullYear() && sm > (now.getMonth() + 1))) {
        setErr("start_month", "Thời gian bắt đầu không được ở tương lai");
        hasError = true;
      } else {
        setErr("start_month", "");
      }
    }

    if (!data.is_current) {
      if (!data.end_month) {
        setErr("end_month", "Vui lòng chọn tháng kết thúc hoặc chọn 'Tôi đang làm việc tại đây'");
        hasError = true;
      } else if (data.start_month && data.end_month < data.start_month) {
        setErr("end_month", "Thời gian kết thúc không được trước thời gian bắt đầu");
        hasError = true;
      } else {
        setErr("end_month", "");
      }
    } else {
      setErr("end_month", "");
    }

    if (hasError) return;

    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu...";

    try {
      await onSave(data);
      close(true);
    } catch (err) {
      showStatusToast(err.message || "Không thể lưu kinh nghiệm", "error");
      saveBtn.disabled = false;
      saveBtn.textContent = "Lưu";
    }
  });

  form.querySelector("#exp-title")?.focus();
}

export function openEducationDrawer({ item = null, onSave }) {
  const isEdit = Boolean(item && item.id);
  const titleText = isEdit ? "Chỉnh sửa học vấn" : "Thêm thông tin học vấn";

  const backdrop = document.createElement("div");
  backdrop.className = "profile-drawer-backdrop";

  backdrop.innerHTML = `
    <div class="profile-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div class="profile-drawer-header">
        <h3 class="profile-drawer-title" id="drawer-title">${titleText}</h3>
        <button type="button" class="profile-drawer-close" aria-label="Đóng">&times;</button>
      </div>
      <form id="drawer-form-education" novalidate style="display:flex;flex-direction:column;flex:1;overflow:hidden;">
        <div class="profile-drawer-body">
          <div class="form-group">
            <label for="edu-school" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Trường học / Cơ sở đào tạo <span style="color:#dc2626;">*</span></label>
            <input type="text" id="edu-school" name="school" class="form-input" value="${esc(item?.school || "")}" placeholder="Vd: Đại học Bách Khoa Hà Nội" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
            <div class="field-error-msg" id="err-edu-school" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
          </div>

          <div class="form-group">
            <label for="edu-major" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Chuyên ngành đào tạo <span style="color:#dc2626;">*</span></label>
            <input type="text" id="edu-major" name="major" class="form-input" value="${esc(item?.major || "")}" placeholder="Vd: Công nghệ Thông tin" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
            <div class="field-error-msg" id="err-edu-major" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
          </div>

          <div class="form-group">
            <label for="edu-degree" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Bằng cấp <span style="color:#dc2626;">*</span></label>
            <div id="edu-degree-host"></div>
            <div class="field-error-msg" id="err-edu-degree" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label for="edu-start-year" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Năm bắt đầu <span style="color:#dc2626;">*</span></label>
              <input type="number" id="edu-start-year" name="start_year" class="form-input" value="${esc(item?.start_year || "")}" placeholder="YYYY" min="1970" max="2035" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
              <div class="field-error-msg" id="err-edu-start_year" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
            </div>

            <div class="form-group">
              <label for="edu-end-year" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Năm tốt nghiệp (hoặc dự kiến)</label>
              <input type="number" id="edu-end-year" name="end_year" class="form-input" value="${esc(item?.end_year || "")}" placeholder="YYYY" min="1970" max="2040" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
              <div class="field-error-msg" id="err-edu-end_year" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
            </div>
          </div>
        </div>

        <div class="profile-drawer-footer">
          <button type="button" class="btn-cancel-drawer section-action-btn" style="padding:9px 20px;">Hủy</button>
          <button type="submit" id="btn-save-drawer-edu" class="btn-save-drawer" style="background:var(--primary);color:#fff;border:none;padding:9px 24px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit;">Lưu</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add("is-open"));

  const form = backdrop.querySelector("#drawer-form-education");
  const closeBtn = backdrop.querySelector(".profile-drawer-close");
  const cancelBtn = backdrop.querySelector(".btn-cancel-drawer");
  const saveBtn = backdrop.querySelector("#btn-save-drawer-edu");
  const degreeHost = backdrop.querySelector("#edu-degree-host");

  if (degreeHost && window.CustomSelect) {
    new window.CustomSelect(degreeHost, {
      id: "edu-degree",
      name: "degree",
      placeholder: "-- Chọn bằng cấp --",
      options: DEGREE_OPTIONS,
      value: item?.degree || "Cử nhân",
    });
  }

  const getFormData = () => {
    const fd = new FormData(form);
    const deg = form.querySelector('[name="degree"]')?.value || "";
    return {
      school: (fd.get("school") || "").toString().trim(),
      major: (fd.get("major") || "").toString().trim(),
      degree: deg.trim(),
      start_year: parseInt(fd.get("start_year"), 10),
      end_year: fd.get("end_year") ? parseInt(fd.get("end_year"), 10) : null,
    };
  };

  const initialValues = getFormData();

  const isDirty = () => {
    const cur = getFormData();
    return Object.keys(cur).some((k) => String(cur[k] || "") !== String(initialValues[k] || ""));
  };

  const close = (force = false) => {
    const doClose = () => {
      backdrop.classList.remove("is-open");
      setTimeout(() => backdrop.remove(), 260);
    };

    if (!force && isDirty()) {
      openConfirmModal({
        title: "Thay đổi chưa lưu",
        description: "Bạn có thay đổi chưa lưu trong biểu mẫu. Bạn có chắc muốn đóng?",
        confirmLabel: "Bỏ thay đổi",
        cancelLabel: "Ở lại",
        danger: true,
        onConfirm: doClose,
      });
    } else {
      doClose();
    }
  };

  closeBtn.addEventListener("click", () => close());
  cancelBtn.addEventListener("click", () => close());
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  const setErr = (id, msg) => {
    const el = document.getElementById(`err-edu-${id}`);
    if (el) el.textContent = msg || "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = getFormData();

    let hasError = false;
    if (!data.school) {
      setErr("school", "Trường học không được để trống");
      hasError = true;
    } else setErr("school", "");

    if (!data.major) {
      setErr("major", "Chuyên ngành không được để trống");
      hasError = true;
    } else setErr("major", "");

    if (!data.degree) {
      setErr("degree", "Vui lòng chọn bằng cấp");
      hasError = true;
    } else setErr("degree", "");

    const nowYear = new Date().getFullYear();
    if (isNaN(data.start_year) || data.start_year < 1970 || data.start_year > (nowYear + 5)) {
      setErr("start_year", "Năm bắt đầu không hợp lệ (từ 1970)");
      hasError = true;
    } else {
      setErr("start_year", "");
    }

    if (data.end_year !== null && !isNaN(data.end_year)) {
      if (data.end_year < data.start_year) {
        setErr("end_year", "Năm tốt nghiệp không được trước năm bắt đầu");
        hasError = true;
      } else {
        setErr("end_year", "");
      }
    } else {
      setErr("end_year", "");
    }

    if (hasError) return;

    saveBtn.disabled = true;
    saveBtn.textContent = "Đang lưu...";

    try {
      await onSave(data);
      close(true);
    } catch (err) {
      showStatusToast(err.message || "Không thể lưu học vấn", "error");
      saveBtn.disabled = false;
      saveBtn.textContent = "Lưu";
    }
  });

  form.querySelector("#edu-school")?.focus();
}
