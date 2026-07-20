// Navbar component cho trang người dùng
// Tự động inject CSS, avatar, theme-toggle, warningService vào <head>
// Render navbar với logo, menu điều hướng, avatar, dropdown profile, badge admin, và banner thông báo
(function(){
    // ── Inject dependencies vào <head> ──
    var icons = document.createElement('link');
    icons.rel = 'stylesheet';
    icons.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    document.head.appendChild(icons);

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/frontend/assets/css/navbar-user.css';
    document.head.appendChild(link);

    var theme = document.createElement('script');
    theme.src = '/frontend/components/theme-toggle.js';
    document.head.appendChild(theme);

    var avatar = document.createElement('script');
    avatar.src = '/frontend/components/avatar.js';
    document.head.appendChild(avatar);

    document.addEventListener('DOMContentLoaded', function(){
        // Tìm placeholder `#navbar` trong HTML để thay thế bằng navbar thật
        var placeholder = document.getElementById('navbar');
        if (!placeholder) return;

        var path = window.location.pathname;

        // Helper: kiểm tra trang nào đang active dựa trên URL
        function isActive(p) {
            if (p === 'home') return !path.includes('/puzzle') && !path.includes('/guest/') && !path.includes('/user/solve') && !path.includes('/user/team/') && !path.includes('/user/announcement');
            if (p === 'team') return path.includes('/user/team/');
            if (p === 'puzzles') return path.includes('/puzzle');
            if (p === 'announcements') return path.includes('/user/announcement');
            return false;
        }

        // ── Xây dựng navbar HTML ──
        var nav = document.createElement('nav');
        nav.className = 'navbar navbar-expand-lg navbar-dark fixed-top custom-navbar';

        nav.innerHTML =
            '<div class="container">' +
                // Logo + badge admin (ẩn mặc định, hiện nếu là admin)
                '<a class="navbar-brand d-flex align-items-center" href="/frontend/pages/user/home/index.html">' +
                    '<img src="/frontend/assets/images/logo.png" class="logo" alt="Logo">' +
                    '<a id="admin-badge" class="admin-badge d-none" href="/frontend/pages/admin/dashboard/index.html" onclick="event.stopPropagation();">Admin</a>' +
                '</a>' +
                // Avatar mobile + nút toggler (chỉ hiện trên mobile)
                '<div class="d-flex align-items-center d-lg-none ms-auto">' +
                    '<a href="/frontend/pages/user/profile/index.html" class="profile-btn me-2">' +
                        '<span class="nav-avatar" id="nav-avatar-mobile"></span>' +
                    '</a>' +
                    '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">' +
                        '<span class="navbar-toggler-icon"></span>' +
                    '</button>' +
                '</div>' +
                // Menu chính (collapsible trên mobile)
                '<div class="collapse navbar-collapse" id="menu">' +
                    '<ul class="navbar-nav ms-auto">' +
                        '<li class="nav-item">' +
                            // Link Team: mặc định trỏ team-search, sẽ cập nhật sau khi checkAuth
                            '<a class="nav-link' + (isActive('team') ? ' active' : '') + '" id="nav-team-link" href="/frontend/pages/user/team-search/index.html">Team</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (isActive('puzzles') ? ' active' : '') + '" href="/frontend/pages/user/puzzle/index.html">Puzzles</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (isActive('announcements') ? ' active' : '') + '" href="/frontend/pages/user/announcement/index.html">Announcements</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (isActive('home') ? ' active' : '') + '" href="/frontend/pages/user/home/index.html">Home</a>' +
                        '</li>' +
                        // Dropdown profile (chỉ hiện trên desktop)
                        '<li class="nav-item ms-lg-3 d-none d-lg-block profile-dropdown">' +
                            '<a class="profile-btn" href="/frontend/pages/user/profile/index.html">' +
                                '<span class="nav-avatar" id="nav-avatar-desktop"></span>' +
                            '</a>' +
                            '<div class="dropdown-menu-custom">' +
                                '<a href="/frontend/pages/user/profile/index.html">Profile</a>' +
                                '<hr>' +
                                '<a href="/frontend/pages/user/setting/index.html">Settings</a>' +
                                '<hr>' +
                                '<a href="#" id="logout-btn">Log out</a>' +
                            '</div>' +
                        '</li>' +
                    '</ul>' +
                '</div>' +
            '</div>';

        // Thay thế placeholder bằng navbar thật
        placeholder.replaceWith(nav);

        // ── Render avatar trong navbar ──
        function renderNavAvatar(avatarUrl) {
            var opts = { size: 36 };
            if (avatarUrl) opts.avatar = avatarUrl;
            var mobile = document.getElementById('nav-avatar-mobile');
            var desktop = document.getElementById('nav-avatar-desktop');
            if (mobile) { mobile.innerHTML = ''; mobile.appendChild(Avatar.render(opts)); }
            if (desktop) { desktop.innerHTML = ''; desktop.appendChild(Avatar.render(opts)); }
        }

        // Render avatar từ cache trước (nhanh hơn, tránh flash)
        var cachedAvatar = null;
        try { cachedAvatar = localStorage.getItem('user_avatar'); } catch (e) {}

        if (typeof Avatar !== 'undefined' && Avatar.render) {
            renderNavAvatar(cachedAvatar);
        }

        // ── Fetch session từ backend ──
        if (typeof apiGet === 'function') {
            getMe().then(function (session) {
                // Nếu user có team → cập nhật link Team trỏ đúng trang team
                if (session && session.teamId) {
                    document.getElementById('nav-team-link').href =
                        '/frontend/pages/user/team/index.html?id=' + session.teamId;
                }
                // Nếu user là admin → hiện badge Admin
                if (session && session.userIsadmin) {
                    var badge = document.getElementById('admin-badge');
                    if (badge) badge.classList.remove('d-none');
                }
            });
            // Fetch profile mới nhất để cập nhật avatar
            apiGet('/profile').then(function (p) {
                if (!p || p.error) return;
                renderNavAvatar(p.avatar);
                try { localStorage.setItem('user_avatar', p.avatar || ''); } catch (e) {}
            });
        }

        // ── Xử lý đăng xuất ──
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

        // ── Fetch và render banner thông báo mới nhất ──
        apiGet('/announcements/latest')
            .then(function(res) {
                var data = res && res.data;
                if (!data) return;

                var banner = document.createElement('a');
                banner.className = 'announcement-banner';
                banner.href = '/frontend/pages/user/announcement/index.html?open=' + data.id;

                var date = new Date(data.createdAt);
                var dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

                var typeKey = (data.type || 'GENERAL').toLowerCase().replace(/_/g, '-');
                var typeLabel = (data.type || 'GENERAL').replace(/_/g, ' ');

                banner.innerHTML =
                    '<span class="ann-date">' + dateStr + '</span>' +
                    '<span class="ann-separator">--</span>' +
                    '<span class="ann-title">' + data.title + '</span>' +
                    '<span class="ann-separator">--</span>' +
                    '<span class="badges"><span class="ann-' + typeKey + '">' + typeLabel + '</span></span>';

                // Chèn banner vào đầu body
                document.body.insertBefore(banner, document.body.firstChild);
                document.body.classList.add('ann-banner-active');
            })
            .catch(function() {});
    });
})();
