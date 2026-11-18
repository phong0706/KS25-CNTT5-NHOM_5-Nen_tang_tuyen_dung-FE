import test from "node:test";
import assert from "node:assert/strict";
import {
  jobDetailUrl,
  savedJobsUrl,
  appliedJobsUrl,
  companyUrl,
  jobsUrl,
  loginUrl,
  cvBuilderUrl,
  candidateProfileUrl,
  routePath,
} from "../js/routes.js";

test("routes.js: trả đường dẫn tuyệt đối khi máy chủ phục vụ từ thư mục cha base (/frontend/...)", () => {
  const fromCandidate = "/frontend/pages/candidate/saved-jobs.html";
  assert.equal(jobDetailUrl(95, fromCandidate), "/frontend/pages/job-detail.html?id=95");
  assert.equal(savedJobsUrl(fromCandidate), "/frontend/pages/candidate/saved-jobs.html");
  assert.equal(appliedJobsUrl(fromCandidate), "/frontend/pages/candidate/applications.html");
  assert.equal(companyUrl("fpt-software", fromCandidate), "/frontend/pages/company.html?slug=fpt-software");
  assert.equal(jobsUrl({ category: "backend" }, fromCandidate), "/frontend/pages/jobs.html?category=backend");
});

test("routes.js: trả đường dẫn tuyệt đối khi máy chủ phục vụ trực tiếp từ thư mục frontend (/pages/...)", () => {
  const fromDirect = "/pages/candidate/saved-jobs.html";
  assert.equal(jobDetailUrl(95, fromDirect), "/pages/job-detail.html?id=95");
  assert.equal(savedJobsUrl(fromDirect), "/pages/candidate/saved-jobs.html");
  assert.equal(appliedJobsUrl(fromDirect), "/pages/candidate/applications.html");
  assert.equal(companyUrl(12, fromDirect), "/pages/company.html?slug=12");
});

test("routes.js: xử lý ca biên (tham số đặc biệt, liên kết ngoài, hash và redirect)", () => {
  const ctx = "/frontend/pages/candidate/applications.html";
  assert.equal(jobDetailUrl("95&x=1", ctx), "/frontend/pages/job-detail.html?id=95%26x%3D1");
  assert.equal(loginUrl("/frontend/pages/candidate/saved-jobs.html", ctx), "/frontend/pages/login.html?redirect=%2Ffrontend%2Fpages%2Fcandidate%2Fsaved-jobs.html");
  assert.equal(cvBuilderUrl({ id: 7, template: "simple" }, ctx), "/frontend/pages/candidate/cv-builder.html?id=7&template=simple");
  assert.equal(candidateProfileUrl("section-skills", ctx), "/frontend/pages/candidate/profile.html#section-skills");
  assert.equal(routePath("https://example.com", ctx), "https://example.com");
  assert.equal(routePath("#top", ctx), "#top");
});
