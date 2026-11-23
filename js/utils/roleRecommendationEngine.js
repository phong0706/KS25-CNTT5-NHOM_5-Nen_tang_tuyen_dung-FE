/**
 * roleRecommendationEngine.js - Hàm chấm điểm thuần và xếp hạng định hướng vai trò
 * Giới hạn: < 200 dòng.
 */
import { ROLE_QUIZ_QUESTIONS } from "../config/roleQuizConfig.js";

function normalizeStr(s) {
  return String(s || "").trim().toLowerCase();
}

function extractTopCategorySkills(jobs, limit = 6) {
  const counts = new Map();
  for (const job of jobs || []) {
    const list = Array.isArray(job.skills) ? job.skills : [];
    for (const sk of list) {
      const name = typeof sk === "string" ? sk.trim() : (sk?.name || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const current = counts.get(key) || { name, count: 0 };
      current.count += 1;
      counts.set(key, current);
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((x) => x.name);
}

export function computeRoleRecommendations({
  answers = [],
  candidateSkills = [],
  categoryFacets = [],
  jobsByCategory = {},
}) {
  const categoryScores = new Map();
  const maxPossible = new Map();

  ROLE_QUIZ_QUESTIONS.forEach((q, qIndex) => {
    const chosenIndex = answers[qIndex];
    const option = q.options[chosenIndex];

    q.options.forEach((opt) => {
      Object.entries(opt.weights || {}).forEach(([cat, w]) => {
        maxPossible.set(cat, (maxPossible.get(cat) || 0) + w);
      });
    });

    if (option && option.weights) {
      Object.entries(option.weights).forEach(([cat, w]) => {
        categoryScores.set(cat, (categoryScores.get(cat) || 0) + w);
      });
    }
  });

  const normCandidateSkills = (candidateSkills || []).map(normalizeStr);
  const results = [];

  categoryFacets.forEach((facet) => {
    const slug = facet.value;
    const name = facet.label || slug;
    const jobCount = Number(facet.count || 0);

    // Bỏ qua vai trò không có tin tuyển dụng nào đang mở
    if (jobCount <= 0) return;

    const rawScore = categoryScores.get(slug) || 0;
    const maxScore = Math.max(maxPossible.get(slug) || 32, 1);
    const quizPct = Math.min(100, Math.max(10, Math.round((rawScore / maxScore) * 100)));

    const roleJobs = jobsByCategory[slug] || [];
    const topSkills = extractTopCategorySkills(roleJobs, 8);

    const matched = [];
    const missing = [];

    topSkills.forEach((skillName) => {
      if (normCandidateSkills.includes(normalizeStr(skillName))) {
        matched.push(skillName);
      } else {
        missing.push(skillName);
      }
    });

    let finalScore = quizPct;
    if (normCandidateSkills.length > 0 && topSkills.length > 0) {
      const skillMatchRatio = matched.length / Math.min(topSkills.length, 5);
      finalScore = Math.round(quizPct * 0.7 + skillMatchRatio * 100 * 0.3);
    }
    finalScore = Math.max(15, Math.min(99, finalScore));

    const sampleJobs = roleJobs.slice(0, 3).map((j) => ({
      id: j.id,
      title: j.title,
      company_name: j.company_name,
      company_logo: j.company_logo,
      location: j.location,
      salary_min: j.salary_min,
      salary_max: j.salary_max,
      is_salary_negotiable: Boolean(j.is_salary_negotiable),
    }));

    results.push({
      category_slug: slug,
      role_name: name,
      score: finalScore,
      job_count: jobCount,
      matched_skills: matched,
      missing_skills: missing.slice(0, 3),
      top_skills: topSkills.slice(0, 5),
      sample_jobs: sampleJobs,
    });
  });

  // Thứ tự sắp xếp: Điểm phù hợp giảm dần -> Số tin đang mở giảm dần -> Tên vai trò A-Z
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.job_count !== a.job_count) return b.job_count - a.job_count;
    return a.role_name.localeCompare(b.role_name);
  });

  return results;
}
