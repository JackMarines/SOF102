(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var placeholder = document.getElementById('navbar');
    if (!placeholder) return;

    var path = window.location.pathname;

    function isActive(p) {
      if (p === 'home') return !path.includes('/puzzle') && !path.includes('/guest/') && !path.includes('/user/solve') && !path.includes('/user/team/') && !path.includes('/user/announcement');
      if (p === 'team') return path.includes('/user/team/');
      if (p === 'puzzles') return path.includes('/puzzle');
      if (p === 'announcements') return path.includes('/user/announcement');
      return false;
    }

    var isLight = document.documentElement.classList.contains('light-mode');
    var themeIcon = isLight ? '\u263E' : '\u2600';

    var nav = document.createElement('nav');
    nav.className = 'navbar-devclimb';
    nav.innerHTML =
      '<div class="nav-inner">' +
        '<a class="nav-logo-link" href="/frontend/pages/user/home/index.html">' +
          '<span class="nav-logo-dev">DEV</span>' +
          '<span class="nav-logo-climb">CLIMB</span>' +
          '<span class="nav-logo-cursor"></span>' +
          '<a id="admin-badge" class="admin-badge d-none" href="/frontend/pages/admin/dashboard/index.html">ADMIN</a>' +
        '</a>' +
        '<div class="d-flex align-items-center d-lg-none ms-auto">' +
          '<a href="/frontend/pages/user/profile/index.html" class="nav-avatar-link">' +
            '<span class="nav-avatar" id="nav-avatar-mobile"></span>' +
          '</a>' +
          '<button class="nav-toggle" id="nav-toggle" aria-label="Menu">\u2630</button>' +
        '</div>' +
        '<div class="nav-links" id="nav-links">' +
          '<a href="/frontend/pages/user/team-search/index.html" id="nav-team-link"' + (isActive('team') ? ' class="active"' : '') + '>TEAM</a>' +
          '<a href="/frontend/pages/user/puzzle/index.html"' + (isActive('puzzles') ? ' class="active"' : '') + '>PUZZLES</a>' +
          '<a href="/frontend/pages/user/announcement/index.html"' + (isActive('announcements') ? ' class="active"' : '') + '>ANNOUNCEMENTS</a>' +
          '<a href="/frontend/pages/user/home/index.html"' + (isActive('home') ? ' class="active"' : '') + '>HOME</a>' +
          '<div class="nav-profile-dropdown">' +
            '<a class="nav-avatar-link" href="/frontend/pages/user/profile/index.html">' +
              '<span class="nav-avatar" id="nav-avatar-desktop"></span>' +
            '</a>' +
            '<div class="nav-profile-menu">' +
              '<a href="/frontend/pages/user/profile/index.html">PROFILE</a>' +
              '<hr>' +
              '<a href="/frontend/pages/user/setting/index.html">SETTINGS</a>' +
              '<hr>' +
              '<a href="#" id="logout-btn">LOG OUT</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="nav-actions">' +
          '<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">' + themeIcon + '</button>' +
        '</div>' +
      '</div>';

    placeholder.replaceWith(nav);

    document.getElementById('nav-toggle').addEventListener('click', function () {
      document.getElementById('nav-links').classList.toggle('open');
    });

    function renderNavAvatar(avatarUrl) {
      var opts = { size: 36 };
      if (avatarUrl) opts.avatar = avatarUrl;
      var mobile = document.getElementById('nav-avatar-mobile');
      var desktop = document.getElementById('nav-avatar-desktop');
      if (mobile) { mobile.innerHTML = ''; mobile.appendChild(Avatar.render(opts)); }
      if (desktop) { desktop.innerHTML = ''; desktop.appendChild(Avatar.render(opts)); }
    }

    var cachedAvatar = null;
    try { cachedAvatar = localStorage.getItem('user_avatar'); } catch (e) {}

    if (typeof Avatar !== 'undefined' && Avatar.render) {
      renderNavAvatar(cachedAvatar);
    }

    if (typeof apiGet === 'function') {
      getMe().then(function (session) {
        if (session && session.teamId) {
          var teamLink = document.getElementById('nav-team-link');
          if (teamLink) teamLink.href = '/frontend/pages/user/team/index.html?id=' + session.teamId;
        }
        if (session && session.userIsadmin) {
          var badge = document.getElementById('admin-badge');
          if (badge) badge.classList.remove('d-none');
        }
      });
      apiGet('/profile').then(function (p) {
        if (!p || p.error) return;
        renderNavAvatar(p.avatar);
        try { localStorage.setItem('user_avatar', p.avatar || ''); } catch (e) {}
      });
    }

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        try { localStorage.removeItem('user_avatar'); } catch (e2) {}
        if (typeof logout === 'function') {
          logout().then(function () {
            window.location.href = '/frontend/index.html';
          }).catch(function () {
            window.location.href = '/frontend/index.html';
          });
        } else {
          window.location.href = '/frontend/index.html';
        }
      });
    }

    apiGet('/announcements/latest')
      .then(function (res) {
        var data = res && res.data;
        if (!data) return;

        var banner = document.createElement('a');
        banner.className = 'announcement-banner';
        banner.href = '/frontend/pages/user/announcement/index.html?open=' + data.id;

        var date = new Date(data.createdAt);
        var dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

        var typeLabel = (data.type || 'GENERAL').replace(/_/g, ' ');

        banner.innerHTML =
          '<span class="ann-date">' + dateStr + '</span>' +
          '<span class="ann-title">' + data.title + '</span>' +
          '<span class="ann-badge">' + typeLabel + '</span>';

        var mainEl = document.querySelector('main');
        if (mainEl) {
          mainEl.insertBefore(banner, mainEl.firstChild);
        } else {
          document.body.insertBefore(banner, document.body.firstChild);
        }
      })
      .catch(function () {});
  });
})();
