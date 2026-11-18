/**
 * statusTimeline.js - Timeline dọc hiển thị mốc trạng thái hồ sơ ứng tuyển.
 * Tuân thủ quy định: <= 200 dòng, <ol> chuẩn WAI-ARIA aria-current="step".
 * - Bước đã xong: mô tả quá khứ + ngày giờ (không có chữ "đang...").
 * - Bước đang diễn ra: mô tả hiện tại ("Nhà tuyển dụng đang xem hồ sơ của bạn"...).
 * - Bước chưa tới: không có ngày, chỉ có nhãn "Chưa tới", màu nhạt đạt chuẩn WCAG AA.
 */

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${timeStr} - ${dateStr}`;
}

const COMPLETED_LABELS = {
  submitted: "Đã nộp",
  screening: "Đã xem xét",
  interview: "Đã phỏng vấn",
  offered: "Đề nghị nhận việc",
};

const COMPLETED_NOTES = {
  submitted: "Đã gửi hồ sơ ứng tuyển",
  screening: "Nhà tuyển dụng đã xem xét hồ sơ",
  interview: "Đã hoàn thành vòng phỏng vấn",
  offered: "Đã nhận đề nghị làm việc",
};

function getCurrentNote(step) {
  switch (step.status) {
    case "submitted":
      return "Hồ sơ đang chờ nhà tuyển dụng tiếp nhận và xem xét";
    case "screening":
      return "Nhà tuyển dụng đang xem hồ sơ của bạn";
    case "interview":
      return "Đang trong giai đoạn phỏng vấn với nhà tuyển dụng";
    case "offered":
      return "Nhà tuyển dụng đang gửi đề nghị nhận việc, chờ bạn phản hồi";
    case "rejected":
      return step.note && !/đang/i.test(step.note)
        ? step.note
        : "Hồ sơ chưa phù hợp với yêu cầu hiện tại của vị trí";
    case "withdrawn":
      return step.note && !/đang/i.test(step.note)
        ? step.note
        : "Ứng viên đã chủ động rút hồ sơ";
    default:
      return step.note || "";
  }
}

export function renderStatusTimeline(historyList = [], metaStatuses = [], currentStatus = "") {
  if (!Array.isArray(historyList) || historyList.length === 0) {
    return `<p class="timeline-empty">Chưa có lịch sử trạng thái.</p>`;
  }

  // Sắp xếp theo thời gian tăng dần và khử trùng lặp các bước cùng status liên tiếp
  const sortedRaw = [...historyList].sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  const dedupedHist = [];
  for (const item of sortedRaw) {
    const existingIdx = dedupedHist.findIndex((x) => x.status === item.status);
    if (existingIdx !== -1) {
      dedupedHist[existingIdx] = item;
    } else {
      dedupedHist.push(item);
    }
  }

  const metaMap = new Map();
  metaStatuses.forEach((m) => metaMap.set(m.slug, m));

  const currentMeta = metaMap.get(currentStatus);
  const futureSteps = [];
  if (currentMeta && !currentMeta.is_terminal) {
    metaStatuses
      .filter((m) => !m.is_terminal && m.sort_order > currentMeta.sort_order)
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((m) => futureSteps.push(m));
  }

  const itemsHtml = [];

  // 1. Render các mốc đã xong và mốc đang diễn ra
  dedupedHist.forEach((step, idx) => {
    const isCurrent = idx === dedupedHist.length - 1;
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

    const labelText = isCurrent
      ? (step.status_label || step.status)
      : (COMPLETED_LABELS[step.status] || step.status_label || step.status);

    const noteText = isCurrent ? getCurrentNote(step) : "";

    itemsHtml.push(`
      <li class="${stepClass}" ${isCurrent ? 'aria-current="step"' : ""}>
        <div class="timeline-line" aria-hidden="true"></div>
        ${markerHtml}
        <div class="timeline-content">
          <div class="timeline-heading-row">
            <span class="timeline-label">${esc(labelText)}</span>
            <time class="timeline-time" datetime="${step.changed_at}">${formatDateTime(step.changed_at)}</time>
          </div>
          ${noteText ? `<p class="timeline-note">${esc(noteText)}</p>` : ""}
        </div>
      </li>
    `);
  });

  // 2. Render các mốc chưa tới (không có ngày, chỉ có nhãn "Chưa tới")
  futureSteps.forEach((future) => {
    itemsHtml.push(`
      <li class="timeline-item is-future" aria-disabled="true">
        <div class="timeline-line timeline-line-dashed" aria-hidden="true"></div>
        <span class="timeline-marker marker-future" aria-hidden="true"></span>
        <div class="timeline-content">
          <div class="timeline-heading-row">
            <span class="timeline-label timeline-future-label">${esc(future.name)}</span>
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
