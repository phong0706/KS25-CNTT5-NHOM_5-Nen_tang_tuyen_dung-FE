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
  const context = await browser.newContext({ viewport: { width: 1360, height: 850 } });
  const page = await context.newPage();

  await page.addInitScript(({ token, user }) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", user);
    localStorage.setItem("auth_role", "admin");
  }, { token: TOKEN, user: USER_DATA });

  console.log("1. Mở trang quản trị công ty...");
  await page.goto(`${BASE_URL}/pages/admin/companies.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_admin_companies_all_demo.png" });

  console.log("2. Tab Đang chờ duyệt...");
  await page.locator('button[data-verif-filter="cho_duyet"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_admin_companies_pending_demo.png" });

  console.log("3. Tab Đã xác minh...");
  await page.locator('button[data-verif-filter="da_xac_minh"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_admin_companies_verified_demo.png" });

  console.log("4. Tab Chưa được duyệt...");
  await page.locator('button[data-verif-filter="tu_choi"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_admin_companies_rejected_demo.png" });

  console.log("5. Mở chi tiết công ty ZaloPay để xem lý do từ chối...");
  const row = page.locator("#adm-comp-tbody tr.is-clickable").first();
  await row.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_admin_company_detail_demo.png" });

  console.log("Chụp ảnh UI demo hoàn tất!");
  await browser.close();
}

run().catch((e) => {
  console.error("Lỗi:", e);
  process.exit(1);
});
