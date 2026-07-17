// User team search — team catalog with search, sort, and pagination
checkAuth().then(function () {
    window.teamTable = TeamTable.init('team-table', {
        searchPlaceholder: 'Search teams...',
        sortByOptions: [
            { label: 'Members', value: 'members' },
            { label: 'Solved', value: 'solved' }
        ],
        sortByLabel: 'Sort by',
        orderOptions: [
            { label: 'Descending', value: 'desc' },
            { label: 'Ascending', value: 'asc' }
        ],
        orderLabel: 'Order',
        urlTemplate: '/frontend/pages/user/team/index.html?id=',
        onSearch: function () { loadTeams(1); },
        onSort: function () { loadTeams(1); },
        onPageChange: function (page) { loadTeams(page); }
    });

    loadTeams();

    window.__pageReady();
});
