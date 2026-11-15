/**
 * Module quản lý render form nhập liệu và đồng bộ hai chiều với cvData.
 * Tuân thủ techrecruit-rules: cấm innerHTML không an toàn, file <200 dòng.
 */
import { safeEscape } from "./cvRenderHelpers.js";

function renderExpCards(list) {
  return (list || []).map((exp, idx) => `
    <div class="cv-dynamic-card" data-exp-idx="${idx}">
      <button type="button" class="cv-btn-del" data-action="del-exp" data-idx="${idx}" aria-label="Xoá kinh nghiệm">Xoá</button>
      <div style="font-weight:700; font-size:13px; margin-bottom:8px;">Kinh nghiệm #${idx + 1}</div>
      <div class="cv-field"><label>Vị trí</label><input type="text" data-field="title" value="${safeEscape(exp.title || "")}" placeholder="VD: Frontend Engineer"></div>
      <div class="cv-field"><label>Công ty</label><input type="text" data-field="company" value="${safeEscape(exp.company || "")}" placeholder="VD: Rikkei Digital"></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div class="cv-field"><label>Bắt đầu (YYYY-MM)</label><input type="text" data-field="start_month" value="${safeEscape(exp.start_month || "")}" placeholder="2022-03"></div>
        <div class="cv-field"><label>Kết thúc</label><input type="text" data-field="end_month" value="${safeEscape(exp.end_month || "")}" placeholder="Trống nếu hiện tại"></div>
      </div>
      <div class="cv-field"><label>Mô tả & Thành tích</label><textarea data-field="description">${safeEscape(exp.description || "")}</textarea></div>
    </div>`).join("");
}

function renderEduCards(list) {
  return (list || []).map((edu, idx) => `
    <div class="cv-dynamic-card" data-edu-idx="${idx}">
      <button type="button" class="cv-btn-del" data-action="del-edu" data-idx="${idx}" aria-label="Xoá học vấn">Xoá</button>
      <div style="font-weight:700; font-size:13px; margin-bottom:8px;">Học vấn #${idx + 1}</div>
      <div class="cv-field"><label>Trường</label><input type="text" data-field="school" value="${safeEscape(edu.school || "")}" placeholder="Đại học Bách Khoa"></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div class="cv-field"><label>Chuyên ngành</label><input type="text" data-field="major" value="${safeEscape(edu.major || "")}"></div>
        <div class="cv-field"><label>Bằng cấp</label><input type="text" data-field="degree" value="${safeEscape(edu.degree || "")}"></div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div class="cv-field"><label>Năm bắt đầu</label><input type="text" data-field="start_year" value="${safeEscape(edu.start_year || "")}"></div>
        <div class="cv-field"><label>Năm tốt nghiệp</label><input type="text" data-field="end_year" value="${safeEscape(edu.end_year || "")}"></div>
      </div>
      <div class="cv-field"><label>Ghi chú</label><textarea data-field="description">${safeEscape(edu.description || "")}</textarea></div>
    </div>`).join("");
}

