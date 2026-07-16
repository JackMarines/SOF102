checkAuth().then(async function (session) {
    var data = await fetchHome();
    if (!data || data.error) return;

    // --- Welcome ---
    document.getElementById('username').textContent = data.displayName || '';

    // --- Team Members ---
    var team = data.team;
    if (team && team.topMembers && team.topMembers.length > 0) {
        var membersEl = document.getElementById('team-members');
        membersEl.innerHTML = '';

        for (var i = 0; i < team.topMembers.length; i++) {
            var m = team.topMembers[i];
            var col = document.createElement('div');
            col.className = 'col-lg-3 col-md-4 col-sm-6';

            var card = document.createElement('a');
            card.href = '/frontend/pages/user/profile/index.html?id=' + m.userId;
            card.className = 'text-decoration-none';

            var box = document.createElement('div');
            box.className = 'glass-box p-4 text-center';

            // Rank badge
            var rankBadge = document.createElement('div');
            rankBadge.className = 'mb-2 fw-bold';
            rankBadge.textContent = '#' + m.rank;
            if (m.rank === 1) rankBadge.style.color = '#FFD700';
            else if (m.rank === 2) rankBadge.style.color = '#C0C0C0';
            else if (m.rank === 3) rankBadge.style.color = '#CD7F32';
            else rankBadge.className += ' text-secondary';

            // Avatar
            var avatarWrap = document.createElement('div');
            avatarWrap.className = 'd-flex justify-content-center mb-3';
            avatarWrap.appendChild(Avatar.render({ size: 90, avatar: m.avatar }));

            // Name
            var nameEl = document.createElement('h5');
            nameEl.className = 'mb-1';
            nameEl.style.color = 'inherit';
            nameEl.textContent = m.displayName || '';

            // Score
            var scoreEl = document.createElement('small');
            scoreEl.className = 'text-secondary';
            scoreEl.textContent = (m.totalScore || 0).toLocaleString() + ' pts';

            box.appendChild(rankBadge);
            box.appendChild(avatarWrap);
            box.appendChild(nameEl);
            box.appendChild(scoreEl);
            card.appendChild(box);
            col.appendChild(card);
            membersEl.appendChild(col);
        }
    } else {
        document.getElementById('team-section').style.display = 'none';
    }

    // --- Helper: Render puzzle rows ---
    function renderPuzzleRows(containerId, items, showUser) {
        var el = document.getElementById(containerId);
        if (!items || items.length === 0) {
            el.innerHTML = '<div class="text-center text-secondary p-4">No data available.</div>';
            return;
        }
        el.innerHTML = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var row = document.createElement('div');
            row.className = 'puzzle-item' + (showUser ? ' has-user' : '');
            var html = '';
            if (showUser) {
                html += '<span>' + (item.displayName || '') + '</span>';
            }
            html += '<span class="puzzle-title">' + (item.title || '') + '</span>';
            html += '<span>' + (item.language || '-') + '</span>';
            html += '<span class="' + (item.difficulty || '').toLowerCase() + '">' + (item.difficulty || '-') + '</span>';
            row.innerHTML = html;
            el.appendChild(row);
        }
    }

    // --- Weekly Puzzles (no user column) ---
    renderPuzzleRows('weekly-puzzles', data.weeklyPuzzles, false);

    // --- Team Activity (with user column, excludes current user) ---
    renderPuzzleRows('team-activity', data.teamActivity, true);
});
