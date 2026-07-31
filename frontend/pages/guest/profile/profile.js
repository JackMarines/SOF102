// Guest profile orchestrator — read-only profile view matching user page layout
window.addEventListener('deps-ready', function () {
(async function () {
    if (typeof getMe === 'function') {
        try { await getMe(); } catch (e) {}
    }

    var params = new URLSearchParams(window.location.search);
    var targetId = params.get('id');

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
            groupBanner.href = '/frontend/pages/guest/team/index.html?id=' + p.teamId;
            groupBanner.style.cursor = 'pointer';
        }
        groupBanner.style.display = 'block';
    } else {
        groupHeading.textContent = 'No Group';
    }
    if (groupMembers && p.groupMembers) {
        groupMembers.textContent = p.groupMembers;
    }

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
        emptyMessage: 'No puzzles solved yet.',
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

    // --- Badge Collection ---
    renderBadgeCollection(effectiveId);

    // --- Charts ---
    initCharts(effectiveId);

    function css(key) { return getComputedStyle(document.documentElement).getPropertyValue(key).trim(); }
    function csstext(key) { return getComputedStyle(document.documentElement).getPropertyValue('--text-' + key).trim(); }
    function accentRgb(a) {
        var h = css('--accent');
        return 'rgba(' + parseInt(h.slice(1,3),16) + ',' + parseInt(h.slice(3,5),16) + ',' + parseInt(h.slice(5,7),16) + ',' + a + ')';
    }

    function initCharts(userId) {
        // Language chart
        fetchCompletedPuzzles(userId, '', '', '', 1, 100).then(function(res) {
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

        // Activity chart
        apiGet('/profile/activity?id=' + userId).then(function(res) {
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
                    labels.push(days === 1 ? '24H' : date.getMonth() + 1 + '/' + date.getDate());
                    values.push(dayCounts[key] || 0);
                }
                var single = labels.length === 1;

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

                var ctx2 = document.getElementById('profile-activity-chart').getContext('2d');
                var dataset = {
                    label: 'Puzzles Solved',
                    data: values,
                    borderColor: css('--accent'),
                    backgroundColor: accentRgb(0.08),
                    borderWidth: 2,
                    pointRadius: single ? 5 : 0,
                    pointHoverRadius: single ? 5 : 6,
                    tension: 0.3,
                    fill: true
                };
                if (profileActivityChart) {
                    profileActivityChart.data.labels = labels;
                    profileActivityChart.data.datasets[0].data = values;
                    profileActivityChart.data.datasets[0].pointRadius = single ? 5 : 0;
                    profileActivityChart.data.datasets[0].pointHoverRadius = single ? 5 : 6;
                    profileActivityChart.update();
                } else {
                    profileActivityChart = new Chart(ctx2, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [dataset]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            animation: { duration: 600, easing: 'easeOutQuart' },
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

            initActivityChart(1);
            document.querySelector('#profile-activity-chart').parentElement.querySelectorAll('.chart-filter-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    document.querySelector('#profile-activity-chart').parentElement.querySelectorAll('.chart-filter-btn').forEach(function(b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    var filter = btn.getAttribute('data-filter');
                var days = filter === 'today' ? 1 : filter === 'week' ? 7 : filter === 'month' ? 30 : 100;
                initActivityChart(days);
                });
            });
        });
    }

    // --- Badge Collection ---
    var BADGES_PER_PAGE = 5;
    var badgePage = 1;
    var allTrophies = [];

    function renderBadgeCard(t) {
        var card = document.createElement('div');
        card.style.cssText = 'border:2px solid var(--border-default);padding:var(--space-16px);display:flex;flex-direction:column;align-items:center;min-width:0;max-width:100%;';
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
            desc.style.cssText = 'font-size:0.75rem;color:var(--text-muted);margin-bottom:var(--space-4px);word-break:break-word;overflow-wrap:break-word;';
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
        return card;
    }

    function renderBadgePagination() {
        var pag = document.getElementById('badge-collection-pagination');
        if (!pag) return;
        pag.innerHTML = '';
        var totalPages = Math.max(1, Math.ceil(allTrophies.length / BADGES_PER_PAGE));
        if (totalPages <= 1) return;
        var current = badgePage;

        function addBtn(text, disabled, onClick) {
            var a = document.createElement('a');
            a.className = 'cg-page';
            a.textContent = text;
            if (disabled) {
                a.style.opacity = '0.4';
                a.style.pointerEvents = 'none';
            }
            a.addEventListener('click', onClick);
            pag.appendChild(a);
        }

        addBtn('First', current <= 1, function () { badgePage = 1; renderBadgePage(); });
        addBtn('Prev', current <= 1, function () { badgePage = current - 1; renderBadgePage(); });

        var start = Math.max(1, current - 1);
        var end = Math.min(totalPages, current + 1);
        if (end - start < 2) {
            if (start === 1) end = Math.min(3, totalPages);
            else start = Math.max(1, totalPages - 2);
        }
        for (var i = start; i <= end; i++) {
            (function (pageNum) {
                var a = document.createElement('a');
                a.className = 'cg-page';
                if (pageNum === current) a.classList.add('cg-active');
                a.textContent = pageNum;
                a.addEventListener('click', function () { badgePage = pageNum; renderBadgePage(); });
                pag.appendChild(a);
            })(i);
        }

        addBtn('Next', current >= totalPages, function () { badgePage = current + 1; renderBadgePage(); });
        addBtn('Last', current >= totalPages, function () { badgePage = totalPages; renderBadgePage(); });
    }

    function renderBadgePage() {
        var grid = document.getElementById('badge-collection-grid');
        grid.innerHTML = '';
        var start = (badgePage - 1) * BADGES_PER_PAGE;
        var pageTrophies = allTrophies.slice(start, start + BADGES_PER_PAGE);
        for (var i = 0; i < pageTrophies.length; i++) {
            grid.appendChild(renderBadgeCard(pageTrophies[i]));
        }
        renderBadgePagination();
    }

    async function renderBadgeCollection(userId) {
        var grid = document.getElementById('badge-collection-grid');
        var empty = document.getElementById('badge-collection-empty');
        grid.innerHTML = '';
        badgePage = 1;
        try {
            allTrophies = await fetchUserTrophies(userId);
        } catch (e) { return; }
        if (!allTrophies || allTrophies.length === 0) {
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';
        renderBadgePage();
    }

  })();
});
