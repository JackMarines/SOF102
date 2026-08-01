// Admin Dashboard page orchestrator — quản lý maintenance mode, thống kê, biểu đồ, quản lý người dùng (cảnh báo/cấm/kích hoạt lại)
// Gọi initDashboard() từ inline script trong index.html

// ── Trạng thái ──

var maintenanceEnabled = false;       // Trạng thái hiện tại của maintenance mode
var maintenanceCountdownInterval = null; // Timer đếm ngược popup
var resetCountdownInterval = null; // Timer đếm ngược reset progress
var dashboardData = null;              // Dữ liệu dashboard cache (để chuyển đổi biểu đồ)
var solvedChart = null;                // Chart.js instance
var manageUsersTable = null;           // CardTable instance
var manageTeamsTable = null;           // CardTable instance (Manage Teams popup)
var managePuzzlesTable = null;         // PuzzleTable instance (Manage Puzzles popup)
var editPuzzleDeletedTcIds = [];       // IDs testcase bị xóa khi edit
var warnTargetUser = null;             // User đang bị chọn để cảnh báo
var warnTargetTeam = null;             // Team đang bị chọn để cảnh báo
var addPuzzleNewId = null;             // ID puzzle vừa tạo, dùng khi thêm testcase
var appealTable = null;                // PuzzleTable instance (Appeals popup)

function css(key) { return getComputedStyle(document.documentElement).getPropertyValue(key).trim(); }
function csstext(key) { return getComputedStyle(document.documentElement).getPropertyValue('--text-' + key).trim(); }
function accentRgb(a) {
    var h = css('--accent');
    return 'rgba(' + parseInt(h.slice(1,3),16) + ',' + parseInt(h.slice(3,5),16) + ',' + parseInt(h.slice(5,7),16) + ',' + a + ')';
}

// ── Maintenance Mode ──

function updateMaintenanceButton() {
    var btn = document.getElementById('btn-maintenance');
    if (!btn) return;
    if (maintenanceEnabled) {
        btn.classList.add('btn-danger');
        btn.classList.remove('btn-secondary');
        btn.innerHTML = '<i class="bi bi-tools me-2"></i>Maintenance: ON';
    } else {
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-secondary');
        btn.innerHTML = '<i class="bi bi-tools me-2"></i>Maintenance: OFF';
    }
}

// ── Popup Maintenance (đếm ngược 5 giây) ──

function openMaintenancePopup() {
    var actionText = maintenanceEnabled ? 'DISABLE' : 'ENABLE';

    Popup.open({
        id: 'maintenance-popup',
        title: null,
        size: 'sm',
        onClose: function () {
            if (maintenanceCountdownInterval) {
                clearInterval(maintenanceCountdownInterval);
                maintenanceCountdownInterval = null;
            }
        },
        render: function (ctx) {
            // Icon
            var iconEl = document.createElement('div');
            iconEl.className = 'popup-icon';
            iconEl.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
            ctx.body.appendChild(iconEl);

            // Title
            var titleEl = document.createElement('h5');
            titleEl.className = 'mb-2';
            titleEl.style.color = 'var(--text-primary)';
            titleEl.textContent = actionText + ' Maintenance Mode?';
            ctx.body.appendChild(titleEl);

            // Description
            var descEl = document.createElement('p');
            descEl.className = 'text-secondary mb-3';
            descEl.style.fontSize = '14px';
            descEl.textContent = 'All users will be locked out of the platform until you disable it.';
            ctx.body.appendChild(descEl);

            // Countdown
            var countdownEl = document.createElement('p');
            countdownEl.className = 'mb-3';
            countdownEl.style.cssText = 'font-size:28px;font-weight:700;color:var(--accent);text-align:center;';
            countdownEl.textContent = '5';
            ctx.body.appendChild(countdownEl);

            // Buttons
            var confirmBtn = document.createElement('button');
            confirmBtn.className = 'custom-btn btn-danger';
            confirmBtn.style.minWidth = '120px';
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Confirm';
            confirmBtn.addEventListener('click', function () {
                if (confirmBtn.disabled) return;
                confirmBtn.disabled = true;
                var newEnabled = !maintenanceEnabled;
                toggleMaintenance(newEnabled).then(function () {
                    maintenanceEnabled = newEnabled;
                    updateMaintenanceButton();
                    ctx.close();
                });
            });
            ctx.footer.appendChild(confirmBtn);

            var cancelBtn = document.createElement('button');
            cancelBtn.className = 'custom-btn btn-secondary';
            cancelBtn.style.minWidth = '120px';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', function () { ctx.close(); });
            ctx.footer.appendChild(cancelBtn);

            // Đếm ngược
            var count = 5;
            maintenanceCountdownInterval = setInterval(function () {
                count--;
                if (count <= 0) {
                    clearInterval(maintenanceCountdownInterval);
                    maintenanceCountdownInterval = null;
                    countdownEl.textContent = '0';
                    confirmBtn.disabled = false;
                } else {
                    countdownEl.textContent = count;
                }
            }, 1000);
        }
    });
}

// ── Popup Quản lý Người dùng ──

function openManageUsersPopup() {
    Popup.open({
        id: 'manage-users-popup',
        title: 'Manage Users',
        size: 'lg',
        scroll: true,
        render: function (ctx) {
            var tableDiv = document.createElement('div');
            tableDiv.id = 'manage-users-table';
            ctx.body.appendChild(tableDiv);

            manageUsersTable = CardTable.init('manage-users-table', {
                urlTemplate: '/frontend/pages/user/profile/index.html?id=',
                columns: [
                    { key: 'user', label: 'User' },
                    { key: 'email', label: 'Email' },
                    { key: 'team', label: 'Team' },
                    { key: 'admin', label: 'Role' }
                ],
                searchPlaceholder: 'Search users...',
                filters: [
                    {
                        options: [
                            { label: 'Active', value: 'active' },
                            { label: 'All', value: 'all' },
                            { label: 'Banned', value: 'banned' }
                        ]
                    }
                ],
                cardMenuFilter: function (user) {
                    return !user.userIsadmin;
                },
                cardMenu: [
                    {
                        label: 'Warn User',
                        icon: 'exclamation-triangle',
                        onClick: function (user) { openWarnPopup(user); }
                    },
                    {
                        label: 'Ban User',
                        icon: 'person-x',
                        danger: true,
                        onClick: function (user) { openBanConfirm(user); }
                    },
                    {
                        label: 'Reactivate',
                        icon: 'arrow-counterclockwise',
                        danger: false,
                        visible: function (user) {
                            return user.userIsactive === false || user.userIsactive === 0;
                        },
                        onClick: function (user) { openReactivateConfirm(user); }
                    }
                ],
                onSearch: function () { loadManageUsers(1); },
                onPageChange: function (page) { loadManageUsers(page); },
                onFilterChange: function () { loadManageUsers(1); }
            });

            loadManageUsers(1);
        }
    });
}

