/**
 * unemploymentChecklist.js - Danh mục hồ sơ thủ tục hưởng BHTN
 * Nguồn xác minh: Cổng Dịch vụ công Quốc gia (dichvucong.gov.vn) & Bảo hiểm xã hội Việt Nam (bhxh.gov.vn)
 * Theo Luật Việc làm 2025 và Thông tư 15/2023/TT-BLĐTBXH.
 *
 * TODO: Xác minh lại mẫu đơn đề nghị hưởng trợ cấp và thông tư hướng dẫn chi tiết theo Luật Việc làm 2025 trước khi chính thức phát hành.
 */

export const CHECKLIST_STORAGE_KEY = "tr_bhtn_checklist_v1";

export const CHECKLIST_ITEMS = [
  {
    id: "form_01",
    title: "Đơn đề nghị hưởng trợ cấp thất nghiệp",
    // TODO: Xác minh mẫu đơn đề nghị theo Luật Việc làm 2025 (hiện áp dụng Mẫu số 01 Thông tư 15/2023/TT-BLĐTBXH)
    desc: "Mẫu số 01 ban hành kèm theo Thông tư 15/2023/TT-BLĐTBXH (điền trực tuyến trên Cổng DVC hoặc nộp bản giấy).",
    tag: "Bắt buộc",
    tagType: "mandatory"
  },
  {
    id: "termination_doc",
    title: "Bản chính hoặc bản sao chứng thực Giấy tờ chấm dứt HĐLĐ",
    desc: "Quyết định thôi việc, quyết định sa thải, thông báo chấm dứt HĐLĐ hoặc văn bản thỏa thuận chấm dứt.",
    tag: "Bắt buộc",
    tagType: "mandatory"
  },
  {
    id: "social_book",
    title: "Sổ Bảo hiểm xã hội đã chốt thời gian đóng BHTN",
    desc: "Bản chính sổ BHXH và tờ rời xác nhận đầy đủ quá trình đóng BHTN do cơ quan BHXH chốt cấp.",
    tag: "Bắt buộc",
    tagType: "mandatory"
  },
  {
    id: "id_card",
    title: "CCCD / Thẻ căn cước hoặc Hộ chiếu còn thời hạn",
    desc: "Bản sao hoặc hình ảnh rõ nét (xuất trình bản chính để đối chiếu khi nộp trực tiếp tại Trung tâm DVVL).",
    tag: "Giấy tờ tùy thân",
    tagType: "identity"
  },
  {
    id: "bank_acc",
    title: "Tài khoản ngân hàng chính chủ (thẻ ATM)",
    desc: "Tên ngân hàng, chi nhánh và số tài khoản để cơ quan BHXH chi trả tiền trợ cấp thất nghiệp hằng tháng.",
    tag: "Nhận trợ cấp",
    tagType: "bank"
  },
  {
    id: "submit_deadline",
    title: "Nộp hồ sơ trong thời hạn 03 tháng kể từ ngày chấm dứt HĐLĐ",
    desc: "Nộp qua Cổng Dịch vụ công Quốc gia hoặc trực tiếp tại Trung tâm Dịch vụ việc làm nơi muốn nhận trợ cấp.",
    tag: "Hạn chót 3 tháng",
    tagType: "deadline"
  },
  {
    id: "job_search_notify",
    title: "Hằng tháng thông báo về tình hình tìm kiếm việc làm",
    desc: "Thực hiện thông báo định kỳ theo lịch hẹn bằng hình thức điện tử hoặc trực tiếp để duy trì trợ cấp.",
    tag: "Nghĩa vụ hằng tháng",
    tagType: "obligation"
  }
];
