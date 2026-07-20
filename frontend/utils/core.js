// Core loader — inject Firebase SDK, constants, API layer, và auth service vào trang
// Cũng xử lý maintenance redirect và auth redirect cho tất cả các trang
document.write('<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"><\/script>');
document.write('<script src="/frontend/utils/constants.js"><\/script>');
document.write('<script src="/frontend/components/popup.js"><\/script>');
document.write('<script src="/frontend/services/api.js"><\/script>');
document.write('<script src="/frontend/services/authService.js"><\/script>');

// ── Kiểm tra Maintenance Mode ──
// Bỏ qua trên trang maintenance và login
// Nếu user là admin → không redirect
// Nếu maintenance đang bật → redirect sang trang maintenance
document.addEventListener('DOMContentLoaded', function () {
    var path = window.location.pathname;
    // Bỏ qua nếu đang ở trang maintenance hoặc login
    if (path.indexOf('/common/maintenance/') !== -1 || path.indexOf('login.html') !== -1) return;

    // Ẩn body trước khi kiểm tra (tránh flash nội dung)
    document.body.style.display = 'none';
    getMe()
        .then(function (session) {
            // Nếu là admin → hiện body ngay, không cần kiểm tra maintenance
            if (session && !session.error && session.userIsadmin) {
                document.body.style.display = '';
                return;
            }
            // Nếu không phải admin → kiểm tra maintenance status
            return apiGet('/maintenance').then(function (res) {
                if (res && res.enabled) {
                    // Maintenance đang bật → chuyển trang
                    window.location.href = '/frontend/pages/common/maintenance/index.html';
                } else {
                    document.body.style.display = '';
                }
            });
        })
        .catch(function () {
            // Lỗi xác thực → vẫn kiểm tra maintenance
            apiGet('/maintenance')
                .then(function (res) {
                    if (res && res.enabled) {
                        window.location.href = '/frontend/pages/common/maintenance/index.html';
                    } else {
                        document.body.style.display = '';
                    }
                })
                .catch(function () {
                    // Lỗi cả 2 API → hiện body (không chặn trang)
                    document.body.style.display = '';
                });
        });
});

// ── Auth Redirect ──
// Nếu trang có data-auth="user" → kiểm tra đăng nhập, nếu chưa thì redirect sang login
if (document.body.dataset.auth === 'user') {
    document.body.style.display = 'none';
    document.addEventListener('DOMContentLoaded', function () {
        checkAuth().then(function () {
            document.body.style.display = '';
        });
    });
}
