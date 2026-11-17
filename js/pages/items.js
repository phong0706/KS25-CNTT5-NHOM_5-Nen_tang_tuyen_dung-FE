// Quản lý & Đăng tin tuyển dụng (Admin / Employer)
const form = document.getElementById("job-form"), tableBody = document.getElementById("job-table-body");
const searchInput = document.getElementById("search-input"), formTitle = document.getElementById("form-title");
const cancelBtn = document.getElementById("btn-cancel"), skillsList = document.getElementById("skills-list");
const salaryMin = document.getElementById("job-salary-min"), salaryMax = document.getElementById("job-salary-max");
const salaryNeg = document.getElementById("job-salary-negotiable"), deadlineInput = document.getElementById("job-deadline");
let editingId = null, currentSkills = [], localJobs = [];
const todayStr = new Date().toISOString().split("T")[0];
if (deadlineInput) deadlineInput.min = todayStr;

function setFieldError(fieldId, errorMsg) {
  const errEl = document.getElementById(`error-${fieldId}`), inputEl = document.getElementById(`job-${fieldId}`);
  if (errEl) { errEl.textContent = errorMsg || ""; errEl.classList.toggle("visible", !!errorMsg); }
  if (inputEl) inputEl.classList.toggle("has-error", !!errorMsg);
}

function clearFieldErrors() {
  ["title", "location", "salary", "deadline", "skills"].forEach(f => setFieldError(f, ""));
}

function renderSkills() {
  skillsList.innerHTML = currentSkills.map(s => `
    <span class="skill-chip">${escapeHtml(s)}<button type="button" class="skill-chip-remove" data-skill="${escapeHtml(s)}" aria-label="Xóa ${escapeHtml(s)}">×</button></span>`).join("");
}

document.getElementById("job-skill-input")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    const clean = e.target.value.trim();
    if (clean && !currentSkills.includes(clean) && currentSkills.length < 15) {
      currentSkills.push(clean); renderSkills();
    }
    e.target.value = "";
  }
});

skillsList?.addEventListener("click", (e) => {
  const btn = e.target.closest(".skill-chip-remove");
  if (!btn) return;
  currentSkills = currentSkills.filter(s => s !== btn.dataset.skill); renderSkills();
});

salaryNeg?.addEventListener("change", () => {
  salaryMin.disabled = salaryMax.disabled = salaryNeg.checked;
  if (salaryNeg.checked) setFieldError("salary", "");
});

["job-description", "job-requirements"].forEach((id, idx) => {
  const el = document.getElementById(id), cId = idx === 0 ? "desc-char-count" : "req-char-count";
  el?.addEventListener("input", () => { document.getElementById(cId).textContent = el.value.length; });
});

function validateForm() {
  clearFieldErrors();
  let valid = true;
  if (!form.title.value.trim() || form.title.value.trim().length < 5) {
    setFieldError("title", "Vui lòng nhập vị trí tuyển dụng (tối thiểu 5 ký tự)."); valid = false;
  }
  if (!form.location.value.trim()) {
    setFieldError("location", "Vui lòng nhập địa điểm làm việc."); valid = false;
  }
  if (form.deadline.value && form.deadline.value < todayStr) {
    setFieldError("deadline", "Hạn nộp hồ sơ không được ở trong quá khứ."); valid = false;
  }
  if (!salaryNeg.checked && salaryMin.value && salaryMax.value) {
    if (Number(salaryMax.value) < Number(salaryMin.value)) {
      setFieldError("salary", "Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu."); valid = false;
    }
  }
  return valid;
}

function formatSalary(job) {
  if (job.is_salary_negotiable) return "Thỏa thuận";
  if (job.salary_min && job.salary_max) return `${formatMoney(job.salary_min)} - ${formatMoney(job.salary_max)}`;
  if (job.salary_min) return `Từ ${formatMoney(job.salary_min)}`;
  if (job.salary_max) return `Tới ${formatMoney(job.salary_max)}`;
  return "Thỏa thuận";
}

