/**
 * companyDetailSections.js - Render giới thiệu, sidebar, công ty cùng ngành & trạng thái 404/lỗi (< 185 dòng).
 */
import { createCompanyCardElement } from "./companyCard.js";
import { companiesUrl, routePath } from "../routes.js";
import { formatDomain, formatSizeRange, safeUrl } from "../utils/companyUtils.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = String(text);
  return n;
};

export function renderAboutSection(comp) {
  const aboutSec = $("company-about-section"), prose = $("company-about-prose"), btn = $("btn-about-toggle");
  if (!aboutSec || !prose || !btn) return;
  const desc = (comp.description || "").trim();
  aboutSec.hidden = !desc;
  if (!desc) return;
  prose.replaceChildren();
  desc.split(/\r?\n\s*\r?\n|\r?\n/).map((p) => p.trim()).filter(Boolean).forEach((p) => prose.appendChild(el("p", "", p)));
  prose.classList.add("is-collapsed");
  btn.setAttribute("aria-expanded", "false");
  btn.textContent = "Xem thêm";
  requestAnimationFrame(() => {
    const over = prose.scrollHeight > prose.clientHeight + 4;
    btn.hidden = !over;
    if (!over) prose.classList.remove("is-collapsed");
  });
  btn.onclick = () => {
    const open = btn.getAttribute("aria-expanded") !== "true";
    prose.classList.toggle("is-collapsed", !open);
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Thu gọn" : "Xem thêm";
  };
}

export function renderSidebarAndSimilar(comp) {
  const infoCard = $("company-info-card"), infoList = $("company-info-list");
  if (infoCard && infoList) {
    infoList.replaceChildren();
    const addr = (comp.address || comp.location || "").trim();
    if (addr) {
      const row = el("div", "company-info-row"), dd = el("dd", "", addr);
      const map = el("a", "company-map-link", "Mở bản đồ");
      map.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
      map.target = "_blank"; map.rel = "noopener noreferrer nofollow";
      dd.append(document.createElement("br"), map);
      row.append(el("dt", "", "Địa chỉ"), dd);
      infoList.appendChild(row);
    }
    const sz = formatSizeRange(comp.size_range);
    if (sz) infoList.appendChild(el("div", "company-info-row")).append(el("dt", "", "Quy mô"), el("dd", "", sz));
    if (comp.founded_year) infoList.appendChild(el("div", "company-info-row")).append(el("dt", "", "Năm thành lập"), el("dd", "", String(comp.founded_year)));
    const web = safeUrl(comp.website, ["http:", "https:"]);
    if (web) {
      const row = el("div", "company-info-row"), dd = el("dd"), a = el("a", "company-map-link", formatDomain(web));
      a.href = web; a.target = "_blank"; a.rel = "noopener noreferrer nofollow";
      dd.appendChild(a); row.append(el("dt", "", "Website"), dd);
      infoList.appendChild(row);
    }
    infoCard.hidden = infoList.children.length === 0;
  }

  const skCard = $("company-skills-card"), skList = $("company-skills-list");
  if (skCard && skList) {
    const skills = Array.isArray(comp.top_skills) ? comp.top_skills : [];
    skList.replaceChildren();
    skCard.hidden = skills.length < 3;
    if (skills.length >= 3) {
      skills.forEach((s) => {
        const a = el("a", "company-side-skill-link", `${s.name} (${s.count})`);
        a.href = `${routePath("pages/jobs.html")}?skills=${encodeURIComponent(s.slug)}&company=${encodeURIComponent(comp.slug)}`;
        skList.appendChild(a);
      });
    }
  }

  const simSec = $("company-similar-section"), simGrid = $("company-similar-grid");
  if (simSec && simGrid) {
    const sim = Array.isArray(comp.similar) ? comp.similar : [];
    simGrid.replaceChildren();
    simSec.hidden = sim.length < 2;
    sim.slice(0, 3).forEach((item) => simGrid.appendChild(createCompanyCardElement(item, { compact: true })));
  }
}

export function renderCompanyPageState({ is404, onRetry }) {
  if ($("breadcrumb-company-name")) $("breadcrumb-company-name").textContent = is404 ? "Không tìm thấy" : "Lỗi kết nối";
  if ($("company-skeleton-host")) $("company-skeleton-host").hidden = true;
  const root = $("company-detail-root");
  if (root) { root.replaceChildren(); root.hidden = true; }
  const host = $("company-state-host");
  if (!host) return;
  host.replaceChildren();
  const card = el("div", "company-state-card");
  card.append(
    el("h1", "", is404 ? "Không tìm thấy công ty" : "Không thể tải thông tin công ty"),
    el("p", "", is404 ? "Hồ sơ doanh nghiệp này không tồn tại hoặc hiện không hiển thị công khai." : "Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.")
  );
  if (is404) {
    const a = el("a", "btn btn-primary", "Xem danh sách công ty");
    a.href = companiesUrl();
    card.appendChild(a);
  } else {
    const btn = el("button", "btn btn-primary", "Thử lại");
    btn.type = "button"; btn.id = "company-detail-retry";
    btn.addEventListener("click", () => onRetry?.());
    card.appendChild(btn);
  }
  host.appendChild(card);
  host.hidden = false;
}

export function renderFacetChips(hostId, items, activeVal, onSelect) {
  const host = $(hostId);
  if (!host) return;
  host.replaceChildren();
  const list = Array.isArray(items) ? items : [];
  if (list.length <= 1 && !activeVal) return;
  const mk = (val, label, active) => {
    const b = el("button", `company-facet-btn${active ? " is-active" : ""}`, label);
    b.type = "button"; b.setAttribute("aria-pressed", String(active));
    b.addEventListener("click", () => onSelect(active && val ? "" : val));
    return b;
  };
  host.appendChild(mk("", "Tất cả", !activeVal));
  list.forEach((f) => host.appendChild(mk(f.value, `${f.label} (${f.count})`, f.value === activeVal)));
}

export function renderCompanyJobsFallback(container, { isError, onRetry }) {
  if (!container) return;
  container.replaceChildren();
  const box = el("div", `companies-state-box${isError ? " is-error" : ""}`);
  box.appendChild(el("p", "companies-state-desc", isError ? "Không thể tải danh sách việc làm của công ty." : "Công ty hiện chưa có vị trí đang tuyển"));
  if (isError) {
    const btn = el("button", "btn btn-primary", "Thử lại");
    btn.type = "button"; btn.id = "company-jobs-retry";
    btn.addEventListener("click", () => onRetry?.());
    box.appendChild(btn);
  } else {
    const a = el("a", "btn btn-primary", "Xem công ty khác đang tuyển");
    a.href = `${companiesUrl()}?hiring=1`;
    box.appendChild(a);
  }
  container.appendChild(box);
}
