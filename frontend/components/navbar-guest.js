(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var placeholder = document.getElementById('navbar');
    if (!placeholder) return;

    var path = window.location.pathname;

    function isActive(p) {
      if (p === 'home') return path === '/frontend/index.html';
      if (p === 'team') return path.includes('/guest/team');
      if (p === 'puzzles') return path.includes('/puzzle');
      if (p === 'announcements') return path.includes('/announcement');
      if (p === 'login') return path.includes('/guest/auth/');
      return false;
    }

    var isLight = document.documentElement.classList.contains('light-mode');
    var themeIcon = isLight ? '\u263E' : '\u2600';

    var nav = document.createElement('nav');
    nav.className = 'navbar-devclimb';
    nav.innerHTML =
      '<div class="nav-inner">' +
        '<a class="nav-logo-link" href="/frontend/index.html">' +
          '<span class="nav-logo-dev">DEV</span>' +
          '<span class="nav-logo-climb">CLIMB</span>' +
          '<span class="nav-logo-cursor"></span>' +
        '</a>' +
        '<div class="nav-links" id="nav-links">' +
          '<a href="/frontend/pages/guest/team-search/index.html"' + (isActive('team') ? ' class="active"' : '') + '>TEAM</a>' +
          '<a href="/frontend/pages/guest/puzzle/index.html"' + (isActive('puzzles') ? ' class="active"' : '') + '>PUZZLES</a>' +
          '<a href="/frontend/pages/guest/announcement/index.html"' + (isActive('announcements') ? ' class="active"' : '') + '>ANNOUNCEMENTS</a>' +
          '<a class="nav-link-login" href="/frontend/pages/guest/auth/login.html"' + (isActive('login') ? ' class="active nav-link-login"' : '') + '>LOG IN</a>' +
        '</div>' +
        '<div class="nav-actions">' +
          '<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">' + themeIcon + '</button>' +
          '<button class="nav-toggle" id="nav-toggle" aria-label="Menu">\u2630</button>' +
        '</div>' +
      '</div>';

    placeholder.replaceWith(nav);

    document.getElementById('nav-toggle').addEventListener('click', function () {
      document.getElementById('nav-links').classList.toggle('open');
    });

    apiGet('/announcements/latest')
      .then(function (res) {
        var data = res && res.data;
        if (!data) return;

        var banner = document.createElement('a');
        banner.className = 'announcement-banner';
        banner.href = '/frontend/pages/guest/announcement/index.html?open=' + data.id;

        var date = new Date(data.createdAt);
        var dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

        var typeLabel = (data.type || 'GENERAL').replace(/_/g, ' ');

        banner.innerHTML =
          '<span class="ann-date">' + dateStr + '</span>' +
          '<span class="ann-title">' + data.title + '</span>' +
          '<span class="ann-badge">' + typeLabel + '</span>';

        var mainEl = document.querySelector('main') || document.body.firstElementChild;
        if (mainEl && mainEl.tagName === 'MAIN') {
          mainEl.insertBefore(banner, mainEl.firstChild);
        } else {
          document.body.insertBefore(banner, document.body.firstChild);
        }
      })
      .catch(function () {});
  });
})();
