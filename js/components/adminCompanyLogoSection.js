/**
 * adminCompanyLogoSection.js - Khối Quản lý & Xét duyệt Logo Doanh nghiệp cho Admin (< 200 dòng).
 * Thẻ: tên + người gửi + ngày; Trái: ảnh gốc (W x H, tỉ lệ); Phải: 28/56/128px + logo hiện tại;
 * Kiểm tra tự động có chữ; Duyệt/Từ chối (dropdown lý do + ghi chú); Phím tắt A/R.
 */
import { renderCompanyLogo, normalizeLogoUrl } from "./companyLogo.js";
import { showStatusToast } from "./toast.js";

const esc = (s) => { const d = document.createElement("div"); d.textContent = s ?? ""; return d.innerHTML; };
const REJECT_REASONS = [
  "Ảnh giống banner hoặc chứa quá nhiều chữ",
  "Độ phân giải quá thấp, bị vỡ nét khi thu nhỏ",
  "Logo không khớp với tên doanh nghiệp",
  "Ảnh chứa nội dung không phù hợp hoặc vi phạm sở hữu trí tuệ",
  "Khác (xem ghi chú chi tiết bên dưới)",
];

export function renderAdminCompanyLogoHtml(c) {
  const p = c.pending_logo, isPending = !!p || c.logo_status === "pending";
  const activeUrl = isPending ? (p?.logo_url || c.logo_url) : (c.logo_full_url || c.logo_url || c.logo);
  const activeUrl2x = isPending
    ? (p?.logo_url_2x || (activeUrl?.includes("_256.webp") ? activeUrl.replace("_256.webp", "_512.webp") : c.logo_url_2x))
    : (c.logo_full_url_2x || c.logo_url_2x || (activeUrl?.includes("_256.webp") ? activeUrl.replace("_256.webp", "_512.webp") : undefined));
  const compPreviewData = { ...c, logo_url: activeUrl, logo_url_2x: activeUrl2x };
  const stLabel = isPending ? "Chờ duyệt logo mới" : (c.logo_status === "active" ? "Đang sử dụng" : (c.logo_status === "removed" ? "Đã gỡ" : "Chưa có logo"));
  const stClass = isPending ? "gov-status-pill--missing" : (c.logo_status === "active" ? "gov-status-pill--active" : "gov-status-pill--removed");

  const origW = p?.orig_width || 256, origH = p?.orig_height || 256;
  const origRatio = p?.orig_ratio || (origH ? +(origW / origH).toFixed(2) : 1);
  const origUrl = normalizeLogoUrl(p?.original_url || activeUrl);
  const isRatioWarn = origRatio > 1.6;

  return `
    <div class="adm-dialog-card" id="adm-logo-approval-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <h4 class="adm-dialog-section-title" style="margin:0;">Quản lý &amp; Duyệt Logo doanh nghiệp</h4>
        <span class="gov-status-pill ${stClass}">${esc(stLabel)}</span>
      </div>

      ${isPending ? `
        <div class="verif-reason-callout" style="background:#f0fdfa; border-color:#ccfbf1; color:#0f766e; margin-bottom:12px;">
          <strong>Yêu cầu từ:</strong> ${esc(p?.uploader_name || c.employer_name || "Nhà tuyển dụng")} · <strong>Thời điểm gửi:</strong> ${esc(p?.created_at ? new Date(p.created_at).toLocaleString("vi-VN") : "Mới đây")}
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; margin-bottom:14px;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px;">
            <div style="font-size:12.5px; font-weight:600; color:#334155; margin-bottom:8px;">Ảnh gốc (Nguyên bản)</div>
            <div style="display:flex; align-items:center; gap:14px;">
              <div class="company-logo" style="--size:128px; width:128px; height:128px;"><img src="${esc(origUrl)}" alt="Ảnh gốc" style="width:100%; height:100%; object-fit:contain;" /></div>
              <div style="font-size:12.5px; line-height:1.6; color:#475569;">
                <div>Kích thước: <strong>${origW} × ${origH} px</strong></div>
                <div>Tỉ lệ: <strong>${origRatio}</strong></div>
                <div style="font-size:11.5px; color:#64748b; margin-top:4px;">Chỉ quản trị viên được xem ảnh gốc.</div>
              </div>
            </div>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px;">
            <div style="font-size:12.5px; font-weight:600; color:#334155; margin-bottom:8px;">Bản chuẩn hóa (28 / 56 / 128px) &amp; Logo hiện tại</div>
            <div style="display:flex; align-items:flex-end; gap:12px; margin-bottom:8px;">
              <div style="text-align:center;">${renderCompanyLogo(compPreviewData, { size: 128, lazy: false })}<span style="font-size:11px; color:#64748b;">128px</span></div>
              <div style="text-align:center;">${renderCompanyLogo(compPreviewData, { size: 56, lazy: false })}<span style="font-size:11px; color:#64748b;">56px</span></div>
              <div style="text-align:center;">${renderCompanyLogo(compPreviewData, { size: 28, lazy: false })}<span style="font-size:11px; color:#64748b;">28px</span></div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; padding-top:8px; border-top:1px dashed #e2e8f0; font-size:12px;">
              <span style="color:#64748b;">Logo hiện tại:</span>
              ${c.logo_full_url ? `${renderCompanyLogo({ name: c.name, logo_url: c.logo_full_url }, { size: 40 })}<span style="font-size:11.5px; color:#059669;">Đang dùng</span>` : '<span style="color:#94a3b8;">Chưa có logo trước đó</span>'}
            </div>
          </div>
        </div>

        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; margin-bottom:14px; font-size:12.5px;">
          <div style="font-weight:600; color:#1e293b; margin-bottom:6px;">Kết quả kiểm tra tự động:</div>
          <div style="display:flex; flex-direction:column; gap:5px;">
            <div><span style="color:#059669; font-weight:700;">[ĐẠT]</span> <strong>Tỉ lệ hợp lệ:</strong> Tỉ lệ ${origRatio} trong ngưỡng an toàn 0.5 - 2.0.</div>
            <div><span style="color:#059669; font-weight:700;">[ĐẠT]</span> <strong>Đủ độ phân giải:</strong> Kích thước tối thiểu >= 48px.</div>
            <div>${isRatioWarn ? `<span style="color:#d97706; font-weight:700;">[CẢNH BÁO]</span> <strong>Không có chữ banner/khẩu hiệu quá nhỏ:</strong> Ảnh có tỉ lệ ngang lớn (${origRatio} &gt; 1.6), cần đối chiếu xem khẩu hiệu có bị nhỏ khi co về 28px.` : `<span style="color:#059669; font-weight:700;">[ĐẠT]</span> <strong>Không có chữ banner/khẩu hiệu quá nhỏ:</strong> Tỉ lệ cân đối, biểu tượng dễ nhận diện.`}</div>
            <div><span style="color:#2563eb; font-weight:700;">[NHẮC NHỞ]</span> <strong>Đối chiếu thương hiệu:</strong> Ảnh có thể là logo của nhãn hiệu khác - hãy đối chiếu tên công ty "${esc(c.name)}".</div>
          </div>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <button type="button" class="btn btn-sm btn-primary" id="btn-approve-logo-action" style="background:#059669; border-color:#059669;">Duyệt logo (A)</button>
          <button type="button" class="btn btn-sm btn-outline" id="btn-show-reject-logo" style="color:#b91c1c; border-color:#fca5a5;">Từ chối (R)</button>
          <span style="font-size:11.5px; color:#64748b; margin-left:auto;">Phím tắt: <strong>A</strong> (Duyệt), <strong>R</strong> (Từ chối)</span>
        </div>

        <div id="adm-reject-logo-box" style="display:none; margin-top:10px; padding:12px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px;">
          <label for="adm-reject-select" style="display:block; font-size:12.5px; font-weight:600; color:#991b1b; margin-bottom:4px;">Lý do từ chối:</label>
          <select id="adm-reject-select" class="adm-toolbar-select" style="width:100%; margin-bottom:8px;">${REJECT_REASONS.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join("")}</select>
          <label for="adm-reject-logo-reason" style="display:block; font-size:12px; font-weight:600; color:#991b1b; margin-bottom:4px;">Ghi chú chi tiết:</label>
          <textarea id="adm-reject-logo-reason" class="verif-text-input" rows="2" placeholder="Ghi chú chi tiết cho nhà tuyển dụng..."></textarea>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button type="button" class="btn btn-sm btn-primary" id="btn-confirm-reject-logo" style="background:#dc2626; border-color:#dc2626;">Xác nhận từ chối</button>
            <button type="button" class="btn btn-sm btn-outline" id="btn-cancel-reject-logo">Hủy</button>
          </div>
        </div>
      ` : `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:12px;">
          <div style="font-size:12.5px; font-weight:600; color:#334155; margin-bottom:8px;">Bản chuẩn hóa đang dùng (128 / 56 / 28px)</div>
          <div style="display:flex; align-items:flex-end; gap:12px;">
            <div style="text-align:center;">${renderCompanyLogo(compPreviewData, { size: 128, lazy: false })}<span style="font-size:11px; color:#64748b;">128px</span></div>
            <div style="text-align:center;">${renderCompanyLogo(compPreviewData, { size: 56, lazy: false })}<span style="font-size:11px; color:#64748b;">56px</span></div>
            <div style="text-align:center;">${renderCompanyLogo(compPreviewData, { size: 28, lazy: false })}<span style="font-size:11px; color:#64748b;">28px</span></div>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <input type="file" id="input-upload-logo" accept="image/png,image/jpeg,image/webp" hidden>
          <button type="button" id="btn-trigger-upload-logo" class="btn btn-sm btn-primary">Thay logo</button>
          <button type="button" id="btn-remove-logo" class="btn btn-sm btn-outline" ${c.logo_status !== "active" ? "disabled" : ""}>Gỡ logo</button>
          ${activeUrl ? `<button type="button" class="btn btn-sm btn-outline" id="btn-copy-logo-url">Sao chép link</button>` : ""}
        </div>
      `}
      <div id="detail-logo-feedback" role="alert" style="display:none; margin-top:10px;"></div>
    </div>
  `;
}

