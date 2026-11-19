/**
 * jobDetail.js - Điều phối trang chi tiết việc làm (/pages/job-detail.html?id=...).
 */
import { jobsUrl } from "../routes.js";
import { fetchCachedMeta } from "../utils/urlState.js";
import {
  bindSharedJobActions,
  cleanStr,
  renderCompanyCard,
  renderJobHeaderAndBody,
} from "./jobDetailView.js";

function renderRelatedFilters(job, categories = [], locations = []) {
  const card = document.getElementById("jd-related-card"), host = document.getElementById("jd-related");
  if (!card || !host) return;
  host.replaceChildren();
  const pick = (items, match) => items
    .filter((it) => Number(it.job_count) >= 1 && cleanStr(it.name) && cleanStr(it.slug))
    .sort((a, b) => ((b.slug === match || b.name === match) ? 1 : 0) - ((a.slug === match || a.name === match) ? 1 : 0))
    .slice(0, 6);
  const groups = [
    ["Danh mục nghề", pick(categories, job.category_slug), (c) => jobsUrl({ category: c.slug })],
    ["Khu vực", pick(locations, cleanStr(job.location)), (l) => jobsUrl({ location: l.slug })],
  ];
  let shown = 0;
  groups.forEach(([title, list, toHref]) => {
    if (!list.length) return;
    shown += 1;
    const grp = document.createElement("div"); grp.className = "jd-related-group";
    const lbl = document.createElement("span"); lbl.className = "jd-related-label"; lbl.textContent = title;
    const tags = document.createElement("div"); tags.className = "jd-tag-list";
    list.forEach((it) => {
      const a = document.createElement("a"); a.className = "jd-filter-tag";
      a.textContent = `${it.name} (${Number(it.job_count)})`; a.href = toHref(it); tags.appendChild(a);
    });
    grp.append(lbl, tags); host.appendChild(grp);
  });
  card.hidden = shown === 0;
}

async function hydrateSideDetails(job) {
  const slug = cleanStr(job.company_slug);
  const [compRes, catRes, locRes] = await Promise.allSettled([
    slug ? window.api.get(`/companies/${encodeURIComponent(slug)}`) : Promise.resolve(null),
    fetchCachedMeta("/meta/categories"),
    fetchCachedMeta("/meta/locations"),
  ]);
  if (compRes.status === "fulfilled" && compRes.value) {
    renderCompanyCard(job, compRes.value);
  }
  const categories = catRes.status === "fulfilled" && Array.isArray(catRes.value) ? catRes.value : [];
  const locations = locRes.status === "fulfilled" && Array.isArray(locRes.value) ? locRes.value : [];
  renderRelatedFilters(job, categories, locations);
}

function showError(message) {
  document.getElementById("jd-loading")?.setAttribute("hidden", "");
  document.getElementById("jd-mobile-bar")?.setAttribute("hidden", "");
  document.getElementById("jd-error")?.removeAttribute("hidden");
  const msgEl = document.getElementById("jd-error-msg");
  if (msgEl) msgEl.textContent = message || "Tin tuyển dụng này có thể đã được gỡ bỏ hoặc chưa được công bố.";
}

async function init() {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  if (!id || id <= 0) {
    showError("Thiếu mã tin tuyển dụng trên đường dẫn.");
    return;
  }
  try {
    const job = await window.api.get(`/jobs/${id}`);
    renderJobHeaderAndBody(job);
    bindSharedJobActions(job, {
      applyBtns: [document.getElementById("jd-apply-btn"), document.getElementById("jd-mobile-apply-btn")],
      saveBtns: [document.getElementById("jd-save-btn"), document.getElementById("jd-mobile-save-btn")],
      saveLabels: [document.getElementById("jd-save-label"), document.getElementById("jd-mobile-save-label")],
      noteEl: document.getElementById("jd-side-note"),
      primaryLabel: "Ứng tuyển",
    });
    document.getElementById("jd-loading")?.setAttribute("hidden", "");
    document.getElementById("jd-content")?.removeAttribute("hidden");
    document.getElementById("jd-mobile-bar")?.removeAttribute("hidden");
    hydrateSideDetails(job);
  } catch (err) {
    showError(err?.message);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
