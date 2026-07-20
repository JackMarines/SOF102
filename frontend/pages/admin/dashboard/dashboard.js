// Admin Dashboard page orchestrator — quản lý maintenance mode, thống kê, biểu đồ, quản lý người dùng (cảnh báo/cấm/kích hoạt lại)
// Gọi initDashboard() từ inline script trong index.html

// ── Trạng thái ──

var maintenanceEnabled = false;       // Trạng thái hiện tại của maintenance mode
var maintenanceCountdownInterval = null; // Timer đếm ngược popup
var dashboardData = null;              // Dữ liệu dashboard cache (để chuyển đổi biểu đồ)
var solvedChart = null;                // Chart.js instance
var manageUsersTable = null;           // CardTable instance
var warnTargetUser = null;             // User đang bị chọn để cảnh báo

// ── Maintenance Mode ──

// Cập nhật giao diện nút Maintenance (đỏ = ON, xám = OFF)
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

// ── Popup xác nhận bật/tắt Maintenance (có đếm ngược 5 giây) ──

function buildMaintenancePopup() {
    var overlay = document.createElement('div');
    overlay.className = 'confirm-popup-overlay';
    overlay.id = 'maintenance-popup';
    overlay.innerHTML =
        '<div class="confirm-popup">' +
            '<div class="confirm-popup-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>' +
            '<h5 class="mb-2" style="color:var(--text-primary);">Enable Maintenance Mode?</h5>' +
            '<p class="text-secondary mb-3" style="font-size:14px;">' +
                'All users will be locked out of the platform until you disable it.' +
            '</p>' +
            '<p id="maintenance-countdown" class="mb-3" style="font-size:28px;font-weight:700;color:var(--accent);">5</p>' +
            '<div class="d-flex gap-2 justify-content-center">' +
                '<button id="maintenance-confirm" class="custom-btn btn-danger" disabled style="min-width:120px;">Confirm</button>' +
                '<button id="maintenance-cancel" class="custom-btn btn-secondary" style="min-width:120px;">Cancel</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    document.getElementById('maintenance-cancel').addEventListener('click', closeMaintenancePopup);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeMaintenancePopup();
    });
    document.getElementById('maintenance-confirm').addEventListener('click', function () {
        var newEnabled = !maintenanceEnabled;
        toggleMaintenance(newEnabled).then(function () {
            maintenanceEnabled = newEnabled;
            updateMaintenanceButton();
            closeMaintenancePopup();
        });
    });
}

