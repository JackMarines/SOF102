// Announcement service — fetch paginated published announcements
function loadAnnouncements(page) {
    var tbl = window.announcementTable;
    apiGet('/announcements/list?page=' + page + '&limit=20').then(function(response) {
        if (tbl && response) tbl.setData(response);
    });
}
