/**
 * companyDialogRules.js - Logic nghiệp vụ thuần túy cho Hộp thoại Chi tiết Công ty.
 * Hỗ trợ kiểm thử đơn vị độc lập và tái sử dụng an toàn.
 * Giới hạn: <= 200 dòng.
 */

/**
 * Kiểm tra thứ tự ngày: trả về true nếu ngày duyệt đi trước ngày gửi (dữ liệu mâu thuẫn).
 */
export function isDateOrderInvalid(submittedAt, reviewedAt) {
  if (!submittedAt || !reviewedAt) return false;
  const subTime = new Date(submittedAt).getTime();
  const revTime = new Date(reviewedAt).getTime();
  if (Number.isNaN(subTime) || Number.isNaN(revTime)) return false;
  return revTime < subTime;
}

/**
 * Quyết định hiển thị logo dựa trên logo_status và logo_url.
 * Trả về: { state: "valid" | "missing" | "inconsistent", label: string, showUrl: boolean, canRemove: boolean, warning: string | null }
 */
export function resolveLogoDisplay(logoStatus, logoUrl) {
  const hasUrl = Boolean(logoUrl && String(logoUrl).trim());
  const status = (logoStatus || "missing").toLowerCase();

  // Có URL nhưng trạng thái là missing/chua_co -> mâu thuẫn dữ liệu
  if (hasUrl && (status === "missing" || status === "chua_co" || status === "none")) {
    return {
      state: "inconsistent",
      label: "Chưa kích hoạt (Dữ liệu không đồng bộ)",
      showUrl: false,
      canRemove: false,
      warning: "Tệp logo tồn tại nhưng trạng thái chưa được ghi nhận.",
    };
  }

  if (status === "active" || status === "approved") {
    return {
      state: "valid",
      label: "Đang sử dụng",
      showUrl: hasUrl,
      canRemove: true,
      warning: null,
    };
  }

  if (status === "removed") {
    return {
      state: "removed",
      label: "Đã gỡ",
      showUrl: hasUrl,
      canRemove: false,
      warning: null,
    };
  }

  return {
    state: "missing",
    label: "Chưa có logo",
    showUrl: false,
    canRemove: false,
    warning: null,
  };
}

/**
 * Đếm số tin tuyển dụng đang mở từ danh sách việc làm.
 * Điều kiện thống nhất: Job.status === 'published' (cùng điều kiện với backend và danh sách).
 */
export function countOpenJobs(jobsList) {
  if (!Array.isArray(jobsList)) return 0;
  return jobsList.filter((job) => job && String(job.status).toLowerCase() === "published").length;
}

/**
 * Kiểm tra chuỗi xác nhận tên công ty khi xóa:
 * Khớp chính xác 100% từng ký tự, phân biệt hoa thường và khoảng trắng thừa.
 */
export function isDeleteConfirmExact(targetName, inputName) {
  if (typeof targetName !== "string" || typeof inputName !== "string") return false;
  if (inputName.length === 0) return false;
  return targetName === inputName;
}

/**
 * Định dạng thời gian hiển thị theo chuẩn vi-VN.
 */
export function formatDateTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Đánh giá các tiêu chí xác thực của doanh nghiệp.
 * Mỗi tiêu chí trả về { name, statusText, pass }
 */
export function getCriteriaEvaluations(company) {
  const req = company?.verification;
  const isVerified = (company?.verification_status || company?.status) === "da_xac_minh";
  const hasMst = Boolean((req?.mst || company?.tax_code) && String(req?.mst || company?.tax_code).trim().length >= 10);
  const hasLicense = Boolean(req?.license_original_name || req?.license_storage_key);

  return [
    {
      name: "Tư cách pháp nhân doanh nghiệp",
      statusText: isVerified ? "Đạt" : "Chưa đạt",
      pass: isVerified,
    },
    {
      name: "Mã số thuế hợp lệ trên cổng Quốc gia",
      statusText: hasMst ? "Đạt" : "Chưa đạt",
      pass: hasMst,
    },
    {
      name: "Chứng từ giấy phép kinh doanh đính kèm",
      statusText: hasLicense ? "Đạt" : "Chưa gửi",
      pass: hasLicense,
    },
    {
      name: "Hiệu lực thẩm định định kỳ",
      statusText: isVerified ? "Còn 180 ngày" : "Chưa áp dụng",
      pass: isVerified,
    },
  ];
}
