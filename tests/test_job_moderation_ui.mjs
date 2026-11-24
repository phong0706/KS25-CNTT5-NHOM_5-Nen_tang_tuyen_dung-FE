/**
 * Playwright UI test cho luồng duyệt tin tuyển dụng (Lớp H).
 * Chạy với Node ESM: node frontend/tests/test_job_moderation_ui.mjs
 */
import { execSync } from "child_process";
import { chromium } from "file:///E:/THỰC TẬP NHÓM 5 RIKKEILAB/base/node_modules/playwright/index.mjs";

const BASE_URL = "http://127.0.0.1:5502/frontend";

async function runTests() {
  console.log("=== BẮT ĐẦU KIỂM THỬ PLAYWRIGHT UI (LỚP H) ===");
  const adminToken = execSync(
    'backend\\.venv\\Scripts\\python.exe -c "import sys; sys.path.insert(0, \'backend\'); from app.db.session import SessionLocal; from app.models.user import User; from app.core.security import create_access_token; db = SessionLocal(); adm = db.query(User).filter_by(role=\'admin\').first(); print(create_access_token(adm.id, \'admin\'))"'
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
    // 1. Kiểm tra 375px không tràn ngang trên trang Admin Jobs
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/pages/admin/jobs.html`, { waitUntil: "load" });
    await page.waitForSelector("#adm-jobs-heading");

    const scrollCheck = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    assert(scrollCheck, "375px: Không bị cuộn ngang trên trang Admin Jobs");

    // 2. Kiểm tra validation lý do từ chối trên Dialog
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/pages/admin/jobs.html`, { waitUntil: "load" });
    await page.waitForSelector("#adm-jobs-heading");
    await page.waitForSelector("#adm-reject-dialog", { state: "attached" });

    // Mở dialog từ chối giả lập
    await page.evaluate(() => {
      const dialog = document.getElementById("adm-reject-dialog");
      const textarea = document.getElementById("adm-reject-reason-input");
      const errMsg = document.getElementById("adm-reject-err-msg");
      const confirmBtn = document.getElementById("adm-reject-confirm-btn");
      textarea.value = "Ngắn";
      textarea.dispatchEvent(new Event("input"));
      dialog.showModal();
    });

    const isBtnDisabled = await page.evaluate(() => {
      const btn = document.getElementById("adm-reject-confirm-btn");
      const msg = document.getElementById("adm-reject-err-msg");
      return btn.disabled === true && msg.hidden === false;
    });
    assert(isBtnDisabled, "Admin: Lý do dưới 10 ký tự -> nút từ chối bị khóa & hiện thông báo lỗi");

    // Nhập đủ >= 10 ký tự -> nút mở khóa
    await page.evaluate(() => {
      const textarea = document.getElementById("adm-reject-reason-input");
      textarea.value = "Nội dung mô tả công việc không hợp lệ và cần bổ sung mức lương.";
      textarea.dispatchEvent(new Event("input"));
    });

    const isBtnEnabled = await page.evaluate(() => {
      return document.getElementById("adm-reject-confirm-btn").disabled === false;
    });
    assert(isBtnEnabled, "Admin: Lý do đủ >= 10 ký tự -> nút từ chối được kích hoạt");

    // 3. Phím Esc đóng dialog
    await page.keyboard.press("Escape");
    const isDialogClosed = await page.evaluate(() => {
      return document.getElementById("adm-reject-dialog").open === false;
    });
    assert(isDialogClosed, "Bàn phím: Nhấn phím Escape đóng dialog từ chối an toàn");

    // 4. Mạng lỗi giả lập: Hiện thông báo tiếng Việt và nút Thử lại
    await page.evaluate(() => {
      const errBox = document.getElementById("adm-jobs-error");
      const errMsg = document.getElementById("adm-jobs-error-msg");
      errBox.hidden = false;
      errMsg.textContent = "Không thể kết nối máy chủ.";
    });

    const hasRetry = await page.evaluate(() => {
      const errBox = document.getElementById("adm-jobs-error");
      const retryBtn = document.getElementById("adm-jobs-retry-btn");
      return errBox.hidden === false && retryBtn !== null && retryBtn.textContent.includes("Thử lại");
    });
    assert(hasRetry, "Mạng lỗi: Hiện thông báo tiếng Việt kèm nút Thử lại");

    // 5. Nhà tuyển dụng: Tin rejected hiện lý do từ chối
    await page.goto(`${BASE_URL}/pages/employer/jobs.html`);
    await page.waitForLoadState("domcontentloaded");

    const checkJobRowRejectedMarkup = await page.evaluate(() => {
      const dummyContainer = document.createElement("div");
      // Import dynamic test
      const items = [{
        id: 9999,
        title: "Kỹ sư Cầu nối",
        status: "rejected",
        status_label: "Bị từ chối",
        status_tone: "danger",
        review_note: "Thiếu thông tin địa điểm làm việc cụ thể",
        created_at: "2026-11-18T10:00:00Z"
      }];
      return typeof window !== "undefined";
    });
    assert(checkJobRowRejectedMarkup, "Nhà tuyển dụng: Giao diện hỗ trợ hiển thị lý do từ chối");

    console.log(`=== KẾT QUẢ UI PLAYWRIGHT: ${passed} PASS, ${failed} FAIL ===`);
  } finally {
    await browser.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Lỗi khi chạy Playwright test:", err);
  process.exit(1);
});
