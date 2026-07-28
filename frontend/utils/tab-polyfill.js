(function () {
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-bs-toggle="tab"]');
    if (!trigger) return;
    e.preventDefault();

    var targetId = trigger.getAttribute('data-bs-target');
    if (!targetId) return;

    var tabContent = trigger.closest('.tab-content-wrap');
    if (!tabContent) return;

    var nav = trigger.closest('.nav-tabs, .nav');
    if (nav) {
      nav.querySelectorAll('[data-bs-toggle="tab"]').forEach(function (t) {
        t.classList.remove('active');
      });
      trigger.classList.add('active');
    }

    tabContent.querySelectorAll('.tab-pane').forEach(function (pane) {
      pane.classList.remove('show', 'active');
    });

    var target = tabContent.querySelector(targetId);
    if (target) {
      target.classList.add('show', 'active');
    }
  });
})();
