// User search service — search and paginate user/player listings
// ===========================

async function fetchUsers(page) {
    var tbl = window.userTable;
    var search = tbl ? tbl.getSearchTerm() : '';
    var response = await searchUsers(search, page, 9);
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
