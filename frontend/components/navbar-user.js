(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var placeholder = document.getElementById('navbar');
    if (!placeholder) return;

    var path = window.location.pathname;

    function isActive(p) {
      if (p === 'team') return path.includes('/user/team/');
      if (p === 'puzzles') return path.includes('/puzzle');
      if (p === 'users') return path.includes('/user-search');
      if (p === 'announcements') return path.includes('/user/announcement');
      if (p === 'contest') return path.includes('/user/contest/');
      return false;
    }

    var nav = document.createElement('nav');
    nav.className = 'navbar-devclimb';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML =
      '<div class="nav-inner">' +
        '<a class="nav-logo-link" href="/frontend/pages/user/home/index.html" aria-label="DevClimb home">' +
          '<img class="nav-logo-img" src="/frontend/assets/images/devclimblogo.png" alt="DevClimb">' +
        '</a>' +
        '<button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation menu">\u2630</button>' +
        '<div class="nav-links" id="nav-links" role="list">' +
          '<a href="/frontend/pages/user/team-search/index.html" id="nav-team-link" role="listitem"' + (isActive('team') ? ' class="active"' : '') + '>TEAM</a>' +
          '<a href="/frontend/pages/user/puzzle/index.html" role="listitem"' + (isActive('puzzles') ? ' class="active"' : '') + '>PUZZLES</a>' +
          '<a href="/frontend/pages/user/user-search/index.html" role="listitem"' + (isActive('users') ? ' class="active"' : '') + '>USERS</a>' +
          '<a href="/frontend/pages/user/announcement/index.html" role="listitem"' + (isActive('announcements') ? ' class="active"' : '') + '>ANNOUNCEMENTS</a>' +
          '<a href="/frontend/pages/user/contest/index.html" role="listitem"' + (isActive('contest') ? ' class="active"' : '') + '>CONTEST</a>' +
          '<div class="nav-profile-dropdown">' +
            '<a class="nav-avatar-link" href="/frontend/pages/user/profile/index.html" aria-label="Your profile">' +
              '<span class="nav-avatar" id="nav-avatar-desktop"></span>' +
            '</a>' +
            '<div class="nav-profile-menu" role="menu">' +
              '<a href="/frontend/pages/user/profile/index.html" role="menuitem">PROFILE</a>' +
              '<hr>' +
              '<a href="/frontend/pages/user/setting/index.html" role="menuitem">SETTINGS</a>' +
              '<hr>' +
              '<a href="#" id="logout-btn" role="menuitem">LOG OUT</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="nav-actions">' +
          '<a id="admin-badge" class="admin-badge" href="/frontend/pages/admin/dashboard/index.html" aria-label="Admin dashboard">ADMIN</a>' +
        '</div>' +
      '</div>';

    placeholder.replaceWith(nav);

    var toggleBtn = document.getElementById('nav-toggle');
    var navLinks = document.getElementById('nav-links');
    toggleBtn.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    });

    function renderNavAvatar(avatarUrl) {
      var opts = { size: 36 };
      if (avatarUrl) opts.avatar = avatarUrl;
      var desktop = document.getElementById('nav-avatar-desktop');
      if (desktop) { desktop.innerHTML = ''; desktop.appendChild(Avatar.render(opts)); }
    }

    var cachedAvatar = null;
    try { cachedAvatar = localStorage.getItem('user_avatar'); } catch (e) {}

    if (typeof Avatar !== 'undefined' && Avatar.render) {
      renderNavAvatar(cachedAvatar);
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
  });

  window.addEventListener('deps-ready', function () {
    getMe().then(function (session) {
      if (session && session.teamId) {
        var teamLink = document.getElementById('nav-team-link');
        if (teamLink) teamLink.href = '/frontend/pages/user/team/index.html?id=' + session.teamId;
      }
      if (session && session.userIsadmin) {
        var badge = document.getElementById('admin-badge');
        if (badge) badge.classList.add('admin-badge-visible');
      }
    });
    apiGet('/profile').then(function (p) {
      if (!p || p.error) return;
      var opts = { size: 36 };
      if (p.avatar) opts.avatar = p.avatar;
      var desktop = document.getElementById('nav-avatar-desktop');
      if (desktop) { desktop.innerHTML = ''; desktop.appendChild(Avatar.render(opts)); }
      try { localStorage.setItem('user_avatar', p.avatar || ''); } catch (e) {}
    });
    apiGet('/announcements/latest')
      .then(function (res) {
        var data = res && res.data;
        if (!data) return;

        var banner = document.createElement('a');
        banner.className = 'announcement-banner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-label', 'Latest announcement: ' + data.title);
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
