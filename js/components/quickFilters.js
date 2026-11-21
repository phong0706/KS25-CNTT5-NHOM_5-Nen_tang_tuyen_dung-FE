/**
 * Component Chip lọc nhanh, Nới lỏng kết quả, và Lưu tìm kiếm
 */
import { showStatusToast } from "./toast.js";

export function initQuickFilters({ hostEl, relaxedEl, saveBtnEl, loginBannerEl, onFilterChange }) {
  let quickList = [];

  async function loadChips(currentState) {
    if (!hostEl) return;
    try {
      if (!quickList.length) {
        quickList = await window.api.get("/meta/quick-filters");
      }
      hostEl.innerHTML = quickList.map((chip) => {
        let active = false;
        if (chip.id === "remote" && currentState.type === "remote") active = true;
        if (chip.id === "hybrid" && currentState.type === "hybrid") active = true;
        if (chip.id === "salary_30" && Number(currentState.salary_min) >= 30000000) active = true;
        if (chip.id === "senior" && currentState.level === "senior") active = true;
        if (chip.id === "fresher" && currentState.level === "fresher") active = true;

        return `
          <button type="button" class="quick-chip-btn ${active ? "is-active" : ""}" data-id="${chip.id}">
            ${chip.label}
          </button>
        `;
      }).join("");

      hostEl.querySelectorAll(".quick-chip-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const chip = quickList.find((c) => c.id === id);
          if (!chip) return;
          const isActive = btn.classList.contains("is-active");
          const patch = {};
          Object.keys(chip.params).forEach((k) => {
            patch[k] = isActive ? "" : String(chip.params[k]);
          });
          onFilterChange?.(patch);
        });
      });
    } catch {
      // Bỏ qua nếu lỗi mạng
    }
  }

  async function checkRelaxed(currentState, total) {
    if (!relaxedEl) return;
    if (total > 4) {
      relaxedEl.innerHTML = "";
      relaxedEl.style.display = "none";
      return;
    }
    const hasFilters = Boolean(
      currentState.q || currentState.company || currentState.location || currentState.category ||
      currentState.level || currentState.type || currentState.salary_min
    );
    if (!hasFilters) {
      relaxedEl.innerHTML = "";
      relaxedEl.style.display = "none";
      return;
    }

    try {
      const res = await window.api.get("/jobs/relaxed", {
        q: currentState.q || undefined,
        company: currentState.company || undefined,
        location: currentState.location || undefined,
        category: currentState.category || undefined,
        level: currentState.level || undefined,
        type: currentState.type || undefined,
        salary_min: currentState.salary_min || undefined,
      });

      if (res?.suggestions?.length) {
        relaxedEl.style.display = "block";
        relaxedEl.innerHTML = res.suggestions.map((sug) => `
          <div class="relaxed-tip-bar" style="background:var(--primary-50); border:1px solid var(--primary-200); border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:13.5px; color:var(--primary-900); margin-bottom:12px;">
            <span>💡 <strong>Gợi ý mở rộng:</strong> ${sug.message}</span>
            <button type="button" class="btn btn-sm btn-outline relaxed-action-btn" data-remove="${sug.remove_param}" style="border-color:var(--primary-600); color:var(--primary-700); font-size:12px; padding:3px 10px; border-radius:6px; white-space:nowrap;">
              Bỏ lọc này
            </button>
          </div>
        `).join("");

        relaxedEl.querySelectorAll(".relaxed-action-btn").forEach((b) => {
          b.addEventListener("click", () => {
            const param = b.dataset.remove;
            if (param === "salary") onFilterChange?.({ salary_min: "", salary_max: "" });
            else onFilterChange?.({ [param]: "" });
          });
        });
      } else {
        relaxedEl.innerHTML = "";
        relaxedEl.style.display = "none";
      }
    } catch {
      relaxedEl.style.display = "none";
    }
  }

  function syncLoginBanner() {
    if (!loginBannerEl) return;
    // Lưu ý: object Auth được export ra `window.Auth` (viết hoài A) trong js/auth.js.
    // Bản cũ dùng `window.auth` (chữ thường) -> luôn undefined -> mọi người bị coi là khách.
    const role = window.Auth?.getRole?.();
    const isCandidate = Boolean(window.Auth?.isAuthenticated?.()) && role === "candidate";
    loginBannerEl.style.display = isCandidate ? "none" : "block";
  }

  if (saveBtnEl) {
    saveBtnEl.addEventListener("click", async () => {
      if (!window.Auth?.isAuthenticated?.()) {
        showStatusToast("Vui lòng đăng nhập ứng viên để lưu tìm kiếm!", "warning");
        // Đường dẫn đúng: pages/login.html (bản cũ dùng "./auth/login.html" -> 404).
        const root = document.body?.dataset?.root
          ? (document.body.dataset.root.endsWith("/") ? document.body.dataset.root : document.body.dataset.root + "/")
          : "../";
        setTimeout(() => {
          window.location.href = `${root}pages/login.html?redirect=` + encodeURIComponent(window.location.pathname + window.location.search);
        }, 1500);
        return;
      }
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const name = queryParams.get("q")
          ? `Tìm kiếm "${queryParams.get("q")}"`
          : "Bộ lọc việc làm " + new Date().toLocaleDateString("vi-VN");
        // API mong nhận `filters` (object), không phải `filters_json` (string).
        await window.api.post("/candidate/saved-searches", {
          name,
          filters: Object.fromEntries(queryParams.entries()),
        });
        showStatusToast("Đã lưu tiêu chí tìm kiếm này thành công!", "success");
      } catch (err) {
        showStatusToast(err?.message || "Không thể lưu tìm kiếm.", "error");
      }
    });
  }

  return {
    sync(currentState, total) {
      loadChips(currentState);
      checkRelaxed(currentState, total);
      syncLoginBanner();
    },
  };
}
