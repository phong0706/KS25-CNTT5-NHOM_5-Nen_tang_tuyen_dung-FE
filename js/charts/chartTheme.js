/**
 * Chart Theme Module - TechRecruit (Vanilla JS ES Module)
 * - Tự động đọc màu và font từ CSS variables (--chart-1, --chart-2, --grid, --chart-text, --font-family).
 * - Cấu hình Chart.defaults đồng bộ toàn hệ thống.
 * - Lắng nghe sự kiện chuyển đổi Sáng / Tối và tự động hủy, vẽ lại toàn bộ biểu đồ đang hoạt động.
 * - Tôn trọng tùy chọn prefers-reduced-motion (tắt animation).
 * - Tối ưu tương phản Tooltip trên cả Light & Dark mode.
 */

// Danh sách các biểu đồ đang hoạt động để tự động vẽ lại khi đổi theme
const activeChartsRegistry = new Map();

/**
 * Lấy đối tượng Chart toàn cục một cách an toàn
 */
export function getChartGlobal() {
  if (typeof window !== "undefined") {
    if (window.Chart) return window.Chart;
    if (typeof Chart !== "undefined") return Chart;
  }
  return null;
}

/**
 * Trích xuất giá trị CSS variable từ :root (hoặc thẻ html)
 */
export function getCssVar(varName, fallback = "") {
  if (typeof window === "undefined" || !document.documentElement) return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

/**
 * Lấy toàn bộ bảng màu biểu đồ hiện tại theo theme đang áp dụng
 */
export function getChartThemeTokens() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    isDark,
    chart1: getCssVar("--chart-1", isDark ? "#10B981" : "#0F766E"),
    chart2: getCssVar("--chart-2", isDark ? "#64748B" : "#94A3B8"),
    chart3: getCssVar("--chart-3", isDark ? "#34D399" : "#0D9488"),
    chartSuccess: getCssVar("--chart-success", isDark ? "#10B981" : "#059669"),
    chartWarning: getCssVar("--chart-warning", isDark ? "#F59E0B" : "#D97706"),
    chartDanger: getCssVar("--chart-danger", isDark ? "#F43F5E" : "#E11D48"),
    chartInfo: getCssVar("--chart-info", isDark ? "#38BDF8" : "#0284C7"),
    grid: getCssVar("--grid", isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0"),
    text: getCssVar("--chart-text", isDark ? "#94A3B8" : "#475569"),
    textTitle: getCssVar("--text-primary", isDark ? "#F8FAFC" : "#0F172A"),
    bgSurface: isDark ? "#1A1A22" : "#FFFFFF", // Tương phản nổi bật so với nền card
    borderDefault: getCssVar("--border-default", isDark ? "rgba(255,255,255,0.14)" : "#E2E8F0"),
    fontFamily: getCssVar("--font-family", "'Be Vietnam Pro', system-ui, sans-serif"),
  };
}

/**
 * Kiểm tra xem người dùng có yêu cầu giảm chuyển động không
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Cài đặt cấu hình mặc định (Defaults) cho thư viện Chart.js 4.4.x
 */
