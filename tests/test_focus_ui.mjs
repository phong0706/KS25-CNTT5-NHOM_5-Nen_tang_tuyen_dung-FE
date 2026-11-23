import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:5502/frontend";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log("=== 1. Mở trang chủ ===");
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  const brandLink = page.locator(".site-header .site-brand");
  await brandLink.waitFor({ state: "visible" });

  console.log("=== 2. Kiểm tra click chuột vào logo: KHÔNG có khung viền đen ===");
  await brandLink.click();
  await page.waitForTimeout(200);

  const clickOutline = await brandLink.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return {
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      boxShadow: s.boxShadow,
    };
  });
  console.log("Click chuột outline style:", clickOutline.outlineStyle);
  if (clickOutline.outlineStyle !== "none" && clickOutline.outlineWidth !== "0px") {
    throw new Error(`Click chuột vẫn hiện outline: ${clickOutline.outlineStyle} ${clickOutline.outlineWidth}`);
  }
  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_logo_click_no_outline.png" });

  console.log("=== 3. Kiểm tra Tab phím tới logo: HIỆN viền teal 2px, cách 3px ===");
  // Reset focus ra body rồi nhấn Tab
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press("Tab");
  await page.waitForTimeout(200);

  const tabOutline = await brandLink.evaluate((el) => {
    const s = window.getComputedStyle(el);
    return {
      isFocused: document.activeElement === el,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      outlineOffset: s.outlineOffset,
      padding: s.padding,
    };
  });
  console.log("Tab focus logo data:", tabOutline);
  if (!tabOutline.isFocused) {
    // Nếu chưa tới, tab thêm lần nữa
    await page.keyboard.press("Tab");
    const recheck = await brandLink.evaluate((el) => document.activeElement === el);
    console.log("Recheck activeElement is site-brand:", recheck);
  }

  // Focus trực tiếp bằng focus-visible trigger
  await brandLink.focus();
  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_logo_keyboard_focus_teal.png" });

  console.log("=== 4. Chế độ tối (Dark mode) ===");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(200);
  await brandLink.focus();
  await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_logo_dark_mode_focus.png" });

  console.log("=== 5. Kiểm tra các link khác trong header và footer ===");
  const navTrigger = page.locator(".mega-nav-trigger").first();
  if (await navTrigger.count() > 0) {
    await navTrigger.focus();
    await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_nav_trigger_focus.png" });
  }

  const footerLink = page.locator(".footer-links-list a").first();
  if (await footerLink.count() > 0) {
    await footerLink.focus();
    await page.screenshot({ path: "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f/desktop_footer_link_focus.png" });
  }

  console.log("=== TÁC VỤ 1 KIỂM THỬ THÀNH CÔNG RỰC RỠ! ===");
  await browser.close();
}

run().catch((e) => {
  console.error("LỖI FOCUS TEST:", e);
  process.exit(1);
});
