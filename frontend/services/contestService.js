// Contest service — API wrapper cho danh sách contest, chi tiết, hall of fame
async function getContests(page, search) {
    var url = '/contests?page=' + (page || 1) + '&limit=6';
    if (search) url += '&search=' + encodeURIComponent(search);
    return apiGet(url);
}

async function getContest(id) {
    return apiGet('/contests?id=' + id);
}

async function getHallOfFame() {
    return apiGet('/contests/hall-of-fame');
}
