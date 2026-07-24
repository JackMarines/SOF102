(function () {
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-bs-toggle="modal"]');
    if (trigger) {
      e.preventDefault();
      var targetId = trigger.getAttribute('data-bs-target');
      if (!targetId) return;
      var modal = document.querySelector(targetId);
      if (modal) modal.classList.add('show');
      return;
    }

    var dismiss = e.target.closest('[data-bs-dismiss="modal"]');
    if (dismiss) {
      var modal = dismiss.closest('.modal-overlay');
      if (modal) modal.classList.remove('show');
      return;
    }

    if (e.target.closest('.modal-overlay.show') && !e.target.closest('.modal-panel')) {
      e.target.closest('.modal-overlay.show').classList.remove('show');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var openModals = document.querySelectorAll('.modal-overlay.show');
      for (var i = 0; i < openModals.length; i++) {
        openModals[i].classList.remove('show');
      }
    }
  });
})();
