/**
 * Component Skill Tag Input tùy chỉnh cho trang profile (maxTags: 30)
 * Hỗ trợ:
 * - Enter hoặc dấu phẩy (,) để thêm
 * - Backspace xóa tag cuối khi input rỗng
 * - Autocomplete từ /api/meta/skills?q= (debounce 250ms, hủy request cũ qua AbortController)
 * - Chuẩn hóa không phân biệt hoa thường, không trùng, tối đa 30
 */

function esc(val) {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function createProfileSkillsTagInput({
  hostEl,
  initialTags = [],
  maxTags = 30,
  onChange,
}) {
  let tags = [...initialTags];
  let abortCtrl = null;
  let debounceTimer = null;

  hostEl.innerHTML = `
    <div class="skills-tag-box" style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 12px;background:#fff;border:1px solid var(--border);border-radius:8px;min-height:46px;align-items:center;">
      <div id="skills-tags-wrapper" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
      <input type="text" id="skills-text-input" placeholder="${tags.length >= maxTags ? "Đã đạt tối đa 30 kỹ năng" : "Nhập kỹ năng rồi bấm Enter..."}" ${tags.length >= maxTags ? "disabled" : ""} autocomplete="off" style="border:none;outline:none;font-family:inherit;font-size:14px;flex:1;min-width:140px;background:transparent;">
    </div>
    <ul id="skills-suggestions-dropdown" style="display:none;position:absolute;z-index:50;background:#fff;border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-height:180px;overflow-y:auto;list-style:none;padding:4px 0;margin:4px 0 0;width:320px;"></ul>
  `;

  const tagsWrapper = hostEl.querySelector("#skills-tags-wrapper");
  const inputEl = hostEl.querySelector("#skills-text-input");
  const suggestList = hostEl.querySelector("#skills-suggestions-dropdown");

  const renderChips = () => {
    tagsWrapper.innerHTML = tags.map((t, i) => `
      <span class="skill-chip" style="display:inline-flex;align-items:center;gap:6px;background:var(--primary-soft, #f0fdf4);color:var(--primary, #0f766e);border:1px solid var(--primary-line, #99f6e4);padding:4px 10px;border-radius:6px;font-size:13px;font-weight:500;">
        <span>${esc(t)}</span>
        <button type="button" class="btn-remove-skill" data-index="${i}" aria-label="Xóa kỹ năng ${esc(t)}" style="background:none;border:none;color:inherit;cursor:pointer;padding:0;font-size:14px;line-height:1;display:flex;align-items:center;">&times;</button>
      </span>
    `).join("");

    if (tags.length >= maxTags) {
      inputEl.disabled = true;
      inputEl.placeholder = "Đã đạt tối đa 30 kỹ năng";
    } else {
      inputEl.disabled = false;
      inputEl.placeholder = "Nhập kỹ năng rồi bấm Enter...";
    }

    tagsWrapper.querySelectorAll(".btn-remove-skill").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.index);
        tags.splice(idx, 1);
        renderChips();
        onChange?.(tags);
        inputEl.focus();
      });
    });
  };

  const addTag = (text) => {
    const clean = text.trim();
    if (!clean) return;
    if (tags.length >= maxTags) return;

    // Chuẩn hóa không phân biệt hoa thường, không trùng lặp
    const exists = tags.some((t) => t.toLowerCase() === clean.toLowerCase());
    if (!exists) {
      tags.push(clean);
      renderChips();
      onChange?.(tags);
    }
    inputEl.value = "";
    suggestList.style.display = "none";
  };

  const fetchSuggestions = (query) => {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    fetch(`${base}/meta/skills?q=${encodeURIComponent(query)}`, { signal: abortCtrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const matches = Array.isArray(data)
          ? data.filter((item) => !tags.some((t) => t.toLowerCase() === item.name.toLowerCase()))
          : [];

        if (matches.length === 0) {
          suggestList.style.display = "none";
          return;
        }

        suggestList.innerHTML = matches.map((m) => `
          <li class="skill-sug-item" data-value="${esc(m.name)}" style="padding:8px 12px;font-size:13.5px;cursor:pointer;color:var(--text);">${esc(m.name)}</li>
        `).join("");
        suggestList.style.display = "block";

        suggestList.querySelectorAll(".skill-sug-item").forEach((li) => {
          li.addEventListener("mouseenter", () => { li.style.background = "var(--bg-alt)"; });
          li.addEventListener("mouseleave", () => { li.style.background = "transparent"; });
          li.addEventListener("mousedown", (e) => {
            e.preventDefault();
            addTag(li.dataset.value);
          });
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") suggestList.style.display = "none";
      });
  };

  inputEl.addEventListener("input", (e) => {
    const val = inputEl.value;
    if (val.includes(",")) {
      const parts = val.split(",");
      parts.slice(0, -1).forEach((p) => addTag(p));
      inputEl.value = parts[parts.length - 1];
    }

    clearTimeout(debounceTimer);
    const q = inputEl.value.trim();
    if (q.length >= 1) {
      debounceTimer = setTimeout(() => fetchSuggestions(q), 250);
    } else {
      suggestList.style.display = "none";
    }
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputEl.value);
    } else if (e.key === "Backspace" && inputEl.value === "" && tags.length > 0) {
      tags.pop();
      renderChips();
      onChange?.(tags);
    } else if (e.key === "Escape") {
      suggestList.style.display = "none";
    }
  });

  inputEl.addEventListener("blur", () => {
    setTimeout(() => { suggestList.style.display = "none"; }, 180);
  });

  renderChips();

  return {
    getTags: () => [...tags],
    setTags: (newTags) => {
      tags = [...newTags];
      renderChips();
    },
  };
}
