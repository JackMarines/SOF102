async function getPuzzleById(id) {
    const puzzle = await apiGet('/puzzles?id=' + id);
    if (!puzzle || puzzle.error) {
    window.location.href = '/frontend/pages/user/puzzle/index.html';
    } else {
    return puzzle
    }
};

async function getFilteredPuzzles(search, difficulty, page, limit) {
    let url = '/puzzles?page=' + page + '&limit=' + limit;
    if (search) url += '&search=' + encodeURIComponent(search);
    if (difficulty) url += '&difficulty=' + difficulty;
    return apiGet(url);
}
