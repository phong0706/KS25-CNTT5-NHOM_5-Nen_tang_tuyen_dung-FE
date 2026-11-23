/**
 * Quản lý tài khoản: tìm kiếm, lọc, phân trang và khoá/mở khoá.
 */
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("users-table-body");
  const tableWrap = document.getElementById("users-table-wrap");
  const searchInput = document.getElementById("search-user-input");
  const roleFilter = document.getElementById("filter-role");
  const statusFilter = document.getElementById("filter-status");
  const refreshButton = document.getElementById("btn-refresh-users");
  if (!tableBody) return;

  const pageSize = 20;
  let currentPage = 1;
  let latestRequest = 0;
  let searchTimer;

  function showMessage(message, isError = false) {
    tableBody.innerHTML = `<tr><td colspan="6" class="${isError ? "text-error" : "muted"} admin-table-message">${escapeHtml(message)}</td></tr>`;
  }

  function getUsersPayload(result) {
    if (Array.isArray(result)) return { items: result };
    if (result && Array.isArray(result.items)) return result;
    if (result && result.data) {
      if (Array.isArray(result.data)) return { items: result.data };
      if (Array.isArray(result.data.items)) return result.data;
    }
    return null;
  }

  async function loadUsers() {
    const requestId = ++latestRequest;
    const oldPagination = tableWrap && tableWrap.parentElement.querySelector(".admin-pagination");
    if (oldPagination) oldPagination.remove();
    showMessage("Đang tải danh sách...");

    const params = { page: currentPage, page_size: pageSize };
    const keyword = searchInput ? searchInput.value.trim() : "";
    if (keyword) params.q = keyword;
    if (roleFilter && roleFilter.value) params.role = roleFilter.value;
    if (statusFilter && statusFilter.value !== "") params.is_active = statusFilter.value === "true";

    try {
      const result = await api.get("/users", params);
      if (requestId !== latestRequest) return;
      const payload = getUsersPayload(result);
      if (!payload) {
        console.error("[AdminUsers] API /users trả về dữ liệu không đúng định dạng:", result);
        showMessage("Máy chủ trả về danh sách người dùng không đúng định dạng.", true);
        return;
      }

      const users = payload.items;
      const total = Number.isFinite(Number(payload.total)) ? Number(payload.total) : users.length;
      const totalPages = Math.max(1, Number(payload.total_pages) || Math.ceil(total / pageSize));
      if (currentPage > totalPages) {
        currentPage = totalPages;
        await loadUsers();
        return;
      }

      if (users.length === 0) {
        showMessage("Không tìm thấy tài khoản phù hợp.");
      } else {
        renderUsers(users);
      }
      renderPagination(totalPages, total);
    } catch (error) {
      if (requestId === latestRequest) showMessage(`Lỗi tải dữ liệu: ${error.message}`, true);
    }
  }

  function renderUsers(users) {
    if (!Array.isArray(users)) {
      showMessage("Máy chủ trả về danh sách người dùng không đúng định dạng.", true);
      return;
    }
    const currentUser = typeof Auth !== "undefined" ? Auth.getUser() : null;
    const roleLabels = { candidate: "Ứng viên", employer: "Nhà tuyển dụng", admin: "Quản trị viên" };
    tableBody.innerHTML = users.map((user) => {
      const active = Boolean(user.is_active);
      const ownAccount = currentUser && String(currentUser.id) === String(user.id);
      const action = ownAccount
        ? `<span class="muted">Tài khoản của bạn</span>`
        : `<button class="btn btn-small ${active ? "btn-danger" : "btn-primary"}" type="button" data-action="toggle" data-id="${escapeHtml(user.id)}" data-active="${active ? "1" : "0"}" data-name="${escapeHtml(user.full_name || user.email || "")}">${active ? "Khoá" : "Mở khoá"}</button>`;
      const joined = user.created_at && typeof formatDateTime === "function" ? formatDateTime(user.created_at) : "—";
      return `<tr>
        <td><code>#${escapeHtml(user.id)}</code></td>
        <td><strong>${escapeHtml(user.full_name || "Chưa cập nhật")}</strong><div class="admin-user-meta">Tham gia: ${escapeHtml(joined)}</div></td>
        <td>${escapeHtml(user.email || "—")}</td>
        <td><span class="admin-role ${user.role === "admin" ? "is-admin" : user.role === "employer" ? "is-employer" : ""}">${escapeHtml(roleLabels[user.role] || "Khác")}</span></td>
        <td><span class="admin-status${active ? "" : " is-inactive"}">${active ? "Hoạt động" : "Đã khoá"}</span></td>
        <td class="actions">${action}</td>
      </tr>`;
    }).join("");
  }

  function renderPagination(totalPages, total) {
    if (!tableWrap) return;
    const nav = document.createElement("nav");
    nav.className = "admin-pagination";
    nav.setAttribute("aria-label", "Phân trang người dùng");
    const summary = document.createElement("span");
    summary.textContent = `Trang ${currentPage} / ${totalPages} · Tổng ${total} tài khoản`;
    nav.appendChild(summary);

    const pages = document.createElement("div");
    pages.className = "admin-pagination-pages";
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    for (let page = start; page <= end; page += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `btn btn-small btn-outline${page === currentPage ? " is-current" : ""}`;
      button.textContent = String(page);
      button.dataset.page = String(page);
      if (page === currentPage) button.setAttribute("aria-current", "page");
      pages.appendChild(button);
    }
    if (currentPage > 1) {
      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = "btn btn-small btn-outline";
      previous.textContent = "‹ Trước";
      previous.dataset.page = String(currentPage - 1);
      nav.appendChild(previous);
    }
    nav.appendChild(pages);
    if (currentPage < totalPages) {
      const next = document.createElement("button");
      next.type = "button";
      next.className = "btn btn-small btn-outline";
      next.textContent = "Sau ›";
      next.dataset.page = String(currentPage + 1);
      nav.appendChild(next);
    }
    tableWrap.insertAdjacentElement("afterend", nav);
  }

  tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action='toggle']");
    if (!button) return;
    const locking = button.dataset.active === "1";
    if (typeof showConfirmModal === "function") {
      const confirmed = await showConfirmModal({
        title: `${locking ? "Khoá" : "Mở khoá"} tài khoản`,
        description: locking
          ? `Tài khoản "${button.dataset.name}" sẽ không thể đăng nhập cho đến khi được mở khoá.`
          : `Cho phép tài khoản "${button.dataset.name}" đăng nhập và sử dụng hệ thống?`,
        confirmLabel: locking ? "Khoá tài khoản" : "Mở khoá",
        cancelLabel: "Hủy",
      });
      if (!confirmed) return;
    }

    button.disabled = true;
    try {
      await api.patch(`/users/${encodeURIComponent(button.dataset.id)}/toggle-status`);
      if (typeof showToast === "function") showToast(`Đã ${locking ? "khoá" : "mở khoá"} tài khoản.`, "success");
      await loadUsers();
    } catch (error) {
      if (typeof showToast === "function") showToast(error.message || "Không thể cập nhật tài khoản.", "error");
      button.disabled = false;
    }
  });

  if (tableWrap) {
    tableWrap.parentElement.addEventListener("click", (event) => {
      const button = event.target.closest(".admin-pagination button[data-page]");
      if (!button) return;
      currentPage = Number(button.dataset.page);
      loadUsers();
    });
  }
  if (searchInput) searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    currentPage = 1;
    searchTimer = window.setTimeout(loadUsers, 300);
  });
  [roleFilter, statusFilter].forEach((filter) => {
    if (filter) filter.addEventListener("change", () => {
      currentPage = 1;
      loadUsers();
    });
  });
  if (refreshButton) refreshButton.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (roleFilter) roleFilter.value = "";
    if (statusFilter) statusFilter.value = "";
    currentPage = 1;
    loadUsers();
  });

  loadUsers();
});