async function loadManageUsers(page) {
    var tbl = manageUsersTable;
    var searchTerm = tbl ? tbl.getSearchTerm() : '';
    var filterVal = tbl ? tbl.getFilterValue() : 'active';

    var res = await fetchManageUsers(page, searchTerm, filterVal);
    if (!res || res.error) return;

    manageUsersTable.setData(res);
}

// ── Popup Cảnh báo Người dùng ──

function openWarnPopup(user) {
    warnTargetUser = user;

    Popup.open({
        id: 'warn-popup',
        title: null,
        size: 'sm',
        onClose: function () { warnTargetUser = null; },
        render: function (ctx) {
            // Icon
            var iconEl = document.createElement('div');
            iconEl.className = 'popup-icon';
            iconEl.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
            ctx.body.appendChild(iconEl);

            // Title
            var titleEl = document.createElement('h5');
            titleEl.className = 'mb-3';
            titleEl.style.color = 'var(--text-primary)';
            titleEl.textContent = 'Warn User';
            ctx.body.appendChild(titleEl);

            // Description
            var descEl = document.createElement('p');
            descEl.className = 'text-secondary mb-3';
            descEl.style.fontSize = '14px';
            descEl.innerHTML = 'Issue a warning to <strong></strong>.';
            descEl.querySelector('strong').textContent = user.userName || user.displayName || '';
            ctx.body.appendChild(descEl);

            // Reason
            var reasonGroup = document.createElement('div');
            reasonGroup.className = 'mb-3';
            reasonGroup.innerHTML =
                '<label class="form-label text-secondary" style="font-size:13px;">Reason</label>' +
                '<textarea class="form-control" id="warn-reason" rows="3" placeholder="Enter warning reason..."></textarea>' +
                '<div id="warn-reason-error" class="text-danger mt-1 d-none" style="font-size:13px;"></div>';
            ctx.body.appendChild(reasonGroup);

            // Dates
            var today = new Date();
            var nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            var dateRow = document.createElement('div');
            dateRow.className = 'row g-3 mb-4';
            dateRow.innerHTML =
                '<div class="col-6">' +
                    '<label class="form-label text-secondary" style="font-size:13px;">Start Date</label>' +
                    '<input type="date" id="warn-start-date" class="form-control" value="' + formatDate(today) + '">' +
                '</div>' +
                '<div class="col-6">' +
                    '<label class="form-label text-secondary" style="font-size:13px;">End Date</label>' +
                    '<input type="date" id="warn-end-date" class="form-control" value="' + formatDate(nextWeek) + '">' +
                '</div>';
            ctx.body.appendChild(dateRow);

            // Buttons
            var submitBtn = document.createElement('button');
            submitBtn.className = 'custom-btn btn-danger';
            submitBtn.style.minWidth = '120px';
            submitBtn.textContent = 'Submit Warning';
            submitBtn.addEventListener('click', function () { submitWarning(ctx); });
            ctx.footer.appendChild(submitBtn);

            var cancelBtn = document.createElement('button');
            cancelBtn.className = 'custom-btn btn-secondary';
            cancelBtn.style.minWidth = '120px';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', function () { ctx.close(); });
            ctx.footer.appendChild(cancelBtn);
        }
    });
}

async function submitWarning(ctx) {
    if (!warnTargetUser) return;

    var reason = document.getElementById('warn-reason').value.trim();
    var startDate = document.getElementById('warn-start-date').value;
    var endDate = document.getElementById('warn-end-date').value;
    var errorEl = document.getElementById('warn-reason-error');
    var submitBtn = ctx.footer.querySelector('.btn-danger');

    if (submitBtn.disabled) return;
    submitBtn.disabled = true;

    errorEl.classList.add('d-none');

    if (!reason) {
        submitBtn.disabled = false;
        errorEl.textContent = 'Reason is required';
        errorEl.classList.remove('d-none');
        return;
    }

    if (!startDate || !endDate) {
        submitBtn.disabled = false;
        errorEl.textContent = 'Start and end dates are required';
        errorEl.classList.remove('d-none');
        return;
    }

    submitBtn.textContent = 'Submitting...';

    var res = await sendWarning(warnTargetUser.userId, reason, startDate, endDate);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Warning';

    if (res && !res.error) {
        var userName = warnTargetUser.userName || 'this user';
        ctx.close();
        Popup.confirm({
            icon: '<i class="bi bi-check-circle-fill"></i>',
            title: 'Warning Issued',
            message: 'A warning has been issued to ' + userName + '.'
        });
    } else {
        errorEl.textContent = res ? (res.error || 'Failed to issue warning') : 'Failed to issue warning';
        errorEl.classList.remove('d-none');
    }
}

function formatDate(d) {
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
}

// ── Cấm người dùng ──

function openBanConfirm(user) {
    Popup.confirm({
        icon: '<i class="bi bi-person-x-fill"></i>',
        title: 'Ban User',
        message: 'Are you sure you want to ban ' + (user.userName || 'this user') + '? They will no longer be able to access the platform.',
        okLabel: 'Ban',
        okClass: 'btn-danger',
        onConfirm: async function () {
            if (window._banningInProgress) return;
            window._banningInProgress = true;
            var res = await banUser(user.userId);
            window._banningInProgress = false;
            if (res && !res.error) {
                loadManageUsers(1);
            } else {
                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to ban user') : 'Failed to ban user', okLabel: 'OK' });
            }
        }
    });
}

// ── Kích hoạt lại người dùng ──

function openReactivateConfirm(user) {
    Popup.confirm({
        icon: '<i class="bi bi-arrow-counterclockwise"></i>',
        title: 'Reactivate User',
        message: 'Are you sure you want to reactivate ' + (user.userName || 'this user') + '?',
        okLabel: 'Reactivate',
        onConfirm: async function () {
            if (window._reactivatingInProgress) return;
            window._reactivatingInProgress = true;
            var res = await reactivateUser(user.userId);
            window._reactivatingInProgress = false;
            if (res && !res.error) {
                loadManageUsers(1);
            } else {
                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to reactivate user') : 'Failed to reactivate user', okLabel: 'OK' });
            }
        }
    });
}

// ── Popup Quản lý Nhóm ──

