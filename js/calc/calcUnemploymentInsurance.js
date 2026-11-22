/**
 * calcUnemploymentInsurance.js - Logic tính Bảo hiểm thất nghiệp thuần (Pure Function).
 * Áp dụng theo Luật Việc làm 2025 và quy định lương tối thiểu vùng dự kiến năm 2026.
 * Tuân thủ techrecruit-rules: thuần logic, không phụ thuộc DOM, < 200 dòng.
 */

// Cấu hình quy định mức lương tối thiểu vùng và các tỷ lệ áp dụng cho năm 2026
// TODO: Đối chiếu và cập nhật khi Chính phủ ban hành Nghị định quy định mức lương tối thiểu vùng mới nhất.
export const UNEMPLOYMENT_CONFIG_2026 = {
  year: 2026,
  regionalMinimums: {
    I: 5310000,   // Vùng I: 5.310.000 đ/tháng
    II: 4730000,  // Vùng II: 4.730.000 đ/tháng
    III: 4140000, // Vùng III: 4.140.000 đ/tháng
    IV: 3700000   // Vùng IV: 3.700.000 đ/tháng
  },
  benefitRate: 0.60,              // Hưởng 60% mức bình quân tiền lương 6 tháng
  maxContributionMultiplier: 20, // Trần đóng: tối đa 20 lần mức lương tối thiểu vùng
  maxBenefitMultiplier: 5,       // Trần hưởng: tối đa 5 lần mức lương tối thiểu vùng
  minContributionMonths: 12,     // Tối thiểu 12 tháng đóng mới đủ điều kiện hưởng
  maxBenefitMonths: 12,          // Tối đa 12 tháng hưởng trợ cấp
  employeeContributionRate: 0.01,// NLĐ đóng 1%
  employerContributionRate: 0.01 // NSDLĐ đóng 1%
};

/**
 * Tính số tháng được hưởng trợ cấp thất nghiệp dựa trên tổng số tháng đã đóng
 * @param {number} totalMonths
 * @returns {number} Số tháng được hưởng (0 đến 12)
 */
export function calculateBenefitMonths(totalMonths) {
  const m = Math.max(0, Math.floor(Number(totalMonths) || 0));
  if (m < 12) return 0;
  if (m <= 36) return 3;
  const extraMonths = Math.floor((m - 36) / 12);
  return Math.min(12, 3 + extraMonths);
}

/**
 * Hàm tính mức trợ cấp thất nghiệp thuần túy
 * @param {Object} params
 * @param {number|number[]} params.salary - Mức lương bình quân hoặc mảng 6 tháng
 * @param {number} params.months - Tổng số tháng đóng BHTN
 * @param {string} [params.region='I'] - Vùng lương tối thiểu ('I' | 'II' | 'III' | 'IV')
 * @param {boolean} [params.isIllegalTermination=false] - Chấm dứt HĐLĐ trái pháp luật
 * @param {boolean} [params.isPensioner=false] - Đang hưởng lương hưu
 * @param {Object} [params.config=UNEMPLOYMENT_CONFIG_2026] - Cấu hình mức lương
 */
