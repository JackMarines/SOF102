(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var placeholder = document.getElementById('footer');
    if (!placeholder) return;

    var footer = document.createElement('footer');
    footer.className = 'footer-devclimb';
    footer.innerHTML =
      '<div class="footer-inner">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<a href="/frontend/pages/user/home/index.html" aria-label="DevClimb home">' +
              '<span class="footer-logo-text"><span class="logo-symbol">\u25B7</span>ev:clmb<span class="logo-cursor">_</span></span>' +
            '</a>' +
            '<p class="footer-copyright">&copy; 2026 LBKT Studio</p>' +
          '</div>' +
          '<div class="footer-col">' +
            '<span class="footer-heading">RESOURCES</span>' +
            '<a href="https://github.com/JackMarines/SOF1022" target="_blank" rel="noopener">GitHub Repository</a>' +
            '<a href="https://github.com/JackMarines/SOF1022/blob/alt-dev/LICENSE" target="_blank" rel="noopener">License</a>' +
          '</div>' +
          '<div class="footer-col">' +
            '<span class="footer-heading">CREDITS</span>' +
            '<span>Built by LBKT Studio</span>' +
            '<span>FPT Polyschool - Software Development (Java)</span>' +
            '<span>Graduation Project 2026</span>' +
          '</div>' +
          '<div class="footer-col">' +
            '<span class="footer-heading">INFRASTRUCTURE</span>' +
            '<span>Powered by Judge0</span>' +
            '<span>Firebase Authentication</span>' +
            '<span>Hosted on Cloudflare</span>' +
          '</div>' +
        '</div>' +
        '<div class="footer-nav">' +
          '<a href="/frontend/pages/user/team-search/index.html">TEAM</a>' +
          '<span class="footer-nav-dot">&middot;</span>' +
          '<a href="/frontend/pages/user/puzzle/index.html">PUZZLES</a>' +
          '<span class="footer-nav-dot">&middot;</span>' +
          '<a href="/frontend/pages/user/user-search/index.html">USERS</a>' +
          '<span class="footer-nav-dot">&middot;</span>' +
          '<a href="/frontend/pages/user/announcement/index.html">ANNOUNCEMENTS</a>' +
          '<span class="footer-nav-dot">&middot;</span>' +
          '<a href="/frontend/pages/user/contest/index.html">CONTEST</a>' +
        '</div>' +
                          '<div class="footer-version">' +
                     '<p class="footer-copyright">version 1.0.0</p>' +
          '</div>' +
      '</div>';

    placeholder.replaceWith(footer);
  });
})();
