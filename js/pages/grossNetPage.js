/**
 * grossNetPage.js - Điều khiển trang tính lương Gross-Net tương tác trực tiếp
 * Giới hạn: < 200 dòng.
 */
import { calculateGrossToNet, calculateNetToGross } from "../calc/calcGrossNet.js";

let rulesData = null;
let selectedRegion = "1";

function fmtVND(num) {
  return Number(num || 0).toLocaleString("vi-VN") + " ₫";
}

function parseInputMoney(val) {
  const digits = String(val || "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

async function loadRules() {
  const badgeSource = document.getElementById("tool-rule-source");
  try {
    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const res = await fetch(`${base}/tools/rules/gross-net`);
    if (!res.ok) throw new Error("Không nạp được quy tắc");
    const json = await res.json();
    rulesData = json.rules;
    if (badgeSource) {
      badgeSource.textContent = `Áp dụng theo quy định có hiệu lực từ ${json.effective_from} (${json.source})`;
    }
  } catch (err) {
    if (badgeSource) badgeSource.textContent = "Áp dụng theo Nghị định 73/2024/NĐ-CP & Luật Thuế TNCN";
  }
}

function updateCalculation() {
  const salaryInput = document.getElementById("salary-input");
  const depInput = document.getElementById("dependents-input");
  const mode = document.querySelector('input[name="calc-mode"]:checked')?.value || "gross-to-net";
  const salaryVal = parseInputMoney(salaryInput?.value);
  const dependents = Math.max(0, parseInt(depInput?.value || "0", 10));

  const options = { region: selectedRegion, dependents };
  const res = mode === "gross-to-net"
    ? calculateGrossToNet(salaryVal, rulesData, options)
    : calculateNetToGross(salaryVal, rulesData, options);

  const primaryLabel = document.getElementById("res-primary-label");
  const primaryVal = document.getElementById("res-primary-val");
  if (primaryLabel && primaryVal) {
    primaryLabel.textContent = mode === "gross-to-net" ? "Lương thực nhận (Net)" : "Lương danh nghĩa cần nhận (Gross)";
    primaryVal.textContent = mode === "gross-to-net" ? fmtVND(res.net) : fmtVND(res.gross);
  }

  document.getElementById("res-gross-val").textContent = fmtVND(res.gross);
  document.getElementById("res-social-val").textContent = "- " + fmtVND(res.insuranceDetail.social);
  document.getElementById("res-health-val").textContent = "- " + fmtVND(res.insuranceDetail.health);
  document.getElementById("res-unemp-val").textContent = "- " + fmtVND(res.insuranceDetail.unemployment);
  document.getElementById("res-total-ins-val").textContent = "- " + fmtVND(res.totalInsurance);
  document.getElementById("res-taxable-val").textContent = fmtVND(res.taxableIncome);
  document.getElementById("res-pit-val").textContent = "- " + fmtVND(res.pitTax);
  document.getElementById("res-employer-cost-val").textContent = fmtVND(res.totalEmployerCost);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadRules();

  const salaryInput = document.getElementById("salary-input");
  const depInput = document.getElementById("dependents-input");
  const salaryLabel = document.getElementById("salary-label");
  const btnReset = document.getElementById("btn-reset");

  salaryInput?.addEventListener("input", (e) => {
    const raw = parseInputMoney(e.target.value);
    e.target.value = raw > 0 ? raw.toLocaleString("vi-VN") : "";
    updateCalculation();
  });

  depInput?.addEventListener("input", updateCalculation);

  document.querySelectorAll('input[name="calc-mode"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const mode = e.target.value;
      if (salaryLabel) {
        salaryLabel.textContent = mode === "gross-to-net" ? "Mức lương Gross (VNĐ)" : "Mức lương Net mong muốn (VNĐ)";
      }
      updateCalculation();
    });
  });

  // Render CustomSelect cho Vùng 1-4
  const regionHost = document.getElementById("region-host");
  if (regionHost && typeof CustomSelect !== "undefined") {
    new CustomSelect(regionHost, {
      options: [
        { value: "1", label: "Vùng I (Hà Nội, TP.HCM: 4.960.000 ₫)" },
        { value: "2", label: "Vùng II (Đà Nẵng, Cần Thơ, Hải Phòng: 4.410.000 ₫)" },
        { value: "3", label: "Vùng III (Bắc Giang, Phú Thọ: 3.860.000 ₫)" },
        { value: "4", label: "Vùng IV (Các địa bàn còn lại: 3.450.000 ₫)" },
      ],
      defaultValue: "1",
      onChange: (val) => {
        selectedRegion = val;
        updateCalculation();
      }
    });
  }

  btnReset?.addEventListener("click", () => {
    if (salaryInput) salaryInput.value = "";
    if (depInput) depInput.value = "0";
    updateCalculation();
  });

  updateCalculation();
});
