/**
 * taxPage.js - Điều khiển trang tính Thuế Thu Nhập Cá Nhân (TNCN) chuẩn 2026.
 * Căn cứ: Văn bản hợp nhất số 112/VBHN-VPQH & Biểu thuế lũy tiến 5 bậc năm 2026.
 * Giới hạn: < 200 dòng.
 */
import { calculateTax, DEFAULT_TAX_RULES_2026 } from "../calc/calcTax.js";

let rulesData = DEFAULT_TAX_RULES_2026;
let currentTarget = "resident_contract_ge_3m";
let selectedRegion = "1";

const fmt = (num) => Number(num || 0).toLocaleString("vi-VN") + " ₫";
const parseMoney = (val) => {
  const d = String(val || "").replace(/\D/g, "");
  return d ? parseInt(d, 10) : 0;
};
const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };

async function loadRules() {
  const badgeSource = document.getElementById("tool-rule-source");
  try {
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const res = await fetch(`${base}/tools/rules/tax`);
    if (!res.ok) throw new Error("Không nạp được quy tắc");
    const json = await res.json();
    if (json.rules) rulesData = json.rules;
    if (badgeSource) {
      badgeSource.textContent = `Áp dụng theo ${json.source || "Văn bản hợp nhất số 112/VBHN-VPQH & Biểu thuế 5 bậc 2026"}`;
    }
  } catch (err) {
    if (badgeSource) badgeSource.textContent = "Áp dụng theo Văn bản hợp nhất số 112/VBHN-VPQH & Biểu thuế 5 bậc 2026";
  }
}

function updateCalculation() {
  const incomeInput = document.getElementById("tax-income-input");
  const exemptInput = document.getElementById("tax-exempt-input");
  const depInput = document.getElementById("tax-dependents-input");
  const otherInput = document.getElementById("tax-other-ded-input");
  const hasInsCheck = document.getElementById("tax-has-insurance");

  const totalIncome = parseMoney(incomeInput?.value);
  const exemptIncome = parseMoney(exemptInput?.value);
  const dependents = Math.max(0, parseInt(depInput?.value || "0", 10));
  const otherDeductions = parseMoney(otherInput?.value);
  const hasInsurance = hasInsCheck ? hasInsCheck.checked : true;

  const res = calculateTax(currentTarget, totalIncome, rulesData, {
    exemptIncome, dependents, region: selectedRegion, otherDeductions, hasInsurance,
  });

  // Highlight card
  const taxValEl = document.getElementById("res-tax-val");
  const netValEl = document.getElementById("res-net-val");
  if (taxValEl) taxValEl.textContent = fmt(res.pitTax);
  if (netValEl) netValEl.textContent = fmt(res.netIncome);

  // Breakdown details
  document.getElementById("res-income-val").textContent = fmt(res.totalIncome);
  document.getElementById("res-exempt-val").textContent = "- " + fmt(res.exemptIncome);
  document.getElementById("res-taxable-val").textContent = fmt(res.taxableIncome);

  const insRow = document.getElementById("row-insurance-ded");
  const depRow = document.getElementById("row-dependents-ded");
  const personalRow = document.getElementById("row-personal-ded");
  const otherRow = document.getElementById("row-other-ded");
  const assessableRow = document.getElementById("row-assessable-income");

  if (currentTarget === "resident_contract_ge_3m") {
    if (insRow) { insRow.style.display = "flex"; document.getElementById("res-insurance-val").textContent = "- " + fmt(res.deductions.totalInsurance); }
    if (personalRow) { personalRow.style.display = "flex"; document.getElementById("res-personal-val").textContent = "- " + fmt(res.deductions.personal); }
    if (depRow) { depRow.style.display = "flex"; document.getElementById("res-dep-val").textContent = "- " + fmt(res.deductions.dependentsAmount); }
    if (otherRow) { otherRow.style.display = "flex"; document.getElementById("res-other-val").textContent = "- " + fmt(res.deductions.other); }
    if (assessableRow) { assessableRow.style.display = "flex"; document.getElementById("res-assessable-val").textContent = fmt(res.assessableIncome); }
    renderBracketTable(res.bracketDetails);
    renderFormulaNote(res);
  } else {
    if (insRow) insRow.style.display = "none";
    if (personalRow) personalRow.style.display = "none";
    if (depRow) depRow.style.display = "none";
    if (otherRow) otherRow.style.display = "none";
    if (assessableRow) assessableRow.style.display = "none";
    renderSimpleRateTable(res);
  }
}

