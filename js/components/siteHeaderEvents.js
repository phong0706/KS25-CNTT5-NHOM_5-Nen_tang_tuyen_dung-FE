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
  let openGroup = null;
  let hoverTimer = null;

  const panelOf = (trigger) =>
    document.getElementById(trigger.getAttribute("aria-controls"));

  const itemOf = (trigger) => trigger.closest(".mega-nav-item");

  function setOpen(trigger) {
    triggers.forEach((t) => {
      const on = t === trigger;
      t.setAttribute("aria-expanded", on ? "true" : "false");
      const item = itemOf(t);
      item?.classList.toggle("is-open", on);
      const p = panelOf(t);
      if (p) {
        p.setAttribute("aria-hidden", on ? "false" : "true");
        if (on) p.removeAttribute("inert");
        else p.setAttribute("inert", "");
      }
    });
    openGroup = trigger;
  }

  function openPanel(trigger) {
    if (!panelOf(trigger)) return;
    setOpen(trigger);
  }

  function closePanel(trigger, { returnFocus = false } = {}) {
    const t = trigger || openGroup;
    if (!t) return;
    setOpen(null);
    if (returnFocus) t.focus();
  }

  // Hover chỉ phụ: chỉ khi chuột thật (hover:hover + pointer:fine)
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const HOVER_DELAY = 80;

  triggers.forEach((trigger) => {
    const item = itemOf(trigger);

    // Click mở/đóng (hành vi chính). Không đóng chỉ vì rê chuột.
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      clearTimeout(hoverTimer);
      if (isOpen) closePanel(trigger);
      else openPanel(trigger);
    });

    // Hover: chỉ chuyển nhóm khi đã có panel đang mở. KHÔNG tự mở.
    item?.addEventListener("mouseenter", () => {
      if (!canHover.matches || !openGroup) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (openGroup && openGroup !== trigger) openPanel(trigger);
      }, HOVER_DELAY);
    });

    // Rời khỏi nhóm: KHÔNG đóng (con trỏ có thể đang đi xuống panel).
    item?.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
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
        if (openGroup) openPanel(triggers[next]);
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
      if (openGroup) closePanel(openGroup);
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
      const t = openGroup;
      closePanel(t, { returnFocus: true });
    }
  });

  // Click ngoài nhóm đang mở -> đóng (dùng pointerdown).
  document.addEventListener("pointerdown", (e) => {
    if (!openGroup) return;
    if (e.target.closest(".mega-nav-item")) return;
    closePanel(openGroup);
  });

  // Đổi trang -> tự đóng.
  window.addEventListener("pagehide", () => { if (openGroup) closePanel(openGroup); });

  // Co cửa sổ xuống dưới 1024px -> đóng (đã chuyển sang drawer).
  const desktop = window.matchMedia("(min-width: 1024px)");
  const onViewport = () => { if (!desktop.matches && openGroup) closePanel(openGroup); };
  desktop.addEventListener?.("change", onViewport);
  window.addEventListener("resize", onViewport);

  // Menu tài khoản.
  const userTrigger = host.querySelector("#header-user-trigger");
  const userMenu = host.querySelector("#header-user-dropdown");
  if (userTrigger && userMenu) {
    userTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
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