function openManageTeamsPopup() {
    Popup.open({
        id: 'manage-teams-popup',
        title: 'Manage Teams',
        size: 'lg',
        scroll: true,
        render: function (ctx) {
            var tableDiv = document.createElement('div');
            tableDiv.id = 'manage-teams-table';
            ctx.body.appendChild(tableDiv);

            manageTeamsTable = CardTable.init('manage-teams-table', {
                urlTemplate: '/frontend/pages/user/team/index.html?id=',
                columns: [
                    { key: 'team', label: 'Team' },
                    { key: 'members', label: 'Members' },
                    { key: 'solved', label: 'Solved' }
                ],
                searchPlaceholder: 'Search teams...',
                filters: [
                    {
                        options: [
                            { label: 'Active', value: 'active' },
                            { label: 'Banned', value: 'banned' },
                            { label: 'All', value: 'all' }
                        ]
                    }
                ],
                cardMenu: [
                    {
                        label: 'Warn Team',
                        icon: 'exclamation-triangle',
                        danger: true,
                        visible: function (t) { return t.isActive !== false; },
                        onClick: function (t) { openWarnTeamPopup(t); }
                    },
                    {
                        label: 'Ban Team',
                        icon: 'people-fill',
                        danger: true,
                        visible: function (t) { return t.isActive !== false; },
                        onClick: function (t) { openBanTeamConfirm(t); }
                    },
                    {
                        label: 'Reactivate',
                        icon: 'arrow-counterclockwise',
                        danger: false,
                        visible: function (t) { return t.isActive === false; },
                        onClick: function (t) { openReactivateTeamConfirm(t); }
                    }
                ],
                columnRenderers: {
                    team: function (t) {
                        var wrap = document.createElement('div');
                        wrap.style.cssText = 'display:flex;align-items:center;gap:6px;';

                        var info = document.createElement('div');
                        var name = document.createElement('strong');
                        name.textContent = t.name || '';
                        info.appendChild(name);
                        var owner = document.createElement('small');
                        owner.style.cssText = 'display:block;color:var(--text-secondary)';
                        owner.textContent = 'Owner: ' + (t.ownerName || '');
                        info.appendChild(owner);
                        wrap.appendChild(info);
                        return wrap;
                    },
                    members: function (t) { return '<span class="material-symbols-outlined" style="font-size:0.875rem;vertical-align:middle;margin-right:4px;">group</span> ' + (t.memberCount || 0) + ' members'; },
                    solved: function (t) { return '<span class="material-symbols-outlined" style="font-size:0.875rem;vertical-align:middle;margin-right:4px;">check_circle</span> ' + (t.totalSolved || 0) + ' solved'; }
                },
                onSearch: function () { loadManageTeams(1); },
                onPageChange: function (page) { loadManageTeams(page); },
                onFilterChange: function () { loadManageTeams(1); }
            });

            loadManageTeams(1);
        }
    });
}

async function loadManageTeams(page) {
    var tbl = manageTeamsTable;
    var searchTerm = tbl ? tbl.getSearchTerm() : '';
    var filterVal = tbl ? tbl.getFilterValue() : 'active';

    var res = await fetchAdminTeams(page, searchTerm, filterVal);
    if (!res || res.error) return;

    manageTeamsTable.setData(res);
}

// ── Cấm nhóm ──

function openBanTeamConfirm(team) {
    Popup.confirm({
        icon: '<i class="bi bi-people-fill"></i>',
        title: 'Ban Team',
        message: 'Are you sure you want to ban ' + (team.name || 'this team') + '? All members will be removed and the team will be deactivated.',
        okLabel: 'Ban',
        okClass: 'btn-danger',
        onConfirm: async function () {
            var res = await banTeam(team.id);
            if (res && !res.error) {
                loadManageTeams(1);
            } else {
                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to ban team') : 'Failed to ban team', okLabel: 'OK' });
            }
        }
    });
}

// ── Kích hoạt lại nhóm ──

function openReactivateTeamConfirm(team) {
    Popup.confirm({
        icon: '<i class="bi bi-arrow-counterclockwise"></i>',
        title: 'Reactivate Team',
        message: 'Are you sure you want to reactivate ' + (team.name || 'this team') + '?',
        okLabel: 'Reactivate',
        onConfirm: async function () {
            var res = await reactivateTeam(team.id);
            if (res && !res.error) {
                loadManageTeams(1);
            } else {
                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to reactivate team') : 'Failed to reactivate team', okLabel: 'OK' });
            }
        }
    });
}

// ── Cảnh báo nhóm ──

function openWarnTeamPopup(team) {
    warnTargetTeam = team;

    Popup.open({
        id: 'warn-team-popup',
        title: null,
        size: 'sm',
        onClose: function () { warnTargetTeam = null; },
        render: function (ctx) {
            // Icon
            var iconEl = document.createElement('div');
            iconEl.className = 'popup-icon';
            iconEl.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
            ctx.body.appendChild(iconEl);

            // Title
            var titleEl = document.createElement('h5');
            titleEl.className = 'mb-3';
            titleEl.style.color = 'var(--text-primary)';
            titleEl.textContent = 'Warn Team';
            ctx.body.appendChild(titleEl);

            // Description
            var descEl = document.createElement('p');
            descEl.className = 'text-secondary mb-3';
            descEl.style.fontSize = '14px';
            descEl.innerHTML = 'Issue a warning to team <strong></strong>.';
            descEl.querySelector('strong').textContent = team.name || '';
            ctx.body.appendChild(descEl);

            // Reason
            var reasonGroup = document.createElement('div');
            reasonGroup.className = 'mb-3';
            reasonGroup.innerHTML =
                '<label class="form-label text-secondary" style="font-size:13px;">Reason</label>' +
                '<textarea class="form-control" id="warn-team-reason" rows="3" placeholder="Enter warning reason..."></textarea>' +
                '<div id="warn-team-reason-error" class="text-danger mt-1 d-none" style="font-size:13px;"></div>';
            ctx.body.appendChild(reasonGroup);

            // Dates
            var today = new Date();
            var nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            var dateRow = document.createElement('div');
            dateRow.className = 'row g-3 mb-4';
            dateRow.innerHTML =
                '<div class="col-6">' +
                    '<label class="form-label text-secondary" style="font-size:13px;">Start Date</label>' +
                    '<input type="date" id="warn-team-start-date" class="form-control" value="' + formatDate(today) + '">' +
                '</div>' +
                '<div class="col-6">' +
                    '<label class="form-label text-secondary" style="font-size:13px;">End Date</label>' +
                    '<input type="date" id="warn-team-end-date" class="form-control" value="' + formatDate(nextWeek) + '">' +
                '</div>';
            ctx.body.appendChild(dateRow);

            // Buttons
            var submitBtn = document.createElement('button');
            submitBtn.className = 'custom-btn btn-danger';
            submitBtn.style.minWidth = '120px';
            submitBtn.textContent = 'Submit Warning';
            submitBtn.addEventListener('click', function () { submitTeamWarning(ctx); });
            ctx.footer.appendChild(submitBtn);

            var cancelBtn = document.createElement('button');
            cancelBtn.className = 'custom-btn btn-secondary';
            cancelBtn.style.minWidth = '120px';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', function () { ctx.close(); });
            ctx.footer.appendChild(cancelBtn);
        }
    });
}

