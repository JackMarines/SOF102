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

    var nav = document.createElement('nav');
    nav.className = 'navbar-devclimb';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML =
      '<div class="nav-inner">' +
        '<a class="nav-logo-link" href="/frontend/index.html" aria-label="DevClimb home">' +
          '<span class="nav-logo-dev">DEV</span>' +
          '<span class="nav-logo-climb">CLIMB</span>' +
          '<span class="nav-logo-cursor"></span>' +
        '</a>' +
        '<div class="nav-links" id="nav-links" role="list">' +
          '<a href="/frontend/pages/guest/team-search/index.html" role="listitem"' + (isActive('team') ? ' class="active"' : '') + '>TEAM</a>' +
          '<a href="/frontend/pages/guest/puzzle/index.html" role="listitem"' + (isActive('puzzles') ? ' class="active"' : '') + '>PUZZLES</a>' +
          '<a href="/frontend/pages/guest/announcement/index.html" role="listitem"' + (isActive('announcements') ? ' class="active"' : '') + '>ANNOUNCEMENTS</a>' +
          '<a class="nav-link-login" href="/frontend/pages/guest/auth/login.html" role="listitem"' + (isActive('login') ? ' class="active nav-link-login"' : '') + '>LOG IN</a>' +
        '</div>' +
        '<div class="nav-actions">' +
          '<button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation menu">\u2630</button>' +
        '</div>' +
      '</div>';

    placeholder.replaceWith(nav);

    var toggleBtn = document.getElementById('nav-toggle');
    var navLinks = document.getElementById('nav-links');
    toggleBtn.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    });
  });

  window.addEventListener('deps-ready', function () {
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
          document.body.insertBefore(banner, document.body.firstElementChild);
        }
      })
      .catch(function () {});
  });
})();
