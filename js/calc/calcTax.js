/**
 * calcTax.js - Module tính Thuế Thu Nhập Cá Nhân (TNCN) chuẩn 2026.
 * Căn cứ: Văn bản hợp nhất số 112/VBHN-VPQH & Biểu thuế lũy tiến 5 bậc năm 2026.
 * Giới hạn: < 200 dòng.
 */

export const DEFAULT_TAX_RULES_2026 = {
  personal_deduction: 15500000,
  dependent_deduction: 6200000,
  meal_allowance_cap: 1200000,
  casual_labor_threshold: 5000000,
  casual_labor_rate: 0.10,
  non_resident_rate: 0.20,
  base_salary: 2340000,
  regional_minimums: { "1": 4960000, "2": 4410000, "3": 3860000, "4": 3450000 },
  insurance_rates: { social: 0.08, health: 0.015, unemployment: 0.01 },
  tax_brackets: [
    { bracket: 1, from: 0, to: 10000000, threshold: 10000000, rate: 0.05, quick_subtract: 0, label: "Đến 10 triệu đồng" },
    { bracket: 2, from: 10000000, to: 30000000, threshold: 30000000, rate: 0.10, quick_subtract: 500000, label: "Trên 10 đến 30 triệu đồng" },
    { bracket: 3, from: 30000000, to: 60000000, threshold: 60000000, rate: 0.20, quick_subtract: 3500000, label: "Trên 30 đến 60 triệu đồng" },
    { bracket: 4, from: 60000000, to: 100000000, threshold: 100000000, rate: 0.30, quick_subtract: 9500000, label: "Trên 60 đến 100 triệu đồng" },
    { bracket: 5, from: 100000000, to: null, threshold: 999999999999, rate: 0.35, quick_subtract: 14500000, label: "Trên 100 triệu đồng" },
  ],
};

export function calculateTaxResidentGe3m(totalIncome, rules, options = {}) {
  const cfg = rules || DEFAULT_TAX_RULES_2026;
  const income = Math.max(0, Number(totalIncome) || 0);
  const exempt = Math.max(0, Number(options.exemptIncome) || 0);
  const taxableIncome = Math.max(0, income - exempt);

  const region = String(options.region || "1");
  const hasInsurance = options.hasInsurance !== false;
  const baseSalary = Number(cfg.base_salary || 2340000);
  const regMins = cfg.regional_minimums || {};
  const regMin = Number(regMins[region] || 4960000);
  const insRates = cfg.insurance_rates || { social: 0.08, health: 0.015, unemployment: 0.01 };

  const insSal = options.insuranceSalary != null ? Math.max(0, Number(options.insuranceSalary)) : income;
  const socialBase = hasInsurance ? Math.min(insSal, baseSalary * 20) : 0;
  const unempBase = hasInsurance ? Math.min(insSal, regMin * 20) : 0;

  const socialIns = Math.round(socialBase * (insRates.social || 0.08));
  const healthIns = Math.round(socialBase * (insRates.health || 0.015));
  const unempIns = Math.round(unempBase * (insRates.unemployment || 0.01));
  const totalInsurance = socialIns + healthIns + unempIns;

  const personalDed = Number(cfg.personal_deduction || 15500000);
  const depCount = Math.max(0, parseInt(options.dependents || 0, 10));
  const depDed = Number(cfg.dependent_deduction || 6200000) * depCount;
  const otherDed = Math.max(0, Number(options.otherDeductions) || 0);
  const totalDeductions = personalDed + depDed + totalInsurance + otherDed;

  const assessableIncome = Math.max(0, taxableIncome - totalDeductions);
  const brackets = cfg.tax_brackets || DEFAULT_TAX_RULES_2026.tax_brackets;
  let pitTax = 0;
  const bracketDetails = [];
  let remTaxable = assessableIncome;
  let prevThreshold = 0;

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const thresh = Number(b.threshold);
    const bracketSize = thresh - prevThreshold;
    const taxableInB = Math.min(remTaxable, bracketSize);

    if (taxableInB > 0) {
      const taxInB = Math.round(taxableInB * Number(b.rate));
      pitTax += taxInB;
      bracketDetails.push({
        bracket: b.bracket || (i + 1),
        label: b.label || `Bậc ${i + 1}`,
        from: prevThreshold,
        to: b.to,
        rate: Number(b.rate),
        taxableAmount: taxableInB,
        taxAmount: taxInB,
        isActive: true,
      });
      remTaxable -= taxableInB;
    } else {
      bracketDetails.push({
        bracket: b.bracket || (i + 1),
        label: b.label || `Bậc ${i + 1}`,
        from: prevThreshold,
        to: b.to,
        rate: Number(b.rate),
        taxableAmount: 0,
        taxAmount: 0,
        isActive: false,
      });
    }
    prevThreshold = thresh;
  }

  const netIncome = Math.max(0, income - totalInsurance - pitTax);

  return {
    targetType: "resident_contract_ge_3m",
    totalIncome: income,
    exemptIncome: exempt,
    taxableIncome,
    assessableIncome,
    pitTax,
    netIncome,
    deductions: {
      personal: personalDed,
      dependentsCount: depCount,
      dependentsAmount: depDed,
      totalInsurance,
      insuranceDetails: { social: socialIns, health: healthIns, unemployment: unempIns },
      other: otherDed,
      total: totalDeductions,
    },
    bracketDetails,
    legalBasis: "Văn bản hợp nhất số 112/VBHN-VPQH & Biểu thuế 5 bậc năm 2026",
  };
}

