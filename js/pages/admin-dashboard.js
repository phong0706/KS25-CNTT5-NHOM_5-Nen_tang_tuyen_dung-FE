/**
 * Logic Trang Quản trị Admin (pages/admin/dashboard.html)
 * Đồng bộ dữ liệu thật từ FastAPI (/api/users/stats, /api/users)
 */

document.addEventListener("DOMContentLoaded", () => {
  const totalUsersEl = document.getElementById("stat-total-users");
  const activeUsersEl = document.getElementById("stat-active-users");
  const totalCandidatesEl = document.getElementById("stat-total-candidates");
  const totalEmployersEl = document.getElementById("stat-total-employers");
  const totalAdminsEl = document.getElementById("stat-total-admins");

  const tableBody = document.getElementById("users-table-body");
  const searchInput = document.getElementById("search-user-input");
  const refreshBtn = document.getElementById("btn-refresh-admin");

  async function loadStats() {
    try {
      const stats = await api.get("/users/stats");
      if (totalUsersEl) totalUsersEl.textContent = stats.total_users;
      if (activeUsersEl) activeUsersEl.textContent = `${stats.active_users} tài khoản đang hoạt động`;
      if (totalCandidatesEl) totalCandidatesEl.textContent = stats.total_candidates;
      if (totalEmployersEl) totalEmployersEl.textContent = stats.total_employers;
      if (totalAdminsEl) totalAdminsEl.textContent = stats.total_admins;
    } catch (err) {
      console.error("[Admin Stats Error]", err);
    }
  }

  async function loadUsers() {
    if (!tableBody) return;
    tableBody.innerHTML = `<tr><td colspan="6" class="muted">Đang tải danh sách tài khoản...</td></tr>`;

    try {
      const q = searchInput ? searchInput.value.trim() : "";
      const users = await api.get("/users", q ? { q } : {});

      if (!users || users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="muted">Không tìm thấy tài khoản nào</td></tr>`;
        return;
      }

      const currentUser = typeof Auth !== "undefined" ? Auth.getUser() : null;

      tableBody.innerHTML = users
        .map((u) => {
          const roleClass =
            u.role === "admin" ? "badge-admin" : u.role === "employer" ? "badge-recruiter" : "badge-candidate";
          const roleText = u.role === "employer" ? "RECRUITER" : u.role.toUpperCase();
          const statusHtml = u.is_active
            ? `<span style="color: #059669; font-weight: 600;">● Hoạt động</span>`
            : `<span style="color: #e11d48; font-weight: 600;">● Đã khoá</span>`;

          const isSelf = currentUser && currentUser.id === u.id;
          const actionBtnHtml = isSelf
            ? `<span class="muted" style="font-size: 12px;">(Đang đăng nhập)</span>`
            : `<button class="btn btn-small ${u.is_active ? "btn-danger" : ""}" data-action="toggle" data-id="${u.id}" data-active="${u.is_active ? "1" : "0"}" data-name="${escapeHtml(u.full_name)}">
                 ${u.is_active ? "Khoá" : "Mở khoá"}
               </button>`;

          return `
            <tr>
              <td>#${u.id}</td>
              <td><strong>${escapeHtml(u.full_name)}</strong></td>
              <td>${escapeHtml(u.email)}</td>
              <td><span class="user-role-badge ${roleClass}">${roleText}</span></td>
              <td>${statusHtml}</td>
              <td class="actions">${actionBtnHtml}</td>
            </tr>
          `;
        })
        .join("");
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-error">Lỗi tải dữ liệu: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // Xử lý Khoá / Mở khoá tài khoản
  if (tableBody) {
    tableBody.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action='toggle']");
      if (!btn) return;
      const userId = btn.dataset.id;
      const isLocking = btn.dataset.active === "1";
      const userName = btn.dataset.name || `#${userId}`;

      if (isLocking && typeof showConfirmModal === "function") {
        const confirmed = await showConfirmModal({
          title: `Khoá tài khoản "${userName}"`,
          description: "Tài khoản sẽ bị vô hiệu hóa ngay lập tức và không thể đăng nhập cho đến khi được mở khoá lại.",
          confirmLabel: "Khoá tài khoản",
          cancelLabel: "Hủy",
        });
        if (!confirmed) return;
      }

      btn.disabled = true;
      try {
        await api.patch(`/users/${userId}/toggle-status`);
        if (typeof showToast === "function") {
          showToast("Đã cập nhật trạng thái tài khoản!", "success");
        }
        await Promise.all([loadStats(), loadUsers()]);
      } catch (err) {
        if (typeof showToast === "function") {
          showToast(err.message || "Không thể thay đổi trạng thái tài khoản", "error");
        }
        btn.disabled = false;
      }
    });
  }

  // Tìm kiếm người dùng (Debounce nhẹ)
  let searchTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadUsers, 300);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadStats();
      loadUsers();
    });
  }

  // Khởi chạy nạp dữ liệu ban đầu
  loadStats();
  loadUsers();
});

