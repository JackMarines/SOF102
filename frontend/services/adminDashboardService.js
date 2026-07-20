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
