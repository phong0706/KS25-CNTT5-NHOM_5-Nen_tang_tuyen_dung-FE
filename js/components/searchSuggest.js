/**
 * Autocomplete gợi ý tìm kiếm tức thì theo Vị trí / Kỹ năng / Công ty
 * Debounce 250ms, AbortController, điều hướng bàn phím mũi tên & Enter.
 */

export function initSearchSuggest({ inputEl, dropdownEl, onSelect }) {
  if (!inputEl || !dropdownEl) return;
  let timer = null, controller = null, activeIdx = -1, items = [];

  /**
   * Escape HTML — dữ liệu gợi ý tới từ DB (tiêu đề tin, tên công ty, tên kỹ năng)
   * có thể do người dùng nhập -> không được chèn thô vào innerHTML.
   */
  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  }

  function close() {
    dropdownEl.hidden = true;
    dropdownEl.innerHTML = "";
    activeIdx = -1;
    items = [];
  }

  function render(list) {
    items = list;
    if (!list.length) { close(); return; }
    dropdownEl.innerHTML = list.map((it, idx) => `
      <div class="search-suggest-item" role="option" data-idx="${idx}" id="suggest-opt-${idx}" aria-selected="false">
        <span class="search-suggest-group">${escapeHtml(it.group)}</span>
        <span class="search-suggest-text">${escapeHtml(it.text)}</span>
        <span class="search-suggest-count">${it.count ?? 0} tin</span>
      </div>
    `).join("");
    dropdownEl.hidden = false;
    activeIdx = -1;
  }

  function highlight(idx) {
    const els = dropdownEl.querySelectorAll(".search-suggest-item");
    els.forEach((el, i) => {
      const match = i === idx;
      el.classList.toggle("is-active", match);
      el.setAttribute("aria-selected", match ? "true" : "false");
      if (match) el.scrollIntoView({ block: "nearest" });
    });
    activeIdx = idx;
  }

  inputEl.addEventListener("input", () => {
    window.clearTimeout(timer);
    const q = inputEl.value.trim();
    if (q.length < 2) { close(); return; }
    timer = window.setTimeout(async () => {
      if (controller) controller.abort();
      controller = new AbortController();
      try {
        const res = await window.api.get("/search/suggest", { q }, { signal: controller.signal });
        render(res?.items || []);
      } catch (err) {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") close();
      }
    }, 250);
  });

  inputEl.addEventListener("keydown", (e) => {
    if (dropdownEl.hidden || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlight(activeIdx < items.length - 1 ? activeIdx + 1 : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlight(activeIdx > 0 ? activeIdx - 1 : items.length - 1);
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const chosen = items[activeIdx];
      inputEl.value = chosen.text;
      close();
      onSelect?.(chosen);
    } else if (e.key === "Escape") {
      close();
    }
  });

  dropdownEl.addEventListener("click", (e) => {
    const row = e.target.closest(".search-suggest-item");
    if (!row) return;
    const idx = Number(row.dataset.idx);
    const chosen = items[idx];
    if (chosen) {
      inputEl.value = chosen.text;
      close();
      onSelect?.(chosen);
    }
  });

  document.addEventListener("click", (e) => {
    if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) close();
  });
}
