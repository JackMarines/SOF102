// ===========================
// USER SEARCH SERVICE
// ===========================

async function fetchUsers(page) {
    var tbl = window.userTable;
    var search = tbl ? tbl.getSearchTerm() : '';
    var response = await searchUsers(search, page, 10);
    if (tbl && response) tbl.setData(response);
}

function loadUsers(page) {
    fetchUsers(page || 1);
}

async function searchUsers(search, page, limit) {
    var url = '/users?search=' + encodeURIComponent(search);
    if (page) url += '&page=' + page;
    if (limit) url += '&limit=' + limit;
    return apiGet(url);
}
