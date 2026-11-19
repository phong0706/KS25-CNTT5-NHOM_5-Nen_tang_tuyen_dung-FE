import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:5502/frontend";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMyIsInJvbGUiOiJhZG1pbiIsInRva2VuX3ZlciI6MSwiZXhwIjoxNzk1MDk5MTk3fQ.S3cztp0KKKriz8gSN1TGvSM90P4NNSFNVWU-F-ARB9U";
const USER_DATA = JSON.stringify({
  id: 23,
  email: "admin@tuyendung.com",
  full_name: "System Admin",
  role: "admin",
  is_active: true,
  is_verified: true,
});

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Set auth token in localStorage before navigation
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", user);
    localStorage.setItem("auth_role", "admin");
  }, { token: TOKEN, user: USER_DATA });

  page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("BROWSER ERROR:", err));

  page.on("requestfailed", (req) => console.log("REQUEST FAILED:", req.url(), req.failure()?.errorText));
  page.on("response", (res) => { if (res.status() >= 400) console.log("HTTP ERROR:", res.status(), res.url()); });

  console.log("=== BƯỚC 1: Mở URL có query ?verif_status=cho_duyet ===");
  await page.goto(`${BASE_URL}/pages/admin/companies.html?verif_status=cho_duyet`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  console.log("Current page URL:", page.url());

  const pendingTab = page.locator('button[data-verif-filter="cho_duyet"]');
  await pendingTab.waitFor({ state: "visible", timeout: 10000 });
  const isPendingActive = await pendingTab.evaluate((el) => el.classList.contains("is-active"));
  console.log("Tab 'Đang chờ duyệt' active:", isPendingActive);
  if (!isPendingActive) throw new Error("Tab 'Đang chờ duyệt' không có class is-active khi mở URL ?verif_status=cho_duyet");

  // Kiểm tra bảng danh sách chỉ hiển thị công ty chờ duyệt
  const rows = page.locator("#adm-comp-tbody tr.is-clickable");
  const rowCount = await rows.count();
  console.log("Số công ty chờ duyệt trong bảng:", rowCount);
  if (rowCount === 0) throw new Error("Không có công ty chờ duyệt nào trong bảng");

  const companyName = await rows.first().locator("td.col-sticky-name").innerText();
  console.log("Tên công ty trong danh sách:", companyName.trim());

  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_admin_companies_url_tab_synced.png" });

  console.log("=== BƯỚC 2: Chuyển tab sang 'Đã xác minh' và kiểm tra URL cập nhật ===");
  const verifRespPromise = page.waitForResponse((res) => res.url().includes("/admin/company-verifications") && res.status() === 200);
  await page.locator('button[data-verif-filter="da_xac_minh"]').click();
  await verifRespPromise;
  await page.waitForTimeout(300);

  const currentUrl = page.url();
  console.log("URL sau khi click tab Đã xác minh:", currentUrl);
  if (!currentUrl.includes("verif_status=da_xac_minh")) throw new Error("URL không cập nhật ?verif_status=da_xac_minh");

  const isVerifiedActive = await page.locator('button[data-verif-filter="da_xac_minh"]').evaluate((el) => el.classList.contains("is-active"));
  console.log("Tab 'Đã xác minh' active:", isVerifiedActive);
  if (!isVerifiedActive) throw new Error("Tab 'Đã xác minh' không active sau khi click");

  console.log("=== BƯỚC 3: Thử popstate (Back trình duyệt) ===");
  const backResponsePromise = page.waitForResponse((res) => res.url().includes("/admin/company-verifications") && res.status() === 200);
  await page.goBack();
  await backResponsePromise;
  await page.waitForTimeout(300);

  console.log("URL sau khi ấn Back:", page.url());
  const isPendingActiveAgain = await page.locator('button[data-verif-filter="cho_duyet"]').evaluate((el) => el.classList.contains("is-active"));
  console.log("Tab 'Đang chờ duyệt' active sau khi Back:", isPendingActiveAgain);
  if (!isPendingActiveAgain) throw new Error("Tab 'Đang chờ duyệt' không tự active lại sau khi Back");

  console.log("=== BƯỚC 4: Chọn công ty chờ duyệt để mở Panel chi tiết ===");
  const rowTarget = page.locator("#adm-comp-tbody tr[data-id='7']");
  await rowTarget.waitFor({ state: "visible" });
  await rowTarget.click();
  await page.waitForTimeout(300);

  const approveBtn = page.locator("#btn-approve-verif");
  await approveBtn.waitFor({ state: "visible" });
  const isApproveInitiallyDisabled = await approveBtn.isDisabled();
  console.log("Nút 'Xác minh' mặc định bị disabled:", isApproveInitiallyDisabled);
  if (!isApproveInitiallyDisabled) throw new Error("Nút 'Xác minh' chưa bị disabled khi các tiêu chí chưa đủ");

  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_admin_verif_button_disabled.png" });

  console.log("=== BƯỚC 5: Kiểm tra các checkbox tiêu chí và trạng thái nút Xác minh ===");
  const checkboxes = page.locator(".adm-criterion-check");
  const countChecks = await checkboxes.count();
  console.log("Số checkbox tiêu chí tìm thấy:", countChecks);
  if (countChecks !== 5) throw new Error(`Mong đợi 5 checkbox tiêu chí nhưng tìm thấy ${countChecks}`);

  // Đảm bảo bỏ tick hết các checkbox chưa đạt
  for (let i = 0; i < countChecks; i++) {
    const cb = checkboxes.nth(i);
    await cb.uncheck();
  }
  await page.waitForTimeout(100);
  console.log("Khi uncheck toàn bộ: Nút Xác minh disabled =", await approveBtn.isDisabled());
  if (!(await approveBtn.isDisabled())) throw new Error("Nút Xác minh không bị disabled khi uncheck toàn bộ");

  // Tick 4/5 tiêu chí
  for (let i = 0; i < 4; i++) {
    await checkboxes.nth(i).check();
  }
  await page.waitForTimeout(100);
  console.log("Khi tick 4/5 tiêu chí: Nút Xác minh disabled =", await approveBtn.isDisabled());
  if (!(await approveBtn.isDisabled())) throw new Error("Nút Xác minh vẫn phải disabled khi chỉ tick 4/5 tiêu chí");

  // Tick tiêu chí thứ 5 (đủ 5/5)
  await checkboxes.nth(4).check();
  await page.waitForTimeout(100);
  const isEnabledWhenAllTicked = !(await approveBtn.isDisabled());
  console.log("Khi tick đủ 5/5 tiêu chí: Nút Xác minh enabled =", isEnabledWhenAllTicked);
  if (!isEnabledWhenAllTicked) throw new Error("Nút Xác minh không được bật khi tick đủ 5/5 tiêu chí");

  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_admin_verif_button_enabled.png" });

  // Bỏ tick 1 ô -> lại disabled
  await checkboxes.nth(2).uncheck();
  await page.waitForTimeout(100);
  console.log("Bỏ tick 1 tiêu chí: Nút Xác minh disabled =", await approveBtn.isDisabled());
  if (!(await approveBtn.isDisabled())) throw new Error("Nút Xác minh không bị disabled lại khi bỏ tick 1 tiêu chí");

  console.log("=== TẤT CẢ KIỂM THỬ FRONTEND THÀNH CÔNG RỰC RỠ! ===");
  await browser.close();
}

run().catch((err) => {
  console.error("LỖI TEST:", err);
  process.exit(1);
});
