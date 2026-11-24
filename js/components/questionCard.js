/**
 * questionCard.js - Component thẻ câu hỏi phỏng vấn (một khối, không chia tầng).
 * Tuân thủ techrecruit-rules: XSS-safe (textContent), ARIA accordion, phím tắt, vùng bấm >= 44px.
 * Giới hạn: < 200 dòng.
 */

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str ?? "";
  return d.innerHTML;
}

export function formatAnswerHint(container, rawText) {
  if (!container) return;
  container.textContent = "";
  if (!rawText) return;

  const lines = String(rawText).split("\n");
  let currentUl = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      currentUl = null;
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* ")) {
      if (!currentUl) {
        currentUl = document.createElement("ul");
        currentUl.className = "q-hint-list";
        container.appendChild(currentUl);
      }
      const li = document.createElement("li");
      li.textContent = line.replace(/^[-•*]\s*/, "");
      currentUl.appendChild(li);
    } else {
      currentUl = null;
      const p = document.createElement("p");
      p.className = "q-hint-p";
      p.textContent = line;
      container.appendChild(p);
    }
  }
}

export function renderQuestionCard(q, opts = {}) {
  const isPracticed = Boolean(q.is_practiced);
  const showPracticeBtn = opts.showPracticeBtn !== false;

  return `
    <article class="q-card ${isPracticed ? "is-practiced" : ""}" id="q-card-${q.id}" data-id="${q.id}">
      <div class="q-head-row">
        <div class="q-chips">
          <span class="q-chip q-chip-cat">${esc(q.category_name)}</span>
          <span class="q-chip q-chip-lvl"><span class="q-chip-dot" aria-hidden="true"></span>${esc(q.level_name)}</span>
        </div>
        ${showPracticeBtn ? `<button
          type="button"
          class="q-toggle-btn ${isPracticed ? "is-practiced" : ""}"
          data-action="toggle-practice"
          data-id="${q.id}"
          aria-pressed="${isPracticed}"
          title="${isPracticed ? "Đã luyện (bấm để huỷ)" : "Đánh dấu đã luyện"}"
        >
          <svg class="q-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="16 10 11 15 8 12"></polyline>
          </svg>
          <span class="q-toggle-label">${isPracticed ? "Đã luyện" : ""}</span>
        </button>` : ""}
      </div>

      <button
        type="button"
        class="q-title-btn"
        id="q-btn-${q.id}"
        aria-expanded="false"
        aria-controls="q-panel-${q.id}"
      >
        <span class="q-title-text">${esc(q.question)}</span>
        <span class="q-chevron-wrap" aria-hidden="true">
          <svg class="q-chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      <div
        id="q-panel-${q.id}"
        class="q-hint-collapse"
        role="region"
        aria-labelledby="q-btn-${q.id}"
        aria-hidden="true"
      >
        <div class="q-hint-inner">
          <div class="q-hint-content">
            <div class="q-hint-label">GỢI Ý TRẢ LỜI</div>
            <div class="q-hint-body" data-hint-source="${esc(q.answer_hint)}"></div>
          </div>
        </div>
      </div>
    </article>
  `;
}

export function bindQuestionCardEvents(host, { onTogglePractice }) {
  if (!host) return;

  // 1. Khởi tạo nội dung an toàn cho gợi ý trả lời (tránh XSS tuyệt đối)
  host.querySelectorAll(".q-hint-body").forEach((box) => {
    const raw = box.getAttribute("data-hint-source");
    formatAnswerHint(box, raw);
  });

  // 2. Xử lý mở / thu Accordion
  host.querySelectorAll(".q-title-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const isExpanded = btn.getAttribute("aria-expanded") === "true";
      const panelId = btn.getAttribute("aria-controls");
      const panel = document.getElementById(panelId);
      if (!panel) return;

      btn.setAttribute("aria-expanded", String(!isExpanded));
      panel.setAttribute("aria-hidden", String(isExpanded));
      panel.classList.toggle("is-open", !isExpanded);
    });

    // 3. Phím tắt mũi tên lên / xuống giữa các thẻ
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const allBtns = Array.from(host.querySelectorAll(".q-title-btn"));
        const idx = allBtns.indexOf(btn);
        if (idx !== -1) {
          const nextIdx = e.key === "ArrowDown" ? (idx + 1) % allBtns.length : (idx - 1 + allBtns.length) % allBtns.length;
          allBtns[nextIdx]?.focus();
        }
      }
    });
  });

  // 4. Xử lý nút toggle "Đã luyện"
  host.querySelectorAll(".q-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const qId = btn.dataset.id;
      onTogglePractice?.(qId, btn);
    });
  });
}
