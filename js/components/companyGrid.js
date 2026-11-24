/**
 * Component lưới công ty nổi bật (trang chủ).
 * Dùng chung createCompanyCardElement biến thể compact từ companyCard.js.
 */
import { createCompanyCardElement, renderCompanySkeletons as renderCardSkeletons } from "./companyCard.js";

export function renderCompanySkeletons(container, count = 4) {
  renderCardSkeletons(container, count, true);
}

export function renderCompanyGrid(container, companies) {
  if (!container) return;
  container.replaceChildren();
  const list = Array.isArray(companies) ? companies.slice(0, 4) : [];
  list.forEach((comp) => container.appendChild(createCompanyCardElement(comp, { compact: true })));
}
