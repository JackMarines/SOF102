// Guest team detail — read-only team view with clickable members, top contributors, and owner link
window.addEventListener('deps-ready', async function () {
    var params = new URLSearchParams(window.location.search);
    var teamId = params.get('id');
    if (!teamId) return;

    showSkeleton('team-name', 'team-info');
    showSkeleton('member-table', 'member-rows');
    showSkeleton('top-contributors', 'contributor-rows');
    var team = await fetchTeamDetail(teamId);
    if (!team || team.error) return;

    document.title = (team.name || 'Team') + ' - DevClimb';

    // --- Banner ---
    var banner = document.getElementById('team-banner');
    if (team.avatar) {
        banner.style.backgroundImage = 'url(' + team.avatar + ')';
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
    }

    // --- Team Name + Badge ---
    document.getElementById('team-name').textContent = team.name || '';
    var badge = document.getElementById('team-visibility-badge');
    badge.textContent = team.isPublic ? 'Public' : 'Private';
    badge.className = 'badge ms-2 ' + (team.isPublic ? 'bg-success' : 'bg-secondary');

    // --- Owner ---
    var owner = null;
    if (team.members) {
        for (var i = 0; i < team.members.length; i++) {
            if (String(team.members[i].userId) === String(team.ownerId)) {
                owner = team.members[i];
                break;
            }
        }
    }
    var ownerEl = document.getElementById('team-owner');
    if (owner) {
        ownerEl.href = '/frontend/pages/guest/profile/index.html?id=' + owner.userId;
        ownerEl.appendChild(Avatar.render({ size: 32, avatar: owner.avatar, trophySrc: owner.selectedTrophyAvatar || null }));
        var ownerName = document.createElement('span');
        ownerName.textContent = owner.displayName || 'Unknown';
        ownerEl.appendChild(ownerName);
        document.getElementById('team-owner-wrapper').appendChild(ownerEl);
    }

    // --- Join Button (redirect to login) ---
    if (team.isPublic) {
        var joinWrapper = document.getElementById('join-btn-wrapper');
        var joinBtn = document.createElement('a');
        joinBtn.className = 'custom-btn';
        joinBtn.textContent = 'Join Team';
        joinBtn.href = '/frontend/pages/guest/auth/login.html';
        joinWrapper.appendChild(joinBtn);
    }

    // --- Shoutout ---
    document.getElementById('team-shoutout').textContent = team.shoutout || '';

    // --- Group Solved Chart ---
    var teamChart = null;
    var teamDayCounts = {};

    function css(key) { return getComputedStyle(document.documentElement).getPropertyValue(key).trim(); }
    function csstext(key) { return getComputedStyle(document.documentElement).getPropertyValue('--text-' + key).trim(); }
    function accentRgb(a) {
        var h = css('--accent');
        return 'rgba(' + parseInt(h.slice(1,3),16) + ',' + parseInt(h.slice(3,5),16) + ',' + parseInt(h.slice(5,7),16) + ',' + a + ')';
    }

    function initTeamChart(days) {
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
            values.push(teamDayCounts[key] || 0);
        }
        var single = labels.length === 1;
        var ctx = document.getElementById('team-solved-chart').getContext('2d');
        var dataset = {
            label: 'Puzzles Solved',
            data: values,
            borderColor: css('--accent'),
            backgroundColor: accentRgb(0.08),
            borderWidth: 2,
            pointRadius: single ? 5 : 0,
            pointHoverRadius: single ? 5 : 4,
            tension: 0.3,
            fill: true
        };
        if (teamChart) {
            teamChart.data.labels = labels;
            teamChart.data.datasets[0].data = values;
            teamChart.data.datasets[0].pointRadius = single ? 5 : 0;
            teamChart.data.datasets[0].pointHoverRadius = single ? 5 : 4;
            teamChart.update();
        } else {
            teamChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [dataset]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: { duration: 600, easing: 'easeOutQuart' },
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: csstext('muted'), font: { size: 9 } } },
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: csstext('muted'), font: { size: 9 } } }
                    }
                }
            });
        }
    }

    function loadTeamChart(days) {
        fetchTeamStats(teamId).then(function(stats) {
            if (stats && stats.data) {
                teamDayCounts = {};
                for (var i = 0; i < stats.data.length; i++) {
                    teamDayCounts[stats.data[i].date] = stats.data[i].solves;
                }
            }
            initTeamChart(days);
        }).catch(function() {});
    }

    loadTeamChart(1);

    var teamChartPanel = document.querySelector('.content-panel .chart-filter-btn');
    var teamFilterBtns = teamChartPanel ? document.querySelectorAll('.content-panel .chart-filter-btn') : document.querySelectorAll('.chart-filter-btn');
    teamFilterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            teamFilterBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var filter = btn.getAttribute('data-filter');
            var days = filter === 'today' ? 1 : filter === 'week' ? 7 : filter === 'month' ? 30 : 90;
            initTeamChart(days);
        });
    });

    // --- Performance Matrix ---
    document.getElementById('perf-throughput-bar').style.width = (team.throughput || 0) + '%';
    document.getElementById('perf-throughput-text').textContent = (team.throughput || 0) + '%';
    document.getElementById('perf-total-solved').textContent = (team.totalSolved || 0).toLocaleString();

    var totalScore = 0;
    if (team.members) {
        for (var j = 0; j < team.members.length; j++) {
            totalScore += team.members[j].totalScore || 0;
        }
    }
    document.getElementById('perf-total-score').textContent = totalScore.toLocaleString();

    // --- Top Contributors ---
    var topEl = document.getElementById('top-contributors');
    topEl.innerHTML = '';
    if (team.topMembers && team.topMembers.length > 0) {
        for (var k = 0; k < team.topMembers.length; k++) {
            var m = team.topMembers[k];
            var row = document.createElement('a');
            row.href = '/frontend/pages/guest/profile/index.html?id=' + m.userId;
            row.className = 'd-flex align-items-center mb-3 text-decoration-none';
            row.style.color = 'inherit';

            var rankBadge = document.createElement('span');
            rankBadge.className = 'me-3 fw-bold';
            rankBadge.style.minWidth = '24px';
            rankBadge.textContent = '#' + m.rank;
            if (m.rank === 1) {
                rankBadge.style.color = '#FFD700';
            } else if (m.rank === 2) {
                rankBadge.style.color = '#C0C0C0';
            } else if (m.rank === 3) {
                rankBadge.style.color = '#CD7F32';
            } else {
                rankBadge.className += ' text-secondary';
            }

            row.appendChild(rankBadge);
            row.appendChild(Avatar.render({ size: 40, avatar: m.avatar, trophySrc: m.selectedTrophyAvatar || null }));

            var info = document.createElement('div');
            info.className = 'flex-grow-1 ms-3';
            var nameDiv = document.createElement('div');
            nameDiv.className = 'fw-bold';
            nameDiv.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;';
            nameDiv.textContent = m.displayName || '';
            var scoreSmall = document.createElement('small');
            scoreSmall.className = 'text-secondary';
            scoreSmall.textContent = (m.totalScore || 0).toLocaleString() + ' pts';
            info.appendChild(nameDiv);
            info.appendChild(scoreSmall);
            row.appendChild(info);

            topEl.appendChild(row);
        }
    }

    // --- Members Table (UserTable) ---
    window.memberTable = UserTable.init('member-table', {
        columns: [
            { key: 'user', label: 'Member' },
            { key: 'puzzles', label: 'Puzzles' },
            { key: 'score', label: 'Score' }
        ],
        urlTemplate: '/frontend/pages/guest/profile/index.html?id=',
        onSearch: function () { loadMembers(1); },
        onPageChange: function (page) { loadMembers(page); }
    });

    window.loadMembers = async function (page) {
        var tbl = window.memberTable;
        var searchTerm = tbl ? tbl.getSearchTerm() : '';
        var allMembers = team.members || [];

        if (searchTerm) {
            var lower = searchTerm.toLowerCase();
            allMembers = allMembers.filter(function (m) {
                return (m.displayName || '').toLowerCase().indexOf(lower) !== -1;
            });
        }

        var pageSize = 18;
        var p = page || 1;
        var start = (p - 1) * pageSize;
        var paged = allMembers.slice(start, start + pageSize);

        var fakeResponse = {
            data: paged,
            pagination: {
                page: p,
                totalPages: Math.max(1, Math.ceil(allMembers.length / pageSize)),
                total: allMembers.length,
                limit: pageSize
            }
        };

        if (tbl) tbl.setData(fakeResponse);
    };

    loadMembers(1);
});
