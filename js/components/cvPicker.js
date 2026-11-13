/**
 * cvPicker.js - Bộ chọn CV bằng radio cards chuẩn Accessibility (WAI-ARIA).
 * Tuân thủ quy định: < 200 dòng, không hardcode danh sách CV.
 */

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

export class CvPicker {
  constructor({ container, onSelect, onEmpty, getApiUrl }) {
    this.container = container;
    this.onSelect = onSelect;
    this.onEmpty = onEmpty;
    this.getApiUrl = getApiUrl || ((id) => {
      const token = localStorage.getItem("auth_token") || "";
      const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
      return `${base}/candidate/cvs/${id}/file?token=${encodeURIComponent(token)}`;
    });
    this.cvs = [];
    this.selectedCvId = null;
  }

  async load() {
    this.container.innerHTML = `
      <div class="cv-picker-loading" aria-live="polite">
        <span class="cv-picker-spinner" aria-hidden="true"></span>
        <span>Đang tải danh sách CV...</span>
      </div>
    `;
    try {
      const res = await http.get("/candidate/cvs");
      this.cvs = Array.isArray(res.data) ? res.data : [];
      if (this.cvs.length === 0) {
        this.container.innerHTML = "";
        this.onEmpty?.(true);
        return;
      }
      this.onEmpty?.(false);
      // Mặc định chọn CV có is_default hoặc CV đầu tiên
      const def = this.cvs.find((c) => c.is_default) || this.cvs[0];
      this.selectedCvId = def ? def.id : null;
      this.render();
      if (this.selectedCvId) {
        this.onSelect?.(this.getSelectedCv());
      }
    } catch (err) {
      this.container.innerHTML = `
        <div class="cv-picker-error" role="alert">
          <p>Không thể tải danh sách CV. ${escapeHtml(err.message || "")}</p>
          <button type="button" class="btn btn-sm btn-outline cv-picker-retry-btn">Thử lại</button>
        </div>
      `;
      this.container.querySelector(".cv-picker-retry-btn")?.addEventListener("click", () => this.load());
    }
  }

  getSelectedCv() {
    return this.cvs.find((c) => c.id === this.selectedCvId) || null;
  }

  addAndSelect(newCv) {
    if (!newCv) return;
    this.cvs.unshift(newCv);
    this.onEmpty?.(false);
    this.selectedCvId = newCv.id;
    this.render();
    this.onSelect?.(newCv);
  }

  select(id) {
    this.selectedCvId = Number(id);
    this.updateSelection();
    this.onSelect?.(this.getSelectedCv());
  }

  updateSelection() {
    const items = this.container.querySelectorAll(".cv-radio-card");
    items.forEach((card) => {
      const cardId = Number(card.dataset.cvId);
      const isSelected = cardId === this.selectedCvId;
      card.setAttribute("aria-checked", isSelected ? "true" : "false");
      card.setAttribute("tabindex", isSelected ? "0" : "-1");
      card.classList.toggle("is-selected", isSelected);
      const radioInput = card.querySelector('input[type="radio"]');
      if (radioInput) radioInput.checked = isSelected;
    });
  }

  render() {
    const html = `
      <div class="cv-picker-list" role="radiogroup" aria-label="Danh sách CV của bạn">
        ${this.cvs.map((cv) => {
          const isSelected = cv.id === this.selectedCvId;
          const previewUrl = this.getApiUrl(cv.id);
          return `
            <div
              class="cv-radio-card ${isSelected ? "is-selected" : ""}"
              role="radio"
              aria-checked="${isSelected ? "true" : "false"}"
              tabindex="${isSelected ? "0" : "-1"}"
              data-cv-id="${cv.id}"
            >
              <div class="cv-radio-left">
                <span class="cv-radio-indicator" aria-hidden="true">
                  <input
                    type="radio"
                    name="selected_cv"
                    value="${cv.id}"
                    ${isSelected ? "checked" : ""}
                    tabindex="-1"
                    aria-hidden="true"
                  />
                  <span class="cv-radio-dot"></span>
                </span>
                <div class="cv-radio-info">
                  <div class="cv-radio-title-row">
                    <span class="cv-radio-filename" title="${escapeHtml(cv.original_name)}">
                      ${escapeHtml(cv.original_name)}
                    </span>
                    ${cv.is_default ? '<span class="cv-badge-default">Mặc định</span>' : ""}
                  </div>
                  <div class="cv-radio-meta">
                    <span>${formatBytes(cv.size_bytes)}</span>
                    <span class="cv-meta-dot">·</span>
                    <span>Tải lên ${formatDate(cv.created_at)}</span>
                  </div>
                </div>
              </div>
              <div class="cv-radio-right">
                <a
                  href="${previewUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="cv-btn-preview"
                  title="Xem trước CV trong tab mới"
                  aria-label="Xem trước ${escapeHtml(cv.original_name)} trong tab mới"
                  tabindex="0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Xem</span>
                </a>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    const cards = Array.from(this.container.querySelectorAll(".cv-radio-card"));
    cards.forEach((card, idx) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".cv-btn-preview")) return;
        this.select(card.dataset.cvId);
      });

      card.addEventListener("keydown", (e) => {
        if (["Enter", " "].includes(e.key)) {
          e.preventDefault();
          this.select(card.dataset.cvId);
        } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          const next = cards[(idx + 1) % cards.length];
          next.focus();
          this.select(next.dataset.cvId);
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          const prev = cards[(idx - 1 + cards.length) % cards.length];
          prev.focus();
          this.select(prev.dataset.cvId);
        }
      });
    });
  }
}

