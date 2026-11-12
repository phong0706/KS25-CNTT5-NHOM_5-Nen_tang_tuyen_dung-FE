/**
 * Helpers cho Form đăng tin: cache danh mục meta 5 phút, validate từng bước và render tóm tắt.
 */

const META_TTL_MS = 5 * 60 * 1000;
const metaMemCache = new Map();

export async function fetchCachedMeta(endpoint) {
  const now = Date.now();
  const mem = metaMemCache.get(endpoint);
  if (mem && now - mem.ts < META_TTL_MS) return mem.data;

  const storageKey = `tr_meta_${endpoint}`;
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && now - parsed.ts < META_TTL_MS) {
        metaMemCache.set(endpoint, parsed);
        return parsed.data;
      }
    }
  } catch {
    // Bỏ qua lỗi sessionStorage
  }

  const data = await window.api.get(endpoint);
  const entry = { ts: now, data };
  metaMemCache.set(endpoint, entry);
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(entry));
  } catch {
    // Bỏ qua nếu đầy bộ nhớ
  }
  return data;
}

export function validateStepFields(step, draft) {
  const errors = {};
  const todayStr = new Date().toISOString().slice(0, 10);

  if (step === 1) {
    if (!draft.title || !draft.title.trim()) errors.title = "Vui lòng nhập tên vị trí tuyển dụng.";
    else if (draft.title.trim().length < 5) errors.title = "Tên vị trí cần tối thiểu 5 ký tự.";
    if (!draft.level) errors.level = "Vui lòng chọn cấp bậc.";
    if (!draft.work_type) errors.work_type = "Vui lòng chọn hình thức làm việc.";
    if (!draft.location) errors.location = "Vui lòng chọn địa điểm làm việc.";
    if (!draft.quantity || Number(draft.quantity) < 1) errors.quantity = "Số lượng tuyển phải lớn hơn hoặc bằng 1.";
    if (!draft.deadline) errors.deadline = "Vui lòng chọn hạn nộp hồ sơ.";
    else if (draft.deadline < todayStr) errors.deadline = "Hạn nộp hồ sơ không được ở trong quá khứ.";
  }

  if (step === 2) {
    if (!draft.description || draft.description.trim().length < 20) {
      errors.description = "Mô tả công việc cần tối thiểu 20 ký tự.";
    }
    if (!draft.requirements || draft.requirements.trim().length < 10) {
      errors.requirements = "Yêu cầu ứng viên cần tối thiểu 10 ký tự.";
    }
    if (!Array.isArray(draft.skills) || draft.skills.length === 0) {
      errors.skills = "Vui lòng chọn ít nhất 1 kỹ năng.";
    }
  }

  if (step === 3 && !draft.is_salary_negotiable) {
    if (!draft.salary_min || draft.salary_min <= 0) errors.salary_min = "Vui lòng nhập mức lương tối thiểu.";
    if (!draft.salary_max || draft.salary_max <= 0) errors.salary_max = "Vui lòng nhập mức lương tối đa.";
    if (draft.salary_min && draft.salary_max && draft.salary_max < draft.salary_min) {
      errors.salary_max = "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.";
    }
  }

  return errors;
}

export function applyFieldErrors(errors, fieldFocusMap, focusFirst = false) {
  const allKeys = ["title", "level", "work_type", "location", "quantity", "deadline", "description", "requirements", "skills", "salary_min", "salary_max"];
  allKeys.forEach((key) => {
    const errEl = document.getElementById(`err-${key}`);
    if (errEl) errEl.textContent = errors[key] || "";
    const focusEl = fieldFocusMap[key];
    if (focusEl && focusEl.classList) {
      focusEl.classList.toggle("is-invalid", Boolean(errors[key]));
    }
  });

  if (focusFirst) {
    const firstKey = allKeys.find((k) => errors[k]);
    const target = firstKey ? fieldFocusMap[firstKey] : null;
    if (target && typeof target.focus === "function") target.focus();
  }
  return Object.keys(errors).length === 0;
}

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function renderBenefitRows(container, benefits, onChange) {
  if (!container) return;
  const rows = benefits.length > 0 ? benefits : [""];
  container.innerHTML = rows
    .map(
      (b, idx) => `
    <div class="ejf-benefit-row">
      <input type="text" class="ejf-input" data-benefit-idx="${idx}" value="${escapeText(b)}" placeholder="Ví dụ: Thưởng tháng 13, bảo hiểm sức khỏe...">
      <button type="button" class="ejf-btn-icon" data-remove-benefit="${idx}" aria-label="Xóa quyền lợi ${idx + 1}">&times;</button>
    </div>
  `
    )
    .join("");

  container.querySelectorAll("input[data-benefit-idx]").forEach((inp) => {
    inp.addEventListener("input", () => {
      const next = Array.from(container.querySelectorAll("input[data-benefit-idx]")).map((i) => i.value);
      onChange(next);
    });
  });

  container.querySelectorAll("button[data-remove-benefit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.removeBenefit);
      const next = [...rows];
      next.splice(idx, 1);
      onChange(next);
      renderBenefitRows(container, next, onChange);
    });
  });
}

export function renderReviewSummary(container, draft) {
  if (!container) return;
  const salaryText = draft.is_salary_negotiable
    ? "Thỏa thuận"
    : `${(draft.salary_min || 0).toLocaleString("vi-VN")} – ${(draft.salary_max || 0).toLocaleString("vi-VN")} VNĐ`;

  const benefitsText = (draft.benefits || []).filter((b) => b.trim()).join(" · ") || "Chưa thêm quyền lợi";

  container.innerHTML = `
    <div class="ejf-review-item"><span>Vị trí &amp; Cấp bậc</span><strong>${escapeText(draft.title)} (${escapeText(draft.level)})</strong></div>
    <div class="ejf-review-item"><span>Địa điểm &amp; Hình thức</span><strong>${escapeText(draft.location)} · ${escapeText(draft.work_type)} · ${Number(draft.quantity)} người</strong></div>
    <div class="ejf-review-item"><span>Hạn nộp hồ sơ</span><strong>${escapeText(draft.deadline)}</strong></div>
    <div class="ejf-review-item"><span>Mức lương</span><strong>${escapeText(salaryText)}</strong></div>
    <div class="ejf-review-item"><span>Tech Stack</span><strong>${escapeText((draft.skills || []).join(", "))}</strong></div>
    <div class="ejf-review-item"><span>Quyền lợi</span><strong>${escapeText(benefitsText)}</strong></div>
  `;
}

