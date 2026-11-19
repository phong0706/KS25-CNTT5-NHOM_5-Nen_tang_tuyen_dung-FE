/**
 * Chẩn đoán trang Duyệt tin tuyển dụng - chụp ảnh trước khi sửa
 * Bước 1.2: quét button thiếu class + chụp 360/768/1440 sáng+tối
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
      const isDefaultAppearance = cs.getPropertyValue("appearance") === "auto"
        || cs.getPropertyValue("-webkit-appearance") === "auto";
      const hasDefaultBorder = cs.borderStyle === "outset" && cs.borderWidth === "2px";
      const wrongFont = !cs.fontFamily.includes("Be Vietnam Pro") && !cs.fontFamily.includes("inherit");
      if (!cl.trim() || (!cl.includes("btn") && !cl.includes("ej-") && !cl.includes("gov-") && !cl.includes("adm-") && !cl.includes("hs-") && !cl.includes("sidebar") && !cl.includes("mobile") && !cl.includes("dropdown"))) {
        if (isDefaultAppearance || hasDefaultBorder || wrongFont) {
          results.push({ tag: "button", class: cl || "(none)", text: (btn.textContent || "").trim().slice(0, 40), issue: `appearance=${cs.getPropertyValue("appearance")} border=${cs.borderStyle} font=${cs.fontFamily.slice(0, 30)}` });
        }
      }
    });
    return results;
  });
}

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
      if (dark) await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
      await page.waitForTimeout(800);
      const suffix = dark ? "dark" : "light";
      await page.screenshot({ path: `${OUT}/before_jobs_${label}_${suffix}.png`, fullPage: true });
      console.log(`Chụp before_jobs_${label}_${suffix}.png`);

      if (label === "1440" && !dark) {
        const bare = await scanBareButtons(page);
        console.log("Button thiếu class / nút mặc định:", JSON.stringify(bare, null, 2));
      }
      await ctx.close();
    }
  }

  await browser.close();
  console.log("=== BƯỚC 1 HOÀN TẤT ===");
}

run().catch((e) => { console.error(e); process.exit(1); });
