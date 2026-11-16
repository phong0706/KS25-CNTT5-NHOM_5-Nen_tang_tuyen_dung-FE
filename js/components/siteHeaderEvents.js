/**
 * siteHeaderEvents.js - Sự kiện cho header/mega menu dùng chung.
 * Tách riêng để mỗi file JS dưới 200 dòng.
 */
import { resolveSiteRoot, siteUrl, SITE_ICONS } from "./siteHeader.js";

/** Gắn sự kiện cho mega menu + menu tài khoản. */
export function bindSiteHeaderEvents(opts = {}) {
  const host = document.getElementById("app-header");
  if (!host) return;

  const triggers = Array.from(host.querySelectorAll(".mega-nav-trigger"));
  // Nhóm đang mở: { trigger, pinned }. pinned = mở bằng click (đã ghim).
  let openGroup = null;
  let openTimer = null;   // trễ 100ms khi hover mở
  let closeTimer = null;  // trễ 250ms khi hover rời

  const panelOf = (trigger) =>
    document.getElementById(trigger.getAttribute("aria-controls"));

  const itemOf = (trigger) => trigger.closest(".mega-nav-item");

  function setOpen(trigger) {
    triggers.forEach((t) => {
      const on = t === trigger;
      t.setAttribute("aria-expanded", on ? "true" : "false");
      const item = itemOf(t);
      item?.classList.toggle("is-open", on);
      item?.classList.toggle("is-pinned", on && openGroup?.trigger === t && openGroup.pinned);
      const p = panelOf(t);
      if (p) {
        p.setAttribute("aria-hidden", on ? "false" : "true");
        if (on) p.removeAttribute("inert");
        else p.setAttribute("inert", "");
      }
    });
  }

  function openPanel(trigger, { pinned = false } = {}) {
    if (!panelOf(trigger)) return;
    openGroup = { trigger, pinned };
    setOpen(trigger);
  }

  function closePanel(trigger, { returnFocus = false } = {}) {
    const t = trigger || openGroup?.trigger;
    if (!t) return;
    openGroup = null;
    setOpen(null);
    if (returnFocus) t.focus();
  }

  // Hover chỉ phụ: chỉ khi chuột thật (hover:hover + pointer:fine)
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const OPEN_DELAY = 100;   // trễ khi hover MỞ
  const CLOSE_DELAY = 250;  // trễ khi hover RỜI

  const clearTimers = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    openTimer = null;
    closeTimer = null;
  };

  triggers.forEach((trigger) => {
    const item = itemOf(trigger);
    if (!item) return;

    // Click: mở + ghim. Click lần nữa vào nút đã ghim -> đóng.
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      clearTimers();
      const isPinned = openGroup?.trigger === trigger && openGroup.pinned;
      if (isPinned) {
        closePanel(trigger);
      } else {
        // Đang mở do hover -> chuyển sang ghim, KHÔNG đóng.
        openPanel(trigger, { pinned: true });
      }
    });

    // Hover MỞ: pointerenter trên .nav-item (gồm cả nút và panel).
    item.addEventListener("pointerenter", (e) => {
      if (!canHover.matches) return;
      if (e.pointerType && e.pointerType !== "mouse") return;
      clearTimeout(closeTimer);
      closeTimer = null;
      if (openGroup?.trigger === trigger) return;
      if (openGroup) {
        // Đã có panel khác đang mở -> CHUYỂN NGAY, không trễ (không nháy).
        clearTimeout(openTimer);
        openTimer = null;
        openPanel(trigger, { pinned: openGroup.pinned });
        return;
      }
      clearTimeout(openTimer);
      openTimer = setTimeout(() => {
        openTimer = null;
        if (!openGroup) openPanel(trigger);
      }, OPEN_DELAY);
    });

    // Hover RỜI khỏi .nav-item -> đóng sau 250ms (hủy nếu quay lại).
    item.addEventListener("pointerleave", (e) => {
      if (!canHover.matches) return;
      if (e.pointerType && e.pointerType !== "mouse") return;
      clearTimeout(openTimer);
      openTimer = null;
      if (!openGroup) return;
      // Đã ghim (click) -> không đóng bằng hover.
      if (openGroup.pinned) return;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        closeTimer = null;
        if (openGroup && !openGroup.pinned) closePanel(openGroup.trigger);
      }, CLOSE_DELAY);
    });

    // Bàn phím trong nhóm: mũi tên / Home / End.
    item?.addEventListener("keydown", (e) => {
      const isTrigger = e.target === trigger;
      const panel = panelOf(trigger);
      const links = panel
        ? Array.from(panel.querySelectorAll(".mega-menu-link"))
        : [];
      const i = triggers.indexOf(trigger);
      let next = -1;

      if (e.key === "ArrowRight") next = (i + 1) % triggers.length;
      else if (e.key === "ArrowLeft") next = (i - 1 + triggers.length) % triggers.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = triggers.length - 1;

      if (next >= 0) {
        e.preventDefault();
        triggers[next].focus();
        if (openGroup) openPanel(triggers[next], { pinned: openGroup.pinned });
        return;
      }

      // Khi focus đang ở trong panel: mũi tên lên/xuống di chuyển giữa các mục.
      if (!isTrigger && links.length) {
        const cur = links.indexOf(e.target.closest(".mega-menu-link"));
        if (cur < 0) return;
        let target = -1;
        if (e.key === "ArrowDown") target = (cur + 1) % links.length;
        else if (e.key === "ArrowUp") target = (cur - 1 + links.length) % links.length;
        else if (e.key === "Home") target = 0;
        else if (e.key === "End") target = links.length - 1;
        if (target >= 0) {
          e.preventDefault();
          links[target].focus();
        }
      }
    });

    // focusout: chỉ đóng khi focus rời hẳn ra ngoài .nav-item
    item?.addEventListener("focusout", (e) => {
      const next = e.relatedTarget;
      if (!next) return;
      if (item.contains(next)) return;
      // Chuyển focus sang nút mega KHÁC (phím mũi tên) -> không đóng ở đây,
      // keydown sẽ mở nhóm mới. Nếu đóng ở đây thì openGroup bị null và
      // nhóm mới không mở được.
      if (next.matches?.(".mega-nav-trigger")) return;
      if (openGroup) closePanel(openGroup.trigger);
    });

    // Bấm link trong panel -> đóng (điều hướng sẽ xử lý phần còn lại).
    panelOf(trigger)?.addEventListener("click", (e) => {
      if (e.target.closest("a")) closePanel(trigger);
    });
  });

  // Esc đóng và trả focus về nút đã mở.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (openGroup) {
      const t = openGroup.trigger;
      clearTimers();
      closePanel(t, { returnFocus: true });
    }
  });

  // Click ngoài nhóm đang mở -> đóng (dùng pointerdown).
  document.addEventListener("pointerdown", (e) => {
    if (!openGroup) return;
    if (e.target.closest(".mega-nav-item")) return;
    clearTimers();
    closePanel(openGroup.trigger);
  });

  // Đổi trang -> tự đóng.
  window.addEventListener("pagehide", () => {
    if (!openGroup) return;
    clearTimers();
    closePanel(openGroup.trigger);
  });

  // Co cửa sổ xuống dưới 1024px -> đóng (đã chuyển sang drawer).
  const desktop = window.matchMedia("(min-width: 1024px)");
  const onViewport = () => {
    if (!desktop.matches && openGroup) {
      clearTimers();
      closePanel(openGroup.trigger);
    }
  };
  desktop.addEventListener?.("change", onViewport);
  window.addEventListener("resize", onViewport);

  // Menu tài khoản.
  const userTrigger = host.querySelector("#header-user-trigger");
  const userMenu = host.querySelector("#header-user-dropdown");
  if (userTrigger && userMenu) {
    userTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const notifPanel = host.querySelector("#notif-bell-panel");
      const notifBtn = host.querySelector("#notif-bell-btn");
      if (notifPanel && !notifPanel.hidden) {
        notifPanel.hidden = true;
        notifBtn?.setAttribute("aria-expanded", "false");
      }
      const isOpen = userTrigger.getAttribute("aria-expanded") === "true";
      userMenu.hidden = isOpen;
      userTrigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
    document.addEventListener("click", (e) => {
      if (!host.contains(e.target)) {
        userMenu.hidden = true;
        userTrigger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !userMenu.hidden) {
        userMenu.hidden = true;
        userTrigger.setAttribute("aria-expanded", "false");
        userTrigger.focus();
      }
    });
    userMenu.querySelector("[data-signout]")?.addEventListener("click", () => {
      opts.onSignOut?.();
    });
  }
}
