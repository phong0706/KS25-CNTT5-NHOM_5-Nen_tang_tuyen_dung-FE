// Trang Quản lý người dùng (Admin)
//   GET  /api/users?role=&is_active=&keyword=&page=&page_size=  Danh sách + phân trang
//   POST /api/users/{id}/lock   {"locked_reason": "..."}        Khoá (kèm lý do)
//   POST /api/users/{id}/unlock                                Mở khoá
// Mọi endpoint cần Bearer token admin (lưu ở localStorage).

const el = (id) => document.getElementById(id);

const tokenInput = el("token-input");
const tokenStatus = el("token-status");
const filterRole = el("filter-role");
const filterStatus = el("filter-status");
const filterKeyword = el("filter-keyword");
const tableBody = el("user-table-body");
const paginationEl = el("pagination");

// Modal khoá
const lockModal = el("lock-modal");
const lockUserInfo = el("lock-user-info");
const lockReason = el("lock-reason");

const ROLE_LABEL = { candidate: "Ứng viên", employer: "Nhà tuyển dụng", admin: "Admin" };
let lockingUserId = null;
let currentPage = 1;
const pageSize = 20;

// ---------- Token ----------
function updateTokenStatus() {
  const token = localStorage.getItem("token");
  tokenStatus.textContent = token ? "✅ Đã lưu token" : "⚠️ Chưa có token";
  tokenInput.value = token || "";
}

el("btn-save-token").addEventListener("click", () => {
  const val = tokenInput.value.trim();
  if (!val) return showToast("Vui lòng dán token", "error");
  setAuthToken(val);
  updateTokenStatus();
  showToast("Đã lưu token");
});

el("btn-clear-token").addEventListener("click", () => {
  setAuthToken(null);
  updateTokenStatus();
  showToast("Đã xoá token");
});

// ---------- Đọc danh sách ----------
async function loadUsers(page = 1) {
  currentPage = page;
  tableBody.innerHTML = `<tr><td colspan="8" class="muted">Đang tải...</td></tr>`;
  try {
    const data = await api.get("/users", {
      role: filterRole.value || undefined,
      is_active: filterStatus.value || undefined,
      keyword: filterKeyword.value.trim() || undefined,
      page,
      page_size: pageSize,
    });
    renderUsers(data);
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-error">${escapeHtml(error.message)}</td></tr>`;
    paginationEl.innerHTML = "";
  }
}

function renderUsers(meta) {
  const users = meta.items;
  if (!users.length) {
    tableBody.innerHTML = `<tr><td colspan="8" class="muted">Chưa có tài khoản</td></tr>`;
    paginationEl.innerHTML = "";
    return;
  }
  tableBody.innerHTML = users.map((u) => {
    const locked = !u.is_active;
    return `
      <tr>
        <td>${u.id}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.full_name || "")}</td>
        <td>${escapeHtml(u.phone || "")}</td>
        <td>${escapeHtml(ROLE_LABEL[u.role] || u.role)}</td>
        <td>${locked
          ? `<span class="badge badge-locked">Đã khoá</span>`
          : `<span class="badge badge-active">Hoạt động</span>`}</td>
        <td class="muted">${locked ? escapeHtml(u.locked_reason || "") : "-"}</td>
        <td class="actions">
          <button class="btn btn-small ${locked ? "" : "btn-danger"}"
                  data-action="${locked ? "unlock" : "lock"}" data-id="${u.id}"
                  data-name="${escapeHtml(u.email)}">
            ${locked ? "Mở khoá" : "Khoá"}
          </button>
        </td>
      </tr>`;
  }).join("");
  renderPagination(meta);
}

function renderPagination({ page, total_pages, total }) {
  if (total_pages <= 1) {
    paginationEl.innerHTML = total ? `<span class="muted">${total} tài khoản</span>` : "";
    return;
  }
  const buttons = [];
  for (let p = 1; p <= total_pages; p++) {
    buttons.push(`<button class="btn btn-small ${p === page ? "btn-primary" : ""}" data-page="${p}">${p}</button>`);
  }
  paginationEl.innerHTML = `<span class="muted">${total} tài khoản</span>${buttons.join("")}`;
  paginationEl.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => loadUsers(Number(btn.dataset.page)));
  });
}

// ---------- Lọc / tìm kiếm ----------
el("btn-filter").addEventListener("click", () => loadUsers(1));
filterKeyword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadUsers(1);
});
// ---------- Sự kiện khoá / mở khoá ----------
tableBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === "lock") {
    const name = btn.dataset.name;
    lockUserInfo.textContent = `Bạn sắp khoá tài khoản ${name}`;
    lockReason.value = "";
    lockingUserId = id;
    lockModal.hidden = false;
    lockReason.focus();
  } else if (action === "unlock") {
    if (!confirm(`Mở khoá tài khoản #${id}?`)) return;
    unlockUser(id);
  }
});

el("btn-lock-confirm").addEventListener("click", async () => {
  if (!lockingUserId) return;
  const reason = lockReason.value.trim();
  if (!reason) return showToast("Nhập lý do khoá", "error");
  try {
    await api.post(`/users/${lockingUserId}/lock`, { locked_reason: reason });
    showToast("Đã khoá tài khoản");
    lockModal.hidden = true;
    lockingUserId = null;
    loadUsers(currentPage);
  } catch (err) {
    showToast(err.message, "error");
  }
});

el("btn-lock-cancel").addEventListener("click", () => {
  lockModal.hidden = true;
  lockingUserId = null;
});

async function unlockUser(id) {
  try {
    await api.post(`/users/${id}/unlock`);
    showToast("Đã mở khoá tài khoản");
    loadUsers(currentPage);
  } catch (err) {
    showToast(err.message, "error");
  }
}

lockModal.querySelector(".modal-backdrop").addEventListener("click", () => {
  lockModal.hidden = true;
  lockingUserId = null;
});

// ---------- Khởi chạy ----------
updateTokenStatus();
loadUsers();
