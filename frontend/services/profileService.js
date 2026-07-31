// Profile service — lấy dữ liệu profile, puzzle đã hoàn thành, cập nhật profile
// ===========================

async function fetchProfile(id) {
    var url = id ? '/profile?id=' + id : '/profile';
    return apiGet(url);
}

async function fetchCompletedPuzzles(id, search, difficulty, language, page, limit) {
    var url = id ? '/profile/completed?id=' + id : '/profile/completed';
    if (page)       url += '&page=' + page;
    if (limit)      url += '&limit=' + limit;
    if (search)     url += '&search=' + encodeURIComponent(search);
    if (difficulty) url += '&difficulty=' + difficulty;
    if (language)   url += '&language=' + encodeURIComponent(language);
    return apiGet(url);
}

async function loadSolved(page) {
    var tbl = window.solvedTable;
    var search = tbl ? tbl.getSearchTerm() : '';
    var difficulty = tbl ? tbl.getFilter() : '';
    var targetId = new URLSearchParams(window.location.search).get('id');
    var res = await fetchCompletedPuzzles(targetId, search, difficulty, null, page, 6);
    if (tbl && res) tbl.setData(res);
}

async function updateProfile(data) {
    return apiPut('/profile', data);
}

async function fetchUserTrophies(userId) {
    var url = userId ? '/profile/trophies?id=' + userId : '/profile/trophies';
    return apiGet(url);
}

async function setSelectedTrophy(trophyId) {
    return apiPut('/profile/trophy', { trophyId: trophyId });
}
