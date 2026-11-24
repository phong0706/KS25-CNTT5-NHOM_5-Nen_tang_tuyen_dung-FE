/**
 * employerCandidateDrawer.js - Drawer 4 tab xem hồ sơ, lịch sử, ghi chú và chuyển trạng thái.
 * Tuân thủ techrecruit-rules: < 220 dòng, không confirm()/alert()/<select> gốc, WAI-ARIA dialog.
 */
import { showToast } from "./toast.js";
import { auth } from "../core/auth.js";
import { companyUrl } from "../routes.js";
import { openRejectApplicationModal } from "./rejectApplicationModal.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

function formatDateVN(iso) {
  if (!iso) return "Chưa cập nhật";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Chưa cập nhật";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTimeVN(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${d.toLocaleDateString("vi-VN")}`;
}

export async function openCandidateDrawer(appId, { onUpdated, onMarkViewed } = {}) {
  const host = document.getElementById("rec-cand-drawer-host");
  if (!host) return;

  await auth.ready;
  const token = auth.getToken() || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Fetch application detail & mark as viewed immediately
  let appData = null;
  try {
    const res = await fetch(`${base}/employer/applications/${appId}`, { headers: authHeaders });
    if (!res.ok) throw new Error("Không thể tải chi tiết hồ sơ.");
    appData = await res.json();
  } catch (err) {
    showToast(err.message || "Lỗi tải hồ sơ", "error");
    return;
  }

  // Mark viewed if not yet viewed
  if (!appData.is_viewed) {
    fetch(`${base}/employer/applications/${appId}/view`, { method: "POST", headers: authHeaders })
      .then(() => {
        appData.is_viewed = true;
        onMarkViewed?.(appId);
      })
      .catch(() => {});
  }

  // Load rejection reasons for transition tab
  let rejectionReasons = [];
  try {
    const rRes = await fetch(`${base}/meta/rejection-reasons`);
    if (rRes.ok) rejectionReasons = await rRes.json();
  } catch {}

  const drawerId = `cand-drawer-${appId}`;
  host.innerHTML = `
    <div class="rec-drawer-backdrop is-open" id="${drawerId}">
      <div class="rec-drawer-dialog" role="dialog" aria-modal="true" aria-labelledby="${drawerId}-title">
        
        <header class="rec-drawer-header">
          <div class="rec-drawer-cand-head">
            <span class="rec-cand-avatar">${esc((appData.candidate.full_name || "U").charAt(0).toUpperCase())}</span>
            <div>
              <h2 id="${drawerId}-title" class="rec-drawer-title">${esc(appData.candidate.full_name)}</h2>
              <span style="font-size: 13px; color: var(--text-secondary);">${esc(appData.job.title)}${appData.job.company_slug ? ` · <a href="${esc(companyUrl(appData.job.company_slug))}" class="job-meta-company-link" target="_blank" rel="noopener">${esc(appData.job.company_name || "Trang công ty")}</a>` : ""}</span>
            </div>
          </div>
          <button type="button" class="rec-drawer-close" id="${drawerId}-close" aria-label="Đóng bảng chi tiết">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <nav class="rec-drawer-tabs" role="tablist" aria-label="Nội dung chi tiết ứng viên">
          <button type="button" class="rec-drawer-tab-btn is-active" data-drawer-tab="profile" role="tab" aria-selected="true">Hồ sơ</button>
          <button type="button" class="rec-drawer-tab-btn" data-drawer-tab="history" role="tab" aria-selected="false">Lịch sử</button>
          <button type="button" class="rec-drawer-tab-btn" data-drawer-tab="notes" role="tab" aria-selected="false">Ghi chú nội bộ</button>
          <button type="button" class="rec-drawer-tab-btn" data-drawer-tab="transition" role="tab" aria-selected="false">Chuyển trạng thái</button>
        </nav>

        <div class="rec-drawer-body">
          <!-- TAB 1: HỒ SƠ -->
          <div class="rec-drawer-tab-pane" id="${drawerId}-pane-profile">
            <div style="display:flex; flex-direction:column; gap:16px;">
              <div style="background:var(--bg-alt); padding:14px; border-radius:8px; border:1px solid var(--border-default);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <span style="font-size:13px; font-weight:600; color:var(--text-secondary);">Độ phù hợp tổng thể</span>
                  <span class="rec-badge-score">Khớp ${appData.match_score}%</span>
                </div>
                <div style="font-size:13px; color:var(--text-primary); display:flex; flex-direction:column; gap:4px;">
                  <div><strong>Email:</strong> ${esc(appData.candidate.email)}</div>
                  <div><strong>Điện thoại:</strong> ${esc(appData.candidate.phone || "Chưa cập nhật")}</div>
                  <div><strong>Ngày nộp:</strong> ${formatDateVN(appData.created_at)}</div>
                </div>
                ${appData.candidate.public_id ? `
                <div style="margin-top:10px; padding-top:8px; border-top:1px dashed var(--border-default); display:flex; justify-content:flex-end;">
                  <a href="./candidate.html?id=${encodeURIComponent(appData.candidate.public_id)}&job_id=${encodeURIComponent(appData.job.id)}"
                     target="_blank" rel="noopener noreferrer"
                     class="rec-btn-view-profile"
                     id="${drawerId}-btn-view-full-profile"
                     style="display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; text-decoration:none; padding:5px 10px; border-radius:6px; background:var(--bg); border:1px solid var(--border-default); color:var(--primary);">
                    <span>Xem hồ sơ đầy đủ</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </a>
                </div>` : ''}
              </div>

              <div>
                <h4 style="font-size:14px; font-weight:600; margin:0 0 8px;">File CV ứng tuyển</h4>
                <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; border:1px solid var(--border-default); border-radius:8px; gap:10px; flex-wrap:wrap;">
                  <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary); flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <span style="font-size:13.5px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(appData.cv_name || "CV.pdf")}</span>
                  </div>
                  ${appData.cv_id ? `
                    <button type="button" id="${drawerId}-btn-view-cv" class="rec-btn-view-profile" style="font-size:12px; height:30px; cursor:pointer;">
                      Xem / Tải CV
                    </button>` : `<span style="font-size:12px; color:var(--text-muted);">Không có file</span>`}
                </div>
                <div id="${drawerId}-cv-viewer-host" style="margin-top:10px; display:none;"></div>
              </div>

              <div>
                <h4 style="font-size:14px; font-weight:600; margin:0 0 8px;">Thư giới thiệu (Cover Letter)</h4>
                <div id="${drawerId}-cover-letter-box" style="background:var(--bg-alt); padding:12px; border-radius:8px; font-size:13.5px; line-height:1.6; color:var(--text-primary); white-space:pre-line; border:1px solid var(--border-default);"></div>
              </div>
            </div>
          </div>

          <!-- TAB 2: LỊCH SỬ TRẠNG THÁI -->
          <div class="rec-drawer-tab-pane" id="${drawerId}-pane-history" hidden>
            <div style="display:flex; flex-direction:column; gap:12px;" id="${drawerId}-history-list">
              ${(appData.history || []).map((h) => `
                <div style="display:flex; gap:12px; padding-bottom:12px; border-bottom:1px solid var(--border-default);">
                  <div style="width:10px; height:10px; border-radius:50%; background:var(--primary); margin-top:5px; flex-shrink:0;"></div>
                  <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:13.5px; font-weight:600;">${esc(h.status_label)}</span>
                      <span style="font-size:12px; color:var(--text-secondary);">${formatDateTimeVN(h.changed_at)}</span>
                    </div>
                    ${h.note ? `<p style="margin:4px 0 0; font-size:13px; color:var(--text-secondary);">${esc(h.note)}</p>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- TAB 3: GHI CHÚ NỘI BỘ -->
          <div class="rec-drawer-tab-pane" id="${drawerId}-pane-notes" hidden>
            <div style="display:flex; flex-direction:column; gap:16px;">
              <div id="${drawerId}-notes-list" style="display:flex; flex-direction:column; gap:10px;">
                <div style="font-size:13px; color:var(--text-muted);">Đang tải ghi chú...</div>
              </div>
              <div style="border-top:1px solid var(--border-default); padding-top:14px;">
                <label for="${drawerId}-new-note" style="font-size:13px; font-weight:600; display:block; margin-bottom:6px;">Thêm ghi chú nội bộ</label>
                <textarea id="${drawerId}-new-note" class="rec-form-textarea" placeholder="Nhập nhận xét, đánh giá nội bộ..." rows="3"></textarea>
                <button type="button" id="${drawerId}-add-note-btn" class="rec-btn-primary" style="margin-top:8px; height:34px; font-size:13px;">
                  Lưu ghi chú
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 4: CHUYỂN TRẠNG THÁI -->
          <div class="rec-drawer-tab-pane" id="${drawerId}-pane-transition" hidden>
            <div style="display:flex; flex-direction:column; gap:14px;">
              <div style="font-size:13.5px; color:var(--text-secondary);">
                Trạng thái hiện tại: <strong style="color:var(--text-primary);">${esc(appData.status_label)}</strong>
              </div>

              ${(appData.allowed_transitions || []).length === 0 ? `
                <div style="padding:16px; background:var(--bg-alt); border-radius:8px; font-size:13.5px; color:var(--text-muted);">
                  Hồ sơ đã ở trạng thái kết thúc (hoặc ứng viên đã rút hồ sơ), không thể chuyển trạng thái tiếp theo.
                </div>
              ` : `
                <div class="rec-radio-group" id="${drawerId}-status-radios">
                  ${appData.allowed_transitions.includes("screening") ? `
                    <label class="rec-radio-card" data-val="screening">
                      <input type="radio" name="next_status" value="screening">
                      <div class="rec-radio-content">
                        <span class="rec-radio-title">Đang xem xét</span>
                        <span class="rec-radio-desc">Chuyển hồ sơ sang giai đoạn sàng lọc chi tiết</span>
                      </div>
                    </label>
                  ` : ""}
                  ${appData.allowed_transitions.includes("interview") ? `
                    <label class="rec-radio-card" data-val="interview">
                      <input type="radio" name="next_status" value="interview">
                      <div class="rec-radio-content">
                        <span class="rec-radio-title">Phỏng vấn</span>
                        <span class="rec-radio-desc">Lên lịch hẹn phỏng vấn trực tuyến hoặc trực tiếp</span>
                      </div>
                    </label>
                  ` : ""}
                  ${appData.allowed_transitions.includes("offered") ? `
                    <label class="rec-radio-card" data-val="offered">
                      <input type="radio" name="next_status" value="offered">
                      <div class="rec-radio-content">
                        <span class="rec-radio-title">Đề nghị nhận việc</span>
                        <span class="rec-radio-desc">Gửi đề nghị việc làm tới ứng viên</span>
                      </div>
                    </label>
                  ` : ""}
                  ${appData.allowed_transitions.includes("rejected") ? `
                    <label class="rec-radio-card" data-val="rejected">
                      <input type="radio" name="next_status" value="rejected">
                      <div class="rec-radio-content">
                        <span class="rec-radio-title">Không phù hợp (Từ chối)</span>
                        <span class="rec-radio-desc">Lưu lý do từ chối và thông báo lịch sự</span>
                      </div>
                    </label>
                  ` : ""}
                </div>

                <!-- EXPANDABLE FORM CHO PHỎNG VẤN -->
                <div class="rec-expandable-form" id="${drawerId}-form-interview">
                  <div style="background:var(--bg-alt); padding:16px; border-radius:10px; border:1px solid var(--border-default); display:flex; flex-direction:column; gap:10px;">
                    <div id="${drawerId}-conflict-box" class="rec-conflict-alert" style="display:none;"></div>

                    <div class="rec-form-row">
                      <div class="rec-form-group">
                        <label class="rec-form-label">Ngày phỏng vấn *</label>
                        <input type="date" id="${drawerId}-iv-date" class="rec-form-input">
                      </div>
                      <div class="rec-form-group">
                        <label class="rec-form-label">Giờ phỏng vấn *</label>
                        <select id="${drawerId}-iv-time" class="rec-form-input">
                          <option value="08:00">08:00</option>
                          <option value="08:30">08:30</option>
                          <option value="09:00" selected>09:00</option>
                          <option value="09:30">09:30</option>
                          <option value="10:00">10:00</option>
                          <option value="10:30">10:30</option>
                          <option value="14:00">14:00</option>
                          <option value="14:30">14:30</option>
                          <option value="15:00">15:00</option>
                          <option value="15:30">15:30</option>
                          <option value="16:00">16:00</option>
                          <option value="16:30">16:30</option>
                        </select>
                      </div>
                    </div>

                    <div class="rec-form-row">
                      <div class="rec-form-group">
                        <label class="rec-form-label">Thời lượng</label>
                        <select id="${drawerId}-iv-duration" class="rec-form-input">
                          <option value="30">30 phút</option>
                          <option value="45" selected>45 phút</option>
                          <option value="60">60 phút</option>
                          <option value="90">90 phút</option>
                        </select>
                      </div>
                      <div class="rec-form-group">
                        <label class="rec-form-label">Hình thức</label>
                        <select id="${drawerId}-iv-mode" class="rec-form-input">
                          <option value="Trực tuyến qua Google Meet">Trực tuyến qua Google Meet</option>
                          <option value="Trực tiếp tại văn phòng">Trực tiếp tại văn phòng</option>
                        </select>
                      </div>
                    </div>

                    <div class="rec-form-group">
                      <label class="rec-form-label">Link phòng họp / Địa điểm</label>
                      <input type="text" id="${drawerId}-iv-location" class="rec-form-input" placeholder="https://meet.google.com/... hoặc địa chỉ">
                    </div>

                    <div class="rec-form-group">
                      <label class="rec-form-label">Người phỏng vấn</label>
                      <input type="text" id="${drawerId}-iv-interviewer" class="rec-form-input" placeholder="Họ tên người phỏng vấn">
                    </div>

                    <div class="rec-form-group">
                      <label class="rec-form-label">Ghi chú cho ứng viên (tối đa 500 ký tự)</label>
                      <textarea id="${drawerId}-iv-note" class="rec-form-textarea" maxlength="500" placeholder="Thông tin chuẩn bị hoặc hướng dẫn bổ sung..."></textarea>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:8px;">
                      <button type="button" id="${drawerId}-btn-submit-iv" class="rec-btn-primary">
                        Xác nhận đặt lịch
                      </button>
                    </div>
                  </div>
                </div>

                <!-- EXPANDABLE FORM CHO TỪ CHỐI -->
                <div class="rec-expandable-form" id="${drawerId}-form-reject">
                  <div style="background:var(--bg-alt); padding:16px; border-radius:10px; border:1px solid var(--border-default); display:flex; flex-direction:column; gap:10px;">
                    <div class="rec-form-group">
                      <label class="rec-form-label">Lý do từ chối *</label>
                      <select id="${drawerId}-reject-reason" class="rec-form-input">
                        ${rejectionReasons.map((r) => `<option value="${esc(r.slug)}">${esc(r.name)}</option>`).join("")}
                      </select>
                    </div>

                    <div class="rec-form-group">
                      <label class="rec-form-label">Ghi chú thêm gửi ứng viên (tùy chọn)</label>
                      <textarea id="${drawerId}-reject-note" class="rec-form-textarea" placeholder="Nội dung phản hồi chi tiết hơn nếu có..."></textarea>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:8px;">
                      <button type="button" id="${drawerId}-btn-submit-reject" class="rec-btn-primary" style="background:#dc2626;">
                        Xác nhận từ chối
                      </button>
                    </div>
                  </div>
                </div>

                <!-- EXPANDABLE FORM CHO TRẠNG THÁI KHÁC (SCREENING, OFFERED) -->
                <div class="rec-expandable-form" id="${drawerId}-form-generic">
                  <div style="background:var(--bg-alt); padding:16px; border-radius:10px; border:1px solid var(--border-default); display:flex; flex-direction:column; gap:10px;">
                    <div class="rec-form-group">
                      <label class="rec-form-label">Ghi chú cập nhật (tùy chọn)</label>
                      <textarea id="${drawerId}-generic-note" class="rec-form-textarea" placeholder="Nhập ghi chú chuyển trạng thái..."></textarea>
                    </div>
                    <div style="display:flex; justify-content:flex-end;">
                      <button type="button" id="${drawerId}-btn-submit-generic" class="rec-btn-primary">
                        Cập nhật trạng thái
                      </button>
                    </div>
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>

        <footer class="rec-drawer-footer" id="${drawerId}-footer" aria-label="Thanh hành động hồ sơ"></footer>

      </div>
    </div>
  `;

  const coverBox = document.getElementById(`${drawerId}-cover-letter-box`);
  if (coverBox) {
    const cleaned = (appData.cover_letter || "").trim().replace(/\n{3,}/g, "\n\n");
    if (cleaned) coverBox.textContent = cleaned;
    else coverBox.innerHTML = `<em style="color:var(--text-muted);">Ứng viên không đính kèm thư giới thiệu.</em>`;
  }

  const backdropEl = document.getElementById(drawerId);
  const closeBtn = document.getElementById(`${drawerId}-close`);
  const footerEl = document.getElementById(`${drawerId}-footer`);
  let currentCvBlobUrl = null;

  const PRIMARY_STEP_MAP = {
    screening: { label: "Chuyển sang Đang xem xét", val: "screening" },
    interview: { label: "Mời phỏng vấn", val: "interview" },
    offered: { label: "Gửi đề nghị", val: "offered" },
  };

  const switchToTransition = (targetStatus) => {
    const tabBtn = backdropEl.querySelector('[data-drawer-tab="transition"]');
    tabBtn?.click();
    const card = backdropEl.querySelector(`.rec-radio-card[data-val="${targetStatus}"]`);
    card?.click();
    card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const refreshDrawerData = async () => {
    try {
      const r = await fetch(`${base}/employer/applications/${appId}`, { headers: authHeaders });
      if (!r.ok) return;
      appData = await r.json();
      const histList = document.getElementById(`${drawerId}-history-list`);
      if (histList) {
        histList.innerHTML = (appData.history || []).map((h) => `
          <div style="display:flex; gap:12px; padding-bottom:12px; border-bottom:1px solid var(--border-default);">
            <div style="width:10px; height:10px; border-radius:50%; background:var(--primary); margin-top:5px; flex-shrink:0;"></div>
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13.5px; font-weight:600;">${esc(h.status_label)}</span>
                <span style="font-size:12px; color:var(--text-secondary);">${formatDateTimeVN(h.changed_at)}</span>
              </div>
              ${h.note ? `<p style="margin:4px 0 0; font-size:13px; color:var(--text-secondary);">${esc(h.note)}</p>` : ""}
            </div>
          </div>
        `).join("");
      }
      const transPane = document.getElementById(`${drawerId}-pane-transition`);
      if (transPane && (appData.allowed_transitions || []).length === 0) {
        transPane.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="font-size:13.5px; color:var(--text-secondary);">Trạng thái hiện tại: <strong style="color:var(--text-primary);">${esc(appData.status_label)}</strong></div>
            <div style="padding:16px; background:var(--bg-alt); border-radius:8px; font-size:13.5px; color:var(--text-muted);">Hồ sơ đã ở trạng thái kết thúc, không thể chuyển trạng thái tiếp theo.</div>
          </div>`;
      }
      renderStickyFooter();
    } catch {}
  };

  function renderStickyFooter() {
    if (!footerEl) return;
    const allowed = (appData.allowed_transitions || []).map((s) => {
      const k = s.toLowerCase();
      return k === "reviewing" ? "screening" : k;
    });
    const canReject = allowed.includes("rejected");
    const nextPrimaryKey = ["screening", "interview", "offered"].find((k) => allowed.includes(k));
    const otherSteps = allowed.filter((k) => k !== "rejected" && k !== nextPrimaryKey && PRIMARY_STEP_MAP[k]);

    if (!canReject && !nextPrimaryKey) {
      footerEl.innerHTML = `
        <div class="rec-drawer-footer-left">
          <span class="rec-status-pill rec-status-pill--${esc(appData.status_tone || "neutral")}">${esc(appData.status_label)}</span>
        </div>
        <div class="rec-drawer-footer-right">
          <span style="font-size:12.5px; color:var(--text-secondary);">Hồ sơ đã ở trạng thái cuối</span>
        </div>
      `;
      return;
    }

    footerEl.innerHTML = `
      <div class="rec-drawer-footer-left">
        ${canReject ? `
          <button type="button" id="${drawerId}-footer-reject" class="rec-btn-reject-outline" aria-label="Từ chối hồ sơ ứng viên">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <span>Từ chối</span>
          </button>
        ` : ""}
      </div>
      <div class="rec-drawer-footer-right">
        ${otherSteps.length > 0 ? `
          <button type="button" id="${drawerId}-footer-other" class="rec-btn-view-profile" style="min-height:44px; padding:0 12px;">Chuyển trạng thái khác</button>
        ` : ""}
        ${nextPrimaryKey ? `
          <button type="button" id="${drawerId}-footer-primary" class="rec-btn-primary" style="min-height:44px; padding:0 16px;">${esc(PRIMARY_STEP_MAP[nextPrimaryKey].label)}</button>
        ` : ""}
      </div>
    `;

    document.getElementById(`${drawerId}-footer-reject`)?.addEventListener("click", (e) => {
      openRejectApplicationModal({
        mode: "single",
        appId,
        candidateName: appData.candidate?.full_name || "ứng viên",
        rejectionReasons,
        triggerEl: e.currentTarget,
        onSuccess: async () => {
          showToast("Đã từ chối hồ sơ", "success");
          await refreshDrawerData();
          onUpdated?.();
        },
        onConflict: async () => {
          await refreshDrawerData();
          onUpdated?.();
        },
      });
    });

    document.getElementById(`${drawerId}-footer-primary`)?.addEventListener("click", () => {
      switchToTransition(nextPrimaryKey);
    });
    document.getElementById(`${drawerId}-footer-other`)?.addEventListener("click", () => {
      switchToTransition(otherSteps[0]);
    });
  }

  renderStickyFooter();

  const revokeCvBlob = () => {
    if (currentCvBlobUrl) {
      URL.revokeObjectURL(currentCvBlobUrl);
      currentCvBlobUrl = null;
    }
  };

  const closeDrawer = () => {
    revokeCvBlob();
    backdropEl.classList.remove("is-open");
    setTimeout(() => { host.innerHTML = ""; }, 250);
  };

  // Xem / Tải CV bằng fetch + Authorization header + URL.createObjectURL(blob)
  const viewCvBtn = document.getElementById(`${drawerId}-btn-view-cv`);
  const cvViewerHost = document.getElementById(`${drawerId}-cv-viewer-host`);

  const fetchAndRenderCv = async () => {
    if (!cvViewerHost) return;
    revokeCvBlob();
    cvViewerHost.style.display = "block";
    cvViewerHost.innerHTML = `<div style="padding:12px; background:var(--bg-alt); border:1px solid var(--border-default); border-radius:8px; font-size:13px; color:var(--text-secondary);">Đang tải tệp CV...</div>`;
    if (viewCvBtn) viewCvBtn.disabled = true;

    try {
      const res = await fetch(`${base}/employer/applications/${appId}/cv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        let errDetail = "Không mở được CV. Hãy thử lại hoặc liên hệ quản trị viên.";
        try {
          const errJson = await res.json();
          if (errJson?.detail && typeof errJson.detail === "string") {
            errDetail = errJson.detail;
          }
        } catch {}
        throw new Error(errDetail);
      }

      const blob = await res.blob();
      currentCvBlobUrl = URL.createObjectURL(blob);
      const safeName = esc(appData.cv_name || "CV.pdf");
      const isPdf = (blob.type && blob.type.includes("pdf")) || safeName.toLowerCase().endsWith(".pdf");

      cvViewerHost.innerHTML = `
        <div style="border:1px solid var(--border-default); border-radius:8px; overflow:hidden; background:var(--bg-alt);">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid var(--border-default); gap:8px; flex-wrap:wrap;">
            <span style="font-size:12.5px; font-weight:600; color:var(--text-primary);">Bản xem trước CV</span>
            <div style="display:flex; align-items:center; gap:8px;">
              <a href="${currentCvBlobUrl}" download="${safeName}" class="rec-btn-view-profile" style="font-size:12px; height:28px; text-decoration:none;">
                Tải về máy
              </a>
              <button type="button" id="${drawerId}-btn-close-cv-preview" style="background:none; border:1px solid var(--border-default); border-radius:6px; padding:4px 8px; font-size:12px; cursor:pointer; color:var(--text-secondary);">
                Ẩn khung xem
              </button>
            </div>
          </div>
          ${isPdf ? `
            <iframe src="${currentCvBlobUrl}" title="Xem trước ${safeName}" style="width:100%; height:440px; border:none; display:block; background:#fff;"></iframe>
          ` : `
            <div style="padding:16px; font-size:13px; color:var(--text-secondary); text-align:center;">
              Định dạng tệp này không hỗ trợ xem trực tiếp trong khung. Vui lòng bấm <strong>Tải về máy</strong> ở trên để mở.
            </div>
          `}
        </div>
      `;

      document.getElementById(`${drawerId}-btn-close-cv-preview`)?.addEventListener("click", () => {
        revokeCvBlob();
        cvViewerHost.style.display = "none";
        cvViewerHost.innerHTML = "";
      });
    } catch (err) {
      const msg = err?.message || "Không mở được CV. Hãy thử lại hoặc liên hệ quản trị viên.";
      cvViewerHost.innerHTML = `
        <div role="alert" style="padding:12px 14px; border-radius:8px; background:rgba(220,38,38,0.08); border:1px solid rgba(220,38,38,0.3); color:#b91c1c; font-size:13px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <span>${esc(msg)}</span>
          <button type="button" id="${drawerId}-btn-retry-cv" style="background:#fff; color:#b91c1c; border:1px solid rgba(220,38,38,0.4); border-radius:6px; padding:5px 12px; font-size:12px; font-weight:600; cursor:pointer; flex-shrink:0;">
            Thử lại
          </button>
        </div>
      `;
      document.getElementById(`${drawerId}-btn-retry-cv`)?.addEventListener("click", fetchAndRenderCv);
    } finally {
      if (viewCvBtn) viewCvBtn.disabled = false;
    }
  };

  viewCvBtn?.addEventListener("click", fetchAndRenderCv);

  closeBtn?.addEventListener("click", closeDrawer);
  backdropEl.addEventListener("click", (e) => {
    if (e.target === backdropEl) closeDrawer();
  });

  // Drawer Tabs switcher
  const tabBtns = backdropEl.querySelectorAll("[data-drawer-tab]");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      const tabKey = btn.getAttribute("data-drawer-tab");
      ["profile", "history", "notes", "transition"].forEach((k) => {
        const pane = document.getElementById(`${drawerId}-pane-${k}`);
        if (pane) pane.hidden = k !== tabKey;
      });

      if (tabKey === "notes") loadNotes();
    });
  });

  // Load Notes
  const notesListEl = document.getElementById(`${drawerId}-notes-list`);
  const loadNotes = async () => {
    try {
      const nRes = await fetch(`${base}/employer/applications/${appId}/notes`, { headers: authHeaders });
      if (!nRes.ok) throw new Error();
      const notes = await nRes.json();
      if (!notes || notes.length === 0) {
        notesListEl.innerHTML = `<div style="font-size:13px; color:var(--text-muted);">Chưa có ghi chú nội bộ nào.</div>`;
        return;
      }
      notesListEl.innerHTML = notes.map((n) => `
        <div style="background:var(--bg-alt); padding:10px 12px; border-radius:8px; border:1px solid var(--border-default);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size:13px; color:var(--text-primary);">${esc(n.author_name)}</strong>
            <span style="font-size:11.5px; color:var(--text-secondary);">${formatDateTimeVN(n.created_at)}</span>
          </div>
          <p style="margin:0; font-size:13px; color:var(--text-primary); white-space:pre-wrap;">${esc(n.content)}</p>
        </div>
      `).join("");
    } catch {
      notesListEl.innerHTML = `<div style="font-size:13px; color:red;">Không thể tải ghi chú.</div>`;
    }
  };

  // Add Note
  const addNoteBtn = document.getElementById(`${drawerId}-add-note-btn`);
  const newNoteInput = document.getElementById(`${drawerId}-new-note`);
  addNoteBtn?.addEventListener("click", async () => {
    const content = newNoteInput.value.trim();
    if (!content) return;
    addNoteBtn.disabled = true;
    try {
      const res = await fetch(`${base}/employer/applications/${appId}/notes`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Lỗi khi thêm ghi chú.");
      newNoteInput.value = "";
      showToast("Đã lưu ghi chú thành công", "success");
      loadNotes();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      addNoteBtn.disabled = false;
    }
  });

  // Radio selection & expandable form logic
  const radioCards = backdropEl.querySelectorAll(".rec-radio-card");
  const formIv = document.getElementById(`${drawerId}-form-interview`);
  const formRej = document.getElementById(`${drawerId}-form-reject`);
  const formGen = document.getElementById(`${drawerId}-form-generic`);

  const setMinDateToday = () => {
    const ivDateInput = document.getElementById(`${drawerId}-iv-date`);
    if (ivDateInput) {
      const today = new Date().toISOString().split("T")[0];
      ivDateInput.min = today;
      if (!ivDateInput.value) ivDateInput.value = today;
    }
  };

  radioCards.forEach((card) => {
    card.addEventListener("click", () => {
      radioCards.forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      const radio = card.querySelector("input[type='radio']");
      if (radio) radio.checked = true;

      const val = card.getAttribute("data-val");
      formIv?.classList.toggle("is-expanded", val === "interview");
      formRej?.classList.toggle("is-expanded", val === "rejected");
      formGen?.classList.toggle("is-expanded", val === "screening" || val === "offered");

      if (val === "interview") setMinDateToday();
    });
  });

  // Generic status update (screening, offered)
  const submitGenericBtn = document.getElementById(`${drawerId}-btn-submit-generic`);
  submitGenericBtn?.addEventListener("click", async () => {
    const selectedRadio = backdropEl.querySelector("input[name='next_status']:checked");
    if (!selectedRadio) return;
    const nextStatus = selectedRadio.value;
    const note = document.getElementById(`${drawerId}-generic-note`)?.value || null;

    submitGenericBtn.disabled = true;
    try {
      const res = await fetch(`${base}/employer/applications/${appId}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: nextStatus, note }),
      });
      if (res.status === 409) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Chuyển trạng thái không hợp lệ");
      }
      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
      showToast("Cập nhật trạng thái thành công!", "success");
      closeDrawer();
      onUpdated?.();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      submitGenericBtn.disabled = false;
    }
  });

  // Submit Rejection
  const submitRejectBtn = document.getElementById(`${drawerId}-btn-submit-reject`);
  submitRejectBtn?.addEventListener("click", async () => {
    const reasonSlug = document.getElementById(`${drawerId}-reject-reason`)?.value;
    const note = document.getElementById(`${drawerId}-reject-note`)?.value || null;

    submitRejectBtn.disabled = true;
    try {
      const res = await fetch(`${base}/employer/applications/${appId}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          status: "rejected",
          rejection_reason_slug: reasonSlug,
          note,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Không thể từ chối hồ sơ");
      }
      showToast("Đã chuyển hồ sơ sang Không phù hợp", "success");
      closeDrawer();
      onUpdated?.();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      submitRejectBtn.disabled = false;
    }
  });

  // Submit Interview (with conflict detection)
  const submitIvBtn = document.getElementById(`${drawerId}-btn-submit-iv`);
  let isForceSubmit = false;
  submitIvBtn?.addEventListener("click", async () => {
    const dateVal = document.getElementById(`${drawerId}-iv-date`)?.value;
    const timeVal = document.getElementById(`${drawerId}-iv-time`)?.value;
    if (!dateVal || !timeVal) {
      showToast("Vui lòng chọn ngày và giờ phỏng vấn", "warning");
      return;
    }
    const scheduledAt = `${dateVal}T${timeVal}:00`;
    const duration = parseInt(document.getElementById(`${drawerId}-iv-duration`)?.value || "45", 10);
    const mode = document.getElementById(`${drawerId}-iv-mode`)?.value;
    const location = document.getElementById(`${drawerId}-iv-location`)?.value || null;
    const interviewer = document.getElementById(`${drawerId}-iv-interviewer`)?.value || null;
    const note = document.getElementById(`${drawerId}-iv-note`)?.value || null;

    submitIvBtn.disabled = true;
    try {
      const res = await fetch(`${base}/employer/applications/${appId}/interview`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          scheduled_at: scheduledAt,
          duration_min: duration,
          mode,
          location_or_link: location,
          interviewer,
          note,
          force: isForceSubmit,
        }),
      });

      if (res.status === 409) {
        const errData = await res.json();
        if (errData.detail?.conflict) {
          const c = errData.detail.conflict;
          const conflictBox = document.getElementById(`${drawerId}-conflict-box`);
          if (conflictBox) {
            conflictBox.style.display = "block";
            conflictBox.innerHTML = `
              <strong>Phát hiện trùng lịch phỏng vấn!</strong>
              Bạn đã có lịch với <em>${esc(c.candidate_name)}</em> (${esc(c.job_title)}) vào khoảng thời gian này.
              <div style="margin-top:6px;">
                <button type="button" id="${drawerId}-btn-force-iv" style="background:#b45309; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:12px; font-weight:600; cursor:pointer;">
                  Vẫn đặt lịch
                </button>
              </div>
            `;
            document.getElementById(`${drawerId}-btn-force-iv`)?.addEventListener("click", () => {
              isForceSubmit = true;
              submitIvBtn.click();
            });
          }
          submitIvBtn.disabled = false;
          return;
        }
        throw new Error(errData.detail || "Không thể xếp lịch");
      }

      if (!res.ok) throw new Error("Lỗi khi xếp lịch phỏng vấn");

      showToast("Đã lên lịch phỏng vấn thành công!", "success");
      closeDrawer();
      onUpdated?.();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      submitIvBtn.disabled = false;
    }
  });
}
