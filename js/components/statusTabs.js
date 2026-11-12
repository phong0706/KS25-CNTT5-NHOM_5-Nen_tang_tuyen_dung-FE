/**
 * Component Tab trạng thái (role="tablist") nhận dữ liệu động từ API.
 * Hỗ trợ điều hướng bàn phím (ArrowLeft, ArrowRight, Home, End).
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function renderStatusTabs(container, tabs, activeKey, onChange) {
  if (!container) return;

  container.setAttribute("role", "tablist");
  container.setAttribute("aria-label", "Lọc tin theo trạng thái");

  if (!Array.isArray(tabs) || tabs.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = tabs
    .map((tab) => {
      const isSelected = tab.key === activeKey;
      return `
        <button
          type="button"
          class="ej-tab"
          role="tab"
          id="tab-${escapeText(tab.key)}"
          data-status="${escapeText(tab.key)}"
          aria-selected="${isSelected ? "true" : "false"}"
          tabindex="${isSelected ? "0" : "-1"}"
        >
          <span>${escapeText(tab.label)}</span>
          <span class="ej-tab-count">${Number(tab.count ?? 0)}</span>
        </button>
      `;
    })
    .join("");

  const tabEls = Array.from(container.querySelectorAll('[role="tab"]'));

  tabEls.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      const nextStatus = btn.dataset.status || "all";
      if (nextStatus !== activeKey && typeof onChange === "function") {
        onChange(nextStatus);
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
        const nextStatus = target.dataset.status || "all";
        if (nextStatus !== activeKey && typeof onChange === "function") {
          onChange(nextStatus);
        }
      }
    });
  });
}

