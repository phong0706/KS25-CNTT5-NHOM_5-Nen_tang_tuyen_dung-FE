/**
 * Generic Chart Card Controller - TechRecruit (Vanilla JS ES Module)
 * - Quản lý trọn vẹn 3 trạng thái: Skeleton khi tải, Empty khi không có dữ liệu, Error có nút Thử lại.
 * - Đảm bảo chiều cao cố định (260 - 320px), responsive, nhãn trục Y có đơn vị.
 * - Hỗ trợ bộ chọn khoảng thời gian (7 / 30 / 90 ngày).
 * - Hỗ trợ khả năng tiếp cận (Accessibility): aria-label trên canvas + bảng dữ liệu ẩn (.visually-hidden) cho screen reader.
 * - Chống race-condition khi chuyển đổi nhanh giữa các mốc thời gian.
 * - Quản lý vòng đời (destroy & redraw) khi chuyển theme sáng/tối.
 */

import {
  applyChartDefaults,
  getChartThemeTokens,
  getChartGlobal,
  registerChartInstance,
  unregisterChartInstance,
} from "./chartTheme.js";

let cardIdCounter = 0;

/**
 * Khởi tạo một Chart Card hoàn chỉnh với đầy đủ các trạng thái và điều khiển
 * @param {HTMLElement|string} targetEl - Element container hoặc selector
 * @param {Object} config - Cấu hình thẻ biểu đồ
 */
