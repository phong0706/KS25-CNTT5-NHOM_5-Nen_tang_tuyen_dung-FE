/**
 * Trình tạo CV tương tác 2 cột: Form & Live A4 Preview.
 * Tuân thủ techrecruit-rules: OCC versioning 409, tự lưu 30s, cấm confirm/alert, file <200 dòng.
 */
import { DEMO_CV_DATA, normalizeCvData } from "../cv/cvMockData.js";
import { renderCvDocument } from "../cv/cvTemplates.js";
import { bindForm } from "../cv/cvBuilderForm.js";

let state = {
  docId: null,
  templateSlug: "simple",
  title: "CV Ứng tuyển IT",
  version: 1,
  data: JSON.parse(JSON.stringify(DEMO_CV_DATA)),
  dirty: false,
  isSaving: false,
};

function updatePreview() {
  const previewSheet = document.getElementById("cv-preview-sheet");
  if (!previewSheet) return;
  previewSheet.innerHTML = renderCvDocument(state.templateSlug, state.data);
}

function setStatus(text, isError = false) {
  const el = document.getElementById("save-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "#ef4444" : "var(--text-tertiary)";
}

async function saveDocument() {
  if (state.isSaving) return;
  const user = window.Auth ? window.Auth.getUser() : null;
  if (!user) {
    if (window.showToast) window.showToast("Hãy đăng nhập để lưu CV trực tuyến vào tài khoản", "info");
    return;
  }

  state.isSaving = true;
  setStatus("Đang lưu...");

  try {
    const payload = {
      title: state.title.trim() || "CV Ứng tuyển IT",
      template_slug: state.templateSlug,
      content_json: JSON.stringify(state.data),
    };

    if (!state.docId) {
      const res = await window.api.post("/candidate/cv-documents", payload);
      state.docId = res.id;
      state.version = res.version;
      state.dirty = false;
      const url = new URL(window.location);
      url.searchParams.set("id", state.docId);
      window.history.replaceState({}, "", url);
      setStatus(`Đã lưu lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`);
    } else {
      const res = await window.api.put(`/candidate/cv-documents/${state.docId}`, {
        ...payload,
        version: state.version,
      });
      state.version = res.version;
      state.dirty = false;
      setStatus(`Đã lưu lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`);
    }
  } catch (err) {
    if (err && err.status === 409) {
      setStatus("Xung đột phiên bản (409)!", true);
      if (window.showToast) {
        window.showToast("Tài liệu đã được chỉnh sửa ở phiên khác. Vui lòng tải lại trang để tránh ghi đè.", "error");
      }
    } else {
      setStatus("Lỗi khi lưu!", true);
      if (window.showToast) window.showToast("Không thể lưu tài liệu CV", "error");
    }
  } finally {
    state.isSaving = false;
  }
}

async function initBuilderPage() {
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get("id");
  const paramTpl = params.get("template");

  if (paramTpl) state.templateSlug = paramTpl;

  const user = window.Auth ? window.Auth.getUser() : null;

  // 1. Tải dữ liệu từ CV cũ hoặc Profile ứng viên
  if (paramId) {
    try {
      const res = await window.api.get(`/candidate/cv-documents/${paramId}`);
      if (res) {
        state.docId = res.id;
        state.title = res.title;
        state.templateSlug = res.template_slug;
        state.version = res.version;
        state.data = normalizeCvData(JSON.parse(res.content_json));
      }
    } catch {
      if (window.showToast) window.showToast("Không tìm thấy CV yêu cầu, khởi tạo bản mới", "error");
    }
  } else if (user) {
    try {
      const res = await window.api.get("/candidate/profile");
      if (res) {
        state.data = normalizeCvData(res);
      }
    } catch {
      state.data = JSON.parse(JSON.stringify(DEMO_CV_DATA));
    }
  }

  // 2. Gắn tiêu đề tài liệu lên input
  const titleInput = document.getElementById("doc-title-input");
  if (titleInput) {
    titleInput.value = state.title;
    titleInput.addEventListener("input", (e) => {
      state.title = e.target.value;
      state.dirty = true;
    });
  }

  // 3. Khởi tạo chọn Template bằng CustomSelect (tuân thủ techrecruit-rules: cấm <select> gốc)
  const tplHost = document.getElementById("template-switcher-host");
  if (tplHost && window.CustomSelect) {
    new window.CustomSelect(tplHost, {
      name: "template_slug",
      placeholder: "Chọn mẫu CV",
      options: [
        { value: "simple", label: "Đơn giản (Chuẩn ATS)" },
        { value: "creative", label: "Ấn tượng (2 cột)" },
        { value: "professional", label: "Chuyên nghiệp" },
        { value: "academic", label: "Học thuật (Chuẩn ATS)" },
      ],
      value: state.templateSlug,
      onChange: (val) => {
        state.templateSlug = val;
        state.dirty = true;
        updatePreview();
        const url = new URL(window.location);
        url.searchParams.set("template", state.templateSlug);
        window.history.replaceState({}, "", url);
      },
    });
  }

  // 4. Render Form & Preview ban đầu
  const formBox = document.getElementById("cv-form-container");
  bindForm(formBox, state.data, () => {
    state.dirty = true;
    updatePreview();
  });
  updatePreview();

  // 5. Nút bấm thanh công cụ
  const saveBtn = document.getElementById("btn-manual-save");
  if (saveBtn) saveBtn.addEventListener("click", () => saveDocument());

  const printBtn = document.getElementById("btn-print-pdf");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // 6. Tự động lưu mỗi 30s
  setInterval(() => {
    if (state.dirty && !state.isSaving && user) {
      saveDocument();
    }
  }, 30000);
}

document.addEventListener("DOMContentLoaded", initBuilderPage);
