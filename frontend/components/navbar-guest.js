(function(){
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/frontend/assets/css/navbar-guest.css';
    document.head.appendChild(link);

    document.addEventListener('DOMContentLoaded', function(){
        var placeholder = document.getElementById('navbar');
        if (!placeholder) return;

        var path = window.location.pathname;

        var nav = document.createElement('nav');
        nav.className = 'navbar navbar-expand-lg navbar-dark fixed-top';

        nav.innerHTML =
            '<div class="container">' +
                '<a class="navbar-brand" href="/frontend/index.html">' +
                    '<img src="/frontend/assets/images/logo.png" alt="Logo" class="logo">' +
                '</a>' +
                '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">' +
                    '<span class="navbar-toggler-icon"></span>' +
                '</button>' +
                '<div class="collapse navbar-collapse" id="menu">' +
                    '<ul class="navbar-nav ms-auto align-items-lg-center text-center">' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (path.includes('/guest/team') ? ' current-link' : '') + '" href="/frontend/pages/guest/team-search/index.html">Team</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (path.includes('/puzzle') ? ' current-link' : '') + '" href="/frontend/pages/guest/puzzle/index.html">Puzzles</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (path.includes('/announcement') ? ' current-link' : '') + '" href="/frontend/pages/guest/announcement/index.html">Announcements</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (path.includes('/guest/auth/') ? ' current-link' : '') + '" href="/frontend/pages/guest/auth/login.html">Log in</a>' +
                        '</li>' +
                    '</ul>' +
                '</div>' +
            '</div>';

        placeholder.replaceWith(nav);

        // ── Fetch và render banner thông báo mới nhất ──
        apiGet('/announcements/latest')
            .then(function(res) {
                var data = res && res.data;
                if (!data) return;

                var banner = document.createElement('a');
                banner.className = 'announcement-banner';
                banner.href = '/frontend/pages/guest/announcement/index.html?open=' + data.id;

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
