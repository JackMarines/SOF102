(function(){
    var icons = document.createElement('link');
    icons.rel = 'stylesheet';
    icons.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    document.head.appendChild(icons);

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/frontend/assets/css/navbar-user.css';
    document.head.appendChild(link);

    var avatar = document.createElement('script');
    avatar.src = '/frontend/components/avatar.js';
    document.head.appendChild(avatar);

    document.addEventListener('DOMContentLoaded', function(){
        var placeholder = document.getElementById('navbar');
        if (!placeholder) return;

        var path = window.location.pathname;

        function isActive(p) {
            if (p === 'home') return !path.includes('/puzzle') && !path.includes('/guest/') && !path.includes('/user/solve') && !path.includes('/user/team/');
            if (p === 'team') return path.includes('/user/team/');
            if (p === 'puzzles') return path.includes('/puzzle');
            return false;
        }

        var nav = document.createElement('nav');
        nav.className = 'navbar navbar-expand-lg navbar-dark fixed-top custom-navbar';

        nav.innerHTML =
            '<div class="container">' +
                '<a class="navbar-brand" href="/frontend/pages/user/home/index.html">' +
                    '<img src="/frontend/assets/images/logo.png" class="logo" alt="Logo">' +
                '</a>' +
                '<div class="d-flex align-items-center d-lg-none ms-auto">' +
                    '<a href="/frontend/pages/user/profile/index.html" class="profile-btn me-2">' +
                        '<span class="nav-avatar" id="nav-avatar-mobile"></span>' +
                    '</a>' +
                    '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">' +
                        '<span class="navbar-toggler-icon"></span>' +
                    '</button>' +
                '</div>' +
                '<div class="collapse navbar-collapse" id="menu">' +
                    '<ul class="navbar-nav ms-auto">' +
                        '<li class="nav-item">' +
                            // Team link: defaults to team-search, updated to team page after checkAuth
                            '<a class="nav-link' + (isActive('team') ? ' active' : '') + '" id="nav-team-link" href="/frontend/pages/user/team-search/index.html">Team</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (isActive('puzzles') ? ' active' : '') + '" href="/frontend/pages/user/puzzle/index.html">Puzzles</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (isActive('home') ? ' active' : '') + '" href="/frontend/pages/user/home/index.html">Home</a>' +
                        '</li>' +

                        '<li class="nav-item ms-lg-3 d-none d-lg-block profile-dropdown">' +
                            '<a class="profile-btn" href="/frontend/pages/user/profile/index.html">' +
                                '<span class="nav-avatar" id="nav-avatar-desktop"></span>' +
                            '</a>' +
                            '<div class="dropdown-menu-custom">' +
                                '<a href="/frontend/pages/user/profile/index.html">Profile</a>' +
                                '<hr>' +
                                '<a href="/frontend/pages/user/settings/index.html">Settings</a>' +
                                '<hr>' +
                                '<a href="#" id="logout-btn">Log out</a>' +
                            '</div>' +
                        '</li>' +
                    '</ul>' +
                '</div>' +
            '</div>';

        placeholder.replaceWith(nav);

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

        if (typeof checkAuth === 'function' && typeof apiGet === 'function') {
            checkAuth().then(function (session) {
                if (session.teamId) {
                    document.getElementById('nav-team-link').href =
                        '/frontend/pages/user/team/index.html?id=' + session.teamId;
                }
                apiGet('/profile').then(function (p) {
                    if (!p || p.error) return;
                    renderNavAvatar(p.avatar);
                    try { localStorage.setItem('user_avatar', p.avatar || ''); } catch (e) {}
                });
            });
        }

        var logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                try { localStorage.removeItem('user_avatar'); } catch (e2) {}
                if (typeof logout === 'function') {
                    logout().then(function() {
                        window.location.href = '/frontend/index.html';
                    }).catch(function() {
                        window.location.href = '/frontend/index.html';
                    });
                } else {
                    window.location.href = '/frontend/index.html';
                }
            });
        }
    });
})();
