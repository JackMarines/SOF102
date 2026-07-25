(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var placeholder = document.getElementById('footer');
    if (!placeholder) return;

    var footer = document.createElement('footer');
    footer.className = 'footer-devclimb';
    footer.innerHTML =
      '<div class="footer-inner">' +
        '<div class="footer-status">' +
          '<span>STABLE_BUILD: A4F9</span>' +
          '<span>UPTIME: 99.98%</span>' +
          '<span>CONNECTION: ENCRYPTED</span>' +
        '</div>' +
        '<p class="footer-copy">&copy; 2026 Devclimb — Coding Practice Platform — <span class="footer-version">v0.3.0</span></p>' +
      '</div>';

    placeholder.replaceWith(footer);
  });
})();
