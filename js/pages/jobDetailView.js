/**
 * jobDetailView.js - Hàm render chi tiết việc làm & hành động dùng chung (< 195 dòng).
 * Dùng chung cho trang job-detail.html và panel Quick View trên jobs.html.
 */
import { formatSalary, renderCompanyLogo, toggleSave } from "../components/jobCard.js";
import { openApplyModal } from "../components/applyModal.js";
import { showStatusToast } from "../components/toast.js";
import { appliedJobsUrl, companyUrl, jobsUrl, loginUrl } from "../routes.js";
import { formatSizeRange } from "../utils/companyUtils.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const AUTO_PROSE_RE = /^(?:Tuyển dụng vị trí .+ tại .+|Tối thiểu 1 năm kinh nghiệm thực tế|Đang cập nhật|Chưa có mô tả)\.{0,3}$/i;
const ICON_PATHS = {
  award: ["M12 15l-3.5 2 .7-4-2.9-2.8 4-.6L12 6l1.7 3.6 4 .6-2.9 2.8.7 4z"],
  book: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
  users: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  clock: ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", "M12 6v6l4 2"],
  layers: ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  pin: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", "M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0"],
  briefcase: ["M2 7h20v14H2z", "M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"],
};

export function cleanStr(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).replace("[Seed]", "").trim();
  return !s || /^(null|undefined)$/i.test(s) ? "" : s;
}
export function cleanJobProse(v) { const s = cleanStr(v); return !s || AUTO_PROSE_RE.test(s) ? "" : s; }
export function formatDateVi(v) {
  const s = cleanStr(v); if (!s) return "";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/), d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

function el(tag, cls, text) {
  const n = document.createElement(tag); if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = String(text); return n;
}
function createIcon(name) {
  const svg = document.createElementNS(SVG_NS, "svg");
  [["width", "16"], ["height", "16"], ["viewBox", "0 0 24 24"], ["fill", "none"], ["stroke", "currentColor"], ["stroke-width", "1.9"], ["stroke-linecap", "round"], ["stroke-linejoin", "round"], ["aria-hidden", "true"]].forEach(([k, v]) => svg.setAttribute(k, v));
  svg.classList.add("jd-fact-icon");
  (ICON_PATHS[name] || []).forEach((d) => { const p = document.createElementNS(SVG_NS, "path"); p.setAttribute("d", d); svg.appendChild(p); });
  return svg;
}

export function renderProseBlocks(host, rawValue) {
  if (!host) return false;
  host.replaceChildren();
  const text = Array.isArray(rawValue) ? rawValue.map(cleanJobProse).filter(Boolean).join("\n") : cleanJobProse(rawValue);
  const lines = text ? text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !AUTO_PROSE_RE.test(l)) : [];
  if (!lines.length) return false;
  let ul = null;
  lines.forEach((line) => {
    if (/^[-•*]\s+/.test(line)) { if (!ul) { ul = el("ul", "jd-prose-list"); host.appendChild(ul); } ul.appendChild(el("li", "", line.replace(/^[-•*]\s+/, ""))); }
    else { ul = null; host.appendChild(el("p", "jd-prose-p", line)); }
  });
  return true;
}

function renderFactList(dlEl, rows) {
  if (!dlEl) return false;
  dlEl.replaceChildren();
  rows.forEach(([iconKey, label, val, valId]) => {
    const row = el("div", "jd-fact"), dt = el("dt", "jd-fact-dt"), dd = el("dd", "jd-fact-dd", val);
    dt.append(createIcon(iconKey), el("span", "", label)); if (valId) dd.id = valId; row.append(dt, dd); dlEl.appendChild(row);
  });
  dlEl.hidden = rows.length === 0; return rows.length > 0;
}

function renderTagGroup(wrapId, hostId, items, toHref) {
  const wrap = $(wrapId), host = $(hostId);
  if (host) { host.replaceChildren(); items.forEach((label) => { const a = el("a", "jd-filter-tag", label); a.href = toHref(label); host.appendChild(a); }); }
  if (wrap) wrap.hidden = items.length === 0; return items.length > 0;
}

