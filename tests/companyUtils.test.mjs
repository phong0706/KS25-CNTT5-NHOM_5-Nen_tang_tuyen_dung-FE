import test from "node:test";
import assert from "node:assert/strict";
import {
  COMPANY_PALETTES,
  buildCompaniesSearchParams,
  companyColorIndex,
  companyInitials,
  coverPattern,
  formatDomain,
  formatSalaryRangeShort,
  formatSizeRange,
  parseCompaniesUrlState,
  safeUrl,
} from "../js/utils/companyUtils.js";

const SEED_COMPANIES = [
  { slug: "rikkeisoft", name: "Rikkeisoft" },
  { slug: "vng-corporation", name: "VNG Corporation" },
  { slug: "fpt-software", name: "FPT Software" },
  { slug: "viettel-solutions", name: "Viettel Solutions" },
  { slug: "momo", name: "MoMo (M-Service)" },
  { slug: "vnpt-it", name: "VNPT IT" },
  { slug: "dai-duong-digital-labs", name: "Đại Dương Digital Labs" },
  { slug: "sao-khue-cloud-labs", name: "Sao Khuê Cloud Labs" },
  { slug: "trung-tam-ai-sao-phuong-nam", name: "Trung tâm Nghiên cứu và Phát triển Hạ tầng Trí tuệ Nhân tạo Sao Phương Nam" },
  { slug: "phan-mem-nhung-hai-dang", name: "Phần mềm Nhúng Hải Đăng" },
  { slug: "cong-ty-noi-bo-an", name: "Doanh nghiệp Công nghệ Nội bộ Ẩn" },
  { slug: "an-ninh-mang-lam-son", name: "An ninh mạng Lam Sơn" },
  { slug: "du-lieu-lon-cuu-long", name: "Dữ liệu lớn Cửu Long" },
  { slug: "tu-dong-hoa-kiem-thu-anh-duong", name: "Tự động hóa Kiểm thử Ánh Dương" },
];

test("companyInitials xu ly bo dau, rong, emoji, ky tu dac biet", () => {
  assert.equal(companyInitials("Đại Dương Digital Labs"), "DD");
  assert.equal(companyInitials("Phần mềm Nhúng Hải Đăng"), "PM");
  assert.equal(companyInitials("Rikkeisoft"), "RI");
  assert.equal(companyInitials(""), "CT");
  assert.equal(companyInitials(null), "CT");
  assert.equal(companyInitials("🚀🎉✨"), "CT");
  assert.equal(companyInitials("  --- !!! --- "), "CT");
  assert.equal(companyInitials("X"), "XX");
});

test("companyColorIndex on dinh va khong trung ca chu cai lan mau tren 14 cong ty seed", () => {
  const pairs = new Set();
  for (const comp of SEED_COMPANIES) {
    const idx = companyColorIndex(comp.slug);
    assert.ok(idx >= 0 && idx < COMPANY_PALETTES.length);
    assert.equal(idx, companyColorIndex(comp.slug));
    const pair = `${companyInitials(comp.name)}#${idx}`;
    assert.equal(pairs.has(pair), false, `Trung cap chu cai + mau: ${pair}`);
    pairs.add(pair);
  }
});

test("coverPattern tra ve SVG du phong deterministic khong dung anh ngoai", () => {
  const a1 = coverPattern("dai-duong-digital-labs");
  const a2 = coverPattern("dai-duong-digital-labs");
  assert.deepEqual(a1, a2);
  assert.ok(a1.dataUrl.startsWith("data:image/svg+xml;charset=utf-8,"));
  assert.ok(a1.dotSpacing > 0 && a1.gradientStart.startsWith("#"));
});

test("safeUrl chan javascript:, data:, file:, ky tu la va ho tro uploads hop le", () => {
  assert.equal(safeUrl("https://daiduonglabs.example.vn"), "https://daiduonglabs.example.vn/");
  assert.equal(safeUrl("http://example.vn/gioi-thieu"), "http://example.vn/gioi-thieu");
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("  JaVaScRiPt:void(0)"), null);
  assert.equal(safeUrl("data:text/html,<script>alert(1)</script>"), null);
  assert.equal(safeUrl("vbscript:msgbox(1)"), null);
  assert.equal(safeUrl("file:///etc/passwd"), null);
  assert.equal(safeUrl("https://a.vn/\u0000x"), null);
  assert.equal(safeUrl("http://insecure.vn/logo.png", ["https:"]), null);
  assert.equal(safeUrl("/uploads/logos/a.webp", ["https:"], { allowRelativeUploads: true }), "/uploads/logos/a.webp");
  assert.equal(safeUrl("/uploads/../etc/passwd", ["https:"], { allowRelativeUploads: true }), null);
  assert.equal(safeUrl(null), null);
});

test("formatSizeRange, formatDomain va formatSalaryRangeShort", () => {
  assert.equal(formatSizeRange("51-200"), "51 - 200 nhân viên");
  assert.equal(formatSizeRange("1000+"), "1.000+ nhân viên");
  assert.equal(formatSizeRange(""), "");
  assert.equal(formatDomain("https://www.daiduonglabs.example.vn/careers"), "daiduonglabs.example.vn");
  assert.equal(formatDomain("javascript:alert(1)"), "");
  assert.equal(formatSalaryRangeShort({ min: 18000000, max: 52000000 }), "18 - 52 Tr");
  assert.equal(formatSalaryRangeShort(null), "");
});

test("parseCompaniesUrlState va buildCompaniesSearchParams", () => {
  const def = parseCompaniesUrlState("");
  assert.deepEqual(def, {
    q: "",
    industry: "",
    location: "",
    size: "",
    hiring: 1,
    sort: "jobs",
    page: 1,
  });

  const parsed = parseCompaniesUrlState("?q=+dong+a+&industry=Backend&hiring=0&sort=recent&page=-3");
  assert.deepEqual(parsed, {
    q: "dong a",
    industry: "backend",
    location: "",
    size: "",
    hiring: 0,
    sort: "recent",
    page: 1,
  });

  const qs = buildCompaniesSearchParams({
    q: "ngan hang",
    industry: "backend",
    location: "ha-noi",
    size: "201-500",
    hiring: 0,
    sort: "name",
    page: 2,
  }).toString();
  assert.equal(qs, "q=ngan+hang&industry=backend&location=ha-noi&size=201-500&hiring=0&sort=name&page=2");
});