function renderBracketTable(brackets) {
  const host = document.getElementById("tax-brackets-host");
  if (!host) return;
  const rows = (brackets || []).map((b) => `
    <tr class="${b.isActive ? "is-active" : ""}">
      <td>Bậc ${b.bracket}</td>
      <td>${esc(b.label)}</td>
      <td style="text-align:right;">${Math.round(b.rate * 100)}%</td>
      <td style="text-align:right;">${b.isActive ? `<span class="tax-bracket-badge">${fmt(b.taxAmount)}</span>` : "0 ₫"}</td>
    </tr>
  `).join("");

  host.innerHTML = `
    <div style="font-size:13.5px; font-weight:600; color:var(--text); margin-top:16px;">Chi tiết biểu thuế lũy tiến từng phần (5 bậc 2026)</div>
    <table class="tax-bracket-table" aria-label="Bảng tính thuế lũy tiến 5 bậc">
      <thead><tr><th>Bậc</th><th>Mức thu nhập tính thuế</th><th style="text-align:right;">Thuế suất</th><th style="text-align:right;">Tiền thuế</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderSimpleRateTable(res) {
  const host = document.getElementById("tax-brackets-host");
  if (!host) return;
  host.innerHTML = `
    <div class="tax-formula-callout" style="margin-top:16px;">
      <strong>Cách tính thuế áp dụng:</strong>
      <div style="margin-top:4px;">${esc(res.note || "")}</div>
      <div style="margin-top:6px; font-weight:600; color:var(--primary);">
        Thuế TNCN = ${fmt(res.taxableIncome)} × ${Math.round(res.rate * 100)}% = ${fmt(res.pitTax)}
      </div>
    </div>`;
}

function renderFormulaNote(res) {
  const noteEl = document.getElementById("tax-formula-note");
  if (!noteEl) return;
  noteEl.innerHTML = `
    <div class="tax-formula-callout">
      <strong>Công thức diễn giải:</strong>
      <div>1. <strong>Thu nhập chịu thuế</strong> = ${fmt(res.totalIncome)} - ${fmt(res.exemptIncome)} = <strong>${fmt(res.taxableIncome)}</strong></div>
      <div>2. <strong>Tổng giảm trừ</strong> = ${fmt(res.deductions.personal)} (Bản thân) + ${fmt(res.deductions.dependentsAmount)} (${res.deductions.dependentsCount} người phụ thuộc) + ${fmt(res.deductions.totalInsurance)} (BH 10.5%) = <strong>${fmt(res.deductions.total)}</strong></div>
      <div>3. <strong>Thu nhập tính thuế (TNTT)</strong> = ${fmt(res.taxableIncome)} - ${fmt(res.deductions.total)} = <strong>${fmt(res.assessableIncome)}</strong></div>
      <div>4. <strong>Thuế TNCN phải nộp</strong> = <strong>${fmt(res.pitTax)}</strong></div>
    </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadRules();

  const incomeInput = document.getElementById("tax-income-input");
  const exemptInput = document.getElementById("tax-exempt-input");
  const depInput = document.getElementById("tax-dependents-input");
  const otherInput = document.getElementById("tax-other-ded-input");
  const hasInsCheck = document.getElementById("tax-has-insurance");
  const btnReset = document.getElementById("btn-reset-tax");

  [incomeInput, exemptInput, otherInput].forEach((inp) => {
    inp?.addEventListener("input", (e) => {
      const v = parseMoney(e.target.value);
      e.target.value = v > 0 ? v.toLocaleString("vi-VN") : "";
      updateCalculation();
    });
  });

  depInput?.addEventListener("input", updateCalculation);
  hasInsCheck?.addEventListener("change", updateCalculation);

  // Tabs selector
  document.querySelectorAll(".tax-target-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tax-target-tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      currentTarget = tab.dataset.target || "resident_contract_ge_3m";

      const residentFields = document.querySelectorAll(".resident-only-field");
      residentFields.forEach((f) => {
        f.style.display = currentTarget === "resident_contract_ge_3m" ? "block" : "none";
      });
      updateCalculation();
    });
  });

  // CustomSelect Vùng I-IV
  const regionHost = document.getElementById("tax-region-host");
  if (regionHost && typeof CustomSelect !== "undefined") {
    new CustomSelect(regionHost, {
      options: [
        { value: "1", label: "Vùng I (Hà Nội, TP.HCM: 4.960.000 ₫)" },
        { value: "2", label: "Vùng II (Đà Nẵng, Cần Thơ, Hải Phòng: 4.410.000 ₫)" },
        { value: "3", label: "Vùng III (Bắc Giang, Phú Thọ: 3.860.000 ₫)" },
        { value: "4", label: "Vùng IV (Các địa bàn còn lại: 3.450.000 ₫)" },
      ],
      defaultValue: "1",
      onChange: (val) => { selectedRegion = val; updateCalculation(); },
    });
  }

  btnReset?.addEventListener("click", () => {
    if (incomeInput) incomeInput.value = "";
    if (exemptInput) exemptInput.value = "";
    if (depInput) depInput.value = "0";
    if (otherInput) otherInput.value = "";
    if (hasInsCheck) hasInsCheck.checked = true;
    updateCalculation();
  });

  // Giá trị mặc định minh họa: 30.000.000đ, 1 người phụ thuộc
  if (incomeInput) incomeInput.value = (30000000).toLocaleString("vi-VN");
  if (depInput) depInput.value = "1";
  updateCalculation();
});
