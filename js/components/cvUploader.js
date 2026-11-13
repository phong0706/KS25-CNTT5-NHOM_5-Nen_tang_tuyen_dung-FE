/**
 * cvUploader.js - Kéo thả & tải file CV với thanh tiến trình thật (XMLHttpRequest).
 * Giới hạn: < 200 dòng.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTS = [".pdf", ".doc", ".docx"];
const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export class CvUploader {
  constructor({ container, onUploaded, onError }) {
    this.container = container;
    this.onUploaded = onUploaded;
    this.onError = onError;
    this.xhr = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="cv-uploader-box" id="cv-drop-zone" tabindex="0" role="button" aria-label="Kéo thả hoặc chọn file CV">
        <input type="file" id="cv-file-input" class="cv-file-input" accept=".pdf,.doc,.docx" hidden />
        <div class="cv-uploader-idle">
          <svg class="cv-upload-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <div class="cv-upload-text">
            <span class="cv-upload-primary">Kéo thả CV vào đây hoặc <span class="cv-upload-browse">chọn từ máy tính</span></span>
            <span class="cv-upload-hint">Hỗ trợ PDF, DOC, DOCX (tối đa 5MB)</span>
          </div>
        </div>
        <div class="cv-uploader-progress" hidden aria-live="polite">
          <div class="cv-progress-top">
            <span class="cv-progress-name"></span>
            <span class="cv-progress-percent">0%</span>
          </div>
          <div class="cv-progress-track">
            <div class="cv-progress-bar" style="width: 0%"></div>
          </div>
        </div>
      </div>
      <div class="cv-uploader-error" role="alert" hidden></div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    const box = this.container.querySelector("#cv-drop-zone");
    const input = this.container.querySelector("#cv-file-input");

    box.addEventListener("click", () => input.click());
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        input.click();
      }
    });

    ["dragenter", "dragover"].forEach((evt) => {
      box.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        box.classList.add("is-dragging");
      });
    });

    ["dragleave", "drop"].forEach((evt) => {
      box.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        box.classList.remove("is-dragging");
      });
    });

    box.addEventListener("drop", (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) this.handleFile(files[0]);
    });

    input.addEventListener("change", () => {
      if (input.files && input.files.length > 0) {
        this.handleFile(input.files[0]);
        input.value = "";
      }
    });
  }

  showError(msg) {
    const errEl = this.container.querySelector(".cv-uploader-error");
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.hidden = !msg;
    this.onError?.(msg);
  }

  validate(file) {
    if (!file) return "Vui lòng chọn một file.";
    const name = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTS.some((ext) => name.endsWith(ext));
    const hasValidMime = !file.type || ALLOWED_MIMES.includes(file.type);
    if (!hasValidExt || !hasValidMime) {
      return "Định dạng file không hợp lệ. Vui lòng chọn file PDF, DOC hoặc DOCX.";
    }
    if (file.size > MAX_BYTES) {
      return "Dung lượng file vượt quá 5MB. Vui lòng chọn file nhỏ hơn.";
    }
    return null;
  }

  handleFile(file) {
    this.showError("");
    const validationError = this.validate(file);
    if (validationError) {
      this.showError(validationError);
      return;
    }
    this.upload(file);
  }

  upload(file) {
    const box = this.container.querySelector("#cv-drop-zone");
    const idleEl = this.container.querySelector(".cv-uploader-idle");
    const progEl = this.container.querySelector(".cv-uploader-progress");
    const nameEl = this.container.querySelector(".cv-progress-name");
    const pctEl = this.container.querySelector(".cv-progress-percent");
    const barEl = this.container.querySelector(".cv-progress-bar");

    idleEl.hidden = true;
    progEl.hidden = false;
    nameEl.textContent = file.name;
    pctEl.textContent = "0%";
    barEl.style.width = "0%";
    box.classList.add("is-uploading");

    const formData = new FormData();
    formData.append("file", file);

    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const token = localStorage.getItem("auth_token");

    this.xhr = new XMLHttpRequest();
    this.xhr.open("POST", `${base}/candidate/cvs`);
    if (token) this.xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    this.xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
        pctEl.textContent = `${percent}%`;
        barEl.style.width = `${percent}%`;
      }
    };

    this.xhr.onload = () => {
      box.classList.remove("is-uploading");
      if (this.xhr.status >= 200 && this.xhr.status < 300) {
        pctEl.textContent = "100%";
        barEl.style.width = "100%";
        try {
          const res = JSON.parse(this.xhr.responseText);
          window.setTimeout(() => {
            idleEl.hidden = false;
            progEl.hidden = true;
            this.onUploaded?.(res);
          }, 350);
        } catch {
          this.showError("Không thể đọc kết quả từ máy chủ.");
          idleEl.hidden = false;
          progEl.hidden = true;
        }
      } else {
        idleEl.hidden = false;
        progEl.hidden = true;
        let errMsg = "Tải file lên thất bại.";
        try {
          const errRes = JSON.parse(this.xhr.responseText);
          if (errRes.detail) errMsg = errRes.detail;
        } catch {}
        this.showError(errMsg);
      }
    };

    this.xhr.onerror = () => {
      box.classList.remove("is-uploading");
      idleEl.hidden = false;
      progEl.hidden = true;
      this.showError("Lỗi kết nối máy chủ khi tải file. Vui lòng thử lại.");
    };

    this.xhr.send(formData);
  }
}

