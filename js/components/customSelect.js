/**
 * CustomSelect Component (Pure Vanilla JS)
 * Thay thế <select> gốc bằng listbox chuẩn WAI-ARIA + bottom sheet trên mobile (<640px).
 */
(function (global) {
  const CHEVRON_SVG = `<svg class="custom-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  const CHECK_SVG = `<svg class="custom-select-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  let uidCounter = 0;

  function normalizeText(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();
  }

  function escapeHtmlText(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  class CustomSelect {
    constructor(hostEl, config) {
      this.hostEl = hostEl;
      this.id = config.id || `custom-select-${++uidCounter}`;
      this.name = config.name || this.id;
      this.placeholder = config.placeholder || "Chọn";
      this.ariaLabel = config.ariaLabel || this.placeholder;
      this.iconSvg = config.iconSvg || "";
      this.options = Array.isArray(config.options) ? config.options : [];
      this.value = config.value !== undefined ? String(config.value) : "";
      this.isOpen = false;
      this.activeIndex = Math.max(0, this.options.findIndex((o) => o.value === this.value));
      this.typeBuffer = "";
      this.typeTimer = null;

      this.render();
      this.bindEvents();
    }

    render() {
      const listboxId = `${this.id}-listbox`;
      const selectedOpt = this.options.find((o) => o.value === this.value);
      const hasValue = Boolean(this.value);
      const displayText = hasValue && selectedOpt ? selectedOpt.label : this.placeholder;

      this.hostEl.classList.add("custom-select");
      this.hostEl.innerHTML = `
        <input type="hidden" id="${escapeHtmlText(this.id)}" name="${escapeHtmlText(this.name)}" value="${escapeHtmlText(this.value)}">
        <button
          type="button"
          class="custom-select-trigger${hasValue ? " has-value" : ""}"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls="${escapeHtmlText(listboxId)}"
          aria-label="${escapeHtmlText(this.ariaLabel)}"
        >
          ${this.iconSvg ? `<span class="custom-select-icon" aria-hidden="true">${this.iconSvg}</span>` : ""}
          <span class="custom-select-label">${escapeHtmlText(displayText)}</span>
          ${CHEVRON_SVG}
        </button>
        <div class="custom-select-backdrop" hidden></div>
        <ul class="custom-select-listbox" id="${escapeHtmlText(listboxId)}" role="listbox" aria-label="${escapeHtmlText(this.ariaLabel)}" tabindex="-1" hidden>
          ${this.options.map((opt, idx) => {
            const isSelected = opt.value === this.value;
            return `
              <li
                class="custom-select-option${isSelected ? " is-selected" : ""}"
                role="option"
                id="${escapeHtmlText(this.id)}-opt-${idx}"
                data-value="${escapeHtmlText(opt.value)}"
                data-index="${idx}"
                aria-selected="${isSelected ? "true" : "false"}"
              >
                <span class="custom-select-option-text">${escapeHtmlText(opt.label)}</span>
                <span class="custom-select-option-check" aria-hidden="true">${isSelected ? CHECK_SVG : ""}</span>
              </li>
            `;
          }).join("")}
        </ul>
      `;

      this.hiddenInput = this.hostEl.querySelector(`input[type="hidden"]`);
      this.triggerBtn = this.hostEl.querySelector(".custom-select-trigger");
      this.labelEl = this.hostEl.querySelector(".custom-select-label");
      this.backdropEl = this.hostEl.querySelector(".custom-select-backdrop");
      this.listboxEl = this.hostEl.querySelector(".custom-select-listbox");
      this.optionEls = Array.from(this.listboxEl.querySelectorAll(".custom-select-option"));
    }

    bindEvents() {
      this.triggerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.isOpen) {
          this.close(false);
        } else {
          this.open();
        }
      });

      this.triggerBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (!this.isOpen) {
            const startIdx = e.key === "ArrowUp" ? this.options.length - 1 : Math.max(0, this.options.findIndex((o) => o.value === this.value));
            this.open(startIdx);
          }
        }
      });

      this.listboxEl.addEventListener("click", (e) => {
        const optionEl = e.target.closest(".custom-select-option");
        if (!optionEl) return;
        const idx = Number(optionEl.dataset.index);
        this.selectByIndex(idx);
      });

      this.listboxEl.addEventListener("keydown", (e) => this.handleListboxKeydown(e));

      if (this.backdropEl) {
        this.backdropEl.addEventListener("click", () => this.close(true));
      }

      this._onDocClick = (e) => {
        if (this.isOpen && !this.hostEl.contains(e.target)) {
          this.close(false);
        }
      };
      document.addEventListener("click", this._onDocClick);
    }

    open(focusIndex) {
      if (this.isOpen) return;
      document.querySelectorAll(".custom-select.is-open").forEach((el) => {
        if (el !== this.hostEl && el._customSelectInstance) {
          el._customSelectInstance.close(false);
        }
      });

      this.isOpen = true;
      this.hostEl.classList.add("is-open");
      this.triggerBtn.setAttribute("aria-expanded", "true");
      this.listboxEl.hidden = false;
      if (this.backdropEl) this.backdropEl.hidden = false;

      if (window.innerWidth < 640) {
        document.body.style.overflow = "hidden";
      }

      const selectedIdx = this.options.findIndex((o) => o.value === this.value);
      const targetIdx = focusIndex !== undefined ? focusIndex : Math.max(0, selectedIdx);
      this.setActiveIndex(targetIdx);

      requestAnimationFrame(() => {
        this.listboxEl.classList.add("is-visible");
        this.listboxEl.focus({ preventScroll: true });
      });
    }

    close(restoreFocus = false) {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.hostEl.classList.remove("is-open");
      this.triggerBtn.setAttribute("aria-expanded", "false");
      this.listboxEl.classList.remove("is-visible");
      this.listboxEl.hidden = true;
      if (this.backdropEl) this.backdropEl.hidden = true;
      document.body.style.overflow = "";

      if (restoreFocus) {
        this.triggerBtn.focus({ preventScroll: true });
      }
    }

    setActiveIndex(idx) {
      if (!this.optionEls.length) return;
      const clamped = Math.max(0, Math.min(idx, this.optionEls.length - 1));
      this.activeIndex = clamped;
      this.optionEls.forEach((el, i) => {
        el.classList.toggle("is-active", i === clamped);
      });
      const activeEl = this.optionEls[clamped];
      if (activeEl) {
        this.listboxEl.setAttribute("aria-activedescendant", activeEl.id);
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }

    selectByIndex(idx) {
      const opt = this.options[idx];
      if (!opt) return;
      const changed = this.value !== opt.value;
      this.value = opt.value;
      this.hiddenInput.value = opt.value;

      const hasValue = Boolean(opt.value);
      this.triggerBtn.classList.toggle("has-value", hasValue);
      this.labelEl.textContent = hasValue ? opt.label : this.placeholder;

      this.optionEls.forEach((el, i) => {
        const selected = i === idx;
        el.classList.toggle("is-selected", selected);
        el.setAttribute("aria-selected", selected ? "true" : "false");
        const checkWrap = el.querySelector(".custom-select-option-check");
        if (checkWrap) checkWrap.innerHTML = selected ? CHECK_SVG : "";
      });

      this.close(true);
      if (changed) {
        this.hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    handleListboxKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        this.close(true);
        return;
      }
      if (e.key === "Tab") {
        this.close(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.setActiveIndex((this.activeIndex + 1) % this.options.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.setActiveIndex((this.activeIndex - 1 + this.options.length) % this.options.length);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        this.setActiveIndex(0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        this.setActiveIndex(this.options.length - 1);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.selectByIndex(this.activeIndex);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.jumpToCharacter(e.key);
      }
    }

    setValue(val) {
      const next = val !== undefined && val !== null ? String(val) : "";
      this.value = next;
      if (this.hiddenInput) this.hiddenInput.value = next;
      const opt = this.options.find((o) => o.value === next);
      if (this.labelEl) this.labelEl.textContent = next && opt ? opt.label : this.placeholder;
      if (this.triggerBtn) this.triggerBtn.classList.toggle("has-value", Boolean(next));
      this.optionEls.forEach((el) => {
        const sel = el.dataset.value === next;
        el.classList.toggle("is-selected", sel);
        el.setAttribute("aria-selected", sel ? "true" : "false");
        const chk = el.querySelector(".custom-select-option-check");
        if (chk) chk.innerHTML = sel ? CHECK_SVG : "";
      });
    }

    jumpToCharacter(ch) {
      clearTimeout(this.typeTimer);
      this.typeBuffer += normalizeText(ch);
      this.typeTimer = setTimeout(() => {
        this.typeBuffer = "";
      }, 500);

      const start = (this.activeIndex + 1) % this.options.length;
      for (let offset = 0; offset < this.options.length; offset++) {
        const idx = (start + offset) % this.options.length;
        if (normalizeText(this.options[idx].label).startsWith(this.typeBuffer)) {
          this.setActiveIndex(idx);
          return;
        }
      }
      const single = normalizeText(ch);
      for (let offset = 0; offset < this.options.length; offset++) {
        const idx = (start + offset) % this.options.length;
        if (normalizeText(this.options[idx].label).startsWith(single)) {
          this.setActiveIndex(idx);
          return;
        }
      }
    }

    static enhance(selectEl, extraConfig = {}) {
      if (!selectEl || selectEl.dataset.enhanced === "true") return null;
      const options = Array.from(selectEl.options).map((opt) => ({
        value: opt.value,
        label: opt.textContent.trim(),
      }));
      const placeholder = extraConfig.placeholder || selectEl.dataset.placeholder || (options[0] ? options[0].label : "Chọn");
      const iconSvg = extraConfig.iconSvg || selectEl.dataset.icon || "";
      const host = document.createElement("div");
      if (selectEl.className) host.className = selectEl.className;

      const config = {
        id: selectEl.id,
        name: selectEl.name || selectEl.id,
        placeholder,
        ariaLabel: selectEl.getAttribute("aria-label") || placeholder,
        iconSvg,
        options,
        value: selectEl.value,
      };

      selectEl.parentNode.replaceChild(host, selectEl);
      const instance = new CustomSelect(host, config);
      host._customSelectInstance = instance;
      return instance;
    }

    static enhanceAll(root = document) {
      const selects = root.querySelectorAll("select[data-custom-select]");
      selects.forEach((sel) => {
        const fieldWrap = sel.closest(".search-field");
        let iconSvg = "";
        if (fieldWrap) {
          const siblingSvg = fieldWrap.querySelector(":scope > svg");
          if (siblingSvg) {
            iconSvg = siblingSvg.outerHTML;
            siblingSvg.remove();
          }
        }
        CustomSelect.enhance(sel, { iconSvg });
      });
    }
  }

  CustomSelect.enhanceAll();
  global.CustomSelect = CustomSelect;
})(window);

