/**
 * Quick View Drawer cho màn hình Desktop (>= 1280px)
 * Điều hướng phím mũi tên lên/xuống, Esc đóng, URL ?job=ID.
 */
import { formatSalary } from "./jobCard.js";
import { openApplyModal } from "./applyModal.js";
import { showStatusToast } from "./toast.js";

/**
 * Escape HTML để chống XSS khi chèn dữ liệu từ API (title, description, requirements...).
 * Mô tả công việc là nội dung do người dùng/nhà tuyển dụng nhập -> KHÔNG được chèn thô.
 */
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

/** Chuyển xuống dòng (\n) thành <br> SAU khi đã escape an toàn. */
function textToHtml(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

/**
 * Tạo link tới trang chi tiết việc làm, đúng đường dẫn tương đối theo vị trí trang.
 * Bản cũ hard-code "./items.html" -> hỏng khi component được dùng ở trang con
 * (vd. pages/candidate/) vì "./" chỉ trỏ đúng khi đang ở thư mục gốc của pages/.
 */
function jobsDetailHref(jobId) {
  const rootAttr = document.body ? document.body.dataset.root : null;
  const root = rootAttr
    ? (rootAttr.endsWith("/") ? rootAttr : rootAttr + "/")
    : (window.location.pathname.includes("/pages/") ? "../" : "./");
  return `${root}pages/job-detail.html?id=${encodeURIComponent(jobId)}`;
}

export function initJobQuickView({ onSelectJob }) {
  let drawerEl = document.getElementById("job-quick-view-drawer");
  let overlayEl = document.getElementById("job-quick-view-overlay");
  let currentList = [];
  let currentJobId = null;

  if (!drawerEl) {
    overlayEl = document.createElement("div");
    overlayEl.id = "job-quick-view-overlay";
    overlayEl.className = "quick-view-overlay";
    overlayEl.hidden = true;
    document.body.appendChild(overlayEl);

    drawerEl = document.createElement("div");
    drawerEl.id = "job-quick-view-drawer";
    drawerEl.className = "quick-view-drawer";
    drawerEl.setAttribute("role", "dialog");
    drawerEl.setAttribute("aria-modal", "true");
    drawerEl.setAttribute("aria-label", "Xem nhanh việc làm");
    drawerEl.hidden = true;
    document.body.appendChild(drawerEl);
  }

  function close() {
    drawerEl.hidden = true;
    drawerEl.classList.remove("is-open");
    overlayEl.hidden = true;
    currentJobId = null;
    const url = new URL(window.location.href);
    if (url.searchParams.has("job")) {
      url.searchParams.delete("job");
      window.history.pushState(null, "", url.toString());
    }
  }

  overlayEl.addEventListener("click", close);

  async function open(jobId) {
    currentJobId = jobId;
    const url = new URL(window.location.href);
    url.searchParams.set("job", jobId);
    window.history.pushState(null, "", url.toString());

    drawerEl.hidden = false;
    overlayEl.hidden = false;
    setTimeout(() => drawerEl.classList.add("is-open"), 10);
    drawerEl.innerHTML = `<div class="quick-view-loading" style="padding:32px; text-align:center; color:var(--text-secondary);">Đang tải thông tin chi tiết...</div>`;

    try {
      const job = await window.api.get(`/jobs/${jobId}`);
      renderDrawer(job);
    } catch {
      drawerEl.innerHTML = `
        <div style="padding:24px;">
          <p style="color:var(--danger-600);">Không thể tải thông tin chi tiết việc làm.</p>
          <button type="button" class="btn btn-sm btn-outline" id="qv-close-err">Đóng</button>
        </div>
      `;
      document.getElementById("qv-close-err")?.addEventListener("click", close);
    }
  }

  function renderDrawer(j) {
    const sal = formatSalary(j);
    drawerEl.innerHTML = `
      <div class="quick-view-header">
        <div style="flex:1; min-width:0;">
          <h2 class="quick-view-title">${escapeHtml(j.title)}</h2>
          <p class="quick-view-company">${escapeHtml(j.company_name || "Doanh nghiệp tuyển dụng")}</p>
        </div>
        <button type="button" class="quick-view-close-btn" id="qv-close-btn" aria-label="Đóng">&times;</button>
      </div>
      <div class="quick-view-body">
        <div class="quick-view-meta-grid">
          <div class="quick-view-meta-item"><span>Mức lương:</span> <strong>${escapeHtml(sal)}</strong></div>
          <div class="quick-view-meta-item"><span>Địa điểm:</span> <strong>${escapeHtml(j.location || "Toàn quốc")}</strong></div>
          <div class="quick-view-meta-item"><span>Hình thức:</span> <strong>${escapeHtml(j.type || "Toàn thời gian")}</strong></div>
          <div class="quick-view-meta-item"><span>Cấp bậc:</span> <strong>${escapeHtml(j.level || "Tất cả")}</strong></div>
        </div>
        <div class="quick-view-section">
          <h3>Mô tả công việc</h3>
          <div class="quick-view-text">${j.description ? textToHtml(j.description) : "Đang cập nhật..."}</div>
        </div>
        ${j.requirements ? `
          <div class="quick-view-section">
            <h3>Yêu cầu ứng viên</h3>
            <div class="quick-view-text">${textToHtml(j.requirements)}</div>
          </div>
        ` : ""}
        ${j.benefits ? `
          <div class="quick-view-section">
            <h3>Quyền lợi</h3>
            <div class="quick-view-text">${textToHtml(j.benefits)}</div>
          </div>
        ` : ""}
      </div>
      <div class="quick-view-footer">
        <a href="${escapeHtml(jobsDetailHref(j.id))}" class="btn btn-outline" target="_blank" rel="noopener">Xem trang đầy đủ</a>
        <button type="button" class="btn btn-primary" id="qv-apply-btn">Ứng tuyển ngay</button>
      </div>
    `;

    document.getElementById("qv-close-btn")?.addEventListener("click", close);
    document.getElementById("qv-apply-btn")?.addEventListener("click", () => {
      openApplyModal(j);
    });
  }

  function handleKeydown(e) {
    if (drawerEl.hidden) return;
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      stepJob(1);
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      stepJob(-1);
    }
  }

  function stepJob(direction) {
    if (!currentList.length || !currentJobId) return;
    const idx = currentList.findIndex((it) => it.id === currentJobId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < currentList.length) {
      open(currentList[nextIdx].id);
    }
  }

  window.addEventListener("keydown", handleKeydown);

  return {
    setList(list) { currentList = list; },
    openJob(jobId) { open(jobId); },
    closeJob() { close(); },
    checkInitialUrl() {
      const urlJob = new URLSearchParams(window.location.search).get("job");
      if (urlJob && window.innerWidth >= 1280) {
        open(Number(urlJob));
      }
    },
  };
}
