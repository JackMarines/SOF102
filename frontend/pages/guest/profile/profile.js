// Guest profile orchestrator — read-only profile with clickable group card, no edit modal
(async function () {
    var params = new URLSearchParams(window.location.search);
    var targetId = params.get('id');

    var p = await fetchProfile(targetId);
    if (!p || p.error) return;

    document.title = (p.displayName || 'Profile') + ' - DevClimb';
    document.getElementById('profile-displayname').textContent = p.displayName || 'Unknown';
    document.getElementById('profile-bio').textContent = p.bio || '';
    document.getElementById('profile-score').textContent = (p.totalScore || 0).toLocaleString();
    document.getElementById('profile-completed').textContent = p.totalCompletedPuzzles || 0;

    var avatarEl = document.getElementById('profile-avatar');
    avatarEl.appendChild(Avatar.render({
        size: 120,
        avatar: p.avatar,
        isAdmin: p.isAdmin
    }));

    if (p.groupName) {
        var groupEl = document.getElementById('group-name');
        groupEl.textContent = p.groupName;
    }

    if (p.teamId) {
        var groupBox = document.getElementById('group-box');
        groupBox.href = '/frontend/pages/guest/team/index.html?id=' + p.teamId;
        groupBox.style.cursor = 'pointer';
    }

    document.getElementById('group-heading').textContent = 'Group';

    // --- Solved Puzzles (PuzzleTable) ---
    var effectiveId = targetId;

    window.loadSolved = async function (page) {
        var tbl = window.solvedTable;
        var search = tbl ? tbl.getSearchTerm() : '';
        var difficulty = tbl ? tbl.getFilter() : '';
        var language = tbl ? tbl.getFilter2() : '';
        var res = await fetchCompletedPuzzles(effectiveId, search, difficulty, language, page, 6);
        if (tbl && res) tbl.setData(res);
    };

    window.solvedTable = PuzzleTable.init('solved-table', {
        columns: [
            { key: 'title', label: 'Title' },
            { key: 'language', label: 'Language', width: '150px' },
            { key: 'difficulty', label: 'Difficulty', width: '120px',
              render: function (val) {
                  return '<span class="pt-row-' + val.toLowerCase() + '">' + val + '</span>';
              }
            },
            { key: 'score', label: 'Score', width: '80px' }
        ],
        searchPlaceholder: 'Search solved puzzles...',
        filterOptions: ['Easy', 'Medium', 'Hard'],
        filterLabel: 'Difficulty',
        filter2Options: ['Python', 'Javascript', 'PHP'],
        filter2Label: 'Language',
        urlTemplate: null,
        onSearch: function () { loadSolved(1); },
        onFilter: function () { loadSolved(1); },
        onFilter2: function () { loadSolved(1); },
        onPageChange: function (page) { loadSolved(page); }
    });

    loadSolved();

    window.__pageReady();
})();
