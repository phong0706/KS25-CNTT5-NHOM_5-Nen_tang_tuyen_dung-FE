/**
 * Component Drawer bộ lọc mobile (< 1024px) trượt từ dưới lên.
 * Khóa cuộn body, giữ focus (focus trap), Esc đóng và trả focus về nút mở.
 */

export function createFilterDrawer({ openBtn, panelEl, layoutEl, onReset }) {
  let backdrop = null;
  let applyBtn = null;
  let isOpen = false;
  let lastCount = 0;

  const restorePanelToLayout = () => {
    if (panelEl && layoutEl && !layoutEl.contains(panelEl)) {
      layoutEl.insertBefore(panelEl, layoutEl.firstChild);
    }
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeyDown, true);
    restorePanelToLayout();
    backdrop?.remove();
    backdrop = null;
    applyBtn = null;
    openBtn?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab" && backdrop) {
      const focusables = Array.from(
        backdrop.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const open = () => {
    if (isOpen || !panelEl) return;
    isOpen = true;
    document.body.style.overflow = "hidden";

    backdrop = document.createElement("div");
    backdrop.className = "filter-drawer-backdrop";
    backdrop.innerHTML = `
      <div class="filter-drawer" role="dialog" aria-modal="true" aria-label="Bộ lọc tìm kiếm">
        <div class="filter-drawer-head">
          <h2 class="fp-title">Bộ lọc tìm kiếm</h2>
          <button type="button" class="filter-drawer-close" aria-label="Đóng bộ lọc">&times;</button>
        </div>
        <div class="filter-drawer-body"></div>
        <div class="filter-drawer-foot">
          <button type="button" class="ejf-btn-outline" id="drawer-reset-btn">Đặt lại</button>
          <button type="button" class="btn btn-primary" id="drawer-apply-btn">Áp dụng (${lastCount} kết quả)</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const bodyEl = backdrop.querySelector(".filter-drawer-body");
    bodyEl.appendChild(panelEl);

    const closeBtn = backdrop.querySelector(".filter-drawer-close");
    applyBtn = backdrop.querySelector("#drawer-apply-btn");

    closeBtn.addEventListener("click", close);
    applyBtn.addEventListener("click", close);
    backdrop.querySelector("#drawer-reset-btn").addEventListener("click", () => onReset?.());
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });

    document.addEventListener("keydown", onKeyDown, true);
    window.requestAnimationFrame(() => closeBtn.focus());
  };

  openBtn?.addEventListener("click", open);
  window.addEventListener("resize", () => {
    if (isOpen && window.innerWidth >= 1024) close();
  });

  return {
    updateCount(total) {
      lastCount = Number(total || 0);
      if (applyBtn) applyBtn.textContent = `Áp dụng (${lastCount} kết quả)`;
    },
  };
}

