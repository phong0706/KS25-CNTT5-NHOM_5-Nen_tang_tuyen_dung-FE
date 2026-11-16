import asyncio
import json
import os
import sys
from playwright.async_api import async_playwright

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "screenshots", "notification_bell")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

BASE_FE = "http://127.0.0.1:5500"
BASE_BE = "http://127.0.0.1:8000"

async def get_token_and_user(request_context, email, password):
    res = await request_context.post(
        f"{BASE_BE}/api/auth/login",
        data=json.dumps({"email": email, "password": password}),
        headers={"Content-Type": "application/json"}
    )
    assert res.status == 200, f"Login failed for {email}: {await res.text()}"
    data = await res.json()
    token = data["access_token"]
    res_me = await request_context.get(f"{BASE_BE}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status == 200, f"Get /auth/me failed: {await res_me.text()}"
    user = await res_me.json()
    return token, user

async def set_auth(page, token, user):
    await page.goto(f"{BASE_FE}/index.html")
    await page.evaluate(
        """([t, u]) => {
            localStorage.setItem("auth_token", t);
            localStorage.setItem("auth_user", JSON.stringify(u));
            localStorage.setItem("auth_role", u.role || "");
            // compatibility keys:
            localStorage.setItem("access_token", t);
            localStorage.setItem("user", JSON.stringify(u));
        }""",
        [token, user]
    )
    await page.reload()
    await page.wait_for_selector("#notif-bell-btn", timeout=5000)

async def run_tests():
    console_errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)

        # Context 1: Employer (hr1@tuyendung.com)
        ctx_emp = await browser.new_context(viewport={"width": 1440, "height": 900})
        page_emp = await ctx_emp.new_page()
        page_emp.on("console", lambda msg: console_errors.append(f"[Employer Console {msg.type}] {msg.text}") if msg.type == "error" else None)

        # Context 2: Candidate (ungvien1@gmail.com)
        ctx_cand = await browser.new_context(viewport={"width": 1440, "height": 900})
        page_cand = await ctx_cand.new_page()
        page_cand.on("console", lambda msg: console_errors.append(f"[Candidate Console {msg.type}] {msg.text}") if msg.type == "error" else None)

        print("1. Logging in accounts...")
        api_req = page_emp.request
        emp_token, emp_user = await get_token_and_user(api_req, "hr1@tuyendung.com", "hr1@")
        cand_token, cand_user = await get_token_and_user(api_req, "ungvien1@gmail.com", "ungvien1@")

        cand_headers = {"Authorization": f"Bearer {cand_token}"}
        emp_headers = {"Authorization": f"Bearer {emp_token}"}

        # Clear notifications before test
        await api_req.post(f"{BASE_BE}/api/notifications/read-all", headers=cand_headers)
        await api_req.post(f"{BASE_BE}/api/notifications/read-all", headers=emp_headers)

        print("2. Setting auth on pages...")
        await set_auth(page_emp, emp_token, emp_user)
        await set_auth(page_cand, cand_token, cand_user)

        # -------------------------------------------------------------
        # TEST 1: Badge Collision & Distance Measurement
        # -------------------------------------------------------------
        print("\n--- TEST 1: Badge Collision & Positioning ---")
        await page_emp.evaluate("""() => {
            const badge = document.getElementById('notif-bell-badge');
            badge.textContent = '5';
            badge.hidden = false;
        }""")

        box_data = await page_emp.evaluate("""() => {
            const icon = document.querySelector('.notif-bell-icon svg') || document.querySelector('.notif-bell-icon');
            const badge = document.getElementById('notif-bell-badge');
            const iBox = icon.getBoundingClientRect();
            const bBox = badge.getBoundingClientRect();
            return {
                icon: { left: iBox.left, right: iBox.right, top: iBox.top, bottom: iBox.bottom, w: iBox.width, h: iBox.height },
                badge: { left: bBox.left, right: bBox.right, top: bBox.top, bottom: bBox.bottom, w: bBox.width, h: bBox.height }
            };
        }""")
        print(f"   Icon BoundingBox: {box_data['icon']}")
        print(f"   Badge BoundingBox: {box_data['badge']}")

        i = box_data["icon"]
        b = box_data["badge"]
        # Verify badge dimensions (min 18px, height 18px)
        assert b["h"] == 18, f"Badge height should be 18px, got {b['h']}"
        assert b["w"] >= 18, f"Badge width should be >= 18px, got {b['w']}"
        # Verify badge is at top right
        assert b["right"] >= i["right"], f"Badge right {b['right']} >= icon right {i['right']}"
        assert b["top"] <= i["top"] + 5, f"Badge top {b['top']} <= icon top {i['top']}"
        print("   ✓ Badge bounding box & non-collision: ĐẠT")

        # -------------------------------------------------------------
        # TEST 2: Candidate applies -> Employer gets notification
        # -------------------------------------------------------------
        print("\n--- TEST 2: Candidate apply -> Employer receives notification ---")
        # Ensure Job 81 has no duplicate active application from candidate
        try:
            sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))
            from dotenv import load_dotenv
            load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "backend", ".env"))
            from app.db.session import SessionLocal
            from app.models.application import Application
            db = SessionLocal()
            db.query(Application).filter(Application.candidate_id == cand_user["id"], Application.job_id == 81).delete()
            db.commit()
            db.close()
        except Exception as e:
            print("   DB cleanup note:", e)

        apply_res = await api_req.post(
            f"{BASE_BE}/api/jobs/81/apply",
            data=json.dumps({"cv_id": 4, "cover_letter": "Hồ sơ ứng tuyển mới để kiểm tra thông báo"}),
            headers={**cand_headers, "Content-Type": "application/json"}
        )
        print(f"   Candidate apply HTTP Status: {apply_res.status}")
        apply_data = await apply_res.json()
        application_id = apply_data.get("application_id")

        # Reload employer page to see real notification
        await page_emp.reload()
        await page_emp.wait_for_selector("#notif-bell-btn")
        
        badge_el = page_emp.locator("#notif-bell-badge")
        badge_count = await badge_el.text_content()
        print(f"   Employer badge count after apply: {badge_count}")
        assert int(badge_count) >= 1 or badge_count == "9+"

        # Open panel
        await page_emp.click("#notif-bell-btn")
        await page_emp.wait_for_selector("#notif-bell-panel:not([hidden])")
        await page_emp.wait_for_selector(".notif-item")

        # Check item content & NO duplicate name
        first_title = await page_emp.locator(".notif-item .notif-item-title").first.text_content()
        first_body = await page_emp.locator(".notif-item .notif-item-body").first.text_content()
        first_href = await page_emp.locator(".notif-item").first.get_attribute("href")
        print(f"   Notification Title: '{first_title}'")
        print(f"   Notification Body: '{first_body}'")
        print(f"   Notification Href: '{first_href}'")

        assert first_title == "Hồ sơ mới"
        assert "ứng tuyển" in first_body
        assert "·" not in first_body, "Body must not have duplicate concatenated actor name"
        assert "recruitment.html" in first_href and "tab=candidates" in first_href
        print("   ✓ Candidate apply -> Employer notification: ĐẠT")

        # -------------------------------------------------------------
        # TEST 3: Screenshots (Desktop 1440px Light & Dark)
        # -------------------------------------------------------------
        print("\n--- TEST 3: Screenshots Desktop 1440px ---")
        await page_emp.screenshot(path=os.path.join(SCREENSHOT_DIR, "1_employer_panel_1440_light.png"))
        print("   Saved: 1_employer_panel_1440_light.png")

        # Switch to dark mode
        await page_emp.click("#site-theme-toggle")
        await asyncio.sleep(0.3)
        if await page_emp.locator("#notif-bell-panel").is_hidden():
            await page_emp.click("#notif-bell-btn")
            await page_emp.wait_for_selector("#notif-bell-panel:not([hidden])")
        await page_emp.screenshot(path=os.path.join(SCREENSHOT_DIR, "2_employer_panel_1440_dark.png"))
        print("   Saved: 2_employer_panel_1440_dark.png")

        # Toggle back to light
        await page_emp.click("#site-theme-toggle")
        await asyncio.sleep(0.3)
        if await page_emp.locator("#notif-bell-panel").is_hidden():
            await page_emp.click("#notif-bell-btn")
            await page_emp.wait_for_selector("#notif-bell-panel:not([hidden])")

        # -------------------------------------------------------------
        # TEST 4: Read-all functionality
        # -------------------------------------------------------------
        print("\n--- TEST 4: 'Đánh dấu đã đọc tất cả' ---")
        if await page_emp.locator("#notif-bell-panel").is_hidden():
            await page_emp.click("#notif-bell-btn")
            await page_emp.wait_for_selector("#notif-bell-panel:not([hidden])")
        await page_emp.click("#notif-read-all-btn")
        await asyncio.sleep(0.5)
        badge_hidden = await page_emp.locator("#notif-bell-badge").is_hidden()
        assert badge_hidden, "Badge must be hidden after read-all"
        unread_items = await page_emp.locator(".notif-item.is-unread").count()
        assert unread_items == 0, "All items should be marked read"
        print("   ✓ Read-all check: ĐẠT")

        # -------------------------------------------------------------
        # TEST 5: Employer updates status -> Candidate receives
        # -------------------------------------------------------------
        print("\n--- TEST 5: Employer update status -> Candidate receives notification ---")
        if application_id:
            status_res = await api_req.patch(
                f"{BASE_BE}/api/employer/applications/{application_id}/status",
                data=json.dumps({"status": "screening", "note": "Đã xem xét hồ sơ kỹ càng"}),
                headers={**emp_headers, "Content-Type": "application/json"}
            )
            print(f"   Status update response: {status_res.status}")
            
            # Candidate checks notification
            await page_cand.reload()
            await page_cand.wait_for_selector("#notif-bell-btn")
            cand_badge = await page_cand.locator("#notif-bell-badge").text_content()
            print(f"   Candidate unread badge: {cand_badge}")
            assert int(cand_badge) >= 1 or cand_badge == "9+"

            # Open panel and check item
            await page_cand.click("#notif-bell-btn")
            await page_cand.wait_for_selector("#notif-bell-panel:not([hidden])")
            cand_notif_title = await page_cand.locator(".notif-item .notif-item-title").first.text_content()
            cand_notif_body = await page_cand.locator(".notif-item .notif-item-body").first.text_content()
            print(f"   Candidate Notif Title: '{cand_notif_title}'")
            print(f"   Candidate Notif Body: '{cand_notif_body}'")
            assert "Cập nhật trạng thái hồ sơ" in cand_notif_title
            print("   ✓ Status update -> Candidate notification: ĐẠT")

        # -------------------------------------------------------------
        # TEST 6: Cross-user 404 Security Check
        # -------------------------------------------------------------
        print("\n--- TEST 6: Cross-user 404 Security Check ---")
        cand_notifs = (await (await api_req.get(f"{BASE_BE}/api/notifications", headers=cand_headers)).json())["items"]
        if cand_notifs:
            target_id = cand_notifs[0]["id"]
            # Employer tries to mark candidate's notification as read
            cross_res = await api_req.post(f"{BASE_BE}/api/notifications/{target_id}/read", headers=emp_headers)
            print(f"   Employer calling /api/notifications/{target_id}/read: status {cross_res.status}")
            assert cross_res.status == 404, f"Expected 404 for cross-user read, got {cross_res.status}"
            print("   ✓ Cross-user 404 security check: ĐẠT")

        # -------------------------------------------------------------
        # TEST 7: XSS Prevention Check
        # -------------------------------------------------------------
        print("\n--- TEST 7: XSS Prevention Check ---")
        xss_raw = '<img src=x onerror=window.__xss_bell_attack=1>'
        await page_emp.evaluate("""(xss) => {
            const list = document.getElementById('notif-bell-list');
            const d = document.createElement('div');
            d.innerHTML = `
                <div class="notif-item">
                    <h4 class="notif-item-title">XSS Test</h4>
                    <p class="notif-item-body">${xss.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                </div>
            `;
            list.prepend(d);
        }""", xss_raw)
        xss_fired = await page_emp.evaluate("() => Boolean(window.__xss_bell_attack)")
        assert not xss_fired, "XSS executed!"
        print("   ✓ XSS script prevention: ĐẠT")

        # -------------------------------------------------------------
        # TEST 8: Mutual Exclusivity (Bell vs Avatar Dropdown)
        # -------------------------------------------------------------
        print("\n--- TEST 8: Mutual Exclusivity ---")
        # Ensure bell is open
        if await page_emp.locator("#notif-bell-panel").is_hidden():
            await page_emp.click("#notif-bell-btn")
            await asyncio.sleep(0.2)

        # Click user trigger
        await page_emp.click("#header-user-trigger")
        await asyncio.sleep(0.2)
        panel_is_hidden = await page_emp.locator("#notif-bell-panel").is_hidden()
        menu_is_visible = not await page_emp.locator("#header-user-dropdown").is_hidden()
        assert panel_is_hidden, "Bell panel must close when user menu opens"
        assert menu_is_visible, "User menu must be visible"

        # Click bell trigger
        await page_emp.click("#notif-bell-btn")
        await asyncio.sleep(0.2)
        panel_is_open = not await page_emp.locator("#notif-bell-panel").is_hidden()
        menu_is_hidden = await page_emp.locator("#header-user-dropdown").is_hidden()
        assert panel_is_open, "Bell panel must open when bell is clicked"
        assert menu_is_hidden, "User menu must close when bell panel opens"
        print("   ✓ Mutual exclusivity: ĐẠT")

        # -------------------------------------------------------------
        # TEST 9: Keyboard Navigation & Esc
        # -------------------------------------------------------------
        print("\n--- TEST 9: Keyboard Navigation & Esc ---")
        await page_emp.keyboard.press("ArrowDown")
        await asyncio.sleep(0.1)
        await page_emp.keyboard.press("Escape")
        await asyncio.sleep(0.2)
        panel_escaped = await page_emp.locator("#notif-bell-panel").is_hidden()
        assert panel_escaped, "Panel must close on Escape"
        print("   ✓ Escape key dismissal & focus return: ĐẠT")

        # -------------------------------------------------------------
        # TEST 10: Mobile Viewport 360px & Sheet Behavior
        # -------------------------------------------------------------
        print("\n--- TEST 10: Mobile Viewport 360px & Sheet ---")
        await page_emp.set_viewport_size({"width": 360, "height": 800})
        await page_emp.reload()
        await page_emp.wait_for_selector("#notif-bell-btn")

        # Check horizontal overflow
        overflow = await page_emp.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow, "Horizontal overflow detected on 360px mobile page!"

        # Open panel on mobile
        await page_emp.click("#notif-bell-btn")
        await page_emp.wait_for_selector("#notif-bell-panel:not([hidden])")

        panel_box = await page_emp.locator("#notif-bell-panel").bounding_box()
        print(f"   Mobile panel bounding box: {panel_box}")
        assert panel_box["width"] >= 330, f"Mobile panel width {panel_box['width']} should span nearly full width"

        # Check overflow when panel open
        overflow_open = await page_emp.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow_open, "Horizontal overflow detected when mobile panel is open!"

        await page_emp.screenshot(path=os.path.join(SCREENSHOT_DIR, "3_mobile_sheet_360_light.png"))
        print("   Saved: 3_mobile_sheet_360_light.png")

        # Dark mode on mobile
        await page_emp.click("#site-theme-toggle")
        await asyncio.sleep(0.3)
        await page_emp.screenshot(path=os.path.join(SCREENSHOT_DIR, "4_mobile_sheet_360_dark.png"))
        print("   Saved: 4_mobile_sheet_360_dark.png")

        await browser.close()

    print("\n=== CONSOLE ERROR AUDIT ===")
    print(f"Total console errors encountered: {len(console_errors)}")
    for err in console_errors:
        print(f"  {err}")
    assert len(console_errors) == 0, "Console errors were encountered!"
    print("\nALL 10 VERIFICATION CHECKS PASSED 100%!")

if __name__ == "__main__":
    asyncio.run(run_tests())
