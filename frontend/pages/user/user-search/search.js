// Authenticated user search — links to user profile pages
checkAuth().then(function () {
    window.userTable = UserTable.init('user-table', {
        columns: [
            { key: 'user', label: 'User' },
            { key: 'puzzles', label: 'Puzzles' },
            { key: 'score', label: 'Score' }
        ],
        urlTemplate: '/frontend/pages/user/profile/index.html?id=',
        onSearch: function () { loadUsers(1); },
        onPageChange: function (page) { loadUsers(page); }
    });
});
