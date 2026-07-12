(function(){
    document.addEventListener('DOMContentLoaded', function(){
        var placeholder = document.getElementById('footer');
        if (!placeholder) return;

        var footer = document.createElement('footer');
        footer.className = 'footer';
        footer.innerHTML = '<div class="container text-center">\u00A9 2026 Devclimb \u2014 Coding Practice Platform \u2014 v0.2.0</div>';

        placeholder.replaceWith(footer);
    });
})();
