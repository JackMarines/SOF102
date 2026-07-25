(function () {
  var supportsIntersection = 'IntersectionObserver' in window;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealElements(entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var delay = entry.target.dataset.delay || 0;
        setTimeout(function () {
          entry.target.classList.add('revealed');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }

  var observer;

  if (supportsIntersection && !reducedMotion) {
    observer = new IntersectionObserver(revealElements, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    document.addEventListener('DOMContentLoaded', function () {
      var reveals = document.querySelectorAll('.scroll-reveal');
      for (var i = 0; i < reveals.length; i++) {
        observer.observe(reveals[i]);
      }
    });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      var reveals = document.querySelectorAll('.scroll-reveal');
      for (var i = 0; i < reveals.length; i++) {
        reveals[i].classList.add('revealed');
      }
    });
  }
})();
