// Các hàm tiện ích dùng chung cho nhiều trang - TechRecruit KS25 Base

// Chống XSS: luôn dùng hàm này khi chèn dữ liệu người dùng nhập vào innerHTML
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

// 45000 -> "45.000 ₫"
function formatMoney(value) {
  return Number(value).toLocaleString("vi-VN") + " ₫";
}

// "2026-11-04T09:30:00" -> "09:30 4/11/2026"
function formatDateTime(value) {
  const d = new Date(value);
  return (
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
    " " +
    d.toLocaleDateString("vi-VN")
  );
}

// Hiện thông báo nhỏ ở góc màn hình. type: "success" | "error"
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/**
 * Trình tạo và xác thực CAPTCHA tương tác bằng HTML5 Canvas
 * - Vẽ chuỗi ký tự ngẫu nhiên kèm độ xoay và đường nhiễu chống bot
 * - Hỗ trợ nút làm mới và kiểm tra không phân biệt hoa thường
 * @param {Object} options
 * @param {string} options.canvasId - ID thẻ canvas
 * @param {string} options.inputId - ID thẻ input nhập captcha
 * @param {string} [options.refreshBtnId] - ID nút làm mới
 * @param {string} [options.errorId] - ID vùng báo lỗi
 * @param {number} [options.length=4] - Độ dài mã (mặc định 4)
 */
function createCaptcha(options) {
  const canvas = document.getElementById(options.canvasId);
  const input = document.getElementById(options.inputId);
  const refreshBtn = document.getElementById(options.refreshBtnId);
  const errorEl = document.getElementById(options.errorId);
  const length = options.length || 4;
  let currentCode = "";

  // Bộ ký tự thân thiện mắt nhìn, không gây nhầm lẫn (bỏ O/0, 1/I/l)
  const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

  function generateCode() {
    let str = "";
    for (let i = 0; i < length; i++) {
      str += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return str;
  }

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width || 120;
    const height = canvas.height || 42;

    // Nền trắng kem sạch sẽ
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, width, height);

    // Viền khung
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Các đường cong nhiễu chống OCR
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = ["#CBD5E1", "#94A3B8", "#A7F3D0", "#E2E8F0"][i % 4];
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Vẽ từng ký tự xoay góc
    currentCode = generateCode();
    const charSpacing = width / (length + 1);

    for (let i = 0; i < length; i++) {
      const char = currentCode[i];
      const x = charSpacing * (i + 0.6) + (Math.random() * 4 - 2);
      const y = height / 2 + 7 + (Math.random() * 4 - 2);
      const angle = (Math.random() * 32 - 16) * (Math.PI / 180);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = "bold 21px 'JetBrains Mono', Consolas, Monaco, monospace";
      ctx.fillStyle = ["#0F766E", "#047857", "#0F172A", "#1E293B", "#0D9488"][i % 5];
      ctx.fillText(char, -8, 0);
      ctx.restore();
    }

    // Các chấm nhiễu nhẹ
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = ["#94A3B8", "#64748B", "#CBD5E1"][i % 3];
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function refresh() {
    draw();
    if (input) {
      input.value = "";
      input.classList.remove("is-invalid");
    }
    if (errorEl) {
      errorEl.classList.remove("active");
    }
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", (e) => {
      e.preventDefault();
      refresh();
      if (input) input.focus();
    });
  }

  if (canvas) {
    canvas.addEventListener("click", () => {
      refresh();
      if (input) input.focus();
    });
  }

  if (input) {
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
      if (errorEl) errorEl.classList.remove("active");
    });
  }

  draw();

  return {
    getCode: () => currentCode,
    validate: () => {
      if (!input) return false;
      const userVal = input.value.trim().toUpperCase();
      const isValid = userVal === currentCode.toUpperCase();
      if (!isValid) {
        input.classList.add("is-invalid");
        if (errorEl) {
          const errText = errorEl.querySelector(".error-text");
          if (errText) {
            errText.textContent =
              userVal.length === 0
                ? "Vui lòng nhập mã xác thực bảo vệ"
                : "Mã xác thực không chính xác";
          }
          errorEl.classList.add("active");
        }
        refresh();
        input.focus();
        return false;
      }
      input.classList.remove("is-invalid");
      if (errorEl) errorEl.classList.remove("active");
      return true;
    },
    fillCorrectCode: () => {
      if (input) {
        input.value = currentCode;
        input.classList.remove("is-invalid");
        if (errorEl) errorEl.classList.remove("active");
      }
    },
    refresh,
  };
}

/**
 * Modal xác nhận cho thao tác nguy hiểm (Khoá tài khoản, xoá tin, xoá dữ liệu).
 * - Có tiêu đề, mô tả hậu quả, nút "Hủy" và nút hành động màu đỏ.
 * - Đóng được bằng phím Escape.
 * - Tự động focus vào nút Hủy khi mở.
 * @returns {Promise<boolean>}
 */
