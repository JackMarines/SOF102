(function () {
  function closeAll() {
    document.querySelectorAll('.dropdown-menu.show').forEach(function (m) {
      m.classList.remove('show');
    });
  }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-bs-toggle="dropdown"]');
    if (toggle) {
      e.preventDefault();
      var dropdown = toggle.closest('.dropdown');
      if (!dropdown) return;
      var menu = dropdown.querySelector('.dropdown-menu');
      if (!menu) return;
      var isOpen = menu.classList.contains('show');
      closeAll();
      if (!isOpen) {
        menu.classList.add('show');
        menu.closest('.dropdown').classList.add('show');
      }
      return;
    }

    if (!e.target.closest('.dropdown')) {
      closeAll();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAll();
    }
  });
})();
