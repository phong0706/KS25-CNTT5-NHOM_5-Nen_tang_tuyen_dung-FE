import test from "node:test";
import assert from "node:assert/strict";
import { CvUploader } from "../js/components/cvUploader.js";

const uploader = new CvUploader({ container: { innerHTML: "", querySelector: () => ({ addEventListener: () => {} }) } });

test("CvUploader validate: tu choi file null / undefined", () => {
  assert.equal(uploader.validate(null), "Vui lòng chọn một file.");
  assert.equal(uploader.validate(undefined), "Vui lòng chọn một file.");
});

test("CvUploader validate: tu choi file 0 byte", () => {
  const file0 = { name: "my_cv.pdf", size: 0, type: "application/pdf" };
  assert.equal(uploader.validate(file0), "File rỗng (0 byte). Vui lòng chọn file hợp lệ.");
});

test("CvUploader validate: tu choi file duoi 1 KB", () => {
  const fileSmall = { name: "test.pdf", size: 500, type: "application/pdf" };
  assert.equal(uploader.validate(fileSmall), "Dung lượng file quá nhỏ (tối thiểu 1 KB). Vui lòng chọn file hợp lệ.");
});

test("CvUploader validate: tu choi file vuot 5 MB", () => {
  const fileBig = { name: "big.pdf", size: 6 * 1024 * 1024, type: "application/pdf" };
  assert.equal(uploader.validate(fileBig), "Dung lượng file vượt quá 5MB. Vui lòng chọn file nhỏ hơn.");
});

test("CvUploader validate: tu choi sai dinh dang", () => {
  const fileExe = { name: "malicious.exe", size: 2048, type: "application/x-msdownload" };
  assert.equal(uploader.validate(fileExe), "Định dạng file không hợp lệ. Vui lòng chọn file PDF, DOC hoặc DOCX.");
});

test("CvUploader validate: chap nhan file PDF hop le", () => {
  const validPdf = { name: "resume.pdf", size: 2500, type: "application/pdf" };
  assert.equal(uploader.validate(validPdf), null);
});

test("CvUploader validate: chap nhan file DOC / DOCX hop le", () => {
  const validDoc = { name: "resume.docx", size: 5000, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  assert.equal(uploader.validate(validDoc), null);
});
