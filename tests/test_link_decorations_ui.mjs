import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:5502/frontend";
const ARTIFACT_DIR = "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f";

function parseColor(str, base = [255, 255, 255]) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return base;
  const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
  const a = m[4] != null ? Number(m[4]) : 1;
  return [
    Math.round(r * a + base[0] * (1 - a)),
    Math.round(g * a + base[1] * (1 - a)),
    Math.round(b * a + base[2] * (1 - a)),
  ];
}

function getContrast(rgb1, rgb2) {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map(v => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(rgb1), l2 = lum(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();

  console.log("=== 1. Kiểm tra Nav, Logo & Footer Link khi Hover ===");
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  const brandLink = page.locator(".site-header .site-brand");
  await brandLink.waitFor({ state: "visible" });
  await brandLink.hover();
  const brandHoverDec = await brandLink.evaluate((el) => window.getComputedStyle(el).textDecorationLine);
  console.log("Brand link hover text-decoration:", brandHoverDec);
  if (brandHoverDec !== "none") throw new Error(`Brand link có text-decoration: ${brandHoverDec}`);

  const navTrigger = page.locator(".site-header .mega-nav-trigger").first();
  if (await navTrigger.count() > 0) {
    await navTrigger.hover();
    const navDec = await navTrigger.evaluate((el) => window.getComputedStyle(el).textDecorationLine);
    console.log("Nav trigger hover text-decoration:", navDec);
    if (navDec !== "none") throw new Error(`Nav trigger có text-decoration: ${navDec}`);
  }

  const footerLink = page.locator("footer a, .site-footer a").first();
  if (await footerLink.count() > 0) {
    await footerLink.hover();
    const footDec = await footerLink.evaluate((el) => window.getComputedStyle(el).textDecorationLine);
    console.log("Footer link hover text-decoration:", footDec);
    if (footDec !== "none") throw new Error(`Footer link có text-decoration: ${footDec}`);
  }
  await page.screenshot({ path: `${ARTIFACT_DIR}/desktop_link_no_underline_hover.png` });

  console.log("=== 2. Kiểm tra Thẻ việc làm & Tiêu đề trên jobs.html ===");
  await page.goto(`${BASE_URL}/pages/jobs.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const firstCard = page.locator(".job-grid-card").first();
  await firstCard.waitFor({ state: "visible" });
  const titleLink = firstCard.locator(".job-title-link");
  await titleLink.hover();
  const titleHoverDec = await titleLink.evaluate((el) => window.getComputedStyle(el).textDecorationLine);
  console.log("Job title hover text-decoration:", titleHoverDec);
  if (titleHoverDec !== "none") throw new Error(`Job title hover có text-decoration: ${titleHoverDec}`);

  console.log("=== 3. Kiểm tra Thẻ việc làm ĐANG CHỌN (is-selected) ===");
  await firstCard.click();
  await page.waitForTimeout(300);

  const sel = await firstCard.evaluate((card) => {
    const s = window.getComputedStyle(card.querySelector(".job-title-link"));
    const cs = window.getComputedStyle(card);
    return {
      isSelected: card.classList.contains("is-selected"),
      textDecoration: s.textDecorationLine,
      fontWeight: parseInt(s.fontWeight, 10),
      color: s.color,
      bgColor: cs.backgroundColor,
    };
  });

  console.log(`is-selected: ${sel.isSelected}, font-weight: ${sel.fontWeight}, dec: ${sel.textDecoration}, color: ${sel.color}`);
  if (sel.textDecoration !== "none") throw new Error(`Selected job title có text-decoration: ${sel.textDecoration}`);
  if (sel.fontWeight < 700) throw new Error(`Selected job title font-weight ${sel.fontWeight} chưa >= 700`);

  const tRgb = parseColor(sel.color, [255, 255, 255]);
  const bgRgb = parseColor(sel.bgColor, [255, 255, 255]);
  const cr = getContrast(tRgb, bgRgb);
  console.log(`Độ tương phản (Light Mode): ${cr.toFixed(2)}:1 (chuẩn AA >= 4.5:1)`);
  if (cr < 4.5) throw new Error(`Tương phản không đạt chuẩn AA: ${cr.toFixed(2)}:1`);
  await page.screenshot({ path: `${ARTIFACT_DIR}/desktop_job_selected_bold_no_underline.png` });

  console.log("=== 4. Kiểm tra Chế độ tối (Dark Mode) ===");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(300);

  const dSel = await firstCard.evaluate((card) => {
    const s = window.getComputedStyle(card.querySelector(".job-title-link"));
    const cs = window.getComputedStyle(card);
    return {
      textDecoration: s.textDecorationLine,
      color: s.color,
      bgColor: cs.backgroundColor,
    };
  });
  console.log(`Dark Mode dec: ${dSel.textDecoration}, color: ${dSel.color}, bg: ${dSel.bgColor}`);
  if (dSel.textDecoration !== "none") throw new Error(`Dark mode job title có text-decoration: ${dSel.textDecoration}`);

  const dtRgb = parseColor(dSel.color, [13, 23, 29]);
  const dbgRgb = parseColor(dSel.bgColor, [13, 23, 29]);
  const dcr = getContrast(dtRgb, dbgRgb);
  console.log(`Độ tương phản (Dark Mode): ${dcr.toFixed(2)}:1 (chuẩn AA >= 4.5:1)`);
  if (dcr < 4.5) throw new Error(`Dark mode tương phản không đạt chuẩn: ${dcr.toFixed(2)}:1`);
  await page.screenshot({ path: `${ARTIFACT_DIR}/desktop_job_selected_dark_mode.png` });

  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));

  console.log("=== 5. Kiểm tra Liên kết trong Đoạn văn (Prose) ===");
  await page.goto(`${BASE_URL}/pages/job-detail.html?id=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const proseLinkActive = await page.evaluate(() => {
    const c = document.getElementById("jd-description") || document.querySelector(".jd-prose");
    if (!c) return false;
    c.removeAttribute("hidden");
    if (c.parentElement) c.parentElement.removeAttribute("hidden");
    const p = document.createElement("p");
    p.innerHTML = 'Tìm hiểu thêm tại <a href="#test" id="test-prose-link">Hướng dẫn ứng tuyển</a>.';
    c.appendChild(p);
    return true;
  });

  if (proseLinkActive) {
    const pLink = page.locator("#test-prose-link");
    const normalDec = await pLink.evaluate((el) => window.getComputedStyle(el).textDecorationLine);
    console.log("Prose link bình thường dec:", normalDec);
    if (normalDec !== "none") throw new Error(`Prose link bình thường bị gạch chân: ${normalDec}`);

    await pLink.hover();
    await page.waitForTimeout(150);
    const hoverDec = await pLink.evaluate((el) => window.getComputedStyle(el).textDecorationLine);
    console.log("Prose link khi hover dec:", hoverDec);
    if (hoverDec !== "underline") throw new Error(`Prose link hover KHÔNG hiện gạch chân: ${hoverDec}`);
    await page.screenshot({ path: `${ARTIFACT_DIR}/desktop_prose_link_hover_underline.png` });
  }

  console.log("=== 6. Kiểm tra Focus bàn phím qua Tab (:focus-visible) ===");
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press("Tab");
  await page.waitForTimeout(200);

  const foc = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const s = window.getComputedStyle(el);
    return {
      tag: el.tagName,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      textDecoration: s.textDecorationLine,
    };
  });

  console.log(`Focus tag: ${foc.tag}, outline: ${foc.outlineStyle} ${foc.outlineWidth} ${foc.outlineColor}, dec: ${foc.textDecoration}`);
  if (foc.outlineStyle === "none" || foc.outlineWidth === "0px") throw new Error("Keyboard focus không hiện outline");
  if (foc.textDecoration !== "none") throw new Error("Keyboard focus dùng underline thay viền focus");
  await page.screenshot({ path: `${ARTIFACT_DIR}/desktop_keyboard_focus_teal_no_underline.png` });

  console.log("\n>>> TẤT CẢ 6 BƯỚC KIỂM THỬ GIAO DIỆN HOÀN TOÀN ĐẠT CHUẨN! <<<");
  await browser.close();
}

run().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
