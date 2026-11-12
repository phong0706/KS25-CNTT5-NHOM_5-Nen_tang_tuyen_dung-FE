/**
 * Binding sự kiện input & payload builder cho Form đăng tin 4 bước.
 */
import { bindMoneyInput } from "./moneyInput.js";
import { createSkillTagInput } from "./tagInput.js";
import { renderBenefitRows } from "./jobFormHelpers.js";

export function getFocusMap() {
  return {
    title: document.getElementById("ejf-title-input"),
    level: document.querySelector("#ejf-level-select .custom-select-trigger"),
    work_type: document.querySelector("#ejf-worktype-select .custom-select-trigger"),
    location: document.querySelector("#ejf-location-select .custom-select-trigger"),
    quantity: document.getElementById("ejf-quantity-input"),
    deadline: document.getElementById("ejf-deadline-input"),
    description: document.getElementById("ejf-desc-input"),
    requirements: document.getElementById("ejf-req-input"),
    skills: document.getElementById("ejf-skill-input"),
    salary_min: document.getElementById("ejf-salary-min"),
    salary_max: document.getElementById("ejf-salary-max"),
  };
}

export function buildJobPayload(draft, status) {
  return {
    title: draft.title.trim() || "Tin tuyển dụng nháp",
    level: draft.level || null,
    work_type: draft.work_type || null,
    location: draft.location || null,
    quantity: Number(draft.quantity) || 1,
    deadline: draft.deadline || null,
    description: draft.description || null,
    requirements: draft.requirements || null,
    skills: draft.skills || [],
    salary_min: draft.is_salary_negotiable ? null : draft.salary_min,
    salary_max: draft.is_salary_negotiable ? null : draft.salary_max,
    is_salary_negotiable: Boolean(draft.is_salary_negotiable),
    benefits: (draft.benefits || []).map((b) => b.trim()).filter(Boolean),
    status,
  };
}

export function formatServerHHMM(isoStr) {
  const d = isoStr ? new Date(isoStr) : new Date();
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function bindJobFormInputs(draft, onDirty) {
  const titleEl = document.getElementById("ejf-title-input");
  const qtyEl = document.getElementById("ejf-quantity-input");
  const deadlineEl = document.getElementById("ejf-deadline-input");
  const descEl = document.getElementById("ejf-desc-input");
  const reqEl = document.getElementById("ejf-req-input");
  const negEl = document.getElementById("ejf-negotiable-toggle");
  const salaryWrap = document.getElementById("ejf-salary-fields");

  deadlineEl.min = new Date().toISOString().slice(0, 10);
  titleEl.value = draft.title;
  qtyEl.value = draft.quantity;
  deadlineEl.value = draft.deadline || "";
  descEl.value = draft.description || "";
  reqEl.value = draft.requirements || "";
  negEl.checked = Boolean(draft.is_salary_negotiable);
  salaryWrap.hidden = negEl.checked;

  titleEl.addEventListener("input", () => { draft.title = titleEl.value; onDirty(); });
  qtyEl.addEventListener("input", () => { draft.quantity = Number(qtyEl.value) || 1; onDirty(); });
  deadlineEl.addEventListener("change", () => { draft.deadline = deadlineEl.value; onDirty(); });
  descEl.addEventListener("input", () => { draft.description = descEl.value; onDirty(); });
  reqEl.addEventListener("input", () => { draft.requirements = reqEl.value; onDirty(); });
  negEl.addEventListener("change", () => {
    draft.is_salary_negotiable = negEl.checked;
    salaryWrap.hidden = negEl.checked;
    onDirty();
  });

  const moneyMin = bindMoneyInput(document.getElementById("ejf-salary-min"), (v) => { draft.salary_min = v; onDirty(); });
  const moneyMax = bindMoneyInput(document.getElementById("ejf-salary-max"), (v) => { draft.salary_max = v; onDirty(); });
  moneyMin?.setValue(draft.salary_min);
  moneyMax?.setValue(draft.salary_max);

  const benefitsHost = document.getElementById("ejf-benefits-list");
  const syncBenefits = (next) => { draft.benefits = next; onDirty(); };
  renderBenefitRows(benefitsHost, draft.benefits, syncBenefits);
  document.getElementById("ejf-add-benefit-btn").addEventListener("click", () => {
    draft.benefits = [...(draft.benefits || []), ""];
    renderBenefitRows(benefitsHost, draft.benefits, syncBenefits);
    onDirty();
  });

  createSkillTagInput({
    hostEl: document.getElementById("ejf-skills-host"),
    initialTags: draft.skills,
    fetchSuggestions: (q) => window.api.get("/meta/skills", { q }),
    onChange: (tags) => { draft.skills = tags; onDirty(); },
  });
}

