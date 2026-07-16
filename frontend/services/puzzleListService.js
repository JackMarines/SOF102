// Puzzle list service — fetch paginated puzzle catalog with search/filter
// ===========================

async function fetchPuzzles(page) {
    var tbl = window.puzzleTable;
    var search = tbl ? tbl.getSearchTerm() : '';
    var difficulty = tbl ? tbl.getFilter() : '';
    var language = tbl ? tbl.getFilter2() : '';
    var response = await getPuzzlesWithLanguage(search, difficulty, language, page, 6);
    if (tbl && response) tbl.setData(response);
}

function loadPuzzles(page) {
    fetchPuzzles(page || 1);
}