function showConfirmModal({
  title = "Xác nhận thao tác",
  description = "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?",
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
} = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "confirm-modal-backdrop";
    backdrop.innerHTML = `
      <div class="confirm-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-desc">
        <h3 class="confirm-modal-title" id="confirm-modal-title">${escapeHtml(title)}</h3>
        <p class="confirm-modal-desc" id="confirm-modal-desc">${escapeHtml(description)}</p>
        <div class="confirm-modal-actions">
          <button type="button" class="confirm-modal-cancel" id="confirm-modal-btn-cancel">${escapeHtml(cancelLabel)}</button>
          <button type="button" class="confirm-modal-danger" id="confirm-modal-btn-confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const cancelBtn = backdrop.querySelector("#confirm-modal-btn-cancel");
    const confirmBtn = backdrop.querySelector("#confirm-modal-btn-confirm");
    const previousActive = document.activeElement;

    function cleanup(result) {
      document.removeEventListener("keydown", handleKeyDown);
      backdrop.remove();
      if (previousActive && typeof previousActive.focus === "function") {
        previousActive.focus();
      }
      resolve(result);
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        cleanup(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        cleanup(false);
      }
    });

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => cleanup(false));
      // Focus vào nút Hủy ngay khi mở modal
      cancelBtn.focus();
    }

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => cleanup(true));
    }
  });
}

const COMPANY_LOGO_ALIASES = {
  rikkeisoft: "rikkei",
  "rikkei-soft": "rikkei",
  rikkeilab: "rikkei",
  "rikkei-lab": "rikkei",
  "momo-m-service": "momo",
};

const COMPANY_AVATAR_PALETTE = [
  { bg: "#ECFDF5", color: "#065F46" },
  { bg: "#EFF6FF", color: "#1E40AF" },
  { bg: "#FEF2F2", color: "#991B1B" },
  { bg: "#F5F3FF", color: "#5B21B6" },
  { bg: "#FFF7ED", color: "#9A3412" },
  { bg: "#F0FDF4", color: "#166534" },
];

/**
 * Chuyển tên công ty sang slug chuẩn để tìm file logo trong /assets/img/companies/.
 * @param {string} name
 * @returns {string}
 */
function slugifyCompanyName(name) {
  const raw = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return COMPANY_LOGO_ALIASES[raw] || raw;
}

/**
 * Tạo HTML khung logo công ty 48x48 dùng chung cho thẻ việc, hero và trang công ty.
 * Tự động tải /assets/img/companies/{slug}.webp và fallback sang chữ cái đầu khi lỗi tải.
 * @param {string|Object} company
 * @param {Object} [options]
 * @returns {string}
 */
function getCompanyLogo(company, options = {}) {
  const isObj = company && typeof company === "object";
  const name = isObj ? (company.company || company.name || "") : String(company || "");
  const cleanName = name.trim();
  const slug = isObj && company.logoSlug ? company.logoSlug : slugifyCompanyName(cleanName);
  const root = options.root !== undefined ? options.root : (document.body?.dataset?.root || "");
  const logoSrc = isObj && company.logo
    ? company.logo
    : (slug ? `${root}assets/img/companies/${slug}.webp` : "");

  const initial = (
    (isObj && (company.companyInitial || company.initial)) ||
    (cleanName ? cleanName.charAt(0).toUpperCase() : "T")
  );

  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash * 31 + cleanName.charCodeAt(i)) >>> 0;
  }
  const palette = COMPANY_AVATAR_PALETTE[hash % COMPANY_AVATAR_PALETTE.length];
  const bg = (isObj && company.avatarBg) || palette.bg;
  const color = (isObj && company.avatarColor) || palette.color;
  const extraClass = options.className ? ` ${escapeHtml(options.className)}` : "";
  const altText = `Logo ${cleanName || "doanh nghiệp"}`;

  return `
    <div class="company-logo-box${extraClass}" style="width: 48px; height: 48px;">
      ${logoSrc ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(altText)}" width="48" height="48" class="company-logo-img" loading="lazy" decoding="async" onerror="this.hidden=true;if(this.nextElementSibling)this.nextElementSibling.hidden=false;">` : ""}
      <span class="company-logo-fallback" style="background-color: ${escapeHtml(bg)}; color: ${escapeHtml(color)};"${logoSrc ? " hidden" : ""} aria-hidden="true">${escapeHtml(initial)}</span>
    </div>
  `.trim();
}

window.slugifyCompanyName = slugifyCompanyName;
window.getCompanyLogo = getCompanyLogo;
