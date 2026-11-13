/**
 * statusTimeline.js - Timeline dọc hiển thị mốc trạng thái hồ sơ ứng tuyển.
 * Tuân thủ quy định: < 200 dòng, role="list" / <ol> chuẩn WAI-ARIA aria-current="step".
 */

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${timeStr} - ${dateStr}`;
}

export function renderStatusTimeline(historyList = [], metaStatuses = [], currentStatus = "") {
  if (!Array.isArray(historyList) || historyList.length === 0) {
    return `<p class="timeline-empty">Chưa có lịch sử trạng thái.</p>`;
  }

  // Sắp xếp các mốc trong history theo thời gian tăng dần
  const sortedHist = [...historyList].sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  const latestStep = sortedHist[sortedHist.length - 1];

  // Map meta statuses theo slug
  const metaMap = new Map();
  metaStatuses.forEach((m) => metaMap.set(m.slug, m));

  // Xác định các mốc tương lai từ meta statuses (chỉ lấy các mốc không terminal có sort_order > mốc hiện tại)
  const currentMeta = metaMap.get(currentStatus);
  const futureSteps = [];
  if (currentMeta && !currentMeta.is_terminal) {
    metaStatuses
      .filter((m) => !m.is_terminal && m.sort_order > currentMeta.sort_order)
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((m) => futureSteps.push(m));
  }

  const itemsHtml = [];

  // 1. Render các mốc trong lịch sử (đã qua và hiện tại)
  sortedHist.forEach((step, idx) => {
    const isCurrent = idx === sortedHist.length - 1;
    const isRejected = step.status === "rejected";
    const isWithdrawn = step.status === "withdrawn";

    let stepClass = "timeline-item";
    if (isCurrent) stepClass += " is-current";
    else stepClass += " is-completed";
    if (isRejected) stepClass += " is-rejected";
    if (isWithdrawn) stepClass += " is-withdrawn";

    let markerHtml = "";
    if (isRejected) {
      markerHtml = `
        <span class="timeline-marker marker-rejected" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </span>
      `;
    } else if (isWithdrawn) {
      markerHtml = `
        <span class="timeline-marker marker-withdrawn" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        </span>
      `;
    } else if (isCurrent) {
      markerHtml = `<span class="timeline-marker marker-current" aria-hidden="true"><span class="marker-pulse"></span></span>`;
    } else {
      markerHtml = `
        <span class="timeline-marker marker-completed" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </span>
      `;
    }

    itemsHtml.push(`
      <li class="${stepClass}" ${isCurrent ? 'aria-current="step"' : ""}>
        <div class="timeline-line" aria-hidden="true"></div>
        ${markerHtml}
        <div class="timeline-content">
          <div class="timeline-heading-row">
            <span class="timeline-label">${esc(step.status_label || step.status)}</span>
            <time class="timeline-time" datetime="${step.changed_at}">${formatDateTime(step.changed_at)}</time>
          </div>
          ${step.note ? `<p class="timeline-note">${esc(step.note)}</p>` : ""}
        </div>
      </li>
    `);
  });

  // 2. Render các mốc tương lai (nét đứt xám)
  futureSteps.forEach((future) => {
    itemsHtml.push(`
      <li class="timeline-item is-future" aria-disabled="true">
        <div class="timeline-line timeline-line-dashed" aria-hidden="true"></div>
        <span class="timeline-marker marker-future" aria-hidden="true"></span>
        <div class="timeline-content">
          <div class="timeline-heading-row">
            <span class="timeline-label text-muted">${esc(future.name)}</span>
            <span class="timeline-future-hint">Chưa tới</span>
          </div>
        </div>
      </li>
    `);
  });

  return `
    <ol class="status-timeline-list" aria-label="Lịch sử quá trình ứng tuyển">
      ${itemsHtml.join("")}
    </ol>
  `;
}

