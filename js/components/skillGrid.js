/**
 * skillGrid.js - Lưới kỹ năng lớn (dạng "browse by skill").
 * Dữ liệu từ GET /api/meta/skills — không hardcode.
 *
 * Mỗi ô là 1 kỹ năng phổ biến + số việc đang tuyển, bấm để lọc việc làm.
 */
import { buildJobsUrl } from "../utils/urlState.js";

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

/** Icon gánh chữ cái đầu — nhất quán với phần còn lại của hệ thống. */
function skillInitial(name) {
  const n = String(name || "?").trim();
  return escapeText((n.charAt(0) || "?").toUpperCase());
}

/**
 * Render lưới kỹ năng.
 * @param {HTMLElement} container
 * @param {Array<{id:number,name:string,usage_count?:number}>} skills
 */
export function renderSkillGrid(container, skills, { limit = 12 } = {}) {
  if (!container) return;
  const list = Array.isArray(skills) ? skills.filter((s) => s && s.name) : [];
  if (!list.length) {
    container.innerHTML = "";
    container.hidden = true;
    return;
  }
  container.hidden = false;

  container.innerHTML = list
    .slice(0, limit)
    .map((skill) => {
      const count = Number(skill.usage_count || 0);
      const href = buildJobsUrl({ skills: skill.name }, "pages/jobs.html");
      return `
        <a href="${escapeText(href)}" class="skill-tile">
          <span class="skill-tile-icon" aria-hidden="true">${skillInitial(skill.name)}</span>
          <span class="skill-tile-body">
            <span class="skill-tile-name">${escapeText(skill.name)}</span>
            <span class="skill-tile-count">${count} việc đang tuyển</span>
          </span>
        </a>
      `;
    })
    .join("");
}
