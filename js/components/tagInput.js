/**
 * Component Tag Input có autocomplete từ API /api/meta/skills?q=
 * Tối đa 15 kỹ năng, không trùng lặp, hỗ trợ bàn phím.
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function createSkillTagInput({
  hostEl,
  maxTags = 15,
  initialTags = [],
  fetchSuggestions,
  onChange,
}) {
  let tags = [...initialTags];
  let suggestions = [];
  let activeIdx = -1;
  let debounceTimer = null;

  hostEl.innerHTML = `
    <div class="ejf-tagbox" id="ejf-tagbox">
      <div class="ejf-tag-list" id="ejf-tag-list"></div>
      <input
        type="text"
        id="ejf-skill-input"
        class="ejf-tag-input"
        placeholder="Nhập kỹ năng (vd: React, Python, Docker...)"
        autocomplete="off"
        aria-autocomplete="list"
        aria-controls="ejf-skill-suggest"
        aria-expanded="false"
      >
    </div>
    <ul class="ejf-suggest-list" id="ejf-skill-suggest" role="listbox" hidden></ul>
  `;

  const listEl = hostEl.querySelector("#ejf-tag-list");
  const inputEl = hostEl.querySelector("#ejf-skill-input");
  const suggestEl = hostEl.querySelector("#ejf-skill-suggest");

  const renderTags = () => {
    listEl.innerHTML = tags
      .map(
        (tag, i) => `
      <span class="ejf-tag-chip">
        <span>${escapeText(tag)}</span>
        <button type="button" class="ejf-tag-remove" data-idx="${i}" aria-label="Xóa kỹ năng ${escapeText(tag)}">&times;</button>
      </span>
    `
      )
      .join("");

    listEl.querySelectorAll(".ejf-tag-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        tags.splice(Number(btn.dataset.idx), 1);
        renderTags();
        onChange?.([...tags]);
      });
    });

    inputEl.disabled = tags.length >= maxTags;
    inputEl.placeholder =
      tags.length >= maxTags
        ? `Đã đạt tối đa ${maxTags} kỹ năng`
        : "Nhập kỹ năng (vd: React, Python, Docker...)";
  };

  const closeSuggest = () => {
    suggestEl.hidden = true;
    suggestEl.innerHTML = "";
    inputEl.setAttribute("aria-expanded", "false");
    activeIdx = -1;
  };

  const addTag = (raw) => {
    const clean = String(raw || "").trim();
    if (!clean || tags.length >= maxTags) return;
    const exists = tags.some((t) => t.toLowerCase() === clean.toLowerCase());
    if (exists) {
      inputEl.value = "";
      closeSuggest();
      return;
    }
    tags.push(clean);
    inputEl.value = "";
    closeSuggest();
    renderTags();
    onChange?.([...tags]);
  };

  const renderSuggest = () => {
    const filtered = suggestions.filter(
      (s) => !tags.some((t) => t.toLowerCase() === s.name.toLowerCase())
    );
    if (filtered.length === 0) {
      closeSuggest();
      return;
    }
    suggestEl.hidden = false;
    inputEl.setAttribute("aria-expanded", "true");
    suggestEl.innerHTML = filtered
      .map(
        (s, idx) => `
      <li
        class="ejf-suggest-item ${idx === activeIdx ? "is-active" : ""}"
        role="option"
        aria-selected="${idx === activeIdx ? "true" : "false"}"
        data-name="${escapeText(s.name)}"
      >
        <span>${escapeText(s.name)}</span>
        <span class="ejf-suggest-count">${Number(s.usage_count)} tin</span>
      </li>
    `
      )
      .join("");

    suggestEl.querySelectorAll(".ejf-suggest-item").forEach((li) => {
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        addTag(li.dataset.name);
      });
    });
  };

  inputEl.addEventListener("input", () => {
    const q = inputEl.value.trim();
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(async () => {
      try {
        suggestions = (await fetchSuggestions(q)) || [];
        activeIdx = -1;
        renderSuggest();
      } catch {
        closeSuggest();
      }
    }, 180);
  });

  inputEl.addEventListener("focus", async () => {
    if (suggestions.length === 0) {
      try {
        suggestions = (await fetchSuggestions(inputEl.value.trim())) || [];
      } catch {
        suggestions = [];
      }
    }
    renderSuggest();
  });

  inputEl.addEventListener("blur", () => {
    window.setTimeout(closeSuggest, 150);
  });

  inputEl.addEventListener("keydown", (e) => {
    const items = Array.from(suggestEl.querySelectorAll(".ejf-suggest-item"));
    if (e.key === "ArrowDown" && !suggestEl.hidden) {
      e.preventDefault();
      activeIdx = (activeIdx + 1) % items.length;
      renderSuggest();
    } else if (e.key === "ArrowUp" && !suggestEl.hidden) {
      e.preventDefault();
      activeIdx = (activeIdx - 1 + items.length) % items.length;
      renderSuggest();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!suggestEl.hidden && activeIdx >= 0 && items[activeIdx]) {
        addTag(items[activeIdx].dataset.name);
      } else if (inputEl.value.trim()) {
        addTag(inputEl.value);
      }
    } else if (e.key === "Escape") {
      closeSuggest();
    } else if (e.key === "Backspace" && !inputEl.value && tags.length > 0) {
      tags.pop();
      renderTags();
      onChange?.([...tags]);
    }
  });

  renderTags();

  return {
    getTags: () => [...tags],
    setTags: (nextTags) => {
      tags = Array.isArray(nextTags) ? [...nextTags] : [];
      renderTags();
    },
  };
}

