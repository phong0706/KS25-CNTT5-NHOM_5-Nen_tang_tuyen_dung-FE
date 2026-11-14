/**
 * Kiểm thử nhanh các module tính toán (chạy bằng Node, không cần framework).
 *   node frontend/test_calc.mjs
 * Dùng để chốt lại công thức Gross-Net, thuế TNCN, lãi kép, kế hoạch tiết kiệm.
 */
import assert from "node:assert/strict";
import {
  calculateGrossToNet,
  calculateNetToGross,
} from "./js/calc/calcGrossNet.js";
import {
  calculatePitTax,
  calculateUnemploymentInsurance,
  calculateOneTimeSocialInsurance,
  calculateCompoundInterest,
  calculateSavingsPlan,
} from "./js/calc/calcTools.js";

const RULES = {
  personal_deduction: 11_000_000,
  dependent_deduction: 4_400_000,
  base_salary: 2_340_000,
  regional_minimums: { 1: 4_960_000, 2: 4_410_000, 3: 3_860_000, 4: 3_450_000 },
  insurance_rates: { social: 0.08, health: 0.015, unemployment: 0.01 },
  employer_insurance_rates: { social: 0.175, health: 0.03, unemployment: 0.01 },
  tax_brackets: [
    { threshold: 5_000_000, rate: 0.05 },
    { threshold: 10_000_000, rate: 0.10 },
    { threshold: 18_000_000, rate: 0.15 },
    { threshold: 32_000_000, rate: 0.20 },
    { threshold: 52_000_000, rate: 0.25 },
    { threshold: 80_000_000, rate: 0.30 },
    { threshold: 9_999_999_999, rate: 0.35 },
  ],
};

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    console.error(`  FAIL  ${name}\n        ${err.message}`);
    process.exitCode = 1;
  }
}

console.log("\n== calcGrossNet ==");

check("gross 0 -> net 0, khong no", () => {
  const r = calculateGrossToNet(0, RULES, { region: "1", dependents: 0 });
  assert.equal(r.net, 0);
  assert.equal(r.pitTax, 0);
  assert.equal(r.totalInsurance, 0);
});

check("gross am -> coi nhu 0", () => {
  const r = calculateGrossToNet(-5_000_000, RULES, { region: "1", dependents: 0 });
  assert.equal(r.gross, 0);
  assert.equal(r.net, 0);
});

check("bao hiem = 10.5% luong (duoi tran)", () => {
  const r = calculateGrossToNet(20_000_000, RULES, { region: "1", dependents: 0 });
  assert.equal(r.totalInsurance, Math.round(20_000_000 * 0.105));
});

check("net = gross - bao hiem - thue", () => {
  const r = calculateGrossToNet(30_000_000, RULES, { region: "1", dependents: 0 });
  assert.equal(r.net, 30_000_000 - r.totalInsurance - r.pitTax);
});

check("giam tru: nguoi phu thuoc lam giam thue", () => {
  const a = calculateGrossToNet(30_000_000, RULES, { region: "1", dependents: 0 });
  const b = calculateGrossToNet(30_000_000, RULES, { region: "1", dependents: 2 });
  assert.ok(b.pitTax < a.pitTax, "them nguoi phu thuoc phai giam thue");
});

check("thue bac 1 + bac 2 (luy tien tung phan)", () => {
  // gross 20tr -> insurance 2.1tr -> thu nhap chiu thue 17.9tr -> taxable 6.9tr
  // 5tr*5% = 250k ; 1.9tr*10% = 190k -> 440k
  const r = calculateGrossToNet(20_000_000, RULES, { region: "1", dependents: 0 });
  const taxable = 20_000_000 - r.totalInsurance - 11_000_000;
  assert.equal(r.taxableIncome, taxable);
  const expected = 5_000_000 * 0.05 + (taxable - 5_000_000) * 0.10;
  assert.equal(r.pitTax, Math.round(expected));
});

check("tran bao hiem 20x luong co so", () => {
  const r = calculateGrossToNet(100_000_000, RULES, { region: "1", dependents: 0 });
  const cap = 2_340_000 * 20;
  assert.equal(r.insuranceDetail.social, Math.round(cap * 0.08));
});

check("Net -> Gross: khoi hoi dung muc tieu", () => {
  const target = 20_000_000;
  const r = calculateNetToGross(target, RULES, { region: "1", dependents: 0 });
  assert.ok(Math.abs(r.net - target) <= 2, `net=${r.net} lech qua 2 so voi ${target}`);
});

