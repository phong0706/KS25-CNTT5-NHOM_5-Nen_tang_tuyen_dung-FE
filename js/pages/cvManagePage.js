/**
 * Quản lý danh sách CV cá nhân (/pages/candidate/cv-manage.html)
 * Tuân thủ techrecruit-rules: modal web chuẩn (cấm confirm/alert), skeleton, lỗi, trống, OCC-ready.
 */
import { getTemplateMeta } from "../cv/cvRenderHelpers.js";

let cvList = [];
let pendingAction = null; // { type: 'delete'|'rename', cvId, title }

function showModal(title, bodyHtml, onConfirm) {
  const overlay = document.getElementById("action-modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const confirmBtn = document.getElementById("modal-confirm-btn");
  if (!overlay || !modalTitle || !modalBody || !confirmBtn) return;

  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  overlay.style.display = "flex";

  const closeBtn = document.getElementById("modal-close-btn");
  const cancelBtn = document.getElementById("modal-cancel-btn");

  function hide() {
    overlay.style.display = "none";
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") hide();
  }

  closeBtn.onclick = hide;
  cancelBtn.onclick = hide;
  document.addEventListener("keydown", onKeyDown);

  confirmBtn.onclick = async () => {
    await onConfirm();
    hide();
  };

  const firstInput = modalBody.querySelector("input");
  if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

async function fetchDocuments() {
  const container = document.getElementById("cv-list-container");
  if (!container) return;

  container.innerHTML = `
    <div style="padding:48px; text-align:center; color:var(--text-tertiary);">
      <div class="skeleton" style="height:32px; width:220px; margin:0 auto 12px; border-radius:6px;"></div>
      <div class="skeleton" style="height:180px; width:100%; border-radius:12px;"></div>
    </div>`;

  try {
    const res = await window.api.get("/candidate/cv-documents");
    cvList = Array.isArray(res) ? res : (res?.data || []);
    renderList();
  } catch {
    container.innerHTML = `
      <div style="background:var(--bg); border:1px solid #fecaca; border-radius:12px; padding:36px; text-align:center;">
        <p style="color:#dc2626; font-size:14px; margin-bottom:14px;">Không thể tải danh sách tài liệu CV.</p>
        <button type="button" class="btn btn-outline" id="btn-retry-cv" style="font-size:13px;">Thử lại</button>
      </div>`;
    const btn = document.getElementById("btn-retry-cv");
    if (btn) btn.onclick = fetchDocuments;
  }
}

function renderList() {
  const container = document.getElementById("cv-list-container");
  if (!container) return;

  if (cvList.length === 0) {
    container.innerHTML = `
      <div style="background:var(--bg); border:1px solid var(--border-default); border-radius:16px; padding:48px 24px; text-align:center;">
        <div style="width:56px; height:56px; border-radius:50%; background:var(--primary-50, #f0fdf4); color:var(--primary-700, #0f766e); display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        </div>
        <h2 style="font-size:18px; font-weight:700; color:var(--text-primary); margin-bottom:8px;">Chưa có tài liệu CV nào</h2>
        <p style="font-size:14px; color:var(--text-secondary); max-width:480px; margin:0 auto 20px; line-height:1.5;">
          Bạn chưa tạo hồ sơ CV nào bằng trình tạo trực tiếp. Hãy chọn một trong các mẫu chuyên nghiệp để bắt đầu!
        </p>
        <a href="../../pages/cv-templates.html" class="btn btn-primary" style="padding:10px 20px; text-decoration:none; font-size:14px; font-weight:600;">
          Khám phá mẫu & Tạo CV ngay
        </a>
      </div>`;
    return;
  }

  const itemsHtml = cvList.map((doc) => {
    const meta = getTemplateMeta(doc.template_slug);
    const dateStr = window.formatDateTime ? window.formatDateTime(doc.updated_at) : doc.updated_at;

    return `
      <div class="cv-manage-item" style="background:var(--bg); border:1px solid var(--border-default); border-radius:12px; padding:18px 22px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; box-shadow:var(--shadow-sm); margin-bottom:14px;">
        <div style="flex:1; min-width:260px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <h3 style="font-size:16px; font-weight:700; color:var(--text-primary); margin:0;">${escapeHtml(doc.title)}</h3>
            <span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:11px; font-weight:600; padding:2px 7px; border-radius:4px;">v${doc.version}</span>
            <span class="badge" style="background:#f1f5f9; color:#475569; font-size:11.5px; padding:2px 8px; border-radius:4px;">Mẫu ${escapeHtml(meta.name)}</span>
          </div>
          <div style="font-size:12.5px; color:var(--text-tertiary);">
            Cập nhật gần nhất: <span>${escapeHtml(dateStr)}</span>
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <a href="../../pages/candidate/cv-builder.html?id=${doc.id}" class="btn btn-primary" style="font-size:13px; padding:7px 14px; text-decoration:none; font-weight:600;">Sửa CV</a>
          <button type="button" class="btn btn-outline" data-action="rename" data-id="${doc.id}" data-title="${escapeHtml(doc.title)}" style="font-size:13px; padding:7px 12px;">Đổi tên</button>
          <button type="button" class="btn btn-outline" data-action="duplicate" data-id="${doc.id}" style="font-size:13px; padding:7px 12px;">Nhân bản</button>
          <button type="button" class="btn btn-outline" data-action="delete" data-id="${doc.id}" data-title="${escapeHtml(doc.title)}" style="font-size:13px; padding:7px 12px; color:#dc2626; border-color:#fca5a5;">Xoá</button>
        </div>
      </div>`;
  }).join("");

  container.innerHTML = itemsHtml;
}

function setupActions() {
  const container = document.getElementById("cv-list-container");
  if (!container) return;

  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const title = btn.dataset.title;

    if (action === "delete") {
      showModal(
        "Xác nhận xoá tài liệu CV",
        `<p style="font-size:14px; color:var(--text-secondary); margin:0;">Bạn có chắc chắn muốn xoá tài liệu <strong>${escapeHtml(title)}</strong>? Hành động này không thể hoàn tác.</p>`,
        async () => {
          try {
            await window.api.delete(`/candidate/cv-documents/${id}`);
            if (window.showToast) window.showToast("Đã xoá tài liệu CV thành công", "success");
            fetchDocuments();
          } catch {
            if (window.showToast) window.showToast("Không thể xoá tài liệu", "error");
          }
        }
      );
    } else if (action === "rename") {
      showModal(
        "Đổi tên tài liệu CV",
        `<div class="cv-field">
          <label style="font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:6px; display:block;">Tên mới cho CV</label>
          <input type="text" id="rename-input" value="${escapeHtml(title)}" style="width:100%; padding:8px 12px; border:1px solid var(--border-default); border-radius:8px; font-size:13.5px;">
        </div>`,
        async () => {
          const input = document.getElementById("rename-input");
          const newTitle = input ? input.value.trim() : "";
          if (!newTitle) return;
          try {
            await window.api.patch(`/candidate/cv-documents/${id}/rename`, { title: newTitle });
            if (window.showToast) window.showToast("Đã cập nhật tên CV", "success");
            fetchDocuments();
          } catch {
            if (window.showToast) window.showToast("Không thể đổi tên CV", "error");
          }
        }
      );
    } else if (action === "duplicate") {
      try {
        await window.api.post(`/candidate/cv-documents/${id}/duplicate`);
        if (window.showToast) window.showToast("Đã nhân bản CV thành công", "success");
        fetchDocuments();
      } catch {
        if (window.showToast) window.showToast("Không thể nhân bản CV", "error");
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const user = window.Auth ? window.Auth.getUser() : null;
  if (!user) {
    window.location.href = `../../pages/login.html?redirect=pages/candidate/cv-manage.html`;
    return;
  }
  fetchDocuments();
  setupActions();
});