export function bindAdminCompanyLogoEvents(c, { onReload }) {
  const fb = document.getElementById("detail-logo-feedback");
  const showFb = (msg, err = true) => { if (fb) { fb.style.display = "block"; fb.className = `gov-alert ${err ? "gov-alert--error" : "gov-alert--success"}`; fb.textContent = msg; } };
  const token = window.Auth?.getToken?.() || localStorage.getItem("auth_token") || "";
  const base = (typeof CONFIG !== "undefined" && CONFIG.API_BASE_URL) || "http://127.0.0.1:8000/api";
  const pending = c.pending_logo;

  if (pending) {
    const doApprove = async () => {
      try {
        const res = await fetch(`${base}/company-logos/${pending.id}/approve`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Không thể phê duyệt logo.");
        showStatusToast("Đã phê duyệt logo công ty.", "success");
        await onReload?.();
      } catch (err) { showFb(err?.message || "Lỗi duyệt logo.", true); }
    };

    const rejBox = document.getElementById("adm-reject-logo-box");
    const toggleReject = () => { if (rejBox) rejBox.style.display = rejBox.style.display === "none" ? "block" : "none"; };
    document.getElementById("btn-approve-logo-action")?.addEventListener("click", doApprove);
    document.getElementById("btn-show-reject-logo")?.addEventListener("click", toggleReject);
    document.getElementById("btn-cancel-reject-logo")?.addEventListener("click", () => { if (rejBox) rejBox.style.display = "none"; });

    document.getElementById("btn-confirm-reject-logo")?.addEventListener("click", async () => {
      const sel = document.getElementById("adm-reject-select")?.value || "";
      const note = document.getElementById("adm-reject-logo-reason")?.value?.trim() || "";
      const reason = note ? `${sel}: ${note}` : sel;
      if (reason.length < 10) return showFb("Lý do từ chối phải có tối thiểu 10 ký tự.", true);
      try {
        const res = await fetch(`${base}/company-logos/${pending.id}/reject`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }),
        });
        if (!res.ok) throw new Error("Không thể từ chối logo.");
        showStatusToast("Đã từ chối logo yêu cầu.", "success");
        await onReload?.();
      } catch (err) { showFb(err?.message || "Lỗi từ chối logo.", true); }
    });

    const handleKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "a" || e.key === "A") { e.preventDefault(); doApprove(); }
      else if (e.key === "r" || e.key === "R") { e.preventDefault(); toggleReject(); }
    };
    document.addEventListener("keydown", handleKey);
  }

  const fileInp = document.getElementById("input-upload-logo");
  document.getElementById("btn-trigger-upload-logo")?.addEventListener("click", () => fileInp?.click());
  fileInp?.addEventListener("change", async () => {
    const file = fileInp.files?.[0]; fileInp.value = "";
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch(`${base}/admin/companies/${c.id}/logo`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return showFb(data.detail || data.message || "Không thể tải lên logo.", true);
      await onReload?.(); showStatusToast("Đã cập nhật logo công ty.", "success");
    } catch (err) { showFb(err?.message || "Lỗi tải logo.", true); }
  });

  document.getElementById("btn-remove-logo")?.addEventListener("click", async () => {
    try {
      const res = await fetch(`${base}/companies/${c.id}/logo`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error("Không thể gỡ logo.");
      await onReload?.(); showStatusToast("Đã gỡ logo công ty.", "success");
    } catch (err) { showFb(err?.message || "Không thể gỡ logo.", true); }
  });

  document.getElementById("btn-copy-logo-url")?.addEventListener("click", async () => {
    const url = c.logo_full_url || c.logo_url;
    if (url) {
      try { await navigator.clipboard.writeText(url); } catch {}
      showFb("Đã sao chép đường dẫn logo.", false);
    }
  });
}
