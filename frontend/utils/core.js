document.write('<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"><\/script>');
document.write('<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"><\/script>');
document.write('<script src="/frontend/utils/constants.js"><\/script>');
document.write('<script src="/frontend/services/api.js"><\/script>');
document.write('<script src="/frontend/services/authService.js"><\/script>');

if (window.location.pathname.includes('/pages/user/')) {
    document.body.style.display = 'none';
    checkAuth().then(function () {
        document.body.style.display = '';
    });
}
