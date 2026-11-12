/**
 * Component thanh tiến trình 4 bước (Stepper) cho form đăng tin.
 * Bước đã hoàn thành hiển thị dấu tích; có thể bấm quay lại các bước trước.
 */

function escapeText(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

const CHECK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

export function renderStepper(container, steps, currentStep, maxReachedStep, onSelectStep) {
  if (!container) return;

  container.innerHTML = steps
    .map((label, idx) => {
      const stepNum = idx + 1;
      const isCurrent = stepNum === currentStep;
      const isDone = stepNum < currentStep || (stepNum <= maxReachedStep && stepNum !== currentStep);
      const canClick = stepNum <= maxReachedStep && stepNum !== currentStep;
      const stateClass = isCurrent ? "is-current" : isDone ? "is-done" : "";

      return `
        <button
          type="button"
          class="ejf-step ${stateClass}"
          data-step="${stepNum}"
          ${canClick ? "" : !isCurrent ? "disabled" : ""}
          aria-current="${isCurrent ? "step" : "false"}"
        >
          <span class="ejf-step-num" aria-hidden="true">${isDone ? CHECK_ICON : stepNum}</span>
          <span class="ejf-step-label">${escapeText(label)}</span>
        </button>
      `;
    })
    .join("");

  container.querySelectorAll(".ejf-step").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const targetStep = Number(btn.dataset.step);
      if (targetStep && targetStep !== currentStep) {
        onSelectStep?.(targetStep);
      }
    });
  });
}

