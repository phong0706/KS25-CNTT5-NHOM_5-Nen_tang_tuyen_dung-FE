/**
 * employerInterviewCalendar.js - Lịch phỏng vấn theo tuần cho Nhà tuyển dụng.
 * Tuân thủ techrecruit-rules: < 220 dòng, không alert/confirm/<select> gốc, hiển thị giờ Asia/Ho_Chi_Minh.
 */
import { showToast } from "./toast.js";
import { auth } from "../core/auth.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toISODate(d) {
  return d.toISOString().split("T")[0];
}

function formatDayHeader(d) {
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  return `${dayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

export function initInterviewCalendar(rootEl, { onReloadParent } = {}) {
  let currentMonday = getMonday(new Date());
  let selectedJobId = null;
  let selectedStatus = "all";

  const prevBtn = document.getElementById("rec-iv-prev-week");
  const todayBtn = document.getElementById("rec-iv-today");
  const nextBtn = document.getElementById("rec-iv-next-week");
  const labelEl = document.getElementById("rec-iv-week-label");
  const gridEl = document.getElementById("rec-iv-grid");

  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  let authHeaders = { "Content-Type": "application/json" };

  const updateWeekLabel = () => {
    const sunday = new Date(currentMonday);
    sunday.setDate(sunday.getDate() + 6);
    if (labelEl) {
      labelEl.textContent = `${currentMonday.getDate()}/${currentMonday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;
    }
  };

  const loadInterviews = async () => {
    updateWeekLabel();
    if (!gridEl) return;
    gridEl.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--text-secondary);">Đang tải lịch phỏng vấn...</div>`;

    await auth.ready;
    const token = auth.getToken() || "";
    authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const sunday = new Date(currentMonday);
    sunday.setDate(sunday.getDate() + 6);

    const fromStr = toISODate(currentMonday);
    const toStr = toISODate(sunday);

    let url = `${base}/employer/interviews?from=${fromStr}&to=${toStr}`;
    if (selectedJobId) url += `&job_id=${selectedJobId}`;
    if (selectedStatus && selectedStatus !== "all") url += `&status=${selectedStatus}`;

    try {
      const res = await fetch(url, { headers: authHeaders });
      if (!res.ok) throw new Error("Không thể tải lịch phỏng vấn");
      const list = await res.json();
      renderDays(list);
    } catch (err) {
      gridEl.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: red;">${esc(err.message)}</div>`;
    }
  };

  const renderDays = (interviews) => {
    // Group into 7 days Monday to Sunday
    const dayGroups = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(d.getDate() + i);
      const dateKey = toISODate(d);
      const dayItems = interviews.filter((iv) => iv.scheduled_at && iv.scheduled_at.startsWith(dateKey));
      dayGroups.push({ date: d, items: dayItems });
    }

    gridEl.innerHTML = dayGroups
      .map(({ date, items }) => {
        const isToday = toISODate(date) === toISODate(new Date());
        return `
          <div class="rec-iv-day-group" style="${isToday ? 'border-color: var(--primary); background: rgba(13, 148, 136, 0.03);' : ''}">
            <div class="rec-iv-day-title">
              <span>${formatDayHeader(date)}</span>
              ${items.length > 0 ? `<span class="rec-tab-count">${items.length}</span>` : ""}
            </div>

            ${items.length === 0 ? `
              <div style="font-size: 12px; color: var(--text-muted); padding: 12px 4px; text-align: center;">
                Không có lịch hẹn
              </div>
            ` : items.map((iv) => {
              const ivTime = new Date(iv.scheduled_at);
              const timeStr = `${ivTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} (${iv.duration_min}p)`;
              const isDone = iv.status === "done";
              const isCancelled = iv.status === "cancelled";
              const statusPill = isDone ? `<span class="rec-status-pill rec-status-pill--success" style="font-size:11px;">Đã xong</span>` : (isCancelled ? `<span class="rec-status-pill rec-status-pill--danger" style="font-size:11px;">Đã hủy</span>` : "");

              return `
                <div class="rec-iv-card" data-interview-id="${iv.id}" style="${isCancelled ? 'opacity:0.6;' : ''}">
                  <div class="rec-iv-time-row">
                    <span class="rec-iv-time">${esc(timeStr)}</span>
                    <span class="rec-iv-mode-badge">${esc(iv.mode.includes("Google") ? "Online" : "Trực tiếp")}</span>
                  </div>

                  <div class="rec-iv-cand">${esc(iv.candidate_name)} ${statusPill}</div>
                  <div class="rec-iv-job">${esc(iv.job_title)}</div>

                  ${iv.location_or_link ? `
                    <div style="font-size: 12px; color: var(--text-secondary); word-break: break-all;">
                      ${iv.location_or_link.startsWith("http") ? `<a href="${esc(iv.location_or_link)}" target="_blank" rel="noopener" style="color:var(--primary); font-weight:600;">Vào phòng họp Meet</a>` : esc(iv.location_or_link)}
                    </div>
                  ` : ""}

                  ${!isDone && !isCancelled ? `
                    <div class="rec-iv-actions">
                      <button type="button" class="rec-iv-btn-sm" data-action="reschedule" data-id="${iv.id}">Đổi lịch</button>
                      <button type="button" class="rec-iv-btn-sm" data-action="cancel" data-id="${iv.id}">Hủy</button>
                      <button type="button" class="rec-iv-btn-sm" data-action="done" data-id="${iv.id}" style="color:var(--primary); font-weight:600;">Đã xong</button>
                    </div>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        `;
      })
      .join("");

    bindActionButtons();
  };

  const bindActionButtons = () => {
    gridEl.querySelectorAll("[data-action='done']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        btn.disabled = true;
        try {
          const res = await fetch(`${base}/employer/interviews/${id}/done`, {
            method: "POST",
            headers: authHeaders,
          });
          if (!res.ok) throw new Error("Cập nhật thất bại");
          showToast("Đã ghi nhận hoàn thành buổi phỏng vấn!", "success");
          loadInterviews();
          onReloadParent?.();
        } catch (e) {
          showToast(e.message, "error");
        } finally {
          btn.disabled = false;
        }
      });
    });

    gridEl.querySelectorAll("[data-action='cancel']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const reason = prompt("Lý do hủy lịch phỏng vấn (sẽ thông báo tới ứng viên):");
        if (reason === null) return;
        if (!reason.trim()) {
          showToast("Vui lòng nhập lý do hủy", "warning");
          return;
        }
        btn.disabled = true;
        try {
          const res = await fetch(`${base}/employer/interviews/${id}/cancel`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ reason: reason.trim() }),
          });
          if (!res.ok) throw new Error("Hủy lịch thất bại");
          showToast("Đã hủy lịch phỏng vấn", "success");
          loadInterviews();
          onReloadParent?.();
        } catch (e) {
          showToast(e.message, "error");
        } finally {
          btn.disabled = false;
        }
      });
    });

    gridEl.querySelectorAll("[data-action='reschedule']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const newDate = prompt("Nhập ngày giờ mới (YYYY-MM-DDTHH:MM, ví dụ 2026-11-20T10:00):");
        if (!newDate) return;
        btn.disabled = true;
        try {
          const res = await fetch(`${base}/employer/interviews/${id}/reschedule`, {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({ scheduled_at: newDate, duration_min: 45, force: true }),
          });
          if (!res.ok) throw new Error("Đổi lịch thất bại");
          showToast("Đã cập nhật lịch phỏng vấn mới!", "success");
          loadInterviews();
          onReloadParent?.();
        } catch (e) {
          showToast(e.message, "error");
        } finally {
          btn.disabled = false;
        }
      });
    });
  };

  prevBtn?.addEventListener("click", () => {
    currentMonday.setDate(currentMonday.getDate() - 7);
    loadInterviews();
  });
  todayBtn?.addEventListener("click", () => {
    currentMonday = getMonday(new Date());
    loadInterviews();
  });
  nextBtn?.addEventListener("click", () => {
    currentMonday.setDate(currentMonday.getDate() + 7);
    loadInterviews();
  });

  loadInterviews();
  return { reload: loadInterviews };
}
