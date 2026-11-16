// Trang quản lý danh mục: 3 tab Ngành / Địa điểm / Kỹ năng.
//   GET    /api/industries|/locations|/skills          Danh sách
//   GET    /api/{type}/{id}                            Chi tiết (khi sửa)
//   POST   /api/{type}                                 Thêm mới {name, status}
//   PUT    /api/{type}/{id}                            Cập nhật
//   DELETE /api/{type}/{id}                            Xoá (soft delete -> inactive)
// Mọi endpoint đều yêu cầu Bearer token admin.

const API_ENDPOINTS = {
  industries: "/industries",
  locations: "/locations",
  skills: "/skills",
};

const el = (id) => document.getElementById(id);

const tabBtns = document.querySelectorAll(".tab");
const tableBody = el("catalog-table-body");
const infoEl = el("catalog-info");

// Modal
const catalogModal = el("catalog-modal");
const catalogModalTitle = el("catalog-modal-title");
const nameInput = el("catalog-name");
const statusSelect = el("catalog-status");
const btnSave = el("btn-catalog-save");
const btnCancel = el("btn-catalog-cancel");

let currentTab = "industries";
let editingId = null; // null = thêm mới, có số = đang sửa

// ---------- Chuyển tab ----------
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentTab = btn.dataset.tab;
    tabBtns.forEach((b) => b.classList.toggle("active", b === btn));
    loadCatalogs();
  });
});

// ---------- Đọc danh sách ----------
async function loadCatalogs() {
  tableBody.innerHTML = `<tr><td colspan="4" class="muted">Đang tải...</td></tr>`;
  try {
    const list = await api.get(API_ENDPOINTS[currentTab]);
    renderCatalogs(list);
    infoEl.textContent = `${list.length} mục`;
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="4" class="text-error">${escapeHtml(error.message)}</td></tr>`;
    infoEl.textContent = "";
  }
}

function renderCatalogs(list) {
  if (!list.length) {
    tableBody.innerHTML = `<tr><td colspan="4" class="muted">Chưa có dữ liệu</td></tr>`;
    return;
  }
  tableBody.innerHTML = list.map((item) => `
    <tr>
      <td>${item.id}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${item.status === "active"
        ? `<span class="badge badge-active">Hoạt động</span>`
        : `<span class="badge badge-locked">Đã ẩn</span>`}</td>
      <td class="actions">
        <button class="btn btn-small" data-action="edit" data-id="${item.id}">Sửa</button>
        <button class="btn btn-small btn-danger" data-action="delete" data-id="${item.id}">Xoá</button>
      </td>
    </tr>`).join("");
}
// ---------- Sự kiện nút Sửa / Xoá ----------
tableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === "edit") openEditModal(id);
  else if (action === "delete") deleteCatalog(id);
});

// ---------- Modal: Thêm / Sửa ----------
async function openEditModal(id) {
  const endpoint = API_ENDPOINTS[currentTab];
  const url = id ? `${endpoint}/${id}` : endpoint;
  try {
    const item = id ? await api.get(url) : null;
    editingId = id ?? null;
    catalogModalTitle.textContent = id ? "Sửa danh mục" : "Thêm danh mục mới";
    nameInput.value = item?.name || "";
    statusSelect.value = item?.status || "active";
    catalogModal.hidden = false;
    nameInput.focus();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function closeModal() {
  catalogModal.hidden = true;
  editingId = null;
  nameInput.value = "";
  statusSelect.value = "active";
}

btnCancel.addEventListener("click", closeModal);
catalogModal.querySelector(".modal-backdrop").addEventListener("click", closeModal);

btnSave.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const status = statusSelect.value;
  if (!name) return showToast("Tên không được để trống", "error");
  const endpoint = API_ENDPOINTS[currentTab];
  try {
    if (editingId) {
      await api.put(`${endpoint}/${editingId}`, { name, status });
      showToast("Đã cập nhật");
    } else {
      await api.post(endpoint, { name, status });
      showToast("Đã thêm mới");
    }
    closeModal();
    loadCatalogs();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// ---------- Xoá (soft delete) ----------
async function deleteCatalog(id) {
  if (!confirm("Xoá (ẩn) mục này?")) return;
  const endpoint = API_ENDPOINTS[currentTab];
  try {
    await api.delete(`${endpoint}/${id}`);
    showToast("Đã xoá");
    loadCatalogs();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ---------- Khởi chạy ----------
updateTokenStatus();
loadCatalogs();
// ---------- Gắn sự kiện nút Sửa / Xoá ----------
function attachCatalogEvents() {
  tableBody.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;
      if (action === "edit") openEditModal(id);
      else if (action === "delete") deleteCatalog(id);
    });
  });
}

// ---------- Mở modal thêm/sửa ----------
async function openEditModal(id) {
  const endpoint = API_ENDPOINTS[currentTab];
  try {
    const item = id ? await api.get(`${endpoint}/${id}`) : null;
    editingId = id ?? null;
    catalogModalTitle.textContent = id ? `Sửa ${currentTab}` : ` Thêm ${currentTab} mới`;
    nameInput.value = item ? item.name : "";
    statusSelect.value = item ? item.status : "active";
    catalogModal.hidden = false;
    nameInput.focus();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function closeModal() {
  catalogModal.hidden = true;
  editingId = null;
  nameInput.value = "";
  statusSelect.value = "active";
}

btnCancel.addEventListener("click", closeModal);
catalogModal.querySelector(".modal-backdrop").addEventListener("click", closeModal);

// ---------- Lưu thêm/sửa ----------
btnSave.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const status = statusSelect.value;
  if (!name) return showToast("Tên không được để trống", "error");
  const endpoint = API_ENDPOINTS[currentTab];
  try {
    if (editingId) {
      await api.put(`${endpoint}/${editingId}`, { name, status });
      showToast("Đã cập nhật");
    } else {
      await api.post(endpoint, { name, status });
      showToast("Đã thêm mới");
    }
    closeModal();
    loadCatalogs();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// ---------- Xoá ----------
async function deleteCatalog(id) {
  if (!confirm("Xoá (ẩn) mục này?")) return;
  const endpoint = API_ENDPOINTS[currentTab];
  try {
    await api.delete(`${endpoint}/${id}`);
    showToast("Đã xoá");
    loadCatalogs();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ---------- Khởi chạy ----------
loadCatalogs();
