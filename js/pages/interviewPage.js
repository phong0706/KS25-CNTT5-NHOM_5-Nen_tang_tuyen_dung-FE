/**
 * interviewPage.js - Điều khiển Ngân hàng câu hỏi phỏng vấn IT (< 190 dòng).
 */
import { renderPagination } from "../components/pagination.js";
import { showStatusToast } from "../components/toast.js";

const state = { category_id: "", level_id: "", q: "", page: 1, practice_mode: false };
let catSelect = null, lvlSelect = null;
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

function syncUrl() {
  const p = new URLSearchParams();
  if (state.category_id) p.set("category_id", state.category_id);
  if (state.level_id) p.set("level_id", state.level_id);
  if (state.q) p.set("q", state.q);
  if (state.page > 1) p.set("page", String(state.page));
  if (state.practice_mode) p.set("practice", "1");
  const qs = p.toString();
  window.history.replaceState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function updateProgress(stats) {
  const { practiced_count = 0, total_count = 0, percentage = 0 } = stats || {};
  const t = document.getElementById("iq-progress-text"), f = document.getElementById("iq-progress-fill");
  if (t && f) {
    t.textContent = `Đã luyện ${practiced_count}/${total_count} câu hỏi (${percentage}%)`;
    f.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    document.getElementById("iq-progressbar-elem")?.setAttribute("aria-valuenow", String(percentage));
  }
  const note = document.getElementById("iq-auth-note");
  if (note) note.style.display = window.Auth?.isAuthenticated?.() ? "none" : "block";
}

async function loadQuestions() {
  const host = document.getElementById("iq-list-host"), meta = document.getElementById("iq-count-summary"), pag = document.getElementById("iq-pagination-host");
  if (!host) return;
  host.innerHTML = Array(3).fill('<div class="iq-card" style="padding:20px;"><div class="iq-skeleton" style="height:18px;width:30%;margin-bottom:10px;"></div><div class="iq-skeleton" style="height:22px;width:75%;margin-bottom:12px;"></div><div class="iq-skeleton" style="height:32px;"></div></div>').join("");

  try {
    const params = { page: state.page, page_size: 10 };
    if (state.category_id) params.category_id = Number(state.category_id);
    if (state.level_id) params.level_id = Number(state.level_id);
    if (state.q) params.q = state.q;

    const res = await window.api.get("/interview-questions", params);
    updateProgress(res.stats);
    if (meta) meta.textContent = `Tìm thấy ${res.total} câu hỏi phù hợp`;

    if (!res.items?.length) {
      host.innerHTML = `<div class="iq-empty-state"><div class="iq-state-title">Không tìm thấy câu hỏi nào</div><p class="iq-state-desc">Hãy thử đổi tiêu chí hoặc từ khóa.</p><button type="button" id="btn-empty-reset" class="btn btn-primary" style="height:38px;padding:0 16px;">Xóa bộ lọc</button></div>`;
      document.getElementById("btn-empty-reset")?.addEventListener("click", resetFilters);
      renderPagination(pag, { page: 1, totalPages: 0, total: 0 }, null);
      return;
    }

    host.innerHTML = res.items.map((q) => `
      <article class="iq-card" id="q-card-${q.id}" data-id="${q.id}">
        <div class="q-main-row">
          <div class="q-body-wrap">
            <div class="q-tags"><span class="q-tag-cat">${esc(q.category_name)}</span><span class="q-tag-lvl">${esc(q.level_name)}</span></div>
            <h3 class="q-title">${esc(q.question)}</h3>
          </div>
          <button type="button" class="q-practice-btn ${q.is_practiced ? "is-practiced" : ""}" data-id="${q.id}" aria-pressed="${Boolean(q.is_practiced)}">
            <span>${q.is_practiced ? "✓ Đã luyện" : "+ Đánh dấu đã luyện"}</span>
          </button>
        </div>
        <button type="button" class="q-accordion-btn" id="q-btn-${q.id}" aria-expanded="false" aria-controls="q-hint-${q.id}">
          <span class="q-btn-label">Xem gợi ý trả lời</span>
          <svg class="q-chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div id="q-hint-${q.id}" class="q-hint-panel" role="region" aria-labelledby="q-btn-${q.id}" aria-hidden="true" hidden>
          <div class="q-hint-title">💡 Gợi ý câu trả lời & Điểm mấu chốt</div>
          <p class="q-hint-text">${esc(q.answer_hint)}</p>
        </div>
      </article>`).join("");

    bindEvents(host);
    renderPagination(pag, { page: res.page, totalPages: res.total_pages, total: res.total }, (nextPage) => {
      state.page = nextPage; syncUrl(); loadQuestions(); window.scrollTo({ top: 300, behavior: "smooth" });
    });
  } catch (err) {
    host.innerHTML = `<div class="iq-error-state"><div class="iq-state-title">Lỗi tải dữ liệu</div><p class="iq-state-desc">${esc(err.message)}</p><button type="button" id="btn-retry-load" class="btn btn-primary" style="height:38px;padding:0 16px;">Thử lại</button></div>`;
    document.getElementById("btn-retry-load")?.addEventListener("click", loadQuestions);
  }
}

function bindEvents(host) {
  host.querySelectorAll(".q-accordion-btn").forEach((btn) => btn.addEventListener("click", () => {
    const exp = btn.getAttribute("aria-expanded") === "true", panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.setAttribute("aria-expanded", String(!exp));
    panel.hidden = exp; panel.setAttribute("aria-hidden", String(exp));
    btn.querySelector(".q-btn-label").textContent = exp ? "Xem gợi ý trả lời" : "Thu gọn gợi ý";
  }));

  host.querySelectorAll(".q-practice-btn").forEach((btn) => btn.addEventListener("click", async () => {
    if (!window.Auth?.isAuthenticated?.()) { showStatusToast("Vui lòng đăng nhập để lưu tiến độ luyện tập.", "warning"); return; }
    btn.disabled = true;
    try {
      const res = await window.api.post(`/interview-questions/${btn.dataset.id}/practice`, {});
      const p = Boolean(res.practiced);
      btn.classList.toggle("is-practiced", p); btn.setAttribute("aria-pressed", String(p));
      btn.querySelector("span").textContent = p ? "✓ Đã luyện" : "+ Đánh dấu đã luyện";
      updateProgress(res.stats);
      showStatusToast(p ? "Đã ghi nhận luyện tập!" : "Đã hủy đánh dấu luyện tập", "success");
    } catch (err) { showStatusToast(err.message || "Lỗi lưu tiến độ", "danger"); }
    finally { btn.disabled = false; }
  }));
}

function resetFilters() {
  state.category_id = ""; state.level_id = ""; state.q = ""; state.page = 1;
  catSelect?.setValue(""); lvlSelect?.setValue("");
  const inp = document.getElementById("filter-search-input");
  if (inp) inp.value = "";
  document.getElementById("btn-clear-search")?.style.setProperty("display", "none");
  syncUrl(); loadQuestions();
}

async function initPage() {
  const urlP = new URLSearchParams(window.location.search);
  state.category_id = urlP.get("category_id") || ""; state.level_id = urlP.get("level_id") || "";
  state.q = urlP.get("q") || ""; state.page = Math.max(1, parseInt(urlP.get("page") || "1", 10));
  state.practice_mode = urlP.get("practice") === "1";

  const searchInput = document.getElementById("filter-search-input"), clearBtn = document.getElementById("btn-clear-search");
  if (searchInput && state.q) { searchInput.value = state.q; clearBtn.style.display = "block"; }

  try {
    const [cats, lvls] = await Promise.all([window.api.get("/meta/categories"), window.api.get("/meta/levels")]);
    const catH = document.getElementById("filter-cat-host"), lvlH = document.getElementById("filter-lvl-host");
    if (catH && window.CustomSelect) {
      catSelect = new window.CustomSelect(catH, { options: [{ value: "", label: "Tất cả lĩnh vực" }, ...cats.map((c) => ({ value: String(c.id), label: c.name }))], value: state.category_id, placeholder: "Tất cả lĩnh vực" });
      catSelect.hiddenInput?.addEventListener("change", (e) => { state.category_id = e.target.value; state.page = 1; syncUrl(); loadQuestions(); });
    }
    if (lvlH && window.CustomSelect) {
      lvlSelect = new window.CustomSelect(lvlH, { options: [{ value: "", label: "Tất cả cấp bậc" }, ...lvls.map((l) => ({ value: String(l.id), label: l.name }))], value: state.level_id, placeholder: "Tất cả cấp bậc" });
      lvlSelect.hiddenInput?.addEventListener("change", (e) => { state.level_id = e.target.value; state.page = 1; syncUrl(); loadQuestions(); });
    }
  } catch {}

  let dTimer = null;
  searchInput?.addEventListener("input", () => {
    clearTimeout(dTimer); clearBtn.style.display = searchInput.value ? "block" : "none";
    dTimer = setTimeout(() => { state.q = searchInput.value.trim(); state.page = 1; syncUrl(); loadQuestions(); }, 300);
  });
  clearBtn?.addEventListener("click", () => { searchInput.value = ""; clearBtn.style.display = "none"; state.q = ""; state.page = 1; syncUrl(); loadQuestions(); });
  document.getElementById("btn-reset-filters")?.addEventListener("click", resetFilters);

  const modeBtn = document.getElementById("btn-toggle-practice-mode"), modeInd = document.getElementById("iq-mode-indicator");
  const applyMode = () => {
    modeBtn?.setAttribute("aria-pressed", String(state.practice_mode));
    document.getElementById("label-toggle-practice-mode").textContent = state.practice_mode ? "Tắt chế độ luyện tập" : "Bật chế độ luyện tập";
    if (modeInd) modeInd.style.display = state.practice_mode ? "inline-block" : "none";
    if (state.practice_mode) {
      document.querySelectorAll(".q-accordion-btn").forEach((b) => { b.setAttribute("aria-expanded", "false"); b.querySelector(".q-btn-label").textContent = "Xem gợi ý trả lời"; });
      document.querySelectorAll(".q-hint-panel").forEach((p) => { p.hidden = true; p.setAttribute("aria-hidden", "true"); });
    }
  };
  modeBtn?.addEventListener("click", () => {
    state.practice_mode = !state.practice_mode; applyMode(); syncUrl();
    showStatusToast(state.practice_mode ? "Đã bật chế độ luyện tập" : "Đã tắt chế độ luyện tập", "info");
  });
  if (state.practice_mode) applyMode();

  document.getElementById("btn-random-question")?.addEventListener("click", async () => {
    try {
      const p = {};
      if (state.category_id) p.category_id = Number(state.category_id);
      if (state.level_id) p.level_id = Number(state.level_id);
      if (state.q) p.q = state.q;
      const rnd = await window.api.get("/interview-questions/random", p);
      let card = document.getElementById(`q-card-${rnd.id}`);
      if (!card) {
        state.page = 1; state.q = rnd.question.substring(0, 20); syncUrl();
        await loadQuestions(); card = document.getElementById(`q-card-${rnd.id}`);
      }
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("is-highlighted");
        setTimeout(() => card.classList.remove("is-highlighted"), 3000);
        showStatusToast(`Ngẫu nhiên: ${rnd.question}`, "info");
      }
    } catch { showStatusToast("Không tìm thấy câu hỏi ngẫu nhiên phù hợp.", "warning"); }
  });

  loadQuestions();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initPage);
} else {
  initPage();
}
