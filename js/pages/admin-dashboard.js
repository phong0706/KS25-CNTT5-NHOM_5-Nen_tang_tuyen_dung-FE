/**
 * Logic Quản trị Hệ thống (pages/admin/dashboard.html)
 * Chuẩn hóa bảng người dùng, bộ lọc KPI, skeleton & error state (<= 200 dòng)
 */
document.addEventListener("DOMContentLoaded", () => {
  if (window.Auth && !window.Auth.requireAuth({ roles: ["admin"] })) return;

  const $ = (id) => document.getElementById(id);
  const totalUsersEl = $("stat-total-users"), activeUsersEl = $("stat-active-users");
  const candEl = $("stat-total-candidates"), empEl = $("stat-total-employers"), admEl = $("stat-total-admins");
  const tableBody = $("users-table-body"), tableCountEl = $("table-user-count");
  const searchInput = $("search-user-input"), roleSelect = $("filter-user-role");
  const statusSelect = $("filter-user-status"), refreshBtn = $("btn-refresh-admin");
  const statCards = document.querySelectorAll(".adm-stat-card");
  const statsFrom = $("admin-stats-from"), statsTo = $("admin-stats-to");
  const statsMessage = $("admin-stats-message");

  let allUsers = [];
  let latestStatsRequest = 0;
  const filterState = { q: "", role: "", status: "" };
  const ROLE_MAP = {
    admin: { label: "Quản trị viên", css: "admin" },
    employer: { label: "Nhà tuyển dụng", css: "employer" },
    candidate: { label: "Ứng viên", css: "candidate" },
  };

  function syncStats(users) {
    if (!Array.isArray(users)) return;
    if (totalUsersEl) totalUsersEl.textContent = users.length;
    if (activeUsersEl) activeUsersEl.textContent = `${users.filter((u) => u.is_active).length} đang hoạt động`;
    if (candEl) candEl.textContent = users.filter((u) => u.role === "candidate").length;
    if (empEl) empEl.textContent = users.filter((u) => u.role === "employer").length;
    if (admEl) admEl.textContent = users.filter((u) => u.role === "admin").length;
  }

  async function loadStats() {
    try {
      const s = await api.get("/users/stats");
      if (allUsers.length === 0) {
        if (totalUsersEl) totalUsersEl.textContent = s.total_users ?? 0;
        if (activeUsersEl) activeUsersEl.textContent = `${s.active_users ?? 0} đang hoạt động`;
        if (candEl) candEl.textContent = s.total_candidates ?? 0;
        if (empEl) empEl.textContent = s.total_employers ?? 0;
        if (admEl) admEl.textContent = s.total_admins ?? 0;
      }
    } catch (err) {
      console.error("[Admin Stats Error]", err);
    }
  }

  function localDateValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function renderStatsList(id, entries, formatEntry, emptyText) {
    const list = $(id);
    if (!list) return;
    list.replaceChildren();
    const values = entries || [];
    if (!values.length) {
      const item = document.createElement("li");
      item.textContent = emptyText;
      list.appendChild(item);
      return;
    }
    values.forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = formatEntry(entry);
      list.appendChild(item);
    });
  }

  async function loadDashboardStats() {
    const requestId = ++latestStatsRequest;
    if (statsMessage) statsMessage.textContent = "Đang tải thống kê...";
    const params = {};
    if (statsFrom?.value) params.from_date = statsFrom.value;
    if (statsTo?.value) params.to_date = statsTo.value;
    try {
      const stats = await api.get("/admin/dashboard/stats", params);
      if (requestId !== latestStatsRequest) return;
      $("admin-stat-new-users").textContent = stats.new_users_in_period;
      $("admin-stat-companies").textContent = stats.total_companies;
      $("admin-stat-jobs").textContent = stats.total_jobs;
      $("admin-stat-applications").textContent = stats.total_applications;
      const roleNames = { candidate: "Ứng viên", employer: "Nhà tuyển dụng", recruiter: "Nhà tuyển dụng", admin: "Quản trị viên" };
      renderStatsList(
        "admin-users-by-role",
        Object.entries(stats.users_by_role || {}),
        ([role, count]) => `${roleNames[role] || role}: ${count}`,
        "Chưa có dữ liệu người dùng."
      );
      renderStatsList(
        "admin-companies-by-industry",
        stats.companies_by_industry,
        (item) => `${item.industry_name}: ${item.count}`,
        "Chưa có dữ liệu công ty theo ngành."
      );
      renderStatsList(
        "admin-jobs-by-industry",
        stats.jobs_by_industry,
        (item) => `${item.category_name}: ${item.count}`,
        "Chưa có tin trong khoảng thời gian này."
      );
      renderStatsList(
        "admin-applications-by-day",
        stats.applications_by_day,
        (item) => `${item.date}: ${item.count}`,
        "Chưa có hồ sơ trong khoảng thời gian này."
      );
      statsMessage.textContent = "Tổng người dùng/vai trò, công ty và tổng tin là số liệu hiện tại; người dùng mới, số liệu ngành và hồ sơ áp dụng khoảng ngày đã chọn.";
    } catch (err) {
      if (requestId === latestStatsRequest && statsMessage) {
        statsMessage.textContent = err?.message || "Không thể tải thống kê hệ thống.";
      }
    }
  }

  function renderSkeleton() {
    if (!tableBody) return;
    const cols = ["60%", "80%", "55%", "45%", "70px"];
    tableBody.innerHTML = Array.from({ length: 4 }).map(() => `
      <tr class="adm-skeleton-row">
        ${cols.map((w, i) => `<td ${i === 4 ? 'class="adm-actions-cell"' : ''}><div class="adm-skeleton-bar" style="width:${w};${i === 4 ? 'margin-left:auto;' : ''}"></div></td>`).join("")}
      </tr>
    `).join("");
  }

  function getErrorMessage(err) {
    if (err?.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (err?.status === 403) return "Bạn không có quyền quản trị để xem danh sách tài khoản.";
    if (err?.status === 500) return "Máy chủ gặp sự cố khi xử lý dữ liệu. Vui lòng thử lại sau.";
    if (err?.status === 0 || err?.message?.includes("kết nối")) return "Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng và thử lại.";
    if (err?.message && !err.message.includes("is not a function") && !err.message.includes("undefined")) return err.message;
    return "Đã xảy ra lỗi trong quá trình nạp danh sách tài khoản. Vui lòng thử lại.";
  }

  function renderTable() {
    if (!tableBody) return;
    if (allUsers.length === 0) {
      if (tableCountEl) tableCountEl.textContent = "Chưa có tài khoản nào";
      tableBody.innerHTML = `<tr><td colspan="5"><div class="adm-state-box"><div class="adm-state-title">Chưa có tài khoản nào</div><p class="adm-state-desc">Hệ thống hiện tại chưa ghi nhận tài khoản người dùng nào.</p></div></td></tr>`;
      return;
    }

    const qLower = filterState.q.toLowerCase();
    const filtered = allUsers.filter((u) => {
      const matchRole = !filterState.role || u.role === filterState.role;
      const matchStatus = !filterState.status || (filterState.status === "active" ? u.is_active : !u.is_active);
      const matchQ = !qLower || (u.full_name && u.full_name.toLowerCase().includes(qLower)) || (u.email && u.email.toLowerCase().includes(qLower));
      return matchRole && matchStatus && matchQ;
    });

    if (tableCountEl) tableCountEl.textContent = `Hiển thị ${filtered.length} / ${allUsers.length} tài khoản`;

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5"><div class="adm-state-box"><div class="adm-state-title">Không tìm thấy tài khoản phù hợp</div><p class="adm-state-desc">${filterState.q ? `Không có kết quả nào với từ khóa "${escapeHtml(filterState.q)}".` : "Không có tài khoản nào phù hợp với bộ lọc hiện tại."}</p><button type="button" class="btn btn-outline btn-small" id="btn-clear-filters">Xóa bộ lọc</button></div></td></tr>`;
      $("btn-clear-filters")?.addEventListener("click", resetFilters);
      return;
    }

    const cur = typeof Auth !== "undefined" ? Auth.getUser() : null;
    tableBody.innerHTML = Array.isArray(filtered) ? filtered.map((u) => {
      const role = ROLE_MAP[u.role] || { label: u.role || "Chưa rõ", css: "candidate" };
      const statusHtml = u.is_active
        ? `<span class="status-indicator active"><span class="status-indicator-dot"></span>Hoạt động</span>`
        : `<span class="status-indicator locked"><span class="status-indicator-dot"></span>Đã khóa</span>`;
      const isSelf = cur && cur.id === u.id;
      const actionHtml = isSelf
        ? `<span class="muted" style="font-size: 12px; font-weight: 500;">(Đang đăng nhập)</span>`
        : `<button type="button" class="btn btn-small ${u.is_active ? "btn-danger" : "btn-outline"}" data-action="toggle" data-id="${u.id}" data-active="${u.is_active ? "1" : "0"}" data-name="${escapeHtml(u.full_name)}">${u.is_active ? "Khoá" : "Mở khoá"}</button>`;

      return `<tr><td><strong>${escapeHtml(u.full_name)}</strong></td><td>${escapeHtml(u.email)}</td><td><span class="role-pill ${role.css}">${role.label}</span></td><td>${statusHtml}</td><td class="adm-actions-cell">${actionHtml}</td></tr>`;
    }).join("") : "";
  }

  async function loadUsers() {
    renderSkeleton();
    try {
      const res = await api.get("/users", { page_size: 100 });
      let list = null;
      if (Array.isArray(res)) list = res;
      else if (res && Array.isArray(res.items)) list = res.items;
      else if (res && Array.isArray(res.data)) list = res.data;

      if (!Array.isArray(list)) throw new Error("Dữ liệu tài khoản trả về không đúng định dạng danh sách.");
      allUsers = list;
      syncStats(allUsers);
      renderTable();
    } catch (err) {
      if (!tableBody) return;
      tableBody.innerHTML = `<tr><td colspan="5"><div class="adm-state-box"><div class="adm-state-title">Không thể tải danh sách tài khoản</div><p class="adm-state-desc">${escapeHtml(getErrorMessage(err))}</p><button type="button" class="btn btn-primary btn-small" id="btn-retry-users">Thử lại</button></div></td></tr>`;
      $("btn-retry-users")?.addEventListener("click", () => { loadStats(); loadUsers(); });
    }
  }

  function setRoleFilter(role) {
    filterState.role = role;
    if (roleSelect && roleSelect.value !== role) roleSelect.value = role;
    statCards.forEach((c) => {
      const active = (c.dataset.role || "") === role;
      c.classList.toggle("is-active", active);
      c.setAttribute("aria-pressed", active ? "true" : "false");
    });
    renderTable();
  }

  function resetFilters() {
    filterState.q = ""; filterState.role = ""; filterState.status = "";
    if (searchInput) searchInput.value = "";
    if (statusSelect) statusSelect.value = "";
    setRoleFilter("");
  }

  statCards.forEach((card) => {
    card.addEventListener("click", () => setRoleFilter(card.dataset.role || ""));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRoleFilter(card.dataset.role || ""); }
    });
  });

  roleSelect?.addEventListener("change", (e) => setRoleFilter(e.target.value));
  statusSelect?.addEventListener("change", (e) => { filterState.status = e.target.value; renderTable(); });

  let searchTimer = null;
  searchInput?.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { filterState.q = e.target.value.trim(); renderTable(); }, 250);
  });

  refreshBtn?.addEventListener("click", async () => {
    refreshBtn.disabled = true;
    await Promise.all([loadStats(), loadUsers(), loadDashboardStats()]);
    refreshBtn.disabled = false;
    if (typeof showToast === "function") showToast("Đã đồng bộ dữ liệu mới nhất!", "info");
  });

  if (statsFrom && statsTo) {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 29);
    statsFrom.value = localDateValue(monthAgo);
    statsTo.value = localDateValue(today);
  }
  $("admin-stats-apply")?.addEventListener("click", loadDashboardStats);
  $("admin-stats-clear")?.addEventListener("click", () => {
    if (statsFrom) statsFrom.value = "";
    if (statsTo) statsTo.value = "";
    loadDashboardStats();
  });

  tableBody?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action='toggle']");
    if (!btn) return;
    const { id: userId, active, name: userName } = btn.dataset;
    const isLocking = active === "1";

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
      if (typeof showToast === "function") showToast(`Đã ${isLocking ? "khoá" : "mở khoá"} tài khoản thành công!`, "success");
      await Promise.all([loadStats(), loadUsers()]);
    } catch (err) {
      if (typeof showToast === "function") showToast(err.message || "Không thể thay đổi trạng thái tài khoản", "error");
      btn.disabled = false;
    }
  });

  loadStats();
  loadUsers();
  loadDashboardStats();
});