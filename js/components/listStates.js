/**
 * Các trạng thái phụ cho danh sách tin: phân trang, trống (theo tab) và lỗi kết nối.
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

export function renderPagination(container, pagination, currentPage, onPageChange) {
  if (!container) return;
  if (!pagination || pagination.total_items === 0) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  const { page, page_size, total_items, total_pages } = pagination;
  const start = (page - 1) * page_size + 1;
  const end = Math.min(page * page_size, total_items);

  const pageButtons = [];
  for (let i = 1; i <= total_pages; i++) {
    pageButtons.push(`
      <button
        type="button"
        class="ej-page-btn ${i === page ? "is-active" : ""}"
        data-page="${i}"
        aria-label="Trang ${i}"
        ${i === page ? 'aria-current="page"' : ""}
      >${i}</button>
    `);
  }

  container.innerHTML = `
    <span class="ej-page-info">Hiển thị ${start}–${end} / ${total_items} tin</span>
    <div class="ej-page-controls">
      <button type="button" class="ej-page-btn" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="Trang trước">Trước</button>
      ${pageButtons.join("")}
      <button type="button" class="ej-page-btn" data-page="${page + 1}" ${page >= total_pages ? "disabled" : ""} aria-label="Trang sau">Sau</button>
    </div>
  `;

  container.querySelectorAll(".ej-page-btn[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const next = Number(btn.dataset.page);
      if (next >= 1 && next <= total_pages && next !== currentPage) {
        onPageChange(next);
      }
    });
  });
}

export function renderEmptyState(container, { status, query, tabs }, onClearFilter) {
  if (!container) return;
  const activeTab = (tabs || []).find((t) => t.key === status);
  const tabLabel = activeTab ? activeTab.label : "";
  const hasFilter = Boolean(query && query.trim());

  const title = hasFilter
    ? "Không tìm thấy tin phù hợp"
    : status === "all"
      ? "Bạn chưa có tin tuyển dụng nào"
      : `Chưa có tin ở trạng thái "${tabLabel}"`;

  const desc = hasFilter
    ? "Thử thay đổi từ khóa tìm kiếm hoặc chuyển sang tab trạng thái khác."
    : "Tạo tin tuyển dụng mới để tiếp cận các ứng viên công nghệ phù hợp.";

  const actionHtml = hasFilter
    ? `<button type="button" class="ej-btn-edit" id="ej-clear-filter-btn">Xóa từ khóa</button>`
    : `<a href="./job-form.html" class="ej-btn-primary">+ Đăng tin mới</a>`;

  container.innerHTML = `
    <div class="ej-state-box">
      <div class="ej-state-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
      </div>
      <h3 class="ej-state-title">${escapeText(title)}</h3>
      <p class="ej-state-desc">${escapeText(desc)}</p>
      ${actionHtml}
    </div>
  `;

  document.getElementById("ej-clear-filter-btn")?.addEventListener("click", () => {
    onClearFilter?.();
  });
}

export function renderErrorState(container, message, onRetry) {
  if (!container) return;
  container.removeAttribute("aria-busy");
  container.innerHTML = `
    <div class="ej-state-box ej-state-box--error" role="alert">
      <div class="ej-state-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <h3 class="ej-state-title">Không thể tải danh sách tin tuyển dụng</h3>
      <p class="ej-state-desc">${escapeText(message || "Lỗi kết nối máy chủ. Vui lòng thử lại.")}</p>
      <button type="button" class="ej-btn-primary" id="ej-retry-btn">Thử lại</button>
    </div>
  `;
  document.getElementById("ej-retry-btn")?.addEventListener("click", () => onRetry?.());
}

export function updateBulkBarUI(selectedIds, currentItems) {
  const bar = document.getElementById("ej-bulk-bar");
  const countEl = document.getElementById("ej-bulk-count");
  const selectAllEl = document.getElementById("ej-select-all");
  if (bar && countEl) {
    bar.hidden = selectedIds.size === 0;
    countEl.textContent = `Đã chọn ${selectedIds.size} tin`;
  }
  if (selectAllEl) {
    const visibleIds = (currentItems || []).map((i) => i.id);
    const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    selectAllEl.checked = allChecked;
  }
}

export function setupBulkBar({ selectedIds, getCurrentItems, openConfirmModal, showStatusToast, onReload }) {
  const selectAllEl = document.getElementById("ej-select-all");
  const clearBtn = document.getElementById("ej-bulk-clear");
  const bar = document.getElementById("ej-bulk-bar");

  selectAllEl?.addEventListener("change", () => {
    const items = getCurrentItems() || [];
    items.forEach((item) => {
      if (selectAllEl.checked) selectedIds.add(item.id);
      else selectedIds.delete(item.id);
    });
    document.querySelectorAll('input[data-select-job]').forEach((cb) => {
      cb.checked = selectedIds.has(Number(cb.dataset.selectJob));
    });
    updateBulkBarUI(selectedIds, items);
  });

  clearBtn?.addEventListener("click", () => {
    selectedIds.clear();
    document.querySelectorAll('input[data-select-job]').forEach((cb) => { cb.checked = false; });
    updateBulkBarUI(selectedIds, getCurrentItems());
  });

  const runBulk = async (action) => {
    const ids = Array.from(selectedIds);
    const res = await window.api.post("/employer/jobs/bulk", { job_ids: ids, action });
    selectedIds.clear();
    updateBulkBarUI(selectedIds, getCurrentItems());
    showStatusToast(res.message, "success");
    await onReload();
  };

  bar?.querySelectorAll("[data-bulk-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.bulkAction;
      const count = selectedIds.size;
      if (!action || count === 0) return;
      if (action === "hide") {
        runBulk("hide").catch((err) => showStatusToast(err?.message || "Thao tác thất bại.", "error", 3500));
        return;
      }
      const isDelete = action === "delete";
      openConfirmModal({
        title: isDelete ? `Xóa ${count} tin đã chọn?` : `Đóng ${count} tin đã chọn?`,
        description: isDelete
          ? "Chỉ các tin Nháp hoặc Đã đóng mới bị xóa vĩnh viễn và không thể khôi phục."
          : "Các tin Đang tuyển hoặc Đang ẩn sẽ chuyển sang Đã đóng và ngừng nhận hồ sơ.",
        confirmLabel: isDelete ? "Xóa hàng loạt" : "Đóng hàng loạt",
        danger: true,
        returnFocusTo: btn,
        onConfirm: () => runBulk(action),
      });
    });
  });
}

