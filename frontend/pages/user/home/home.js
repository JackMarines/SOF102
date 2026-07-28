// Home page orchestrator — dynamic dashboard with team grid, weekly puzzles, and team activity
window.addEventListener('deps-ready', function () {
getMe().then(async function (session) {
    if (typeof checkUserWarning === 'function') {
        checkUserWarning();
    }

    showSkeleton('team-members', 'team-grid');
    showSkeleton('weekly-puzzles', 'puzzle-rows');
    showSkeleton('team-activity', 'puzzle-rows-has-user');

    var data = await fetchHome();
    if (!data || data.error) return;

    // --- Welcome ---
    document.getElementById('username').textContent = data.displayName || '';

    // --- Team Members ---
    var team = data.team;

    function renderTeamMembers() {
        var membersEl = document.getElementById('team-members');
        membersEl.innerHTML = '';

        var all = team && team.topMembers || [];
        if (all.length === 0) {
            document.getElementById('team-section').style.display = 'none';
            return;
        }

        document.getElementById('team-section').style.display = '';

        for (var i = 0; i < all.length; i++) {
            var m = all[i];
            var col = document.createElement('div');

            var card = document.createElement('a');
            card.href = '/frontend/pages/user/profile/index.html?id=' + m.userId;
            card.className = 'text-decoration-none';

            var box = document.createElement('div');
            box.className = 'glass-box p-3 text-center home-member-card';

            var rankBadge = document.createElement('div');
            rankBadge.className = 'mb-1 fw-bold';
            rankBadge.style.fontSize = '13px';
            rankBadge.textContent = '#' + m.rank;
            box.style.boxSizing = 'border-box';
            if (m.rank === 1) {
                rankBadge.style.color = '#FFD700';
                box.style.border = '2px solid #FFD700';
                box.style.background = 'rgba(255,215,0,0.06)';
            } else if (m.rank === 2) {
                rankBadge.style.color = '#C0C0C0';
                box.style.border = '2px solid #C0C0C0';
                box.style.background = 'rgba(192,192,192,0.06)';
            } else if (m.rank === 3) {
                rankBadge.style.color = '#CD7F32';
                box.style.border = '2px solid #CD7F32';
                box.style.background = 'rgba(205,127,50,0.06)';
            } else {
                rankBadge.className += ' text-secondary';
            }

            var avatarWrap = document.createElement('div');
            avatarWrap.className = 'd-flex justify-content-center mb-2';
            avatarWrap.appendChild(Avatar.render({ size: 64, avatar: m.avatar, isAdmin: m.isAdmin }));

            var nameEl = document.createElement('div');
            nameEl.className = 'home-member-name';
            nameEl.textContent = m.displayName || '';

            var scoreEl = document.createElement('small');
            scoreEl.className = 'text-secondary';
            scoreEl.style.fontSize = '12px';
            scoreEl.textContent = (m.totalScore || 0).toLocaleString() + ' pts';

            box.appendChild(rankBadge);
            box.appendChild(avatarWrap);
            box.appendChild(nameEl);
            box.appendChild(scoreEl);
            card.appendChild(box);
            col.appendChild(card);
            membersEl.appendChild(col);
        }
    }

    renderTeamMembers();

    // --- Helper: Render puzzle rows as clickable links to solve page ---
    function renderPuzzleRows(containerId, items, showUser) {
        var el = document.getElementById(containerId);
        if (!items || items.length === 0) {
            el.innerHTML = '<div class="text-center text-secondary p-4">No data available.</div>';
            return;
        }
        el.innerHTML = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var link = document.createElement('a');
            link.href = '/frontend/pages/user/solve/index.html?id=' + item.id;
            link.className = 'puzzle-item' + (showUser ? ' has-user' : '');
            link.style.textDecoration = 'none';
            link.style.color = 'inherit';
            var html = '';
            if (showUser) {
                html += '<span>' + (item.displayName || '') + '</span>';
            }
            html += '<span class="puzzle-title">' + (item.title || '') + '</span>';
            html += '<span>' + (item.language || '-') + '</span>';
            html += '<span class="' + (item.difficulty || '').toLowerCase() + '">' + (item.difficulty || '-') + '</span>';
            link.innerHTML = html;
            el.appendChild(link);
        }
    }

    // --- Weekly Puzzles (no user column) ---
    renderPuzzleRows('weekly-puzzles', data.weeklyPuzzles, false);

    // --- Team Activity (with user column, excludes current user) ---
    renderPuzzleRows('team-activity', data.teamActivity, true);
});
});
