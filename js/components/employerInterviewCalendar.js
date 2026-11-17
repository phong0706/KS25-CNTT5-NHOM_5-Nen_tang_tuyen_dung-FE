/**
 * employerInterviewCalendar.js - Lịch phỏng vấn theo tuần cho Nhà tuyển dụng.
 * Tuân thủ techrecruit-rules: <= 200 dòng, không alert/confirm/prompt.
 */
import { showToast } from "./toast.js";
import { auth } from "../core/auth.js";
import { openRescheduleModal, openCancelInterviewModal } from "./employerInterviewModal.js";

function esc(s) { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; }
function getMonday(d) {
  const date = new Date(d); const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0); return date;
}
const pad = (n) => String(n).padStart(2, "0");
function toISODate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function formatDayHeader(d) {
  const names = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return `${names[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

export function initInterviewCalendar(rootEl, { onReloadParent } = {}) {
  let currentMonday = getMonday(new Date());
  let selectedJobId = null; let selectedStatus = "all";
  let interviewItems = [];

  const prevBtn = document.getElementById("rec-iv-prev-week");
  const todayBtn = document.getElementById("rec-iv-today");
  const nextBtn = document.getElementById("rec-iv-next-week");
  const labelEl = document.getElementById("rec-iv-week-label");
  const gridEl = document.getElementById("rec-iv-grid");

  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  let authHeaders = { "Content-Type": "application/json" };

  const updateWeekLabel = () => {
    const sun = new Date(currentMonday); sun.setDate(sun.getDate() + 6);
    if (labelEl) labelEl.textContent = `${currentMonday.getDate()}/${currentMonday.getMonth() + 1} - ${sun.getDate()}/${sun.getMonth() + 1}/${sun.getFullYear()}`;
  };

  const loadInterviews = async () => {
    updateWeekLabel(); if (!gridEl) return;
    gridEl.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--text-secondary);">Đang tải lịch phỏng vấn...</div>`;
    await auth.ready; const token = auth.getToken() || "";
    authHeaders = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const sun = new Date(currentMonday); sun.setDate(sun.getDate() + 6);
    let url = `${base}/employer/interviews?from=${toISODate(currentMonday)}&to=${toISODate(sun)}`;
    if (selectedJobId) url += `&job_id=${selectedJobId}`;
    if (selectedStatus && selectedStatus !== "all") url += `&status=${selectedStatus}`;

    try {
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error("Không thể tải lịch phỏng vấn");
      interviewItems = await res.json();
      renderDays(interviewItems);
    } catch (err) {
      gridEl.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--danger);">${esc(err.message)}</div>`;
    }
  };

  const renderDays = (interviews) => {
    const dayGroups = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday); d.setDate(d.getDate() + i);
      const dateKey = toISODate(d);
      dayGroups.push({ date: d, items: interviews.filter((iv) => iv.scheduled_at?.startsWith(dateKey)) });
    }
    const now = new Date();
    gridEl.innerHTML = dayGroups.map(({ date, items }) => {
      const isToday = toISODate(date) === toISODate(now);
      return `
        <div class="rec-iv-day-group ${isToday ? "is-today" : ""}">
          <div class="rec-iv-day-title">
            <span>${formatDayHeader(date)}</span>
            ${items.length > 0 ? `<span class="rec-tab-count">${items.length}</span>` : ""}
          </div>
          ${items.length === 0 ? `<div class="rec-iv-empty-day">Không có lịch hẹn</div>` : items.map((iv) => {
            const ivTime = new Date(iv.scheduled_at);
            const timeStr = `${ivTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })} (${iv.duration_min}p)`;
            const isDone = iv.status === "done";
            const isCancelled = iv.status === "cancelled";
            const isPast = now >= ivTime;
            const statusPill = isDone ? `<span class="rec-status-pill rec-status-pill--success">Đã xong</span>` : (isCancelled ? `<span class="rec-status-pill rec-status-pill--danger">Đã hủy</span>` : "");
            return `
              <div class="rec-iv-card ${isCancelled ? "is-cancelled" : ""}" data-interview-id="${iv.id}">
                <div class="rec-iv-time-row">
                  <span class="rec-iv-time">${esc(timeStr)}</span>
                  <span class="rec-iv-mode-badge">${esc(iv.mode.includes("Google") ? "Online" : "Trực tiếp")}</span>
                </div>
                <div class="rec-iv-cand">${esc(iv.candidate_name)} ${statusPill}</div>
                <div class="rec-iv-job">${esc(iv.job_title)}</div>
                ${iv.location_or_link ? `
                  <div class="rec-iv-link">
                    ${iv.location_or_link.startsWith("http") ? `<a href="${esc(iv.location_or_link)}" target="_blank" rel="noopener">Vào phòng họp Meet</a>` : esc(iv.location_or_link)}
                  </div>
                ` : ""}
                ${!isDone && !isCancelled ? `
                  <div class="rec-iv-actions">
                    <button type="button" class="rec-iv-btn rec-iv-btn--reschedule" data-action="reschedule" data-id="${iv.id}">Đổi lịch</button>
                    <button type="button" class="rec-iv-btn rec-iv-btn--cancel" data-action="cancel" data-id="${iv.id}">Hủy</button>
                    ${isPast ? `<button type="button" class="rec-iv-btn rec-iv-btn--done" data-action="done" data-id="${iv.id}">Đã xong</button>` : ""}
                  </div>
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>
      `;
    }).join("");

    bindActionButtons();
  };

  const bindActionButtons = () => {
    gridEl.querySelectorAll("[data-action='done']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.id);
        btn.disabled = true;
        try {
          const res = await fetch(`${base}/employer/interviews/${id}/done`, { method: "POST", headers: authHeaders });
          if (!res.ok) throw new Error("Cập nhật thất bại");
          showToast("Đã ghi nhận hoàn thành buổi phỏng vấn!", "success");
          loadInterviews(); onReloadParent?.();
        } catch (e) {
          showToast(e.message, "error");
        } finally { btn.disabled = false; }
      });
    });

    gridEl.querySelectorAll("[data-action='cancel']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const iv = interviewItems.find((item) => item.id === id);
        if (iv) openCancelInterviewModal(iv, { base, authHeaders, onCancelled: () => { loadInterviews(); onReloadParent?.(); }, triggerEl: btn });
      });
    });

    gridEl.querySelectorAll("[data-action='reschedule']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const iv = interviewItems.find((item) => item.id === id);
        if (iv) openRescheduleModal(iv, {
          base,
          authHeaders,
          onUpdated: (newDt) => {
            if (newDt) iv.scheduled_at = newDt;
            loadInterviews();
            onReloadParent?.();
          },
          triggerEl: btn
        });
      });
    });
  };

  prevBtn?.addEventListener("click", () => { currentMonday.setDate(currentMonday.getDate() - 7); loadInterviews(); });
  todayBtn?.addEventListener("click", () => { currentMonday = getMonday(new Date()); loadInterviews(); });
  nextBtn?.addEventListener("click", () => { currentMonday.setDate(currentMonday.getDate() + 7); loadInterviews(); });

  loadInterviews();
  return { reload: loadInterviews };
}
