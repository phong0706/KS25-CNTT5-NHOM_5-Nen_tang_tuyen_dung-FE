import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://127.0.0.1:5502/frontend";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNCIsInJvbGUiOiJlbXBsb3llciIsInRva2VuX3ZlciI6MSwiZXhwIjoxNzk1MTAyNjQzfQ.K_tDuE4kTaiUOMGRhDUgJqdyKiDw4hVs_vd24CLxN9g";
const USER_DATA = JSON.stringify({ id: 24, email: "hr1@tuyendung.com", full_name: "Trần Thị Bình", role: "employer", is_active: true, is_verified: true });
const ARTIFACT_DIR = "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(({ token, user }) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", user);
    localStorage.setItem("auth_role", "employer");
  }, { token: TOKEN, user: USER_DATA });

  page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("BROWSER ERROR:", err));
  page.on("requestfailed", (req) => console.log("REQUEST FAILED:", req.url(), req.failure()?.errorText));

  console.log("=== BƯỚC 1: Mở trang Cài đặt công ty ===");
  await page.goto(`${BASE_URL}/pages/employer/company-settings.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // 1. Kiểm tra 4 khối chính hiện hữu
  console.log("=== BƯỚC 2: Kiểm tra phân cấp 4 khối chức năng (BUG-07) ===");
  await Promise.all([
    page.locator("#company-logo-block").waitFor({ state: "visible" }),
    page.locator("#company-profile-block").waitFor({ state: "visible" }),
    page.locator("#company-verification-block").waitFor({ state: "visible" }),
    page.locator("#employer-criteria-block").waitFor({ state: "visible" }),
  ]);
  console.log("OK: 4 khối chức năng đều hiển thị đầy đủ và rõ ràng.");

  // 2. Test tải file 300 KB -> Bị chặn client
  console.log("=== BƯỚC 3: Test tải lên file logo 300 KB (chặn ở trình duyệt) ===");
  const logoInput = page.locator("#comp-logo-input");
  await logoInput.setInputFiles({
    name: "oversize_logo.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(300 * 1024, 0),
  });
  await page.waitForTimeout(300);

  const errLogoText = await page.locator("#err-comp-logo").textContent();
  console.log("Thông báo lỗi file quá 200 KB:", errLogoText);
  if (!errLogoText.includes("Ảnh vượt 200 KB")) {
    throw new Error(`Client không chặn file 300 KB đúng nội dung: ${errLogoText}`);
  }
  const isSaveBtnDisabled = await page.locator("#btn-save-logo").isDisabled();
  if (!isSaveBtnDisabled) throw new Error("Nút Lưu logo không bị disabled khi file quá dung lượng");
  console.log("OK: File 300 KB bị chặn ở trình duyệt và thông báo tiếng Việt chính xác.");

  // 3. Test BUG-01: Để trống MST và kiểm tra nút Gửi xác minh
  console.log("=== BƯỚC 4: Test BUG-01 (Nút Gửi xác minh disabled khi thiếu MST hoặc file) ===");
  const mstInput = page.locator("#verif-mst-input");
  await mstInput.fill("");
  await page.waitForTimeout(200);

  const isSubmitDisabled = await page.locator("#btn-submit-verification").isDisabled();
  const missingHintText = await page.locator("#verif-missing-hint").textContent();
  console.log("Nút Gửi xác minh disabled:", isSubmitDisabled, "Dòng nhắc:", missingHintText);
  if (!isSubmitDisabled) throw new Error("Nút Gửi xác minh vẫn bật khi để trống MST");
  if (!missingHintText.includes("Còn thiếu")) throw new Error("Không có dòng nhắc còn thiếu MST");
  console.log("OK: BUG-01 đã được xử lý chuẩn.");

  // 4. Test BUG-02: Nhập địa chỉ dài 300 ký tự
  console.log("=== BƯỚC 5: Test BUG-02 (Textarea địa chỉ tự co giãn, không cắt chữ, đếm ký tự) ===");
  const baseSample = "Tầng 12, Tòa nhà Văn phòng Công nghệ số 5, Số 88 Đường Phạm Hùng, Phường Mễ Trì, Quận Nam Từ Liêm, Thành phố Hà Nội, Việt Nam. Khu phức hợp thương mại và trung tâm đổi mới sáng tạo số 1 miền Bắc. Hotline hỗ trợ đối tác doanh nghiệp và kết nối nhân tài công nghệ thông tin chuyên nghiệp 24/7.";
  const addressText = baseSample.padEnd(300, ".").slice(0, 300);
  const addrTextarea = page.locator("#comp-address-input");
  await addrTextarea.fill(addressText);
  await page.waitForTimeout(200);

  const countText = await page.locator("#comp-address-count").textContent();
  console.log("Bộ đếm ký tự địa chỉ:", countText);
  if (!countText.includes("300/500 ký tự")) {
    throw new Error(`Bộ đếm ký tự không đúng: ${countText}`);
  }
  const textareaHeight = await addrTextarea.evaluate((el) => el.offsetHeight);
  console.log("Chiều cao textarea tự dãn:", textareaHeight, "px");
  if (textareaHeight < 50) throw new Error("Textarea không tự co giãn dòng");
  console.log("OK: BUG-02 đã được xử lý chuẩn.");

  // 5. Test BUG-03 & BUG-04: MST trên hồ sơ chỉ đọc
  console.log("=== BƯỚC 6: Test BUG-03 & BUG-04 (MST trên hồ sơ là trường chỉ đọc có nhãn [Chỉ đọc]) ===");
  const isTaxReadonly = await page.locator("#comp-tax-readonly").isEditable();
  const readonlyTag = await page.locator(".verif-readonly-tag").textContent();
  console.log("Ô MST hồ sơ có thể sửa (editable):", isTaxReadonly);
  console.log("Nhãn tag bên cạnh:", readonlyTag);
  if (isTaxReadonly) throw new Error("Ô MST trong hồ sơ vẫn cho phép chỉnh sửa trực tiếp");
  if (!readonlyTag.includes("[Chỉ đọc]")) throw new Error("Thiếu nhãn [Chỉ đọc] cho ô MST");
  console.log("OK: BUG-03 & BUG-04 đã được xử lý chuẩn.");

  // 6. Test BUG-05: Thứ tự nút hành động
  console.log("=== BƯỚC 7: Test BUG-05 (Nút chính bên phải, nút phụ bên trái) ===");
  const resetBtnBox = await page.locator("#btn-reset-profile").boundingBox();
  const saveBtnBox = await page.locator("#btn-save-company-profile").boundingBox();
  console.log("Vị trí X nút Làm mới (phụ):", resetBtnBox.x, "Vị trí X nút Lưu (chính):", saveBtnBox.x);
  if (resetBtnBox.x >= saveBtnBox.x) throw new Error("Nút phụ không nằm bên trái nút chính");
  console.log("OK: BUG-05 thứ tự nút đúng chuẩn quy ước.");

  // 7. Test Thiết kế mới khối Tiêu chí xác thực (Bước 5)
  console.log("=== BƯỚC 8: Test Thiết kế mới khối Tiêu chí xác thực (Bước 5) ===");
  // Kiểm tra không còn ô icon màu hay pill xám
  const iconBoxCount = await page.locator(".criterion-icon").count();
  const pillCount = await page.locator(".criteria-summary-pill, .criterion-badge").count();
  console.log("Số lượng ô icon màu:", iconBoxCount, "(yêu cầu: 0)");
  console.log("Số lượng pill xám:", pillCount, "(yêu cầu: 0)");
  if (iconBoxCount > 0) throw new Error("Vẫn còn ô icon màu cũ!");
  if (pillCount > 0) throw new Error("Vẫn còn pill xám cũ!");

  // Kiểm tra thanh tiến độ mảnh & aria attributes
  const progressBar = page.locator('.criteria-progress-track[role="progressbar"]');
  await progressBar.waitFor({ state: "visible" });
  const valNow = await progressBar.getAttribute("aria-valuenow");
  const valMax = await progressBar.getAttribute("aria-valuemax");
  const progressText = await page.locator("#emp-criteria-summary").textContent();
  console.log(`Tiến độ: ${valNow}/${valMax} (${progressText})`);
  if (!valNow || !valMax) throw new Error("Thanh tiến độ thiếu thuộc tính aria");

  // Kiểm tra tiêu chí thời gian account_age trong nhóm Đang chờ và KHÔNG có màu đỏ
  const waitingGroup = page.locator('.criteria-group[aria-label="Đang chờ"]');
  if (await waitingGroup.count() > 0) {
    const ageItem = waitingGroup.locator('.criteria-item[data-criterion-code="account_age"]');
    if (await ageItem.count() > 0) {
      const waitColor = await ageItem.locator(".criteria-tag--waiting").evaluate((el) => window.getComputedStyle(el).color);
      const waitText = await ageItem.locator(".criteria-item-desc").textContent();
      console.log("Màu chữ tiêu chí thời gian:", waitColor);
      console.log("Văn bản tiêu chí thời gian:", waitText);
      // Đảm bảo không phải màu đỏ (rgb(185, 28, 28) hoặc tương đương)
      if (waitColor.includes("185, 28, 28") || waitColor.includes("239, 68, 68")) {
        throw new Error("Tiêu chí thời gian vẫn hiển thị màu đỏ!");
      }
      if (!waitText.includes("ngày")) throw new Error("Tiêu chí thời gian thiếu thông tin số ngày");
    }
  }

  // Kiểm tra nút Giải thích cách tính là text link (không viền)
  const tipBtn = page.locator("#emp-criteria-tip-btn");
  const btnBorder = await tipBtn.evaluate((el) => window.getComputedStyle(el).borderStyle);
  console.log("Viền nút Giải thích cách tính:", btnBorder);
  if (btnBorder !== "none") throw new Error("Nút Giải thích cách tính vẫn có khung viền hộp");

  // Chụp ảnh màn hình Desktop hoàn chỉnh
  await page.screenshot({ path: `${ARTIFACT_DIR}/desktop_employer_criteria_redesigned.png`, fullPage: true });

  // 8. Test Responsive Mobile 375px
  console.log("=== BƯỚC 9: Test Responsive Mobile 375px (Khối logo & tiêu chí không tràn) ===");
  await page.setViewportSize({ width: 375, height: 720 });
  await page.waitForTimeout(500);

  const overflowInfo = await page.evaluate(() => {
    const b1 = document.getElementById("company-logo-block");
    const b2 = document.getElementById("employer-criteria-block");
    return {
      logoOverflow: b1 ? (b1.scrollWidth > b1.clientWidth + 2) : false,
      criteriaOverflow: b2 ? (b2.scrollWidth > b2.clientWidth + 2) : false,
    };
  });
  console.log("Mobile overflow check:", overflowInfo);
  if (overflowInfo.logoOverflow) throw new Error("Khối logo bị tràn ngang trên màn hình mobile 375px");
  if (overflowInfo.criteriaOverflow) throw new Error("Khối tiêu chí bị tràn ngang trên màn hình mobile 375px");

  await page.screenshot({ path: `${ARTIFACT_DIR}/mobile_375_criteria_redesigned.png`, fullPage: true });
  console.log("OK: Responsive mobile 375px đạt chuẩn hoàn hảo.");

  console.log("=== TẤT CẢ KIỂM THỬ PLAYWRIGHT UI ĐÃ PASS 100%! ===");
  await browser.close();
}

run().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
