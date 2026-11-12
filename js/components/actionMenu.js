/**
 * Component Menu hành động "⋯" chuẩn WAI-ARIA (role="menu")
 * Vẽ danh sách nút theo mảng allowed_actions từ backend; hỗ trợ điều hướng bàn phím.
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

let activeMenu = null;

export function closeActionMenu(restoreFocus = false) {
  if (!activeMenu) return;
  const { menuEl, triggerEl, onDocClick, onKeyDown, onScrollResize } = activeMenu;
  document.removeEventListener("click", onDocClick, true);
  document.removeEventListener("keydown", onKeyDown, true);
  window.removeEventListener("resize", onScrollResize);
  window.removeEventListener("scroll", onScrollResize, true);
  if (triggerEl) triggerEl.setAttribute("aria-expanded", "false");
  menuEl.remove();
  activeMenu = null;
  if (restoreFocus && triggerEl && document.contains(triggerEl)) {
    triggerEl.focus();
  }
}

export function openActionMenu(triggerEl, actions, onSelect) {
  const wasSameTrigger = activeMenu && activeMenu.triggerEl === triggerEl;
  closeActionMenu(false);
  if (wasSameTrigger || !Array.isArray(actions) || actions.length === 0) return;

  const menuEl = document.createElement("div");
  menuEl.className = "ej-action-menu";
  menuEl.setAttribute("role", "menu");
  menuEl.setAttribute("aria-label", "Thao tác tin tuyển dụng");

  menuEl.innerHTML = actions
    .map((act, idx) => {
      const toneClass = act.tone === "danger" ? "is-danger" : act.tone === "primary" ? "is-primary" : "";
      return `
        <button
          type="button"
          class="ej-action-item ${toneClass}"
          role="menuitem"
          data-action-key="${escapeText(act.key)}"
          tabindex="${idx === 0 ? "0" : "-1"}"
        >${escapeText(act.label)}</button>
      `;
    })
    .join("");

  document.body.appendChild(menuEl);
  triggerEl.setAttribute("aria-expanded", "true");

  const positionMenu = () => {
    const rect = triggerEl.getBoundingClientRect();
    const menuW = menuEl.offsetWidth || 180;
    const menuH = menuEl.offsetHeight || 160;
    const left = Math.max(8, Math.min(rect.right - menuW, window.innerWidth - menuW - 8));
    const openUp = rect.bottom + menuH + 8 > window.innerHeight && rect.top - menuH - 8 > 0;
    const top = openUp ? rect.top - menuH - 6 : rect.bottom + 6;
    menuEl.style.left = `${left}px`;
    menuEl.style.top = `${top}px`;
  };
  positionMenu();

  const itemEls = Array.from(menuEl.querySelectorAll('[role="menuitem"]'));
  itemEls[0]?.focus();

  itemEls.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const actionKey = btn.dataset.actionKey;
      closeActionMenu(false);
      if (actionKey) onSelect?.(actionKey);
    });
  });

  const onDocClick = (e) => {
    if (!menuEl.contains(e.target) && !triggerEl.contains(e.target)) {
      closeActionMenu(false);
    }
  };

  const onKeyDown = (e) => {
    const currentIdx = itemEls.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      closeActionMenu(true);
    } else if (e.key === "Tab") {
      closeActionMenu(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = itemEls[(currentIdx + 1) % itemEls.length];
      next?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = itemEls[(currentIdx - 1 + itemEls.length) % itemEls.length];
      prev?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      itemEls[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itemEls[itemEls.length - 1]?.focus();
    }
  };

  const onScrollResize = () => closeActionMenu(false);

  document.addEventListener("click", onDocClick, true);
  document.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("resize", onScrollResize);
  window.addEventListener("scroll", onScrollResize, true);

  activeMenu = { menuEl, triggerEl, onDocClick, onKeyDown, onScrollResize };
}

/**
 * Thực thi hành động trên 1 tin: gọi API chuyển trạng thái / nhân bản / xóa,
 * hiển thị modal xác nhận cho Đóng/Xóa và toast Hoàn tác 5s cho Ẩn/Đóng.
 */
export async function executeJobAction(job, actionKey, triggerEl, deps) {
  const { openConfirmModal, showStatusToast, showUndoToast, onReload } = deps;
  if (actionKey === "edit") {
    window.location.href = `./job-form.html?id=${job.id}`;
    return;
  }
  const runStatusPatch = async (action) => {
    try {
      const res = await window.api.patch(`/employer/jobs/${job.id}/status`, { action });
      await onReload();
      if (res.undo_action) {
        showUndoToast(res.message, async () => {
          await window.api.patch(`/employer/jobs/${job.id}/status`, { action: res.undo_action });
          showStatusToast("Đã hoàn tác thao tác.", "success");
          await onReload();
        }, 5000);
      } else {
        showStatusToast(res.message, "success");
      }
    } catch (err) {
      showStatusToast(err?.message || "Không thể cập nhật trạng thái tin.", "error", 3500);
      throw err;
    }
  };
  if (actionKey === "duplicate") {
    try {
      const res = await window.api.post(`/employer/jobs/${job.id}/duplicate`);
      showStatusToast(res.message, "success");
      await onReload();
    } catch (err) {
      showStatusToast(err?.message || "Không thể nhân bản tin.", "error", 3500);
    }
    return;
  }
  if (actionKey === "close") {
    openConfirmModal({
      title: "Đóng tin tuyển dụng?",
      description: `Tin "${job.title}" sẽ ngừng nhận hồ sơ mới và chuyển sang mục Đã đóng.`,
      confirmLabel: "Đóng tin",
      danger: true,
      returnFocusTo: triggerEl,
      onConfirm: () => runStatusPatch("close"),
    });
    return;
  }
  if (actionKey === "delete") {
    openConfirmModal({
      title: "Xóa tin tuyển dụng?",
      description: `Tin "${job.title}" và toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn, không thể khôi phục.`,
      confirmLabel: "Xóa tin",
      danger: true,
      returnFocusTo: triggerEl,
      onConfirm: async () => {
        try {
          const res = await window.api.delete(`/employer/jobs/${job.id}`);
          showStatusToast(res.message, "success");
          await onReload();
        } catch (err) {
          showStatusToast(err?.message || "Không thể xóa tin.", "error", 3500);
          throw err;
        }
      },
    });
    return;
  }
  await runStatusPatch(actionKey).catch(() => {});
}
