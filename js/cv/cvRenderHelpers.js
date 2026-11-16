/**
 * Các hàm bổ trợ render nội dung an toàn cho template CV.
 */
export function safeEscape(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderLinesAsList(text) {
  if (!text) return "";
  const lines = String(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";
  const items = lines.map((line) => {
    const cleaned = line.replace(/^[-•*]\s*/, "");
    return `<li>${safeEscape(cleaned)}</li>`;
  });
  return `<ul class="cv-bullet-list">${items.join("")}</ul>`;
}

export function formatMonthDisplay(monthStr) {
  if (!monthStr) return "";
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  return safeEscape(monthStr);
}

export function getTemplateMeta(slug) {
  const meta = {
    simple: {
      name: "Đơn giản",
      tagline: "Tinh gọn, trang nhã, tối ưu hóa tuyệt đối cho hệ thống lọc hồ sơ tự động.",
      is_ats: true,
      category: "Phổ biến",
    },
    creative: {
      name: "Ấn tượng",
      tagline: "Bố cục 2 cột với dải nhấn sáng tạo, làm nổi bật kỹ năng và phong cách cá nhân.",
      is_ats: false,
      category: "Sáng tạo",
    },
    professional: {
      name: "Chuyên nghiệp",
      tagline: "Cấu trúc hiện đại với timeline rõ ràng, phù hợp cho kỹ sư từ mid-level đến senior.",
      is_ats: false,
      category: "Kinh doanh & Tech",
    },
    academic: {
      name: "Học thuật",
      tagline: "Phong cách chuẩn mực một cột, tập trung vào học vấn, nghiên cứu và kỹ năng chuyên sâu.",
      is_ats: true,
      category: "Học thuật & R&D",
    },
  };
  return meta[slug] || meta.simple;
}
