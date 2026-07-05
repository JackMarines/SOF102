async function getPuzzleById(id){
    return apiGet('/puzzles?id='+id);
};

async function getFilteredPuzzles(search, difficulty, page, limit) {
    let url = '/puzzles?page=' + page + '&limit=' + limit;
    if (search) url += '&search=' + encodeURIComponent(search);
    if (difficulty) url += '&difficulty=' + difficulty;
    return apiGet(url);
}