export function bindForm(containerEl, cvData, onDataChange) {
  if (!containerEl) return;

  containerEl.innerHTML = `
    <div class="cv-form-section">
      <div class="cv-sec-heading">1. Thông tin cá nhân</div>
      <div class="cv-field"><label>Họ và tên *</label><input type="text" id="f-full_name" value="${safeEscape(cvData.full_name || "")}"></div>
      <div class="cv-field"><label>Chức danh mong muốn *</label><input type="text" id="f-headline" value="${safeEscape(cvData.headline || "")}"></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div class="cv-field"><label>Email *</label><input type="email" id="f-email" value="${safeEscape(cvData.email || "")}"></div>
        <div class="cv-field"><label>Điện thoại *</label><input type="tel" id="f-phone" value="${safeEscape(cvData.phone || "")}"></div>
      </div>
      <div class="cv-field"><label>Địa điểm</label><input type="text" id="f-location" value="${safeEscape(cvData.location || "")}"></div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div class="cv-field"><label>LinkedIn</label><input type="text" id="f-linkedin_url" value="${safeEscape(cvData.linkedin_url || "")}"></div>
        <div class="cv-field"><label>GitHub / Web</label><input type="text" id="f-github_url" value="${safeEscape(cvData.github_url || "")}"></div>
      </div>
    </div>
    <div class="cv-form-section">
      <div class="cv-sec-heading">2. Giới thiệu bản thân</div>
      <div class="cv-field"><textarea id="f-bio" rows="3">${safeEscape(cvData.bio || "")}</textarea></div>
    </div>
    <div class="cv-form-section">
      <div class="cv-sec-heading">3. Kỹ năng (phân tách bởi dấu phẩy)</div>
      <div class="cv-field"><textarea id="f-skills" rows="3">${safeEscape((cvData.skills || []).join(", "))}</textarea></div>
    </div>
    <div class="cv-form-section">
      <div class="cv-sec-heading">
        <span>4. Kinh nghiệm làm việc</span>
        <button type="button" class="btn btn-outline" id="btn-add-exp" style="font-size:12px; padding:3px 8px;">+ Thêm</button>
      </div>
      <div id="exp-list-container">${renderExpCards(cvData.experiences)}</div>
    </div>
    <div class="cv-form-section">
      <div class="cv-sec-heading">
        <span>5. Học vấn & Bằng cấp</span>
        <button type="button" class="btn btn-outline" id="btn-add-edu" style="font-size:12px; padding:3px 8px;">+ Thêm</button>
      </div>
      <div id="edu-list-container">${renderEduCards(cvData.educations)}</div>
    </div>`;

  ["full_name", "headline", "email", "phone", "location", "linkedin_url", "github_url", "bio"].forEach((k) => {
    const el = document.getElementById(`f-${k}`);
    if (el) el.addEventListener("input", (e) => { cvData[k] = e.target.value; onDataChange(); });
  });

  const skillsEl = document.getElementById("f-skills");
  if (skillsEl) {
    skillsEl.addEventListener("input", (e) => {
      cvData.skills = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
      onDataChange();
    });
  }

  containerEl.addEventListener("input", (e) => {
    const card = e.target.closest(".cv-dynamic-card");
    if (!card) return;
    const f = e.target.getAttribute("data-field");
    if (!f) return;
    const expIdx = card.getAttribute("data-exp-idx");
    const eduIdx = card.getAttribute("data-edu-idx");
    if (expIdx !== null && cvData.experiences[Number(expIdx)]) {
      cvData.experiences[Number(expIdx)][f] = e.target.value;
      onDataChange();
    } else if (eduIdx !== null && cvData.educations[Number(eduIdx)]) {
      cvData.educations[Number(eduIdx)][f] = e.target.value;
      onDataChange();
    }
  });

  containerEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.id === "btn-add-exp") {
      cvData.experiences = cvData.experiences || [];
      cvData.experiences.push({ title: "", company: "", start_month: "", end_month: "", description: "" });
      bindForm(containerEl, cvData, onDataChange);
      onDataChange();
    } else if (btn.id === "btn-add-edu") {
      cvData.educations = cvData.educations || [];
      cvData.educations.push({ school: "", major: "", degree: "", start_year: "", end_year: "", description: "" });
      bindForm(containerEl, cvData, onDataChange);
      onDataChange();
    } else if (btn.dataset.action === "del-exp") {
      cvData.experiences.splice(Number(btn.dataset.idx), 1);
      bindForm(containerEl, cvData, onDataChange);
      onDataChange();
    } else if (btn.dataset.action === "del-edu") {
      cvData.educations.splice(Number(btn.dataset.idx), 1);
      bindForm(containerEl, cvData, onDataChange);
      onDataChange();
    }
  });
}
