/**
 * calcGrossNet.js - Tính lương Gross sang Net & Net sang Gross (Thuần Logic + Quy định pháp luật).
 * Giới hạn: < 200 dòng.
 */

export function calculateGrossToNet(gross, rules, options = {}) {
  const salary = Math.max(0, Number(gross) || 0);
  const region = String(options.region || "1");
  const dependents = Math.max(0, Number(options.dependents) || 0);

  const baseSalary = rules?.base_salary || 2340000;
  const regMin = (rules?.regional_minimums && rules.regional_minimums[region]) || 4960000;
  const rates = rules?.insurance_rates || { social: 0.08, health: 0.015, unemployment: 0.01 };

  // Trần đóng bảo hiểm: BHXH & BHYT tối đa 20 lần mức lương cơ sở; BHTN tối đa 20 lần lương tối thiểu vùng
  const maxSocialBase = baseSalary * 20;
  const maxUnempBase = regMin * 20;

  const socialBase = Math.min(salary, maxSocialBase);
  const unempBase = Math.min(salary, maxUnempBase);

  const socialIns = Math.round(socialBase * rates.social);
  const healthIns = Math.round(socialBase * rates.health);
  const unempIns = Math.round(unempBase * rates.unemployment);
  const totalInsurance = socialIns + healthIns + unempIns;

  // Thu nhập trước thuế
  const incomeBeforeTax = Math.max(0, salary - totalInsurance);

  // Giảm trừ
  const personalDed = rules?.personal_deduction || 11000000;
  const depDed = (rules?.dependent_deduction || 4400000) * dependents;
  const totalDeduction = personalDed + depDed;

  // Thu nhập tính thuế
  const taxableIncome = Math.max(0, incomeBeforeTax - totalDeduction);

  // Tính thuế TNCN theo từng bậc lũy tiến từng phần
  const brackets = rules?.tax_brackets || [
    { threshold: 5000000, rate: 0.05, quick_subtract: 0 },
    { threshold: 10000000, rate: 0.10, quick_subtract: 250000 },
    { threshold: 18000000, rate: 0.15, quick_subtract: 750000 },
    { threshold: 32000000, rate: 0.20, quick_subtract: 1650000 },
    { threshold: 52000000, rate: 0.25, quick_subtract: 3250000 },
    { threshold: 80000000, rate: 0.30, quick_subtract: 5850000 },
    { threshold: 9999999999, rate: 0.35, quick_subtract: 9850000 }
  ];

  let pitTax = 0;
  let bracketDetails = [];
  let remainingTaxable = taxableIncome;
  let previousThreshold = 0;

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const bracketSize = b.threshold - previousThreshold;
    const taxableInBracket = Math.min(remainingTaxable, bracketSize);

    if (taxableInBracket > 0) {
      const taxAmount = Math.round(taxableInBracket * b.rate);
      pitTax += taxAmount;
      bracketDetails.push({
        bracket: i + 1,
        taxableAmount: taxableInBracket,
        rate: b.rate,
        tax: taxAmount
      });
      remainingTaxable -= taxableInBracket;
    }
    previousThreshold = b.threshold;
    if (remainingTaxable <= 0) break;
  }

  const netSalary = Math.max(0, salary - totalInsurance - pitTax);

  // Chi phí người sử dụng lao động
  const empRates = rules?.employer_insurance_rates || { social: 0.175, health: 0.03, unemployment: 0.01 };
  const empSocial = Math.round(socialBase * empRates.social);
  const empHealth = Math.round(socialBase * empRates.health);
  const empUnemp = Math.round(unempBase * empRates.unemployment);
  const totalEmployerCost = salary + empSocial + empHealth + empUnemp;

  return {
    gross: salary,
    net: netSalary,
    totalInsurance,
    insuranceDetail: { social: socialIns, health: healthIns, unemployment: unempIns },
    taxableIncome,
    pitTax,
    bracketDetails,
    totalEmployerCost,
    effectiveFrom: rules?.effective_from || "2024-07-01",
    source: rules?.source || "Quy định pháp luật hiện hành"
  };
}

export function calculateNetToGross(targetNet, rules, options = {}) {
  const target = Math.max(0, Number(targetNet) || 0);
  if (target === 0) return calculateGrossToNet(0, rules, options);

  // Tìm kiếm nhị phân trên gross để net(gross) == target.
  // Bản cũ khởi tạo low = target, high = target*2 rồi nhân đôi high "vô hạn" ->
  // có thể lặp vô hạn khi target = 0 (đã xử lý) hoặc khi mức lương rất lớn.
  // Giờ: mở rộng cận trên có giới hạn, và luôn theo dõi kết quả tốt nhất.
  let low = target;
  let high = Math.max(target * 2, 1_000_000);
  let grossResult = high;

  // Mở rộng cận trên cho tới khi net(high) >= target (tối đa 60 lần nhân đôi).
  let guard = 0;
  while (calculateGrossToNet(high, rules, options).net < target && guard < 60) {
    high *= 2;
    guard += 1;
  }

  // Giữ lại ứng viên có sai số nhỏ nhất trong toàn bộ quá trình tìm kiếm.
  let bestGross = high;
  let bestDiff = Math.abs(calculateGrossToNet(high, rules, options).net - target);

  for (let iter = 0; iter < 80; iter++) {
    const mid = Math.round((low + high) / 2);
    if (mid <= low || mid >= high) break; // đã hội tụ tới biên
    const res = calculateGrossToNet(mid, rules, options);
    const diff = Math.abs(res.net - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestGross = mid;
    }
    if (diff <= 1) {
      bestGross = mid;
      break;
    }
    if (res.net < target) low = mid + 1;
    else high = mid - 1;
  }

  return calculateGrossToNet(bestGross, rules, options);
}
