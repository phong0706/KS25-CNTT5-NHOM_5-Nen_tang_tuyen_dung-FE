/**
 * admin-interview.js - Điều khiển Quản trị Ngân hàng câu hỏi phỏng vấn (< 180 dòng).
 */
import { renderPagination } from "../components/pagination.js";
import { openConfirmModal } from "../components/confirmModal.js";
import { showStatusToast } from "../components/toast.js";

const state = { page: 1, q: "", category_id: "", level_id: "" };
let filterCatSelect = null, filterLvlSelect = null, formCatSelect = null, formLvlSelect = null;
let currentItems = [];
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

async function loadTable() {
  const tbody = document.getElementById("adm-table-body"), pagHost = document.getElementById("adm-pagination-host");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center; padding:24px;">Đang tải...</td></tr>`;

  try {
    const p = { page: state.page, page_size: 15 };
    if (state.q) p.q = state.q;
    if (state.category_id) p.category_id = Number(state.category_id);
    if (state.level_id) p.level_id = Number(state.level_id);

    const res = await window.api.get("/admin/interview-questions", p);
    currentItems = res.items || [];
    document.getElementById("adm-stat-total").textContent = res.total;
    document.getElementById("adm-stat-pub").textContent = currentItems.filter((i) => i.is_published).length;

    if (!currentItems.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center; padding:32px;">Không có câu hỏi nào.</td></tr>`;
      renderPagination(pagHost, { page: 1, totalPages: 0, total: 0 }, null);
      return;
    }

    tbody.innerHTML = currentItems.map((q) => `
      <tr>
        <td style="font-weight:600; color:var(--text-secondary);">${q.id}</td>
        <td><span class="q-tag-cat">${esc(q.category_name)}</span></td>
        <td><span class="q-tag-lvl">${esc(q.level_name)}</span></td>
        <td>
          <div style="font-weight:600; color:var(--text-primary); margin-bottom:4px;">${esc(q.question)}</div>
          <div class="muted" style="font-size:12.5px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${esc(q.answer_hint)}</div>
        </td>
        <td><span class="${q.is_published ? "badge-pub" : "badge-draft"}">${q.is_published ? "Xuất bản" : "Bản nháp"}</span></td>
        <td class="actions">
          <button type="button" class="btn btn-small" data-action="edit" data-id="${q.id}">Sửa</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete" data-id="${q.id}">Xóa</button>
        </td>
      </tr>
    `).join("");

    renderPagination(pagHost, { page: res.page, totalPages: res.total_pages, total: res.total }, (nextPage) => {
      state.page = nextPage; loadTable();
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-error" style="text-align:center; padding:24px;">${esc(err.message)}</td></tr>`;
  }
}

function openModal(isEdit = false, item = null) {
  const modal = document.getElementById("adm-form-modal");
  document.getElementById("efm-title-text").textContent = isEdit ? "Chỉnh sửa câu hỏi phỏng vấn" : "Thêm câu hỏi phỏng vấn mới";
  document.getElementById("form-qid").value = isEdit ? item.id : "";
  document.getElementById("form-question").value = isEdit ? item.question : "";
  document.getElementById("form-hint").value = isEdit ? item.answer_hint : "";
  document.getElementById("form-is-pub").checked = isEdit ? Boolean(item.is_published) : true;
  if (formCatSelect) formCatSelect.setValue(isEdit ? String(item.category_id) : "1");
  if (formLvlSelect) formLvlSelect.setValue(isEdit ? String(item.level_id) : "3");
  modal.hidden = false;
  modal.removeAttribute("hidden");
  document.getElementById("form-question").focus();
}

function closeModal() {
  const modal = document.getElementById("adm-form-modal");
  modal.hidden = true;
  modal.setAttribute("hidden", "");
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const qid = document.getElementById("form-qid").value;
  const question = document.getElementById("form-question").value.trim();
  const answer_hint = document.getElementById("form-hint").value.trim();
  const category_id = Number(formCatSelect ? formCatSelect.value : 1);
  const level_id = Number(formLvlSelect ? formLvlSelect.value : 3);
  const is_published = document.getElementById("form-is-pub").checked;

  if (!question || !answer_hint) {
    showStatusToast("Vui lòng điền đầy đủ câu hỏi và gợi ý.", "warning");
    return;
  }

  const submitBtn = document.getElementById("btn-submit-form");
  submitBtn.disabled = true;
  try {
    const payload = { category_id, level_id, question, answer_hint, is_published };
    if (qid) {
      await window.api.put(`/admin/interview-questions/${qid}`, payload);
      showStatusToast("Cập nhật câu hỏi thành công!", "success");
    } else {
      await window.api.post("/admin/interview-questions", payload);
      showStatusToast("Tạo mới câu hỏi thành công!", "success");
    }
    closeModal(); loadTable();
  } catch (err) {
    showStatusToast(err.message || "Lỗi lưu câu hỏi", "danger");
  } finally { submitBtn.disabled = false; }
}

function handleDelete(id) {
  const item = currentItems.find((i) => i.id === Number(id));
  openConfirmModal({
    title: "Xóa câu hỏi phỏng vấn?",
    description: `Bạn có chắc muốn xóa vĩnh viễn câu hỏi ID #${id}: "${item ? item.question.slice(0, 50) : ""}..."?`,
    confirmLabel: "Xóa vĩnh viễn",
    danger: true,
    onConfirm: async () => {
      try {
        await window.api.delete(`/admin/interview-questions/${id}`);
        showStatusToast("Đã xóa câu hỏi thành công!", "success");
        loadTable();
      } catch (err) { showStatusToast(err.message || "Không thể xóa câu hỏi", "danger"); }
    },
  });
}

async function initAdmin() {
  if (!window.Auth || !window.Auth.isAuthenticated()) {
    window.location.replace(`../../pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`);
    return;
  }
  if (window.Auth.getUser()?.role !== "admin") {
    window.location.replace("../../pages/403.html");
    return;
  }

  try {
    const [cats, lvls] = await Promise.all([window.api.get("/meta/categories"), window.api.get("/meta/levels")]);
    const catOpts = [{ value: "", label: "Tất cả lĩnh vực" }, ...cats.map((c) => ({ value: String(c.id), label: c.name }))];
    const lvlOpts = [{ value: "", label: "Tất cả cấp bậc" }, ...lvls.map((l) => ({ value: String(l.id), label: l.name }))];

    filterCatSelect = new window.CustomSelect(document.getElementById("adm-cat-filter-host"), { options: catOpts, value: "", placeholder: "Tất cả lĩnh vực" });
    filterCatSelect.hiddenInput?.addEventListener("change", (e) => { state.category_id = e.target.value; state.page = 1; loadTable(); });

    filterLvlSelect = new window.CustomSelect(document.getElementById("adm-lvl-filter-host"), { options: lvlOpts, value: "", placeholder: "Tất cả cấp bậc" });
    filterLvlSelect.hiddenInput?.addEventListener("change", (e) => { state.level_id = e.target.value; state.page = 1; loadTable(); });

    formCatSelect = new window.CustomSelect(document.getElementById("form-cat-host"), { options: cats.map((c) => ({ value: String(c.id), label: c.name })), value: "1" });
    formLvlSelect = new window.CustomSelect(document.getElementById("form-lvl-host"), { options: lvls.map((l) => ({ value: String(l.id), label: l.name })), value: "3" });
  } catch {}

  let searchTimer = null;
  document.getElementById("adm-search-input")?.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; loadTable(); }, 300);
  });

  document.getElementById("btn-add-question")?.addEventListener("click", () => openModal(false));
  document.getElementById("btn-close-modal")?.addEventListener("click", closeModal);
  document.getElementById("btn-cancel-form")?.addEventListener("click", closeModal);
  document.getElementById("adm-question-form")?.addEventListener("submit", handleFormSubmit);

  document.getElementById("adm-table-body")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "edit") {
      const it = currentItems.find((i) => i.id === Number(btn.dataset.id));
      if (it) openModal(true, it);
    } else if (btn.dataset.action === "delete") {
      handleDelete(btn.dataset.id);
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("adm-form-modal").hidden) closeModal();
  });

  loadTable();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initAdmin);
} else {
  initAdmin();
}
