/**
 * Avatar Crop & Zoom Modal Component
 * - Cắt ảnh vuông / tròn
 * - Zoom (1x - 3x) và kéo di chuyển (Pan)
 * - Canvas 512x512 resize xuất WebP 0.85
 * - Hỗ trợ Xóa ảnh đại diện
 */

export function openAvatarCropModal({ imageSrc, onUpload, onDelete, hasAvatar = false }) {
  const backdrop = document.createElement("div");
  backdrop.className = "avatar-crop-backdrop";

  backdrop.innerHTML = `
    <div class="avatar-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
      <div class="avatar-crop-head">
        <h3 class="avatar-crop-title" id="avatar-modal-title">Chỉnh sửa ảnh đại diện</h3>
        <button type="button" class="profile-drawer-close" aria-label="Đóng">&times;</button>
      </div>

      <div class="avatar-crop-body">
        <div class="avatar-crop-viewport" id="avatar-viewport">
          <img src="${imageSrc}" class="avatar-crop-img" id="crop-img" alt="Xem trước ảnh">
        </div>

        <div class="avatar-crop-zoom-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          <input type="range" class="avatar-zoom-slider" id="zoom-slider" min="1" max="3" step="0.05" value="1" aria-label="Độ phóng đại">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        </div>
        <p style="margin:0;font-size:12.5px;color:var(--text-muted);text-align:center;">Kéo để căn chỉnh vị trí · Dùng thanh trượt để phóng to/thu nhỏ</p>
      </div>

      <div class="avatar-crop-footer">
        <div>
          ${hasAvatar ? `<button type="button" id="btn-delete-avatar" style="background:none;border:none;color:var(--danger);font-size:13px;font-weight:600;cursor:pointer;padding:0;">Xóa ảnh</button>` : ""}
        </div>
        <div style="display:flex;gap:10px;">
          <button type="button" class="btn-cancel-crop section-action-btn" style="padding:8px 18px;">Hủy</button>
          <button type="button" class="btn-save-crop" id="btn-save-crop" style="background:var(--primary);color:#fff;border:none;padding:9px 22px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit;">Lưu ảnh</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add("is-open"));

  const closeBtn = backdrop.querySelector(".profile-drawer-close");
  const cancelBtn = backdrop.querySelector(".btn-cancel-crop");
  const saveBtn = backdrop.querySelector("#btn-save-crop");
  const deleteBtn = backdrop.querySelector("#btn-delete-avatar");
  const viewport = backdrop.querySelector("#avatar-viewport");
  const imgEl = backdrop.querySelector("#crop-img");
  const slider = backdrop.querySelector("#zoom-slider");

  let scale = 1.0;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  let naturalW = 1;
  let naturalH = 1;

  imgEl.onload = () => {
    naturalW = imgEl.naturalWidth || 240;
    naturalH = imgEl.naturalHeight || 240;
    // Tự động scale sao cho ảnh phủ kín viewport 240x240
    const minCoverScale = Math.max(240 / naturalW, 240 / naturalH);
    scale = minCoverScale;
    slider.min = (minCoverScale * 0.8).toFixed(2);
    slider.max = (minCoverScale * 3.0).toFixed(2);
    slider.value = minCoverScale.toFixed(2);
    updateTransform();
  };

  function updateTransform() {
    imgEl.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`;
  }

  slider.addEventListener("input", () => {
    scale = parseFloat(slider.value);
    updateTransform();
  });

  // Pan via Pointer events
  viewport.addEventListener("pointerdown", (e) => {
    isDragging = true;
    viewport.classList.add("is-dragging");
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
  });

  const stopDrag = () => {
    isDragging = false;
    viewport.classList.remove("is-dragging");
  };

  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);

  const close = () => {
    backdrop.classList.remove("is-open");
    setTimeout(() => backdrop.remove(), 220);
  };

  closeBtn.addEventListener("click", close);
  cancelBtn.addEventListener("click", close);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  deleteBtn?.addEventListener("click", async () => {
    close();
    await onDelete?.();
  });

  saveBtn.addEventListener("click", () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Đang xử lý...";

    // Render ra canvas 512x512
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Tỉ lệ từ viewport 240x240 sang canvas 512x512
    const ratio = 512 / 240;

    ctx.save();
    ctx.translate(256, 256);
    ctx.translate(panX * ratio, panY * ratio);
    ctx.scale(scale * ratio, scale * ratio);
    ctx.drawImage(imgEl, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
    ctx.restore();

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Lưu ảnh";
          return;
        }
        try {
          await onUpload(blob);
          close();
        } catch {
          saveBtn.disabled = false;
          saveBtn.textContent = "Lưu ảnh";
        }
      },
      "image/webp",
      0.85
    );
  });
}
