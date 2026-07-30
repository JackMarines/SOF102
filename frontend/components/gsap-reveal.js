(function () {
  if (typeof gsap === 'undefined') return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('DOMContentLoaded', function () {

    // ── Hero entrance (on load) ──
    var heroTl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.6 } });
    heroTl
      .from('.hero-devclimb .hero-badge',      { y: -20, opacity: 0, duration: 0.4 })
      .from('.hero-devclimb h1',                { y: 30, opacity: 0 }, '-=0.2')
      .from('.hero-devclimb .hero-sub',         { y: 20, opacity: 0, duration: 0.4 }, '-=0.1')
      .from('.hero-devclimb .hero-actions',     { y: 20, opacity: 0 }, '-=0.1')
      .from('.code-window',                     { y: 40, opacity: 0, duration: 1 }, '-=0.1');

    // ── Stats section (ScrollTrigger) ──
    var statSection = document.querySelector('.stats-table');
    if (statSection && typeof ScrollTrigger !== 'undefined') {

      var meters = statSection.querySelectorAll('.stat-meter');
      meters.forEach(function (m) {
        var target = m.style.width;
        if (!target) return;
        gsap.fromTo(m, { width: 0 }, {
          width: target,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: statSection,
            start: 'top 85%'
          }
        });
      });

      gsap.from(statSection.querySelectorAll('.stat-row'), {
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: statSection,
          start: 'top 85%'
        }
      });
    }

    // ── Feature blocks + CTA (ScrollTrigger) ──
    if (typeof ScrollTrigger !== 'undefined') {
      var reveals = document.querySelectorAll('.scroll-reveal');
      reveals.forEach(function (el) {
        var delay = parseInt(el.dataset.delay) || 0;
        gsap.fromTo(el, { opacity: 0, y: 30 }, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: delay / 1000,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%'
          }
        });
      });
    }

  });
})();
