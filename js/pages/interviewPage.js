/**
 * interviewPage.js - Điều khiển Ngân hàng câu hỏi phỏng vấn IT (< 200 dòng).
 */
import { renderPagination } from "../components/pagination.js";
import { loginUrl } from "../routes.js";
import { renderQuestionCard, bindQuestionCardEvents } from "../components/questionCard.js";
import { showStatusToast } from "../components/toast.js";

const state = { category_id: "", level_id: "", q: "", page: 1, practice_mode: false };
let catSelect = null, lvlSelect = null, catMap = {}, lvlMap = {};
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

function syncUrl() {
  const p = new URLSearchParams();
  if (state.category_id) p.set("category_id", state.category_id); if (state.level_id) p.set("level_id", state.level_id);
  if (state.q) p.set("q", state.q); if (state.page > 1) p.set("page", String(state.page)); if (state.practice_mode) p.set("practice", "1");
  const qs = p.toString();
  window.history.replaceState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

function getViewerRole() {
  const r = String(window.Auth?.getRole?.() || "").toLowerCase().trim();
  return r;
}

function isCandidateViewer() {
  return Boolean(window.Auth?.isAuthenticated?.()) && getViewerRole() === "candidate";
}

function isReadOnlyRole() {
  const r = getViewerRole();
  return Boolean(window.Auth?.isAuthenticated?.()) && (r === "employer" || r === "recruiter" || r === "admin" || r === "operator");
}

function updateProgress(stats) {
  const isAuth = Boolean(window.Auth?.isAuthenticated?.());
  const showCandProgress = isCandidateViewer();
  const showGuestBox = !isAuth;
  document.getElementById("iq-prog-auth-box")?.style.setProperty("display", showCandProgress ? "block" : "none");
  document.getElementById("iq-prog-guest-box")?.style.setProperty("display", showGuestBox ? "block" : "none");
  document.getElementById("iq-mobile-progress")?.style.setProperty("display", showCandProgress ? "block" : "none");
  if (!showCandProgress) return;

  const { practiced_count = 0, total_count = 0, percentage = 0 } = stats || {};
  const pct = Math.min(100, Math.max(0, percentage));
  const cBar = document.getElementById("iq-circle-bar"), cPct = document.getElementById("iq-circle-percent"), statT = document.getElementById("iq-prog-stat-text");
  if (cPct) cPct.textContent = `${pct}%`;
  if (statT) statT.textContent = `Đã luyện ${practiced_count}/${total_count} câu`;
  if (cBar) cBar.style.strokeDashoffset = String(251.2 - (251.2 * pct / 100));

  const mobVal = document.getElementById("iq-mob-prog-val"), mobFill = document.getElementById("iq-mob-prog-fill");
  if (mobVal) mobVal.textContent = `${practiced_count}/${total_count} (${pct}%)`;
  if (mobFill) mobFill.style.width = `${pct}%`;
}

function renderActiveChips() {
  const wrap = document.getElementById("iq-active-chips"), list = document.getElementById("iq-chips-list"), badge = document.getElementById("iq-filter-drawer-badge");
  if (!wrap || !list) return;
  const chips = [];
  if (state.category_id) chips.push({ t: "cat", l: `Lĩnh vực: ${catMap[state.category_id] || ""}` });
  if (state.level_id) chips.push({ t: "lvl", l: `Cấp bậc: ${lvlMap[state.level_id] || ""}` });
  if (state.q) chips.push({ t: "q", l: `"${state.q}"` });

  if (badge) badge.textContent = chips.length ? `Bộ lọc (${chips.length})` : "Bộ lọc";
  if (!chips.length) { wrap.style.display = "none"; list.innerHTML = ""; return; }
  wrap.style.display = "flex";
  list.innerHTML = chips.map((c) => `<span class="iq-chip-item"><span>${esc(c.l)}</span><button type="button" class="iq-chip-del" data-chip="${c.t}" aria-label="Xóa lọc">✕</button></span>`).join("");
  list.querySelectorAll(".iq-chip-del").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.chip === "cat") { state.category_id = ""; catSelect?.setValue(""); }
    else if (b.dataset.chip === "lvl") { state.level_id = ""; lvlSelect?.setValue(""); }
    else { state.q = ""; const i = document.getElementById("filter-search-input"); if (i) i.value = ""; document.getElementById("btn-clear-search")?.style.setProperty("display", "none"); }
    state.page = 1; syncUrl(); renderActiveChips(); loadQuestions();
  }));
}

