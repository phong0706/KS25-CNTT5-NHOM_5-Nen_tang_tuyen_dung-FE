/**
 * adminHomeSettings.js - Quản lý cấu hình hiển thị Trang chủ.
 * Vanilla JS ES modules. Tuân thủ techrecruit-rules: <= 195 dòng.
 */
import { showStatusToast } from "../components/toast.js";
import { esc, renderSkills, renderComps, renderAudit } from "./adminHomeSettingsView.js";

let state = { sSalary: null, sComps: [], lSalary: null, lComps: [], activeTab: "config" };

function calcDirty() {
  if (!state.sSalary || !state.lSalary) return 0;
  let d = 0;
  if (state.lSalary.min_sample !== state.sSalary.min_sample) d++;
  if (state.lSalary.max_items !== state.sSalary.max_items) d++;
  state.lSalary.skills.forEach((sk) => {
    const orig = state.sSalary.skills.find((s) => s.skill_id === sk.skill_id);
    if (!orig || orig.mode !== sk.mode || orig.position !== sk.position) d++;
  });
  state.lComps.forEach((c) => {
    const orig = state.sComps.find((o) => o.company_id === c.company_id);
    if (!orig || orig.position !== c.position) d++;
  });
  const bar = document.getElementById("hs-save-bar");
  const cnt = document.getElementById("hs-dirty-count");
  if (cnt) cnt.textContent = d;
  if (bar) bar.classList.toggle("visible", d > 0);
  return d;
}

window.addEventListener("beforeunload", (e) => {
  if (calcDirty() > 0) { e.preventDefault(); e.returnValue = ""; }
});

async function loadAudit() {
  const tbody = document.getElementById("hs-audit-tbody");
  const sec = document.getElementById("hs-audit-section-filter")?.value || "all";
  if (!tbody) return;
  try {
    const res = await window.api.get(`/admin/home/audit?section=${sec}`);
    renderAudit(tbody, res.items || []);
  } catch (err) { tbody.innerHTML = `<tr><td colspan="5" style="color:red;padding:16px;">Lỗi tải: ${esc(err.message)}</td></tr>`; }
}

async function loadAll() {
  document.getElementById("hs-conflict-banner").style.display = "none";
  try {
    const [sal, comps] = await Promise.all([
      window.api.get("/admin/home/salary-settings"),
      window.api.get("/admin/home/featured-companies"),
    ]);
    state.sSalary = sal; state.lSalary = JSON.parse(JSON.stringify(sal));
    state.sComps = comps.companies || []; state.lComps = JSON.parse(JSON.stringify(state.sComps));
    const minIn = document.getElementById("hs-min-sample");
    const maxIn = document.getElementById("hs-max-items");
    if (minIn) minIn.value = sal.min_sample;
    if (maxIn) maxIn.value = sal.max_items;
    renderSkills(document.getElementById("hs-skills-tbody"), state.lSalary.skills);
    renderComps(document.getElementById("hs-companies-tbody"), state.lComps);
    calcDirty();
  } catch (err) { showStatusToast(err.message || "Lỗi tải cấu hình", "error"); }
}

function reorder(list, i, j) {
  const [m] = list.splice(i, 1);
  list.splice(j, 0, m);
  list.forEach((item, idx) => { if (item.mode === "pinned" || item.position) item.position = idx + 1; });
}

