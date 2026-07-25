// Contest service — thin API wrapper for contest listing + hall of fame
async function getContests(page, search) {
    var url = '/contests?page=' + (page || 1) + '&limit=6';
    if (search) url += '&search=' + encodeURIComponent(search);
    return apiGet(url);
}

async function getHallOfFame() {
    return apiGet('/contests/hall-of-fame');
}
