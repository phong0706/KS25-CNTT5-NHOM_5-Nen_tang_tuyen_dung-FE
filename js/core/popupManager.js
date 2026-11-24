/**
 * popupManager.js - Điều phối tập trung mọi popup (mega menu, suggest, select, avatar, notif).
 * Đảm bảo tại một thời điểm tối đa MỘT popup mở.
 * Giới hạn: <= 120 dòng, logic thuần có node:test.
 */

export class PopupManager {
  constructor() {
    this.registry = new Map();
    this.activeId = null;
    this.isInputFocused = false;
  }

  register(id, handlers = {}) {
    this.registry.set(id, {
      open: handlers.open || (() => {}),
      close: handlers.close || (() => {}),
      kind: handlers.kind || "popup",
      getTriggerEl: handlers.getTriggerEl || (() => null),
      getPopupEl: handlers.getPopupEl || (() => null),
    });
    return () => this.unregister(id);
  }

  unregister(id) {
    if (this.activeId === id) this.activeId = null;
    this.registry.delete(id);
  }

  getActive() {
    return this.activeId ? { id: this.activeId, ...this.registry.get(this.activeId) } : null;
  }

  setInputFocused(val) {
    this.isInputFocused = Boolean(val);
  }

  canHoverOpen(kind = "mega") {
    if (this.isInputFocused) return false;
    if (!this.activeId) return true;
    const current = this.registry.get(this.activeId);
    return current?.kind === kind;
  }

  open(id, ...args) {
    if (this.activeId && this.activeId !== id) {
      const prev = this.registry.get(this.activeId);
      prev?.close?.();
    }
    this.activeId = id;
    const cur = this.registry.get(id);
    return cur?.open?.(...args);
  }

  close(id, { returnFocus = true } = {}) {
    const targetId = id || this.activeId;
    if (!targetId) return;
    const item = this.registry.get(targetId);
    if (this.activeId === targetId) this.activeId = null;
    item?.close?.();
    if (returnFocus && item?.getTriggerEl) {
      try { item.getTriggerEl()?.focus?.(); } catch {}
    }
  }

  closeAll({ returnFocus = false } = {}) {
    if (this.activeId) this.close(this.activeId, { returnFocus });
  }

  initGlobalListeners(doc = (typeof document !== "undefined" ? document : null)) {
    if (!doc) return;
    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeId) {
        e.preventDefault();
        this.close(this.activeId, { returnFocus: true });
      }
    });

    doc.addEventListener("pointerdown", (e) => {
      if (!this.activeId) return;
      const cur = this.registry.get(this.activeId);
      const target = e.target;
      const triggerEl = cur?.getTriggerEl?.();
      const popupEl = cur?.getPopupEl?.();
      if (triggerEl?.contains?.(target) || popupEl?.contains?.(target)) return;
      this.close(this.activeId, { returnFocus: false });
    });
  }
}

export const popupManager = new PopupManager();
if (typeof document !== "undefined") {
  popupManager.initGlobalListeners(document);
  if (typeof window !== "undefined") window.popupManager = popupManager;
}
