(function () {
  if (typeof gsap === 'undefined') return;
  var canvas = document.querySelector('.hacker-bg');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var hero = document.querySelector('.hero-devclimb');
  var fontSize = 14;
  var cols, drops, binary = '01';

  function setup() {
    var rect = hero.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);
    cols = Math.floor(rect.width / fontSize);
    drops = [];
    for (var i = 0; i < cols; i++) drops[i] = Math.floor(Math.random() * -30);
  }

  function draw() {
    var rect = hero.getBoundingClientRect();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.font = fontSize + 'px monospace';

    for (var i = 0; i < cols; i++) {
      var y = drops[i] * fontSize;

      ctx.fillStyle = '#64b5f6';
      ctx.fillText(binary[Math.random() > 0.5 ? 0 : 1], i * fontSize, y);

      for (var j = 1; j < 6; j++) {
        var ty = y - j * fontSize;
        if (ty < 0) break;
        ctx.fillStyle = 'rgba(100, 181, 246, ' + (0.5 - j * 0.08) + ')';
        ctx.fillText(binary[Math.random() > 0.5 ? 0 : 1], i * fontSize, ty);
      }

      if (y > rect.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  setup();
  window.addEventListener('resize', setup);
  gsap.ticker.add(draw);
  gsap.from(canvas, { opacity: 0, duration: 1.5 });
})();
