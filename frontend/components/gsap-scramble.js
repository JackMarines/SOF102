(function () {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function scramble(el) {
    var originalHTML = el.innerHTML;
    var text = el.textContent;
    var len = text.length;
    if (!len) return;

    function randBin() { return Math.random() > 0.5 ? '0' : '1'; }

    function build(progress) {
      var n = Math.round(progress * len);
      var out = '';
      for (var i = 0; i < len; i++) {
        out += i < n ? text[i] : randBin();
      }
      return out;
    }

    el.textContent = build(0);

    var obj = { p: 0 };
    gsap.to(obj, {
      p: 1,
      duration: 4.0,
      ease: 'power2.out',
      onUpdate: function () { el.textContent = build(obj.p); },
      onComplete: function () { el.innerHTML = originalHTML; }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof ScrollTrigger === 'undefined') return;
    var els = document.querySelectorAll('[data-scramble]');
    els.forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        onEnter: function () { scramble(el); },
        once: true
      });
    });
  });
})();
