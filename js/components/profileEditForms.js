/**
 * Inline edit form blocks for Candidate Profile (/pages/candidate/profile.html)
 * - Basic Info Form (họ tên, chức danh, email readonly, sđt, địa điểm CustomSelect, github, linkedin, portfolio)
 * - Bio Form (textarea resize:none, đếm ký tự x/500)
 * - Skills Form (tag input, enter/phẩy, backspace xóa cuối, gợi ý debounce 250ms, chuẩn hóa không trùng, max 30)
 */

function esc(val) {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderBasicInfoForm(data, locations = []) {
  const locOptions = locations.map((loc) => {
    const isSelected = (data.location || "").toLowerCase() === (loc.name || "").toLowerCase();
    return `<option value="${esc(loc.name)}" ${isSelected ? "selected" : ""}>${esc(loc.name)}</option>`;
  }).join("");

  return `
    <form class="profile-inline-form" id="form-edit-basic" novalidate style="background:var(--bg-alt);padding:20px;border-radius:10px;border:1px solid var(--border);">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:16px;margin-bottom:18px;">
        <div class="form-group">
          <label for="basic-full-name" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Họ và tên <span style="color:#dc2626;">*</span></label>
          <input type="text" id="basic-full-name" name="full_name" class="form-input" value="${esc(data.full_name || "")}" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
          <div class="field-error-msg" id="err-full_name" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
        </div>

        <div class="form-group">
          <label for="basic-headline" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Chức danh nghề nghiệp</label>
          <input type="text" id="basic-headline" name="headline" class="form-input" value="${esc(data.headline || "")}" placeholder="Vd: Senior Backend Engineer" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
          <div class="field-error-msg" id="err-headline" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
        </div>

        <div class="form-group">
          <label for="basic-email" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text-muted);">Email (Chỉ đọc)</label>
          <input type="email" id="basic-email" value="${esc(data.email || "")}" readonly disabled style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;background:var(--bg-muted, #f1f5f9);color:var(--text-muted);cursor:not-allowed;">
        </div>

        <div class="form-group">
          <label for="basic-phone" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Số điện thoại</label>
          <input type="tel" id="basic-phone" name="phone" class="form-input" value="${esc(data.phone || "")}" placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
          <div class="field-error-msg" id="err-phone" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
        </div>

        <div class="form-group">
          <label for="basic-location" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Địa điểm</label>
          <div id="basic-location-host"></div>
          <div class="field-error-msg" id="err-location" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
        </div>

        <div class="form-group">
          <label for="basic-github" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">GitHub URL</label>
          <input type="url" id="basic-github" name="github_url" class="form-input" value="${esc(data.github_url || "")}" placeholder="https://github.com/username" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
          <div class="field-error-msg" id="err-github_url" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
        </div>

        <div class="form-group">
          <label for="basic-linkedin" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">LinkedIn URL</label>
          <input type="url" id="basic-linkedin" name="linkedin_url" class="form-input" value="${esc(data.linkedin_url || "")}" placeholder="https://linkedin.com/in/username" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
          <div class="field-error-msg" id="err-linkedin_url" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
        </div>

        <div class="form-group">
          <label for="basic-portfolio" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Portfolio URL</label>
          <input type="url" id="basic-portfolio" name="portfolio_url" class="form-input" value="${esc(data.portfolio_url || "")}" placeholder="https://yourportfolio.com" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;">
          <div class="field-error-msg" id="err-portfolio_url" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:12px;align-items:center;">
        <button type="button" class="btn-cancel-edit section-action-btn" data-cancel-action="basic" style="padding:8px 18px;">Hủy</button>
        <button type="submit" class="btn-save-edit" id="btn-save-basic" style="background:var(--primary);color:#fff;border:none;padding:9px 22px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit;">Lưu</button>
      </div>
    </form>
  `;
}

export function renderBioForm(data) {
  const bio = data.bio || "";
  return `
    <form class="profile-inline-form" id="form-edit-bio" novalidate style="background:var(--bg-alt);padding:20px;border-radius:10px;border:1px solid var(--border);">
      <div class="form-group" style="margin-bottom:16px;">
        <label for="bio-textarea" class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Giới thiệu tóm tắt về kinh nghiệm, điểm mạnh và định hướng</label>
        <textarea id="bio-textarea" name="bio" class="form-textarea" maxlength="500" placeholder="Viết giới thiệu bản thân (tối đa 500 ký tự)..." style="width:100%;height:140px;resize:none;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:14px;line-height:1.6;">${esc(bio)}</textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
          <div class="field-error-msg" id="err-bio" style="color:#dc2626;font-size:12px;min-height:16px;"></div>
          <div id="bio-char-count" style="font-size:12px;color:var(--text-muted);font-variant-numeric:tabular-nums;">${bio.length}/500</div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:12px;align-items:center;">
        <button type="button" class="btn-cancel-edit section-action-btn" data-cancel-action="bio" style="padding:8px 18px;">Hủy</button>
        <button type="submit" class="btn-save-edit" id="btn-save-bio" style="background:var(--primary);color:#fff;border:none;padding:9px 22px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit;">Lưu</button>
      </div>
    </form>
  `;
}

export function renderSkillsForm(data) {
  return `
    <form class="profile-inline-form" id="form-edit-skills" novalidate style="background:var(--bg-alt);padding:20px;border-radius:10px;border:1px solid var(--border);">
      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--text);">Kỹ năng nổi bật (tối đa 30 kỹ năng, nhấn Enter hoặc dấu phẩy để thêm)</label>
        <div id="skills-tag-input-host"></div>
        <div class="field-error-msg" id="err-skills" style="color:#dc2626;font-size:12px;margin-top:4px;min-height:16px;"></div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:12px;align-items:center;">
        <button type="button" class="btn-cancel-edit section-action-btn" data-cancel-action="skills" style="padding:8px 18px;">Hủy</button>
        <button type="submit" class="btn-save-edit" id="btn-save-skills" style="background:var(--primary);color:#fff;border:none;padding:9px 22px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit;">Lưu</button>
      </div>
    </form>
  `;
}
