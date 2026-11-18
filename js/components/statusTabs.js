/**
 * Component Tab trạng thái (role="tablist") nhận dữ liệu động từ API.
 * - Keyboard: ArrowLeft/Right/Home/End, roving tabindex
 * - Scroll: active tab luôn scrollIntoView({inline:"nearest"})
 * - Accessibility: aria-selected, aria-controls, data-count cho opacity
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function renderStatusTabs(container, tabs, activeKey, onChange) {
  if (!container) return;

  container.setAttribute("role", "tablist");
  if (!container.getAttribute("aria-label")) {
    container.setAttribute("aria-label", "Lọc theo trạng thái");
  }
  container.classList.add("ej-tablist");

  if (!Array.isArray(tabs) || tabs.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = tabs
    .map((tab) => {
      const isSelected = (tab.key ?? tab.id) === activeKey;
      const count = Number(tab.count ?? 0);
      const key = tab.key ?? tab.id;
      const controlId = tab.controls ?? "";
      return `
        <button
          type="button"
          class="ej-tab"
          role="tab"
          id="tab-${escapeText(key)}"
          data-status="${escapeText(key)}"
          data-tab="${escapeText(key)}"
          data-count="${count}"
          aria-selected="${isSelected ? "true" : "false"}"
          tabindex="${isSelected ? "0" : "-1"}"
          ${controlId ? `aria-controls="${escapeText(controlId)}"` : ""}
          aria-label="${escapeText(tab.label)}, ${count} mục"
        >
          <span>${escapeText(tab.label)}</span>
          <span class="ej-tab-count" aria-hidden="true">${count}</span>
        </button>
      `;
    })
    .join("");

  const tabEls = Array.from(container.querySelectorAll('[role="tab"]'));

  tabEls.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      const nextKey = btn.dataset.status || btn.dataset.tab || "all";
      if (nextKey !== activeKey && typeof onChange === "function") {
        onChange(nextKey);
      }
    });

    btn.addEventListener("keydown", (e) => {
      let nextIdx = -1;
      if (e.key === "ArrowRight") nextIdx = (idx + 1) % tabEls.length;
      else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + tabEls.length) % tabEls.length;
      else if (e.key === "Home") nextIdx = 0;
      else if (e.key === "End") nextIdx = tabEls.length - 1;

      if (nextIdx >= 0) {
        e.preventDefault();
        const target = tabEls[nextIdx];
        target.focus();
        const nextKey = target.dataset.status || target.dataset.tab || "all";
        if (nextKey !== activeKey && typeof onChange === "function") {
          onChange(nextKey);
        }
      }
    });
  });

  // Scroll active tab vào view
  const activeEl = container.querySelector('[aria-selected="true"]');
  if (activeEl) {
    requestAnimationFrame(() => {
      activeEl.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }
}

