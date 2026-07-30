// Announcement page orchestrator — table with pin icons + clickable rows → popup detail

var _annCache = {};
var _isAdmin = false;

var ANN_TYPES = ['GENERAL','MAINTENANCE','RELEASE','FEATURE','BUG_FIX','SECURITY','INCIDENT','EVENT'];

function renderAuthor(val, row) {
    var wrapper = document.createElement('div');
    wrapper.className = 'at-author-cell';
    var avatar = Avatar.render({ size: 28, avatar: row.authorAvatar || null, isAdmin: row.authorIsAdmin, trophySrc: row.authorSelectedTrophyAvatar || null });
    wrapper.appendChild(avatar);
    var nameSpan = document.createElement('span');
    nameSpan.className = 'at-author-name';
    nameSpan.textContent = val;
    wrapper.appendChild(nameSpan);
    return wrapper;
}

function renderTitle(val) {
    return val;
}

function renderType(val) {
    var key = (val || 'GENERAL').toLowerCase().replace(/_/g, '-');
    var label = (val || 'GENERAL').replace(/_/g, ' ');
    return '<div style="display:flex; justify-content:center; align-items:center; height:100%; position:relative; right:40px;"><span class="badges"><span class="ann-' + key + '">' + label + '</span></span></div>';
}

function renderDate(val) {
    if (!val) return '';
    return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

window.announcementTable = PuzzleTable.init('announcement-table', {
    columns: [
        { key: 'authorName', label: 'Author', width: '200px', render: renderAuthor },
        { key: 'title', label: 'Title', render: renderTitle },
        { key: 'type', label: 'Type', width: '120px', render: renderType },
        { key: 'createdAt', label: 'Date', width: '130px', render: renderDate }
    ],
    emptyMessage: 'No announcements found.',
    urlTemplate: '#ann-',
    onPageChange: function (page) { loadAnnouncements(page); }
});

window.loadAnnouncements = function(page) {
    apiGet('/announcements/list?page=' + page + '&limit=20').then(function(response) {
        if (response && response.data) {
            response.data.forEach(function(item) { _annCache[item.id] = item; });
        }
        var tbl = window.announcementTable;
        if (tbl && response) {
            tbl.setData(response);
            var rows = document.querySelectorAll('#announcement-table .pt-row');
            for (var i = 0; i < response.data.length && i < rows.length; i++) {
                var item = response.data[i];
                if (item.isPinned) {
                    var pin = document.createElement('span');
                    pin.className = 'at-pin-corner';
                    pin.innerHTML = '<i class="bi bi-pin-fill"></i>';
                    rows[i].appendChild(pin);
                }
                if (_isAdmin) injectActionMenu(rows[i], item);
            }
        }
    });
};

document.getElementById('announcement-table').addEventListener('click', function(e) {
    var menuBtn = e.target.closest('.pt-row-menu-btn, .pt-row-dropdown-item');
    if (menuBtn) return;
    var link = e.target.closest('a[href^="#ann-"]');
    if (!link) return;
    e.preventDefault();
    var id = parseInt(link.getAttribute('href').replace('#ann-', ''), 10);
    var item = _annCache[id];
    if (!item) return;
    showAnnouncementDetail(item);
});

function injectActionMenu(row, item) {
    var wrap = document.createElement('div');
    wrap.className = 'pt-row-actions';
    wrap.style.position = 'absolute';
    wrap.style.top = '4px';
    wrap.style.right = '8px';
    wrap.style.zIndex = '5';

    var btn = document.createElement('button');
    btn.className = 'pt-row-menu-btn';
    btn.innerHTML = '<i class="bi bi-three-dots-vertical"></i>';
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeAllMenus();
        dd.classList.toggle('show');
    });
    wrap.appendChild(btn);

    var dd = document.createElement('div');
    dd.className = 'pt-row-dropdown';

    var editItem = document.createElement('div');
    editItem.className = 'pt-row-dropdown-item';
    editItem.innerHTML = '<i class="bi bi-pencil"></i> Edit';
    editItem.addEventListener('click', function(e) {
        e.stopPropagation();
        dd.classList.remove('show');
        showEditPopup(item);
    });
    dd.appendChild(editItem);

    var takeDown = document.createElement('div');
    takeDown.className = 'pt-row-dropdown-item text-danger';
    takeDown.innerHTML = '<i class="bi bi-x-circle"></i> Take down';
    takeDown.addEventListener('click', function(e) {
        e.stopPropagation();
        dd.classList.remove('show');
        takeDownAnnouncement(item.id);
    });
    dd.appendChild(takeDown);

    wrap.appendChild(dd);
    row.appendChild(wrap);
}

