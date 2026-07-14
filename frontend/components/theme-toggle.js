(function() {
    function setTheme(light) {
        var el = document.documentElement;
        if (light) {
            el.classList.add("light-mode");
        } else {
            el.classList.remove("light-mode");
        }
        localStorage.setItem("theme", light ? "light" : "dark");
        var icon = document.querySelector(".theme-toggle");
        if (icon) icon.textContent = light ? "\u263E" : "\u2600";
    }

    window.toggleTheme = function() {
        setTheme(!document.documentElement.classList.contains("light-mode"));
    };

    document.addEventListener("DOMContentLoaded", function() {
        var icon = document.querySelector(".theme-toggle");
        if (icon) {
            icon.textContent = document.documentElement.classList.contains("light-mode") ? "\u263E" : "\u2600";
        }
    });
})();