function openMaintenancePopup() {
    var overlay = document.getElementById('maintenance-popup');
    if (!overlay) {
        buildMaintenancePopup();
        overlay = document.getElementById('maintenance-popup');
    }
    var countdownEl = document.getElementById('maintenance-countdown');
    var confirmBtn = document.getElementById('maintenance-confirm');
    var actionText = maintenanceEnabled ? 'DISABLE' : 'ENABLE';
    overlay.querySelector('.confirm-popup h5').textContent = actionText + ' Maintenance Mode?';
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Confirm';

    var count = 5;
    countdownEl.textContent = count;
    overlay.classList.add('show');
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

function closeMaintenancePopup() {
    if (maintenanceCountdownInterval) {
        clearInterval(maintenanceCountdownInterval);
        maintenanceCountdownInterval = null;
    }
    var overlay = document.getElementById('maintenance-popup');
    if (overlay) overlay.classList.remove('show');
}

// ── Popup xác nhận chung (dùng cho ban, reactivate, v.v.) ──

function showAdminConfirmPopup(icon, title, message, okLabel, okClass, onConfirm) {
    var overlay = document.getElementById('confirm-popup-overlay');
    document.getElementById('confirm-popup-icon').innerHTML = icon;
    document.getElementById('confirm-popup-title').textContent = title;
    document.getElementById('confirm-popup-message').textContent = message;
    var okBtn = document.getElementById('confirm-popup-ok');
    var cancelBtn = document.getElementById('confirm-popup-cancel');

    if (okLabel) {
        okBtn.textContent = okLabel;
        okBtn.className = 'custom-btn ' + (okClass || '');
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

// ── Popup Quản lý Người dùng ──

function openManageUsersPopup() {
    var overlay = document.getElementById('manage-users-popup-overlay');
    overlay.classList.add('show');

    document.getElementById('manage-users-popup-close').onclick = closeManageUsersPopup;
    overlay.onclick = function (e) { if (e.target === overlay) closeManageUsersPopup(); };

    manageUsersTable = CardTable.init('manage-users-table', {
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
                onClick: function (user) {
                    openWarnPopup(user);
                }
            },
            {
                label: 'Ban User',
                icon: 'person-x',
                danger: true,
                onClick: function (user) {
                    openBanConfirm(user);
                }
            },
            {
                label: 'Reactivate',
                icon: 'arrow-counterclockwise',
                danger: false,
                visible: function (user) {
                    return user.userIsactive === false || user.userIsactive === 0;
                },
                onClick: function (user) {
                    openReactivateConfirm(user);
                }
            }
        ],
        onSearch: function () { loadManageUsers(1); },
        onPageChange: function (page) { loadManageUsers(page); },
        onFilterChange: function () { loadManageUsers(1); }
    });

    loadManageUsers(1);
}

function closeManageUsersPopup() {
    document.getElementById('manage-users-popup-overlay').classList.remove('show');
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
    var overlay = document.getElementById('warn-popup-overlay');
    document.getElementById('warn-user-name').textContent = user.userName || user.displayName || '';
    document.getElementById('warn-reason').value = '';
    document.getElementById('warn-reason-error').classList.add('d-none');

    var today = new Date();
    var nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    document.getElementById('warn-start-date').value = formatDate(today);
    document.getElementById('warn-end-date').value = formatDate(nextWeek);

    overlay.classList.add('show');

    document.getElementById('warn-submit').onclick = submitWarning;
    document.getElementById('warn-cancel').onclick = closeWarnPopup;
    overlay.onclick = function (e) { if (e.target === overlay) closeWarnPopup(); };
}

function closeWarnPopup() {
    document.getElementById('warn-popup-overlay').classList.remove('show');
    warnTargetUser = null;
}

async function submitWarning() {
    if (!warnTargetUser) return;

    var reason = document.getElementById('warn-reason').value.trim();
    var startDate = document.getElementById('warn-start-date').value;
    var endDate = document.getElementById('warn-end-date').value;
    var errorEl = document.getElementById('warn-reason-error');
    var submitBtn = document.getElementById('warn-submit');

    errorEl.classList.add('d-none');

    if (!reason) {
        errorEl.textContent = 'Reason is required';
        errorEl.classList.remove('d-none');
        return;
    }

    if (!startDate || !endDate) {
        errorEl.textContent = 'Start and end dates are required';
        errorEl.classList.remove('d-none');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    var res = await sendWarning(warnTargetUser.userId, reason, startDate, endDate);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Warning';

    if (res && !res.error) {
        var userName = warnTargetUser.userName || 'this user';
        closeWarnPopup();
        showAdminConfirmPopup(
            '<i class="bi bi-check-circle-fill"></i>',
            'Warning Issued',
            'A warning has been issued to ' + userName + '.',
            null,
            '',
            null
        );
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
    showAdminConfirmPopup(
        '<i class="bi bi-person-x-fill"></i>',
        'Ban User',
        'Are you sure you want to ban ' + (user.userName || 'this user') + '? They will no longer be able to access the platform.',
        'Ban',
        'btn-danger',
        async function () {
            var res = await banUser(user.userId);
            if (res && !res.error) {
                loadManageUsers(1);
            } else {
                alert(res ? (res.error || 'Failed to ban user') : 'Failed to ban user');
            }
        }
    );
}

// ── Kích hoạt lại người dùng ──

function openReactivateConfirm(user) {
    showAdminConfirmPopup(
        '<i class="bi bi-arrow-counterclockwise"></i>',
        'Reactivate User',
        'Are you sure you want to reactivate ' + (user.userName || 'this user') + '?',
        'Reactivate',
        '',
        async function () {
            var res = await reactivateUser(user.userId);
            if (res && !res.error) {
                loadManageUsers(1);
            } else {
                alert(res ? (res.error || 'Failed to reactivate user') : 'Failed to reactivate user');
            }
        }
    );
}

// ── Khởi tạo Dashboard ──

async function initDashboard() {
    await checkAdminAuth();
    loadDashboardStats();

    // Fetch trạng thái maintenance từ API
    var maintenanceRes = await fetchMaintenanceStatus();
    if (maintenanceRes && !maintenanceRes.error) {
        maintenanceEnabled = !!maintenanceRes.enabled;
        updateMaintenanceButton();
    }

    document.getElementById('btn-maintenance').addEventListener('click', openMaintenancePopup);
    document.getElementById('btn-manage-users').addEventListener('click', openManageUsersPopup);

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
    try {
        var res = await fetchAdminDashboard();
        if (!res) return;
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
    } catch (e) {}
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
                borderColor: '#b388ff',
                backgroundColor: 'rgba(179,136,255,0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#b388ff',
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
                    ticks: { color: '#888' }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#888' }
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