export function calcUnemploymentBenefit({
  salary = 0,
  months = 0,
  region = 'I',
  isIllegalTermination = false,
  isPensioner = false,
  config = UNEMPLOYMENT_CONFIG_2026
} = {}) {
  const regKey = String(region).toUpperCase().trim();
  const regionalMin = config.regionalMinimums[regKey] || config.regionalMinimums.I;
  const maxContributionSalary = regionalMin * config.maxContributionMultiplier;
  const maxBenefitCeiling = regionalMin * config.maxBenefitMultiplier;

  // Xử lý mức lương: nếu truyền mảng 6 tháng thì tính bình quân, cắt trần từng tháng
  let avgSalary = 0;
  if (Array.isArray(salary) && salary.length > 0) {
    const validSalaries = salary.map(s => Math.min(Math.max(0, Number(s) || 0), maxContributionSalary));
    const sum = validSalaries.reduce((acc, curr) => acc + curr, 0);
    avgSalary = Math.round(sum / validSalaries.length);
  } else {
    const raw = Math.max(0, Number(salary) || 0);
    avgSalary = Math.min(raw, maxContributionSalary);
  }

  const totalMonths = Math.max(0, Math.floor(Number(months) || 0));

  // Kiểm tra các điều kiện không đủ điều kiện hưởng
  if (isIllegalTermination) {
    return {
      isEligible: false,
      ineligibilityReason: 'Chấm dứt hợp đồng lao động trái pháp luật theo quy định.',
      monthsBenefit: 0,
      monthlyBenefit: 0,
      totalBenefit: 0,
      avgSalary,
      maxBenefitCeiling,
      isCapped: false,
      employeeMonthlyContribution: Math.round(avgSalary * config.employeeContributionRate),
      employerMonthlyContribution: Math.round(avgSalary * config.employerContributionRate),
      regionalMin
    };
  }

  if (isPensioner) {
    return {
      isEligible: false,
      ineligibilityReason: 'Người lao động đang hưởng lương hưu hoặc trợ cấp mất sức lao động hằng tháng.',
      monthsBenefit: 0,
      monthlyBenefit: 0,
      totalBenefit: 0,
      avgSalary,
      maxBenefitCeiling,
      isCapped: false,
      employeeMonthlyContribution: Math.round(avgSalary * config.employeeContributionRate),
      employerMonthlyContribution: Math.round(avgSalary * config.employerContributionRate),
      regionalMin
    };
  }

  if (totalMonths < config.minContributionMonths) {
    return {
      isEligible: false,
      ineligibilityReason: 'Chưa đủ thời gian đóng BHTN tối thiểu (cần đóng đủ từ 12 tháng trở lên trong vòng 24 tháng trước khi chấm dứt HĐLĐ).',
      monthsBenefit: 0,
      monthlyBenefit: 0,
      totalBenefit: 0,
      avgSalary,
      maxBenefitCeiling,
      isCapped: false,
      employeeMonthlyContribution: Math.round(avgSalary * config.employeeContributionRate),
      employerMonthlyContribution: Math.round(avgSalary * config.employerContributionRate),
      regionalMin
    };
  }

  // Đủ điều kiện hưởng
  const monthsBenefit = calculateBenefitMonths(totalMonths);
  const rawMonthlyBenefit = Math.round(avgSalary * config.benefitRate);
  const isCapped = rawMonthlyBenefit > maxBenefitCeiling;
  const monthlyBenefit = isCapped ? maxBenefitCeiling : rawMonthlyBenefit;
  const totalBenefit = monthlyBenefit * monthsBenefit;

  return {
    isEligible: true,
    ineligibilityReason: null,
    monthsBenefit,
    monthlyBenefit,
    rawMonthlyBenefit,
    totalBenefit,
    avgSalary,
    maxBenefitCeiling,
    isCapped,
    employeeMonthlyContribution: Math.round(avgSalary * config.employeeContributionRate),
    employerMonthlyContribution: Math.round(avgSalary * config.employerContributionRate),
    regionalMin
  };
}

/**
 * Sinh bảng tra nhanh số năm đóng -> số tháng hưởng
 * @param {string} region
 * @param {number} salary
 * @param {Object} config
 * @returns {Array<{ yearsLabel: string, monthsRange: string, benefitMonths: number, monthlyBenefit: number, totalBenefit: number }>}
 */
export function generateQuickReferenceTable(region = 'I', salary = 10000000, config = UNEMPLOYMENT_CONFIG_2026) {
  const steps = [
    { label: 'Dưới 1 năm', months: 11, desc: 'Dưới 12 tháng' },
    { label: 'Đủ 1 năm đến 3 năm', months: 12, desc: '12 - 36 tháng' },
    { label: 'Đủ 4 năm', months: 48, desc: '37 - 48 tháng' },
    { label: 'Đủ 5 năm', months: 60, desc: '49 - 60 tháng' },
    { label: 'Đủ 6 năm', months: 72, desc: '61 - 72 tháng' },
    { label: 'Đủ 7 năm', months: 84, desc: '73 - 84 tháng' },
    { label: 'Đủ 8 năm', months: 96, desc: '85 - 96 tháng' },
    { label: 'Đủ 9 năm', months: 108, desc: '97 - 108 tháng' },
    { label: 'Đủ 10 năm', months: 120, desc: '109 - 120 tháng' },
    { label: 'Đủ 11 năm', months: 132, desc: '121 - 132 tháng' },
    { label: 'Đủ 12 năm', months: 144, desc: '133 - 144 tháng' },
    { label: 'Từ 13 năm trở lên', months: 156, desc: 'Từ 145 tháng trở lên' }
  ];

  return steps.map(step => {
    const res = calcUnemploymentBenefit({
      salary,
      months: step.months,
      region,
      config
    });
    return {
      yearsLabel: step.label,
      monthsRange: step.desc,
      benefitMonths: res.monthsBenefit,
      monthlyBenefit: res.monthlyBenefit,
      totalBenefit: res.totalBenefit
    };
  });
}
