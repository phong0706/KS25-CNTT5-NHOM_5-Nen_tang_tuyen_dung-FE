/**
 * Component hàng chip điều kiện đang áp dụng (bấm × bỏ từng cái, "Xóa tất cả").
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function buildActiveChips(state, facets = {}) {
  const chips = [];
  if (state.q) chips.push({ key: "q", value: state.q, label: `Từ khóa: ${state.q}` });

  const lookupLabel = (groupKey, val) => {
    const found = (facets[groupKey] || []).find((f) => f.value === val);
    return found ? found.label : val;
  };

  [
    { key: "location", prefix: "Địa điểm" },
    { key: "category", prefix: "Ngành" },
    { key: "level", prefix: "Cấp bậc" },
    { key: "type", prefix: "Hình thức" },
  ].forEach(({ key, prefix }) => {
    String(state[key] || "")
      .split(",")
      .filter(Boolean)
      .forEach((val) => {
        chips.push({ key, value: val, label: `${prefix}: ${lookupLabel(key, val)}` });
      });
  });

  if (state.salary_min || state.salary_max) {
    const minTr = state.salary_min ? `${Math.round(Number(state.salary_min) / 1000000)} Tr` : "0";
    const maxTr = state.salary_max ? `${Math.round(Number(state.salary_max) / 1000000)} Tr` : "trở lên";
    chips.push({ key: "salary", value: "salary", label: `Lương: ${minTr} - ${maxTr}` });
  }

  String(state.skills || "")
    .split(",")
    .filter(Boolean)
    .forEach((sk) => {
      chips.push({ key: "skills", value: sk, label: `Kỹ năng: ${sk}` });
    });

  if (state.company_id) {
    chips.push({ key: "company_id", value: state.company_id, label: "Lọc theo công ty" });
  }

  return chips;
}

export function countActiveFilters(state, facets) {
  return buildActiveChips(state, facets).length;
}

export function renderFilterChips(container, state, facets, { onRemove, onClearAll }) {
  if (!container) return;
  const chips = buildActiveChips(state, facets);
  if (chips.length === 0) {
    container.innerHTML = "";
    container.hidden = true;
    return;
  }

  container.hidden = false;
  container.innerHTML = `
    <div class="jobs-chips-row">
      ${chips
        .map(
          (c, i) => `
        <span class="jobs-chip">
          <span>${escapeText(c.label)}</span>
          <button type="button" class="jobs-chip-remove" data-chip-idx="${i}" aria-label="Bỏ điều kiện ${escapeText(c.label)}">&times;</button>
        </span>
      `
        )
        .join("")}
      <button type="button" class="jobs-chips-clear" id="jobs-chips-clear-all">Xóa tất cả</button>
    </div>
  `;

  container.querySelectorAll(".jobs-chip-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chip = chips[Number(btn.dataset.chipIdx)];
      if (chip) onRemove?.(chip);
    });
  });

  container.querySelector("#jobs-chips-clear-all")?.addEventListener("click", () => onClearAll?.());
}

