// Trang chi tiết nhóm — xem thông tin nhóm, chỉnh sửa, rời/nhập nhóm, kiểm soát chủ nhóm (chỉnh sửa, chuyển nhượng, đá thành viên), và bảng thành viên
getMe().then(async function (session) {
    // Lấy teamId từ URL query string
    var params = new URLSearchParams(window.location.search);
    var teamId = params.get('id');
    if (!teamId) return;

    // Fetch chi tiết nhóm từ backend
    var team = await fetchTeamDetail(teamId);
    if (!team || team.error) return;

    // Cập nhật tiêu đề trang
    document.title = (team.name || 'Team') + ' - DevClimb';

    // ── Banner ảnh nhóm ──
    var banner = document.getElementById('team-banner');
    if (team.avatar) {
        banner.style.backgroundImage = 'url(' + team.avatar + ')';
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
    }

    // ── Tên nhóm + badge công khai/riêng tư ──
    document.getElementById('team-name').textContent = team.name || '';
    var badge = document.getElementById('team-visibility-badge');
    badge.textContent = team.isPublic ? 'Public' : 'Private';
    badge.className = 'badge ms-2 ' + (team.isPublic ? 'bg-success' : 'bg-secondary');

    // ── Tìm chủ nhóm trong danh sách thành viên ──
    var owner = null;
    if (team.members) {
        for (var i = 0; i < team.members.length; i++) {
            if (String(team.members[i].userId) === String(team.ownerId)) {
                owner = team.members[i];
                break;
            }
        }
    }
    // Render thông tin chủ nhóm (avatar + tên + link profile)
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

    // ── Xác định quyền của user hiện tại ──
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

    // ── Popup xác nhận chung ──
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

    // Popup lỗi (chỉ có nút Close)
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

    // ── Popup chỉnh sửa nhóm (chỉ chủ nhóm) ──
    function openEditPopup() {
        var overlay = document.getElementById('edit-popup-overlay');
        var nameInput = document.getElementById('edit-team-name');
        var avatarInput = document.getElementById('edit-avatar-input');
        var avatarPreview = document.getElementById('edit-avatar-preview');
        var uploadContent = document.getElementById('edit-upload-content');
        var cards = overlay.querySelectorAll('.visibility-card');

        // Điền dữ liệu hiện tại vào form
        nameInput.value = team.name || '';
        avatarPreview.style.display = 'none';
        uploadContent.style.display = '';

        // Chọn visibility card active
        cards.forEach(function (c) { c.classList.remove('active'); });
        var target = team.isPublic ? 'public' : 'private';
        cards.forEach(function (c) {
            if (c.getAttribute('data-type') === target) c.classList.add('active');
        });

        // Xử lý click chọn visibility
        cards.forEach(function (card) {
            card.onclick = function () {
                cards.forEach(function (c) { c.classList.remove('active'); });
                card.classList.add('active');
            };
        });

        // Preview avatar khi chọn file
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

    // ── Lưu chỉnh sửa nhóm (hiển thị lỗi trùng tên inline) ──
    document.getElementById('edit-popup-save').addEventListener('click', async function () {
        var btn = this;
        var name = document.getElementById('edit-team-name').value.trim();
        var nameError = document.getElementById('edit-team-name-error');
        nameError.classList.add('d-none');

        if (!name) {
            nameError.textContent = 'Team name is required';
            nameError.classList.remove('d-none');
            return;
        }

        var activeCard = document.querySelector('#edit-popup-overlay .visibility-card.active');
        var isPublic = activeCard ? activeCard.getAttribute('data-type') === 'public' : true;

        btn.disabled = true;
        btn.textContent = 'Saving...';

        var payload = { name: name, isPublic: isPublic };

        // Upload team avatar nếu có chọn file mới
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

    // ── Giải tán nhóm ──
    document.getElementById('edit-popup-disband').addEventListener('click', function () {
        closeEditPopup();
        showConfirmPopup(
            '<i class="bi bi-exclamation-triangle-fill"></i>',
            'Disband Team',
            'Are you sure you want to disband ' + (team.name || 'this team') + '? This will remove all members and cannot be undone.',
            'Disband',
            'btn-danger',
            async function () {
                var res = await disbandTeam();
                if (res && !res.error) {
                    window.location.href = '/frontend/pages/user/home/index.html';
                } else {
                    alert(res ? (res.error || 'Failed to disband') : 'Failed to disband');
                }
            }
        );
    });

    // ── Popup chuyển nhượng quyền chủ nhóm ──
    var transferMembersData = [];
    var transferPagedData = [];

    function openTransferPopup() {
        var overlay = document.getElementById('transfer-popup-overlay');
        overlay.classList.add('show');

        document.getElementById('transfer-popup-close').onclick = closeTransferPopup;
        document.getElementById('transfer-popup-cancel').onclick = closeTransferPopup;
        overlay.onclick = function (e) { if (e.target === overlay) closeTransferPopup(); };

        // Lọc bỏ chủ nhóm khỏi danh sách ứng viên
        transferMembersData = (team.members || []).filter(function (m) {
            return String(m.userId) !== String(team.ownerId);
        });

        // Khởi tạo CardTable cho danh sách chuyển nhượng
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

        // Xử lý click chọn thành viên để chuyển nhượng
        var grid = document.getElementById('cg-grid-transfer-member-table');
        if (grid) {
            grid.addEventListener('click', function (e) {
                var card = e.target.closest('.cg-card');
                if (!card) return;
                e.preventDefault();
                var idx = Array.prototype.indexOf.call(grid.querySelectorAll('.cg-card'), card);
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

    // Fetch + phân trang danh sách thành viên cho popup chuyển nhượng
    window.loadTransferMembers = function (page) {
        var tbl = window.transferTable;
        var searchTerm = tbl ? tbl.getSearchTerm() : '';
        var filtered = transferMembersData;

        // Lọc client-side theo tìm kiếm
        if (searchTerm) {
            var lower = searchTerm.toLowerCase();
            filtered = filtered.filter(function (m) {
                return (m.displayName || '').toLowerCase().indexOf(lower) !== -1;
            });
        }

        // Phân trang thủ công
        var pageSize = 8;
        var p = page || 1;
        var start = (p - 1) * pageSize;
        transferPagedData = filtered.slice(start, start + pageSize);

        // Tạo response giả để setData cho CardTable
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
        // Chủ nhóm: nút Edit + Transfer Ownership
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
        // Thành viên thường: nút Leave Team
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
        // Chưa là thành viên + nhóm công khai: nút Join Team
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

    // ── Shoutout ──
    document.getElementById('team-shoutout').textContent = team.shoutout || '';

    // ── Chỉnh sửa shoutout (chỉ chủ nhóm) ──
    if (isOwner) {
        document.getElementById('shoutout-edit-btn').classList.remove('d-none');
    }

    // Bật chế độ chỉnh sửa shoutout
    document.getElementById('shoutout-edit-btn').addEventListener('click', function () {
        document.getElementById('team-shoutout').style.display = 'none';
        document.getElementById('shoutout-edit').classList.remove('d-none');
        document.getElementById('shoutout-input').value = team.shoutout || '';
        document.getElementById('shoutout-input').focus();
    });

    // Hủy chỉnh sửa shoutout
    document.getElementById('shoutout-cancel').addEventListener('click', function () {
        document.getElementById('shoutout-edit').classList.add('d-none');
        document.getElementById('team-shoutout').style.display = '';
        document.getElementById('team-shoutout').textContent = team.shoutout || '';
    });

    // Lưu shoutout mới
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

    // Tính tổng điểm của tất cả thành viên
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
            // Mỗi hàng top contributor là link tới profile
            var row = document.createElement('a');
            row.className = 'd-flex align-items-center mb-3 text-decoration-none';
            row.href = '/frontend/pages/user/profile/index.html?id=' + m.userId;
            row.style.color = 'inherit';

            // Badge thứ hạng (vàng/bạc/đồng)
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

            // Container thông tin (tên + điểm) — cần min-width:0 cho text ellipsis
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

    // Nếu là chủ nhóm → thêm menu ngữ cảnh (chuyển nhượng + đá thành viên)
    if (isOwner) {
        // Không hiển thị menu cho chính chủ nhóm
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

    // Khởi tạo UserTable cho danh sách thành viên
    window.memberTable = UserTable.init('member-table', memberTableOpts);

    // Fetch + phân trang danh sách thành viên (client-side)
    window.loadMembers = async function (page) {
        var tbl = window.memberTable;
        var searchTerm = tbl ? tbl.getSearchTerm() : '';
        var allMembers = team.members || [];

        // Lọc theo tìm kiếm
        if (searchTerm) {
            var lower = searchTerm.toLowerCase();
            allMembers = allMembers.filter(function (m) {
                return (m.displayName || '').toLowerCase().indexOf(lower) !== -1;
            });
        }

        // Phân trang thủ công
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
