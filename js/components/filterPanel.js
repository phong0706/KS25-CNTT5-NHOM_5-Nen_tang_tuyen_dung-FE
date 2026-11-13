/**
 * Component Bảng bộ lọc trái (fieldset/legend, thu gọn được, Xem thêm >5 mục, faceted counts).
 */
import { createSkillTagInput } from "./tagInput.js";

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

const CHEVRON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

const FACET_GROUPS = [
  { key: "location", label: "Địa điểm" },
  { key: "category", label: "Ngành nghề" },
  { key: "level", label: "Cấp bậc" },
  { key: "type", label: "Hình thức làm việc" },
];

const SALARY_PRESETS = [
  { label: "Dưới 20 Tr", min: "", max: "20000000" },
  { label: "20 - 35 Tr", min: "20000000", max: "35000000" },
  { label: "35 - 50 Tr", min: "35000000", max: "50000000" },
  { label: "Trên 50 Tr", min: "50000000", max: "" },
];

export function createFilterPanel(hostEl, { initialState, onChange, onReset }) {
  const expandedGroups = new Set(["location", "category", "level", "type", "salary", "skills"]);
  const showAllGroups = new Set();
  let salaryTimer = null;
  let skillApi = null;
  let currentFacets = { location: [], category: [], level: [], type: [] };
  let currentState = { ...initialState };

  hostEl.innerHTML = `
    <div class="fp-header">
      <h2 class="fp-title">Bộ lọc tìm kiếm</h2>
      <button type="button" class="fp-reset-btn" id="fp-reset-all">Đặt lại</button>
    </div>
    ${FACET_GROUPS.map(
      (g) => `
      <fieldset class="fp-group" data-group="${g.key}">
        <legend class="fp-legend">
          <button type="button" class="fp-toggle" aria-expanded="true" aria-controls="fp-body-${g.key}">
            <span>${g.label}</span>${CHEVRON_SVG}
          </button>
        </legend>
        <div id="fp-body-${g.key}" class="fp-body">
          <div class="fp-check-list" data-facet-list="${g.key}"></div>
        </div>
      </fieldset>
    `
    ).join("")}
    <fieldset class="fp-group" data-group="salary">
      <legend class="fp-legend">
        <button type="button" class="fp-toggle" aria-expanded="true" aria-controls="fp-body-salary">
          <span>Mức lương (triệu VNĐ)</span>${CHEVRON_SVG}
        </button>
      </legend>
      <div id="fp-body-salary" class="fp-body">
        <div class="fp-salary-row">
          <input type="number" min="0" id="fp-sal-min" class="fp-salary-input" placeholder="Từ (Tr)" aria-label="Lương tối thiểu (triệu VNĐ)">
          <input type="number" min="0" id="fp-sal-max" class="fp-salary-input" placeholder="Đến (Tr)" aria-label="Lương tối đa (triệu VNĐ)">
        </div>
        <div class="fp-salary-presets" id="fp-sal-presets">
          ${SALARY_PRESETS.map(
            (p) => `<button type="button" class="fp-preset-btn" data-min="${p.min}" data-max="${p.max}">${p.label}</button>`
          ).join("")}
        </div>
      </div>
    </fieldset>
    <fieldset class="fp-group" data-group="skills">
      <legend class="fp-legend">
        <button type="button" class="fp-toggle" aria-expanded="true" aria-controls="fp-body-skills">
          <span>Kỹ năng</span>${CHEVRON_SVG}
        </button>
      </legend>
      <div id="fp-body-skills" class="fp-body">
        <div id="fp-skills-host" style="margin-top:6px;"></div>
      </div>
    </fieldset>
  `;

  hostEl.querySelector("#fp-reset-all")?.addEventListener("click", () => onReset?.());

  hostEl.querySelectorAll(".fp-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".fp-group")?.dataset.group;
      const body = document.getElementById(btn.getAttribute("aria-controls"));
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      if (body) body.hidden = isOpen;
      if (group) {
        if (isOpen) expandedGroups.delete(group);
        else expandedGroups.add(group);
      }
    });
  });

  const salMinEl = hostEl.querySelector("#fp-sal-min");
  const salMaxEl = hostEl.querySelector("#fp-sal-max");
  const emitSalary = () => {
    window.clearTimeout(salaryTimer);
    salaryTimer = window.setTimeout(() => {
      const minV = salMinEl.value.trim() ? String(Number(salMinEl.value) * 1000000) : "";
      const maxV = salMaxEl.value.trim() ? String(Number(salMaxEl.value) * 1000000) : "";
      onChange?.({ salary_min: minV, salary_max: maxV });
    }, 300);
  };
  salMinEl?.addEventListener("input", emitSalary);
  salMaxEl?.addEventListener("input", emitSalary);

  hostEl.querySelectorAll(".fp-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const min = btn.dataset.min || "";
      const max = btn.dataset.max || "";
      const same = currentState.salary_min === min && currentState.salary_max === max;
      onChange?.({ salary_min: same ? "" : min, salary_max: same ? "" : max });
    });
  });

  skillApi = createSkillTagInput({
    hostEl: hostEl.querySelector("#fp-skills-host"),
    initialTags: currentState.skills ? currentState.skills.split(",").filter(Boolean) : [],
    fetchSuggestions: (q) => window.api.get("/meta/skills", { q }),
    onChange: (tags) => onChange?.({ skills: tags.join(",") }),
  });

  const renderFacetGroup = (key) => {
    const listEl = hostEl.querySelector(`[data-facet-list="${key}"]`);
    if (!listEl) return;
    const items = currentFacets[key] || [];
    const selectedSet = new Set(String(currentState[key] || "").split(",").filter(Boolean));
    const showAll = showAllGroups.has(key);
    const visible = showAll ? items : items.slice(0, 5);

    listEl.innerHTML = visible
      .map((item) => {
        const checked = selectedSet.has(item.value);
        return `
          <label class="fp-check-item">
            <span class="fp-check-left">
              <input type="checkbox" data-facet-key="${key}" value="${escapeText(item.value)}" ${checked ? "checked" : ""}>
              <span class="fp-check-label" title="${escapeText(item.label)}">${escapeText(item.label)}</span>
            </span>
            <span class="fp-check-count">${Number(item.count)}</span>
          </label>
        `;
      })
      .join("");

    if (items.length > 5) {
      const moreBtn = document.createElement("button");
      moreBtn.type = "button";
      moreBtn.className = "fp-show-more";
      moreBtn.textContent = showAll ? "Thu gọn" : `Xem thêm (${items.length - 5})`;
      moreBtn.addEventListener("click", () => {
        if (showAll) showAllGroups.delete(key);
        else showAllGroups.add(key);
        renderFacetGroup(key);
      });
      listEl.appendChild(moreBtn);
    }

    listEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const nextSet = new Set(String(currentState[key] || "").split(",").filter(Boolean));
        if (cb.checked) nextSet.add(cb.value);
        else nextSet.delete(cb.value);
        onChange?.({ [key]: Array.from(nextSet).join(",") });
      });
    });
  };

  return {
    sync(nextState, nextFacets) {
      currentState = { ...nextState };
      if (nextFacets) currentFacets = nextFacets;
      FACET_GROUPS.forEach((g) => renderFacetGroup(g.key));

      if (salMinEl && document.activeElement !== salMinEl) salMinEl.value = currentState.salary_min ? String(Math.round(Number(currentState.salary_min) / 1000000)) : "";
      if (salMaxEl && document.activeElement !== salMaxEl) salMaxEl.value = currentState.salary_max ? String(Math.round(Number(currentState.salary_max) / 1000000)) : "";
      hostEl.querySelectorAll(".fp-preset-btn").forEach((btn) => {
        const active =
          (btn.dataset.min || "") === (currentState.salary_min || "") &&
          (btn.dataset.max || "") === (currentState.salary_max || "") &&
          Boolean(currentState.salary_min || currentState.salary_max);
        btn.classList.toggle("is-active", active);
      });

      const nextTags = currentState.skills ? currentState.skills.split(",").filter(Boolean) : [];
      skillApi?.setTags(nextTags);
    },
  };
}

