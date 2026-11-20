/**
 * roleOrientation.js - Trình điều khiển công cụ Định hướng vai trò IT
 * Giới hạn: < 200 dòng.
 */
import { ROLE_QUIZ_QUESTIONS } from "../config/roleQuizConfig.js";
import { computeRoleRecommendations } from "../utils/roleRecommendationEngine.js";
import { renderQuizView, renderResultView } from "./roleOrientationViews.js";

export async function initRoleOrientation(containerEl) {
  if (!containerEl) return;

  containerEl.innerHTML = `
    <div style="text-align:center; padding:60px 16px;">
      <div class="spinner" style="margin:0 auto 16px; width:36px; height:36px; border:3px solid #e2e8f0; border-top-color:#0d9488; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
      <p style="color:var(--text-secondary); font-size:15px;">Đang tải dữ liệu việc làm thực tế từ hệ thống...</p>
    </div>
  `;

  let categoryFacets = [];
  const jobsByCategory = {};
  let candidateSkills = [];
  const user = window.auth?.getUser ? window.auth.getUser() : null;
  const isLoggedIn = Boolean(user && user.role === "candidate");
  const apiBase = (window.CONFIG && window.CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";

  try {
    const jobsRes = await fetch(`${apiBase}/jobs?page=1&page_size=20`);
    if (jobsRes.ok) {
      const data = await jobsRes.json();
      categoryFacets = data?.facets?.category || [];
    }

    const activeFacets = categoryFacets.filter((f) => Number(f.count) > 0);
    await Promise.all(
      activeFacets.map(async (f) => {
        try {
          const res = await fetch(`${apiBase}/jobs?category=${encodeURIComponent(f.value)}&page_size=10`);
          if (res.ok) {
            const d = await res.json();
            jobsByCategory[f.value] = d.items || [];
          }
        } catch (e) {
          jobsByCategory[f.value] = [];
        }
      })
    );

    if (isLoggedIn) {
      try {
        const token = window.auth?.getToken ? window.auth.getToken() : "";
        const pRes = await fetch(`${apiBase}/candidate/profile`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          candidateSkills = (pData?.skills || []).map((s) => (typeof s === "string" ? s : s?.name || ""));
        }
      } catch (e) {
        candidateSkills = [];
      }
    }
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu việc làm:", err);
  }

  let currentIndex = 0;
  const totalQuestions = ROLE_QUIZ_QUESTIONS.length;
  const answers = new Array(totalQuestions).fill(null);
  let latestResults = [];

  function showQuestion(index) {
    currentIndex = index;
    const q = ROLE_QUIZ_QUESTIONS[index];
    containerEl.innerHTML = renderQuizView({
      q,
      index,
      total: totalQuestions,
      selectedOptionIndex: answers[index],
    });

    const optInputs = containerEl.querySelectorAll('input[name="quiz_opt"]');
    optInputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        const val = parseInt(e.target.value, 10);
        answers[currentIndex] = val;
        containerEl.querySelectorAll(".role-quiz-option").forEach((el, idx) => {
          el.classList.toggle("active", idx === val);
        });
        const nextBtn = document.getElementById("quiz-btn-next");
        if (nextBtn) nextBtn.disabled = false;
      });
    });

    const prevBtn = document.getElementById("quiz-btn-prev");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) showQuestion(currentIndex - 1);
      });
    }

    const nextBtn = document.getElementById("quiz-btn-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (answers[currentIndex] === null) return;
        if (currentIndex < totalQuestions - 1) {
          showQuestion(currentIndex + 1);
        } else {
          showResults();
        }
      });
    }
  }

  function showResults() {
    latestResults = computeRoleRecommendations({
      answers,
      candidateSkills,
      categoryFacets,
      jobsByCategory,
    });

    containerEl.innerHTML = renderResultView({
      results: latestResults,
      candidateSkills,
      isLoggedIn,
    });

    const retakeBtn = document.getElementById("btn-retake-quiz");
    if (retakeBtn) {
      retakeBtn.addEventListener("click", () => {
        answers.fill(null);
        showQuestion(0);
      });
    }

    const saveBtn = document.getElementById("btn-save-quiz-result");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        if (!isLoggedIn) {
          if (window.showToast) {
            window.showToast("Vui lòng đăng nhập với tài khoản Ứng viên để lưu kết quả vào hồ sơ", "warning");
          } else {
            alert("Vui lòng đăng nhập với tài khoản Ứng viên để lưu kết quả vào hồ sơ.");
          }
          return;
        }

        const payload = {
          saved_at: new Date().toISOString(),
          answers,
          top_role: latestResults[0]?.role_name || "",
          top_score: latestResults[0]?.score || 0,
          recommendations: latestResults.slice(0, 3),
        };
        try {
          localStorage.setItem(`candidate_role_orientation_${user.id}`, JSON.stringify(payload));
          if (window.showToast) {
            window.showToast("Đã lưu kết quả định hướng vào hồ sơ thành công!", "success");
          } else {
            alert("Đã lưu kết quả định hướng vào hồ sơ thành công!");
          }
          saveBtn.disabled = true;
          saveBtn.textContent = "✓ Đã lưu vào hồ sơ";
        } catch (e) {
          console.error("Không thể lưu kết quả:", e);
        }
      });
    }
  }

  showQuestion(0);
}
