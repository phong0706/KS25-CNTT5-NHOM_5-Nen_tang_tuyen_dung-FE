/**
 * salaryInsights.js - Trang Tra cứu mức lương IT (/pages/tools/salary.html)
 * URL State, CustomSelect từ API, SVG Range Plot, Gợi ý nới lỏng & Benchmark kinh nghiệm.
 * Giới hạn: < 200 dòng.
 */
import { renderSalaryRangeChart } from "../components/salaryChart.js";

let state = { category: "", level: "", location: "" };
let selectCat = null, selectLvl = null, selectLoc = null;
let fetchTimer = null, abortController = null;

function formatVND(val) {
  return Number(val || 0).toLocaleString("vi-VN") + " ₫";
}

function parseUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    category: p.get("category") || "",
    level: p.get("level") || "",
    location: p.get("location") || "",
  };
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.category) p.set("category", state.category);
  if (state.level) p.set("level", state.level);
  if (state.location) p.set("location", state.location);
  const q = p.toString();
  window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
}

async function loadSalaryInsights() {
  const resultHost = document.getElementById("salary-result-host");
  if (!resultHost) return;

  if (abortController) abortController.abort();
  abortController = new AbortController();

  resultHost.innerHTML = `
    <div style="padding:48px 20px; text-align:center; color:var(--text-tertiary);">
      <div class="skeleton-box" style="width:180px; height:24px; margin:0 auto 12px; border-radius:6px; background:#E2E8F0;"></div>
      <div class="skeleton-box" style="width:240px; height:48px; margin:0 auto 16px; border-radius:8px; background:#E2E8F0;"></div>
      <div class="skeleton-box" style="width:100%; height:120px; border-radius:12px; background:#E2E8F0;"></div>
    </div>
  `;

  try {
    const params = {
      category: state.category || undefined,
      level: state.level || undefined,
      location: state.location || undefined,
    };
    const data = await window.api.get("/salary/insights", params, { signal: abortController.signal });
    renderResult(resultHost, data);
  } catch (err) {
    if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
    resultHost.innerHTML = `
      <div class="salary-insufficient-box" style="background:#FEF2F2; border-color:#FECACA;">
        <h3 class="salary-insufficient-title" style="color:#B91C1C;">Không thể tải dữ liệu lương</h3>
        <p class="salary-insufficient-desc" style="color:#7F1D1D;">${err?.message || "Lỗi kết nối máy chủ."}</p>
        <button type="button" class="btn btn-primary btn-sm" id="btn-salary-retry">Thử lại</button>
      </div>
    `;
    document.getElementById("btn-salary-retry")?.addEventListener("click", loadSalaryInsights);
  }
}

