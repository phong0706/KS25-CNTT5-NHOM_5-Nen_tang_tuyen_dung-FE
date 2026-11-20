/**
 * roleQuizConfig.js - Bộ 8 câu hỏi trắc nghiệm định hướng vai trò IT
 * Giới hạn: < 200 dòng.
 */
export const ROLE_QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Bạn cảm thấy hứng thú nhất khi tạo ra loại sản phẩm hoặc giá trị nào?",
    options: [
      { text: "Giao diện web trực quan, thiết kế mượt mà, tối ưu tương tác người dùng.", weights: { frontend: 4, mobile: 1 } },
      { text: "Hệ thống backend xử lý dữ liệu lớn, tính toán logic phức tạp và bảo mật.", weights: { backend: 4, "ai-data": 1 } },
      { text: "Ứng dụng di động (iOS/Android) gọn gàng trên thiết bị cầm tay người dùng.", weights: { mobile: 4, frontend: 1 } },
      { text: "Hạ tầng đám mây tự động hóa, CI/CD thông suốt và máy chủ ổn định.", weights: { "devops-cloud": 4, backend: 1 } },
      { text: "Mô hình trí tuệ nhân tạo, trích xuất tri thức và phân tích dự đoán.", weights: { "ai-data": 4, backend: 1 } },
    ],
  },
  {
    id: 2,
    question: "Khi gặp một sự cố phần mềm (bug), bạn ưu tiên kiểm tra điều gì trước tiên?",
    options: [
      { text: "Mở DevTools kiểm tra render DOM, CSS styling, responsive và console log.", weights: { frontend: 4, mobile: 1 } },
      { text: "Kiểm tra query SQL, transaction database, indexing và log server backend.", weights: { backend: 4, "qa-testing": 1 } },
      { text: "Tái hiện lỗi qua test case, viết automation test để chặn lỗi hồi quy.", weights: { "qa-testing": 4, "devops-cloud": 1 } },
      { text: "Kiểm tra container Docker, log Kubernetes, tài nguyên CPU/RAM và network.", weights: { "devops-cloud": 4, backend: 1 } },
      { text: "Kiểm tra chất lượng dữ liệu đầu vào, phân phối mẫu và sai lệch mô hình AI.", weights: { "ai-data": 4, "qa-testing": 1 } },
    ],
  },
  {
    id: 3,
    question: "Bộ công cụ hoặc ngôn ngữ lập trình nào khiến bạn làm việc hứng khởi nhất?",
    options: [
      { text: "JavaScript, TypeScript, React, Next.js, HTML5 & Tailwind CSS.", weights: { frontend: 4, mobile: 1 } },
      { text: "Python, Java, Go, C# / .NET, kết hợp cùng MySQL, PostgreSQL, Redis.", weights: { backend: 4, "ai-data": 1 } },
      { text: "Kotlin, Swift, Flutter, React Native trên Android Studio hoặc Xcode.", weights: { mobile: 4, frontend: 1 } },
      { text: "Docker, Kubernetes, Linux, Terraform, AWS/GCP, GitHub Actions / CI/CD.", weights: { "devops-cloud": 4, "qa-testing": 1 } },
      { text: "Python, PyTorch, TensorFlow, Pandas, NumPy, Scikit-learn, SQL phân tích.", weights: { "ai-data": 4, backend: 1 } },
    ],
  },
  {
    id: 4,
    question: "Thời gian làm việc hàng ngày của bạn nên tập trung nhiều nhất vào khía cạnh nào?",
    options: [
      { text: "Chăm chút giao diện chuẩn thiết kế, nâng cao trải nghiệm người dùng và tốc độ render.", weights: { frontend: 4 } },
      { text: "Thiết kế schema CSDL, xây dựng API chuẩn RESTful/gRPC và tối ưu logic dịch vụ.", weights: { backend: 4 } },
      { text: "Tối ưu hóa hiệu năng ứng dụng di động, tiết kiệm pin và tương thích thiết bị.", weights: { mobile: 4 } },
      { text: "Quản trị máy chủ, thiết lập giám sát cảnh báo và tự động hóa triển khai sản phẩm.", weights: { "devops-cloud": 4 } },
      { text: "Thiết kế ma trận kiểm thử, viết kịch bản tự động và bảo đảm chất lượng phát hành.", weights: { "qa-testing": 4 } },
    ],
  },
  {
    id: 5,
    question: "Trong một dự án hoàn thành, kết quả nào mang lại cho bạn cảm giác tự hào nhất?",
    options: [
      { text: "Người dùng hài lòng với trải nghiệm mượt mà, thao tác tiện lợi và giao diện đẹp.", weights: { frontend: 3, mobile: 2 } },
      { text: "Hệ thống chịu tải hàng vạn giao dịch mỗi giây mà không gián đoạn dịch vụ.", weights: { backend: 4, "devops-cloud": 1 } },
      { text: "Toàn bộ tính năng xuất xưởng không phát sinh lỗi nhờ bộ test tự động phủ rộng.", weights: { "qa-testing": 4, "devops-cloud": 1 } },
      { text: "Quy trình triển khai chạy tự động chỉ bằng một lệnh commit, uptime đạt 99.99%.", weights: { "devops-cloud": 4, backend: 1 } },
      { text: "Mô hình dự đoán đưa ra gợi ý chính xác, tạo ra giá trị kinh doanh thực tế.", weights: { "ai-data": 4 } },
    ],
  },
  {
    id: 6,
    question: "Cách bạn thường tiếp cận khi muốn tìm hiểu một công nghệ mới là gì?",
    options: [
      { text: "Tạo ngay một dự án demo web nhỏ để thử các component và hiệu ứng mới.", weights: { frontend: 3, mobile: 1 } },
      { text: "Nghiên cứu kiến trúc, benchmark hiệu năng query và kiểm tra cấu trúc dữ liệu.", weights: { backend: 3, "devops-cloud": 1 } },
      { text: "Cài đặt vào cụm máy ảo/container, viết pipeline kiểm tra tự động.", weights: { "devops-cloud": 3, "qa-testing": 1 } },
      { text: "Nạp tập dữ liệu thực tế để chạy thử nghiệm thuật toán và đánh giá sai số.", weights: { "ai-data": 3, backend: 1 } },
      { text: "Đọc tài liệu đặc tả, liệt kê các ca biên (edge cases) và viết test case kiểm chứng.", weights: { "qa-testing": 3, backend: 1 } },
    ],
  },
  {
    id: 7,
    question: "Thử thách kỹ thuật nào khiến bạn muốn đào sâu và giải quyết triệt để?",
    options: [
      { text: "Đảm bảo tính tương thích đa trình duyệt, chuẩn trợ năng (A11y) và animation 60fps.", weights: { frontend: 4 } },
      { text: "Xử lý Concurrency, tránh race condition, thiết kế caching và an toàn dữ liệu.", weights: { backend: 4 } },
      { text: "Tối ưu bộ nhớ di động, cơ chế hoạt động offline và nhận thông báo đẩy tức thì.", weights: { mobile: 4 } },
      { text: "Bảo mật hạ tầng đám mây, kiến trúc zero-trust và quy trình khôi phục thảm họa.", weights: { "devops-cloud": 4 } },
      { text: "Tự động hóa kiểm thử hồi quy cho các luồng thanh toán và nghiệp vụ phức tạp.", weights: { "qa-testing": 4 } },
    ],
  },
  {
    id: 8,
    question: "Mục tiêu phát triển chuyên môn trong 2-3 năm tới mà bạn hướng tới nhất là gì?",
    options: [
      { text: "Trở thành Chuyên gia UI/UX hoặc Frontend Tech Lead dẫn dắt sản phẩm web hiện đại.", weights: { frontend: 4 } },
      { text: "Trở thành Backend Architect làm chủ hệ thống phân tán và dịch vụ cốt lõi.", weights: { backend: 4 } },
      { text: "Trở thành DevOps / Cloud / SRE Engineer tối ưu hóa hạ tầng và quy trình CI/CD.", weights: { "devops-cloud": 4 } },
      { text: "Trở thành AI Engineer / Data Scientist giải quyết các bài toán dữ liệu lớn.", weights: { "ai-data": 4 } },
      { text: "Trở thành QA Automation Specialist / Quality Lead kiểm soát chất lượng sản phẩm.", weights: { "qa-testing": 4 } },
    ],
  },
];
