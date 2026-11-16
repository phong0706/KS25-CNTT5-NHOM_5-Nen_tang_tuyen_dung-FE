import asyncio
from playwright.async_api import async_playwright

async def check():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=True)
        context = await browser.new_context(viewport={'width': 360, 'height': 800})
        page = await context.new_page()

        # Login first
        await page.goto('http://127.0.0.1:5500/pages/login.html')
        await page.click(".btn-demo-acc[data-email='hr1@tuyendung.com']")
        await page.click('#btn-login-submit')
        await page.wait_for_timeout(1500)

        await page.goto('http://127.0.0.1:5500/pages/employer/recruitment.html?tab=jobs')
        await page.wait_for_timeout(1500)

        overflows = await page.evaluate('''() => {
            const els = Array.from(document.querySelectorAll('*'));
            const res = [];
            for (const el of els) {
                const rect = el.getBoundingClientRect();
                if (rect.right > window.innerWidth + 1) {
                    res.push({
                        tag: el.tagName,
                        id: el.id,
                        className: String(el.className),
                        right: rect.right,
                        width: rect.width
                    });
                }
            }
            return res.slice(0, 10);
        }''')
        for o in overflows:
            print(o)
        await browser.close()

if __name__ == '__main__':
    asyncio.run(check())
