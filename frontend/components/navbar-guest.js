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
'<a class="navbar-brand" href="/">' +
                    '<img src="/frontend/assets/images/logo.png" alt="Logo" class="logo">' +
                '</a>' +
                '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">' +
                    '<span class="navbar-toggler-icon"></span>' +
                '</button>' +
                '<div class="collapse navbar-collapse" id="menu">' +
                    '<ul class="navbar-nav ms-auto align-items-lg-center text-center">' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (path.includes('/guest/home/') ? ' current-link' : '') + '" href="/help">Help</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (path.includes('/puzzle') ? ' current-link' : '') + '" href="/puzzle">Puzzles</a>' +
                        '</li>' +
                        '<li class="nav-item">' +
                            '<a class="nav-link' + (path.includes('/guest/auth/') ? ' current-link' : '') + '" href="/login">Log in</a>' +
                        '</li>' +
                    '</ul>' +
                '</div>' +
            '</div>';

        placeholder.replaceWith(nav);
    });
})();