async function submitTeamWarning(ctx) {
    if (!warnTargetTeam) return;

    var reason = document.getElementById('warn-team-reason').value.trim();
    var startDate = document.getElementById('warn-team-start-date').value;
    var endDate = document.getElementById('warn-team-end-date').value;
    var errorEl = document.getElementById('warn-team-reason-error');
    var submitBtn = ctx.footer.querySelector('.btn-danger');

    if (submitBtn.disabled) return;
    submitBtn.disabled = true;

    errorEl.classList.add('d-none');

    if (!reason) {
        submitBtn.disabled = false;
        errorEl.textContent = 'Reason is required';
        errorEl.classList.remove('d-none');
        return;
    }

    if (!startDate || !endDate) {
        submitBtn.disabled = false;
        errorEl.textContent = 'Start and end dates are required';
        errorEl.classList.remove('d-none');
        return;
    }

    submitBtn.textContent = 'Submitting...';

    var res = await sendTeamWarning(warnTargetTeam.id, reason, startDate, endDate);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Warning';

    if (res && !res.error) {
        var teamName = warnTargetTeam.name || 'this team';
        ctx.close();
        Popup.confirm({
            icon: '<i class="bi bi-check-circle-fill"></i>',
            title: 'Warning Issued',
            message: 'A warning has been issued to team ' + teamName + '. The team owner will be notified on their next page load.'
        });
    } else {
        errorEl.textContent = res ? (res.error || 'Failed to issue warning') : 'Failed to issue warning';
        errorEl.classList.remove('d-none');
    }
}

// ── Appeals ──