export function renderSharedJobContent(job, cfg) {
  const title = cleanStr(job.title) || "Chi tiết việc làm";
  if (cfg.titleEl) cfg.titleEl.textContent = title;
  const compName = cleanStr(job.company_name), compSlug = cleanStr(job.company_slug);
  if (cfg.companyEl) {
    cfg.companyEl.replaceChildren();
    if (compName && compSlug) { const a = el("a", "job-meta-company-link", compName); a.href = companyUrl(compSlug); cfg.companyEl.appendChild(a); }
    else if (compName) cfg.companyEl.appendChild(el("span", "", compName));
    cfg.companyEl.hidden = !compName;
  }
  let quickShown = 0;
  (cfg.quickItems || []).forEach(([wrapEl, valEl, raw]) => {
    const val = cleanStr(raw); if (wrapEl) wrapEl.hidden = !val; if (valEl && val) valEl.textContent = val; if (val) quickShown += 1;
  });
  if (cfg.quickGridEl) cfg.quickGridEl.hidden = quickShown === 0;
  (cfg.sections || []).forEach(([secEl, bodyEl, raw]) => { if (secEl) secEl.hidden = !renderProseBlocks(bodyEl, raw); });
  return title;
}

export function bindSharedJobActions(job, opts = {}) {
  const applyBtns = (opts.applyBtns || []).filter(Boolean);
  const saveBtns = (opts.saveBtns || []).filter(Boolean);
  const saveLabels = (opts.saveLabels || []).filter(Boolean);
  const noteEl = opts.noteEl || null, primaryLabel = opts.primaryLabel || "Ứng tuyển ngay";
  const setNote = (txt) => { if (noteEl) { noteEl.textContent = txt || ""; noteEl.hidden = !txt; } };

  const syncApply = () => {
    const authed = Boolean(window.Auth?.isAuthenticated?.()), role = window.Auth?.getRole?.();
    applyBtns.forEach((b) => { b.disabled = false; delete b.dataset.needsLogin; delete b.dataset.applied; b.textContent = primaryLabel; });
    if (job.applied) {
      applyBtns.forEach((b) => { b.textContent = "Đã ứng tuyển"; b.dataset.applied = "1"; });
      setNote("Bạn đã nộp hồ sơ cho vị trí này. Bấm nút trên để xem lịch sử ứng tuyển.");
    } else if (!authed) {
      applyBtns.forEach((b) => { b.dataset.needsLogin = "1"; });
      setNote("Vui lòng đăng nhập bằng tài khoản ứng viên để nộp hồ sơ.");
    } else if (role !== "candidate") {
      applyBtns.forEach((b) => { b.disabled = true; b.textContent = "Chỉ ứng viên mới ứng tuyển được"; });
      setNote("Tài khoản của bạn không thuộc vai trò ứng viên nên chức năng ứng tuyển đang bị khóa.");
    } else setNote("");
  };

  const syncSave = (saved) => {
    const on = Boolean(saved);
    saveBtns.forEach((b) => { b.classList.toggle("is-saved", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    saveLabels.forEach((l) => { l.textContent = on ? "Đã lưu tin" : "Lưu tin"; });
  };

  syncApply(); syncSave(job.is_saved);
  applyBtns.forEach((btn) => btn.addEventListener("click", () => {
    if (btn.disabled) return;
    if (btn.dataset.needsLogin === "1") { window.location.href = loginUrl(window.location.pathname + window.location.search); return; }
    if (btn.dataset.applied === "1") { window.location.href = appliedJobsUrl(); return; }
    openApplyModal(job, { triggerBtn: btn, onSuccess: () => { job.applied = true; syncApply(); } });
  }));
  saveBtns.forEach((btn) => btn.addEventListener("click", () => toggleSave(job.id, btn, {
    onToast: (msg, type) => showStatusToast(msg, type === "success" ? "success" : "danger"),
    onChanged: (_id, saved) => { job.is_saved = saved; syncSave(saved); opts.onSaveChanged?.(saved); },
  })));
}

export function renderCompanyCard(job, companyDetail = null) {
  const compName = cleanStr(companyDetail?.name || job.company_name) || "Doanh nghiệp tuyển dụng";
  const compLogo = companyDetail?.logo_url || job.company_logo || "";
  $("jd-logo")?.replaceChildren(renderCompanyLogo({ name: compName, logo_url: compLogo }, "lg"));
  if ($("jd-side-company-name")) $("jd-side-company-name").textContent = compName;
  const rows = [], sizeLabel = formatSizeRange(companyDetail?.size_range) || cleanStr(companyDetail?.company_size);
  if (sizeLabel) rows.push(["users", "Quy mô", sizeLabel]);
  const compLoc = cleanStr(companyDetail?.location || companyDetail?.address);
  if (compLoc) rows.push(["pin", "Địa điểm", compLoc]);
  const indName = cleanStr(companyDetail?.industry?.name || companyDetail?.industry_name);
  if (indName) rows.push(["briefcase", "Ngành nghề", indName]);
  renderFactList($("jd-company-facts"), rows);
  const linkEl = $("jd-company-link"), slug = cleanStr(companyDetail?.slug || job.company_slug);
  if (linkEl) { linkEl.hidden = !slug; if (slug) linkEl.href = companyUrl(slug); }
}

export function renderJobHeaderAndBody(job) {
  const title = renderSharedJobContent(job, {
    titleEl: $("jd-title"), companyEl: $("jd-company"), quickGridEl: $("jd-quick-grid"),
    quickItems: [[$("jd-quick-location"), $("jd-location"), job.location], [$("jd-quick-experience"), $("jd-experience"), job.experience || job.experience_level], [$("jd-quick-deadline"), $("jd-deadline"), formatDateVi(job.deadline)]],
    sections: [[$("jd-section-description"), $("jd-description"), job.description], [$("jd-section-requirements"), $("jd-requirements"), job.requirements], [$("jd-section-benefits"), $("jd-benefits"), job.benefits]],
  });
  document.title = `${title} | TechRecruit`;
  if ($("jd-crumb-title")) $("jd-crumb-title").textContent = title;
  if ($("jd-salary")) $("jd-salary").textContent = formatSalary(job);
  const metaRow = $("jd-meta-row"), pubDate = formatDateVi(job.published_at || job.created_at);
  if (metaRow) { metaRow.replaceChildren(); if (pubDate) metaRow.appendChild(el("span", "jd-meta-chip", `Đăng ngày ${pubDate}`)); metaRow.hidden = !pubDate; }
  const catName = cleanStr(job.category_name), catSlug = cleanStr(job.category_slug);
  const skills = Array.isArray(job.skills) ? job.skills.map(cleanStr).filter(Boolean) : [];
  const hasCat = renderTagGroup("jd-overview-cat-wrap", "jd-overview-category", catName ? [catName] : [], () => jobsUrl({ category: catSlug || catName }));
  const hasSkills = renderTagGroup("jd-overview-skills-wrap", "jd-tags", skills, (sk) => jobsUrl({ skills: sk }));
  if ($("jd-section-overview")) $("jd-section-overview").hidden = !hasCat && !hasSkills;
  const lvl = cleanStr(job.level), wt = cleanStr(job.work_type || job.type);
  const edu = cleanStr(job.education || job.education_level), et = cleanStr(job.employment_type || job.job_type);
  const factRows = [];
  if (lvl && lvl !== "Tất cả") factRows.push(["award", "Cấp bậc", lvl, "jd-level"]);
  if (edu) factRows.push(["book", "Học vấn", edu]);
  if (Number(job.quantity) > 0) factRows.push(["users", "Số lượng tuyển", `${Number(job.quantity)} người`]);
  if (wt) factRows.push(["clock", "Hình thức làm việc", wt, "jd-worktype"]);
  if (et && et.toLowerCase() !== wt.toLowerCase()) factRows.push(["layers", "Loại hình", et]);
  if ($("jd-general-card")) $("jd-general-card").hidden = !renderFactList($("jd-facts"), factRows);
  renderCompanyCard(job, null);
}
