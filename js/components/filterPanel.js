/**
 * Component Bảng bộ lọc trái (fieldset/legend, thu gọn được, Xem thêm >5 mục, faceted counts).
 */
import { createSkillTagInput } from "./tagInput.js";

function escapeText(v) {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
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
  const expandedGroups = new Set(["location", "category"]);
  const showAllGroups = new Set();
  let salaryTimer = null, skillApi = null, currentState = { ...initialState };
  let currentFacets = { location: [], category: [], level: [], type: [] };

  const isExp = (k) => expandedGroups.has(k);

  hostEl.innerHTML = `
    <div class="fp-header">
      <h2 class="fp-title">Bộ lọc tìm kiếm</h2>
      <button type="button" class="fp-reset-btn" id="fp-reset-all">Đặt lại</button>
    </div>
    ${FACET_GROUPS.map((g) => `
      <fieldset class="fp-group" data-group="${g.key}">
        <legend class="fp-legend">
          <button type="button" class="fp-toggle" aria-expanded="${isExp(g.key)}" aria-controls="fp-body-${g.key}">
            <span>${g.label}</span>${CHEVRON_SVG}
          </button>
        </legend>
        <div id="fp-body-${g.key}" class="fp-body" ${isExp(g.key) ? "" : "hidden"}>
          <div class="fp-check-list" data-facet-list="${g.key}"></div>
        </div>
      </fieldset>
    `).join("")}
    <fieldset class="fp-group" data-group="salary">
      <legend class="fp-legend">
        <button type="button" class="fp-toggle" aria-expanded="${isExp("salary")}" aria-controls="fp-body-salary">
          <span>Mức lương (triệu VNĐ)</span>${CHEVRON_SVG}
        </button>
      </legend>
      <div id="fp-body-salary" class="fp-body" ${isExp("salary") ? "" : "hidden"}>
        <div class="fp-salary-row">
          <input type="number" min="0" id="fp-sal-min" class="fp-salary-input" placeholder="Từ (Tr)" aria-label="Lương tối thiểu">
          <input type="number" min="0" id="fp-sal-max" class="fp-salary-input" placeholder="Đến (Tr)" aria-label="Lương tối đa">
        </div>
        <div class="fp-salary-presets">
          ${SALARY_PRESETS.map((p) => `<button type="button" class="fp-preset-btn" data-min="${p.min}" data-max="${p.max}">${p.label}</button>`).join("")}
        </div>
      </div>
    </fieldset>
    <fieldset class="fp-group" data-group="skills">
      <legend class="fp-legend">
        <button type="button" class="fp-toggle" aria-expanded="${isExp("skills")}" aria-controls="fp-body-skills">
          <span>Kỹ năng</span>${CHEVRON_SVG}
        </button>
      </legend>
      <div id="fp-body-skills" class="fp-body" ${isExp("skills") ? "" : "hidden"}>
        <div id="fp-skills-host" style="margin-top:6px;"></div>
      </div>
    </fieldset>
  `;

  hostEl.querySelector("#fp-reset-all")?.addEventListener("click", () => onReset?.());

  hostEl.querySelectorAll(".fp-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const grp = btn.closest(".fp-group")?.dataset.group;
      const bdy = document.getElementById(btn.getAttribute("aria-controls"));
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      if (bdy) bdy.hidden = open;
      if (grp) { if (open) expandedGroups.delete(grp); else expandedGroups.add(grp); }
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
      const min = btn.dataset.min || "", max = btn.dataset.max || "";
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
    const selSet = new Set(String(currentState[key] || "").split(",").filter(Boolean));
    const showAll = showAllGroups.has(key);
    let list = items;
    if (!showAll && items.length > 5) {
      list = items.filter((it) => Number(it.count) > 0 || selSet.has(it.value)).slice(0, 5);
      if (list.length < 5) list = items.slice(0, 5);
    }

    listEl.innerHTML = list.map((it) => {
      const chk = selSet.has(it.value);
      const cnt = Number(it.count || 0);
      const dis = cnt === 0 && !chk;
      return `
        <label class="fp-check-item ${dis ? "is-disabled" : ""}" ${dis ? 'aria-disabled="true"' : ""}>
          <span class="fp-check-left">
            <input type="checkbox" data-facet-key="${key}" value="${escapeText(it.value)}" ${chk ? "checked" : ""} ${dis ? "disabled" : ""}>
            <span class="fp-check-label" title="${escapeText(it.label)}">${escapeText(it.label)}</span>
          </span>
          <span class="fp-check-count">${cnt}</span>
        </label>`;
    }).join("");

    if (items.length > 5) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fp-show-more";
      btn.textContent = showAll ? "Thu gọn" : `Xem thêm (${items.length - list.length})`;
      btn.addEventListener("click", () => {
        if (showAll) showAllGroups.delete(key); else showAllGroups.add(key);
        renderFacetGroup(key);
      });
      listEl.appendChild(btn);
    }

    listEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const next = new Set(String(currentState[key] || "").split(",").filter(Boolean));
        if (cb.checked) next.add(cb.value); else next.delete(cb.value);
        onChange?.({ [key]: Array.from(next).join(",") });
      });
    });
  };

  return {
    sync(nextState, nextFacets) {
      currentState = { ...nextState };
      if (nextFacets) currentFacets = nextFacets;
      FACET_GROUPS.forEach((g) => renderFacetGroup(g.key));

      if (salMinEl && document.activeElement !== salMinEl) {
        salMinEl.value = currentState.salary_min ? String(Math.round(Number(currentState.salary_min) / 1000000)) : "";
      }
      if (salMaxEl && document.activeElement !== salMaxEl) {
        salMaxEl.value = currentState.salary_max ? String(Math.round(Number(currentState.salary_max) / 1000000)) : "";
      }
      hostEl.querySelectorAll(".fp-preset-btn").forEach((btn) => {
        const active = (btn.dataset.min || "") === (currentState.salary_min || "") &&
                       (btn.dataset.max || "") === (currentState.salary_max || "") &&
                       Boolean(currentState.salary_min || currentState.salary_max);
        btn.classList.toggle("is-active", active);
      });
      skillApi?.setTags(currentState.skills ? currentState.skills.split(",").filter(Boolean) : []);
    },
  };
}
