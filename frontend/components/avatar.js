// Avatar component — renders user avatars with fallback icon and optional admin badge
(function () {

    var style = document.createElement('style');
    style.id = 'avatar-injected';
    style.textContent = `
        .av-wrapper {
            position: relative;
            display: inline-block;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .av-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            outline: 2px solid var(--border-default);
        }
        .av-fallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-surface);
            border-radius: 50%;
            outline: 2px solid var(--border-default);
            color: var(--text-secondary);
        }
        .av-admin-badge {
            position: absolute;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent);
        }
    `;
    document.head.appendChild(style);

    window.Avatar = {
        render: function (options) {
            var size = options.size || 40;
            var avatar = options.avatar;
            var isAdmin = !!options.isAdmin;

            var wrapper = document.createElement('div');
            wrapper.className = 'av-wrapper';
            wrapper.style.width = size + 'px';
            wrapper.style.height = size + 'px';

            if (avatar) {
                var img = document.createElement('img');
                img.className = 'av-img';
                img.src = avatar;
                img.alt = '';
                img.loading = 'lazy';
                wrapper.appendChild(img);
            } else {
                var fallback = document.createElement('div');
                fallback.className = 'av-fallback';
                fallback.style.fontSize = Math.round(size * 0.45) + 'px';
                fallback.innerHTML = '<span class="material-symbols-outlined" style="font-size:inherit;">person</span>';
                wrapper.appendChild(fallback);
            }

            if (isAdmin) {
                var badgeWrap = document.createElement('div');
                badgeWrap.className = 'av-admin-badge';
                badgeWrap.title = 'Admin';
                var badgeSize = Math.round(size * 0.4);
                badgeWrap.style.width = badgeSize + 'px';
                badgeWrap.style.height = badgeSize + 'px';
                badgeWrap.style.bottom = -Math.round(badgeSize * 0.15) + 'px';
                badgeWrap.style.right = -Math.round(badgeSize * 0.15) + 'px';
                badgeWrap.style.fontSize = Math.round(badgeSize * 0.6) + 'px';
                badgeWrap.innerHTML = '<span class="material-symbols-outlined" style="font-size:inherit;font-variation-settings:\'FILL\' 1">verified</span>';

                wrapper.appendChild(badgeWrap);
            }

            return wrapper;
        }
    };

})();
