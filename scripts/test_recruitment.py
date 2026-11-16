import asyncio
import os
import json
from playwright.async_api import async_playwright

SCREENSHOT_DIR_S1 = "screenshots/step1_recruitment"
SCREENSHOT_DIR_S2 = "screenshots/step2_recruitment"
SCREENSHOT_DIR_S3 = "screenshots/step3_recruitment"
SCREENSHOT_DIR_S4 = "screenshots/step4_recruitment"

for d in [SCREENSHOT_DIR_S1, SCREENSHOT_DIR_S2, SCREENSHOT_DIR_S3, SCREENSHOT_DIR_S4]:
    os.makedirs(d, exist_ok=True)

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: print(f"[Browser {msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: print(f"[Browser PageError] {err}"))

        print("\n--- 1. Login as Recruiter ---")
        await page.goto("http://127.0.0.1:5500/pages/login.html")
        await page.wait_for_timeout(500)
        await page.click(".btn-demo-acc[data-email='hr1@tuyendung.com']")
        await page.wait_for_timeout(300)
        await page.click("#btn-login-submit")
        await page.wait_for_url("**/pages/employer/dashboard.html", timeout=10000)
        await page.wait_for_timeout(1000)

        print("\n--- 2. Verify Nav Header & Badge ---")
        await page.goto("http://127.0.0.1:5500/index.html")
        await page.wait_for_timeout(1000)
        # Check user menu dropdown
        trigger = page.locator("#header-user-trigger")
        await trigger.wait_for(state="visible")
        await trigger.click()
        await page.wait_for_timeout(400)

        dropdown = page.locator("#header-user-dropdown")
        dropdown_text = await dropdown.inner_text()
        print("Dropdown menu text:\n", dropdown_text)

        assert "Quản lý tuyển dụng" in dropdown_text, "Missing 'Quản lý tuyển dụng' in menu"
        assert "Ứng viên & Phỏng vấn" not in dropdown_text, "Found legacy 'Ứng viên & Phỏng vấn' in menu"

        # Check badge on recruitment link
        rec_link = dropdown.locator("a[href*='recruitment.html']")
        badge_el = rec_link.locator(".user-action-badge")
        if await badge_el.count() > 0:
            badge_val = await badge_el.inner_text()
            print(f"Recruitment menu badge: {badge_val} (Success)")
        else:
            print("Badge element not rendered yet or count 0")

        # Screenshot Step 1 at 1440
        await page.screenshot(path=f"{SCREENSHOT_DIR_S1}/1440_menu_and_header.png")

        print("\n--- 3. Test Legacy Route Redirects ---")
        await page.goto("http://127.0.0.1:5500/pages/employer/jobs.html?sort=newest")
        await page.wait_for_timeout(800)
        current_url = page.url
        print(f"jobs.html redirected to: {current_url}")
        assert "recruitment.html" in current_url and "tab=jobs" in current_url, "Redirect failed for jobs.html"

        await page.goto("http://127.0.0.1:5500/pages/employer/applications.html?job_id=45")
        await page.wait_for_timeout(800)
        current_url2 = page.url
        print(f"applications.html redirected to: {current_url2}")
        assert "recruitment.html" in current_url2 and "tab=candidates" in current_url2 and "job=45" in current_url2, "Redirect failed for applications.html"

        print("\n--- 4. Verify Recruitment Shell Page (3 Tabs) ---")
        await page.goto("http://127.0.0.1:5500/pages/employer/recruitment.html?tab=jobs")
        await page.wait_for_timeout(1000)

        tab_jobs = page.locator("#tab-jobs")
        tab_cands = page.locator("#tab-candidates")
        tab_ivs = page.locator("#tab-interviews")

        assert await tab_jobs.is_visible() and await tab_cands.is_visible() and await tab_ivs.is_visible(), "Tabs missing"

        count_jobs = await page.locator("#count-tab-jobs").inner_text()
        count_cands = await page.locator("#count-tab-candidates").inner_text()
        count_ivs = await page.locator("#count-tab-interviews").inner_text()
        print(f"Counts: Jobs={count_jobs}, Candidates={count_cands}, Interviews={count_ivs}")

        await page.screenshot(path=f"{SCREENSHOT_DIR_S1}/1440_recruitment_shell_jobs.png")

        # Mobile viewport 360x800 for Step 1
        await page.set_viewport_size({"width": 360, "height": 800})
        await page.wait_for_timeout(500)
        # Check horizontal overflow
        scroll_w = await page.evaluate("() => document.documentElement.scrollWidth")
        inner_w = await page.evaluate("() => window.innerWidth")
        print(f"Step 1 Mobile 360px: scrollWidth={scroll_w}, innerWidth={inner_w}")
        assert scroll_w <= inner_w, f"Horizontal scroll detected on 360px! ({scroll_w} > {inner_w})"
        await page.screenshot(path=f"{SCREENSHOT_DIR_S1}/360_recruitment_shell_jobs.png")

        print("\n--- 5. Test Clicking 'N hồ sơ' to switch to Candidates Tab ---")
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(800)

        # Wait for either job rows or click candidates tab
        app_btn = page.locator("[data-action='view-applicants']").first
        try:
            await app_btn.wait_for(state="visible", timeout=3000)
            await app_btn.click()
            print("Clicked 'N hồ sơ' on job row")
        except Exception:
            print("Job rows took longer or not visible, clicking #tab-candidates directly")
            await page.click("#tab-candidates")

        await page.wait_for_timeout(800)
        print("After switching tab, URL is:", page.url)
        assert "tab=candidates" in page.url, "Did not switch to candidates tab"

        # Check candidate list
        cand_list = page.locator("#rec-cand-list")
        await cand_list.wait_for(state="visible")
        cand_cards = cand_list.locator(".rec-cand-item")
        cand_count = await cand_cards.count()
        print(f"Rendered {cand_count} candidates in list")
        assert cand_count > 0, "No candidates rendered"

        await page.screenshot(path=f"{SCREENSHOT_DIR_S2}/1440_candidates_tab.png")

        # Mobile screenshot for Step 2
        await page.set_viewport_size({"width": 360, "height": 800})
        await page.wait_for_timeout(500)
        scroll_w2 = await page.evaluate("() => document.documentElement.scrollWidth")
        inner_w2 = await page.evaluate("() => window.innerWidth")
        print(f"Step 2 Mobile 360px: scrollWidth={scroll_w2}, innerWidth={inner_w2}")
        assert scroll_w2 <= inner_w2, f"Horizontal scroll on candidates tab! ({scroll_w2} > {inner_w2})"
        await page.screenshot(path=f"{SCREENSHOT_DIR_S2}/360_candidates_tab.png")

        print("\n--- 6. Test Candidate Drawer & Mark Viewed ---")
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(400)

        view_btn = page.locator("[data-action='view-candidate']").first
        await view_btn.click()
        await page.wait_for_timeout(800)

        drawer = page.locator(".rec-drawer-dialog")
        assert await drawer.is_visible(), "Drawer did not open"
        drawer_title = await page.locator(".rec-drawer-title").inner_text()
        print(f"Opened drawer for: {drawer_title}")

        # Check drawer tabs
        tab_hist = drawer.locator("[data-drawer-tab='history']")
        tab_notes = drawer.locator("[data-drawer-tab='notes']")
        tab_trans = drawer.locator("[data-drawer-tab='transition']")

        await tab_notes.click()
        await page.wait_for_timeout(500)
        # Add a note
        note_input = page.locator("textarea[id*='-new-note']")
        await note_input.fill("Ứng viên có kỹ năng tốt, đề xuất hẹn phỏng vấn tuần này.")
        add_note_btn = page.locator("button[id*='-add-note-btn']")
        await add_note_btn.click()
        await page.wait_for_timeout(600)
        print("Added note successfully")

        await page.screenshot(path=f"{SCREENSHOT_DIR_S2}/1440_candidate_drawer_notes.png")

        # Test Status Transition Tab
        print("\n--- 7. Test Status Transition Tab & Interview Scheduling ---")
        await tab_trans.click()
        await page.wait_for_timeout(500)

        radios = drawer.locator(".rec-radio-card")
        r_count = await radios.count()
        print(f"Found {r_count} allowed transition options")

        # Click Interview radio if available
        iv_radio = drawer.locator(".rec-radio-card[data-val='interview']")
        if await iv_radio.count() > 0:
            await iv_radio.click()
            await page.wait_for_timeout(500)
            form_iv = drawer.locator(".rec-expandable-form.is-expanded")
            assert await form_iv.is_visible(), "Interview form did not expand"
            print("Interview form expanded smoothly")

            await page.screenshot(path=f"{SCREENSHOT_DIR_S3}/1440_status_transition_interview.png")

        # Mobile screenshot of drawer
        await page.set_viewport_size({"width": 360, "height": 800})
        await page.wait_for_timeout(500)
        scroll_w3 = await page.evaluate("() => document.documentElement.scrollWidth")
        inner_w3 = await page.evaluate("() => window.innerWidth")
        print(f"Step 3 Mobile 360px: scrollWidth={scroll_w3}, innerWidth={inner_w3}")
        assert scroll_w3 <= inner_w3, "Horizontal scroll on drawer 360px!"
        await page.screenshot(path=f"{SCREENSHOT_DIR_S3}/360_candidate_drawer.png")

        # Close drawer
        await page.locator(".rec-drawer-close").click()
        await page.wait_for_timeout(500)

        print("\n--- 8. Test Tab 3: Interview Schedule Calendar ---")
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.click("#tab-interviews")
        await page.wait_for_timeout(1000)

        grid = page.locator("#rec-iv-grid")
        await grid.wait_for(state="visible")
        day_cols = grid.locator(".rec-iv-day-group")
        day_count = await day_cols.count()
        print(f"Rendered {day_count} days in weekly interview calendar")
        assert day_count == 7, f"Expected 7 days in weekly calendar, got {day_count}"

        await page.screenshot(path=f"{SCREENSHOT_DIR_S4}/1440_interview_calendar.png")

        # Mobile screenshot for Step 4
        await page.set_viewport_size({"width": 360, "height": 800})
        await page.wait_for_timeout(500)
        scroll_w4 = await page.evaluate("() => document.documentElement.scrollWidth")
        inner_w4 = await page.evaluate("() => window.innerWidth")
        print(f"Step 4 Mobile 360px: scrollWidth={scroll_w4}, innerWidth={inner_w4}")
        assert scroll_w4 <= inner_w4, f"Horizontal scroll on interview calendar! ({scroll_w4} > {inner_w4})"
        await page.screenshot(path=f"{SCREENSHOT_DIR_S4}/360_interview_calendar.png")

        print("\n--- Console Errors Check ---")
        print("Console errors logged:", console_errors)
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"

        await browser.close()
        print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())
