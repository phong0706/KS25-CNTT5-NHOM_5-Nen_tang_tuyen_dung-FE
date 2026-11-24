/**
 * companySuggest.js - Autocomplete tìm công ty (debounce 250ms, AbortController) & chip lọc (< 120 dòng).
 */
import { companyUrl } from "../routes.js";

export function attachCompanySuggest({ formEl, inputEl, boxEl, onSubmitQuery }) {
  if (!formEl || !inputEl || !boxEl) return;
  let timer = null;
  let abortCtrl = null;
  let items = [];
  let activeIdx = -1;

  const close = () => {
    items = [];
    activeIdx = -1;
    boxEl.hidden = true;
    boxEl.replaceChildren();
    inputEl.setAttribute("aria-expanded", "false");
    inputEl.removeAttribute("aria-activedescendant");
  };

  const highlight = () => {
    Array.from(boxEl.children).forEach((li, idx) => li.classList.toggle("is-active", idx === activeIdx));
    if (activeIdx >= 0 && boxEl.children[activeIdx]) {
      inputEl.setAttribute("aria-activedescendant", boxEl.children[activeIdx].id);
    } else {
      inputEl.removeAttribute("aria-activedescendant");
    }
  };

  const run = async (term) => {
    if (abortCtrl) abortCtrl.abort();
    if (!term) { close(); return; }
    abortCtrl = new AbortController();
    try {
      const res = await window.api.get("/companies", { q: term, hiring: 0, page_size: 6 }, { signal: abortCtrl.signal });
      if (inputEl.value.trim() !== term) return;
      items = (res.items || []).slice(0, 6);
      activeIdx = -1;
      boxEl.replaceChildren();
      if (!items.length) { close(); return; }

      items.forEach((item, idx) => {
        const li = document.createElement("li");
        li.id = `company-suggest-opt-${idx}`;
        li.className = "companies-suggest-item";
        li.setAttribute("role", "option");
        const nameEl = document.createElement("span");
        nameEl.textContent = item.name || "";
        const metaEl = document.createElement("span");
        metaEl.className = "companies-suggest-meta";
        metaEl.textContent = item.open_jobs > 0 ? `${item.open_jobs} việc` : (item.location || "");
        li.append(nameEl, metaEl);
        li.addEventListener("mousedown", (e) => {
          e.preventDefault();
          window.location.href = companyUrl(item.slug);
        });
        boxEl.appendChild(li);
      });
      boxEl.hidden = false;
      inputEl.setAttribute("aria-expanded", "true");
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.name !== "AbortError") close();
    }
  };

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    close();
    onSubmitQuery?.(inputEl.value.trim());
  });
  inputEl.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => run(inputEl.value.trim()), 250);
  });
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { close(); return; }
    if (!items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = (activeIdx + 1) % items.length; highlight(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = (activeIdx - 1 + items.length) % items.length; highlight(); }
    else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      window.location.href = companyUrl(items[activeIdx].slug);
    }
  });
  document.addEventListener("click", (e) => { if (!formEl.contains(e.target)) close(); });
}

export function renderActiveFilterChips(host, state, facets, onRemove, onReset) {
  if (!host) return;
  const labelOf = (arr, v) => arr?.find((x) => x.value === v)?.label || v;
  const chips = [];
  if (state.q) chips.push({ key: "q", text: `Từ khóa: "${state.q}"` });
  if (state.industry) chips.push({ key: "industry", text: `Ngành: ${labelOf(facets.industry, state.industry)}` });
  if (state.location) chips.push({ key: "location", text: `Địa điểm: ${labelOf(facets.location, state.location)}` });
  if (state.size) chips.push({ key: "size", text: `Quy mô: ${labelOf(facets.size, state.size)}` });
  if (state.hiring === 0) chips.push({ key: "hiring", text: "Bao gồm công ty 0 tin" });

  host.replaceChildren();
  host.hidden = chips.length === 0;
  if (!chips.length) return;

  chips.forEach((ch) => {
    const chip = document.createElement("span");
    chip.className = "companies-chip";
    chip.appendChild(document.createTextNode(ch.text));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.setAttribute("aria-label", `Bỏ lọc ${ch.text}`);
    btn.addEventListener("click", () => onRemove?.(ch.key));
    chip.appendChild(btn);
    host.appendChild(chip);
  });

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "companies-chip-clear";
  clearBtn.textContent = "Xóa tất cả";
  clearBtn.addEventListener("click", () => onReset?.());
  host.appendChild(clearBtn);
}