function renderResult(hostEl, d) {
  if (!d.is_sufficient) {
    hostEl.innerHTML = `
      <div class="salary-insufficient-box">
        <h3 class="salary-insufficient-title">Chưa đủ dữ liệu để thống kê</h3>
        <p class="salary-insufficient-desc">Hiện chỉ tìm thấy <strong>${d.sample_size}</strong> tin tuyển dụng phù hợp (cần tối thiểu 5 tin để ước lượng phân vị).</p>
        ${d.suggestions?.length ? `
          <div class="salary-suggest-list">
            <span style="font-size:12.5px; font-weight:600; color:#92400E;">Gợi ý mở rộng bộ lọc:</span>
            ${d.suggestions.map((s) => `<button type="button" class="salary-suggest-btn" data-remove="${s.remove_param}"><span>💡 ${s.message}</span></button>`).join("")}
          </div>
        ` : ""}
      </div>
    `;

    hostEl.querySelectorAll(".salary-suggest-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const param = btn.dataset.remove;
        if (param === "location") { state.location = ""; selectLoc?.setValue(""); }
        else if (param === "level") { state.level = ""; selectLvl?.setValue(""); }
        else if (param === "level_and_location") { state.location = ""; state.level = ""; selectLoc?.setValue(""); selectLvl?.setValue(""); }
        triggerDebouncedFetch();
      });
    });
    return;
  }

  const titlePart = [d.category_name, d.level_name, d.location_name].filter(Boolean).join(" · ") || "Toàn thị trường IT";

  const benchHtml = d.level_benchmarks?.length ? `
    <div style="margin-top:20px; padding:12px 14px; background:var(--bg-alt),#F8FAFC); border:1px solid var(--border-default); border-radius:10px;">
      <div style="font-size:12.5px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; margin-bottom:8px;">Tham khảo theo cấp bậc & kinh nghiệm</div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${d.level_benchmarks.map((b) => `
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:13px;">
            <span><strong>${b.level_name}</strong> <span style="color:var(--text-tertiary);">(${b.exp_range})</span></span>
            <span style="font-weight:700; color:var(--primary-700); font-variant-numeric:tabular-nums;">${formatVND(b.median_salary)}/tháng</span>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";

  hostEl.innerHTML = `
    <div class="salary-hero-box">
      <div class="salary-hero-label">Mức lương trung vị (${titlePart})</div>
      <div class="salary-hero-val">${formatVND(d.median)}<span style="font-size:16px; font-weight:500; color:var(--text-tertiary);">/tháng</span></div>
      <div class="salary-hero-sub">
        <span>Khoảng phổ biến:</span>
        <span class="salary-stat-pill">${formatVND(d.p25)} – ${formatVND(d.p75)}</span>
        <span>• Dựa trên ${d.sample_size} tin</span>
      </div>
    </div>

    <div id="salary-chart-mount"></div>

    <div class="salary-tiles-grid">
      <div class="salary-tile"><div class="salary-tile-name">Thấp nhất (Min)</div><div class="salary-tile-num">${formatVND(d.min)}</div></div>
      <div class="salary-tile"><div class="salary-tile-name">Phân vị 25% (P25)</div><div class="salary-tile-num">${formatVND(d.p25)}</div></div>
      <div class="salary-tile is-median"><div class="salary-tile-name">Trung vị (50%)</div><div class="salary-tile-num">${formatVND(d.median)}</div></div>
      <div class="salary-tile"><div class="salary-tile-name">Phân vị 75% (P75)</div><div class="salary-tile-num">${formatVND(d.p75)}</div></div>
      <div class="salary-tile"><div class="salary-tile-name">Cao nhất (Max)</div><div class="salary-tile-num">${formatVND(d.max)}</div></div>
    </div>

    ${benchHtml}

    <div class="salary-notes-block">
      <p>📊 <strong>Nguồn:</strong> Từ ${d.sample_size} tin tuyển dụng trên TechRecruit, cập nhật ${d.updated_at}.</p>
      <p>📐 <strong>Phương pháp:</strong> Chuẩn hóa theo VNĐ/tháng (tỷ giá 25.400 nếu có tin USD), tự động loại trừ ngoại lai (1.5 IQR: đã lọc ${d.outliers_removed} tin). Kết quả mang tính tham khảo.</p>
    </div>
  `;

  renderSalaryRangeChart(document.getElementById("salary-chart-mount"), {
    min: d.min, p25: d.p25, median: d.median, p75: d.p75, max: d.max,
  });
}

function triggerDebouncedFetch() {
  syncUrl();
  window.clearTimeout(fetchTimer);
  fetchTimer = window.setTimeout(loadSalaryInsights, 150);
}

async function init() {
  state = parseUrlParams();

  try {
    const [cats, lvls, locs] = await Promise.all([
      window.api.get("/meta/categories"),
      window.api.get("/meta/levels"),
      window.api.get("/meta/locations"),
    ]);

    const catOpts = [{ value: "", label: "Tất cả lĩnh vực" }, ...cats.map((c) => ({ value: c.slug, label: c.name }))];
    const lvlOpts = [{ value: "", label: "Tất cả cấp bậc" }, ...lvls.map((l) => ({ value: l.slug, label: l.name }))];
    const locOpts = [{ value: "", label: "Tất cả địa điểm" }, ...locs.map((l) => ({ value: l.slug, label: l.name }))];

    const hostCat = document.getElementById("select-cat-host");
    const hostLvl = document.getElementById("select-lvl-host");
    const hostLoc = document.getElementById("select-loc-host");

    if (window.CustomSelect) {
      if (hostCat) selectCat = new window.CustomSelect(hostCat, { id: "sal-cat", placeholder: "Tất cả lĩnh vực", options: catOpts, value: state.category, onChange: (v) => { state.category = v; triggerDebouncedFetch(); } });
      if (hostLvl) selectLvl = new window.CustomSelect(hostLvl, { id: "sal-lvl", placeholder: "Tất cả cấp bậc", options: lvlOpts, value: state.level, onChange: (v) => { state.level = v; triggerDebouncedFetch(); } });
      if (hostLoc) selectLoc = new window.CustomSelect(hostLoc, { id: "sal-loc", placeholder: "Tất cả địa điểm", options: locOpts, value: state.location, onChange: (v) => { state.location = v; triggerDebouncedFetch(); } });
    }

    document.getElementById("btn-reset-filters")?.addEventListener("click", () => {
      selectCat?.setValue("");
      selectLvl?.setValue("");
      selectLoc?.setValue("");
      state = { category: "", level: "", location: "" };
      triggerDebouncedFetch();
    });

    loadSalaryInsights();
  } catch {
    document.getElementById("salary-result-host").innerHTML = `<p style="color:var(--danger-600);">Lỗi nạp danh mục.</p>`;
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
