document.write('<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"><\/script>');
document.write('<script src="/frontend/utils/constants.js"><\/script>');
document.write('<script src="/frontend/services/api.js"><\/script>');
document.write('<script src="/frontend/services/authService.js"><\/script>');

if (document.body.dataset.auth === 'user') {
    document.body.style.display = 'none';
    document.addEventListener('DOMContentLoaded', function () {
        checkAuth().then(function () {
            document.body.style.display = '';
        });
    });
}
