(function(){
    var icons = document.createElement('link');
    icons.rel = 'stylesheet';
    icons.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    document.head.appendChild(icons);

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/frontend/assets/css/navbar-user.css';
    document.head.appendChild(link);

    document.addEventListener('DOMContentLoaded', function(){
        var placeholder = document.getElementById('navbar');
        if (!placeholder) return;

        var path = window.location.pathname;

        function isActive(p) {
            if (p === 'home') return !path.includes('/puzzle') && !path.includes('/guest/') && !path.includes('/user/solve') && !path.includes('/user/help/');
            if (p === 'help') return path.includes('/user/help/');
            if (p === 'puzzles') return path.includes('/puzzle');
            return false;
        }

        var nav = document.createElement('nav');
        nav.className = 'navbar navbar-expand-lg navbar-dark fixed-top custom-navbar';

        nav.innerHTML =
            '<div class="container">' +
                '<a class="navbar-brand" href="/frontend/pages/user/home/index.html">' +
                    '<img src="/frontend/assets/css/logo.png" class="logo" alt="Logo">' +
                '</a>' +
                '<div class="d-flex align-items-center d-lg-none ms-auto">' +
                    '<a href="/frontend/pages/profile/index.html" class="profile-btn me-2">' +
                        '<i class="bi bi-person-circle"></i>' +
                    '</a>' +
                    '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">' +
                        '<span class="navbar-toggler-icon"></span>' +
                    '</button>' +
                '</div>' +
                '<div class="collapse navbar-collapse" id="menu">' +
                    '<ul class="navbar-nav ms-auto">' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (isActive('help') ? ' active' : '') + '" href="/frontend/pages/user/help/index.html">Help</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (isActive('puzzles') ? ' active' : '') + '" href="/frontend/pages/user/puzzle/index.html">Puzzles</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (isActive('home') ? ' active' : '') + '" href="/frontend/pages/user/home/index.html">Home</a>' +
                        '</li>' +
                        '<li class="nav-item ms-lg-3 d-none d-lg-block profile-dropdown">' +
                            '<a class="profile-btn" href="/frontend/pages/profile/index.html">' +
                                '<i class="bi bi-person-circle"></i>' +
                            '</a>' +
                            '<div class="dropdown-menu-custom">' +
                                '<a href="/frontend/pages/profile/index.html">Profile</a>' +
                                '<hr>' +
                                '<a href="#" id="logout-btn">Log out</a>' +
                            '</div>' +
                        '</li>' +
                    '</ul>' +
                '</div>' +
            '</div>';

        placeholder.replaceWith(nav);

        var logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
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
