// Contest create/edit page orchestrator
(function () {

    var leftEl = document.getElementById('contest-left');
    var rightEl = document.getElementById('contest-right');
    var fileInput = document.getElementById('banner-file-input');

    var state = {
        editId: null,
        title: '',
        content: '',
        avatar: null,
        endDate: '',
        trophyId: null,
        trophy: null,
        puzzles: []
    };

    var currentUser = null;

    // ── Auth Guard + Edit Mode ──

    async function init() {
        if (typeof getMe !== 'function') {
            window.location.href = '/frontend/pages/user/home/index.html';
            return;
        }
        try {
            var session = await getMe();
            if (!session || session.error || !session.userIsadmin) {
                window.location.href = '/frontend/pages/user/home/index.html';
                return;
            }
            currentUser = session;
        } catch (e) {
            window.location.href = '/frontend/pages/user/home/index.html';
            return;
        }

        var params = new URLSearchParams(window.location.search);
        var contestId = params.get('id');

        renderHeader();
        renderPuzzles();
        renderSidebar();
        wireSaveBar();
        wireBannerUpload();
        wireDeleteBtn();

        if (contestId) {
            await loadContestForEdit(contestId);
        }
    }

    async function loadContestForEdit(id) {
        var data = await apiGet('/admin/contest?id=' + id);
        if (!data || data.error || !data.id) return;

        state.editId = data.id;
        state.title = data.title || '';
        state.content = data.content || '';
        state.avatar = data.avatar || null;
        state.trophyId = data.trophyId || null;
        state.puzzles = data.puzzles || [];
        if (data.trophyId || data.trophyName) {
            state.trophy = { id: data.trophyId, name: data.trophyName, avatar: data.trophyAvatar || null, content: data.trophyContent || null };
        }

        var titleInput = document.querySelector('.editable-title');
        if (titleInput) titleInput.value = state.title;

        var descTextarea = document.querySelector('.editable-textarea');
        if (descTextarea) descTextarea.value = state.content;

        if (data.end) {
            var dt = new Date(data.end);
            var yyyy = dt.getFullYear();
            var mm = String(dt.getMonth() + 1).padStart(2, '0');
            var dd = String(dt.getDate()).padStart(2, '0');
            var hh = String(dt.getHours()).padStart(2, '0');
            var min = String(dt.getMinutes()).padStart(2, '0');
            state.endDate = yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + min;
            var dateInput = document.querySelector('.editable-date');
            if (dateInput) dateInput.value = state.endDate;
            updateDuration();
        }

        if (state.avatar) {
            renderBannerImage(state.avatar);
        }

        if (state.trophy) {
            var rewardBody = document.getElementById('reward-body');
            renderRewardFilled(rewardBody);
        }

        var saveBtn = document.getElementById('save-btn');
        saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">save</span> UPDATE CONTEST';

        document.getElementById('delete-btn').style.display = '';

        document.querySelector('.back-link').href = '/frontend/pages/user/contest-solve/index.html?id=' + data.id;

        var oldPuzzles = document.getElementById('puzzles-container');
        if (oldPuzzles) oldPuzzles.remove();
        renderPuzzles();
    }

    // ── Left Column: Header ──

    function renderHeader() {
        var header = document.createElement('div');
        header.className = 'contest-header';

        // Banner
        var banner = document.createElement('div');
        banner.className = 'contest-header-banner';
        banner.id = 'banner-container';

        var uploadZone = document.createElement('div');
        uploadZone.className = 'banner-upload-zone';
        uploadZone.id = 'banner-upload-zone';
        uploadZone.innerHTML = '<span class="material-symbols-outlined" style="font-size:2.5rem;">add_a_photo</span><span class="upload-label">Upload Banner</span>';
        banner.appendChild(uploadZone);

        var gradient = document.createElement('div');
        gradient.className = 'banner-gradient';
        banner.appendChild(gradient);

        header.appendChild(banner);

        // Body
        var body = document.createElement('div');
        body.className = 'contest-header-body';

        // Title input
        var titleInput = document.createElement('input');
        titleInput.className = 'editable-title';
        titleInput.type = 'text';
        titleInput.placeholder = 'CONTEST TITLE';
        titleInput.addEventListener('input', function () { state.title = this.value; });
        body.appendChild(titleInput);

        // Meta row
        var meta = document.createElement('div');
        meta.className = 'contest-header-meta';

        if (currentUser) {
            var authorLink = document.createElement('a');
            authorLink.className = 'contest-header-author';
            authorLink.href = '#';
            var authorAvatar = Avatar.render({ size: 18, avatar: currentUser.userAvatar || null, isAdmin: true, trophySrc: currentUser.selectedTrophyAvatar || null });
            authorLink.appendChild(authorAvatar);
            var authorText = document.createElement('span');
            authorText.textContent = ' ' + (currentUser.userName || 'Admin');
            authorLink.appendChild(authorText);
            meta.appendChild(authorLink);
        }

        var dateLabel = document.createElement('span');
        dateLabel.className = 'contest-header-dates';
        dateLabel.innerHTML = '<span class="material-symbols-outlined" style="font-size:0.875rem;">calendar_today</span> Ends:';
        var dateInput = document.createElement('input');
        dateInput.className = 'editable-date';
        dateInput.type = 'datetime-local';
        dateInput.addEventListener('change', function () {
            state.endDate = this.value;
            updateDuration();
        });
        dateLabel.appendChild(dateInput);
        meta.appendChild(dateLabel);

        body.appendChild(meta);

        // Description textarea
        var descTextarea = document.createElement('textarea');
        descTextarea.className = 'editable-textarea';
        descTextarea.placeholder = 'Describe the contest...';
        descTextarea.rows = 3;
        descTextarea.addEventListener('input', function () { state.content = this.value; });
        body.appendChild(descTextarea);

        header.appendChild(body);
        leftEl.appendChild(header);
    }

    // ── Left Column: Puzzles ──

    function renderPuzzles() {
        var old = document.getElementById('puzzles-container');
        if (old) old.remove();

        var wrap = document.createElement('div');
        wrap.id = 'puzzles-container';

        // ADD PUZZLE button — always visible at top
        var topRow = document.createElement('div');
        topRow.style.cssText = 'margin-bottom:var(--space-16px);';
        var topBtn = document.createElement('button');
        topBtn.className = 'btn-devclimb secondary';
        topBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">add</span> ADD PUZZLE';
        topBtn.addEventListener('click', showAddPuzzlePopup);
        topRow.appendChild(topBtn);
        wrap.appendChild(topRow);

        if (state.puzzles.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'puzzle-empty';

            var emptyText = document.createElement('div');
            emptyText.className = 'puzzle-empty-text';
            emptyText.textContent = 'No puzzles added yet.';
            empty.appendChild(emptyText);

            wrap.appendChild(empty);
            leftEl.appendChild(wrap);
            return;
        }

        for (var i = 0; i < state.puzzles.length; i++) {
            var p = state.puzzles[i];

            var section = document.createElement('div');
            section.className = 'puzzle-section';

            var termHeader = document.createElement('div');
            termHeader.className = 'puzzle-terminal-header';
            var headerLabel = document.createElement('span');
            headerLabel.textContent = 'CHALLENGE_' + String(i + 1).padStart(2, '0');
            termHeader.appendChild(headerLabel);
            section.appendChild(termHeader);

            var body = document.createElement('div');
            body.className = 'puzzle-body';

            var titleRow = document.createElement('div');
            titleRow.className = 'puzzle-title-row';

            var h2 = document.createElement('h2');
            h2.textContent = p.title || '';
            titleRow.appendChild(h2);

            var diff = (p.difficulty || '').toLowerCase();
            if (diff) {
                var diffBadge = document.createElement('span');
                diffBadge.className = 'puzzle-badge ' + diff;
                diffBadge.textContent = p.difficulty;
                titleRow.appendChild(diffBadge);
            }

            if (p.language) {
                var langBadge = document.createElement('span');
                langBadge.className = 'puzzle-badge lang';
                langBadge.textContent = p.language;
                titleRow.appendChild(langBadge);
            }

            if (p.score) {
                var scoreBadge = document.createElement('span');
                scoreBadge.className = 'puzzle-badge';
                scoreBadge.textContent = p.score + ' pts';
                titleRow.appendChild(scoreBadge);
            }

            body.appendChild(titleRow);

            if (p.content) {
                var content = document.createElement('div');
                content.className = 'puzzle-content';
                content.textContent = p.content;
                body.appendChild(content);
            }

            section.appendChild(body);
            wrap.appendChild(section);
        }

        leftEl.appendChild(wrap);
    }

    function showAddPuzzlePopup() {
        var existingIds = {};
        state.puzzles.forEach(function (p) { existingIds[p.id] = true; });

        Popup.open({
            id: 'add-puzzle-popup',
            size: 'lg',
            title: 'ADD PUZZLE',
            render: function (ctx) {
                var container = document.createElement('div');
                container.id = 'puzzle-picker';
                ctx.body.appendChild(container);

                var tbl = PuzzleTable.init('puzzle-picker', {
                    columns: [
                        { key: 'id', label: '#', width: '60px' },
                        { key: 'title', label: 'Title' },
                        { key: 'language', label: 'Language', width: '120px' },
                        { key: 'difficulty', label: 'Difficulty', width: '100px',
                          render: function (val) {
                              return '<span class="pt-row-' + (val || '').toLowerCase() + '">' + (val || '') + '</span>';
                          }
                        }
                    ],
                    searchPlaceholder: 'Search puzzles...',
                    filterOptions: [],
                    filter2Options: [],
                    onSearch: function () { loadPicker(1); },
                    onPageChange: function (page) { loadPicker(page); }
                });

                function loadPicker(page) {
                    var search = tbl.getSearchTerm();
                    var url = '/puzzles?page=' + (page || 1) + '&limit=10';
                    if (search) url += '&search=' + encodeURIComponent(search);
                    apiGet(url).then(function (res) {
                        if (res && res.data) {
                            tbl.setData(res);
                            var rows = container.querySelectorAll('.pt-row');
                            rows.forEach(function (row, idx) {
                                var p = res.data[idx];
                                if (!p) return;
                                if (existingIds[p.id]) {
                                    row.style.opacity = '0.3';
                                    row.style.pointerEvents = 'none';
                                } else {
                                    row.style.cursor = 'pointer';
                                    row.addEventListener('click', function () {
                                        state.puzzles.push(p);
                                        renderPuzzles();
                                        ctx.close();
                                    });
                                }
                            });
                        }
                    });
                }

                loadPicker(1);
            }
        });
    }

    // ── Right Column: Sidebar ──

    function renderSidebar() {
        // System Info
        var sysPanel = createPanel('panel-system', 'SYSTEM_INFO');
        var sysBody = sysPanel.querySelector('.sidebar-body');
        addRow(sysBody, 'Duration', '—');
        sysBody.id = 'sys-info-body';
        addRow(sysBody, 'Puzzles', '0');
        addRow(sysBody, 'Participants', '0');
        addRow(sysBody, 'Solvers', '0');
        rightEl.appendChild(sysPanel);

        // Reward
        var rewardPanel = createPanel('panel-reward', 'REWARD');
        var rewardBody = rewardPanel.querySelector('.sidebar-body');
        rewardBody.id = 'reward-body';
        renderRewardEmpty(rewardBody);
        rightEl.appendChild(rewardPanel);

        // Rules
        var rulesPanel = createPanel('panel-rules', 'CONTEST_RULES');
        var rulesBody = rulesPanel.querySelector('.sidebar-body');
        var rulesList = document.createElement('ul');
        rulesList.className = 'sidebar-rules-list';
        var rules = [
            'Solve all puzzles to earn the trophy',
            'Each puzzle has multiple test cases',
            'Timer tracks your solve duration',
            'Best time wins on the leaderboard'
        ];
        for (var i = 0; i < rules.length; i++) {
            var li = document.createElement('li');
            li.innerHTML = '<span class="arrow">›</span> ' + rules[i];
            rulesList.appendChild(li);
        }
        rulesBody.appendChild(rulesList);
        rightEl.appendChild(rulesPanel);
    }

    function renderRewardEmpty(container) {
        container.innerHTML = '';
        var empty = document.createElement('div');
        empty.className = 'reward-empty';

        var icon = document.createElement('div');
        icon.className = 'reward-empty-icon';
        icon.innerHTML = '<span class="material-symbols-outlined" style="font-size:2rem;">emoji_events</span>';
        empty.appendChild(icon);

        var text = document.createElement('div');
        text.className = 'reward-empty-text';
        text.textContent = 'No trophy assigned';
        empty.appendChild(text);

        var btn = document.createElement('button');
        btn.className = 'btn-devclimb secondary';
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">add</span> CREATE TROPHY';
        btn.addEventListener('click', showTrophyPopup);
        empty.appendChild(btn);

        container.appendChild(empty);
    }

    function renderRewardFilled(container) {
        container.innerHTML = '';
        container.style.textAlign = 'center';

        if (state.trophy.avatar) {
            var img = document.createElement('img');
            img.className = 'reward-image';
            img.src = state.trophy.avatar;
            img.alt = state.trophy.name;
            container.appendChild(img);
        }

        var rName = document.createElement('div');
        rName.className = 'reward-name';
        rName.textContent = state.trophy.name;
        container.appendChild(rName);

        if (state.trophy.content) {
            var rDesc = document.createElement('div');
            rDesc.className = 'reward-desc';
            rDesc.textContent = state.trophy.content;
            container.appendChild(rDesc);
        }

        var changeLink = document.createElement('div');
        changeLink.className = 'reward-change';
        changeLink.textContent = 'CHANGE TROPHY';
        changeLink.addEventListener('click', showTrophyPopup);
        container.appendChild(changeLink);
    }

    // ── Trophy Popup ──

    function showTrophyPopup() {
        var trophyFileInput = document.getElementById('trophy-avatar-input');
        trophyFileInput.value = '';
        var uploadedAvatarUrl = (state.trophy && state.trophy.avatar) || null;

        Popup.open({
            id: 'trophy-popup',
            size: 'md',
            title: state.trophy ? 'Edit Trophy' : 'Create Trophy',
            render: function (ctx) {
                ctx.body.style.display = 'flex';
                ctx.body.style.flexDirection = 'column';
                ctx.body.style.gap = 'var(--space-16px)';

                var nameInput = buildInput('Trophy Name', 'text', true);
                nameInput.input.value = (state.trophy && state.trophy.name) || '';

                var contentTextarea = buildTextarea('Description');
                contentTextarea.input.value = (state.trophy && state.trophy.content) || '';

                var avatarWrap = document.createElement('div');
                var avatarLabel = document.createElement('span');
                avatarLabel.style.cssText = 'font-size:0.6875rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-muted);';
                avatarLabel.textContent = 'TROPHY AVATAR';

                var avatarRow = document.createElement('div');
                avatarRow.className = 'trophy-avatar-upload';

                var preview = document.createElement('div');
                preview.className = 'trophy-avatar-preview';
                if (uploadedAvatarUrl) {
                    var previewImg = document.createElement('img');
                    previewImg.src = uploadedAvatarUrl;
                    preview.appendChild(previewImg);
                } else {
                    var placeholder = document.createElement('div');
                    placeholder.className = 'trophy-avatar-placeholder';
                    placeholder.innerHTML = '<span class="material-symbols-outlined" style="font-size:1.5rem;">emoji_events</span>';
                    preview.appendChild(placeholder);
                }

                var uploadBtn = document.createElement('div');
                uploadBtn.className = 'trophy-avatar-upload-btn';
                uploadBtn.textContent = uploadedAvatarUrl ? 'CHANGE IMAGE' : 'UPLOAD IMAGE';
                uploadBtn.addEventListener('click', function () { trophyFileInput.click(); });

                avatarRow.appendChild(preview);
                avatarRow.appendChild(uploadBtn);
                avatarWrap.appendChild(avatarLabel);
                avatarWrap.appendChild(avatarRow);

                trophyFileInput.onchange = async function () {
                    var file = this.files[0];
                    if (!file) return;
                    uploadBtn.textContent = 'UPLOADING...';
                    var uploadRes = await apiUpload('/upload/contest-avatar', file);
                    if (uploadRes && uploadRes.url) {
                        uploadedAvatarUrl = uploadRes.url;
                        preview.innerHTML = '';
                        var img = document.createElement('img');
                        img.src = uploadRes.url;
                        preview.appendChild(img);
                        uploadBtn.textContent = 'CHANGE IMAGE';
                    } else {
                        uploadBtn.textContent = 'UPLOAD IMAGE';
                    }
                    this.value = '';
                };

                ctx.body.appendChild(nameInput.el);
                ctx.body.appendChild(avatarWrap);
                ctx.body.appendChild(contentTextarea.el);

                ctx.footer.style.display = '';
                var submitBtn = document.createElement('button');
                submitBtn.className = 'btn-devclimb primary';
                submitBtn.textContent = state.trophy ? 'UPDATE' : 'CREATE';
                submitBtn.addEventListener('click', async function () {
                    var name = nameInput.input.value.trim();
                    if (!name) { nameInput.input.focus(); return; }

                    var body = { name: name };
                    if (uploadedAvatarUrl) body.avatar = uploadedAvatarUrl;
                    if (contentTextarea.input.value.trim()) body.content = contentTextarea.input.value.trim();

                    submitBtn.disabled = true;
                    submitBtn.textContent = 'CREATING...';
                    var res = await apiPost('/admin/trophy', body);
                    if (res && res.id) {
                        state.trophyId = res.id;
                        state.trophy = { id: res.id, name: body.name, avatar: body.avatar || null, content: body.content || null };
                        var rewardBody = document.getElementById('reward-body');
                        renderRewardFilled(rewardBody);
                        ctx.close();
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.textContent = state.trophy ? 'UPDATE' : 'CREATE';
                    }
                });
                ctx.footer.appendChild(submitBtn);

                var cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn-devclimb secondary';
                cancelBtn.textContent = 'CANCEL';
                cancelBtn.addEventListener('click', function () { ctx.close(); });
                ctx.footer.appendChild(cancelBtn);
            }
        });
    }

    // ── Banner Upload ──

    function wireBannerUpload() {
        var uploadZone = document.getElementById('banner-upload-zone');
        if (uploadZone) uploadZone.addEventListener('click', function () { fileInput.click(); });

        fileInput.addEventListener('change', async function () {
            var file = this.files[0];
            if (!file) return;

            var uploadRes = await apiUpload('/upload/contest-avatar', file);
            if (uploadRes && uploadRes.url) {
                state.avatar = uploadRes.url;
                renderBannerImage(uploadRes.url);
            }
            this.value = '';
        });
    }

    function renderBannerImage(url) {
        var banner = document.getElementById('banner-container');
        banner.innerHTML = '';

        var img = document.createElement('img');
        img.src = url;
        img.alt = 'Contest banner';
        banner.appendChild(img);

        var overlay = document.createElement('div');
        overlay.className = 'banner-edit-overlay';
        overlay.innerHTML = '<span>CHANGE BANNER</span>';
        overlay.addEventListener('click', function () { fileInput.click(); });
        banner.appendChild(overlay);

        var gradient = document.createElement('div');
        gradient.className = 'banner-gradient';
        banner.appendChild(gradient);
    }

    // ── Save Bar ──

    function wireSaveBar() {
        document.getElementById('cancel-btn').addEventListener('click', function () {
            if (state.editId) {
                window.location.href = '/frontend/pages/user/contest-solve/index.html?id=' + state.editId;
            } else {
                window.location.href = '/frontend/pages/user/contest/index.html';
            }
        });

        document.getElementById('save-btn').addEventListener('click', handleSave);
    }

    function wireDeleteBtn() {
        document.getElementById('delete-btn').addEventListener('click', function () {
            if (!state.editId) return;
            Popup.confirm({
                message: 'Delete this contest? This cannot be undone.',
                okLabel: 'DELETE',
                okClass: 'btn-devclimb danger',
                onConfirm: async function () {
                    var res = await apiDelete('/admin/contest?id=' + state.editId);
                    window.location.href = '/frontend/pages/user/contest/index.html';
                }
            });
        });
    }

    async function handleSave() {
        var title = state.title.trim();
        if (!title) {
            var titleInput = document.querySelector('.editable-title');
            if (titleInput) titleInput.focus();
            return;
        }

        var saveBtn = document.getElementById('save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = state.editId ? 'UPDATING...' : 'CREATING...';

        var body = { title: title };
        if (state.content.trim()) body.content = state.content.trim();
        if (state.avatar) body.avatar = state.avatar;
        if (state.endDate) body.end = state.endDate.replace('T', ' ') + ':00';
        if (state.trophyId) body.trophyId = state.trophyId;
        if (state.puzzles.length > 0) {
            body.puzzleIds = state.puzzles.map(function (p) { return p.id; });
        }

        var res;
        if (state.editId) {
            res = await apiPut('/admin/contest?id=' + state.editId, body);
        } else {
            res = await apiPost('/admin/contest', body);
        }

        if (res && (res.id || res.message)) {
            var targetId = state.editId || res.id;
            window.location.href = '/frontend/pages/user/contest-solve/index.html?id=' + targetId;
        } else {
            saveBtn.disabled = false;
            saveBtn.innerHTML = state.editId
                ? '<span class="material-symbols-outlined" style="font-size:1rem;">save</span> UPDATE CONTEST'
                : '<span class="material-symbols-outlined" style="font-size:1rem;">add</span> CREATE CONTEST';
        }
    }

    // ── Utilities ──

    function updateDuration() {
        var durationEl = document.querySelector('#sys-info-body .sidebar-row .value');
        if (!durationEl) return;
        if (!state.endDate) {
            durationEl.textContent = '—';
            return;
        }
        var end = new Date(state.endDate);
        var now = new Date();
        var ms = end - now;
        if (ms <= 0) {
            durationEl.textContent = 'Ended';
            return;
        }
        var days = Math.floor(ms / 86400000);
        if (days >= 1) { durationEl.textContent = days + ' day' + (days > 1 ? 's' : ''); return; }
        var hours = Math.floor(ms / 3600000);
        durationEl.textContent = hours + ' hour' + (hours > 1 ? 's' : '');
    }

    function buildInput(label, type, required) {
        var wrap = document.createElement('label');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-4px);';
        var lbl = document.createElement('span');
        lbl.style.cssText = 'font-size:0.6875rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-muted);';
        lbl.textContent = label;
        wrap.appendChild(lbl);
        var input = document.createElement('input');
        input.type = type;
        input.required = required;
        input.style.cssText = 'background:var(--bg-base);border:1px solid var(--border-default);color:var(--text-primary);padding:var(--space-8px);font-family:var(--font-mono);font-size:0.8125rem;width:100%;';
        wrap.appendChild(input);
        return { el: wrap, input: input };
    }

    function buildTextarea(label) {
        var wrap = document.createElement('label');
        wrap.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-4px);';
        var lbl = document.createElement('span');
        lbl.style.cssText = 'font-size:0.6875rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-muted);';
        lbl.textContent = label;
        wrap.appendChild(lbl);
        var textarea = document.createElement('textarea');
        textarea.rows = 3;
        textarea.style.cssText = 'background:var(--bg-base);border:1px solid var(--border-default);color:var(--text-primary);padding:var(--space-8px);font-family:var(--font-mono);font-size:0.8125rem;width:100%;resize:vertical;';
        wrap.appendChild(textarea);
        return { el: wrap, input: textarea };
    }

    // ── Start (wait for deps: api.js, authService.js) ──

    window.addEventListener('deps-ready', init);

})();
