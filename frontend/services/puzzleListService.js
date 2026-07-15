// ===========================
// PUZZLE LIST SERVICE
// ===========================

async function fetchPuzzles(page) {
    var tbl = window.puzzleTable;
    var search = tbl ? tbl.getSearchTerm() : '';
    var difficulty = tbl ? tbl.getFilter() : '';
    var response = await getFilteredPuzzles(search, difficulty, page, 6);
    if (tbl && response) tbl.setData(response);
}

function loadPuzzles(page) {
    fetchPuzzles(page || 1);
}