function openViewAppealsPopup() {
    Popup.open({
        id: 'view-appeals-popup',
        title: 'Appeals',
        size: 'lg',
        scroll: true,
        render: function (ctx) {
            var div = document.createElement('div');
            div.id = 'appeal-table';
            ctx.body.appendChild(div);

            appealTable = PuzzleTable.init('appeal-table', {
                columns: [
                    { key: 'userName', label: 'User', render: function (v, item) {
                        var wrap = document.createElement('span');
                        wrap.style.cssText = 'display:inline-flex;align-items:center;gap:8px;';
                        wrap.appendChild(Avatar.render({ size: 28, avatar: item.avatar, trophySrc: item.selectedTrophyAvatar || null }));
                        wrap.appendChild(document.createTextNode(v || 'Unknown'));
                        return wrap;
                    } },
                    { key: 'message', label: 'Content', render: function (v) { return '<span style="display:block;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (v || '') + '</span>'; } },
                    { key: 'createdDate', label: 'Date', render: function (v) { return v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''; } }
                ],
                searchPlaceholder: 'Search appeals...',
                filterOptions: ['PENDING', 'APPROVED', 'REJECTED'],
                filterLabel: 'Status',
                urlTemplate: '/admin/appeal?id=',
                onSearch: function () { loadAppeals(1); },
                onFilter: function () { loadAppeals(1); },
                onPageChange: function (p) { loadAppeals(p); }
            });

            loadAppeals(1);

            // Row click — capture links, prevent nav, open detail
            div.addEventListener('click', function (e) {
                var a = e.target.closest('a');
                if (a) { e.preventDefault(); var m = a.href.match(/id=(\d+)/); if (m) openAppealDetailPopup(parseInt(m[1])); }
            });
        }
    });
}

async function loadAppeals(page) {
    var tbl = appealTable;
    var status = tbl ? tbl.getFilter() : 'PENDING';
    var res = await fetchAppeals(page, status);
    if (!res || res.error) return;
    appealTable.setData(res);
}

async function openAppealDetailPopup(appealId) {
    var res = await fetchAppealById(appealId);
    if (!res || res.error) return;

    Popup.open({
        id: 'appeal-detail-popup',
        title: 'Appeal Review',
        size: 'sm',
        render: function (ctx) {
            var d = new Date(res.createdDate);
            var ds = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            var isReviewed = res.reviewerId != null;

            ctx.body.innerHTML =
                '<div class="popup-icon"><span class="material-symbols-outlined" style="font-size:48px;color:var(--accent);">forum</span></div>' +
                '<div style="display:grid;grid-template-columns:auto 1fr;gap:var(--space-8px) var(--space-24px);margin-bottom:var(--space-24px);font-size:0.875rem;">' +
                    '<span class="content-meta" style="font-size:0.75rem;">User ID</span><strong style="color:var(--text-primary);">' + res.applicantId + '</strong>' +
                    '<span class="content-meta" style="font-size:0.75rem;">Date</span><strong style="color:var(--text-primary);">' + ds + '</strong>' +
                    '<span class="content-meta" style="font-size:0.75rem;">Status</span><span class="badge-terminal ' + ({ PENDING: '', APPROVED: 'public', REJECTED: 'private' }[res.status] || '') + '" style="color:' + ({ PENDING: 'var(--warning)', APPROVED: 'var(--success)', REJECTED: 'var(--error)' }[res.status] || 'var(--text-muted)') + ';">' + res.status + '</span>' +
                    (isReviewed ? '<span class="content-meta" style="font-size:0.75rem;">Reviewed by</span><strong style="color:var(--text-primary);">Admin (ID: ' + res.reviewerId + ')</strong>' : '') +
                    (isReviewed ? '<span class="content-meta" style="font-size:0.75rem;">Reviewed at</span><strong style="color:var(--text-primary);">' + new Date(res.reviewDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</strong>' : '') +
                '</div>' +
                '<div class="content-section-heading" style="font-size:0.75rem;margin-bottom:var(--space-8px);">Message</div>' +
                '<div class="content-panel pad-sm" style="font-size:0.875rem;word-break:break-word;">' + (res.message || '') + '</div>';

            if (res.status === 'PENDING') {
                var approve = document.createElement('button');
                approve.className = 'custom-btn btn-success border-0';
                approve.style.cssText = 'min-width:120px;display:inline-flex;align-items:center;gap:var(--space-8px);justify-content:center;';
                approve.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">check</span> APPROVED';
                approve.addEventListener('click', function () {
                    ctx.close();
                    Popup.confirm({
                        icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--accent);">warning</span>',
                        title: 'Approve Appeal?',
                        message: 'Are you sure you want to approve this appeal?',
                        okLabel: 'Approve',
                        okClass: 'btn-success',
                        onConfirm: async function () {
                            if (window._reviewingAppeal) return;
                            window._reviewingAppeal = true;
                            await reviewAppeal(appealId, 'APPROVED');
                            window._reviewingAppeal = false;
                            loadAppeals(appealTable ? appealTable.getCurrentPage() : 1);
                        }
                    });
                });
                ctx.footer.appendChild(approve);

                var reject = document.createElement('button');
                reject.className = 'custom-btn btn-danger border-0';
                reject.style.cssText = 'min-width:120px;display:inline-flex;align-items:center;gap:var(--space-8px);justify-content:center;';
                reject.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">close</span> REJECTED';
                reject.addEventListener('click', function () {
                    ctx.close();
                    Popup.confirm({
                        icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--accent);">warning</span>',
                        title: 'Reject Appeal?',
                        message: 'Are you sure you want to reject this appeal?',
                        okLabel: 'Reject',
                        okClass: 'btn-danger',
                        onConfirm: async function () {
                            if (window._reviewingAppeal) return;
                            window._reviewingAppeal = true;
                            await reviewAppeal(appealId, 'REJECTED');
                            window._reviewingAppeal = false;
                            loadAppeals(appealTable ? appealTable.getCurrentPage() : 1);
                        }
                    });
                });
                ctx.footer.appendChild(reject);
            } else {
                var close = document.createElement('button');
                close.className = 'custom-btn btn-secondary border-0';
                close.style.minWidth = '120px';
                close.textContent = 'Close';
                close.addEventListener('click', function () { ctx.close(); });
                ctx.footer.appendChild(close);
            }
        }
    });
}

// ── Puzzle Form Helper ──
// Single source of truth cho form HTML, reading, validation, và saving

function buildPuzzleFormHtml(p) {
    var x = p.prefix;
    return '<div class="mb-3">' +
        '<label for="' + x + 'puzzle-title" class="form-label fw-semibold">Title <span class="text-danger">*</span></label>' +
        '<input type="text" id="' + x + 'puzzle-title" class="form-control" placeholder="e.g. Two Sum" maxlength="200">' +
        '<div id="' + x + 'puzzle-title-error" class="text-danger small mt-1 d-none"></div>' +
    '</div>' +
    '<div class="mb-3">' +
        '<label for="' + x + 'puzzle-content" class="form-label fw-semibold">Content / Problem Description</label>' +
        '<textarea id="' + x + 'puzzle-content" class="form-control" rows="5" placeholder="Describe the problem..."></textarea>' +
    '</div>' +
    '<div class="row g-3 mb-3">' +
        '<div class="col-md-6">' +
            '<label for="' + x + 'puzzle-function" class="form-label fw-semibold">Function Name</label>' +
            '<input type="text" id="' + x + 'puzzle-function" class="form-control" placeholder="e.g. twoSum">' +
        '</div>' +
        '<div class="col-md-6">' +
            '<label for="' + x + 'puzzle-score" class="form-label fw-semibold">Score</label>' +
            '<input type="number" id="' + x + 'puzzle-score" class="form-control" value="0" min="0">' +
        '</div>' +
    '</div>' +
    '<div class="row g-3 mb-4">' +
        '<div class="col-md-6">' +
            '<label for="' + x + 'puzzle-difficulty" class="form-label fw-semibold">Difficulty</label>' +
            '<select id="' + x + 'puzzle-difficulty" class="form-select">' +
                '<option value="Easy">Easy</option>' +
                '<option value="Medium">Medium</option>' +
                '<option value="Hard">Hard</option>' +
            '</select>' +
        '</div>' +
        '<div class="col-md-6">' +
            '<label for="' + x + 'puzzle-language" class="form-label fw-semibold">Language</label>' +
            '<select id="' + x + 'puzzle-language" class="form-select">' +
                '<option value="">Select language...</option>' +
            '</select>' +
        '</div>' +
    '</div>' +
    '<div class="d-flex justify-content-end gap-2">' +
        '<button id="' + x + 'puzzle-save-btn" class="custom-btn">' + p.btnLabel + '</button>' +
    '</div>';
}

function readPuzzleForm(prefix) {
    return {
        title: document.getElementById(prefix + 'puzzle-title').value.trim(),
        content: document.getElementById(prefix + 'puzzle-content').value.trim() || null,
        functionName: document.getElementById(prefix + 'puzzle-function').value.trim() || null,
        score: parseInt(document.getElementById(prefix + 'puzzle-score').value) || 0,
        difficulty: document.getElementById(prefix + 'puzzle-difficulty').value,
        languageId: parseInt(document.getElementById(prefix + 'puzzle-language').value) || null
    };
}

function validatePuzzleForm(prefix) {
    var errorEl = document.getElementById(prefix + 'puzzle-title-error');
    var title = document.getElementById(prefix + 'puzzle-title').value.trim();
    errorEl.classList.add('d-none');
    if (!title) {
        errorEl.textContent = 'Title is required';
        errorEl.classList.remove('d-none');
        return false;
    }
    return true;
}

function showPuzzleFormError(prefix, msg) {
    var errorEl = document.getElementById(prefix + 'puzzle-title-error');
    errorEl.textContent = msg;
    errorEl.classList.remove('d-none');
}

async function loadLanguagesInto(selectId, selectedId) {
    var select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Select language...</option>';
    var res = await fetchLanguages();
    if (res && res.data) {
        res.data.forEach(function (lang) {
            var opt = document.createElement('option');
            opt.value = lang.id;
            opt.textContent = lang.name;
            select.appendChild(opt);
        });
        if (selectedId) select.value = selectedId;
    }
}

function buildTabShell(puzzleTabId, tcTabId, puzzleContentId, tcContentId) {
    var shell = document.createElement('div');
    shell.className = 'tab-content-wrap';
    shell.innerHTML =
        '<ul class="nav nav-tabs mb-4">' +
            '<li class="nav-item"><button class="nav-link active" id="' + puzzleTabId + '" data-bs-toggle="tab" data-bs-target="#' + puzzleContentId + '" type="button">Puzzle Details</button></li>' +
            '<li class="nav-item"><button class="nav-link" id="' + tcTabId + '" data-bs-toggle="tab" data-bs-target="#' + tcContentId + '" type="button">Testcases</button></li>' +
        '</ul>' +
        '<div class="tab-content" style="overflow-y:auto;min-width:0;">' +
            '<div class="tab-pane fade show active" id="' + puzzleContentId + '"></div>' +
            '<div class="tab-pane fade" id="' + tcContentId + '"></div>' +
        '</div>';
    return shell;
}

async function saveTestcaseRows(puzzleId, listId, deletedIds) {
    var rows = document.getElementById(listId).children;
    var success = 0, fail = 0;
    if (deletedIds) {
        for (var d = 0; d < deletedIds.length; d++) {
            var delRes = await deleteTestcase(deletedIds[d]);
            if (delRes && !delRes.error) success++; else fail++;
        }
    }
    for (var i = 0; i < rows.length; i++) {
        var input = rows[i].querySelector('.tc-input').value;
        var output = rows[i].querySelector('.tc-output').value;
        var tcId = rows[i].getAttribute('data-tc-id');
        var res = tcId
            ? await updateTestcase(parseInt(tcId), { input: input, output: output })
            : await createTestcase({ puzId: puzzleId, input: input, output: output });
        if (res && !res.error) success++; else fail++;
    }
    return { success: success, fail: fail };
}

// ── Popup Quản lý Puzzle ──

function openManagePuzzlesPopup() {
    Popup.open({
        id: 'manage-puzzles-popup',
        title: 'Manage Puzzles',
        size: 'lg',
        scroll: true,
        render: function (ctx) {
            var tableDiv = document.createElement('div');
            tableDiv.id = 'manage-puzzles-table';
            ctx.body.appendChild(tableDiv);

            managePuzzlesTable = PuzzleTable.init('manage-puzzles-table', {
                columns: [
                    { key: 'id', label: '#', width: '60px' },
                    { key: 'title', label: 'Title' },
                    { key: 'language', label: 'Language', width: '120px' },
                    { key: 'difficulty', label: 'Difficulty', width: '100px',
                      render: function (val) { return '<span class="pt-row-' + (val || '').toLowerCase() + '">' + (val || '') + '</span>'; }
                    },
                    { key: 'score', label: 'Score', width: '70px' },
                    { key: 'id', label: '', width: '50px',
                      render: function (val, item) {
                          return '<span class="pt-row-actions" data-id="' + item.id + '" data-title="' + (item.title || '').replace(/"/g, '&quot;') + '">' +
              '<button class="pt-row-menu-btn" type="button"><span class="material-symbols-outlined" style="font-size:1rem;">more_vert</span></button>' +
              '<div class="pt-row-dropdown">' +
                  '<div class="pt-row-dropdown-item" data-action="edit"><span class="material-symbols-outlined" style="font-size:0.875rem;">edit</span> Edit</div>' +
                  '<div class="pt-row-dropdown-item text-danger" data-action="delete"><span class="material-symbols-outlined" style="font-size:0.875rem;">delete</span> Delete</div>' +
                              '</div></span>';
                      }
                    }
                ],
                emptyMessage: 'No puzzles found.',
                searchPlaceholder: 'Search puzzles...',
                filterOptions: ['Easy', 'Medium', 'Hard'],
                filterLabel: 'Difficulty',
                filter2Options: ['Python', 'Javascript', 'PHP'],
                filter2Label: 'Language',
                onSearch: function () { loadManagePuzzles(1); },
                onFilter: function () { loadManagePuzzles(1); },
                onFilter2: function () { loadManagePuzzles(1); },
                onPageChange: function (page) { loadManagePuzzles(page); }
            });

            loadManagePuzzles(1);
            attachRowMenu(tableDiv, function (action, id, title) {
                if (action === 'edit') openEditPuzzlePopup({ id: id, title: title });
                else if (action === 'delete') deletePuzzleConfirm({ id: id, title: title });
            });
        }
    });
}

async function loadManagePuzzles(page) {
    var tbl = managePuzzlesTable;
    var res = await fetchAdminPuzzles(page, tbl ? tbl.getSearchTerm() : '', tbl ? tbl.getFilter() : '', tbl ? tbl.getFilter2() : '');
    if (res && !res.error) managePuzzlesTable.setData(res);
}

// ── Row Menu Helper ──

function attachRowMenu(container, onAction) {
    container.addEventListener('click', function (e) {
        var menuBtn = e.target.closest('.pt-row-menu-btn');
        if (menuBtn) {
            e.preventDefault();
            e.stopPropagation();
            var dropdown = menuBtn.nextElementSibling;
            var isOpen = dropdown.classList.contains('show');
            document.querySelectorAll('.pt-row-dropdown.show').forEach(function (d) { d.classList.remove('show'); });
            if (!isOpen) dropdown.classList.add('show');
            return;
        }
        var action = e.target.closest('.pt-row-dropdown-item');
        if (action) {
            var wrap = action.closest('.pt-row-actions');
            document.querySelectorAll('.pt-row-dropdown.show').forEach(function (d) { d.classList.remove('show'); });
            onAction(action.getAttribute('data-action'), parseInt(wrap.getAttribute('data-id')), wrap.getAttribute('data-title'));
        }
    });
    document.addEventListener('click', function () {
        document.querySelectorAll('.pt-row-dropdown.show').forEach(function (d) { d.classList.remove('show'); });
    });
}

// ── Popup Chỉnh sửa Puzzle ──

function openEditPuzzlePopup(puzzle) {
    editPuzzleDeletedTcIds = [];

    Popup.open({
        id: 'edit-puzzle-popup',
        title: 'Edit Puzzle',
        size: 'lg',
        scroll: true,
        render: function (ctx) {
            var shell = buildTabShell('edit-tab-puzzle', 'edit-tab-testcases', 'edit-tab-puzzle-content', 'edit-tab-testcases-content');
            ctx.body.appendChild(shell);

            // Tab 1: Puzzle Details
            document.getElementById('edit-tab-puzzle-content').innerHTML = buildPuzzleFormHtml({ prefix: 'edit-', btnLabel: 'Update Puzzle' });

            // Tab 2: Testcases
            document.getElementById('edit-tab-testcases-content').innerHTML =
                '<p class="text-secondary mb-3" style="font-size:14px;">Testcases for <strong>' + (puzzle.title || '') + '</strong>.</p>' +
                '<div id="edit-testcase-list"></div>' +
                '<div class="d-flex justify-content-end gap-2 mt-3">' +
                    '<button id="edit-tc-add-btn" class="custom-btn btn-secondary"><i class="bi bi-plus-circle me-1"></i> Add Testcase</button>' +
                    '<button id="edit-tc-done-btn" class="custom-btn">Done</button>' +
                '</div>';

            // Prefill basic fields
            document.getElementById('edit-puzzle-title').value = puzzle.title || '';
            document.getElementById('edit-puzzle-score').value = puzzle.score || 0;
            if (puzzle.difficulty) document.getElementById('edit-puzzle-difficulty').value = puzzle.difficulty;

            // Load full detail + languages + testcases
            loadEditPuzzleFull(puzzle.id);

            // Wire Update
            document.getElementById('edit-puzzle-save-btn').addEventListener('click', async function () {
                var btn = this;
                if (btn.disabled) return;
                if (!validatePuzzleForm('edit-')) return;
                btn.disabled = true; btn.textContent = 'Updating...';
                var res = await updatePuzzle(puzzle.id, readPuzzleForm('edit-'));
                btn.disabled = false; btn.textContent = 'Update Puzzle';
                if (res && !res.error) loadManagePuzzles(managePuzzlesTable ? managePuzzlesTable.getCurrentPage() : 1);
                else showPuzzleFormError('edit-', res ? (res.error || 'Failed to update') : 'Failed to update');
            });

            // Wire testcase buttons
            document.getElementById('edit-tc-add-btn').addEventListener('click', function () { addTestcaseRow(null, null, 'edit-testcase-list'); });
            document.getElementById('edit-tc-done-btn').addEventListener('click', async function () {
                var btn = this;
                if (btn.disabled) return;
                btn.disabled = true; btn.textContent = 'Saving...';
                var r = await saveTestcaseRows(puzzle.id, 'edit-testcase-list', editPuzzleDeletedTcIds);
                btn.disabled = false; btn.textContent = 'Done';
                editPuzzleDeletedTcIds = [];
                if (r.fail > 0) Popup.confirm({ icon: '<i class="bi bi-exclamation-triangle-fill"></i>', title: 'Partial Save', message: r.success + ' saved, ' + r.fail + ' failed.' });
                ctx.close();
            });
        }
    });
}

async function loadEditPuzzleFull(id) {
    var res = await fetchPuzzleById(id);
    if (!res || res.error) return;
    document.getElementById('edit-puzzle-content').value = res.content || '';
    document.getElementById('edit-puzzle-function').value = res.functionName || '';
    await loadLanguagesInto('edit-puzzle-language', res.languageId);
    var tcRes = await fetchTestcases(id);
    if (tcRes && tcRes.data) tcRes.data.forEach(function (tc) { addTestcaseRow(tc.input, tc.output, 'edit-testcase-list', tc.tcId); });
}

// ── Xóa Puzzle ──

function deletePuzzleConfirm(puzzle) {
    var deleting = false;
    Popup.confirm({
        icon: '<i class="bi bi-trash-fill"></i>',
        title: 'Delete Puzzle',
        message: 'Are you sure you want to delete "' + (puzzle.title || 'this puzzle') + '"? This cannot be undone.',
        okLabel: 'Delete',
        okClass: 'btn-danger',
        onConfirm: async function () {
            if (deleting) return;
            deleting = true;
            var res = await deletePuzzle(puzzle.id);
            deleting = false;
            if (res && !res.error) loadManagePuzzles(managePuzzlesTable ? managePuzzlesTable.getCurrentPage() : 1);
            else Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to delete') : 'Failed to delete', okLabel: 'OK' });
        }
    });
}

// ── Popup Thêm Puzzle ──

function openAddPuzzlePopup() {
    addPuzzleNewId = null;

    Popup.open({
        id: 'add-puzzle-popup',
        title: 'Add Puzzle',
        size: 'lg',
        scroll: true,
        onClose: function () { loadDashboardStats(); },
        render: function (ctx) {
            var shell = buildTabShell('tab-puzzle-info', 'tab-testcases', 'tab-puzzle-info-content', 'tab-testcases-content');
            ctx.body.appendChild(shell);

            // Tab 1: Puzzle Details
            document.getElementById('tab-puzzle-info-content').innerHTML = buildPuzzleFormHtml({ prefix: '', btnLabel: 'Create Puzzle' });
            document.getElementById('tab-testcases').disabled = true;

            // Tab 2: Testcases
            document.getElementById('tab-testcases-content').innerHTML =
                '<p class="text-secondary mb-3" style="font-size:14px;">Add input/output test cases for <strong id="tc-puzzle-name"></strong>.</p>' +
                '<div id="testcase-list"></div>' +
                '<div class="d-flex justify-content-end gap-2 mt-3">' +
                    '<button id="tc-add-btn" class="custom-btn btn-secondary"><i class="bi bi-plus-circle me-1"></i> Add Testcase</button>' +
                    '<button id="tc-done-btn" class="custom-btn">Done</button>' +
                '</div>';

            // Wire Create
            document.getElementById('puzzle-save-btn').addEventListener('click', async function () {
                var btn = this;
                if (btn.disabled) return;
                if (!validatePuzzleForm('')) return;
                btn.disabled = true; btn.textContent = 'Creating...';
                var res = await createPuzzle(readPuzzleForm(''));
                btn.disabled = false; btn.textContent = 'Create Puzzle';
                if (res && res.id) {
                    addPuzzleNewId = res.id;
                    document.getElementById('tc-puzzle-name').textContent = readPuzzleForm('').title;
                    var tcTab = document.getElementById('tab-testcases');
                    tcTab.disabled = false;
                    tcTab.click();
                } else showPuzzleFormError('', res ? (res.error || 'Failed to create') : 'Failed to create');
            });

            // Wire testcase buttons
            document.getElementById('tc-add-btn').addEventListener('click', function () { addTestcaseRow(); });
            document.getElementById('tc-done-btn').addEventListener('click', async function () {
                var btn = this;
                if (btn.disabled) return;
                if (!addPuzzleNewId) { ctx.close(); return; }
                var rows = document.getElementById('testcase-list').children;
                if (rows.length === 0) { ctx.close(); return; }
                btn.disabled = true; btn.textContent = 'Saving...';
                var r = await saveTestcaseRows(addPuzzleNewId, 'testcase-list');
                btn.disabled = false; btn.textContent = 'Done';
                if (r.fail > 0) Popup.confirm({ icon: '<i class="bi bi-exclamation-triangle-fill"></i>', title: 'Partial Save', message: r.success + ' saved, ' + r.fail + ' failed.' });
                ctx.close();
            });

            // Load languages
            loadLanguagesInto('puzzle-language');
        }
    });
}

// ── Thêm testcase row ──

function addTestcaseRow(inputVal, outputVal, listId, tcId) {
    var list = document.getElementById(listId || 'testcase-list');
    if (!list) return;
    var idx = list.children.length + 1;

    var row = document.createElement('div');
    row.className = 'glass-box p-3 mb-3';
    if (tcId) row.setAttribute('data-tc-id', tcId);
    row.innerHTML =
        '<div class="d-flex justify-content-between align-items-center mb-2">' +
            '<strong style="font-size:14px;">Testcase #' + idx + '</strong>' +
            '<button class="btn btn-sm btn-outline-danger tc-remove-btn">' +
                '<i class="bi bi-trash"></i>' +
            '</button>' +
        '</div>' +
        '<div class="mb-2">' +
            '<label class="form-label text-secondary" style="font-size:13px;">Input</label>' +
            '<textarea class="form-control tc-input" rows="2" placeholder="Enter test input..."></textarea>' +
        '</div>' +
        '<div>' +
            '<label class="form-label text-secondary" style="font-size:13px;">Expected Output</label>' +
            '<textarea class="form-control tc-output" rows="2" placeholder="Enter expected output..."></textarea>' +
        '</div>';

    if (inputVal) row.querySelector('.tc-input').value = inputVal;
    if (outputVal) row.querySelector('.tc-output').value = outputVal;

    row.querySelector('.tc-remove-btn').addEventListener('click', function () {
        if (tcId) editPuzzleDeletedTcIds.push(parseInt(tcId));
        row.remove();
        renumberTestcases(listId);
    });

    list.appendChild(row);
}

function renumberTestcases(listId) {
    var list = document.getElementById(listId || 'testcase-list');
    if (!list) return;
    var rows = list.children;
    for (var i = 0; i < rows.length; i++) {
        var label = rows[i].querySelector('strong');
        if (label) label.textContent = 'Testcase #' + (i + 1);
    }
}

// ── Khởi tạo Dashboard ──

async function initDashboard() {
    await checkAdminAuth();
    loadDashboardStats();

    var maintenanceRes = await fetchMaintenanceStatus();
    if (maintenanceRes && !maintenanceRes.error) {
        maintenanceEnabled = !!maintenanceRes.enabled;
        updateMaintenanceButton();
    }

    document.getElementById('btn-maintenance').addEventListener('click', openMaintenancePopup);
    document.getElementById('btn-manage-users').addEventListener('click', openManageUsersPopup);
    document.getElementById('btn-manage-teams').addEventListener('click', openManageTeamsPopup);
    document.getElementById('btn-manage-puzzles').addEventListener('click', openManagePuzzlesPopup);
    document.getElementById('btn-add-puzzle').addEventListener('click', openAddPuzzlePopup);
    document.getElementById('btn-view-appeals').addEventListener('click', openViewAppealsPopup);
    document.getElementById('btn-reset-progress').addEventListener('click', function () {
        Popup.open({
            id: 'reset-progress-popup',
            title: null,
            size: 'sm',
            onClose: function () {
                if (resetCountdownInterval) {
                    clearInterval(resetCountdownInterval);
                    resetCountdownInterval = null;
                }
            },
            render: function (ctx) {
                var iconEl = document.createElement('div');
                iconEl.className = 'popup-icon';
                iconEl.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
                iconEl.style.color = 'var(--error)';
                ctx.body.appendChild(iconEl);

                var titleEl = document.createElement('h5');
                titleEl.className = 'mb-2';
                titleEl.style.color = 'var(--text-primary)';
                titleEl.textContent = 'Reset All Progress';
                ctx.body.appendChild(titleEl);

                var descEl = document.createElement('p');
                descEl.className = 'text-secondary mb-3';
                descEl.style.fontSize = '14px';
                descEl.textContent = 'Are you sure you want to delete ALL progress? This will reset every solved puzzle and leaderboard. This cannot be undone.';
                ctx.body.appendChild(descEl);

                var countdownEl = document.createElement('p');
                countdownEl.className = 'mb-3';
                countdownEl.style.cssText = 'font-size:28px;font-weight:700;color:var(--error);text-align:center;';
                countdownEl.textContent = '5';
                ctx.body.appendChild(countdownEl);

                var confirmBtn = document.createElement('button');
                confirmBtn.className = 'custom-btn btn-danger';
                confirmBtn.style.minWidth = '120px';
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Reset';
                confirmBtn.addEventListener('click', async function () {
                    if (confirmBtn.disabled) return;
                    confirmBtn.disabled = true;
                    var res = await resetProgress();
                    if (res && !res.error) {
                        ctx.close();
                        loadDashboardStats();
                        Popup.confirm({
                            icon: '<i class="bi bi-check-circle-fill"></i>',
                            title: 'Progress Reset',
                            message: 'All progress has been deleted successfully.'
                        });
                    } else {
                        confirmBtn.disabled = false;
                        ctx.close();
                        Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res ? (res.error || 'Failed to reset progress') : 'Failed to reset progress', okLabel: 'OK' });
                    }
                });
                ctx.footer.appendChild(confirmBtn);

                var cancelBtn = document.createElement('button');
                cancelBtn.className = 'custom-btn btn-secondary';
                cancelBtn.style.minWidth = '120px';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.addEventListener('click', function () { ctx.close(); });
                ctx.footer.appendChild(cancelBtn);

                var count = 5;
                resetCountdownInterval = setInterval(function () {
                    count--;
                    if (count <= 0) {
                        clearInterval(resetCountdownInterval);
                        resetCountdownInterval = null;
                        countdownEl.textContent = '0';
                        confirmBtn.disabled = false;
                    } else {
                        countdownEl.textContent = count;
                    }
                }, 1000);
            }
        });
    });

    document.querySelectorAll('[data-filter]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('[data-filter]').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            switchChart(btn.getAttribute('data-filter'));
        });
    });
}

