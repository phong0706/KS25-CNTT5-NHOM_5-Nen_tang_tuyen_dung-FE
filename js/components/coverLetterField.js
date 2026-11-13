/**
 * coverLetterField.js - Ô nhập thư giới thiệu: đếm ký tự x/1000, mẫu thư, tự lưu nháp MySQL.
 * Giới hạn: < 200 dòng.
 */

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

export class CoverLetterField {
  constructor({ container, jobId, onChange }) {
    this.container = container;
    this.jobId = jobId;
    this.onChange = onChange;
    this.saveTimer = null;
    this.initialValue = "";
    this.templates = [];
    this.render();
    this.loadTemplates();
    this.loadDraft();
  }

  render() {
    this.container.innerHTML = `
      <div class="cl-field-wrapper">
        <div class="cl-header-row">
          <label for="apply-cover-letter" class="cl-label">
            <span>Thư giới thiệu</span>
            <span class="cl-opt">(không bắt buộc)</span>
          </label>
          <div class="cl-header-actions">
            <span id="cl-save-status" class="cl-save-status" aria-live="polite"></span>
            <button type="button" class="btn btn-sm btn-ghost cl-template-btn" id="cl-template-btn" aria-haspopup="menu" aria-expanded="false" hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>Dùng mẫu</span>
            </button>
            <div id="cl-template-menu" class="cl-template-menu" role="menu" hidden></div>
          </div>
        </div>
        <textarea
          id="apply-cover-letter"
          class="cl-textarea"
          rows="4"
          maxlength="1000"
          placeholder="Giới thiệu nhanh kinh nghiệm nổi bật hoặc lý do bạn quan tâm đến vị trí này..."
        ></textarea>
        <div class="cl-footer-row">
          <span class="cl-footer-hint">Tối đa 1000 ký tự. Hệ thống tự động lưu nháp.</span>
          <span id="cl-count" class="cl-count">0/1000</span>
        </div>
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    const textarea = this.container.querySelector("#apply-cover-letter");
    const countEl = this.container.querySelector("#cl-count");
    const tplBtn = this.container.querySelector("#cl-template-btn");
    const tplMenu = this.container.querySelector("#cl-template-menu");

    textarea.addEventListener("input", () => {
      const len = textarea.value.length;
      countEl.textContent = `${len}/1000`;
      this.onChange?.(textarea.value);
      this.scheduleAutoSave(textarea.value);
    });

    tplBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = tplMenu.hidden;
      tplMenu.hidden = !isHidden;
      tplBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) {
        tplMenu.hidden = true;
        tplBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  async loadTemplates() {
    const tplBtn = this.container.querySelector("#cl-template-btn");
    const tplMenu = this.container.querySelector("#cl-template-menu");
    try {
      const res = await http.get("/candidate/cover-letter-templates");
      this.templates = Array.isArray(res.data) ? res.data : [];
      if (this.templates.length === 0) {
        tplBtn.hidden = true;
        return;
      }
      tplBtn.hidden = false;
      tplMenu.innerHTML = this.templates.map((t) => `
        <button type="button" class="cl-tpl-item" role="menuitem" data-id="${t.id}">
          <span class="cl-tpl-title">${escapeHtml(t.title)}</span>
          <span class="cl-tpl-snippet">${escapeHtml(t.content.slice(0, 70))}...</span>
        </button>
      `).join("");

      tplMenu.querySelectorAll(".cl-tpl-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const tpl = this.templates.find((t) => t.id === Number(btn.dataset.id));
          if (tpl) {
            this.setValue(tpl.content);
            tplMenu.hidden = true;
            tplBtn.setAttribute("aria-expanded", "false");
          }
        });
      });
    } catch {
      tplBtn.hidden = true;
    }
  }

  async loadDraft() {
    if (!this.jobId) return;
    try {
      const res = await http.get(`/candidate/cover-letter-draft/${this.jobId}`);
      if (res.data?.cover_letter) {
        this.setValue(res.data.cover_letter, false);
        this.initialValue = res.data.cover_letter;
        const statusEl = this.container.querySelector("#cl-save-status");
        if (statusEl) statusEl.textContent = "Đã nạp bản nháp";
      }
    } catch {}
  }

  scheduleAutoSave(content) {
    if (!this.jobId) return;
    const statusEl = this.container.querySelector("#cl-save-status");
    if (statusEl) statusEl.textContent = "Đang lưu...";
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(async () => {
      try {
        await http.put(`/candidate/cover-letter-draft/${this.jobId}`, { cover_letter: content });
        if (statusEl) statusEl.textContent = "Đã lưu nháp";
        this.initialValue = content;
      } catch {
        if (statusEl) statusEl.textContent = "Lỗi lưu nháp";
      }
    }, 600);
  }

  setValue(val, triggerSave = true) {
    const textarea = this.container.querySelector("#apply-cover-letter");
    const countEl = this.container.querySelector("#cl-count");
    if (!textarea) return;
    textarea.value = val.slice(0, 1000);
    countEl.textContent = `${textarea.value.length}/1000`;
    this.onChange?.(textarea.value);
    if (triggerSave) this.scheduleAutoSave(textarea.value);
  }

  getValue() {
    const textarea = this.container.querySelector("#apply-cover-letter");
    return textarea ? textarea.value.trim() : "";
  }

  isDirty() {
    const current = this.getValue();
    return current.length > 0 && current !== this.initialValue.trim();
  }
}

