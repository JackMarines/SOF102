// Admin Dashboard service — API wrapper cho maintenance mode, thống kê, quản lý người dùng
// Tất cả DOM building đã được chuyển sang admin/dashboard/dashboard.js

// ── Maintenance Mode ──

async function fetchMaintenanceStatus() {
    return apiGet('/maintenance');
}

async function toggleMaintenance(enabled) {
    return apiPut('/admin/maintenance', { enabled: enabled });
}

// ── Dashboard Stats ──

async function fetchAdminDashboard() {
    return apiGet('/admin/dashboard');
}

// ── Manage Users ──

async function fetchManageUsers(page, searchTerm, filterVal) {
    var url = '/admin/users?page=' + page + '&limit=16&status=' + encodeURIComponent(filterVal);
    if (searchTerm) url += '&search=' + encodeURIComponent(searchTerm);
    return apiGet(url);
}

// ── Warning ──

async function sendWarning(userId, reason, startDate, endDate) {
    return apiPost('/admin/warning', {
        userId: userId,
        reason: reason,
        startDate: startDate,
        endDate: endDate
    });
}

// ── Ban / Reactivate ──

async function banUser(userId) {
    return apiPut('/admin/user/ban?id=' + userId);
}

async function reactivateUser(userId) {
    return apiPut('/admin/user/reactivate?id=' + userId);
}

// ── Reset Progress ──

async function resetProgress() {
    return apiDelete('/admin/progress');
}

// ── Manage Teams ──

async function fetchAdminTeams(page, searchTerm, filterVal) {
    var url = '/admin/teams?page=' + page + '&limit=16&status=' + encodeURIComponent(filterVal || 'active');
    if (searchTerm) url += '&search=' + encodeURIComponent(searchTerm);
    return apiGet(url);
}

async function banTeam(teamId) {
    return apiPut('/admin/team/ban?id=' + teamId);
}

async function reactivateTeam(teamId) {
    return apiPut('/admin/team/reactivate?id=' + teamId);
}

// ── Team Warning ──

async function sendTeamWarning(teamId, reason, startDate, endDate) {
    return apiPost('/admin/warning', {
        teamId: teamId,
        reason: reason,
        startDate: startDate,
        endDate: endDate
    });
}

// ── Puzzle CRUD ──

async function createPuzzle(data) {
    return apiPost('/admin/puzzle', data);
}

async function fetchAdminPuzzles(page, search, difficulty, language) {
    var url = '/admin/puzzles?page=' + page + '&limit=16';
    if (search) url += '&search=' + encodeURIComponent(search);
    if (difficulty) url += '&difficulty=' + encodeURIComponent(difficulty);
    if (language) url += '&language=' + encodeURIComponent(language);
    return apiGet(url);
}

async function fetchPuzzleById(id) {
    return apiGet('/admin/puzzle?id=' + id);
}

async function updatePuzzle(id, data) {
    return apiPut('/admin/puzzle?id=' + id, data);
}

async function deletePuzzle(id) {
    return apiDelete('/admin/puzzle?id=' + id);
}

async function fetchLanguages() {
    return apiGet('/admin/languages');
}

// ── Testcase CRUD ──

async function createTestcase(data) {
    return apiPost('/admin/testcase', data);
}

async function fetchTestcases(puzzleId) {
    return apiGet('/admin/testcases?puzzle=' + puzzleId);
}

async function updateTestcase(id, data) {
    return apiPut('/admin/testcase?id=' + id, data);
}

async function deleteTestcase(id) {
    return apiDelete('/admin/testcase?id=' + id);
}

// ── Appeal ──

async function fetchAppeals(page, status) {
    var url = '/admin/appeals?page=' + page + '&limit=15';
    if (status) url += '&status=' + encodeURIComponent(status);
    return apiGet(url);
}

async function fetchAppealById(id) {
    return apiGet('/admin/appeal?id=' + id);
}

async function reviewAppeal(appealId, status) {
    return apiPut('/admin/appeal?id=' + appealId, { status: status });
}
