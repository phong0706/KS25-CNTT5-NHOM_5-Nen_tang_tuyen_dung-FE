// Trang Items: ví dụ CRUD đầy đủ gọi sang backend.
//   Xem danh sách  -> GET    /items?q=...
//   Thêm           -> POST   /items
//   Sửa            -> PUT    /items/{id}
//   Xoá            -> DELETE /items/{id}
// Làm đề tài: copy file này + pages/items.html rồi đổi "items" thành tài nguyên của nhóm.

const form = document.getElementById("item-form");
const tableBody = document.getElementById("item-table-body");
const searchInput = document.getElementById("search-input");
const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("btn-submit");
const cancelButton = document.getElementById("btn-cancel");

let editingId = null; // null = đang thêm mới; có số = đang sửa item đó

// ---------- Đọc dữ liệu ----------
async function loadItems() {
  tableBody.innerHTML = `<tr><td colspan="5" class="muted">Đang tải...</td></tr>`;
  try {
    const keyword = searchInput.value.trim();
    // axios tự ghép params thành ?q=... (và tự mã hoá tiếng Việt)
    const items = await api.get("/items", keyword ? { q: keyword } : undefined);
    renderItems(items);
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-error">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderItems(items) {
  if (items.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 48px 20px;">
          <div style="color: var(--primary-700); margin-bottom: 10px; display: inline-flex;" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="14" width="44" height="36" rx="8" stroke="currentColor" stroke-width="2.5" stroke-opacity="0.35" />
              <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              <line x1="20" y1="36" x2="36" y2="36" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </svg>
          </div>
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Chưa có dữ liệu</div>
          <div class="muted" style="font-size: 13.5px;">Hãy thêm bản ghi mới hoặc thử từ khóa khác.</div>
        </td>
      </tr>
    `;
    return;
  }
  tableBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.id}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 12px;">
          ${getCompanyLogo({ name: item.company || item.name })}
          <div style="min-width: 0;">
            <strong>${escapeHtml(item.name)}</strong>
            <div class="muted">${escapeHtml(item.description)}</div>
          </div>
        </div>
      </td>
      <td class="text-right">${formatMoney(item.price)}</td>
      <td>${formatDateTime(item.created_at)}</td>
      <td class="actions">
        <button class="btn btn-small" data-action="edit" data-id="${item.id}">Sửa</button>
        <button class="btn btn-small btn-danger" data-action="delete" data-id="${item.id}">Xoá</button>
      </td>
    </tr>`).join("");
}

// ---------- Thêm / Sửa ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // không cho trình duyệt tự reload trang

  const data = {
    name: form.name.value.trim(),
    description: form.description.value.trim() || null,
    price: Number(form.price.value || 0),
  };

  submitButton.disabled = true;
  try {
    if (editingId === null) {
      await api.post("/items", data);
      showToast("Đã thêm item");
    } else {
      await api.put(`/items/${editingId}`, data);
      showToast("Đã cập nhật item");
    }
    resetForm();
    loadItems();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});

async function startEdit(id) {
  try {
    const item = await api.get(`/items/${id}`);
    editingId = id;
    form.name.value = item.name;
    form.description.value = item.description ?? "";
    form.price.value = item.price;
    formTitle.textContent = `Sửa item #${id}`;
    submitButton.textContent = "Lưu thay đổi";
    cancelButton.hidden = false;
    form.name.focus();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = "Thêm item mới";
  submitButton.textContent = "Thêm";
  cancelButton.hidden = true;
}

// ---------- Xoá ----------
async function deleteItem(id) {
  const confirmed = await showConfirmModal({
    title: `Xoá mục #${id}`,
    description: "Dữ liệu này sẽ bị xoá vĩnh viễn khỏi hệ thống và không thể khôi phục.",
    confirmLabel: "Xoá dữ liệu",
    cancelLabel: "Hủy",
  });
  if (!confirmed) return;
  try {
    await api.delete(`/items/${id}`);
    showToast("Đã xoá item");
    if (editingId === id) resetForm();
    loadItems();
  } catch (error) {
    showToast(error.message, "error");
  }
}

// Bắt sự kiện click cho các nút Sửa/Xoá trong bảng (event delegation)
tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") startEdit(id);
  if (button.dataset.action === "delete") deleteItem(id);
});

cancelButton.addEventListener("click", resetForm);

// Tìm kiếm: gõ xong 300ms mới gọi API (tránh gọi liên tục mỗi phím)
let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadItems, 300);
});

const initialQuery = new URLSearchParams(window.location.search).get("q");
if (initialQuery && searchInput) {
  searchInput.value = initialQuery;
}

loadItems();
