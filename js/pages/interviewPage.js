/**
 * interviewPage.js - Điều khiển trang câu hỏi phỏng vấn
 * Giới hạn: < 200 dòng.
 */
import { showStatusToast } from "../components/toast.js";

let state = { field: "", level: "" };

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s || "";
  return d.innerHTML;
}

async function fetchQuestions() {
  const container = document.getElementById("questions-list-container");
  if (!container) return;
  container.innerHTML = `<div style="color:var(--text-tertiary); padding:24px 0;">Đang nạp câu hỏi...</div>`;

  try {
    const params = new URLSearchParams();
    if (state.field) params.append("field", state.field);
    if (state.level) params.append("level", state.level);

    const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
    const token = localStorage.getItem("auth_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${base}/interview-questions?${params.toString()}`, { headers });
    if (!res.ok) throw new Error("Lỗi nạp câu hỏi");
    const list = await res.json();
    renderQuestions(list);
  } catch (err) {
    container.innerHTML = `<div class="form-alert alert-danger show">${esc(err.message)}</div>`;
  }
}

function renderQuestions(items) {
  const container = document.getElementById("questions-list-container");
  if (!items.length) {
    container.innerHTML = `<div style="color:var(--text-tertiary); padding:40px 0; text-align:center;">Không có câu hỏi nào khớp với bộ lọc đã chọn.</div>`;
    return;
  }

  container.innerHTML = items.map((q) => `
    <article class="q-card" id="q-card-${q.id}">
      <div class="q-header">
        <div>
          <div class="q-tags">
            <span class="q-badge">${esc(q.field)}</span>
            <span class="q-badge">${esc(q.level)}</span>
          </div>
          <h3 class="q-text">${esc(q.question)}</h3>
        </div>
        <button type="button" class="q-practice-btn ${q.is_practiced ? "is-practiced" : ""}" data-id="${q.id}">
          <span>${q.is_practiced ? "✓ Đã luyện" : "+ Đánh dấu đã luyện"}</span>
        </button>
      </div>
      <div>
        <button type="button" class="q-toggle-btn">
          <span>Xem gợi ý trả lời</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="q-answer-box">
          <p>${esc(q.sample_answer)}</p>
          ${q.tips ? `<div style="margin-top:8px; font-size:12.5px; color:var(--primary-700);">💡 <strong>Lời khuyên:</strong> ${esc(q.tips)}</div>` : ""}
        </div>
      </div>
    </article>
  `).join("");

  // Event toggle answer
  container.querySelectorAll(".q-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".q-card");
      card.classList.toggle("is-open");
    });
  });

  // Event mark practiced
  container.querySelectorAll(".q-practice-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (typeof Auth !== "undefined" && !Auth.isAuthenticated()) {
        showStatusToast("Vui lòng đăng nhập để lưu tiến độ luyện tập phỏng vấn.", "warning");
        return;
      }
      const qId = btn.dataset.id;
      try {
        const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${base}/interview-questions/${qId}/practice`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        btn.classList.toggle("is-practiced", data.practiced);
        btn.querySelector("span").textContent = data.practiced ? "✓ Đã luyện" : "+ Đánh dấu đã luyện";
        showStatusToast(data.practiced ? "Đã ghi nhận luyện tập câu hỏi!" : "Đã hủy đánh dấu luyện tập", "success");
      } catch (e) {
        showStatusToast("Có lỗi xảy ra, vui lòng thử lại.", "danger");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const fieldHost = document.getElementById("filter-field-host");
  const levelHost = document.getElementById("filter-level-host");

  if (fieldHost && typeof CustomSelect !== "undefined") {
    new CustomSelect(fieldHost, {
      options: [
        { value: "", label: "Tất cả lĩnh vực" },
        { value: "backend", label: "Backend Engineering" },
        { value: "frontend", label: "Frontend Development" },
      ],
      defaultValue: "",
      onChange: (val) => { state.field = val; fetchQuestions(); }
    });
  }

  if (levelHost && typeof CustomSelect !== "undefined") {
    new CustomSelect(levelHost, {
      options: [
        { value: "", label: "Tất cả cấp bậc" },
        { value: "junior", label: "Junior" },
        { value: "mid", label: "Middle" },
        { value: "senior", label: "Senior" },
      ],
      defaultValue: "",
      onChange: (val) => { state.level = val; fetchQuestions(); }
    });
  }

  fetchQuestions();
});
