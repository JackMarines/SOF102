(function () {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth <= 768) {
    document.querySelectorAll('[data-typing][data-loop]').forEach(function (el) {
      var p = el.getAttribute('data-phrases');
      if (p) {
        try { el.textContent = JSON.parse(p)[0] || ''; } catch (e) {}
      }
    });
    return;
  }

  function cursorSet(el, on) {
    var c = el.nextElementSibling;
    if (c && c.classList.contains('hero-cursor')) {
      c.style.animation = on ? '' : 'none';
    }
  }

  function typeOnce(el) {
    var text = el.dataset.phrases ? JSON.parse(el.dataset.phrases)[0] : el._typingText;
    if (!text) return;
    cursorSet(el, false);
    el.textContent = '';
    var obj = { n: 0 };
    gsap.to(obj, {
      n: text.length,
      duration: Math.max(0.8, text.length * 0.04),
      ease: 'none',
      onUpdate: function () { el.textContent = text.substring(0, Math.round(obj.n)); },
      onComplete: function () { el.textContent = text; cursorSet(el, true); }
    });
  }

  function typeLoop(el) {
    var phrases;
    try { phrases = JSON.parse(el.dataset.phrases); } catch (e) { return; }
    if (!phrases || !phrases.length) return;
    el.textContent = '';
    cursorSet(el, false);

    function typeChar(target, i, done) {
      if (i > target.length) { cursorSet(el, true); done(); return; }
      el.textContent = target.substring(0, i);
      gsap.delayedCall(0.04, function () { typeChar(target, i + 1, done); });
    }

    function deleteChar(len, done) {
      if (len <= 0) { cursorSet(el, false); done(); return; }
      el.textContent = el.textContent.substring(0, len - 1);
      gsap.delayedCall(0.025, function () { deleteChar(len - 1, done); });
    }

    function cycle(idx) {
      if (idx >= phrases.length) idx = 0;
      cursorSet(el, false);
      typeChar(phrases[idx], 0, function () {
        gsap.delayedCall(2, function () {
          cursorSet(el, false);
          deleteChar(phrases[idx].length, function () {
            gsap.delayedCall(0.3, function () { cycle(idx + 1); });
          });
        });
      });
    }
    cycle(0);
  }

  function init() {
    var els = document.querySelectorAll('[data-typing]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.hasAttribute('data-loop')) { continue; }
      el._typingText = el.dataset.phrases ? JSON.parse(el.dataset.phrases)[0] : el.textContent;
      el.textContent = '';
    }
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        if (el.hasAttribute('data-loop')) {
          typeLoop(el);
        } else if (typeof ScrollTrigger !== 'undefined' && !el.closest('.horizontal-track')) {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            onEnter: function () { typeOnce(el); },
            once: true
          });
        } else {
          typeOnce(el);
        }
      })(els[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
