/**
 * Tiện ích định dạng thời gian và tính khoảng thời gian (Kinh nghiệm & Học vấn)
 * Pure function độc lập, tuân thủ techrecruit-rules & web-design-guidelines.
 */

/**
 * Phân tích chuỗi tháng dạng 'YYYY-MM'
 * @param {string} str
 * @returns {{ year: number, month: number }}
 */
export function parseYearMonth(str) {
  if (!str || typeof str !== "string") {
    throw new Error("Định dạng tháng không hợp lệ (mong đợi YYYY-MM)");
  }
  const parts = str.trim().split("-");
  if (parts.length !== 2) {
    throw new Error("Định dạng tháng không hợp lệ (mong đợi YYYY-MM)");
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 1900) {
    throw new Error("Tháng hoặc năm không hợp lệ");
  }
  return { year, month };
}

/**
 * Định dạng khoảng thời gian kinh nghiệm làm việc:
 * Ví dụ: "Thg 3/2021 – Hiện tại · 3 năm 1 tháng" hoặc "Thg 1/2022 – Thg 6/2022 · 6 tháng"
 *
 * @param {string} startMonth 'YYYY-MM'
 * @param {string|null} endMonth 'YYYY-MM' hoặc null
 * @param {boolean} isCurrent Đang làm việc tại đây
 * @param {Date} [referenceDate] Thời điểm hiện tại (mặc định new Date(), dùng cho test)
 * @returns {string}
 */
export function formatDuration(startMonth, endMonth, isCurrent = false, referenceDate = new Date()) {
  const start = parseYearMonth(startMonth);
  const nowYear = referenceDate.getFullYear();
  const nowMonth = referenceDate.getMonth() + 1;

  // Kiểm tra mốc bắt đầu không ở tương lai
  if (start.year > nowYear || (start.year === nowYear && start.month > nowMonth)) {
    throw new Error("Thời gian bắt đầu không được ở tương lai");
  }

  let end;
  let endLabel = "";

  if (isCurrent || !endMonth) {
    end = { year: nowYear, month: nowMonth };
    endLabel = "Hiện tại";
  } else {
    end = parseYearMonth(endMonth);
    endLabel = `Thg ${end.month}/${end.year}`;

    // Kiểm tra kết thúc không trước bắt đầu
    if (end.year < start.year || (end.year === start.year && end.month < start.month)) {
      throw new Error("Thời gian kết thúc không được trước thời gian bắt đầu");
    }
  }

  // Tính tổng số tháng (bao gồm cả tháng kết thúc: inclusive)
  const totalMonths = (end.year - start.year) * 12 + (end.month - start.month) + 1;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let spanText = "";
  if (years > 0 && months > 0) {
    spanText = `${years} năm ${months} tháng`;
  } else if (years > 0) {
    spanText = `${years} năm`;
  } else {
    spanText = `${Math.max(1, months)} tháng`;
  }

  return `Thg ${start.month}/${start.year} – ${endLabel} · ${spanText}`;
}

/**
 * Định dạng thời gian học vấn
 * @param {number|string} startYear
 * @param {number|string|null} endYear
 * @param {boolean} isCurrent
 * @returns {string}
 */
export function formatEducationYear(startYear, endYear, isCurrent = false) {
  const sYear = parseInt(startYear, 10);
  if (isNaN(sYear)) return "";
  if (isCurrent || !endYear) {
    return `${sYear} – Hiện tại`;
  }
  const eYear = parseInt(endYear, 10);
  if (isNaN(eYear)) return `${sYear}`;
  return `${sYear} – ${eYear}`;
}
