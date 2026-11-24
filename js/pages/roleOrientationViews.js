/**
 * roleOrientationViews.js - Render HTML cho công cụ Định hướng vai trò
 * Giới hạn: < 200 dòng.
 */

function esc(v) {
  const d = document.createElement("div");
  d.textContent = v ?? "";
  return d.innerHTML;
}

export function renderQuizView({ q, index, total, selectedOptionIndex }) {
  const pct = Math.round(((index + 1) / total) * 100);
  const optionsHtml = q.options.map((opt, i) => {
    const isChecked = selectedOptionIndex === i;
    return `
      <label class="role-quiz-option ${isChecked ? "active" : ""}">
        <input type="radio" name="quiz_opt" value="${i}" ${isChecked ? "checked" : ""} />
        <span class="role-quiz-option-text">${esc(opt.text)}</span>
      </label>
    `;
  }).join("");

  return `
    <div class="role-quiz-wrapper">
      <div class="role-quiz-card">
        <div class="role-quiz-header">
          <div class="role-quiz-progress-meta">
            <span>Câu hỏi ${index + 1} / ${total}</span>
            <span>${pct}%</span>
          </div>
          <div class="role-quiz-track" role="progressbar" aria-valuenow="${index + 1}" aria-valuemin="1" aria-valuemax="${total}">
            <div class="role-quiz-fill" style="width: ${pct}%"></div>
          </div>
        </div>
        <h2 class="role-quiz-title">${esc(q.question)}</h2>
        <div class="role-quiz-options" id="quiz-options-list">${optionsHtml}</div>
        <div class="role-quiz-actions">
          <button type="button" class="role-btn role-btn-outline" id="quiz-btn-prev" ${index === 0 ? "disabled" : ""}>
            ← Quay lại
          </button>
          <button type="button" class="role-btn role-btn-primary" id="quiz-btn-next" ${selectedOptionIndex === null || selectedOptionIndex === undefined ? "disabled" : ""}>
            ${index === total - 1 ? "Xem kết quả →" : "Tiếp theo →"}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderResultView({ results, candidateSkills = [], isLoggedIn = false }) {
  const disclaimerHtml = `
    <div class="role-disclaimer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      <div><strong>Lưu ý:</strong> Kết quả là gợi ý dựa trên tin tuyển dụng đang mở, không phải đánh giá năng lực hay tính cách.</div>
    </div>
  `;

  let skillsNoticeHtml = "";
  if (isLoggedIn && candidateSkills.length < 3) {
    skillsNoticeHtml = `
      <div class="role-skills-notice">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <div>Hồ sơ của bạn hiện có ít hơn 3 kỹ năng (${candidateSkills.length} kỹ năng). <a href="../pages/candidate/profile.html">Cập nhật thêm kỹ năng</a> để nhận gợi ý chuẩn xác hơn theo thị trường.</div>
      </div>
    `;
  }

  const itemsHtml = results.map((r, i) => {
    const isTop = i === 0;
    const matchedHtml = r.matched_skills.map((s) => `<span class="role-tag role-tag-matched">✓ ${esc(s)}</span>`).join("");
    const missingHtml = r.missing_skills.map((s) => `<span class="role-tag role-tag-missing">+ ${esc(s)}</span>`).join("");

    const sampleJobsHtml = (r.sample_jobs || []).map((j) => {
      const sal = j.is_salary_negotiable ? "Thỏa thuận" : (j.salary_min && j.salary_max ? `${j.salary_min / 1e6} - ${j.salary_max / 1e6} triệu` : "Lương hấp dẫn");
      return `
        <a href="../pages/job-detail.html?id=${j.id}" class="role-sample-job-link" target="_blank">
          <div>
            <span class="role-sample-job-title">${esc(j.title)}</span>
            <span style="color:var(--text-secondary); font-size:12px; margin-left:8px;">${esc(j.company_name)}</span>
          </div>
          <span style="font-size:12px; font-weight:600; color:#0f766e;">${esc(sal)}</span>
        </a>
      `;
    }).join("");

    return `
      <div class="role-result-item ${isTop ? "top-match" : ""}">
        <div class="role-result-header">
          <div>
            <div class="role-result-name">${i + 1}. ${esc(r.role_name)} ${isTop ? '<span style="font-size:12px; color:#0d9488; font-weight:700;">★ Phù hợp nhất</span>' : ""}</div>
          </div>
          <div class="role-result-badges">
            <span class="role-score-badge">Độ phù hợp: ${r.score}%</span>
            <span class="role-jobs-badge">${r.job_count} việc đang mở</span>
          </div>
        </div>
        <div class="role-skills-section">
          ${matchedHtml ? `<div><strong>Kỹ năng đã có:</strong> ${matchedHtml}</div>` : ""}
          ${missingHtml ? `<div style="margin-top:4px;"><strong>Kỹ năng nên bổ sung:</strong> ${missingHtml}</div>` : ""}
        </div>
        ${sampleJobsHtml ? `<div class="role-sample-jobs"><div style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Việc làm tiêu biểu từ doanh nghiệp tuyển dụng:</div>${sampleJobsHtml}</div>` : ""}
      </div>
    `;
  }).join("");

  return `
    <div class="role-quiz-wrapper">
      <div class="role-quiz-card">
        <h1 style="font-size:24px; font-weight:700; color:var(--text-main, #0f172a); margin-bottom:16px;">
          Kết quả định hướng vai trò IT
        </h1>
        ${disclaimerHtml}
        ${skillsNoticeHtml}
        <div class="role-results-list">${itemsHtml}</div>
        <div class="role-quiz-actions" style="margin-top:24px;">
          <button type="button" class="role-btn role-btn-outline" id="btn-retake-quiz">
            ↺ Làm lại trắc nghiệm
          </button>
          <button type="button" class="role-btn role-btn-primary" id="btn-save-quiz-result">
            💾 Lưu vào hồ sơ
          </button>
        </div>
      </div>
    </div>
  `;
}