function closeAllMenus() {
    document.querySelectorAll('.pt-row-dropdown.show').forEach(function(el) {
        el.classList.remove('show');
    });
}
document.addEventListener('click', closeAllMenus);

function showCreatePopup() {
    Popup.open({
        title: 'Create Announcement',
        size: 'md',
        scroll: true,
        render: function(ctx) {
            buildAnnouncementForm(ctx, null);
        }
    });
}

function showEditPopup(item) {
    Popup.open({
        title: 'Edit Announcement',
        size: 'md',
        scroll: true,
        render: function(ctx) {
            buildAnnouncementForm(ctx, item);
        }
    });
}

function buildAnnouncementForm(ctx, existing) {
    var isEdit = !!existing;

    var titleLabel = document.createElement('label');
    titleLabel.className = 'form-label';
    titleLabel.textContent = 'Title';
    ctx.body.appendChild(titleLabel);

    var titleInput = document.createElement('input');
    titleInput.className = 'form-control';
    titleInput.value = existing ? existing.title : '';
    ctx.body.appendChild(titleInput);

    var contentLabel = document.createElement('label');
    contentLabel.className = 'form-label mt-3';
    contentLabel.textContent = 'Content';
    ctx.body.appendChild(contentLabel);

    var contentTA = document.createElement('textarea');
    contentTA.className = 'form-control';
    contentTA.style.minHeight = '120px';
    contentTA.value = existing ? (existing.content || '') : '';
    ctx.body.appendChild(contentTA);

    var typeLabel = document.createElement('label');
    typeLabel.className = 'form-label mt-3';
    typeLabel.textContent = 'Type';
    ctx.body.appendChild(typeLabel);

    var typeSelect = document.createElement('select');
    typeSelect.className = 'form-select';
    for (var i = 0; i < ANN_TYPES.length; i++) {
        var opt = document.createElement('option');
        opt.value = ANN_TYPES[i];
        opt.textContent = ANN_TYPES[i].replace(/_/g, ' ');
        if (existing && existing.type === ANN_TYPES[i]) opt.selected = true;
        typeSelect.appendChild(opt);
    }
    ctx.body.appendChild(typeSelect);

    var checkRow = document.createElement('div');
    checkRow.className = 'd-flex gap-4 mt-3';

    var pinnedWrap = document.createElement('div');
    pinnedWrap.className = 'form-check';
    var pinnedCb = document.createElement('input');
    pinnedCb.type = 'checkbox';
    pinnedCb.className = 'form-check-input';
    pinnedCb.id = 'ann-pinned-cb';
    if (existing && existing.isPinned) pinnedCb.checked = true;
    var pinnedLabel = document.createElement('label');
    pinnedLabel.className = 'form-check-label';
    pinnedLabel.htmlFor = 'ann-pinned-cb';
    pinnedLabel.textContent = 'Pinned';
    pinnedWrap.appendChild(pinnedCb);
    pinnedWrap.appendChild(pinnedLabel);
    checkRow.appendChild(pinnedWrap);

    var pubWrap = document.createElement('div');
    pubWrap.className = 'form-check';
    var pubCb = document.createElement('input');
    pubCb.type = 'checkbox';
    pubCb.className = 'form-check-input';
    pubCb.id = 'ann-pub-cb';
    if (!existing || existing.isPublished) pubCb.checked = true;
    var pubLabel = document.createElement('label');
    pubLabel.className = 'form-check-label';
    pubLabel.htmlFor = 'ann-pub-cb';
    pubLabel.textContent = 'Published';
    pubWrap.appendChild(pubCb);
    pubWrap.appendChild(pubLabel);
    checkRow.appendChild(pubWrap);

    ctx.body.appendChild(checkRow);

    var btnRow = document.createElement('div');
    btnRow.className = 'd-flex gap-2 justify-content-end mt-4';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'custom-btn';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', function() {
        var payload = {
            title: titleInput.value.trim(),
            content: contentTA.value.trim(),
            type: typeSelect.value,
            isPinned: pinnedCb.checked,
            isPublished: pubCb.checked
        };
        if (!payload.title) { Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--warning);">warning</span>', title: 'Validation Error', message: 'Title is required', okLabel: 'OK' }); return; }

        var url = '/admin/announcements';
        var method = 'POST';
        if (isEdit) {
            url = '/admin/announcement?id=' + existing.id;
            method = 'PUT';
        }

        (method === 'POST' ? apiPost(url, payload) : apiPut(url, payload))
            .then(function(res) {
                    if (res && res.error) { Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res.error, okLabel: 'OK' }); return; }
                ctx.close();
                loadAnnouncements(1);
            });
    });
    btnRow.appendChild(saveBtn);

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'custom-btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', ctx.close);
    btnRow.appendChild(cancelBtn);

    ctx.body.appendChild(btnRow);
}

