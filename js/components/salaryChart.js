/**
 * salaryChart.js - Vẽ biểu đồ khoảng phân vị lương (Range / Box Plot) bằng SVG thuần
 * Hỗ trợ WAI-ARIA, tooltip SVG, bảng ẩn cho screen reader. Giới hạn: < 200 dòng.
 */

function formatTr(val) {
  const n = Number(val || 0);
  if (!n) return "0";
  return (Math.round((n / 1000000) * 10) / 10).toLocaleString("vi-VN") + " Tr";
}

function formatFullVND(val) {
  return Number(val || 0).toLocaleString("vi-VN") + " ₫/tháng";
}

export function renderSalaryRangeChart(containerEl, { min, p25, median, p75, max }) {
  if (!containerEl) return;
  if (!max || max <= min) {
    containerEl.innerHTML = `<p style="color:var(--text-tertiary); font-size:13px; text-align:center;">Dữ liệu chưa đủ để vẽ biểu đồ khoảng.</p>`;
    return;
  }

  const svgWidth = 600;
  const paddingX = 40;
  const usableWidth = svgWidth - paddingX * 2;
  const range = max - min;

  const getX = (val) => paddingX + ((val - min) / range) * usableWidth;

  const xMin = getX(min);
  const xP25 = getX(p25);
  const xMed = getX(median);
  const xP75 = getX(p75);
  const xMax = getX(max);

  const boxY = 28;
  const boxHeight = 32;
  const boxWidth = Math.max(4, xP75 - xP25);

  containerEl.innerHTML = `
    <div class="salary-chart-wrap" role="img" aria-label="Biểu đồ khoảng lương: Thấp nhất ${formatTr(min)}, Trung vị ${formatTr(median)}, Cao nhất ${formatTr(max)}">
      <svg class="salary-chart-svg" viewBox="0 0 ${svgWidth} 110" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#CCFBF1" />
            <stop offset="100%" stop-color="#99F6E4" />
          </linearGradient>
        </defs>

        <!-- Trục ngang nền -->
        <line x1="${paddingX}" y1="44" x2="${svgWidth - paddingX}" y2="44" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round" />

        <!-- Đoạn khoảng P25 - P75 (Box) -->
        <rect x="${xP25}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" rx="6" fill="url(#boxGrad)" stroke="#0F766E" stroke-width="2">
          <title>Khoảng phổ biến (25% - 75%): ${formatFullVND(p25)} - ${formatFullVND(p75)}</title>
        </rect>

        <!-- Điểm Min -->
        <circle cx="${xMin}" cy="44" r="5" fill="#64748B" stroke="#FFFFFF" stroke-width="2">
          <title>Mức thấp nhất: ${formatFullVND(min)}</title>
        </circle>

        <!-- Điểm Max -->
        <circle cx="${xMax}" cy="44" r="5" fill="#64748B" stroke="#FFFFFF" stroke-width="2">
          <title>Mức cao nhất: ${formatFullVND(max)}</title>
        </circle>

        <!-- Vạch Trung vị (Median line & dot) -->
        <line x1="${xMed}" y1="22" x2="${xMed}" y2="66" stroke="#0F766E" stroke-width="3" stroke-linecap="round" />
        <circle cx="${xMed}" cy="44" r="7" fill="#0F766E" stroke="#FFFFFF" stroke-width="2.5">
          <title>Trung vị thị trường: ${formatFullVND(median)}</title>
        </circle>

        <!-- Nhãn văn bản trục dưới -->
        <text x="${xMin}" y="82" text-anchor="middle" font-size="11" fill="#64748B" font-weight="600">Min</text>
        <text x="${xMin}" y="96" text-anchor="middle" font-size="11" fill="#0F172A" font-weight="700">${formatTr(min)}</text>

        <text x="${xP25}" y="82" text-anchor="middle" font-size="11" fill="#0F766E" font-weight="600">P25</text>
        <text x="${xP25}" y="96" text-anchor="middle" font-size="11" fill="#0F172A" font-weight="700">${formatTr(p25)}</text>

        <text x="${xMed}" y="14" text-anchor="middle" font-size="12" fill="#0F766E" font-weight="700">Trung vị: ${formatTr(median)}</text>

        <text x="${xP75}" y="82" text-anchor="middle" font-size="11" fill="#0F766E" font-weight="600">P75</text>
        <text x="${xP75}" y="96" text-anchor="middle" font-size="11" fill="#0F172A" font-weight="700">${formatTr(p75)}</text>

        <text x="${xMax}" y="82" text-anchor="middle" font-size="11" fill="#64748B" font-weight="600">Max</text>
        <text x="${xMax}" y="96" text-anchor="middle" font-size="11" fill="#0F172A" font-weight="700">${formatTr(max)}</text>
      </svg>

      <!-- Bảng ẩn cho trình đọc màn hình -->
      <table class="sr-only" style="position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0;">
        <caption>Dữ liệu phân vị mức lương thị trường</caption>
        <thead>
          <tr><th>Chỉ số</th><th>Giá trị (VNĐ)</th></tr>
        </thead>
        <tbody>
          <tr><td>Thấp nhất (Min)</td><td>${min}</td></tr>
          <tr><td>Phân vị 25 (P25)</td><td>${p25}</td></tr>
          <tr><td>Trung vị (Median)</td><td>${median}</td></tr>
          <tr><td>Phân vị 75 (P75)</td><td>${p75}</td></tr>
          <tr><td>Cao nhất (Max)</td><td>${max}</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

