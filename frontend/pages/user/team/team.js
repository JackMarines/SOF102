// Trang chi tiết nhóm — xem thông tin nhóm, chỉnh sửa, rời/nhập nhóm, kiểm soát chủ nhóm (chỉnh sửa, chuyển nhượng, đá thành viên), và bảng thành viên
window.addEventListener('deps-ready', function () {
getMe().then(async function (session) {
    var params = new URLSearchParams(window.location.search);
    var teamId = params.get('id');
    if (!teamId) return;

    showSkeleton('team-name', 'team-info');
    showSkeleton('member-table', 'member-rows');
    showSkeleton('top-contributors', 'contributor-rows');

    var team = await fetchTeamDetail(teamId);
    if (!team || team.error) return;

    document.title = (team.name || 'Team') + ' - DevClimb';

    // ── Banner ──
    var banner = document.getElementById('team-banner');
    if (team.avatar) {
        banner.style.backgroundImage = 'url(' + team.avatar + ')';
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
    }

    // ── Tên nhóm + badge ──
    document.getElementById('team-name').textContent = team.name || '';
    var badge = document.getElementById('team-visibility-badge');
    badge.textContent = team.isPublic ? 'Public' : 'Private';
    badge.className = 'badge ms-2 ' + (team.isPublic ? 'bg-success' : 'bg-secondary');

    // ── Chủ nhóm ──
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
        ownerEl.appendChild(Avatar.render({ size: 32, avatar: owner.avatar, trophySrc: owner.selectedTrophyAvatar || null }));
        var ownerName = document.createElement('span');
        ownerName.textContent = owner.displayName || 'Unknown';
        ownerEl.appendChild(ownerName);
        var ownerLink = document.createElement('a');
        ownerLink.href = '/frontend/pages/user/profile/index.html?id=' + owner.userId;
        ownerLink.appendChild(ownerEl);
        document.getElementById('team-owner-wrapper').appendChild(ownerLink);
    }

    // ── Quyền user ──
    var isOwner = false;
    var isMember = false;
    if (team.members) {
        for (var i = 0; i < team.members.length; i++) {
            if (String(team.members[i].userId) === String(session.userId)) {
                isMember = true;
                isOwner = String(team.members[i].userId) === String(team.ownerId);
                break;
            }
        }
    }

    var joinWrapper = document.getElementById('join-btn-wrapper');

    // ── Popup chỉnh sửa nhóm ──

    function openEditPopup() {
        Popup.open({
            id: 'edit-popup',
            title: 'Edit Team',
            size: 'md',
            render: function (ctx) {
                // Avatar Upload
                var avatarSection = document.createElement('div');
                avatarSection.style.marginBottom = 'var(--space-24px)';
                avatarSection.innerHTML =
                    '<label style="font-size:0.75rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:var(--space-4px);">Team Avatar</label>' +
                    '<input type="file" id="edit-avatar-input" accept="image/*" hidden>' +
                    '<label for="edit-avatar-input" class="upload-area" style="display:block;cursor:pointer;">' +
                        '<img id="edit-avatar-preview" class="upload-preview">' +
                        '<div id="edit-upload-content">' +
                            '<div class="upload-icon"><span class="material-symbols-outlined" style="font-size:2.5rem;">cloud_upload</span></div>' +
                            '<div class="upload-text">Click to upload image</div>' +
                            '<div style="font-size:0.6875rem;color:var(--text-faint);margin-top:var(--space-4px);">PNG, JPG, WEBP</div>' +
                        '</div>' +
                    '</label>';
                ctx.body.appendChild(avatarSection);

                // Team Name
                var nameSection = document.createElement('div');
                nameSection.style.marginBottom = 'var(--space-24px)';
                nameSection.innerHTML =
                    '<label for="edit-team-name" style="font-size:0.75rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:var(--space-4px);">Team Name</label>' +
                    '<input type="text" id="edit-team-name" placeholder="Enter your team name" style="width:100%;">' +
                    '<div id="edit-team-name-error" style="font-size:0.75rem;color:var(--error);margin-top:var(--space-4px);display:none;"></div>';
                ctx.body.appendChild(nameSection);

                // Visibility
                var visSection = document.createElement('div');
                visSection.style.marginBottom = 'var(--space-24px)';
                visSection.innerHTML =
                    '<label style="font-size:0.75rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:var(--space-12px);">Team Visibility</label>' +
                    '<div class="visibility-toggle-grid">' +
                        '<div class="visibility-card" data-type="public">' +
                            '<div class="vis-icon"><span class="material-symbols-outlined" style="font-size:1.5rem;color:var(--text-muted);">public</span></div>' +
                            '<div class="vis-label">Public</div>' +
                            '<div style="font-size:0.6875rem;color:var(--text-faint);margin-top:var(--space-4px);">Anyone can discover and join</div>' +
                        '</div>' +
                        '<div class="visibility-card" data-type="private">' +
                            '<div class="vis-icon"><span class="material-symbols-outlined" style="font-size:1.5rem;color:var(--text-muted);">lock</span></div>' +
                            '<div class="vis-label">Private</div>' +
                            '<div style="font-size:0.6875rem;color:var(--text-faint);margin-top:var(--space-4px);">No one can join</div>' +
                        '</div>' +
                    '</div>';
                ctx.body.appendChild(visSection);

                // Buttons
                var btnRow = document.createElement('div');
                btnRow.style.cssText = 'display:flex;gap:var(--space-12px);justify-content:flex-end;';
                var cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn-devclimb secondary sm';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.addEventListener('click', function () { ctx.close(); });
                var saveBtn = document.createElement('button');
                saveBtn.className = 'btn-devclimb primary sm';
                saveBtn.textContent = 'Save Changes';
                saveBtn.addEventListener('click', async function () {
                    var btn = this;
                    if (btn.disabled) return;
                    var name = document.getElementById('edit-team-name').value.trim();
                    var nameError = document.getElementById('edit-team-name-error');
                    nameError.style.display = 'none';
                    if (!name) {
                        nameError.textContent = 'Team name is required';
                        nameError.style.display = 'block';
                        return;
                    }
                    var activeCard = ctx.body.querySelector('.visibility-card.active');
                    var isPublic = activeCard ? activeCard.getAttribute('data-type') === 'public' : true;
                    btn.disabled = true;
                    btn.textContent = 'Saving...';
                    var payload = { name: name, isPublic: isPublic };
                    var avatarInput = document.getElementById('edit-avatar-input');
                    var file = avatarInput.files[0];
                    if (file) {
                        btn.textContent = 'Uploading...';
                        var uploadRes = await apiUpload('/upload/team-avatar', file, { teamId: teamId });
                        if (uploadRes && uploadRes.url) {
                            payload.avatar = uploadRes.url;
                        } else {
                            btn.disabled = false;
                            btn.textContent = 'Save Changes';
                            nameError.textContent = uploadRes ? (uploadRes.error || 'Avatar upload failed') : 'Avatar upload failed';
                            nameError.style.display = 'block';
                            return;
                        }
                    }
                    var res = await updateTeam(payload);
                    btn.disabled = false;
                    btn.textContent = 'Save Changes';
                    if (res && !res.error) {
                        window.location.reload();
                    } else {
                        var err = res ? res.error || 'Failed to update' : 'Failed to update';
                        if (err.toLowerCase().indexOf('duplicate') !== -1 || err.toLowerCase().indexOf('already exist') !== -1) {
                            nameError.textContent = 'A team with this name already exists';
                        } else {
                            nameError.textContent = err;
                        }
                        nameError.style.display = 'block';
                    }
                });
                btnRow.appendChild(cancelBtn);
                btnRow.appendChild(saveBtn);
                ctx.body.appendChild(btnRow);

                // Disband
                ctx.body.appendChild(document.createElement('hr'));
                var disbandBtn = document.createElement('button');
                disbandBtn.className = 'btn-devclimb danger';
                disbandBtn.style.width = '100%';
                disbandBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">delete</span> Disband Team';
                disbandBtn.addEventListener('click', function () {
                    ctx.close();
                    Popup.confirm({
                        icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">warning</span>',
                        title: 'Disband Team',
                        message: 'Are you sure you want to disband ' + (team.name || 'this team') + '? This will remove all members and cannot be undone.',
                        okLabel: 'Disband',
                        okClass: 'btn-devclimb danger',
                        onConfirm: async function () {
                                var dbBtn = document.querySelector('.btn-devclimb.danger.confirm-disband');
                                if (dbBtn && dbBtn.disabled) return;
                                if (dbBtn) dbBtn.disabled = true;
                                var res = await disbandTeam();
                                if (res && !res.error) {
                                    window.location.href = '/frontend/pages/user/home/index.html';
                                } else {
                                    if (dbBtn) dbBtn.disabled = false;
                                    Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to disband') : 'Failed to disband', okLabel: 'OK' });
                                }
                            }
                    });
                });
                ctx.body.appendChild(disbandBtn);

                // ── Wire avatar preview ──
                var avatarInput = document.getElementById('edit-avatar-input');
                var avatarPreview = document.getElementById('edit-avatar-preview');
                var uploadContent = document.getElementById('edit-upload-content');
                avatarInput.onchange = function () {
                    var file = this.files[0];
                    if (!file) return;
                    avatarPreview.src = URL.createObjectURL(file);
                    avatarPreview.style.display = 'block';
                    uploadContent.style.display = 'none';
                };

                // ── Wire visibility cards ──
                var cards = ctx.body.querySelectorAll('.visibility-card');
                cards.forEach(function (c) { c.classList.remove('active'); });
                var target = team.isPublic ? 'public' : 'private';
                cards.forEach(function (c) {
                    if (c.getAttribute('data-type') === target) c.classList.add('active');
                });
                cards.forEach(function (card) {
                    card.onclick = function () {
                        cards.forEach(function (c) { c.classList.remove('active'); });
                        card.classList.add('active');
                    };
                });

                // ── Set initial values ──
                document.getElementById('edit-team-name').value = team.name || '';
                avatarPreview.style.display = 'none';
                uploadContent.style.display = '';
            }
        });
    }

    // ── Popup chuyển nhượng quyền chủ nhóm ──
    var transferMembersData = [];
    var transferPagedData = [];

    function openTransferPopup() {
        transferMembersData = (team.members || []).filter(function (m) {
            return String(m.userId) !== String(team.ownerId);
        });

        Popup.open({
            id: 'transfer-popup',
            title: 'Transfer Ownership',
            size: 'lg',
            render: function (ctx) {
                var desc = document.createElement('p');
                desc.className = 'text-secondary mb-4';
                desc.textContent = 'Select a member to transfer ownership to. You will become a regular member.';
                ctx.body.appendChild(desc);

                var tableDiv = document.createElement('div');
                tableDiv.id = 'transfer-member-table';
                ctx.body.appendChild(tableDiv);

                window.transferTable = CardTable.init('transfer-member-table', {
                    columns: [
                        { key: 'user', label: 'Member' },
                        { key: 'puzzles', label: 'Puzzles' },
                        { key: 'score', label: 'Score' }
                    ],
                    urlTemplate: null,
                    searchPlaceholder: 'Search members...',
                    onSearch: function () { loadTransferMembers(1); },
                    onPageChange: function (page) { loadTransferMembers(page); }
                });

                loadTransferMembers(1);

                // Wire card click for transfer
                var grid = document.getElementById('cg-grid-transfer-member-table');
                if (grid) {
                    grid.addEventListener('click', function (e) {
                        var card = e.target.closest('.cg-card');
                        if (!card) return;
                        e.preventDefault();
                        var idx = Array.prototype.indexOf.call(grid.querySelectorAll('.cg-card'), card);
                        if (idx < 0 || idx >= transferPagedData.length) return;
                        var member = transferPagedData[idx];
                        Popup.confirm({
                            icon: '<i class="bi bi-arrow-left-right"></i>',
                            title: 'Transfer Ownership',
                            message: 'Transfer ownership to ' + (member.displayName || 'this member') + '? You will become a regular member.',
                            okLabel: 'Transfer',
                            onConfirm: async function () {
                                var res = await transferOwnership(member.userId);
                                if (res && !res.error) {
                                    window.location.reload();
                                } else {
                                    Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to transfer') : 'Failed to transfer', okLabel: 'OK' });
                                }
                            }
                        });
                    });
                }
            }
        });
    }

    window.loadTransferMembers = function (page) {
        var tbl = window.transferTable;
        var searchTerm = tbl ? tbl.getSearchTerm() : '';
        var filtered = transferMembersData;

        if (searchTerm) {
            var lower = searchTerm.toLowerCase();
            filtered = filtered.filter(function (m) {
                return (m.displayName || '').toLowerCase().indexOf(lower) !== -1;
            });
        }

        var pageSize = 8;
        var p = page || 1;
        var start = (p - 1) * pageSize;
        transferPagedData = filtered.slice(start, start + pageSize);

        var fakeResponse = {
            data: transferPagedData,
            pagination: {
                page: p,
                totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
                total: filtered.length,
                limit: pageSize
            }
        };

        if (tbl) tbl.setData(fakeResponse);
    };

    // ── Render nút theo quyền ──
    if (isOwner) {
        var editBtn = document.createElement('button');
        editBtn.className = 'custom-btn btn-secondary';
        editBtn.innerHTML = '<i class="bi bi-pencil-square me-1"></i> Edit Team';
        editBtn.addEventListener('click', openEditPopup);
        joinWrapper.appendChild(editBtn);

        var transferBtn = document.createElement('button');
        transferBtn.className = 'custom-btn btn-secondary';
        transferBtn.innerHTML = '<i class="bi bi-arrow-left-right me-1"></i> Transfer Ownership';
        transferBtn.addEventListener('click', openTransferPopup);
        joinWrapper.appendChild(transferBtn);

    } else if (isMember && !isOwner) {
        var leaveBtn = document.createElement('button');
        leaveBtn.className = 'custom-btn btn-danger';
        leaveBtn.textContent = 'Leave Team';
        leaveBtn.addEventListener('click', function () {
            Popup.confirm({
                icon: '<i class="bi bi-box-arrow-right"></i>',
                title: 'Leave Team',
                message: 'Are you sure you want to leave ' + (team.name || 'this team') + '?',
                okLabel: 'Leave',
                okClass: 'btn-danger',
                onConfirm: async function () {
                    if (leaveBtn.disabled) return;
                    leaveBtn.disabled = true;
                    leaveBtn.textContent = 'Leaving...';
                    var res = await leaveTeam();
                    if (res && !res.error) {
                        window.location.href = '/frontend/pages/user/home/index.html';
                    } else {
                        leaveBtn.disabled = false;
                        leaveBtn.textContent = 'Leave Team';
                        Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to leave') : 'Failed to leave', okLabel: 'OK' });
                    }
                }
            });
        });
        joinWrapper.appendChild(leaveBtn);
    } else if (!isMember && team.isPublic) {
        var joinBtn = document.createElement('button');
        joinBtn.className = 'custom-btn';
        joinBtn.textContent = 'Join Team';
        joinBtn.addEventListener('click', function () {
            Popup.confirm({
                icon: '<i class="bi bi-person-plus-fill"></i>',
                title: 'Join Team',
                message: 'Do you want to join ' + (team.name || 'this team') + '?',
                okLabel: 'Join',
                onConfirm: async function () {
                    if (joinBtn.disabled) return;
                    joinBtn.disabled = true;
                    joinBtn.textContent = 'Joining...';
                    var res = await joinTeam(teamId);
                    if (res && !res.error) {
                        window.location.reload();
                    } else {
                        joinBtn.disabled = false;
                        joinBtn.textContent = 'Join Team';
                        var err = res ? res.error || '' : '';
                        if (err.indexOf('Already in a team') !== -1) {
                            Popup.confirm({
                                icon: '<i class="bi bi-exclamation-triangle-fill"></i>',
                                title: 'Leave Current Team First',
                                message: 'You are already a member of another team. You must leave your current team before joining a new one.'
                            });
                        } else {
                            Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: err || 'Failed to join', okLabel: 'OK' });
                        }
                    }
                }
            });
        });
        joinWrapper.appendChild(joinBtn);
    }

    // ── Shoutout ──
    document.getElementById('team-shoutout').textContent = team.shoutout || '';

    if (isOwner) {
        document.getElementById('shoutout-edit-btn').classList.remove('d-none');
    }

    document.getElementById('shoutout-edit-btn').addEventListener('click', function () {
        document.getElementById('team-shoutout').style.display = 'none';
        document.getElementById('shoutout-edit').classList.remove('d-none');
        document.getElementById('shoutout-input').value = team.shoutout || '';
        document.getElementById('shoutout-input').focus();
    });

    document.getElementById('shoutout-cancel').addEventListener('click', function () {
        document.getElementById('shoutout-edit').classList.add('d-none');
        document.getElementById('team-shoutout').style.display = '';
        document.getElementById('team-shoutout').textContent = team.shoutout || '';
    });

    document.getElementById('shoutout-save').addEventListener('click', async function () {
        var btn = this;
        var newShoutout = document.getElementById('shoutout-input').value.trim();

        btn.disabled = true;
        btn.textContent = 'Saving...';

        var res = await updateShoutout(newShoutout);

        btn.disabled = false;
        btn.textContent = 'Save';

        if (res && !res.error) {
            team.shoutout = newShoutout;
            document.getElementById('team-shoutout').textContent = newShoutout;
            document.getElementById('shoutout-edit').classList.add('d-none');
            document.getElementById('team-shoutout').style.display = '';
        } else {
            Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to update') : 'Failed to update', okLabel: 'OK' });
        }
    });

    // ── Ma trận hiệu suất ──
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

    // ── Group Solved Chart ──
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

    // ── Top Contributors ──
    var topEl = document.getElementById('top-contributors');
    topEl.innerHTML = '';
    if (team.topMembers && team.topMembers.length > 0) {
        var rankColors = {
            1: { border: '#FFD700', bg: 'rgba(255,215,0,0.06)', text: '#FFD700' },
            2: { border: '#C0C0C0', bg: 'rgba(192,192,192,0.06)', text: '#C0C0C0' },
            3: { border: '#CD7F32', bg: 'rgba(205,127,50,0.06)', text: '#CD7F32' }
        };
        for (var k = 0; k < team.topMembers.length; k++) {
            if (k === 3) {
                var sep = document.createElement('div');
                sep.style.cssText = 'border-top:1px solid var(--border-default);margin:var(--space-12px) 0;width:100%;';
                topEl.appendChild(sep);
            }
            var m = team.topMembers[k];
            var rc = rankColors[m.rank] || { border: 'var(--border-default)', bg: 'transparent', text: 'var(--text-muted)' };

            var row = document.createElement('a');
            row.className = 'd-flex align-items-center text-decoration-none';
            row.style.cssText = 'color:inherit;border:1px solid ' + rc.border + ';background:' + rc.bg + ';padding:var(--space-12px);margin-bottom:var(--space-8px);transition:opacity 150ms ease-out;';
            row.href = '/frontend/pages/user/profile/index.html?id=' + m.userId;

            var rankEl = document.createElement('span');
            rankEl.style.cssText = 'min-width:32px;font-family:var(--font-mono);font-size:1rem;font-weight:700;color:' + rc.text + ';margin-right:var(--space-8px);text-align:center;';
            rankEl.textContent = '#' + (k + 1);
            row.appendChild(rankEl);

            var avatarWrap = document.createElement('span');
            avatarWrap.style.cssText = 'border-radius:50%;border:2px solid ' + rc.border + ';display:inline-flex;margin-right:var(--space-12px);flex-shrink:0;overflow:hidden;';
            avatarWrap.appendChild(Avatar.render({ size: 40, avatar: m.avatar, trophySrc: m.selectedTrophyAvatar || null }));
            row.appendChild(avatarWrap);

            var info = document.createElement('div');
            info.style.cssText = 'flex:1;min-width:0;';
            var nameDiv = document.createElement('div');
            nameDiv.style.cssText = 'font-family:var(--font-mono);font-size:0.875rem;font-weight:700;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            nameDiv.textContent = m.displayName || '';
            var scoreSmall = document.createElement('small');
            scoreSmall.style.cssText = 'font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);';
            scoreSmall.textContent = (m.totalScore || 0).toLocaleString() + ' pts';
            info.appendChild(nameDiv);
            info.appendChild(scoreSmall);
            row.appendChild(info);

            topEl.appendChild(row);
        }
    }

    // ── Bảng thành viên (UserTable) ──
    var memberTableOpts = {
        columns: [
            { key: 'user', label: 'Member' },
            { key: 'puzzles', label: 'Puzzles' },
            { key: 'score', label: 'Score' }
        ],
        urlTemplate: '/frontend/pages/user/profile/index.html?id=',
        onSearch: function () { loadMembers(1); },
        onPageChange: function (page) { loadMembers(page); }
    };

    if (isOwner) {
        memberTableOpts.cardMenuFilter = function (member) {
            return String(member.userId) !== String(team.ownerId);
        };
        memberTableOpts.cardMenu = [
            {
                label: 'Transfer Ownership',
                icon: 'bi-arrow-left-right',
                onClick: function (member) {
                    Popup.confirm({
                        icon: '<i class="bi bi-arrow-left-right"></i>',
                        title: 'Transfer Ownership',
                        message: 'Transfer ownership to ' + (member.displayName || 'this member') + '? You will become a regular member.',
                        okLabel: 'Transfer',
                        onConfirm: async function () {
                            var res = await transferOwnership(member.userId);
                            if (res && !res.error) {
                                window.location.reload();
                            } else {
                                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to transfer') : 'Failed to transfer', okLabel: 'OK' });
                            }
                        }
                    });
                }
            },
            {
                label: 'Kick',
                icon: 'bi-person-x',
                danger: true,
                onClick: function (member) {
                    Popup.confirm({
                        icon: '<i class="bi bi-person-x-fill"></i>',
                        title: 'Kick Member',
                        message: 'Are you sure you want to kick ' + (member.displayName || 'this member') + ' from the team?',
                        okLabel: 'Kick',
                        okClass: 'btn-danger',
                        onConfirm: async function () {
                            var res = await kickMember(member.userId);
                            if (res && !res.error) {
                                window.location.reload();
                            } else {
                                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to kick') : 'Failed to kick', okLabel: 'OK' });
                            }
                        }
                    });
                }
            }
        ];
    }

    window.memberTable = UserTable.init('member-table', memberTableOpts);

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

    // Style top 3 member cards with rank colors
    setTimeout(function() {
        var memberGrid = document.querySelector('#member-table .cg-grid');
        if (!memberGrid) return;
        var cards = memberGrid.querySelectorAll('.cg-card-wrap');
        var rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
        for (var r = 0; r < Math.min(3, cards.length); r++) {
            cards[r].style.border = '2px solid ' + rankColors[r];
            cards[r].style.background = r === 0 ? 'rgba(255,215,0,0.06)' : r === 1 ? 'rgba(192,192,192,0.06)' : 'rgba(205,127,50,0.06)';
        }
    }, 100);
});
});
