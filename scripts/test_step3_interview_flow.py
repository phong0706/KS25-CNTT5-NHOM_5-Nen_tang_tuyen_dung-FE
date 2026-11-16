import asyncio
import os
from playwright.async_api import async_playwright

os.makedirs("screenshots/step3_recruitment", exist_ok=True)

async def test_step3():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Login
        await page.goto("http://127.0.0.1:5500/pages/login.html")
        await page.click(".btn-demo-acc[data-email='hr1@tuyendung.com']")
        await page.click("#btn-login-submit")
        await page.wait_for_url("**/pages/employer/dashboard.html", timeout=10000)

        # Open recruitment candidates tab with status=submitted
        await page.goto("http://127.0.0.1:5500/pages/employer/recruitment.html?tab=candidates&status=submitted")
        await page.wait_for_timeout(1000)

        # Open first candidate in submitted (id=2)
        view_btn = page.locator("[data-action='view-candidate']").first
        await view_btn.click()
        await page.wait_for_timeout(800)

        drawer = page.locator(".rec-drawer-dialog")
        tab_trans = drawer.locator("[data-drawer-tab='transition']")
        await tab_trans.click()
        await page.wait_for_timeout(500)

        # Transition to screening
        radio_screening = drawer.locator(".rec-radio-card[data-val='screening']")
        assert await radio_screening.count() > 0, "Screening option should be available from submitted"
        await radio_screening.click()
        await page.wait_for_timeout(400)
        btn_sub = drawer.locator("button[id*='-btn-submit-generic']")
        await btn_sub.click()
        await page.wait_for_timeout(1000)
        print("Candidate transitioned to screening")

        # Now go to status=screening and open candidate drawer
        await page.goto("http://127.0.0.1:5500/pages/employer/recruitment.html?tab=candidates&status=screening")
        await page.wait_for_timeout(1000)
        view_btn2 = page.locator("[data-action='view-candidate']").first
        await view_btn2.click()
        await page.wait_for_timeout(800)

        await drawer.locator("[data-drawer-tab='transition']").click()
        await page.wait_for_timeout(500)

        # Now applicant is in screening, interview radio is available!
        radio_iv = drawer.locator(".rec-radio-card[data-val='interview']")
        assert await radio_iv.count() > 0, "Interview transition option should be available from screening"
        await radio_iv.click()
        await page.wait_for_timeout(500)

        form_iv = drawer.locator(".rec-expandable-form.is-expanded")
        assert await form_iv.is_visible(), "Interview form did not expand"
        print("Interview form visible and expanded")

        # Capture screenshot 1440 for Step 3
        await page.screenshot(path="screenshots/step3_recruitment/1440_status_transition_interview.png")

        # Fill interview details
        loc_input = drawer.locator("input[id*='-iv-location']")
        await loc_input.fill("https://meet.google.com/abc-defg-hij")
        interviewer_input = drawer.locator("input[id*='-iv-interviewer']")
        await interviewer_input.fill("Nguyễn Văn Tuyển (Tech Lead)")

        # Submit interview
        btn_iv = drawer.locator("button[id*='-btn-submit-iv']")
        await btn_iv.click()
        await page.wait_for_timeout(1000)
        print("Interview scheduled successfully!")

        # Verify on Tab 3 Calendar
        await page.click("#tab-interviews")
        await page.wait_for_timeout(1000)
        grid = page.locator("#rec-iv-grid")
        assert await grid.locator(".rec-iv-card").count() > 0, "Scheduled interview card not found on calendar"
        print("Found scheduled interview card on calendar!")

        await page.screenshot(path="screenshots/step4_recruitment/1440_interview_calendar_with_cards.png")

        await browser.close()
        print("STEP 3 & 4 FLOW VERIFIED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(test_step3())
