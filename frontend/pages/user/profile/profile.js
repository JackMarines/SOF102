// Profile page orchestrator — hiển thị profile, modal chỉnh sửa, group banner, biểu đồ, bảng puzzle đã giải
window.addEventListener('deps-ready', function () {
getMe().then(async function (session) {
    var params = new URLSearchParams(window.location.search);
    var targetId = params.get('id');
    var isOwn = !targetId || String(targetId) === String(session.userId);

    // Nút chỉnh sửa chỉ hiện với profile của chính user
    if (isOwn) {
        var btn = document.createElement('button');
        btn.className = 'custom-btn border-0';
        btn.setAttribute('data-bs-toggle', 'modal');
        btn.setAttribute('data-bs-target', '#editProfileModal');
        btn.textContent = 'Edit Profile';
        btn.addEventListener('click', function () {
            document.getElementById('edit-avatar-url').value = '';
            document.getElementById('edit-avatar-input').value = '';
            document.getElementById('edit-avatar-filename').textContent = 'No file chosen';
        });
        document.getElementById('edit-btn-wrapper').appendChild(btn);

        // Nút Trophy Case
        var trophyBtn = document.createElement('button');
        trophyBtn.className = 'custom-btn border-0';
        trophyBtn.style.marginLeft = 'var(--space-8px)';
        trophyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:var(--space-4px);">emoji_events</span> Trophy Case';
        trophyBtn.addEventListener('click', function () {
            openTrophyCase();
        });
        document.getElementById('edit-btn-wrapper').appendChild(trophyBtn);
    }

    // --- Profile ---
    showSkeleton('profile-avatar', 'profile-info');
    showSkeleton('solved-table', 'puzzle-rows');
    var p = await fetchProfile(targetId);
    if (!p || p.error) return;

    document.title = (p.displayName || 'Profile') + ' - DevClimb';
    var nameEl = document.getElementById('profile-displayname');
    nameEl.innerHTML = '';
    nameEl.appendChild(document.createTextNode(p.displayName || 'Unknown'));
    if (p.selectedTrophyAvatar) {
        var trophyIcon = document.createElement('img');
        trophyIcon.src = p.selectedTrophyAvatar;
        trophyIcon.alt = 'Trophy';
        trophyIcon.style.cssText = 'width:24px;height:24px;object-fit:contain;margin-left:var(--space-8px);flex-shrink:0;';
        nameEl.appendChild(trophyIcon);
    }
    document.getElementById('profile-bio').textContent = p.bio || '';
    document.getElementById('profile-score').textContent = (p.totalScore || 0).toLocaleString();
    document.getElementById('profile-completed').textContent = p.totalCompletedPuzzles || 0;

    var avatarEl = document.getElementById('profile-avatar');
    avatarEl.innerHTML = '';
    avatarEl.appendChild(Avatar.render({
        size: 120,
        avatar: p.avatar,
        isAdmin: p.isAdmin,
        trophySrc: p.selectedTrophyAvatar || null
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
        if (groupMembers && p.groupMembers) {
            groupMembers.textContent = p.groupMembers;
        }
    } else {
        groupHeading.textContent = 'No Group';
    }

    // --- Modal chỉnh sửa Profile ---
    if (isOwn) {
        var displayNameInput = document.getElementById('edit-username-input');
        var bioInput = document.getElementById('edit-bio-input');
        var avatarInput = document.getElementById('edit-avatar-input');

        var avatarUrlInput = document.getElementById('edit-avatar-url');

        displayNameInput.value = p.displayName || '';
        bioInput.value = p.bio || '';

        // Hiển thị tên file khi chọn ảnh
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

            if (file) {
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
            } else if (urlVal) {
                payload.avatar = urlVal;
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
                    av.appendChild(Avatar.render({ size: 120, avatar: payload.avatar, isAdmin: p.isAdmin, trophySrc: p.selectedTrophyAvatar || null }));
                }
                invalidateCache('/auth/me');
            } else {
                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to update') : 'Failed to update', okLabel: 'OK' });
            }
        }
    }

    // --- Trophy Case ---
    async function openTrophyCase() {
        var grid = document.getElementById('trophy-case-grid');
        var empty = document.getElementById('trophy-case-empty');
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:var(--space-32px) 0;">Loading...</div>';
        empty.style.display = 'none';
        document.getElementById('trophyCaseModal').classList.add('show');

        var trophies;
        try {
            trophies = await fetchUserTrophies(effectiveId);
        } catch (e) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:var(--space-32px) 0;">Failed to load trophies.</div>';
            return;
        }
        grid.innerHTML = '';
        if (!trophies || trophies.length === 0) {
            empty.style.display = 'block';
            return;
        }
        for (var i = 0; i < trophies.length; i++) {
            var t = trophies[i];
            (function (trophy) {
                var card = document.createElement('div');
                card.style.cssText = 'border:2px solid var(--border-default);padding:var(--space-16px);display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:border-color 150ms ease-out,background 150ms ease-out;';
                if (trophy.selected) {
                    card.style.borderColor = 'var(--accent)';
                    card.style.background = 'var(--accent-dim)';
                }
                if (trophy.avatar) {
                    var img = document.createElement('img');
                    img.src = trophy.avatar;
                    img.alt = trophy.name || '';
                    img.style.cssText = 'width:64px;height:64px;object-fit:contain;margin-bottom:var(--space-8px);';
                    card.appendChild(img);
                } else {
                    var icon = document.createElement('div');
                    icon.style.cssText = 'font-size:2rem;color:var(--accent);margin-bottom:var(--space-8px);';
                    icon.innerHTML = '<span class="material-symbols-outlined" style="font-size:2rem;">emoji_events</span>';
                    card.appendChild(icon);
                }
                var name = document.createElement('div');
                name.style.cssText = 'font-family:var(--font-mono);font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-primary);word-break:break-word;';
                name.textContent = trophy.name || '';
                card.appendChild(name);
                if (isOwn) {
                    card.addEventListener('click', async function () {
                        var res = await setSelectedTrophy(trophy.id);
                        if (res && !res.error) {
                            window.location.reload();
                        }
                    });
                }
                grid.appendChild(card);
            })(t);
        }
    }

    // --- Badge Collection ---
    async function renderBadgeCollection(userId) {
        var grid = document.getElementById('badge-collection-grid');
        var empty = document.getElementById('badge-collection-empty');
        grid.innerHTML = '';
        var trophies;
        try {
            trophies = await fetchUserTrophies(userId);
        } catch (e) { return; }
        if (!trophies || trophies.length === 0) {
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';
        for (var i = 0; i < trophies.length; i++) {
            var t = trophies[i];
            var card = document.createElement('div');
            card.style.cssText = 'border:2px solid var(--border-default);padding:var(--space-16px);display:flex;flex-direction:column;align-items:center;transition:border-color 150ms ease-out;';
            if (t.selected) {
                card.style.borderColor = 'var(--accent)';
                card.style.background = 'var(--accent-dim)';
            }
            if (t.avatar) {
                var img = document.createElement('img');
                img.src = t.avatar;
                img.alt = t.name || '';
                img.style.cssText = 'width:64px;height:64px;object-fit:contain;margin-bottom:var(--space-8px);';
                card.appendChild(img);
            } else {
                var icon = document.createElement('div');
                icon.style.cssText = 'font-size:2rem;color:var(--accent);margin-bottom:var(--space-8px);';
                icon.innerHTML = '<span class="material-symbols-outlined" style="font-size:2rem;">emoji_events</span>';
                card.appendChild(icon);
            }
            var name = document.createElement('div');
            name.style.cssText = 'font-family:var(--font-mono);font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-primary);margin-bottom:var(--space-4px);word-break:break-word;';
            name.textContent = t.name || '';
            card.appendChild(name);
            if (t.content) {
                var desc = document.createElement('div');
                desc.style.cssText = 'font-size:0.75rem;color:var(--text-muted);margin-bottom:var(--space-4px);';
                desc.textContent = t.content;
                card.appendChild(desc);
            }
            if (t.awardedAt) {
                var date = new Date(t.awardedAt);
                var dateEl = document.createElement('div');
                dateEl.style.cssText = 'font-size:0.6875rem;color:var(--text-secondary);font-family:var(--font-mono);';
                dateEl.textContent = date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
                card.appendChild(dateEl);
            }
            grid.appendChild(card);
        }
    }

    // --- Bảng Puzzle đã giải ---
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

    // --- Badge Collection ---
    renderBadgeCollection(effectiveId);

    function css(key) { return getComputedStyle(document.documentElement).getPropertyValue(key).trim(); }
    function csstext(key) { return getComputedStyle(document.documentElement).getPropertyValue('--text-' + key).trim(); }
    function accentRgb(a) {
        var h = css('--accent');
        return 'rgba(' + parseInt(h.slice(1,3),16) + ',' + parseInt(h.slice(3,5),16) + ',' + parseInt(h.slice(5,7),16) + ',' + a + ')';
    }

    // ── Biểu đồ phân bố ngôn ngữ (Chart.js) ──
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
            type: 'doughnut',
            data: {
                labels: langs,
                datasets: [{
                    data: langs.map(function(l) { return langCounts[l]; }),
                    backgroundColor: ['#f7df1e', '#3776ab', '#777bb3'],
                    borderColor: 'transparent',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '55%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: css('--text-secondary'), font: { family: 'JetBrains Mono', size: 11 }, padding: 16 }
                    }
                }
            }
        });
    });

    // ── Biểu đồ hoạt động ──
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

            var totalSolves = 0;
            for (var i = 0; i < values.length; i++) totalSolves += values[i];
            var now = new Date();
            var todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
            var todaySolves = dayCounts[todayKey] || 0;
            var weekSolves = 0;
            for (var i = 0; i < 7; i++) {
                var d = new Date(now);
                d.setDate(d.getDate() - i);
                var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                weekSolves += dayCounts[k] || 0;
            }
            var monthSolves = 0;
            for (var i = 0; i < 30; i++) {
                var d = new Date(now);
                d.setDate(d.getDate() - i);
                var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                monthSolves += dayCounts[k] || 0;
            }
            document.getElementById('stat-solved-today').textContent = todaySolves;
            document.getElementById('stat-solved-week').textContent = weekSolves;
            document.getElementById('stat-solved-month').textContent = monthSolves;
            document.getElementById('stat-solved-all').textContent = totalSolves;

            if (profileActivityChart) {
                profileActivityChart.data.labels = labels;
                profileActivityChart.data.datasets[0].data = values;
                profileActivityChart.update();
            } else {
                var ctx2 = document.getElementById('profile-activity-chart').getContext('2d');
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
                            pointHoverRadius: 6,
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
                        },
                        interaction: { intersect: false, mode: 'index' }
                    }
                });
            }
        }

        initActivityChart(7);
        document.querySelector('#profile-activity-chart').parentElement.querySelectorAll('.chart-filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelector('#profile-activity-chart').parentElement.querySelectorAll('.chart-filter-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var filter = btn.getAttribute('data-filter');
                var days = filter === 'today' ? 7 : filter === 'week' ? 7 : filter === 'month' ? 30 : 100;
                initActivityChart(days);
        });
    });
});
});

});
