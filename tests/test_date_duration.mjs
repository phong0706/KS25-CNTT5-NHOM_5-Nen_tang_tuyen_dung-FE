import assert from "assert";
import { formatDuration, parseYearMonth, formatEducationYear } from "../js/utils/dateDuration.js";

console.log("--- Bắt đầu Unit Tests: formatDuration ---");

// Fixed reference date: 2026-11-16 (nowYear: 2026, nowMonth: 11)
const fixedNow = new Date("2026-11-16T08:00:00Z");

// Test 1: Cùng tháng
{
  const res = formatDuration("2024-05", "2024-05", false, fixedNow);
  assert.strictEqual(res, "Thg 5/2024 – Thg 5/2024 · 1 tháng");
  console.log("✔ Test 1: Cùng tháng thành công:", res);
}

// Test 2: Vài tháng cùng năm
{
  const res = formatDuration("2024-01", "2024-06", false, fixedNow);
  assert.strictEqual(res, "Thg 1/2024 – Thg 6/2024 · 6 tháng");
  console.log("✔ Test 2: Vài tháng cùng năm thành công:", res);
}

// Test 3: Tròn năm (12 tháng: 1/2023 đến 12/2023 = 12 tháng = 1 năm)
{
  const res = formatDuration("2023-01", "2023-12", false, fixedNow);
  assert.strictEqual(res, "Thg 1/2023 – Thg 12/2023 · 1 năm");
  console.log("✔ Test 3: Tròn 1 năm thành công:", res);
}

// Test 4: Số năm lẻ tháng (1 năm 1 tháng: 1/2023 đến 1/2024 = 13 tháng = 1 năm 1 tháng)
{
  const res = formatDuration("2023-01", "2024-01", false, fixedNow);
  assert.strictEqual(res, "Thg 1/2023 – Thg 1/2024 · 1 năm 1 tháng");
  console.log("✔ Test 4: Số năm lẻ tháng thành công:", res);
}

// Test 5: Đang làm việc tại đây (Hiện tại)
{
  // Từ 2023-10 đến 2026-11:
  // (2026 - 2023) * 12 + (11 - 10) + 1 = 36 + 1 + 1 = 38 tháng = 3 năm 2 tháng
  const res = formatDuration("2023-10", null, true, fixedNow);
  assert.strictEqual(res, "Thg 10/2023 – Hiện tại · 3 năm 2 tháng");
  console.log("✔ Test 5: Đang làm việc tại đây (Hiện tại) thành công:", res);
}

// Test 6: Mốc tương lai (báo lỗi)
{
  assert.throws(
    () => formatDuration("2027-01", null, true, fixedNow),
    /Thời gian bắt đầu không được ở tương lai/
  );
  console.log("✔ Test 6: Bắt lỗi mốc tương lai thành công!");
}

// Test 7: Kết thúc trước bắt đầu (báo lỗi)
{
  assert.throws(
    () => formatDuration("2024-05", "2024-02", false, fixedNow),
    /Thời gian kết thúc không được trước thời gian bắt đầu/
  );
  console.log("✔ Test 7: Bắt lỗi kết thúc trước bắt đầu thành công!");
}

// Test 8: formatEducationYear
{
  assert.strictEqual(formatEducationYear(2018, 2022), "2018 – 2022");
  assert.strictEqual(formatEducationYear(2022, null, true), "2022 – Hiện tại");
  console.log("✔ Test 8: formatEducationYear thành công!");
}

console.log("--- TẤT CẢ 8 UNIT TESTS ĐÃ VƯỢT QUA 100% ---");