function renderJobs(jobs) {
  const q = searchInput.value.trim().toLowerCase();
  const list = jobs.filter(j => !q || (j.title && j.title.toLowerCase().includes(q)));
  document.getElementById("jobs-count-text").textContent = `Tổng cộng: ${list.length} tin tuyển dụng`;
  if (list.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px 16px;">
      <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Chưa có tin tuyển dụng nào</div>
      <div class="muted" style="font-size: 13.5px; margin-bottom: 14px;">Bắt đầu tạo tin để tiếp cận ứng viên tài năng.</div>
      <button type="button" class="btn btn-primary btn-small" onclick="document.getElementById('job-title').focus()">+ Đăng tin mới</button>
    </td></tr>`;
    return;
  }
  tableBody.innerHTML = list.map(job => `
    <tr>
      <td><strong>${escapeHtml(job.title)}</strong></td>
      <td><div>${escapeHtml(job.location || "Toàn quốc")}</div><div class="muted" style="font-size: 12px;">${escapeHtml(job.work_type || "Toàn thời gian")}</div></td>
      <td class="text-right">${formatSalary(job)}</td>
      <td><span class="job-status-badge ${job.status || 'draft'}">${job.status === 'published' ? 'Đang tuyển' : job.status === 'pending' ? 'Chờ duyệt' : 'Bản nháp'}</span></td>
      <td>${job.deadline ? (typeof formatDateTime === 'function' ? formatDateTime(job.deadline).split(' ')[0] : job.deadline) : 'Không thời hạn'}</td>
      <td class="text-right">
        <div class="job-table-actions">
          <button class="btn btn-small btn-outline" data-action="edit" data-id="${job.id}">Sửa</button>
          <button class="btn btn-small btn-danger" data-action="delete" data-id="${job.id}">Xóa</button>
        </div>
      </td>
    </tr>`).join("");
}

async function loadJobs() {
  tableBody.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center; padding: 24px;">Đang tải tin tuyển dụng...</td></tr>`;
  try {
    const isEmp = typeof auth !== "undefined" && auth.isLoggedIn() && (auth.getRole() === "employer" || auth.getRole() === "recruiter");
    const res = await api.get(isEmp ? "/employer/jobs" : "/jobs");
    localJobs = res.items || (Array.isArray(res) ? res : []);
  } catch {
    if (localJobs.length === 0) {
      localJobs = [
        { id: 1, title: "Senior Backend Engineer (Go/Node.js)", location: "Hà Nội", work_type: "Toàn thời gian", salary_min: 25000000, salary_max: 45000000, status: "published", deadline: "2026-12-31", skills: ["Go", "Node.js"] },
        { id: 2, title: "Frontend Lead (React/Next.js)", location: "Hồ Chí Minh", work_type: "Hybrid", salary_min: 30000000, salary_max: 55000000, status: "pending", deadline: "2026-11-30", skills: ["React", "TypeScript"] }
      ];
    }
  }
  renderJobs(localJobs);
}

async function submitJob(targetStatus) {
  if (!validateForm()) return;
  const payload = {
    title: form.title.value.trim(), work_type: form.work_type.value, location: form.location.value.trim(),
    salary_min: salaryNeg.checked || !salaryMin.value ? null : Number(salaryMin.value),
    salary_max: salaryNeg.checked || !salaryMax.value ? null : Number(salaryMax.value),
    is_salary_negotiable: salaryNeg.checked, deadline: form.deadline.value || null,
    skills: [...currentSkills], description: form.description.value.trim() || null,
    requirements: form.requirements.value.trim() || null, status: targetStatus,
  };
  try {
    if (typeof auth !== "undefined" && auth.isLoggedIn()) {
      if (editingId) {
        await api.put(`/employer/jobs/${editingId}`, payload).catch(() => {});
        const idx = localJobs.findIndex(j => j.id === editingId);
        if (idx !== -1) localJobs[idx] = { ...localJobs[idx], ...payload, id: editingId };
      } else {
        let created = null;
        try { created = await api.post("/employer/jobs", payload); } catch {}
        localJobs.unshift(created || { ...payload, id: Date.now() });
      }
    } else {
      if (editingId) {
        const idx = localJobs.findIndex(j => j.id === editingId);
        if (idx !== -1) localJobs[idx] = { ...localJobs[idx], ...payload, id: editingId };
      } else {
        localJobs.unshift({ ...payload, id: Date.now() });
      }
    }
    showToast(targetStatus === "draft" ? "Đã lưu bản nháp tin tuyển dụng!" : (editingId ? "Cập nhật tin thành công!" : "Đăng tin tuyển dụng thành công!"));
    resetForm(); renderJobs(localJobs);
  } catch (err) { showToast(err.message || "Lỗi thao tác", "error"); }
}

function resetForm() {
  editingId = null; form.reset(); currentSkills = []; renderSkills(); clearFieldErrors();
  formTitle.textContent = "Đăng tin tuyển dụng mới"; cancelBtn.hidden = true;
  document.getElementById("desc-char-count").textContent = "0";
  document.getElementById("req-char-count").textContent = "0";
}

function startEdit(id) {
  const job = localJobs.find(j => j.id === id);
  if (!job) return;
  editingId = id; form.title.value = job.title || ""; form.work_type.value = job.work_type || "Toàn thời gian";
  form.location.value = job.location || ""; salaryNeg.checked = !!job.is_salary_negotiable;
  salaryMin.value = job.salary_min || ""; salaryMax.value = job.salary_max || "";
  salaryMin.disabled = salaryMax.disabled = !!job.is_salary_negotiable;
  form.deadline.value = job.deadline ? job.deadline.split("T")[0] : "";
  currentSkills = Array.isArray(job.skills) ? [...job.skills] : [];
  renderSkills();
  form.description.value = job.description || ""; form.requirements.value = job.requirements || "";
  document.getElementById("desc-char-count").textContent = form.description.value.length;
  document.getElementById("req-char-count").textContent = form.requirements.value.length;
  formTitle.textContent = `Chỉnh sửa tin #${id}`; cancelBtn.hidden = false; form.title.focus();
}

form?.addEventListener("submit", (e) => { e.preventDefault(); submitJob("pending"); });
document.getElementById("btn-save-draft")?.addEventListener("click", () => submitJob("draft"));
cancelBtn?.addEventListener("click", resetForm);
document.getElementById("btn-new-job")?.addEventListener("click", () => { resetForm(); form.title.focus(); });
searchInput?.addEventListener("input", () => renderJobs(localJobs));
tableBody?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.action === "edit") startEdit(id);
  if (btn.dataset.action === "delete") {
    localJobs = localJobs.filter(j => j.id !== id);
    renderJobs(localJobs); showToast("Đã xóa tin tuyển dụng!");
  }
});

loadJobs();
