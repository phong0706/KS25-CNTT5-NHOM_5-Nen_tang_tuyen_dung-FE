/**
 * CustomSelect Component (Pure Vanilla JS, <= 195 dòng)
 * Thay thế <select> gốc bằng listbox chuẩn WAI-ARIA, hỗ trợ onChange, labelPrefix và bàn phím.
 */
(function (global) {
  const CHEVRON_SVG = `<svg class="custom-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  let uidCounter = 0;

  const normalizeText = (str) => String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
  const esc = (str) => String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  class CustomSelect {
    constructor(hostEl, config = {}) {
      this.hostEl = hostEl;
      this.id = config.id || `custom-select-${++uidCounter}`;
      this.name = config.name || this.id;
      this.placeholder = config.placeholder || "Chọn";
      this.ariaLabel = config.ariaLabel || this.placeholder;
      this.iconSvg = config.iconSvg || ""; this.labelPrefix = config.labelPrefix || "";
      this.inlineMobile = Boolean(config.inlineMobile);
      this.onChange = typeof config.onChange === "function" ? config.onChange : null;
      this.options = Array.isArray(config.options) ? config.options : [];
      this.value = config.value !== undefined ? String(config.value) : "";
      this.isOpen = false; this.typeBuffer = ""; this.typeTimer = null;
      this.activeIndex = Math.max(0, this.options.findIndex((o) => o.value === this.value));
      this.hostEl._customSelectInstance = this;
      this.render(); this.bindEvents();
    }

    formatTriggerText(opt) {
      if (!opt) return this.placeholder;
      return this.labelPrefix ? `${this.labelPrefix}: ${opt.label}` : opt.label;
    }

    render() {
      const listboxId = `${this.id}-listbox`;
      const selectedOpt = this.options.find((o) => o.value === this.value);
      const hasValue = Boolean(this.value) || Boolean(selectedOpt && this.labelPrefix);
      this.hostEl.classList.add("custom-select");
      this.hostEl.innerHTML = `
        <input type="hidden" id="${esc(this.id)}" name="${esc(this.name)}" value="${esc(this.value)}">
        <button type="button" class="custom-select-trigger${hasValue ? " has-value" : ""}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${esc(listboxId)}" aria-label="${esc(this.ariaLabel)}">
          ${this.iconSvg ? `<span class="custom-select-icon" aria-hidden="true">${this.iconSvg}</span>` : ""}
          <span class="custom-select-label">${esc(this.formatTriggerText(selectedOpt))}</span>
          ${CHEVRON_SVG}
        </button>
        <div class="custom-select-backdrop" hidden></div>
        <ul class="custom-select-listbox" id="${esc(listboxId)}" role="listbox" aria-label="${esc(this.ariaLabel)}" tabindex="-1" hidden>
          ${this.options.map((opt, idx) => {
            const sel = opt.value === this.value;
            return `<li class="custom-select-option${sel ? " is-selected" : ""}" role="option" id="${esc(this.id)}-opt-${idx}" data-value="${esc(opt.value)}" data-index="${idx}" aria-selected="${sel ? "true" : "false"}"><span class="custom-select-option-text">${esc(opt.label)}</span></li>`;
          }).join("")}
        </ul>`;
      this.hiddenInput = this.hostEl.querySelector('input[type="hidden"]');
      this.triggerBtn = this.hostEl.querySelector(".custom-select-trigger");
      this.labelEl = this.hostEl.querySelector(".custom-select-label");
      this.backdropEl = this.hostEl.querySelector(".custom-select-backdrop");
      this.listboxEl = this.hostEl.querySelector(".custom-select-listbox");
      this.optionEls = Array.from(this.listboxEl.querySelectorAll(".custom-select-option"));
    }

    bindEvents() {
      this.hostEl.addEventListener("click", (e) => {
        const trig = e.target.closest(".custom-select-trigger");
        if (trig) { e.stopPropagation(); this.isOpen ? this.close(false) : this.open(); return; }
        const optEl = e.target.closest(".custom-select-option");
        if (optEl) { this.selectByIndex(Number(optEl.dataset.index)); return; }
        if (e.target.classList.contains("custom-select-backdrop")) this.close(true);
      });
      this.hostEl.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen) { e.preventDefault(); this.close(true); return; }
        if (e.target.closest(".custom-select-trigger")) {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!this.isOpen) {
              const start = e.key === "ArrowUp" ? this.options.length - 1 : Math.max(0, this.options.findIndex((o) => o.value === this.value));
              this.open(start);
            }
          }
          return;
        }
        if (e.target.closest(".custom-select-listbox")) this.handleListboxKeydown(e);
      });
      this._onDocClick = (e) => { if (this.isOpen && !this.hostEl.contains(e.target)) this.close(false); };
      document.addEventListener("click", this._onDocClick);
    }

    open(focusIndex) {
      if (this.isOpen || !this.options.length) return;
      document.querySelectorAll(".custom-select.is-open").forEach((el) => {
        if (el !== this.hostEl && el._customSelectInstance) el._customSelectInstance.close(false);
      });
      this.isOpen = true;
      this.hostEl.classList.add("is-open");
      this.triggerBtn.setAttribute("aria-expanded", "true");
      this.listboxEl.hidden = false;
      if (this.backdropEl && !this.inlineMobile) this.backdropEl.hidden = false;
      if (window.innerWidth < 640 && !this.inlineMobile) document.body.style.overflow = "hidden";
      this.setActiveIndex(focusIndex !== undefined ? focusIndex : Math.max(0, this.options.findIndex((o) => o.value === this.value)));
      this.listboxEl.classList.add("is-visible");
      this.listboxEl.focus({ preventScroll: true });
    }
    close(restoreFocus = false) {
      if (!this.isOpen) return;
      this.isOpen = false; this.hostEl.classList.remove("is-open");
      this.triggerBtn.setAttribute("aria-expanded", "false");
      this.listboxEl.classList.remove("is-visible"); this.listboxEl.hidden = true;
      if (this.backdropEl) this.backdropEl.hidden = true;
      if (!this.inlineMobile) document.body.style.overflow = "";
      if (restoreFocus) this.triggerBtn.focus({ preventScroll: true });
    }
    setActiveIndex(idx) {
      if (!this.optionEls.length) return;
      this.activeIndex = Math.max(0, Math.min(idx, this.optionEls.length - 1));
      this.optionEls.forEach((el, i) => el.classList.toggle("is-active", i === this.activeIndex));
      const activeEl = this.optionEls[this.activeIndex];
      if (activeEl) { this.listboxEl.setAttribute("aria-activedescendant", activeEl.id); activeEl.scrollIntoView({ block: "nearest" }); }
    }
    selectByIndex(idx) {
      const opt = this.options[idx];
      if (!opt) return;
      const changed = this.value !== opt.value;
      this.setValue(opt.value, false); this.close(true);
      if (changed) { this.hiddenInput.dispatchEvent(new Event("change", { bubbles: true })); this.onChange?.(opt.value, opt); }
    }
    handleListboxKeydown(e) {
      if (e.key === "Escape") { e.preventDefault(); this.close(true); return; }
      if (e.key === "Tab") { this.close(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); this.setActiveIndex((this.activeIndex + 1) % this.options.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); this.setActiveIndex((this.activeIndex - 1 + this.options.length) % this.options.length); return; }
      if (e.key === "Home") { e.preventDefault(); this.setActiveIndex(0); return; }
      if (e.key === "End") { e.preventDefault(); this.setActiveIndex(this.options.length - 1); return; }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.selectByIndex(this.activeIndex); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) this.jumpToCharacter(e.key);
    }

    setValue(val, notify = false) {
      const next = val !== undefined && val !== null ? String(val) : "";
      const changed = this.value !== next;
      this.value = next;
      if (this.hiddenInput) this.hiddenInput.value = next;
      const opt = this.options.find((o) => o.value === next);
      if (this.labelEl) this.labelEl.textContent = this.formatTriggerText(opt);
      if (this.triggerBtn) this.triggerBtn.classList.toggle("has-value", Boolean(next) || Boolean(opt && this.labelPrefix));
      this.optionEls.forEach((el) => {
        const sel = el.dataset.value === next;
        el.classList.toggle("is-selected", sel);
        el.setAttribute("aria-selected", sel ? "true" : "false");
      });
      if (notify && changed) this.onChange?.(next, opt || null);
    }

    setOptions(nextOptions, nextValue = this.value) {
      this.options = Array.isArray(nextOptions) ? nextOptions : [];
      this.value = nextValue !== undefined && nextValue !== null ? String(nextValue) : "";
      this.render();
    }

    jumpToCharacter(ch) {
      clearTimeout(this.typeTimer);
      this.typeBuffer += normalizeText(ch);
      this.typeTimer = setTimeout(() => { this.typeBuffer = ""; }, 500);
      const start = (this.activeIndex + 1) % this.options.length;
      for (const query of [this.typeBuffer, normalizeText(ch)]) {
        for (let off = 0; off < this.options.length; off += 1) {
          const idx = (start + off) % this.options.length;
          if (normalizeText(this.options[idx].label).startsWith(query)) { this.setActiveIndex(idx); return; }
        }
      }
    }

    static enhance(selectEl, extra = {}) {
      if (!selectEl || selectEl.dataset.enhanced === "true") return null;
      const options = Array.from(selectEl.options).map((o) => ({ value: o.value, label: o.textContent.trim() }));
      const placeholder = extra.placeholder || selectEl.dataset.placeholder || (options[0] ? options[0].label : "Chọn");
      const host = document.createElement("div");
      if (selectEl.className) host.className = selectEl.className;
      selectEl.parentNode.replaceChild(host, selectEl);
      return new CustomSelect(host, {
        id: selectEl.id, name: selectEl.name || selectEl.id, placeholder,
        ariaLabel: selectEl.getAttribute("aria-label") || placeholder,
        iconSvg: extra.iconSvg || selectEl.dataset.icon || "", options, value: selectEl.value,
      });
    }

    static enhanceAll(root = document) {
      root.querySelectorAll("select[data-custom-select]").forEach((sel) => {
        const svg = sel.closest(".search-field")?.querySelector(":scope > svg");
        const iconSvg = svg ? svg.outerHTML : ""; svg?.remove();
        CustomSelect.enhance(sel, { iconSvg });
      });
    }
  }
  CustomSelect.enhanceAll();
  global.CustomSelect = CustomSelect;
})(window);