export function calculateTaxResidentCasual(totalIncome, rules, options = {}) {
  const cfg = rules || DEFAULT_TAX_RULES_2026;
  const income = Math.max(0, Number(totalIncome) || 0);
  const exempt = Math.max(0, Number(options.exemptIncome) || 0);
  const taxableIncome = Math.max(0, income - exempt);
  const threshold = Number(cfg.casual_labor_threshold || 5000000);
  const rate = Number(cfg.casual_labor_rate || 0.10);

  const isTaxable = taxableIncome >= threshold;
  const pitTax = isTaxable ? Math.round(taxableIncome * rate) : 0;
  const netIncome = Math.max(0, income - pitTax);

  return {
    targetType: "resident_casual_or_lt_3m",
    totalIncome: income,
    exemptIncome: exempt,
    taxableIncome,
    assessableIncome: isTaxable ? taxableIncome : 0,
    pitTax,
    netIncome,
    rate: isTaxable ? rate : 0,
    threshold,
    note: "Khấu trừ 10% tại nguồn trên thu nhập từ 5.000.000 đồng/lần chi trả trở lên. Không giảm trừ gia cảnh.",
    legalBasis: "Văn bản hợp nhất số 112/VBHN-VPQH",
  };
}

export function calculateTaxNonResident(totalIncome, rules, options = {}) {
  const cfg = rules || DEFAULT_TAX_RULES_2026;
  const income = Math.max(0, Number(totalIncome) || 0);
  const exempt = Math.max(0, Number(options.exemptIncome) || 0);
  const taxableIncome = Math.max(0, income - exempt);
  const rate = Number(cfg.non_resident_rate || 0.20);
  const pitTax = Math.round(taxableIncome * rate);
  const netIncome = Math.max(0, income - pitTax);

  return {
    targetType: "non_resident",
    totalIncome: income,
    exemptIncome: exempt,
    taxableIncome,
    assessableIncome: taxableIncome,
    pitTax,
    netIncome,
    rate,
    note: "Áp dụng thuế suất 20% trên tổng thu nhập chịu thuế, không giảm trừ gia cảnh.",
    legalBasis: "Văn bản hợp nhất số 112/VBHN-VPQH",
  };
}

export function calculateTax(targetType, totalIncome, rules, options = {}) {
  if (targetType === "resident_casual_or_lt_3m") {
    return calculateTaxResidentCasual(totalIncome, rules, options);
  }
  if (targetType === "non_resident") {
    return calculateTaxNonResident(totalIncome, rules, options);
  }
  return calculateTaxResidentGe3m(totalIncome, rules, options);
}
