// Core loader — inject Firebase SDK, constants, API layer, và auth service vào trang
// Cũng xử lý maintenance redirect và auth redirect cho tất cả các trang
document.write('<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"><\/script>');
document.write('<script src="/frontend/utils/constants.js"><\/script>');
document.write('<script src="/frontend/components/popup.js"><\/script>');
document.write('<script src="/frontend/services/api.js"><\/script>');
document.write('<script src="/frontend/services/authService.js"><\/script>');

// ── Kiểm tra Maintenance Mode ──
// Admin users bypass the check entirely.
// Browser checks are silent: if maintenance mode is on the user gets redirected at any point.
// Guest/user body visibility is controlled by the auth redirect block below, not here.
document.addEventListener('DOMContentLoaded', function () {
    var path = window.location.pathname;
    if (path.indexOf('/common/maintenance/') !== -1 || path.indexOf('login.html') !== -1 ||path.indexOf('common/announcement') !== -1 ||path.indexOf('common/auth') !== -1) return;

    getMe()
        .then(function (session) {
            if (session && !session.error && session.userIsadmin) return;
            return apiGet('/maintenance').then(function (res) {
                if (res && res.enabled)
                    window.location.href = '/frontend/pages/common/maintenance/index.html';
            });
        })
        .catch(function () {
            apiGet('/maintenance')
                .then(function (res) {
                    if (res && res.enabled)
                        window.location.href = '/frontend/pages/common/maintenance/index.html';
                })
                .catch(function () {});
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