check("Net -> Gross voi muc tieu 0 khong treo", () => {
console.log("\n== calcTools ==");

check("thue TNCN bac luy tien dung", () => {
  // taxable = 20tr - 11tr = 9tr -> 5tr*5% + 4tr*10% = 650k
  const r = calculatePitTax(20_000_000, RULES, 0);
  assert.equal(r.taxable, 9_000_000);
  assert.equal(r.totalTax, 650_000);
});

check("thue TNCN: bac cuoi 'tro len' duoc xu ly", () => {
  const r = calculatePitTax(200_000_000, RULES, 0);
  const expected =
    5_000_000 * 0.05 +
    5_000_000 * 0.10 +
    8_000_000 * 0.15 +
    14_000_000 * 0.20 +
    20_000_000 * 0.25 +
    28_000_000 * 0.30 +
    (189_000_000 - 80_000_000) * 0.35;
  assert.equal(r.totalTax, Math.round(expected));
});

check("thue TNCN chi tiet bac day du 7 bac", () => {
  const r = calculatePitTax(200_000_000, RULES, 0);
  assert.equal(r.details.length, 7);
});

check("BHTN: < 12 thang khong du dieu kien", () => {
  const r = calculateUnemploymentInsurance(20_000_000, 6, { benefit_rate: 0.6 });
  assert.equal(r.eligible, false);
});

check("BHTN: 12-36 thang -> 3 thang huong", () => {
  const r = calculateUnemploymentInsurance(20_000_000, 24, { benefit_rate: 0.6 });
  assert.equal(r.eligible, true);
  assert.equal(r.benefitMonths, 3);
  assert.equal(r.monthlyBenefit, 12_000_000);
});

check("BHTN: so thang huong theo Dieu 46 Luat Viec lam 2013", () => {
  const monthsOf = (m) => calculateUnemploymentInsurance(20_000_000, m, { benefit_rate: 0.6 }).benefitMonths;
  assert.equal(monthsOf(12), 3);   // 12-36 thang -> 3
  assert.equal(monthsOf(36), 3);
  assert.equal(monthsOf(37), 4);   // 37-60 -> 4
  assert.equal(monthsOf(60), 4);
  assert.equal(monthsOf(61), 5);   // 61-84 -> 5
  assert.equal(monthsOf(84), 5);
  assert.equal(monthsOf(85), 6);   // 85-120 -> 6
  assert.equal(monthsOf(120), 6);
  assert.equal(monthsOf(121), 8);  // >120 -> 8 (toi da)
  assert.equal(monthsOf(240), 8);
});

check("BHTN: muc huong bi chan tren 8 thang", () => {
  const r = calculateUnemploymentInsurance(20_000_000, 300, { benefit_rate: 0.6 });
  assert.ok(r.benefitMonths <= 8, `benefitMonths=${r.benefitMonths}`);
});

check("BHXH 1 lan: truoc 2014 x1.5, tu 2014 x2.0", () => {
  const r = calculateOneTimeSocialInsurance(10_000_000, 10, 5, {
    rate_before_2014: 1.5, rate_from_2014: 2.0,
  });
  assert.equal(r.totalBenefit, Math.round(10_000_000 * (10 * 1.5 + 5 * 2.0)));
});

check("lai kep: 100tr, 10%/nam, 12 nam", () => {
  const r = calculateCompoundInterest(100_000_000, 10, 12, 12);
  assert.equal(r.totalAmount, Math.round(100_000_000 * Math.pow(1 + 0.1 / 12, 144)));
  assert.ok(r.interestEarned > 0);
});

check("lai kep: lai suat am bi chan ve 0", () => {
  const r = calculateCompoundInterest(100_000_000, -5, 12, 12);
  assert.equal(r.totalAmount, 100_000_000);
  assert.equal(r.interestEarned, 0);
});

check("lai kep: so nam 0 -> khong lai", () => {
  const r = calculateCompoundInterest(100_000_000, 10, 0, 12);
  assert.equal(r.totalAmount, 100_000_000);
});

check("ke hoach tiet kiem: FV dung voi PMT", () => {
  const r = calculateSavingsPlan(500_000_000, 8, 24);
  const i = 0.08 / 12;
  const fv = r.monthlyDeposit * (((Math.pow(1 + i, 24) - 1) / i) * (1 + i));
  assert.ok(Math.abs(fv - 500_000_000) < 5000, `FV=${fv}`);
  assert.ok(r.interestEarned >= 0);
});

check("ke hoach tiet kiem: lai 0% -> gop deu", () => {
  const r = calculateSavingsPlan(24_000_000, 0, 24);
  assert.equal(r.monthlyDeposit, 1_000_000);
  assert.equal(r.interestEarned, 0);
});

console.log(`\n==> ${passed} test PASS`);
if (process.exitCode) console.error("==> CO TEST FAIL");

  const r = calculateNetToGross(0, RULES, { region: "1", dependents: 0 });
  assert.equal(r.net, 0);
  assert.equal(r.gross, 0);
});

check("Net -> Gross muc tieu rat lon van hoi tu", () => {
  const target = 500_000_000;
  const r = calculateNetToGross(target, RULES, { region: "1", dependents: 0 });
  assert.ok(Math.abs(r.net - target) <= 2, `net=${r.net}`);
});