// ── Thống kê & Biểu đồ ──

function fmt(n) {
    return Number(n).toLocaleString();
}

function getChartTotal(chart) {
    var sum = 0;
    var d = chart && chart.data ? chart.data : [];
    for (var i = 0; i < d.length; i++) sum += d[i];
    return sum;
}

async function loadDashboardStats() {
    var statGrid = document.getElementById('stat-grid');
    var chartArea = document.getElementById('stat-chart-area');
    try {
        if (statGrid) statGrid.classList.add('stat-loading');
        if (chartArea) chartArea.classList.add('stat-loading');

        var res = await fetchAdminDashboard();
        if (!res || res.error) {
            if (typeof Popup !== 'undefined' && res && res.error) {
                Popup.open({
                    id: 'dashboard-error-popup',
                    title: 'Error',
                    size: 'sm',
                    render: function (ctx) {
                        var p = document.createElement('p');
                        p.textContent = 'Failed to load dashboard statistics: ' + res.error;
                        ctx.body.appendChild(p);
                    }
                });
            }
            return;
        }
        dashboardData = res;

        document.getElementById('stat-total-users').textContent = fmt(res.totalUsers || 0);
        document.getElementById('stat-total-teams').textContent = fmt(res.totalTeams || 0);
        document.getElementById('stat-total-puzzles').textContent = fmt(res.totalPuzzles || 0);

        var todayTotal = getChartTotal(res.todayChart);
        var weekTotal = getChartTotal(res.weekChart);
        var monthTotal = getChartTotal(res.monthChart);
        var threeMonthsTotal = getChartTotal(res.threeMonthsChart);
        var allTotal = getChartTotal(res.totalChart);

        document.getElementById('stat-solved-puzzles').textContent = fmt(allTotal);
        document.getElementById('stat-solved-puzzles-sub').innerHTML = '<i class="bi bi-graph-up-arrow"></i> +' + fmt(todayTotal) + ' Today';

        document.getElementById('stat-solved-today').textContent = fmt(todayTotal);
        document.getElementById('stat-solved-week').textContent = fmt(weekTotal);
        document.getElementById('stat-solved-month').textContent = fmt(monthTotal);
        document.getElementById('stat-solved-3months').textContent = fmt(threeMonthsTotal);
        document.getElementById('stat-solved-all').textContent = fmt(allTotal);

        initSolvedChart(res.todayChart);
    } catch (e) {
        if (typeof Popup !== 'undefined') {
            Popup.open({
                id: 'dashboard-error-popup',
                title: 'Error',
                size: 'sm',
                render: function (ctx) {
                    var p = document.createElement('p');
                    p.textContent = 'Failed to load dashboard statistics.';
                    ctx.body.appendChild(p);
                }
            });
        }
    } finally {
        if (statGrid) statGrid.classList.remove('stat-loading');
        if (chartArea) chartArea.classList.remove('stat-loading');
    }
}

function initSolvedChart(chart) {
    var ctx = document.getElementById('solvedChart').getContext('2d');
    solvedChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chart.labels,
            datasets: [{
                label: 'Puzzles Solved',
                data: chart.data,
                borderColor: css('--accent'),
                backgroundColor: accentRgb(0.1),
                borderWidth: 3,
                pointBackgroundColor: css('--accent'),
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: csstext('muted') }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: csstext('muted') }
                }
            }
        }
    });
}

function switchChart(key) {
    if (!solvedChart || !dashboardData) return;
    var map = {
        today: 'todayChart',
        week: 'weekChart',
        month: 'monthChart',
        '3months': 'threeMonthsChart',
        total: 'totalChart'
    };
    var chart = dashboardData[map[key]];
    if (!chart) return;
    solvedChart.data.labels = chart.labels;
    solvedChart.data.datasets[0].data = chart.data;
    solvedChart.update();
}
