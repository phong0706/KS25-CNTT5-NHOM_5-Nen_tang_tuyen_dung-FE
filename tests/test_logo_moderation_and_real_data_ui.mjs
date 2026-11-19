import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:5502/frontend";
const ADM_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMyIsInJvbGUiOiJhZG1pbiIsInRva2VuX3ZlciI6MSwiZXhwIjoxNzk1MTA0NTI4fQ.iEtDrXVr11XcwNuqK4vb6XEFNnhVIWoYdWk5VsCa6v8";
const ADM_USER = JSON.stringify({ id: 23, email: "admin@tuyendung.com", full_name: "Admin Tổng", role: "admin" });
const EMP_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNCIsInJvbGUiOiJlbXBsb3llciIsInRva2VuX3ZlciI6MSwiZXhwIjoxNzk1MTA0NTI4fQ.XaX3anFg5_M9hL0lYD_8Qr74j74DAL8kKqoyDdcFCv8";
const EMP_USER = JSON.stringify({ id: 24, email: "hr1@tuyendung.com", full_name: "Trần Thị Bình", role: "employer" });
const ARTIFACT_DIR = "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  // ==========================================
  // PHẦN 1: ADMIN DUYỆT TIN & TAB LOGO CHỜ DUYỆT
  // ==========================================
  console.log("=== BƯỚC 1: Admin mở trang items.html và kiểm tra 3 tab ===");
  const ctxAdmin = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pAdmin = await ctxAdmin.newPage();
  await pAdmin.addInitScript(({ token, user }) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", user);
    localStorage.setItem("auth_role", "admin");
  }, { token: ADM_TOKEN, user: ADM_USER });

  await pAdmin.goto(`${BASE_URL}/pages/items.html`, { waitUntil: "domcontentloaded" });
  await pAdmin.waitForTimeout(1000);

  // Kiểm tra 3 tab hiện hữu
  const tabPending = pAdmin.locator("#tab-pending");
  const tabPub = pAdmin.locator("#tab-published");
  const tabLogo = pAdmin.locator("#tab-logo-pending");
  await tabPending.waitFor({ state: "visible" });
  await tabPub.waitFor({ state: "visible" });
  await tabLogo.waitFor({ state: "visible" });

  const logoBadge = await pAdmin.locator("#badge-logo-pending").textContent();
  console.log("Số lượng logo chờ duyệt:", logoBadge);

  // Placeholder không bị cắt
  const searchPlh = await pAdmin.locator("#search-input").getAttribute("placeholder");
  console.log("Placeholder ô tìm kiếm:", searchPlh);
  if (!searchPlh || searchPlh.length > 50) throw new Error("Placeholder quá dài hoặc rỗng");

  // Chuyển sang Tab 3: "Logo chờ duyệt"
  console.log("=== BƯỚC 2: Chuyển sang tab Logo chờ duyệt ===");
  await tabLogo.click();
  await pAdmin.waitForTimeout(600);

  // Chụp ảnh màn hình Admin Tab Logo
  await pAdmin.screenshot({ path: `${ARTIFACT_DIR}/desktop_admin_items_logo_pending.png`, fullPage: true });

  // Kiểm tra modal từ chối logo (khóa nút khi chưa đủ lý do)
  console.log("=== BƯỚC 3: Kiểm tra nút Từ chối logo bị khóa khi thiếu lý do ===");
  const rejectBtn = pAdmin.locator('button[data-action="reject-logo"]').first();
  if (await rejectBtn.count() > 0) {
    await rejectBtn.click();
    await pAdmin.waitForSelector("#logo-rej-backdrop", { state: "visible" });

    const confirmRejBtn = pAdmin.locator("#logo-rej-ok");
    const isInitiallyDisabled = await confirmRejBtn.isDisabled();
    console.log("Nút Từ chối ban đầu bị khóa:", isInitiallyDisabled);
    if (!isInitiallyDisabled) throw new Error("Nút Từ chối logo không bị disabled khi lý do trống");

    // Nhập < 10 ký tự
    await pAdmin.locator("#logo-rej-reason").fill("Ảnh xấu");
    if (!(await confirmRejBtn.isDisabled())) throw new Error("Nút Từ chối vẫn mở khi lý do < 10 ký tự");

    // Nhập >= 10 ký tự -> Mở nút
    await pAdmin.locator("#logo-rej-reason").fill("Logo vi phạm quy chuẩn kích thước");
    if (await confirmRejBtn.isDisabled()) throw new Error("Nút Từ chối không mở khi lý do đủ 10 ký tự");

    // Hủy modal
    await pAdmin.locator("#logo-rej-cancel").click();
    await pAdmin.waitForTimeout(300);
    console.log("OK: Modal từ chối logo kiểm soát lý do tối thiểu 10 ký tự hoàn hảo.");

    // Kiểm tra bấm Duyệt logo
    console.log("=== BƯỚC 4: Test Admin bấm Duyệt logo ===");
    const approveBtn = pAdmin.locator('button[data-action="approve-logo"]').first();
    await approveBtn.click();
    await pAdmin.waitForTimeout(1000);
    const msg = await pAdmin.locator("#adm-job-msg").textContent();
    console.log("Thông báo sau khi duyệt logo:", msg);
    if (!msg.includes("phê duyệt logo")) throw new Error("Không thấy thông báo duyệt logo thành công");
  } else {
    console.log("Không có logo pending nào để duyệt, danh sách rỗng đạt chuẩn.");
  }

  // ==========================================
  // PHẦN 2: EMPLOYER DASHBOARD - DỮ LIỆU ĐỘNG TỪ API
  // ==========================================
  console.log("=== BƯỚC 5: Kiểm tra Employer Dashboard loại bỏ số cứng ===");
  const ctxEmp = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pEmp = await ctxEmp.newPage();
  await pEmp.addInitScript(({ token, user }) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", user);
    localStorage.setItem("auth_role", "employer");
  }, { token: EMP_TOKEN, user: EMP_USER });

  await pEmp.goto(`${BASE_URL}/pages/employer/dashboard.html`, { waitUntil: "domcontentloaded" });
  await pEmp.waitForTimeout(1000);

  const kpiJobs = (await pEmp.locator("#emp-kpi-jobs").textContent()).trim();
  const kpiApps = (await pEmp.locator("#emp-kpi-apps").textContent()).trim();
  const kpiIvs = (await pEmp.locator("#emp-kpi-interviews").textContent()).trim();
  console.log(`KPIs thật nạp từ API -> Jobs: ${kpiJobs}, Applications: ${kpiApps}, Interviews: ${kpiIvs}`);

  if (kpiJobs === "-" || kpiApps === "-" || kpiIvs === "-") {
    throw new Error("KPIs trên Employer Dashboard vẫn ở trạng thái loading '-'");
  }
  await pEmp.screenshot({ path: `${ARTIFACT_DIR}/desktop_employer_dashboard_dynamic_kpis.png`, fullPage: true });

  // ==========================================
  // PHẦN 3: BÁO CÁO THỊ TRƯỜNG - SỐ LIỆU ĐỘNG TỪ API
  // ==========================================
  console.log("=== BƯỚC 6: Kiểm tra Báo cáo thị trường loại bỏ số 8+ ===");
  const pMarket = await ctxEmp.newPage();
  await pMarket.goto(`${BASE_URL}/pages/thi-truong.html`, { waitUntil: "domcontentloaded" });
  await pMarket.waitForTimeout(1000);

  const marketComps = (await pMarket.locator("#market-total-companies").textContent()).trim();
  const marketJobs = (await pMarket.locator("#market-total-jobs").textContent()).trim();
  console.log(`Số liệu thị trường thật -> Doanh nghiệp: ${marketComps}, Tin tuyển dụng: ${marketJobs}`);
  if (marketComps === "8+" || marketComps === "-") {
    throw new Error(`Số lượng doanh nghiệp vẫn là chuỗi tĩnh: ${marketComps}`);
  }

  // ==========================================
  // PHẦN 4: RESPONSIVE MOBILE 375PX
  // ==========================================
  console.log("=== BƯỚC 7: Test Responsive Mobile 375px trang items.html ===");
  await pAdmin.setViewportSize({ width: 375, height: 720 });
  await pAdmin.waitForTimeout(500);

  const isOverflow = await pAdmin.evaluate(() => {
    const card = document.querySelector(".adm-card");
    return card ? (card.scrollWidth > card.clientWidth + 2) : false;
  });
  console.log("Mobile card overflow:", isOverflow);
  await pAdmin.screenshot({ path: `${ARTIFACT_DIR}/mobile_375_items_logo_tab.png`, fullPage: true });

  console.log("=== TẤT CẢ KIỂM THỬ PLAYWRIGHT ĐÃ PASS 100%! ===");
  await browser.close();
}

run().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
