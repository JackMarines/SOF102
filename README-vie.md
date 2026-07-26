=========================================
  DEVCLIMB
  Nền Tảng Thử Thách Lập Trình 
=========================================

DevClimb là nền tảng thử thách lập trình trực tuyến, nơi người dùng giải các
bài toán lập trình, lập đội thi đấu, cạnh tranh trong các cuộc thi có thời
gian, và giành được cúp thưởng. Các tính năng và chức năng dự án phần lớn
được truyền cảm hứng từ Leetcode, được xây dựng từ đầu với giao diện terminal.

Backend sử dụng Java servlets, frontend sử dụng vanilla HTML/CSS/JS.

  [Ảnh chụp: Trang chủ / phần hero]


Giới Thiệu
-----------
DevClimb là dự án FPT Polyschool được thực hiện bởi nhóm LBKT Studio (PRO230).
Dự án là nền tảng hoạt động đầy đủ với khả năng chạy code thời gian thực,
quản lý đội, công cụ quản trị, và hệ thống thi đấu với bảng xếp hạng.

Người dùng có thể đăng ký qua email hoặc OAuth (Google/GitHub), tham gia
hoặc tạo đội, duyệt các bài theo độ khó, viết và nộp code trong trình soạn
thảo trên trình duyệt, và xem kết quả ngay lập tức. Các cuộc thi bổ sung
tầng cạnh tranh với thử thách có thời hạn và phần thưởng cúp.


Tính Năng
---------

  Bài Tập & Chạy Code
  Viết code trực tiếp trên trình duyệt bằng trình soạn thảo CodeMirror. Nộp
  và nhận phản hồi ngay lập tức từ Judge0, xem các test case nào đạt, thời
  gian chạy, và lỗi nếu có. Hỗ trợ Python, JavaScript, và PHP.

  [Ảnh chụp: Trình soạn thảo code với kết quả test case]

  Cuộc Thi & Cúp Thưởng
  Quản trị viên tạo các cuộc thi có thời gian chứa nhiều bài tập. Giải tất
  cả bài trước khi cuộc thi kết thúc để giành cúp. Bảng Vinh Danh theo
  dõi người giải nhanh nhất, tham gia nhiều nhất, và code ngắn nhất.

  [Ảnh chụp: Trang danh sách cuộc thi với Bảng Vinh Danh]

  [Ảnh chụp: Hộp thoại cúp thưởng]

  Đội
  Tạo đội với bạn bè, xem tiến độ của nhau, và leo bảng xếp hạng cùng
  nhau. Đội có thể công khai hoặc riêng tư, với hồ sơ và thông báo có thể
  chỉnh sửa.

  [Ảnh chụp: Trang đội với thành viên và thống kê]

  Hồ Sơ & Xếp Hạng
  Mỗi người dùng có hồ sơ hiển thị xếp hạng, tổng điểm, số bài đã giải,
  đội đang tham gia, và lịch sử hoạt động.

  [Ảnh chụp: Trang hồ sơ người dùng]

  Thông Báo
  Quản trị viên đăng thông báo với các danh mục khác nhau (bảo trì, phát
  hành, tính năng, v.v.) hiển thị dạng banner trên toàn trang.

  [Ảnh chụp: Trang thông báo]

  Bảng Điều Khiển Quản Trị
  Bảng quản lý đầy đủ cho người dùng, đội, bài tập, cuộc thi, cúp, cảnh
  báo, và thông báo. Bao gồm biểu đồ phân tích hoạt động giải theo thời
  gian.

  [Ảnh chụp: Bảng điều khiển quản trị với biểu đồ]

  [Ảnh chụp: Quản lý bài tập/cuộc thi]

  Kiểm Soát
  Quản trị viên có thể gửi cảnh báo có thời hạn, cấm người dùng hoặc đội,
  và xem đơn khiếu nại. Chế độ bảo trì có thể tạm thời chặn quyền truy
  cập của người dùng không phải quản trị.

  Giao Diện Sáng & Tối
  Chuyển đổi giữa chế độ sáng và tối. Sở thích được lưu cục bộ.

  [Ảnh chụp: Chế độ tối so với chế độ sáng]


