/**
 * Kiểm chứng sau khi sửa - BƯỚC 3
 * Chụp 360/768/1440 sáng+tối, quét button mặc định, kiểm tra scrollWidth, kiểm tab bàn phím
 */
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5502/frontend";
const ADM_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMyIsInJvbGUiOiJhZG1pbiIsInRva2VuX3ZlciI6MSwiZXhwIjoxNzk1MTA2MzQ2fQ.FSYjB1CbTEHNLUUcojNiYF1k8aah6fXIWboqGOOuZSk";
const ADM_USER = JSON.stringify({ id: 23, email: "admin@tuyendung.com", full_name: "Admin Tổng", role: "admin" });
const OUT = "C:/Users/N.T.P/.gemini/antigravity/brain/0b62dd8e-665a-48b4-9df7-ca192554577f";

const inject = { token: ADM_TOKEN, user: ADM_USER };
const initFn = ({ token, user }) => {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", user);
  localStorage.setItem("auth_role", "admin");
};

async function scanBareButtons(page) {
  return page.evaluate(() => {
    const results = [];
    document.querySelectorAll("button").forEach((btn) => {
      const cl = btn.className || "";
      const cs = window.getComputedStyle(btn);
      const hasDefaultBorder = cs.borderStyle === "outset";
      const wrongFont = !cs.fontFamily.includes("Be Vietnam Pro") && !cs.fontFamily.includes("inherit") && !cs.fontFamily.includes("sans-serif");
      if (hasDefaultBorder || (wrongFont && !cl.includes("btn") && !cl.includes("ej-"))) {
        results.push({ class: cl || "(none)", text: (btn.textContent || "").trim().slice(0, 40), borderStyle: cs.borderStyle, font: cs.fontFamily.slice(0, 40) });
      }
    });
    return results;
  });
}

async function checkNoHorizontalScroll(page, label) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    ok: document.documentElement.scrollWidth <= window.innerWidth + 2,
  }));
  console.log(`[${label}] scrollWidth=${result.scrollWidth} innerWidth=${result.innerWidth} ${result.ok ? "✓ OK" : "✗ FAIL"}`);
  return result.ok;
}

const results = [];

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const viewports = [
    { w: 360, h: 800, label: "360" },
    { w: 768, h: 1024, label: "768" },
    { w: 1440, h: 900, label: "1440" },
  ];

  for (const { w, h, label } of viewports) {
    for (const dark of [false, true]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.addInitScript(initFn, inject);
      await page.goto(`${BASE}/pages/admin/jobs.html`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      if (dark) await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
      await page.waitForTimeout(400);

      const suffix = dark ? "dark" : "light";
      await page.screenshot({ path: `${OUT}/after_jobs_${label}_${suffix}.png`, fullPage: true });
      console.log(`✓ after_jobs_${label}_${suffix}.png`);

      const noScroll = await checkNoHorizontalScroll(page, `${label}_${suffix}`);
      results.push({ check: `Không cuộn ngang ${label} ${suffix}`, pass: noScroll });

      if (label === "1440" && !dark) {
        const bare = await scanBareButtons(page);
        results.push({ check: "Button thiếu class / nút mặc định = 0", pass: bare.length === 0 });
        if (bare.length > 0) console.log("⚠ Còn bare buttons:", JSON.stringify(bare, null, 2));
        else console.log("✓ Không còn button mặc định");

        // Kiểm tra tab có aria-selected="true"
        const selectedTab = await page.locator('.ej-tab[aria-selected="true"]').count();
        results.push({ check: "Tab đang chọn có aria-selected=true", pass: selectedTab > 0 });
        console.log(`Tab selected count: ${selectedTab}`);

        // Kiểm tra keyboard: Tab vào tablist, ArrowRight chuyển tab
        const firstTab = page.locator('.ej-tab').first();
        await firstTab.focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(300);
        const secondTabFocused = await page.locator('.ej-tab').nth(1).evaluate((el) => document.activeElement === el);
        results.push({ check: "ArrowRight di chuyển focus sang tab tiếp theo", pass: secondTabFocused });
        console.log(`ArrowRight focus: ${secondTabFocused ? "✓" : "✗"}`);

        // Kiểm tra tab hiển thị font đúng
        const tabFont = await firstTab.evaluate((el) => window.getComputedStyle(el).fontFamily);
        const hasCorrectFont = tabFont.includes("Be Vietnam Pro");
        results.push({ check: "Tab dùng font Be Vietnam Pro", pass: hasCorrectFont });
        console.log(`Tab font: ${tabFont.slice(0, 50)} - ${hasCorrectFont ? "✓" : "✗"}`);
      }

      await ctx.close();
    }
  }

  await browser.close();

  console.log("\n=== BẢNG KẾT QUẢ BƯỚC 3 ===");
  results.forEach((r) => {
    console.log(`${r.pass ? "ĐẠT" : "KHÔNG ĐẠT"} | ${r.check}`);
  });
}

run().catch((e) => { console.error(e); process.exit(1); });
