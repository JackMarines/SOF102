// Guest puzzle catalog — read-only puzzle table without auth
window.addEventListener('deps-ready', function () {
    window.puzzleTable = PuzzleTable.init('puzzle-table', {
        columns: [
            { key: 'id', label: '#', width: '60px' },
            { key: 'title', label: 'Title' },
            { key: 'language', label: 'Language', width: '150px' },
            { key: 'difficulty', label: 'Difficulty', width: '120px',
              render: function (val) {
                  return '<span class="pt-row-' + val.toLowerCase() + '">' + val + '</span>';
              }
            }
        ],
        emptyMessage: 'No puzzles found.',
        searchPlaceholder: 'Search puzzles...',
        filterOptions: ['Easy', 'Medium', 'Hard'],
        filterLabel: 'Difficulty',
        filter2Options: ['Python', 'Javascript', 'PHP'],
        filter2Label: 'Language',
        urlTemplate: '/frontend/pages/user/solve/index.html?id=',
        onSearch: function () { loadPuzzles(1); },
        onFilter: function () { loadPuzzles(1); },
        onFilter2: function () { loadPuzzles(1); },
        onPageChange: function (page) { loadPuzzles(page); },
        rowClass: function (item) {
            return item.contestId ? 'pt-row-contest' : '';
        }
    });

    showSkeleton('pt-list-puzzle-table', 'puzzle-rows');
    loadPuzzles();
});
