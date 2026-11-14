/**
 * calcTools.js - Các hàm tính toán tài chính & bảo hiểm khác
 * Giới hạn: < 200 dòng.
 */
// 1. Tính thuế TNCN độc lập
export function calculatePitTax(income, rules, dependents = 0) {
  const inc = Math.max(0, Number(income) || 0);
  const personal = rules?.personal_deduction || 11000000;
  const dep = (rules?.dependent_deduction || 4400000) * Math.max(0, Number(dependents) || 0);
  const taxable = Math.max(0, inc - personal - dep);

  const brackets = rules?.tax_brackets || [
    { from: 0, to: 5000000, rate: 0.05 },
    { from: 5000000, to: 10000000, rate: 0.10 },
    { from: 10000000, to: 18000000, rate: 0.15 },
    { from: 18000000, to: 32000000, rate: 0.20 },
    { from: 32000000, to: 52000000, rate: 0.25 },
    { from: 52000000, to: 80000000, rate: 0.30 },
    { from: 80000000, to: null, rate: 0.35 }
  ];

  let totalTax = 0;
  let details = [];
  let remaining = taxable;

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    // Mỗi bậc có 2 dạng mô tả:
    //   - {from, to}: to = null nghĩa là không giới hạn trên
    //   - {threshold}: dùng bậc trước làm mốc dưới
    const prev = b.from ?? (i === 0 ? 0 : (brackets[i - 1].threshold ?? brackets[i - 1].to ?? 0));
    const to = b.to ?? b.threshold ?? null;
    const limit = (to === null || to === undefined) ? Infinity : Math.max(0, to - prev);
    const taxablePart = Math.min(remaining, limit);

    if (taxablePart > 0) {
      const tax = Math.round(taxablePart * b.rate);
      totalTax += tax;
      const toStr = (to === null || to === undefined) ? "trở lên" : to.toLocaleString("vi-VN");
      details.push({ bracket: i + 1, range: `${prev.toLocaleString("vi-VN")} - ${toStr}`, rate: b.rate, taxable: taxablePart, tax });
      remaining -= taxablePart;
    }
    if (remaining <= 0) break;
  }

  return { income: inc, taxable, totalTax, details, netIncome: inc - totalTax };
}

// 2. Bảo hiểm thất nghiệp
export function calculateUnemploymentInsurance(avgSalary, months, rules) {
  const salary = Math.max(0, Number(avgSalary) || 0);
  const m = Math.max(0, Number(months) || 0);
  const minMonths = rules?.min_months ?? 12;
  if (m < minMonths) {
    return { eligible: false, message: "Chưa đủ điều kiện hưởng BHTN (phải đóng từ đủ 12 tháng trở lên trong 24 tháng trước khi nghỉ việc)." };
  }

  // Số tháng hưởng theo Điều 46 Luật Việc làm 2013:
  //   đóng đủ  12 -  36 tháng -> 3 tháng
  //   đóng đủ  37 -  60 tháng -> 4 tháng
  //   đóng đủ  61 -  84 tháng -> 5 tháng
  //   đóng đủ  85 - 120 tháng -> 6 tháng
  //   đóng đủ trên 120 tháng   -> 8 tháng (mức tối đa)
  //
  // Bản cũ dùng công thức 3 + floor((m - 36) / 12) và cho tối đa 12 tháng:
  //   - đóng 120 tháng ra 10 tháng (đúng phải là 6)
  //   - và vượt trần tối đa 8 tháng theo luật.
  const baseMonths = rules?.base_months ?? 36;
  const baseBenefit = rules?.base_benefit_months ?? 3;
  const maxBenefit = rules?.max_benefit_months ?? 8;

  let benefitMonths;
  if (m <= baseMonths) {
    benefitMonths = baseBenefit;
  } else if (m <= 60) {
    benefitMonths = 4;
  } else if (m <= 84) {
    benefitMonths = 5;
  } else if (m <= 120) {
    benefitMonths = 6;
  } else {
    benefitMonths = maxBenefit;
  }
  benefitMonths = Math.min(maxBenefit, Math.max(baseBenefit, benefitMonths));

  const rate = rules?.benefit_rate ?? 0.6;
  // Mức hưởng tối đa = 5 x mức lương tối thiểu vùng (nếu cấu hình cap_base).
  const capBase = Number(rules?.cap_base) || 0;
  const cap = capBase > 0 ? capBase * (Number(rules?.max_cap_multiplier) || 5) : 0;
  const monthlyBenefit = cap > 0
    ? Math.min(Math.round(salary * rate), cap)
    : Math.round(salary * rate);

  return {
    eligible: true,
    benefitMonths,
    monthlyBenefit,
    totalBenefit: monthlyBenefit * benefitMonths
  };
}

// 3. Bảo hiểm xã hội 1 lần
export function calculateOneTimeSocialInsurance(avgSalary, yearsBefore2014 = 0, yearsFrom2014 = 0, rules) {
  const salary = Math.max(0, Number(avgSalary) || 0);
  const yBefore = Math.max(0, Number(yearsBefore2014) || 0);
  const yFrom = Math.max(0, Number(yearsFrom2014) || 0);

  const rateBefore = rules?.rate_before_2014 || 1.5;
  const rateFrom = rules?.rate_from_2014 || 2.0;

  const totalBenefit = Math.round(salary * (yBefore * rateBefore + yFrom * rateFrom));
  return { avgSalary: salary, yearsBefore2014: yBefore, yearsFrom2014: yFrom, totalBenefit };
}

// 4. Lãi kép
export function calculateCompoundInterest(principal, annualRatePercent, years, timesPerYear = 12) {
  const P = Math.max(0, Number(principal) || 0);
  // Lãi suất âm bị chặn (chỉ nhận lãi suất >= 0).
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100;
  const t = Math.max(0, Number(years) || 0);
  const n = Math.max(1, Number(timesPerYear) || 12);

  const totalAmount = Math.round(P * Math.pow(1 + r / n, n * t));
  const interestEarned = totalAmount - P;
  return { principal: P, totalAmount, interestEarned, years: t };
}

// 5. Kế hoạch tiết kiệm mục tiêu
export function calculateSavingsPlan(targetAmount, annualRatePercent, months) {
  const FV = Math.max(0, Number(targetAmount) || 0);
  const annualRate = Math.max(0, Number(annualRatePercent) || 0) / 100;
  const r = annualRate / 12;
  const n = Math.max(1, Number(months) || 1);

  let monthlyDeposit = 0;
  if (r === 0) {
    monthlyDeposit = Math.round(FV / n);
  } else {
    // FV = PMT * [((1 + r)^n - 1) / r] * (1 + r)
    monthlyDeposit = Math.round(FV / ((((Math.pow(1 + r, n) - 1) / r) * (1 + r))));
  }

  const totalDeposited = monthlyDeposit * n;
  // Lãi phải >= 0: khi FV quá nhỏ so với tổng góp, công thức PMT có thể cho
  // số tiền góp 0 -> không thể có lãi. Trả về 0 thay vì giá trị âm.
  const interestEarned = Math.max(0, FV - totalDeposited);
  return { targetAmount: FV, monthlyDeposit, totalDeposited, interestEarned, months: n };
}
