/**
 * Component phân trang server-side (10 tin/trang) có dấu "..." khi nhiều trang.
 */

function buildPageRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export function renderPagination(container, { page, totalPages, total }, onPageChange) {
  if (!container) return;
  if (!total || totalPages <= 1) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  const items = buildPageRange(page, totalPages);

  const buttonsHtml = items
    .map((item) => {
      if (item === "...") return `<span class="pg-ellipsis" aria-hidden="true">...</span>`;
      const isActive = item === page;
      return `
        <button
          type="button"
          class="pg-btn ${isActive ? "is-active" : ""}"
          data-page="${item}"
          aria-label="Trang ${item}"
          ${isActive ? 'aria-current="page"' : ""}
        >${item}</button>
      `;
    })
    .join("");

  container.innerHTML = `
    <button type="button" class="pg-btn" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="Trang trước">Trước</button>
    ${buttonsHtml}
    <button type="button" class="pg-btn" data-page="${page + 1}" ${page >= totalPages ? "disabled" : ""} aria-label="Trang sau">Sau</button>
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

