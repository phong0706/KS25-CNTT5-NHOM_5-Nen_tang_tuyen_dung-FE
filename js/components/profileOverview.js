const escapeHtml = window.escapeHtml || ((v) => String(v ?? ""));

const CAMERA_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`;

export function renderProfileSkeleton() {
  return `
    <aside class="profile-sidebar">
      <div class="profile-card">
        <div class="overview-header">
          <div class="skeleton-block" style="width:96px;height:96px;border-radius:50%;margin-bottom:14px;"></div>
          <div class="skeleton-block" style="width:160px;height:22px;margin-bottom:8px;"></div>
          <div class="skeleton-block" style="width:200px;height:16px;"></div>
        </div>
        <div class="completion-block">
          <div class="skeleton-block" style="width:100%;height:16px;margin-bottom:10px;"></div>
          <div class="skeleton-block" style="width:100%;height:8px;border-radius:9999px;"></div>
        </div>
      </div>
    </aside>
    <div class="profile-content">
      <div class="profile-card"><div class="skeleton-block" style="width:100%;height:120px;"></div></div>
      <div class="profile-card"><div class="skeleton-block" style="width:100%;height:96px;"></div></div>
    </div>
  `;
}

export function renderProfileError(message) {
  return `
    <div class="profile-card profile-error-card" style="width:100%;">
      <p>${escapeHtml(message || "Không thể tải hồ sơ ứng viên.")}</p>
      <button type="button" class="section-action-btn" id="btn-retry-profile">Thử lại</button>
    </div>
  `;
}

export function renderProfileSidebar(data) {
  const initial = (data.full_name || "U").trim().charAt(0).toUpperCase();
  const percent = Number(data.completion?.percent ?? 0);
  const missing = Array.isArray(data.completion?.missing) ? data.completion.missing.slice(0, 3) : [];
  const hasAvatar = Boolean(data.avatar_url);

  const missingHtml = percent >= 100
    ? `<p class="completion-done-text">Hồ sơ đã hoàn thiện</p>`
    : `<ul class="missing-tasks-list">
        ${missing.map((m) => `
          <li>
            <button type="button" class="missing-task-btn" data-target="${escapeHtml(m.target_section)}">
              <span>${escapeHtml(m.label)}</span>
              <span class="missing-task-weight">+${Number(m.weight)}%</span>
            </button>
          </li>
        `).join("")}
      </ul>`;

  return `
    <aside class="profile-sidebar" aria-label="Tổng quan hồ sơ">
      <div class="profile-card">
        <div class="overview-header">
          <div class="profile-avatar-wrap">
            <div class="profile-avatar-circle" id="overview-avatar-circle">
              ${hasAvatar ? `<img src="${escapeHtml(data.avatar_url)}" alt="Ảnh đại diện ${escapeHtml(data.full_name)}" width="96" height="96" class="profile-avatar-img" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">` : ""}
              <span${hasAvatar ? " hidden" : ""} aria-hidden="true">${escapeHtml(initial)}</span>
            </div>
            <button type="button" class="profile-avatar-cam-btn" id="avatar-upload-trigger" aria-label="Đổi ảnh đại diện">
              ${CAMERA_ICON}
            </button>
          </div>
          <h1 class="overview-name">${escapeHtml(data.full_name || "Ứng viên")}</h1>
          <p class="overview-headline">${escapeHtml(data.headline || "Chưa cập nhật chức danh")}</p>
        </div>

        <div class="completion-block">
          <div class="completion-label-row">
            <span>Hồ sơ hoàn thiện</span>
            <span class="completion-percent">${percent}%</span>
          </div>
          <div class="completion-track" role="progressbar" aria-label="Tiến độ hoàn thiện hồ sơ" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
            <div class="completion-fill" id="completion-fill-bar" data-percent="${percent}"></div>
          </div>
          ${missingHtml}
        </div>

        <div class="visibility-row" style="flex-direction:column; align-items:flex-start; gap:8px; padding-top:14px; border-top:1px solid var(--border-default);">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <span class="visibility-label" id="public-switch-label" style="font-weight:600; font-size:13.5px; color:var(--text);">Công khai hồ sơ</span>
            <button type="button" class="switch-btn" id="btn-public-switch" role="switch" aria-checked="${data.is_public !== false ? "true" : "false"}" aria-labelledby="public-switch-label">
              <span class="switch-thumb"></span>
            </button>
          </div>
          <p style="font-size:12px; color:var(--text-light); line-height:1.5; margin:0;">
            Khi bật: nhà tuyển dụng có thể xem hồ sơ chuyên môn của bạn, SĐT/email chỉ hiện sau khi bạn ứng tuyển; khi tắt: chỉ nhà tuyển dụng của tin bạn đã nộp mới xem được.
          </p>
          ${data.public_id ? `
          <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-top:4px; padding:6px 10px; border-radius:6px; background:var(--bg-alt); border:1px solid var(--border-default);">
            <span style="font-size:12px; color:var(--text-light); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">id: ${escapeHtml(data.public_id.substring(0, 10))}...</span>
            <button type="button" id="btn-copy-public-link" style="font-size:11.5px; padding:3px 8px; border-radius:4px; cursor:pointer; background:var(--bg); border:1px solid var(--border-default); color:var(--primary); font-weight:600;">
              Sao chép link
            </button>
          </div>` : ''}
          <div style="display:flex; align-items:center; gap:6px; margin-top:4px; font-size:12px; color:var(--text-light);" id="profile-views-stat">
            <span aria-hidden="true">👁️</span>
            <span><strong>${Number(data.views_30d || 0)}</strong> lượt xem trong 30 ngày qua</span>
          </div>
        </div>
      </div>
    </aside>
  `;
}