async function handleTogglePractice(qId, btn) {
  if (!window.Auth?.isAuthenticated?.()) {
    showStatusToast("Vui lòng đăng nhập để lưu tiến độ luyện tập.", "warning");
    window.location.href = loginUrl(window.location.pathname + window.location.search);
    return;
  }
  const card = document.getElementById(`q-card-${qId}`), cur = btn.classList.contains("is-practiced"), next = !cur;
  const setPrac = (p) => {
    btn.classList.toggle("is-practiced", p); btn.setAttribute("aria-pressed", String(p));
    const l = btn.querySelector(".q-toggle-label"); if (l) l.textContent = p ? "Đã luyện" : "";
    if (card) card.classList.toggle("is-practiced", p);
  };
  setPrac(next);

  try {
    const res = await window.api.post(`/interview-questions/${qId}/practice`, {});
    setPrac(Boolean(res.practiced)); updateProgress(res.stats);
    showStatusToast(res.practiced ? "Đã ghi nhận luyện tập!" : "Đã hủy đánh dấu luyện tập", "success");
  } catch (err) {
    setPrac(cur);
    const msg = err?.status === 403
      ? (err.message || "Chỉ tài khoản Ứng viên mới có thể đánh dấu luyện tập.")
      : (err?.message || "Lỗi lưu tiến độ");
    showStatusToast(msg, "danger");
  }
}

async function loadQuestions() {
  const host = document.getElementById("iq-list-host"), meta = document.getElementById("iq-count-summary"), pag = document.getElementById("iq-pagination-host");
  if (!host) return;
  host.innerHTML = Array(3).fill('<div class="q-card" style="padding:16px;"><div class="iq-skeleton" style="height:18px;width:30%;margin-bottom:12px;"></div><div class="iq-skeleton" style="height:22px;width:80%;"></div></div>').join("");

  try {
    const params = { page: state.page, page_size: 10 };
    if (state.category_id) params.category_id = Number(state.category_id);
    if (state.level_id) params.level_id = Number(state.level_id);
    if (state.q) params.q = state.q;

    const res = await window.api.get("/interview-questions", params);
    updateProgress(res.stats);
    renderActiveChips();
    if (meta) meta.textContent = `Hiển thị ${(res.page - 1) * 10 + 1}–${Math.min(res.page * 10, res.total)} trong ${res.total} câu hỏi`;

    if (!res.items?.length) {
      host.innerHTML = `<div class="iq-empty-state"><div class="iq-state-title">Không tìm thấy câu hỏi nào</div><p class="iq-state-desc">Hãy thử đổi tiêu chí hoặc từ khóa.</p><button type="button" id="btn-empty-reset" class="btn btn-primary" style="height:38px;padding:0 16px;">Xóa bộ lọc</button></div>`;
      document.getElementById("btn-empty-reset")?.addEventListener("click", resetFilters);
      renderPagination(pag, { page: 1, totalPages: 0, total: 0 }, null);
      return;
    }

    const showPracticeBtn = !isReadOnlyRole();
    host.innerHTML = res.items.map((item) => renderQuestionCard(item, { showPracticeBtn })).join("");
    bindQuestionCardEvents(host, { onTogglePractice: handleTogglePractice });

    renderPagination(pag, { page: res.page, totalPages: res.total_pages, total: res.total, pageSize: 10, entityName: "câu hỏi", summaryEl: meta }, (nextPage) => {
      state.page = nextPage; syncUrl(); loadQuestions();
      const listTop = document.getElementById("iq-results-heading") || document.getElementById("iq-list-host");
      if (listTop) { listTop.scrollIntoView({ behavior: "smooth", block: "start" }); listTop.focus?.(); }
    });
  } catch (err) {
    host.innerHTML = `<div class="iq-error-state"><div class="iq-state-title">Lỗi tải dữ liệu</div><p class="iq-state-desc">${esc(err.message)}</p><button type="button" id="btn-retry-load" class="btn btn-primary" style="height:38px;padding:0 16px;">Thử lại</button></div>`;
    document.getElementById("btn-retry-load")?.addEventListener("click", loadQuestions);
  }
}

function resetFilters() {
  state.category_id = ""; state.level_id = ""; state.q = ""; state.page = 1;
  catSelect?.setValue(""); lvlSelect?.setValue("");
  const inp = document.getElementById("filter-search-input");
  if (inp) inp.value = "";
  document.getElementById("btn-clear-search")?.style.setProperty("display", "none");
  syncUrl(); renderActiveChips(); loadQuestions();
}

