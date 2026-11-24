/**
 * Playwright test kiểm thử UI trang Duyệt tin tuyển dụng (pages/items.html).
 * Chạy với Node ESM: node frontend/tests/test_items_moderation_ui.mjs
 */
import { execSync } from "child_process";
import { chromium } from "file:///E:/THỰC TẬP NHÓM 5 RIKKEILAB/base/node_modules/playwright/index.mjs";

const BASE_URL = "http://127.0.0.1:5502/frontend";

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ PLAYWRIGHT UI DUYỆT TIN (PAGES/ITEMS.HTML) ===");
  const adminToken = execSync(
    'backend\\.venv\\Scripts\\python.exe -c "import sys; sys.path.insert(0, \'backend\'); from app.db.session import SessionLocal; from app.models.user import User; from app.core.security import create_access_token; db = SessionLocal(); adm = db.query(User).filter_by(role=\'admin\', is_active=True).first(); print(create_access_token(adm.id, \'admin\'))"'
  ).toString().trim();

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext();
  await context.addInitScript((tok) => {
    localStorage.setItem("auth_token", tok);
    localStorage.setItem("auth_role", "admin");
    localStorage.setItem("auth_user", JSON.stringify({ id: 23, email: "admin@tuyendung.com", role: "admin", full_name: "Admin" }));
  }, adminToken);
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(cond, name) {
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. Kiểm tra tiêu đề và không có form đăng tin
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/pages/items.html`, { waitUntil: "networkidle" });
    await page.waitForSelector("#page-title");

    const pageTitle = await page.textContent("#page-title");
    assert(pageTitle.includes("Duyệt tin tuyển dụng"), "Tiêu đề trang là 'Duyệt tin tuyển dụng'");

    const hasNewJobForm = await page.evaluate(() => {
      return document.querySelector("form") !== null || document.getElementById("item-form") !== null;
    });
    assert(!hasNewJobForm, "Không còn form đăng tin mới trong trang items.html");

    // 2. Tab Chờ duyệt mặc định & có bảng danh sách
    await page.waitForSelector("#job-table-body tr");
    const activeTab = await page.evaluate(() => {
      const tab = document.getElementById("tab-pending");
      return tab.classList.contains("is-active") && tab.getAttribute("aria-selected") === "true";
    });
    assert(activeTab, "Tab 'Chờ duyệt' được chọn mặc định");

    const badgePendingCount = await page.textContent("#badge-pending");
    assert(Number(badgePendingCount) >= 0, `Badge chờ duyệt có số đếm (${badgePendingCount})`);

    // 3. Chụp ảnh màn hình Desktop tab Chờ duyệt
    await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_items_pending_tab.png" });
    console.log("Đã lưu ảnh: desktop_items_pending_tab.png");

    // 4. Modal xác nhận xóa tin pending: bắt buộc lý do >= 10 ký tự
    const deleteBtn = await page.$("button[data-action='delete']");
    if (deleteBtn) {
      await deleteBtn.click();
      await page.waitForSelector("#job-del-title");

      const isReasonPresent = await page.evaluate(() => {
        return document.getElementById("job-del-reason") !== null;
      });
      assert(isReasonPresent, "Modal xóa tin pending có ô nhập lý do");

      const isDelBtnDisabledInitially = await page.evaluate(() => {
        return document.getElementById("job-del-ok").disabled === true;
      });
      assert(isDelBtnDisabledInitially, "Nút 'Xóa tin' bị khóa khi chưa nhập lý do");

      // Nhập < 10 ký tự
      await page.fill("#job-del-reason", "Lý do");
      const hintText = await page.textContent("#job-del-hint");
      assert(hintText.includes("Còn thiếu"), `Hint đếm ký tự hiển thị chính xác: '${hintText}'`);

      // Nhập >= 10 ký tự
      await page.fill("#job-del-reason", "Nội dung vi phạm quy định tuyển dụng TechRecruit");
      const isDelBtnEnabled = await page.evaluate(() => {
        return document.getElementById("job-del-ok").disabled === false;
      });
      assert(isDelBtnEnabled, "Nút 'Xóa tin' được kích hoạt khi lý do >= 10 ký tự");

      // Chụp ảnh modal xóa tin pending
      await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_items_delete_modal_pending.png" });
      console.log("Đã lưu ảnh: desktop_items_delete_modal_pending.png");

      // 5. Phím Escape đóng modal
      await page.keyboard.press("Escape");
      const isModalClosed = await page.evaluate(() => {
        return document.getElementById("job-del-backdrop") === null;
      });
      assert(isModalClosed, "Phím Escape đóng modal xóa tin an toàn");
    }

    // 6. Chuyển sang tab Đang tuyển
    await page.click("#tab-published");
    await page.waitForTimeout(500);
    const isPubTabActive = await page.evaluate(() => {
      const tab = document.getElementById("tab-published");
      return tab.classList.contains("is-active") && tab.getAttribute("aria-selected") === "true";
    });
    assert(isPubTabActive, "Chuyển thành công sang tab 'Đang tuyển'");

    // Chụp ảnh màn hình tab Đang tuyển
    await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_items_published_tab.png" });
    console.log("Đã lưu ảnh: desktop_items_published_tab.png");

    // Modal xóa trên tab Đang tuyển: không yêu cầu lý do, chỉ cảnh báo
    const deletePubBtn = await page.$("button[data-action='delete']");
    if (deletePubBtn) {
      await deletePubBtn.click();
      await page.waitForSelector("#job-del-title");

      const hasReasonField = await page.evaluate(() => {
        return document.getElementById("job-del-reason") !== null;
      });
      assert(!hasReasonField, "Tab Đang tuyển: Modal xóa không yêu cầu ô lý do");

      const modalDesc = await page.evaluate(() => {
        return document.querySelector("#job-del-backdrop p").textContent;
      });
      assert(modalDesc.includes("Tin sẽ biến khỏi trang công khai ngay"), "Modal hiện thông báo: 'Tin sẽ biến khỏi trang công khai ngay.'");

      // Chụp ảnh modal xóa tin đang tuyển
      await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_items_delete_modal_published.png" });
      console.log("Đã lưu ảnh: desktop_items_delete_modal_published.png");

      await page.click("#job-del-cancel");
    }

    // 7. Responsive 375px không tràn ngang
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    const noOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    assert(noOverflow, "Viewport 375px: Không bị cuộn tràn ngang");

    await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/mobile_375_items_moderation.png" });
    console.log("Đã lưu ảnh: mobile_375_items_moderation.png");

  } catch (err) {
    console.error("Lỗi trong quá trình test UI:", err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\n=== KẾT QUẢ: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests();
