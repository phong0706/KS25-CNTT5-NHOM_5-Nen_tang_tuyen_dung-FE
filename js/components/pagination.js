/**
 * pagination.js - Component phân trang server-side dùng chung toàn site (< 100 dòng).
 * Tuân thủ techrecruit-rules: vùng bấm >= 44px, phím điều hướng, aria-current, responsive < 640px.
 */

function buildPageRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

export function renderPagination(container, opts, onPageChange) {
  if (!container) return;
  const { page = 1, totalPages = 0, total = 0, pageSize = 10, entityName = "câu hỏi", summaryEl = null } = opts || {};

  // Cập nhật dòng tóm tắt số lượng nếu có
  if (summaryEl) {
    if (total > 0) {
      const from = (page - 1) * pageSize + 1;
      const to = Math.min(total, page * pageSize);
      summaryEl.textContent = `Hiển thị ${from}–${to} trong ${total} ${entityName}`;
    } else {
      summaryEl.textContent = `0 ${entityName}`;
    }
  }

  if (!total || totalPages <= 1) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  const items = buildPageRange(page, totalPages);

  const buttonsHtml = items
    .map((item) => {
      if (item === "...") return `<span class="pg-ellipsis" aria-hidden="true">…</span>`;
      const isActive = item === page;
      return `
        <button
          type="button"
          class="pg-btn pg-btn-num ${isActive ? "is-active" : ""}"
          data-page="${item}"
          aria-label="Trang ${item}"
          ${isActive ? 'aria-current="page"' : ""}
        >${item}</button>`;
    })
    .join("");

  container.innerHTML = `
    <div class="pg-wrapper" role="navigation" aria-label="Phân trang">
      <button type="button" class="pg-btn pg-btn-prev" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="Trang trước">Trước</button>
      <div class="pg-num-list">${buttonsHtml}</div>
      <span class="pg-mobile-info" aria-hidden="true">Trang ${page}/${totalPages}</span>
      <button type="button" class="pg-btn pg-btn-next" data-page="${page + 1}" ${page >= totalPages ? "disabled" : ""} aria-label="Trang sau">Sau</button>
    </div>
  `;

  container.querySelectorAll(".pg-btn[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const next = Number(btn.dataset.page);
      if (next >= 1 && next <= totalPages && next !== page) {
        onPageChange?.(next);
      }
    });
  });
}
