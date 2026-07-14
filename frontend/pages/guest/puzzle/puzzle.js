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
    searchPlaceholder: 'Search puzzles...',
    filterOptions: ['Easy', 'Medium', 'Hard'],
    filterLabel: 'Difficulty',
    urlTemplate: '/frontend/pages/user/solve/index.html?id=',
    onSearch: function () { loadPuzzles(1); },
    onFilter: function () { loadPuzzles(1); },
    onPageChange: function (page) { loadPuzzles(page); }
});

loadPuzzles();
