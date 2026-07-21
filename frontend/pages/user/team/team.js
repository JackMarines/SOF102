// Trang chi tiết nhóm — xem thông tin nhóm, chỉnh sửa, rời/nhập nhóm, kiểm soát chủ nhóm (chỉnh sửa, chuyển nhượng, đá thành viên), và bảng thành viên
getMe().then(async function (session) {
    var params = new URLSearchParams(window.location.search);
    var teamId = params.get('id');
    if (!teamId) return;

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
                avatarSection.className = 'mb-4';
                avatarSection.innerHTML =
                    '<label class="form-label fw-semibold">Team Avatar</label>' +
                    '<input type="file" id="edit-avatar-input" accept="image/*" hidden>' +
                    '<label for="edit-avatar-input" class="upload-box w-100">' +
                        '<img id="edit-avatar-preview" class="preview-avatar mb-3">' +
                        '<div id="edit-upload-content">' +
                            '<i class="bi bi-cloud-arrow-up"></i>' +
                            '<h6 class="mt-3">Click or drag image here</h6>' +
                            '<small class="text-secondary">PNG, JPG, WEBP supported</small>' +
                        '</div>' +
                    '</label>';
                ctx.body.appendChild(avatarSection);

                // Team Name
                var nameSection = document.createElement('div');
                nameSection.className = 'mb-4';
                nameSection.innerHTML =
                    '<label class="form-label fw-semibold">Team Name</label>' +
                    '<input type="text" id="edit-team-name" class="form-control" placeholder="Enter your team name">' +
                    '<div id="edit-team-name-error" class="text-danger small mt-1 d-none"></div>';
                ctx.body.appendChild(nameSection);

                // Visibility
                var visSection = document.createElement('div');
                visSection.className = 'mb-4';
                visSection.innerHTML =
                    '<label class="form-label fw-semibold d-block mb-3">Team Visibility</label>' +
                    '<div class="row g-3">' +
                        '<div class="col-md-6">' +
                            '<div class="visibility-card" data-type="public">' +
                                '<div class="fw-bold"><i class="bi bi-globe me-2"></i>Public</div>' +
                                '<small class="text-secondary">Anyone can discover and join.</small>' +
                            '</div>' +
                        '</div>' +
                        '<div class="col-md-6">' +
                            '<div class="visibility-card" data-type="private">' +
                                '<div class="fw-bold"><i class="bi bi-lock-fill me-2"></i>Private</div>' +
                                '<small class="text-secondary">No one can join.</small>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                ctx.body.appendChild(visSection);

                // Buttons
                var btnRow = document.createElement('div');
                btnRow.className = 'd-flex justify-content-end gap-2';
                var cancelBtn = document.createElement('button');
                cancelBtn.className = 'custom-btn btn-secondary';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.addEventListener('click', function () { ctx.close(); });
                var saveBtn = document.createElement('button');
                saveBtn.className = 'custom-btn';
                saveBtn.textContent = 'Save Changes';
                saveBtn.addEventListener('click', async function () {
                    var btn = this;
                    var name = document.getElementById('edit-team-name').value.trim();
                    var nameError = document.getElementById('edit-team-name-error');
                    nameError.classList.add('d-none');

                    if (!name) {
                        nameError.textContent = 'Team name is required';
                        nameError.classList.remove('d-none');
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
                            var errMsg = uploadRes ? (uploadRes.error || 'Avatar upload failed') : 'Avatar upload failed';
                            nameError.textContent = errMsg;
                            nameError.classList.remove('d-none');
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
                        nameError.classList.remove('d-none');
                    }
                });
                btnRow.appendChild(cancelBtn);
                btnRow.appendChild(saveBtn);
                ctx.body.appendChild(btnRow);

                // Disband
                ctx.body.appendChild(document.createElement('hr'));
                var disbandBtn = document.createElement('button');
                disbandBtn.className = 'custom-btn btn-danger w-100';
                disbandBtn.innerHTML = '<i class="bi bi-trash-fill me-1"></i> Disband Team';
                disbandBtn.addEventListener('click', function () {
                    ctx.close();
                    Popup.confirm({
                        icon: '<i class="bi bi-exclamation-triangle-fill"></i>',
                        title: 'Disband Team',
                        message: 'Are you sure you want to disband ' + (team.name || 'this team') + '? This will remove all members and cannot be undone.',
                        okLabel: 'Disband',
                        okClass: 'btn-danger',
                        onConfirm: async function () {
                            var res = await disbandTeam();
                            if (res && !res.error) {
                                window.location.href = '/frontend/pages/user/home/index.html';
                            } else {
                                alert(res ? (res.error || 'Failed to disband') : 'Failed to disband');
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
                                    alert(res ? (res.error || 'Failed to transfer') : 'Failed to transfer');
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
                            alert(err || 'Failed to join');
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
            alert(res ? (res.error || 'Failed to update') : 'Failed to update');
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

    // ── Top Contributors ──
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
            info.style.minWidth = '0';
            var nameDiv = document.createElement('div');
            nameDiv.className = 'fw-bold';
            nameDiv.style.overflow = 'hidden';
            nameDiv.style.textOverflow = 'ellipsis';
            nameDiv.style.whiteSpace = 'nowrap';
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
                                alert(res ? (res.error || 'Failed to transfer') : 'Failed to transfer');
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
                                alert(res ? (res.error || 'Failed to kick') : 'Failed to kick');
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
