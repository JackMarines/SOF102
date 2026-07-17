// Loading overlay — homepage only; other pages get instant API
(function () {
    'use strict';

    var isHome = !!document.querySelector('.hero');

    if (!isHome) {
        // Non-homepage: define APIs immediately, no overlay
        window.__pageReady = function (cb) { if (cb) cb(); };
        window.onPageReady = function (cb) { cb(); };
        return;
    }

    var style = document.createElement('style');
    style.textContent = [
        '#dc-overlay{',
        '  position:fixed;inset:0;z-index:99998;',
        '  background:#111;',
        '  display:flex;flex-direction:column;align-items:center;justify-content:center;',
        '  font-family:"JetBrains Mono","Cascadia Code","Consolas",monospace;',
        '  overflow:hidden;',
        '  transition:opacity .25s ease,visibility .25s;',
        '}',
        '#dc-overlay.done{opacity:0;visibility:hidden;pointer-events:none}',
        '#dc-overlay pre{',
        '  font-size:9px;line-height:1.15;color:#60a5fa;white-space:pre;text-align:center;',
        '  margin:0;',
        '}',
        '#dc-overlay .sub{',
        '  margin-top:14px;font-size:11px;color:#374151;letter-spacing:6px;text-transform:uppercase;',
        '  opacity:0;transform:translateY(4px);transition:opacity .2s ease,transform .2s ease;',
        '}',
        '#dc-overlay .sub.vis{opacity:1;transform:translateY(0)}',
    ].join('\n');
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'dc-overlay';

    var pre = document.createElement('pre');
    var sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = 'v2.0';

    overlay.appendChild(pre);
    overlay.appendChild(sub);
    document.body.appendChild(overlay);

    var art = [
        'DDDDDDDDDDDDD      EEEEEEEEEEEEEEEEEEEEEE VVVVVVVV           VVVVVVVV   CCCCCCCCCCCCCLLLLLLLLLLL             IIIIIIIIIIMMMMMMMM               MMMMMMMMBBBBBBBBBBBBBBBBB   ',
        'D::::::::::::DDD   E::::::::::::::::::::EV::::::V           V::::::V CCC::::::::::::CL:::::::::L             I::::::::IM:::::::M             M:::::::MB::::::::::::::::B  ',
        'D:::::::::::::::DD E::::::::::::::::::::EV::::::V           V::::::V CC:::::::::::::::CL:::::::::L             I::::::::IM::::::::M           M::::::::MB::::::BBBBBB:::::B ',
        'DDD:::::DDDDD:::::DEE::::::EEEEEEEEE::::EV::::::V           V::::::VC:::::CCCCCCCC::::CLL:::::::LL             II::::::IIM:::::::::M         M:::::::::MBB:::::B     B:::::B',
        '  D:::::D    D:::::D E:::::E       EEEEEE V:::::V           V:::::VC:::::C       CCCCCC  L:::::L                 I::::I  M::::::::::M       M::::::::::M  B::::B     B:::::B',
        '  D:::::D     D:::::DE:::::E               V:::::V         V:::::VC:::::C                L:::::L                 I::::I  M:::::::::::M     M:::::::::::M  B::::B     B:::::B',
        '  D:::::D     D:::::DE::::::EEEEEEEEEE      V:::::V       V:::::V C:::::C                L:::::L                 I::::I  M:::::::M::::M   M::::M:::::::M  B::::BBBBBB:::::B ',
        '  D:::::D     D:::::DE:::::::::::::::E       V:::::V     V:::::V  C:::::C                L:::::L                 I::::I  M::::::M M::::M M::::M M::::::M  B:::::::::::::BB  ',
        '  D:::::D     D:::::DE:::::::::::::::E        V:::::V   V:::::V   C:::::C                L:::::L                 I::::I  M::::::M  M::::M::::M  M::::::M  B::::BBBBBB:::::B ',
        '  D:::::D     D:::::DE::::::EEEEEEEEEE         V:::::V V:::::V    C:::::C                L:::::L                 I::::I  M::::::M   M:::::::M   M::::::M  B::::B     B:::::B',
        '  D:::::D     D:::::DE:::::E                    V:::::V:::::V     C:::::C                L:::::L                 I::::I  M::::::M    M:::::M    M::::::M  B::::B     B:::::B',
        '  D:::::D    D:::::D E:::::E       EEEEEE        V:::::::::V       C:::::C       CCCCCC  L:::::L         LLLLLL  I::::I  M::::::M     MMMMM     M::::::M  B::::B     B:::::B',
        'DDD:::::DDDDD:::::DEE::::::EEEEEEEE:::::E         V:::::::V         C:::::CCCCCCCC::::CLL:::::::LLLLLLLLL:::::LII::::::IIM::::::M               M::::::MBB:::::BBBBBB::::::B',
        'D:::::::::::::::DD E::::::::::::::::::::E          V:::::V           CC:::::::::::::::CL::::::::::::::::::::::LI::::::::IM::::::M               M::::::MB:::::::::::::::::B ',
        'D::::::::::::DDD   E::::::::::::::::::::E           V:::V              CCC::::::::::::CL::::::::::::::::::::::LI::::::::IM::::::M               M::::::MB::::::::::::::::B  ',
        'DDDDDDDDDDDDD      EEEEEEEEEEEEEEEEEEEEEE            VVV                  CCCCCCCCCCCCCLLLLLLLLLLLLLLLLLLLLLLLLIIIIIIIIIIMMMMMMMM               MMMMMMMMBBBBBBBBBBBBBBBBB   ',
    ].join('\n');

    var revealed = false;
    var dataReady = false;
    var freezeReady = false;
    var callbacks = [];

    function doReveal() {
        if (revealed) return;
        revealed = true;
        overlay.classList.add('done');
        setTimeout(function () {
            overlay.remove();
            for (var i = 0; i < callbacks.length; i++) callbacks[i]();
            callbacks = [];
        }, 260);
    }

    var ci = 0;
    var chunk = 15;
    function typeChunk() {
        if (ci >= art.length) { sub.classList.add('vis'); return; }
        pre.textContent = art.substring(0, Math.min(ci + chunk, art.length));
        ci += chunk;
        setTimeout(typeChunk, 8);
    }
    typeChunk();

    // Type for ~2s, freeze for 1.5s, then reveal
    setTimeout(function () {
        if (revealed) return;
        if (dataReady) doReveal(); else freezeReady = true;
    }, 3500);

    window.__pageReady = function (cb) {
        if (revealed) { if (cb) cb(); return; }
        if (cb) callbacks.push(cb);
        dataReady = true;
        if (freezeReady) doReveal();
    };

    window.onPageReady = function (cb) {
        if (revealed) { cb(); return; }
        callbacks.push(cb);
    };

    setTimeout(function () { dataReady = true; if (freezeReady && !revealed) doReveal(); }, 5000);
})();