function takeDownAnnouncement(id) {
    var item = _annCache[id];
    Popup.confirm({
        title: 'Take down announcement?',
        message: 'Are you sure you want to unpublish "' + (item ? item.title : '') + '"?',
        icon: '<i class="bi bi-exclamation-triangle-fill"></i>',
        okLabel: 'Take down',
        okClass: 'btn-danger',
        onConfirm: function() {
            apiPut('/admin/announcement?id=' + id, { isPublished: false })
                .then(function(res) {
                if (res && res.error) { Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res.error, okLabel: 'OK' }); return; }
                    loadAnnouncements(1);
                });
        }
    });
}

function showAnnouncementDetail(item) {
    Popup.open({
        size: 'md',
        scroll: true,
        render: function(ctx) {
            var titleEl = document.createElement('h2');
            titleEl.className = 'at-detail-title';
            titleEl.textContent = item.title;
            ctx.body.appendChild(titleEl);

            var meta = document.createElement('div');
            meta.className = 'at-detail-meta';

            var typeBadge = document.createElement('span');
            typeBadge.className = 'badges';
            typeBadge.innerHTML = renderType(item.type);
            meta.appendChild(typeBadge);

            var authorEl = document.createElement('span');
            authorEl.className = 'at-detail-author';
            var authorAvatar = Avatar.render({ size: 24, avatar: item.authorAvatar || null, isAdmin: item.authorIsAdmin, trophySrc: item.authorSelectedTrophyAvatar || null });
            authorEl.appendChild(authorAvatar);
            var authorName = document.createElement('span');
            authorName.textContent = item.authorName || 'Unknown';
            authorEl.appendChild(authorName);
            meta.appendChild(authorEl);

            var dateEl = document.createElement('span');
            dateEl.className = 'at-detail-date';
            dateEl.textContent = renderDate(item.createdAt);
            meta.appendChild(dateEl);

            ctx.body.appendChild(meta);

            if (item.content) {
                var contentEl = document.createElement('div');
                contentEl.className = 'at-detail-content';
                contentEl.textContent = item.content;
                ctx.body.appendChild(contentEl);
            }

            var footer = document.createElement('div');
            footer.className = 'at-detail-footer';

            if (item.updatedAt && item.updatedAt !== item.createdAt) {
                var updatedEl = document.createElement('span');
                updatedEl.className = 'at-detail-updated';
                updatedEl.textContent = 'Updated at ' + renderDate(item.updatedAt);
                footer.appendChild(updatedEl);
            }

            if (item.isPinned) {
                var pinnedBadge = document.createElement('span');
                pinnedBadge.className = 'at-detail-pinned-badge';
                pinnedBadge.innerHTML = '<i class="bi bi-pin-fill"></i> Pinned';
                footer.appendChild(pinnedBadge);
            }

            ctx.body.appendChild(footer);

            var closeRow = document.createElement('div');
            closeRow.className = 'text-center mt-4';
            var closeBtn = document.createElement('button');
            closeBtn.className = 'custom-btn';
            closeBtn.textContent = 'Close';
            closeBtn.addEventListener('click', ctx.close);
            closeRow.appendChild(closeBtn);
            ctx.body.appendChild(closeRow);
        }
    });
}

function showCreateButton() {
    var container = document.getElementById('announcement-table');
    var btn = document.createElement('div');
    btn.className = 'mb-3';
    btn.innerHTML = '<button class="custom-btn" id="ann-create-btn"><i class="bi bi-plus-lg"></i> Create Announcement</button>';
    container.insertBefore(btn, container.firstChild);
    document.getElementById('ann-create-btn').addEventListener('click', showCreatePopup);
}

function autoOpenFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var openId = params.get('open');
    if (!openId) return;
    var id = parseInt(openId, 10);
    apiGet('/announcements?id=' + id).then(function(res) {
        if (res && res.data) showAnnouncementDetail(res.data);
    });
}

// Init
window.addEventListener('deps-ready', function () {
    getMe()
        .then(function(session) {
            if (session && session.userIsadmin) {
                _isAdmin = true;
                showCreateButton();
            }
        })
        .catch(function() {})
        .then(function() {
            showSkeleton('pt-list-announcement-table', 'announcement-rows');
            loadAnnouncements(1);
            autoOpenFromUrl();
        });
});