function bindEvents() {
  document.getElementById("hs-min-sample")?.addEventListener("input", (e) => {
    state.lSalary.min_sample = Math.max(1, parseInt(e.target.value) || 1);
    calcDirty();
  });
  document.getElementById("hs-max-items")?.addEventListener("input", (e) => {
    state.lSalary.max_items = Math.max(1, Math.min(12, parseInt(e.target.value) || 6));
    calcDirty();
  });

  document.getElementById("hs-skills-tbody")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "mode") {
      const sk = state.lSalary.skills.find((s) => s.skill_id === Number(btn.dataset.id));
      if (sk) { sk.mode = btn.dataset.val; if (sk.mode === "pinned" && !sk.position) sk.position = 1; renderSkills(document.getElementById("hs-skills-tbody"), state.lSalary.skills); calcDirty(); }
    } else if (act === "up" || act === "down") {
      const idx = Number(btn.dataset.idx);
      const target = act === "up" ? idx - 1 : idx + 1;
      if (target >= 0 && target < state.lSalary.skills.length) { reorder(state.lSalary.skills, idx, target); renderSkills(document.getElementById("hs-skills-tbody"), state.lSalary.skills); calcDirty(); }
    }
  });

  document.getElementById("hs-companies-tbody")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "comp-pin") {
      const comp = state.lComps.find((c) => c.company_id === Number(btn.dataset.id));
      if (comp) { comp.position = comp.position ? null : 1; renderComps(document.getElementById("hs-companies-tbody"), state.lComps); calcDirty(); }
    } else if (act === "comp-up" || act === "comp-down") {
      const idx = Number(btn.dataset.idx);
      const target = act === "comp-up" ? idx - 1 : idx + 1;
      if (target >= 0 && target < state.lComps.length) { reorder(state.lComps, idx, target); renderComps(document.getElementById("hs-companies-tbody"), state.lComps); calcDirty(); }
    }
  });

  document.getElementById("tab-btn-config")?.addEventListener("click", () => {
    document.getElementById("tab-btn-config").classList.add("active");
    document.getElementById("tab-btn-audit").classList.remove("active");
    document.getElementById("tab-panel-config").style.display = "";
    document.getElementById("tab-panel-audit").style.display = "none";
  });
  document.getElementById("tab-btn-audit")?.addEventListener("click", () => {
    document.getElementById("tab-btn-audit").classList.add("active");
    document.getElementById("tab-btn-config").classList.remove("active");
    document.getElementById("tab-panel-config").style.display = "none";
    document.getElementById("tab-panel-audit").style.display = "";
    loadAudit();
  });
  document.getElementById("hs-audit-section-filter")?.addEventListener("change", loadAudit);

  document.getElementById("hs-cancel-btn")?.addEventListener("click", () => loadAll());
  document.getElementById("hs-reload-btn")?.addEventListener("click", () => loadAll());

  const modal = document.getElementById("hs-reason-modal");
  const rInput = document.getElementById("hs-reason-input");
  const rCounter = document.getElementById("hs-reason-counter");
  const submitBtn = document.getElementById("hs-modal-submit-btn");

  document.getElementById("hs-save-btn")?.addEventListener("click", () => {
    if (state.lSalary.min_sample < 1) { showStatusToast("Ngưỡng tin tối thiểu phải >= 1", "error"); return; }
    if (rInput) rInput.value = "";
    if (rCounter) rCounter.textContent = "0 / 10 ký tự tối thiểu";
    if (submitBtn) submitBtn.disabled = true;
    modal.classList.add("open");
    rInput?.focus();
  });

  const closeModal = () => modal?.classList.remove("open");
  document.getElementById("hs-modal-close-x")?.addEventListener("click", closeModal);
  document.getElementById("hs-modal-cancel-btn")?.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal?.classList.contains("open")) closeModal(); });

  rInput?.addEventListener("input", () => {
    const len = rInput.value.trim().length;
    if (rCounter) rCounter.textContent = `${len} / 10 ký tự tối thiểu`;
    if (submitBtn) submitBtn.disabled = len < 10;
  });

  submitBtn?.addEventListener("click", async () => {
    const reason = rInput.value.trim();
    if (reason.length < 10) return;
    submitBtn.disabled = true;
    try {
      await window.api.put("/admin/home/salary-settings", {
        version: state.sSalary.version, min_sample: state.lSalary.min_sample, max_items: state.lSalary.max_items, reason,
      });
      const overrides = state.lSalary.skills.map((sk, idx) => ({
        skill_id: sk.skill_id, skill_name: sk.skill_name, mode: sk.mode, position: sk.mode === "pinned" ? (idx + 1) : null,
      }));
      await window.api.put("/admin/home/skill-overrides", {
        version: state.sSalary.version + 1, reason, overrides,
      });
      const pinnedComps = state.lComps.filter((c) => c.position != null).map((c, i) => ({ company_id: c.company_id, position: i + 1 }));
      await window.api.put("/admin/home/featured-companies", {
        version: state.sSalary.version + 1, reason, companies: pinnedComps,
      });

      closeModal();
      showStatusToast("Lưu cấu hình trang chủ thành công!", "success");
      await loadAll();
    } catch (err) {
      if (err.status === 409 || (err.response && err.response.status === 409)) {
        closeModal();
        document.getElementById("hs-conflict-banner").style.display = "flex";
        showStatusToast("Xung đột phiên bản: Cấu hình đã được người khác thay đổi.", "error");
      } else {
        showStatusToast(err.message || "Lỗi lưu cấu hình", "error");
      }
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function init() { bindEvents(); loadAll(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
