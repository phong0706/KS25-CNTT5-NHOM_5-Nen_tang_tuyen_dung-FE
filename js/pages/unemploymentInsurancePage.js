/**
 * unemploymentInsurancePage.js - Trình điều khiển trang Tính Bảo hiểm thất nghiệp
 * Giới hạn: < 200 dòng (tuân thủ nghiêm ngặt techrecruit-rules).
 */
import { calcUnemploymentBenefit, generateQuickReferenceTable, UNEMPLOYMENT_CONFIG_2026 } from "../calc/calcUnemploymentInsurance.js";

let selectedRegion = "I";
let salaryMode = "single";
const fmtVND = (n) => Number(n || 0).toLocaleString("vi-VN") + " ₫";
const parseMoney = (v) => { const d = String(v || "").replace(/\D/g, ""); return d ? parseInt(d, 10) : 0; };

function renderQuickTable(salary) {
  const tbody = document.getElementById("quick-ref-body");
  if (!tbody) return;
  tbody.innerHTML = generateQuickReferenceTable(selectedRegion, salary || 10000000).map(r => `
    <tr>
      <td class="col-time">
        <span class="months-strong">${r.monthsRange}</span>
        <span class="years-sub">(${r.yearsDesc})</span>
      </td>
      <td class="highlight"><span class="badge-months">${r.benefitMonths} tháng</span></td>
      <td class="col-total"><strong>${fmtVND(r.totalBenefit)}</strong></td>
    </tr>`).join("");
}

export function updateCalculation() {
  const salary = salaryMode === "single"
    ? parseMoney(document.getElementById("salary-single-input")?.value)
    : Array.from(document.querySelectorAll(".salary-month-input")).map(i => parseMoney(i.value));

  const totalMonths = Math.max(0, parseInt(document.getElementById("time-total-months")?.value || "0", 10));
  const isIllegal = document.getElementById("chk-illegal-term")?.checked || false;
  const isPensioner = document.getElementById("chk-pensioner")?.checked || false;

  const res = calcUnemploymentBenefit({
    salary,
    months: totalMonths,
    region: selectedRegion,
    isIllegalTermination: isIllegal,
    isPensioner: isPensioner
  });

  const resBox = document.getElementById("bhtn-result-box");
  const errBox = document.getElementById("bhtn-ineligible-box");
  const capBadge = document.getElementById("bhtn-cap-badge");

  if (!res.isEligible) {
    if (resBox) resBox.style.display = "none";
    if (errBox) {
      errBox.style.display = "flex";
      document.getElementById("ineligible-reason-text").textContent = res.ineligibilityReason;
    }
  } else {
    if (errBox) errBox.style.display = "none";
    if (resBox) resBox.style.display = "block";
    document.getElementById("res-monthly-benefit").textContent = fmtVND(res.monthlyBenefit);
    document.getElementById("res-months-count").textContent = `${res.monthsBenefit} tháng`;
    document.getElementById("res-total-benefit").textContent = fmtVND(res.totalBenefit);
    document.getElementById("res-avg-salary").textContent = fmtVND(res.avgSalary);

    if (capBadge) {
      capBadge.style.display = res.isCapped ? "block" : "none";
      if (res.isCapped) {
        capBadge.textContent = `⚠️ Lương tính hưởng 60% (${fmtVND(res.rawMonthlyBenefit)}) vượt trần tối đa 5 lần lương tối thiểu Vùng ${selectedRegion} (${fmtVND(res.maxBenefitCeiling)}/tháng). Mức hưởng được giới hạn ở ${fmtVND(res.monthlyBenefit)}/tháng.`;
      }
    }
  }

  const uC = document.getElementById("res-user-contrib");
  const cC = document.getElementById("res-comp-contrib");
  if (uC) uC.textContent = fmtVND(res.employeeMonthlyContribution);
  if (cC) cC.textContent = fmtVND(res.employerMonthlyContribution);

  renderQuickTable(Array.isArray(salary) ? res.avgSalary : salary);
}

document.addEventListener("DOMContentLoaded", () => {
  const regHost = document.getElementById("bhtn-region-host");
  if (regHost && window.CustomSelect) {
    new window.CustomSelect(regHost, {
      id: "bhtn-region-select",
      ariaLabel: "Chọn vùng lương tối thiểu",
      options: [
        { value: "I", label: `Vùng I - ${fmtVND(UNEMPLOYMENT_CONFIG_2026.regionalMinimums.I)}/tháng` },
        { value: "II", label: `Vùng II - ${fmtVND(UNEMPLOYMENT_CONFIG_2026.regionalMinimums.II)}/tháng` },
        { value: "III", label: `Vùng III - ${fmtVND(UNEMPLOYMENT_CONFIG_2026.regionalMinimums.III)}/tháng` },
        { value: "IV", label: `Vùng IV - ${fmtVND(UNEMPLOYMENT_CONFIG_2026.regionalMinimums.IV)}/tháng` }
      ],
      value: "I",
      onChange: (val) => { selectedRegion = val; updateCalculation(); }
    });
  }

  const tSingle = document.getElementById("tab-mode-single");
  const tSix = document.getElementById("tab-mode-six");
  const wSingle = document.getElementById("wrap-salary-single");
  const wSix = document.getElementById("wrap-salary-six");

  tSingle?.addEventListener("click", () => {
    salaryMode = "single";
    tSingle.classList.add("active");
    tSix.classList.remove("active");
    wSingle.style.display = "block";
    wSix.style.display = "none";
    updateCalculation();
  });

  tSix?.addEventListener("click", () => {
    salaryMode = "six_months";
    tSix.classList.add("active");
    tSingle.classList.remove("active");
    wSingle.style.display = "none";
    wSix.style.display = "block";
    updateCalculation();
  });

  document.querySelectorAll(".money-input").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const num = parseMoney(e.target.value);
      e.target.value = num ? Number(num).toLocaleString("vi-VN") : "";
      updateCalculation();
    });
  });

  const inpY = document.getElementById("time-years");
  const inpM = document.getElementById("time-months");
  const inpT = document.getElementById("time-total-months");

  const syncFromYM = () => {
    const y = Math.max(0, parseInt(inpY?.value || "0", 10));
    const m = Math.max(0, parseInt(inpM?.value || "0", 10));
    if (inpT) inpT.value = y * 12 + m;
    updateCalculation();
  };
  const syncFromT = () => {
    const t = Math.max(0, parseInt(inpT?.value || "0", 10));
    if (inpY) inpY.value = Math.floor(t / 12);
    if (inpM) inpM.value = t % 12;
    updateCalculation();
  };
  inpY?.addEventListener("input", syncFromYM);
  inpM?.addEventListener("input", syncFromYM);
  inpT?.addEventListener("input", syncFromT);
  document.getElementById("chk-illegal-term")?.addEventListener("change", updateCalculation);
  document.getElementById("chk-pensioner")?.addEventListener("change", updateCalculation);

  document.getElementById("btn-reset")?.addEventListener("click", () => {
    const sInp = document.getElementById("salary-single-input");
    if (sInp) sInp.value = "10.000.000";
    if (inpY) inpY.value = "5";
    if (inpM) inpM.value = "0";
    if (inpT) inpT.value = "60";
    document.getElementById("chk-illegal-term").checked = false;
    document.getElementById("chk-pensioner").checked = false;
    updateCalculation();
  });

  updateCalculation();
});
