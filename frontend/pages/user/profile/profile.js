// Profile page orchestrator — user profile view with edit modal, group banner, charts, and solved puzzles table
window.addEventListener('deps-ready', function () {
getMe().then(async function (session) {
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
    }

    // --- Profile ---
    showSkeleton('profile-avatar', 'profile-info');
    showSkeleton('solved-table', 'puzzle-rows');
    var p = await fetchProfile(targetId);
    if (!p || p.error) return;

    document.title = (p.displayName || 'Profile') + ' - DevClimb';
    document.getElementById('profile-displayname').textContent = p.displayName || 'Unknown';
    document.getElementById('profile-bio').textContent = p.bio || '';
    document.getElementById('profile-score').textContent = (p.totalScore || 0).toLocaleString();
    document.getElementById('profile-completed').textContent = p.totalCompletedPuzzles || 0;

    var avatarEl = document.getElementById('profile-avatar');
    avatarEl.innerHTML = '';
    avatarEl.appendChild(Avatar.render({
        size: 120,
        avatar: p.avatar,
        isAdmin: p.isAdmin
    }));

    // --- Group Banner ---
    var groupBanner = document.getElementById('group-banner');
    var groupBg = document.getElementById('group-banner-bg');
    var groupHeading = document.getElementById('group-heading');
    var groupMembers = document.getElementById('group-members');

    if (p.groupName) {
        groupHeading.textContent = p.groupName;
        if (p.groupAvatar) {
            groupBg.style.backgroundImage = 'url(' + p.groupAvatar + ')';
            groupBg.style.backgroundSize = 'cover';
            groupBg.style.backgroundPosition = 'center';
        }
        if (p.teamId) {
            groupBanner.href = '/frontend/pages/user/team/index.html?id=' + p.teamId;
            groupBanner.style.cursor = 'pointer';
        }
        groupBanner.style.display = 'block';
    } else {
        groupHeading.textContent = 'No Group';
    }

    // --- Edit Profile Modal ---
    if (isOwn) {
        var displayNameInput = document.getElementById('edit-username-input');
        var bioInput = document.getElementById('edit-bio-input');
        var avatarInput = document.getElementById('edit-avatar-input');

        var avatarUrlInput = document.getElementById('edit-avatar-url');

        displayNameInput.value = p.displayName || '';
        bioInput.value = p.bio || '';

        // Show filename when file is selected
        avatarInput.addEventListener('change', function () {
            var fn = document.getElementById('edit-avatar-filename');
            fn.textContent = this.files[0] ? this.files[0].name : 'No file chosen';
        });

        document.getElementById('save-profile-btn').addEventListener('click', async function () {
            var btn = this;
            if (btn.disabled) return;
            btn.disabled = true;
            var displayName = displayNameInput.value.trim();
            var bio = bioInput.value.trim();

            if (!displayName) {
                btn.disabled = false;
                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--warning);">warning</span>', title: 'Validation Error', message: 'Display name is required', okLabel: 'OK' });
                return;
            }

            var payload = { displayName: displayName, bio: bio || null };

            var urlVal = avatarUrlInput ? avatarUrlInput.value.trim() : '';
            var file = avatarInput.files[0];

            if (urlVal) {
                payload.avatar = urlVal;
            } else if (file) {
                btn.disabled = true;
                btn.textContent = 'Uploading...';
                var uploadRes = await apiUpload('/upload/avatar', file);
                if (uploadRes && uploadRes.url) {
                    payload.avatar = uploadRes.url;
                } else {
                    btn.disabled = false;
                    btn.textContent = 'Save Changes';
                    Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Upload Failed', message: uploadRes ? (uploadRes.error || 'Avatar upload failed') : 'Avatar upload failed', okLabel: 'OK' });
                    return;
                }
            }

            await doSave(btn, payload);
        });

        async function doSave(btn, payload) {
            btn.disabled = true;
            btn.textContent = 'Saving...';

            var res = await updateProfile(payload);

            btn.disabled = false;
            btn.textContent = 'Save Changes';

            if (res && !res.error) {
                document.getElementById('editProfileModal').classList.remove('show');
                document.getElementById('profile-displayname').textContent = payload.displayName || '';
                document.getElementById('profile-bio').textContent = payload.bio || '';
                if (payload.avatar) {
                    var av = document.getElementById('profile-avatar');
                    av.innerHTML = '';
                    av.appendChild(Avatar.render({ size: 120, avatar: payload.avatar, isAdmin: p.isAdmin }));
                }
                invalidateCache('/auth/me');
            } else {
                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to update') : 'Failed to update', okLabel: 'OK' });
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
        emptyMessage: 'No puzzles solved yet.',
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

    function css(key) { return getComputedStyle(document.documentElement).getPropertyValue(key).trim(); }
    function csstext(key) { return getComputedStyle(document.documentElement).getPropertyValue('--text-' + key).trim(); }
    function accentRgb(a) {
        var h = css('--accent');
        return 'rgba(' + parseInt(h.slice(1,3),16) + ',' + parseInt(h.slice(3,5),16) + ',' + parseInt(h.slice(5,7),16) + ',' + a + ')';
    }

    // ── Language Distribution Chart (Chart.js) ──
    fetchCompletedPuzzles(effectiveId, '', '', '', 1, 100).then(function(res) {
        if (!res || !res.data) return;
        var langCounts = { 'Javascript': 0, 'Python': 0, 'PHP': 0 };
        for (var i = 0; i < res.data.length; i++) {
            var lang = res.data[i].language || '';
            var l = lang.toLowerCase();
            if (l.indexOf('javascript') !== -1 || l.indexOf('node') !== -1 || l.indexOf('js') !== -1) langCounts['Javascript']++;
            else if (l.indexOf('python') !== -1) langCounts['Python']++;
            else if (l.indexOf('php') !== -1) langCounts['PHP']++;
        }
        var langs = Object.keys(langCounts).sort(function(a, b) { return langCounts[b] - langCounts[a]; });

        var ctx = document.getElementById('langChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: langs,
                datasets: [{
                    label: 'Solved',
                    data: langs.map(function(l) { return langCounts[l]; }),
                    backgroundColor: accentRgb(0.7),
                    borderColor: css('--accent'),
                    borderWidth: 1,
                    borderRadius: 0,
                    barThickness: 28
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: {
                            color: csstext('muted'),
                            font: { family: 'JetBrains Mono', size: 10 }
                        },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    y: {
                        ticks: {
                            color: csstext('secondary'),
                            font: { family: 'JetBrains Mono', size: 11 }
                        },
                        grid: { display: false }
                    }
                }
            },
            plugins: [{
                id: 'barLabels',
                afterDatasetsDraw: function(chart) {
                    var ctx2 = chart.ctx;
                    chart.data.datasets.forEach(function(ds, i) {
                        var meta = chart.getDatasetMeta(i);
                        meta.data.forEach(function(bar, j) {
                            var val = ds.data[j];
                            if (val > 0) {
                                ctx2.fillStyle = accentRgb(1);
                                ctx2.font = '10px JetBrains Mono';
                                ctx2.textAlign = 'left';
                                ctx2.textBaseline = 'middle';
                                ctx2.fillText(val, bar.x + 8, bar.y);
                            }
                        });
                    });
                }
            }]
        });
    });

    // ── Activity Chart (Admin-style) ──
    apiGet('/profile/activity?id=' + effectiveId).then(function(res) {
        if (!res || !res.data) return;

        var dayCounts = {};
        for (var i = 0; i < res.data.length; i++) {
            var item = res.data[i];
            dayCounts[item.date] = (dayCounts[item.date] || 0) + item.solves;
        }

        var profileActivityChart = null;

        function initActivityChart(days) {
            var today = new Date();
            var labels = [];
            var values = [];
            for (var i = days - 1; i >= 0; i--) {
                var date = new Date(today);
                date.setDate(date.getDate() - i);
                var key = date.getFullYear() + '-' +
                    String(date.getMonth() + 1).padStart(2, '0') + '-' +
                    String(date.getDate()).padStart(2, '0');
                labels.push(date.getMonth() + 1 + '/' + date.getDate());
                values.push(dayCounts[key] || 0);
            }

            var ctx2 = document.getElementById('profile-activity-chart').getContext('2d');
            if (profileActivityChart) profileActivityChart.destroy();
            profileActivityChart = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Puzzles Solved',
                        data: values,
                        borderColor: css('--accent'),
                        backgroundColor: accentRgb(0.08),
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: csstext('muted'), font: { size: 9, family: 'JetBrains Mono' }, maxTicksLimit: 8 } },
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: csstext('muted'), font: { size: 9, family: 'JetBrains Mono' } } }
                    }
                }
            });
        }

        initActivityChart(7);
        document.querySelector('#profile-activity-chart').parentElement.querySelectorAll('.chart-filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelector('#profile-activity-chart').parentElement.querySelectorAll('.chart-filter-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var filter = btn.getAttribute('data-filter');
                var days = filter === 'today' ? 1 : filter === 'week' ? 7 : filter === 'month' ? 30 : 100;
                apiGet('/profile/activity?id=' + effectiveId).then(function(res) {
                    if (res && res.data) {
                        dayCounts = {};
                        for (var i = 0; i < res.data.length; i++) {
                            var item = res.data[i];
                            dayCounts[item.date] = (dayCounts[item.date] || 0) + item.solves;
                        }
                    }
                    initActivityChart(days);
                });
        });
    });
});
});

});
