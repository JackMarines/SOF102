// ===========================
// TEAM SEARCH SERVICE
// ===========================

async function searchTeams(search, sortBy, order, page, limit) {
    var url = '/teams?page=' + page + '&limit=' + limit;
    if (search)  url += '&search=' + encodeURIComponent(search);
    if (sortBy)  url += '&sortBy=' + sortBy;
    if (order)   url += '&order=' + order;
    return apiGet(url);
}

async function loadTeams(page) {
    var tbl = window.teamTable;
    var search  = tbl ? tbl.getSearchTerm() : '';
    var sortBy  = tbl ? tbl.getSortBy() : '';
    var order   = tbl ? tbl.getOrder() : '';
    var res = await searchTeams(search, sortBy, order, page || 1, 8);
    if (tbl && res) tbl.setData(res);
}
