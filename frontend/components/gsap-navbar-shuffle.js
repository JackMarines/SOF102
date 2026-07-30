(function () {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function rand() { return pool[Math.floor(Math.random() * pool.length)]; }

  function attachShuffle(el) {
    el.addEventListener('mouseenter', function () {
      if (el.dataset.shuffling === '1') return;
      el.dataset.shuffling = '1';

      var html = el.innerHTML;
      var text = el.textContent;
      var len = text.length;
      if (!len) return;

      var obj = { p: 0 };

      function build(p) {
        var n;
        if (p <= 0.5) {
          n = Math.round(len * (1 - p * 2));
        } else {
          n = Math.round(len * (p - 0.5) * 2);
        }
        var out = '';
        for (var j = 0; j < len; j++) {
          out += j < n ? text[j] : rand();
        }
        return out;
      }

      gsap.to(obj, {
        p: 1,
        duration: 1,
        ease: 'none',
        onUpdate: function () { el.textContent = build(obj.p); },
        onComplete: function () {
          el.innerHTML = html;
          el.dataset.shuffling = '0';
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      var container = document.querySelector('.navbar-devclimb .nav-links');
      if (container) {
        var links = container.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) attachShuffle(links[i]);
      }

      var logoTexts = document.querySelectorAll('.logo-text-inner');
      for (var i = 0; i < logoTexts.length; i++) attachShuffle(logoTexts[i]);
    }, 0);
  });
})();