export function createChartCard(targetEl, config = {}) {
  const container = typeof targetEl === "string" ? document.querySelector(targetEl) : targetEl;
  if (!container) {
    throw new Error(`[createChart] Không tìm thấy phần tử DOM: ${targetEl}`);
  }

  const cardId = `chart-card-${++cardIdCounter}`;
  const canvasId = `canvas-${cardId}`;

  const {
    title = "Biểu đồ",
    subtitle = "Mô tả số liệu",
    ariaLabel = "Biểu đồ thống kê",
    periods = null, // [7, 30, 90] hoặc null
    defaultPeriod = 30,
    unit = "",
    onPeriodChange = null,
    onRetry = null,
  } = config;

  let currentPeriod = defaultPeriod;
  let chartInstance = null;
  let lastRenderFn = null;
  let lastData = null;
  let currentRenderSessionId = 0; // Chống race condition khi click nhanh

  // 1. Render cấu trúc khung Chart Card
  const periodsHtml = Array.isArray(periods) && periods.length > 0
    ? `
      <div class="chart-period-selector" role="group" aria-label="Chọn khoảng thời gian">
        ${periods
          .map(
            (p) =>
              `<button type="button" class="period-btn ${p === currentPeriod ? "active" : ""}" data-period="${p}" aria-pressed="${p === currentPeriod}">${p} ngày</button>`
          )
          .join("")}
      </div>
    `
    : "";

  container.innerHTML = `
    <div class="chart-card" id="${cardId}">
      <div class="chart-card-header">
        <div class="chart-title-zone">
          <h3 class="chart-title">${escapeHtml(title)}</h3>
          <p class="chart-subtitle">${escapeHtml(subtitle)}</p>
        </div>
        ${periodsHtml}
      </div>

      <div class="chart-canvas-wrap" id="wrap-${cardId}">
        <canvas id="${canvasId}" role="img" aria-label="${escapeHtml(ariaLabel)}"></canvas>
        <div id="state-overlay-${cardId}" role="status" aria-live="polite" style="display: none;"></div>
      </div>

      <!-- Bảng dữ liệu ẩn phục vụ trợ năng (Screen Reader Accessible Table) -->
      <div class="visually-hidden" id="sr-table-${cardId}" role="region" aria-label="Dữ liệu dạng bảng của biểu đồ"></div>
    </div>
  `;

  const wrapEl = container.querySelector(`#wrap-${cardId}`);
  const overlayEl = container.querySelector(`#state-overlay-${cardId}`);
  const srTableEl = container.querySelector(`#sr-table-${cardId}`);
  const canvasEl = container.querySelector(`#${canvasId}`);

  // 2. Gắn sự kiện chuyển đổi thời gian (7 / 30 / 90 ngày)
  if (Array.isArray(periods)) {
    const periodBtns = container.querySelectorAll(".period-btn");
    periodBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = Number(btn.dataset.period);
        if (p === currentPeriod) return;
        currentPeriod = p;
        periodBtns.forEach((b) => {
          const isActive = Number(b.dataset.period) === p;
          b.classList.toggle("active", isActive);
          b.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
        if (typeof onPeriodChange === "function") {
          onPeriodChange(p);
        }
      });
    });
  }

  // Helper chuyển đổi chuỗi an toàn
  function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 3. Quản lý trạng thái SKELETON (LOADING)
  function showLoading() {
    currentRenderSessionId++;
    destroyCurrentChart();
    if (!overlayEl) return;
    overlayEl.style.display = "block";
    overlayEl.className = "chart-state-loading";
    overlayEl.innerHTML = `
      <div class="skeleton-shimmer" aria-hidden="true"></div>
      <div class="skeleton-bars-row" aria-hidden="true">
        <div class="skeleton-bar" style="height: 35%;"></div>
        <div class="skeleton-bar" style="height: 60%;"></div>
        <div class="skeleton-bar" style="height: 45%;"></div>
        <div class="skeleton-bar" style="height: 85%;"></div>
        <div class="skeleton-bar" style="height: 50%;"></div>
        <div class="skeleton-bar" style="height: 70%;"></div>
      </div>
      <div class="skeleton-baseline" aria-hidden="true"></div>
      <span class="visually-hidden">Đang tải dữ liệu biểu đồ...</span>
    `;
    if (canvasEl) canvasEl.style.visibility = "hidden";
    if (srTableEl) srTableEl.innerHTML = `<p>Đang tải dữ liệu biểu đồ...</p>`;
  }

  // 4. Quản lý trạng thái EMPTY (TRỐNG)
  function showEmpty(message = "Chưa có dữ liệu nào.", actionConfig = null) {
    currentRenderSessionId++;
    destroyCurrentChart();
    if (!overlayEl) return;
    overlayEl.style.display = "flex";
    overlayEl.className = "chart-state-empty";

    let actionHtml = "";
    if (actionConfig && actionConfig.label) {
      actionHtml = `<a href="${actionConfig.href || "#"}" class="chart-empty-action">${escapeHtml(actionConfig.label)}</a>`;
    }

    overlayEl.innerHTML = `
      <div class="chart-empty-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      </div>
      <p class="chart-empty-text">${escapeHtml(message)}</p>
      ${actionHtml}
    `;
    if (canvasEl) canvasEl.style.visibility = "hidden";
    if (srTableEl) srTableEl.innerHTML = `<p>${escapeHtml(message)}</p>`;
  }

  // 5. Quản lý trạng thái ERROR (LỖI CÓ NÚT THỬ LẠI)
  function showError(message = "Không thể tải dữ liệu biểu đồ.", retryFn = null) {
    currentRenderSessionId++;
    destroyCurrentChart();
    if (!overlayEl) return;
    overlayEl.style.display = "flex";
    overlayEl.className = "chart-state-error";

    const handler = retryFn || onRetry;

    overlayEl.innerHTML = `
      <div class="chart-error-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <p class="chart-error-text">${escapeHtml(message)}</p>
      <button type="button" class="chart-retry-btn" id="btn-retry-${cardId}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>Thử lại</span>
      </button>
    `;

    const retryBtn = overlayEl.querySelector(`#btn-retry-${cardId}`);
    if (retryBtn && typeof handler === "function") {
      retryBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showLoading();
        handler(currentPeriod);
      });
    }

    if (canvasEl) canvasEl.style.visibility = "hidden";
    if (srTableEl) srTableEl.innerHTML = `<p>Lỗi: ${escapeHtml(message)}</p>`;
  }

  // 6. Hủy chart hiện tại
  function destroyCurrentChart() {
    if (chartInstance && typeof chartInstance.destroy === "function") {
      try {
        chartInstance.destroy();
      } catch (err) {
        console.warn(`[createChart] Lỗi khi destroy:`, err);
      }
      chartInstance = null;
    }
    unregisterChartInstance(cardId);
  }

  // 7. Tạo bảng ẩn trợ năng (Visually-Hidden Accessible Table)
  function buildAccessibleTable(data) {
    if (!srTableEl || !data || !Array.isArray(data.labels)) return;
    const labels = data.labels;
    const datasets = data.datasets || [];

    let thCols = labels.map((l) => `<th scope="col">${escapeHtml(String(l))}</th>`).join("");
    let tbodyRows = datasets
      .map((ds) => {
        const dsName = escapeHtml(ds.label || "Số lượng");
        const tds = (ds.data || [])
          .map((v) => `<td>${Number(v).toLocaleString("vi-VN")} ${escapeHtml(unit)}</td>`)
          .join("");
        return `<tr><th scope="row">${dsName}</th>${tds}</tr>`;
      })
      .join("");

    srTableEl.innerHTML = `
      <table>
        <caption>${escapeHtml(title)} - ${escapeHtml(subtitle)}</caption>
        <thead>
          <tr>
            <th scope="col">Chỉ số</th>
            ${thCols}
          </tr>
        </thead>
        <tbody>
          ${tbodyRows}
        </tbody>
      </table>
    `;
  }

  // 8. Hàm render dữ liệu chính lên Canvas
  function render(renderFn, data) {
    const sessionId = ++currentRenderSessionId;
    lastRenderFn = renderFn;
    lastData = data;

    // Ẩn overlay
    if (overlayEl) {
      overlayEl.style.display = "none";
      overlayEl.innerHTML = "";
    }
    if (canvasEl) {
      canvasEl.style.visibility = "visible";
    }

    // Kiểm tra dữ liệu rỗng
    const hasData =
      data &&
      Array.isArray(data.datasets) &&
      data.datasets.some((ds) => Array.isArray(ds.data) && ds.data.some((val) => Number(val) > 0));

    if (!hasData) {
      showEmpty("Chưa có dữ liệu thống kê trong khoảng thời gian này.");
      return null;
    }

    destroyCurrentChart();

    // Kiểm tra race-condition nếu trong lúc chuẩn bị render lại có lệnh khác chen vào
    if (sessionId !== currentRenderSessionId) {
      return null;
    }

    const Chart = getChartGlobal();
    if (!Chart) {
      showError("Thư viện Chart.js chưa sẵn sàng. Vui lòng tải lại trang.");
      return null;
    }

    applyChartDefaults(Chart);
    const tokens = getChartThemeTokens();

    try {
      chartInstance = renderFn(canvasEl, data, tokens, {
        unit,
        period: currentPeriod,
      });

      // Tạo bảng ẩn cho screen readers
      buildAccessibleTable(data);

      // Đăng ký với Theme Manager để tự vẽ lại khi chuyển Dark/Light
      registerChartInstance(cardId, chartInstance, () => {
        if (typeof lastRenderFn === "function" && lastData) {
          render(lastRenderFn, lastData);
        }
      });

      return chartInstance;
    } catch (err) {
      console.error(`[createChart] Lỗi khi vẽ biểu đồ ${cardId}:`, err);
      showError("Đã xảy ra lỗi khi khởi tạo hiển thị biểu đồ.");
      return null;
    }
  }

  return {
    cardId,
    canvasId,
    getCanvas: () => canvasEl,
    getPeriod: () => currentPeriod,
    getInstance: () => chartInstance,
    showLoading,
    showEmpty,
    showError,
    render,
    destroy: destroyCurrentChart,
  };
}
