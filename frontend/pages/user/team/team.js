checkAuth().then(async function (session) {
    var params = new URLSearchParams(window.location.search);
    var teamId = params.get('id');
    if (!teamId) return;

    var team = await fetchTeamDetail(teamId);
    if (!team || team.error) return;

    document.title = (team.name || 'Team') + ' - DevClimb';

    // --- Banner ---
    var banner = document.getElementById('team-banner');
    if (team.avatar) {
        banner.src = team.avatar;
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
        ownerEl.appendChild(Avatar.render({ size: 32, avatar: owner.avatar }));
        var ownerName = document.createElement('span');
        ownerName.textContent = owner.displayName || 'Unknown';
        ownerEl.appendChild(ownerName);
        var ownerLink = document.createElement('a');
        ownerLink.href = '/frontend/pages/user/profile/index.html?id=' + owner.userId;
        ownerLink.style.color = 'inherit';
        ownerLink.appendChild(ownerEl);
        document.getElementById('team-owner-wrapper').appendChild(ownerLink);
    }

    // --- Join / Leave Button ---
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

    function showConfirmPopup(icon, title, message, okLabel, okClass, onConfirm) {
        var overlay = document.getElementById('confirm-popup-overlay');
        document.getElementById('confirm-popup-icon').innerHTML = icon;
        document.getElementById('confirm-popup-title').textContent = title;
        document.getElementById('confirm-popup-message').textContent = message;
        var okBtn = document.getElementById('confirm-popup-ok');
        var cancelBtn = document.getElementById('confirm-popup-cancel');

        if (okLabel) {
            okBtn.textContent = okLabel;
            okBtn.className = 'custom-btn ' + okClass;
            okBtn.style.display = '';
            cancelBtn.textContent = 'Cancel';
        } else {
            okBtn.style.display = 'none';
            cancelBtn.textContent = 'Close';
        }

        overlay.classList.add('show');

        function close() {
            overlay.classList.remove('show');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', close);
            okBtn.style.display = '';
            cancelBtn.textContent = 'Cancel';
        }
        function handleOk() {
            close();
            if (onConfirm) onConfirm();
        }
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });
    }

    function showErrorPopup(title, message) {
        showConfirmPopup(
            '<i class="bi bi-exclamation-triangle-fill"></i>',
            title,
            message,
            null,
            '',
            null
        );
    }

    // --- Edit Team Popup ---
    function openEditPopup() {
        var overlay = document.getElementById('edit-popup-overlay');
        var nameInput = document.getElementById('edit-team-name');
        var avatarInput = document.getElementById('edit-avatar-input');
        var avatarPreview = document.getElementById('edit-avatar-preview');
        var uploadContent = document.getElementById('edit-upload-content');
        var cards = overlay.querySelectorAll('.visibility-card');

        nameInput.value = team.name || '';
        avatarPreview.style.display = 'none';
        uploadContent.style.display = '';

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

        avatarInput.onchange = function () {
            var file = this.files[0];
            if (!file) return;
            avatarPreview.src = URL.createObjectURL(file);
            avatarPreview.style.display = 'block';
            uploadContent.style.display = 'none';
        };

        overlay.classList.add('show');

        document.getElementById('edit-popup-close').onclick = closeEditPopup;
        document.getElementById('edit-popup-cancel').onclick = closeEditPopup;
        overlay.onclick = function (e) { if (e.target === overlay) closeEditPopup(); };
    }

    function closeEditPopup() {
        document.getElementById('edit-popup-overlay').classList.remove('show');
    }

    document.getElementById('edit-popup-save').addEventListener('click', async function () {
        var btn = this;
        var name = document.getElementById('edit-team-name').value.trim();
        if (!name) {
            alert('Team name is required');
            return;
        }

        var activeCard = document.querySelector('#edit-popup-overlay .visibility-card.active');
        var isPublic = activeCard ? activeCard.getAttribute('data-type') === 'public' : true;

        btn.disabled = true;
        btn.textContent = 'Saving...';

        var res = await updateTeam({ name: name, isPublic: isPublic });

        btn.disabled = false;
        btn.textContent = 'Save Changes';

        if (res && !res.error) {
            window.location.reload();
        } else {
            alert(res ? (res.error || 'Failed to update') : 'Failed to update');
        }
    });

    // --- Transfer Ownership Popup ---
    var transferMembersData = [];
    var transferPagedData = [];

    function openTransferPopup() {
        var overlay = document.getElementById('transfer-popup-overlay');
        overlay.classList.add('show');

        document.getElementById('transfer-popup-close').onclick = closeTransferPopup;
        document.getElementById('transfer-popup-cancel').onclick = closeTransferPopup;
        overlay.onclick = function (e) { if (e.target === overlay) closeTransferPopup(); };

        transferMembersData = (team.members || []).filter(function (m) {
            return String(m.userId) !== String(team.ownerId);
        });

        window.transferTable = UserTable.init('transfer-member-table', {
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

        var grid = document.getElementById('ut-grid-transfer-member-table');
        if (grid) {
            grid.addEventListener('click', function (e) {
                var card = e.target.closest('.ut-card');
                if (!card) return;
                e.preventDefault();
                var idx = Array.prototype.indexOf.call(grid.querySelectorAll('.ut-card'), card);
                if (idx < 0 || idx >= transferPagedData.length) return;
                var member = transferPagedData[idx];
                showConfirmPopup(
                    '<i class="bi bi-arrow-left-right"></i>',
                    'Transfer Ownership',
                    'Transfer ownership to ' + (member.displayName || 'this member') + '? You will become a regular member.',
                    'Transfer',
                    '',
                    async function () {
                        var res = await transferOwnership(member.userId);
                        if (res && !res.error) {
                            window.location.reload();
                        } else {
                            alert(res ? (res.error || 'Failed to transfer') : 'Failed to transfer');
                        }
                    }
                );
            });
        }
    }

    function closeTransferPopup() {
        document.getElementById('transfer-popup-overlay').classList.remove('show');
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

    if (isOwner) {
        // --- Owner Buttons ---
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
            showConfirmPopup(
                '<i class="bi bi-box-arrow-right"></i>',
                'Leave Team',
                'Are you sure you want to leave ' + (team.name || 'this team') + '?',
                'Leave',
                'btn-danger',
                async function () {
                    leaveBtn.disabled = true;
                    leaveBtn.textContent = 'Leaving...';
                    var res = await leaveTeam();
                    if (res && !res.error) {
                        window.location.href = '/frontend/pages/user/home/index.html';
                    } else {
                        leaveBtn.disabled = false;
                        leaveBtn.textContent = 'Leave Team';
                        alert(res ? (res.error || 'Failed to leave') : 'Failed to leave');
                    }
                }
            );
        });
        joinWrapper.appendChild(leaveBtn);
    } else if (!isMember && team.isPublic) {
        var joinBtn = document.createElement('button');
        joinBtn.className = 'custom-btn';
        joinBtn.textContent = 'Join Team';
        joinBtn.addEventListener('click', function () {
            showConfirmPopup(
                '<i class="bi bi-person-plus-fill"></i>',
                'Join Team',
                'Do you want to join ' + (team.name || 'this team') + '?',
                'Join',
                '',
                async function () {
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
                            showErrorPopup(
                                'Leave Current Team First',
                                'You are already a member of another team. You must leave your current team before joining a new one.'
                            );
                        } else {
                            alert(err || 'Failed to join');
                        }
                    }
                }
            );
        });
        joinWrapper.appendChild(joinBtn);
    }

    // --- Shoutout ---
    document.getElementById('team-shoutout').textContent = team.shoutout || '';

    // --- Shoutout Edit (owner only) ---
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
            alert(res ? (res.error || 'Failed to update') : 'Failed to update');
        }
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
            row.className = 'd-flex align-items-center mb-3 text-decoration-none';
            row.href = '/frontend/pages/user/profile/index.html?id=' + m.userId;
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
            row.appendChild(Avatar.render({ size: 40, avatar: m.avatar }));

            var info = document.createElement('div');
            info.className = 'flex-grow-1 ms-3';
            var nameDiv = document.createElement('div');
            nameDiv.className = 'fw-bold';
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
                    showConfirmPopup(
                        '<i class="bi bi-arrow-left-right"></i>',
                        'Transfer Ownership',
                        'Transfer ownership to ' + (member.displayName || 'this member') + '? You will become a regular member.',
                        'Transfer',
                        '',
                        async function () {
                            var res = await transferOwnership(member.userId);
                            if (res && !res.error) {
                                window.location.reload();
                            } else {
                                alert(res ? (res.error || 'Failed to transfer') : 'Failed to transfer');
                            }
                        }
                    );
                }
            },
            {
                label: 'Kick',
                icon: 'bi-person-x',
                danger: true,
                onClick: function (member) {
                    showConfirmPopup(
                        '<i class="bi bi-person-x-fill"></i>',
                        'Kick Member',
                        'Are you sure you want to kick ' + (member.displayName || 'this member') + ' from the team?',
                        'Kick',
                        'btn-danger',
                        async function () {
                            var res = await kickMember(member.userId);
                            if (res && !res.error) {
                                window.location.reload();
                            } else {
                                alert(res ? (res.error || 'Failed to kick') : 'Failed to kick');
                            }
                        }
                    );
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

        var pageSize = 12;
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
