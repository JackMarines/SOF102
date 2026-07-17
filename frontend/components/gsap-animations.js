/* ============================================================
   DevClimb – GSAP Animations
   Single universal top-down element reveal + page-specific FX
   ============================================================ */

(function () {
    'use strict';

    gsap.registerPlugin(ScrollTrigger);

    /* ── Inject keyframes ── */
    var style = document.createElement('style');
    style.textContent = [
        '@keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}',
        '@keyframes glitchShift{0%,100%{text-shadow:none}20%{text-shadow:-2px 0 #f8615c,2px 0 #60a5fa}40%{text-shadow:2px 0 #f8615c,-2px 0 #60a5fa}60%{text-shadow:-1px 0 #28c244,1px 0 #f8615c}80%{text-shadow:1px 0 #60a5fa,-1px 0 #28c244}}',
        '@keyframes scanline{0%{top:-10%}100%{top:110%}}',
        '@keyframes crtFlicker{0%,100%{opacity:1}92%{opacity:1}93%{opacity:.85}94%{opacity:1}96%{opacity:.9}97%{opacity:1}}',
        '@keyframes dataBorder{0%{background-position:0% 50%}100%{background-position:200% 50%}}',
    ].join('\n');
    document.head.appendChild(style);

    /* ============================================================
       UTILITIES
       ============================================================ */

    function isHome()       { return !!document.querySelector('.hero'); }
    function isAuth()       { return !!document.querySelector('.auth-card'); }
    function isPuzzleList() { return !!document.querySelector('.puzzles-section'); }
    function isSolve()      { return !!document.querySelector('.workspace'); }
    function isDashboard()  { return !!document.querySelector('.glass-box.p-4.mb-5'); }
    function isTeam()       { return !!document.querySelector('.tt-banner'); }
    function isProfile()    { return !!document.querySelector('#profile-avatar'); }

    /* ── Typewriter ── */
    function typewriter(el, opts) {
        var text  = el.textContent.trim();
        var speed = (opts && opts.speed) || 35;
        var delay = (opts && opts.delay) || 0;
        el.textContent = '';
        el.style.visibility = 'visible';
        var cursor = document.createElement('span');
        cursor.style.cssText = 'display:inline-block;width:2px;height:1em;background:#60a5fa;margin-left:2px;vertical-align:text-bottom;animation:cursorBlink .7s step-end infinite';
        el.appendChild(cursor);
        var i = 0;
        setTimeout(function tick() {
            if (i < text.length) {
                el.insertBefore(document.createTextNode(text[i]), cursor);
                i++;
                setTimeout(tick, speed + Math.random() * 20);
            } else {
                setTimeout(function () { cursor.remove(); }, 1000);
            }
        }, delay);
    }

    /* ── Glitch text ── */
    function glitchOnLoad(el) {
        el.style.animation = 'glitchShift .25s ease 2';
        setTimeout(function () { el.style.textShadow = 'none'; }, 600);
    }

    /* ── Text scramble ── */
    function scrambleText(el, callback) {
        var original = el.textContent;
        var chars = '01';
        var iter = 0;
        var iv = setInterval(function () {
            el.textContent = original.split('').map(function (ch, i) {
                return i < iter ? original[i] : chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            iter += 1 / 2;
            if (iter >= original.length) {
                el.textContent = original;
                clearInterval(iv);
                if (callback) callback();
            }
        }, 28);
    }

    /* ── Binary count-up ── */
    function binaryCountUp(el, target, suffix) {
        var obj = { val: 0 };
        gsap.to(obj, {
            val: target, duration: 1.2, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
            onUpdate: function () {
                var real = Math.round(obj.val);
                var display = String(real).split('').map(function (d) {
                    if (Math.random() > 0.7 + obj.val / target * 0.3) return Math.random() > 0.5 ? '0' : '1';
                    return d;
                }).join('');
                el.textContent = display + (suffix || '');
            },
            onComplete: function () { el.textContent = target + (suffix || ''); }
        });
    }

    function parseStat(text) {
        var m = text.match(/(\d+)/);
        if (!m) return null;
        return { num: parseInt(m[1], 10), suffix: text.replace(m[1], '') };
    }

    /* ── Matrix rain ── */
    function matrixRain(container) {
        var canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.04;z-index:0';
        container.style.position = 'relative';
        container.insertBefore(canvas, container.firstChild);
        var ctx = canvas.getContext('2d');
        var W, H, cols, drops;
        var txt = '01{}[]<>/\\|=+-*&^%$#@!:;.';
        function resize() {
            W = canvas.width  = container.offsetWidth;
            H = canvas.height = container.offsetHeight;
            cols = Math.floor(W / 14);
            drops = Array(cols).fill(1);
        }
        resize();
        window.addEventListener('resize', resize);
        function draw() {
            ctx.fillStyle = 'rgba(17,17,17,.06)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#60a5fa';
            ctx.font = '13px monospace';
            for (var i = 0; i < cols; i++) {
                var ch = txt[Math.floor(Math.random() * txt.length)];
                ctx.fillText(ch, i * 14, drops[i] * 14);
                if (drops[i] * 14 > H && Math.random() > .975) drops[i] = 0;
                drops[i]++;
            }
            requestAnimationFrame(draw);
        }
        draw();
    }

    /* ── Scanline ── */
    function scanlineOverlay() {
        var line = document.createElement('div');
        line.style.cssText = 'position:fixed;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,rgba(96,165,250,.08),transparent);pointer-events:none;z-index:9999;animation:scanline 8s linear infinite';
        document.body.appendChild(line);
    }

    /* ── Hover glow ── */
    function addHoverGlow(selector) {
        document.querySelectorAll(selector).forEach(function (el) {
            el.addEventListener('mouseenter', function () {
                gsap.to(el, { boxShadow: '0 0 20px rgba(96,165,250,.15), inset 0 0 20px rgba(96,165,250,.03)', duration: 0.3, ease: 'power2.out' });
            });
            el.addEventListener('mouseleave', function () {
                gsap.to(el, { boxShadow: 'none', duration: 0.4, ease: 'power2.out' });
            });
        });
    }

    /* ── Data border ── */
    function addDataBorder(selector) {
        document.querySelectorAll(selector).forEach(function (el) {
            el.style.position = 'relative';
            var border = document.createElement('div');
            border.style.cssText = 'position:absolute;inset:-1px;border:1px solid transparent;pointer-events:none;opacity:0;transition:opacity .3s;z-index:1';
            el.appendChild(border);
            el.addEventListener('mouseenter', function () {
                border.style.opacity = '1';
                border.style.borderImage = 'linear-gradient(90deg, transparent, #60a5fa, transparent) 1';
                border.style.animation = 'dataBorder 2s linear infinite';
                border.style.background = 'linear-gradient(90deg, transparent, rgba(96,165,250,.1), transparent) border-box';
                border.style.backgroundClip = 'padding-box';
            });
            el.addEventListener('mouseleave', function () {
                border.style.opacity = '0';
            });
        });
    }

    /* ============================================================
       GATE
       ============================================================ */

    var ready = false;
    var animQueue = [];

    function whenReady(fn) {
        if (ready) fn();
        else animQueue.push(fn);
    }

    function flushQueue() {
        ready = true;
        for (var i = 0; i < animQueue.length; i++) animQueue[i]();
        animQueue = [];
    }

    if (typeof window.onPageReady === 'function') {
        window.onPageReady(flushQueue);
    } else {
        var poll = setInterval(function () {
            if (typeof window.onPageReady === 'function') {
                clearInterval(poll);
                window.onPageReady(flushQueue);
            }
        }, 20);
        setTimeout(function () { clearInterval(poll); if (!ready) flushQueue(); }, 200);
    }

    /* ============================================================
       UNIVERSAL TOP-DOWN REVEAL
       Every visible element on the page fades in top-to-bottom
       ============================================================ */

    // Run immediately — no gate needed for the reveal itself
    (function revealAll() {
        // Navbar first
        var nav = document.querySelector('.navbar, .custom-navbar');
        if (nav) {
            gsap.from(nav, { opacity: 0, y: -20, duration: 0.3, ease: 'power2.out' });
        }

        // Collect top-level children of body (skip scripts, styles, etc.)
        var elements = [];
        var skip = { 'SCRIPT': 1, 'STYLE': 1, 'LINK': 1, 'META': 1, 'BR': 1, 'HR': 1, 'NOSCRIPT': 1 };

        Array.prototype.forEach.call(document.body.children, function (el) {
            if (skip[el.tagName]) return;
            if (el.id === 'navbar' || el.id === 'footer') return;
            if (el.id === 'devclimb-overlay' || el.id === 'dc-overlay') return;
            if (el.offsetHeight === 0) return;
            var s = window.getComputedStyle(el);
            if (s.display === 'none' || s.visibility === 'hidden') return;
            elements.push(el);
        });

        // Also walk inside .container sections to get inner elements
        document.querySelectorAll('section.container, .hero, .auth-card, .workspace, .glass-box').forEach(function (container) {
            // Don't double-add the container itself
            // Get its direct children
            Array.prototype.forEach.call(container.children, function (child) {
                if (child.offsetHeight === 0) return;
                if (child.id === 'navbar' || child.id === 'footer') return;
                var s = window.getComputedStyle(child);
                if (s.display === 'none' || s.visibility === 'hidden') return;
                elements.push(child);
            });
        });

        // Deduplicate
        var seen = {};
        var unique = [];
        elements.forEach(function (el) {
            if (!seen[el]) { seen[el] = true; unique.push(el); }
        });

        // Sort top-to-bottom
        unique.sort(function (a, b) {
            return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
        });

        if (unique.length === 0) return;

        // Set initial state
        gsap.set(unique, { opacity: 0, y: 20 });

        // Stagger reveal top-to-bottom
        gsap.to(unique, {
            opacity: 1, y: 0,
            stagger: 0.06,
            duration: 0.35,
            ease: 'power2.out',
            delay: 0.08
        });
    })();

    // Page-specific extras (run immediately, same timing as reveal)
    if (isHome()) {
        matrixRain(document.querySelector('.hero'));
        scanlineOverlay();

        var title = document.querySelector('.hero-title');
        if (title) {
            glitchOnLoad(title);
            scrambleText(title, function () {
                typewriter(title, { speed: 40, delay: 200 });
            });
        }

        document.querySelectorAll('.stat-card').forEach(function (card) {
            var numEl = card.querySelector('.stat-number');
            if (numEl) {
                var p = parseStat(numEl.textContent);
                if (p) binaryCountUp(numEl, p.num, p.suffix);
            }
        });

        var featHeading = document.querySelector('.text-center.mb-5 h2');
        if (featHeading) {
            ScrollTrigger.create({
                trigger: featHeading, start: 'top 85%', once: true,
                onEnter: function () { scrambleText(featHeading); }
            });
        }

        addHoverGlow('.glass-box');
        addDataBorder('.stat-card');
    }

    if (isAuth()) {
        var card = document.querySelector('.auth-card');
        gsap.to(card, { animation: 'crtFlicker 5s ease-in-out infinite' });

        var scanEl = document.createElement('div');
        scanEl.style.cssText = 'position:absolute;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,rgba(96,165,250,.1),transparent);pointer-events:none;z-index:10;animation:scanline 5s linear infinite';
        card.appendChild(scanEl);
    }

    if (isPuzzleList()) {
        var pTitle = document.querySelector('.page-title');
        if (pTitle) {
            var origText = pTitle.textContent;
            pTitle.textContent = '';
            setTimeout(function () { typewriter(pTitle, { speed: 50, delay: 200 }); pTitle.textContent = origText; }, 100);
        }

        var puzzleContainer = document.querySelector('.pt-list') || document.querySelector('#puzzle-table');
        if (puzzleContainer) {
            var obs = new MutationObserver(function () {
                var items = puzzleContainer.querySelectorAll('.pt-row');
                if (items.length > 0) {
                    gsap.from(items, { opacity: 0, y: 12, stagger: 0.04, duration: 0.3, ease: 'power2.out' });
                    obs.disconnect();
                }
            });
            obs.observe(puzzleContainer, { childList: true, subtree: true });
        }
    }

    if (isSolve()) {
        gsap.to('.btn-submit', {
            boxShadow: '0 0 10px rgba(96,165,250,.4), 0 0 20px rgba(96,165,250,.15)',
            repeat: -1, yoyo: true, duration: 1.5, ease: 'sine.inOut'
        });

        var resizer = document.getElementById('verticalResizer');
        if (resizer) {
            resizer.addEventListener('mouseenter', function () {
                gsap.to(resizer, { background: '#60a5fa', boxShadow: '0 0 8px rgba(96,165,250,.4)', duration: 0.25 });
            });
            resizer.addEventListener('mouseleave', function () {
                gsap.to(resizer, { background: 'rgba(255,255,255,.07)', boxShadow: 'none', duration: 0.25 });
            });
        }
    }

    if (isDashboard()) {
        var teamGrid = document.getElementById('team-members');
        if (teamGrid) {
            var tObs = new MutationObserver(function () {
                var cards = teamGrid.querySelectorAll(':scope > div');
                if (cards.length > 0) {
                    gsap.from(cards, { opacity: 0, y: 12, stagger: 0.04, duration: 0.3, ease: 'power2.out' });
                    tObs.disconnect();
                }
            });
            tObs.observe(teamGrid, { childList: true });
        }
        addHoverGlow('.glass-box');
    }

    if (isTeam()) {
        gsap.to('.tt-banner-img', {
            yPercent: 12, ease: 'none',
            scrollTrigger: { trigger: '.tt-banner', start: 'top bottom', end: 'bottom top', scrub: true }
        });
        addHoverGlow('.glass-box');
    }

    if (isProfile()) {
        addHoverGlow('.glass-box');
    }

})();