Công Nghệ Sử Dụng
------------------

  Backend
    Java 21, Jakarta Servlet 6.0, Hibernate/JPA, MySQL 8, Maven, REST API

  Frontend
    Vanilla HTML/CSS/JS (không dùng framework), GSAP, CodeMirror, Chart.js

  Xác Thực
    Firebase Authentication (Email/Mật khẩu, Google, GitHub OAuth)

  Lưu Trữ
    Cloudflare R2 cho tải lên hình ảnh (ảnh đại diện, banner cuộc thi)

  Chạy Code
    Judge0 CE API (Community Edition)

  Cơ Sở Dữ Liệu
    MySQL 8 hosted trên Aiven Cloud


Bắt Đầu
--------

  Yêu Cầu
    - Java 21
    - Maven 3.9+
    - Apache Tomcat 11
    - Cơ sở dữ liệu MySQL 8
    - Dự án Firebase có bật Authentication
    - Bucket Cloudflare R2 cho tải lên tệp
    - Instance Judge0 CE cho chạy code

  1. Clone repo

  2. Thiết lập các tệp cấu hình (đều bị gitignore):
       backend/src/main/resources/META-INF/persistence.xml
         -> URL cơ sở dữ liệu, tên người dùng, mật khẩu
       backend/src/main/resources/firebase-service-account.json
         -> Thông tin xác thực Firebase Admin SDK
       backend/src/main/resources/r2.properties
         -> Access key, secret, bucket, endpoint của Cloudflare R2
       backend/ca-truststore.jks
         -> SSL truststore cho kết nối Aiven DB
       frontend/utils/constants.js
         -> API_BASE URL và cấu hình Firebase web

  3. Build và chạy backend:
       mvn clean package cargo:run -f backend/pom.xml

  4. Serve thư mục frontend bằng bất kỳ máy chủ tệp tĩnh nào
     (ví dụ: VS Code Live Server trên cổng 5500)

  [Ảnh chụp: Terminal đang chạy mvn cargo:run]


Cấu Trúc Dự Án
---------------

  backend/
    src/main/java/
      controller/     22 servlet controller
      entity/         13 lớp thực thể JPA
      dao/            11 đối tượng truy cập dữ liệu
      filter/         CORS và filter xác thực admin
      service/        Dịch vụ xác thực Firebase
      util/           Cơ sở dữ liệu, phản hồi, tải tệp, chạy code

  frontend/
    assets/css/       Token thiết kế, reset, component, kiểu chủ đề
    components/       Các thành phần UI tái sử dụng (navbar, bảng, popup, v.v.)
    services/         Các mô-đun dịch vụ API (wrapper mỏng cho mỗi resource)
    utils/            hằng số cấu hình
    pages/
      common/         Trang chung (đăng nhập, thông báo, bảo trì)
      guest/          Trang công khai (duyệt bài, đội, hồ sơ)
      user/           Trang đã đăng nhập (trang chủ, giải bài, cuộc thi, cài đặt)
      admin/          Bảng quản trị (dashboard, tạo cuộc thi)

  [Ảnh chụp: Cấu trúc thư mục dự án]


Cơ Sở Dữ Liệu
--------------
  13 bảng: user, team, puzzle, language, contest, testcase, progress,
  trophy, user_trophy, warning, appeal, announcement, maintenance

  Hibernate tự động tạo và cập nhật schema khi khởi động (hbm2ddl=update).


Cách Thức Chạy Code
--------------------
  1. Người dùng viết hàm trong trình soạn thảo trên trình duyệt
  2. Frontend gửi code + tên hàm đến backend
  3. Backend bọc code trong template (đọc JSON từ stdin, gọi hàm của
     người dùng)
  4. Code đã bọc được gửi đến Judge0 CE cùng với các test case
  5. Backend polling chờ kết quả, phân tích pass/fail từng test case
  6. Kết quả được gửi lại frontend để hiển thị

  [Ảnh chụp: Kết quả nộp bài hiển thị pass/fail từng test case]


Bảo Mật
--------
  - Xác thực token Firebase cho mọi yêu cầu đã xác thực
  - Xác thực dựa trên session với bảo vệ chống cố định session
  - CORS whitelist (localhost:5500, devclimb.online, api.devclimb.online)
  - Endpoint quản trị phía sau filter xác thực riêng
  - Giới hạn độ dài source code: 100KB mỗi lần nộp
