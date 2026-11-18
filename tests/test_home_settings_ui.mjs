import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:5502/frontend";
const ADM_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMyIsInJvbGUiOiJhZG1pbiIsInRva2VuX3ZlciI6MSwiZXhwIjoxNzk1MTA2MzQ2fQ.FSYjB1CbTEHNLUUcojNiYF1k8aah6fXIWboqGOOuZSk";
const ADM_USER = JSON.stringify({ id: 23, email: "admin@tuyendung.com", full_name: "Admin Tổng", role: "admin" });
const ARTIFACT_DIR = "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  try {
    // 1. ADMIN VÀO TRANG HOME-SETTINGS (1280px Desktop)
    console.log("=== BƯỚC 1: Admin mở home-settings.html tại 1280px ===");
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", user);
      localStorage.setItem("auth_role", "admin");
    }, { token: ADM_TOKEN, user: ADM_USER });

    await page.goto(`${BASE_URL}/pages/admin/home-settings.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Kiểm tra title và heading
    const heading = await page.locator("#hs-heading").textContent();
    console.log("Tiêu đề trang:", heading);
    if (!heading.includes("Cấu hình hiển thị Trang chủ")) throw new Error("Sai tiêu đề trang");

    // Chờ tải bảng kỹ năng và doanh nghiệp
    await page.waitForSelector("#hs-skills-tbody tr", { timeout: 5000 });
    await page.waitForSelector("#hs-companies-tbody tr", { timeout: 5000 });

    // Chụp ảnh màn hình Desktop 1280px
    await page.screenshot({ path: `${ARTIFACT_DIR}/desktop_1280_admin_home_settings.png`, fullPage: true });
    console.log("Đã chụp desktop_1280_admin_home_settings.png");

    // 2. CHUYỂN TAB SANG NHẬT KÝ (AUDIT) VÀ QUAY LẠI
    console.log("=== BƯỚC 2: Kiểm tra chuyển tab Audit ===");
    const tabAudit = page.locator("#tab-btn-audit");
    await tabAudit.click();
    await page.waitForTimeout(600);
    const auditVisible = await page.locator("#tab-panel-audit").isVisible();
    if (!auditVisible) throw new Error("Tab audit không hiển thị");

    // Quay lại tab config
    await page.locator("#tab-btn-config").click();
    await page.waitForTimeout(400);

    // 3. THAO TÁC GHIM KỸ NĂNG VÀ KIỂM TRA THANH DIRTY BAR
    console.log("=== BƯỚC 3: Ghim kỹ năng & kiểm tra thanh lưu cố định ===");
    const pinBtn = page.locator('#hs-skills-tbody button[data-val="pinned"]').first();
    if (await pinBtn.count() > 0) {
      await pinBtn.click();
      await page.waitForTimeout(300);
    }

    // Kiểm tra thanh lưu xuất hiện
    const saveBar = page.locator("#hs-save-bar");
    const isSaveBarVisible = await saveBar.evaluate((el) => el.classList.contains("visible"));
    console.log("Thanh lưu cố định hiển thị:", isSaveBarVisible);
    if (!isSaveBarVisible) throw new Error("Thanh lưu cố định không xuất hiện khi có thay đổi");

    // 4. KIỂM TRA MODAL LƯU VÀ VALIDATION LÝ DO >= 10 KÝ TỰ
    console.log("=== BƯỚC 4: Kiểm tra modal xác nhận lưu & validation lý do ===");
    await page.locator("#hs-save-btn").click();
    await page.waitForSelector("#hs-reason-modal.open", { timeout: 3000 });

    const submitBtn = page.locator("#hs-modal-submit-btn");
    const isSubmitDisabledInitially = await submitBtn.isDisabled();
    if (!isSubmitDisabledInitially) throw new Error("Nút lưu phải disabled khi chưa nhập lý do");

    // Nhập lý do ngắn (< 10 ký tự)
    await page.locator("#hs-reason-input").fill("Lý do");
    if (!(await submitBtn.isDisabled())) throw new Error("Nút lưu phải disabled khi lý do < 10 ký tự");

    // Nhập lý do hợp lệ (>= 10 ký tự)
    await page.locator("#hs-reason-input").fill("Cập nhật ghim kỹ năng nổi bật cho chiến dịch Q4");
    if (await submitBtn.isDisabled()) throw new Error("Nút lưu phải enable khi lý do >= 10 ký tự");

    // Test Esc để đóng modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    // Mở lại và xác nhận lưu
    await page.locator("#hs-save-btn").click();
    await page.waitForSelector("#hs-reason-modal.open");
    await page.locator("#hs-reason-input").fill("Cập nhật ghim kỹ năng nổi bật cho chiến dịch Q4");
    await submitBtn.click();
    await page.waitForTimeout(1200);

    // 5. TEST GIAO DIỆN TABLET (768px) VÀ MOBILE (375px)
    console.log("=== BƯỚC 5: Chụp ảnh Tablet 768px và Mobile 375px ===");
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${ARTIFACT_DIR}/tablet_768_admin_home_settings.png`, fullPage: true });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${ARTIFACT_DIR}/mobile_375_admin_home_settings.png`, fullPage: true });

    // 6. KIỂM TRA TRANG CHỦ CÔNG KHAI (index.html)
    console.log("=== BƯỚC 6: Kiểm tra trang chủ công khai index.html ===");
    const pHome = await ctx.newPage();
    await pHome.setViewportSize({ width: 1280, height: 900 });
    await pHome.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
    await pHome.waitForTimeout(1500);

    // Kiểm tra không có chuỗi cứng "54 tin"
    const subText = await pHome.locator("#salary-skills-sub").textContent();
    console.log("Phụ đề lương thực tế trên Home:", subText);
    if (subText.includes("54 tin")) throw new Error("Vẫn còn chuỗi tĩnh '54 tin'");

    await pHome.screenshot({ path: `${ARTIFACT_DIR}/desktop_1280_public_home.png`, fullPage: true });
    console.log("Đã chụp desktop_1280_public_home.png");

    console.log("=== HOÀN TẤT 100% TEST GIAO DIỆN UI ===");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Test UI thất bại:", err);
  process.exit(1);
});