async function initPage() {
  const urlP = new URLSearchParams(window.location.search);
  state.category_id = urlP.get("category_id") || ""; state.level_id = urlP.get("level_id") || "";
  state.q = urlP.get("q") || ""; state.page = Math.max(1, parseInt(urlP.get("page") || "1", 10));
  state.practice_mode = urlP.get("practice") === "1";

  const searchInput = document.getElementById("filter-search-input"), clearBtn = document.getElementById("btn-clear-search");
  if (searchInput && state.q) { searchInput.value = state.q; clearBtn.style.display = "block"; }

  // Drawer mobile gắn ngay tức thì
  const sidebar = document.getElementById("iq-sidebar-col"), closeDrawer = () => sidebar?.classList.remove("is-drawer-open");
  document.getElementById("btn-open-filter-drawer")?.addEventListener("click", () => sidebar?.classList.add("is-drawer-open"));
  ["iq-drawer-close", "iq-drawer-overlay", "iq-drawer-apply"].forEach((id) => document.getElementById(id)?.addEventListener("click", closeDrawer));

  let dTimer = null;
  searchInput?.addEventListener("input", () => {
    clearTimeout(dTimer); clearBtn.style.display = searchInput.value ? "block" : "none";
    dTimer = setTimeout(() => { state.q = searchInput.value.trim(); state.page = 1; syncUrl(); renderActiveChips(); loadQuestions(); }, 300);
  });
  clearBtn?.addEventListener("click", () => { searchInput.value = ""; clearBtn.style.display = "none"; state.q = ""; state.page = 1; syncUrl(); renderActiveChips(); loadQuestions(); });
  document.getElementById("btn-reset-filters")?.addEventListener("click", resetFilters);
  document.getElementById("btn-clear-all-chips")?.addEventListener("click", resetFilters);

  try {
    const [cats, lvls] = await Promise.all([window.api.get("/meta/categories"), window.api.get("/meta/levels")]);
    cats.forEach((c) => { catMap[c.id] = c.name; });
    lvls.forEach((l) => { lvlMap[l.id] = l.name; });
    const catH = document.getElementById("filter-cat-host"), lvlH = document.getElementById("filter-lvl-host");
    if (catH && window.CustomSelect) {
      catSelect = new window.CustomSelect(catH, { options: [{ value: "", label: "Tất cả lĩnh vực" }, ...cats.map((c) => ({ value: String(c.id), label: c.name }))], value: state.category_id, placeholder: "Tất cả lĩnh vực" });
      catSelect.hiddenInput?.addEventListener("change", (e) => { state.category_id = e.target.value; state.page = 1; syncUrl(); renderActiveChips(); loadQuestions(); });
    }
    if (lvlH && window.CustomSelect) {
      lvlSelect = new window.CustomSelect(lvlH, { options: [{ value: "", label: "Tất cả cấp bậc" }, ...lvls.map((l) => ({ value: String(l.id), label: l.name }))], value: state.level_id, placeholder: "Tất cả cấp bậc" });
      lvlSelect.hiddenInput?.addEventListener("change", (e) => { state.level_id = e.target.value; state.page = 1; syncUrl(); renderActiveChips(); loadQuestions(); });
    }
  } catch {}

  const modeBtn = document.getElementById("btn-toggle-practice-mode"), modeInd = document.getElementById("iq-mode-indicator");
  const applyMode = () => {
    modeBtn?.setAttribute("aria-pressed", String(state.practice_mode));
    document.getElementById("label-toggle-practice-mode").textContent = state.practice_mode ? "Tắt chế độ luyện tập" : "Bật chế độ luyện tập";
    if (modeInd) modeInd.style.display = state.practice_mode ? "inline-block" : "none";
    if (state.practice_mode) {
      document.querySelectorAll(".q-title-btn").forEach((b) => b.setAttribute("aria-expanded", "false"));
      document.querySelectorAll(".q-hint-collapse").forEach((p) => { p.classList.remove("is-open"); p.setAttribute("aria-hidden", "true"); });
    }
  };
  modeBtn?.addEventListener("click", () => {
    state.practice_mode = !state.practice_mode; applyMode(); syncUrl();
    showStatusToast(state.practice_mode ? "Đã bật chế độ luyện tập" : "Đã tắt chế độ luyện tập", "info");
  });
  if (state.practice_mode) applyMode();

  document.getElementById("btn-random-question")?.addEventListener("click", async () => {
    try {
      const p = {}; if (state.category_id) p.category_id = Number(state.category_id);
      if (state.level_id) p.level_id = Number(state.level_id); if (state.q) p.q = state.q;
      const rnd = await window.api.get("/interview-questions/random", p);
      let card = document.getElementById(`q-card-${rnd.id}`);
      if (!card) { state.page = 1; state.q = rnd.question.substring(0, 20); syncUrl(); await loadQuestions(); card = document.getElementById(`q-card-${rnd.id}`); }
      if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); card.classList.add("is-highlighted"); setTimeout(() => card.classList.remove("is-highlighted"), 3000); showStatusToast(`Ngẫu nhiên: ${rnd.question}`, "info"); }
    } catch { showStatusToast("Không tìm thấy câu hỏi ngẫu nhiên phù hợp.", "warning"); }
  });

  loadQuestions();
}

if (document.readyState === "loading") { window.addEventListener("DOMContentLoaded", initPage); } else { initPage(); }
