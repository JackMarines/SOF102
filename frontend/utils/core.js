// Core loader — inject Firebase SDK, constants, API layer, và auth service vào trang
// Dùng dynamic script injection thay vì document.write (Chrome sắp chặn document.write trên network chậm)
(function() {
  var scriptSrcs = [
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
    '/frontend/utils/constants.js',
    '/frontend/components/popup.js',
    '/frontend/services/api.js',
    '/frontend/services/authService.js'
  ];
  function loadNext() {
    if (scriptSrcs.length === 0) {
      window.dispatchEvent(new Event('deps-ready'));
      return;
    }
    var src = scriptSrcs.shift();
    var s = document.createElement('script');
    s.src = src;
    s.onload = s.onerror = loadNext;
    document.head.appendChild(s);
  }
  loadNext();
})();

// ── Auth-dependent checks (run after deps are loaded) ──
window.addEventListener('deps-ready', function () {
    var path = window.location.pathname;
    if (path.indexOf('/common/maintenance/') !== -1 || path.indexOf('login.html') !== -1 || path.indexOf('common/announcement') !== -1 || path.indexOf('common/auth') !== -1) return;

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
    window.addEventListener('deps-ready', function () {
        checkAuth().then(function () {
            document.body.style.display = '';
        });
    });
}

// ── Scroll Reveal ──
document.addEventListener('DOMContentLoaded', function () {
    var els = document.querySelectorAll('.scroll-reveal');
    if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        els.forEach(function (el) { el.classList.add('revealed'); });
        return;
    }
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            var delay = parseInt(el.dataset.delay, 10) || 0;
            setTimeout(function () { el.classList.add('revealed'); }, delay);
            obs.unobserve(el);
        });
    }, { threshold: 0.1 });
    els.forEach(function (el) { obs.observe(el); });
});
