// Profile page orchestrator — user profile view with edit modal, group card link, and solved puzzles table
checkAuth().then(async function (session) {
    var params = new URLSearchParams(window.location.search);
    var targetId = params.get('id');
    var isOwn = !targetId || String(targetId) === String(session.userId);

    // UI toggle for other user's profile
    if (isOwn) {
        var btn = document.createElement('button');
        btn.className = 'custom-btn border-0';
        btn.setAttribute('data-bs-toggle', 'modal');
        btn.setAttribute('data-bs-target', '#editProfileModal');
        btn.textContent = 'Edit Profile';
        document.getElementById('edit-btn-wrapper').appendChild(btn);
    } else {
        document.getElementById('group-heading').textContent = 'Group';
    }

    // --- Profile ---
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

    // Make group card clickable if user has a team
    if (p.teamId) {
        var groupBox = document.getElementById('group-box');
        groupBox.href = '/frontend/pages/user/team/index.html?id=' + p.teamId;
        groupBox.style.cursor = 'pointer';
    }

    // --- Edit Profile Modal ---
    if (isOwn) {
        var displayNameInput = document.getElementById('edit-username-input');
        var bioInput = document.getElementById('edit-bio-input');
        var avatarInput = document.getElementById('edit-avatar-input');

        displayNameInput.value = p.displayName || '';
        bioInput.value = p.bio || '';

        document.getElementById('save-profile-btn').addEventListener('click', async function () {
            var btn = this;
            var displayName = displayNameInput.value.trim();
            var bio = bioInput.value.trim();

            if (!displayName) {
                alert('Display name is required');
                return;
            }

            var payload = { displayName: displayName, bio: bio || null };

            // Handle avatar upload as base64
            var file = avatarInput.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = async function (e) {
                    payload.avatar = e.target.result;
                    await doSave(btn, payload);
                };
                reader.readAsDataURL(file);
            } else {
                await doSave(btn, payload);
            }
        });

        async function doSave(btn, payload) {
            btn.disabled = true;
            btn.textContent = 'Saving...';

            var res = await updateProfile(payload);

            btn.disabled = false;
            btn.textContent = 'Save Changes';

            if (res && !res.error) {
                window.location.reload();
            } else {
                alert(res ? (res.error || 'Failed to update') : 'Failed to update');
            }
        }
    }

    // --- Solved Puzzles (PuzzleTable) ---
    var effectiveId = targetId || String(session.userId);

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
        urlTemplate: '/frontend/pages/user/solve/index.html?id=',
        onSearch: function () { loadSolved(1); },
        onFilter: function () { loadSolved(1); },
        onFilter2: function () { loadSolved(1); },
        onPageChange: function (page) { loadSolved(page); }
    });

    loadSolved();

    window.__pageReady();
});
