import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:5501";

async function runVerification() {
  console.log("=== BẮT ĐẦU KIỂM CHỨNG KHÔI PHỤC MENU & PLACEHOLDER ===");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results = [];

  const record = (name, passed, evidence) => {
    results.push({ name, status: passed ? "ĐẠT" : "KHÔNG ĐẠT", evidence });
    console.log(`[${passed ? "PASS" : "FAIL"}] ${name}: ${evidence}`);
  };

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // 1. Desktop: vào index.html -> menu đầy đủ tất cả các nhóm và mục
    await page.goto(`${BASE_URL}/index.html`);
    await page.waitForSelector("#site-nav .mega-nav-item", { timeout: 3000 });

    const desktopMenuLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("#site-nav .mega-menu-link"));
      return links.map((a) => ({ text: a.textContent.trim(), href: a.getAttribute("href") }));
    });
    const hasCvGuide = desktopMenuLinks.some(
      (l) => l.href.includes("feature=cv-guide") || l.text.includes("Hướng dẫn viết CV")
    );
    const hasCoverLetter = desktopMenuLinks.some(
      (l) => l.text.includes("Cover Letter")
    );
    record(
      "Desktop Menu khôi phục đầy đủ các mục (không bị ẩn)",
      hasCvGuide && hasCoverLetter && desktopMenuLinks.length >= 30,
      `Tổng số link: ${desktopMenuLinks.length}, có cv-guide: ${hasCvGuide}, có Cover Letter: ${hasCoverLetter}`
    );

    // 2. Mobile 360px: kiểm tra drawer
    const mobileContext = await browser.newContext({ viewport: { width: 360, height: 740 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/index.html`);
    await mobilePage.waitForSelector("#site-drawer", { state: "attached", timeout: 3000 });

    const drawerContent = await mobilePage.evaluate(() => document.getElementById("site-drawer")?.textContent);
    const drawerHasCvGuide = drawerContent.includes("Hướng dẫn viết CV");
    const drawerHasCoverLetter = drawerContent.includes("Cover Letter");
    record(
      "Mobile Drawer khôi phục đầy đủ các mục (không bị ẩn)",
      drawerHasCvGuide && drawerHasCoverLetter,
      `Có 'Hướng dẫn viết CV': ${drawerHasCvGuide}, có 'Cover Letter': ${drawerHasCoverLetter}`
    );

    // 3. Trang placeholder.html?feature=cv-guide
    await page.goto(`${BASE_URL}/pages/placeholder.html?feature=cv-guide`);
    await page.waitForSelector("#placeholder-content .placeholder-hero", { timeout: 3000 });

    const bodyText = await page.evaluate(() => document.body.innerText);

    // 3.1 Không chứa các khẳng định chưa kiểm chứng
    const hasATS = bodyText.includes("ATS");
    const has6Seconds = bodyText.includes("6 giây");
    const hasPriority = bodyText.includes("ưu tiên hàng đầu");
    const cleanClaims = !hasATS && !has6Seconds && !hasPriority;
    record(
      "Trang placeholder không chứa 'ATS', '6 giây', 'ưu tiên hàng đầu'",
      cleanClaims,
      `hasATS: ${hasATS}, has6Seconds: ${has6Seconds}, hasPriority: ${hasPriority}`
    );

    // 3.2 Kiểm tra có 2 nút 'Xem Mẫu CV theo phong cách' và 'Về trang chủ'
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".placeholder-actions a"));
      return btns.map((b) => ({ text: b.textContent.trim(), href: b.getAttribute("href") }));
    });
    const hasCvTemplatesBtn = buttons.some(
      (b) => b.text.includes("Xem Mẫu CV theo phong cách") && b.href.includes("cv-templates.html")
    );
    const hasHomeBtn = buttons.some(
      (b) => b.text.includes("Về trang chủ") && (b.href.includes("index.html") || b.href.endsWith("/"))
    );
    record(
      "Có 2 nút 'Xem Mẫu CV theo phong cách' và 'Về trang chủ'",
      hasCvTemplatesBtn && hasHomeBtn,
      `Buttons found: ${JSON.stringify(buttons)}`
    );

    // 3.3 Kiểm tra khách vào được, không có nút bắt đăng nhập trên placeholder content
    const loginRequiredOnContent = await page.evaluate(() => {
      const content = document.getElementById("placeholder-content");
      if (!content) return false;
      return content.innerText.includes("Đăng nhập để xem") || content.innerText.includes("Yêu cầu đăng nhập");
    });
    record(
      "Trang công khai, không bắt khách đăng nhập",
      !loginRequiredOnContent,
      `Khách truy cập bình thường, không có gate đăng nhập`
    );

    // 3.4 Kiểm tra sai lệch lề trái giữa breadcrumb/container và logo header (<= 1px)
    const alignment = await page.evaluate(() => {
      const brand = document.querySelector(".site-brand");
      const breadcrumb = document.querySelector(".breadcrumb");
      const containerHeader = document.querySelector(".site-header .container");
      const containerMain = document.querySelector("main .container");

      const brandRect = brand ? brand.getBoundingClientRect() : null;
      const bcRect = breadcrumb ? breadcrumb.getBoundingClientRect() : null;
      const cHeaderRect = containerHeader ? containerHeader.getBoundingClientRect() : null;
      const cMainRect = containerMain ? containerMain.getBoundingClientRect() : null;

      const containerDiff = Math.abs((cHeaderRect?.left || 0) - (cMainRect?.left || 0));
      const leftDiff = Math.abs((brandRect?.left || 0) - (bcRect?.left || 0));

      return {
        containerDiff,
        leftDiff,
        headerContainerLeft: cHeaderRect?.left,
        mainContainerLeft: cMainRect?.left,
        brandLeft: brandRect?.left,
        bcLeft: bcRect?.left,
      };
    });
    record(
      "Lệch lề trái container và breadcrumb/logo <= 1px",
      alignment.containerDiff <= 1 && alignment.leftDiff <= 1,
      `containerDiff: ${alignment.containerDiff}px, brand vs bc diff: ${alignment.leftDiff}px (Brand: ${alignment.brandLeft}, BC: ${alignment.bcLeft})`
    );

    // 3.5 Kiểm tra text-wrap: balance trên tiêu đề
    const titleTextWrap = await page.evaluate(() => {
      const h1 = document.querySelector(".placeholder-title");
      if (!h1) return null;
      const cs = window.getComputedStyle(h1);
      return cs.textWrap || cs.getPropertyValue("text-wrap");
    });
    record(
      "Tiêu đề có text-wrap: balance",
      titleTextWrap === "balance",
      `textWrap style: ${titleTextWrap}`
    );

    // 4. scrollWidth === innerWidth tại 360, 768, 1024, 1440
    const viewports = [360, 768, 1024, 1440];
    for (const w of viewports) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.waitForTimeout(200);
      const scrollOk = await page.evaluate(() => {
        return document.documentElement.scrollWidth === window.innerWidth;
      });
      record(
        `Không cuộn ngang tại ${w}px (scrollWidth === innerWidth)`,
        scrollOk,
        `w=${w}px: scrollWidth=${await page.evaluate(() => document.documentElement.scrollWidth)}, innerWidth=${w}`
      );
    }

    // 5. Console sạch không có lỗi
    record(
      "Console sạch sẽ không lỗi runtime",
      consoleErrors.length === 0,
      consoleErrors.length === 0 ? "0 console errors" : `Lỗi: ${consoleErrors.join("; ")}`
    );

    await mobileContext.close();
    await context.close();
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n=== TỔNG HỢP KẾT QUẢ KIỂM CHỨNG ===");
  console.table(results);
}

runVerification();