export function applyChartDefaults(Chart) {
  const chartLib = Chart || getChartGlobal();
  if (!chartLib || !chartLib.defaults) return;

  const tokens = getChartThemeTokens();
  const reduceMotion = prefersReducedMotion();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  // 1. Phông chữ chung
  chartLib.defaults.font.family = tokens.fontFamily;
  chartLib.defaults.font.size = 12;
  chartLib.defaults.color = tokens.text;

  // 2. Bố cục & Responsive
  chartLib.defaults.responsive = true;
  chartLib.defaults.maintainAspectRatio = false;

  // 3. Tắt animation nếu người dùng yêu cầu reduced motion
  if (reduceMotion) {
    chartLib.defaults.animation = false;
  } else {
    chartLib.defaults.animation = {
      duration: 380,
      easing: "easeOutQuart",
    };
  }

  // 4. Cấu hình Tooltip tiếng Việt chuẩn sản phẩm
  chartLib.defaults.plugins.tooltip = {
    ...chartLib.defaults.plugins.tooltip,
    enabled: true,
    mode: "index",
    intersect: false,
    backgroundColor: tokens.bgSurface,
    titleColor: tokens.textTitle,
    bodyColor: tokens.text,
    borderColor: tokens.borderDefault,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4,
    usePointStyle: true,
    titleFont: {
      family: tokens.fontFamily,
      size: 13,
      weight: "600",
    },
    bodyFont: {
      family: tokens.fontFamily,
      size: 12,
      weight: "400",
    },
    callbacks: {
      label: function (context) {
        let label = context.dataset.label || "";
        if (label) label += ": ";
        if (context.parsed.y !== null && context.parsed.y !== undefined) {
          label += Number(context.parsed.y).toLocaleString("vi-VN");
        } else if (context.parsed !== null && context.parsed !== undefined) {
          label += Number(context.parsed).toLocaleString("vi-VN");
        }
        return label;
      },
    },
  };

  // 5. Cấu hình Legend (Chú thích)
  chartLib.defaults.plugins.legend = {
    ...chartLib.defaults.plugins.legend,
    display: true,
    position: isMobile ? "bottom" : "top",
    align: isMobile ? "center" : "end",
    labels: {
      boxWidth: 10,
      boxHeight: 10,
      usePointStyle: true,
      color: tokens.text,
      font: {
        family: tokens.fontFamily,
        size: 12,
        weight: "500",
      },
      padding: isMobile ? 10 : 14,
    },
  };

  // 6. Cấu hình trục Scales (Gridline mảnh nhạt, bỏ viền khung)
  if (chartLib.defaults.scales) {
    if (chartLib.defaults.scales.linear) {
      chartLib.defaults.scales.linear.grid = {
        color: tokens.grid,
        drawBorder: false,
        lineWidth: 1,
      };
      chartLib.defaults.scales.linear.ticks = {
        color: tokens.text,
        font: { family: tokens.fontFamily, size: 11 },
        padding: 6,
      };
    }
    if (chartLib.defaults.scales.category) {
      chartLib.defaults.scales.category.grid = {
        display: false,
        drawBorder: false,
      };
      chartLib.defaults.scales.category.ticks = {
        color: tokens.text,
        font: { family: tokens.fontFamily, size: 11 },
        padding: 6,
      };
    }
  }
}

/**
 * Đăng ký instance biểu đồ vào registry để quản lý vòng đời và vẽ lại khi đổi theme
 */
export function registerChartInstance(id, chartInstance, redrawCallback) {
  activeChartsRegistry.set(id, { chartInstance, redrawCallback });
}

/**
 * Hủy đăng ký khi chart bị destroy
 */
export function unregisterChartInstance(id) {
  activeChartsRegistry.delete(id);
}

/**
 * Tự động hủy và vẽ lại toàn bộ biểu đồ khi chuyển theme (Light/Dark)
 */
export function refreshAllCharts() {
  const chartLib = getChartGlobal();
  if (chartLib) {
    applyChartDefaults(chartLib);
  }
  activeChartsRegistry.forEach(({ chartInstance, redrawCallback }, id) => {
    if (chartInstance && typeof chartInstance.destroy === "function") {
      try {
        chartInstance.destroy();
      } catch (err) {
        console.warn(`[ChartTheme] Không thể hủy chart ${id}:`, err);
      }
    }
    if (typeof redrawCallback === "function") {
      try {
        redrawCallback();
      } catch (err) {
        console.error(`[ChartTheme] Lỗi khi vẽ lại chart ${id}:`, err);
      }
    }
  });
}

// Lắng nghe sự kiện đổi theme từ layout.js
if (typeof window !== "undefined") {
  window.addEventListener("theme:change", () => {
    refreshAllCharts();
  });

  // Quan sát thay đổi thuộc tính data-theme trên thẻ html
  const themeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
        refreshAllCharts();
        break;
      }
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
