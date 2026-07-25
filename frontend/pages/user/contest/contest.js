// Contest page orchestrator — renders contest cards, search, pagination, hall of fame
(function () {

    var gridEl = document.getElementById('contest-grid');
    var pagEl = document.getElementById('contest-pagination');
    var hallEl = document.getElementById('hall-of-fame');

    var currentPage = 1;
    var currentSearch = '';
    var totalPages = 1;
    var _isAdmin = false;

    // ── Contest Cards ──

    function renderContests(data) {
        gridEl.innerHTML = '';

        if (!data || data.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'tt-empty';
            empty.textContent = 'No contests found.';
            gridEl.appendChild(empty);
            return;
        }

        for (var i = 0; i < data.length; i++) {
            var c = data[i];

            var card = document.createElement('a');
            card.className = 'tt-card';
            card.href = '/frontend/pages/user/contest-solve/?id=' + c.id;

            var box = document.createElement('div');
            box.className = 'glass-box p-3';

            if (c.trophyAvatar) {
                var img = document.createElement('img');
                img.src = c.trophyAvatar;
                img.alt = c.trophyName || '';
                img.className = 'tt-card-avatar';
                box.appendChild(img);
            } else {
                var fallback = document.createElement('div');
                fallback.className = 'tt-card-avatar-fallback';
                fallback.innerHTML = '<span class="material-symbols-outlined">emoji_events</span>';
                box.appendChild(fallback);
            }

            var header = document.createElement('div');
            header.className = 'tt-card-header';

            var title = document.createElement('h5');
            title.className = 'tt-card-name';
            title.textContent = c.title || '';
            header.appendChild(title);

            var badge = document.createElement('span');
            badge.className = 'tt-badge ' + (c.status === 'active' ? 'tt-badge-public' : 'tt-badge-private');
            badge.textContent = c.status || 'ended';
            header.appendChild(badge);

            box.appendChild(header);

            var authorRow = document.createElement('p');
            authorRow.className = 'tt-card-meta mb-1';
            var authorAvatar = Avatar.render({ size: 18, avatar: c.authorAvatar || null, isAdmin: !!c.authorIsAdmin });
            authorRow.appendChild(authorAvatar);
            var authorText = document.createElement('span');
            authorText.textContent = ' ' + (c.authorName || 'Unknown');
            authorRow.appendChild(authorText);
            box.appendChild(authorRow);

            if (c.start) {
                var dateRow = document.createElement('p');
                dateRow.className = 'tt-card-meta mb-1';
                dateRow.innerHTML = '<i class="bi bi-calendar-event"></i> ' + formatDateRange(c.start, c.end);
                box.appendChild(dateRow);
            }

            var problemRow = document.createElement('p');
            problemRow.className = 'tt-card-meta mb-2';
            problemRow.innerHTML = '<i class="bi bi-code-slash"></i> ' + (c.problemCount || 0) + ' puzzles';
            box.appendChild(problemRow);

            card.appendChild(box);
            gridEl.appendChild(card);
        }
    }

    function formatDateRange(start, end) {
        var s = new Date(start);
        var opts = { month: 'short', day: 'numeric', year: 'numeric' };
        var str = s.toLocaleDateString('en-US', opts);
        if (end) {
            var e = new Date(end);
            str += ' – ' + e.toLocaleDateString('en-US', opts);
        }
        return str;
    }

    // ── Pagination ──

    function renderPagination() {
        pagEl.innerHTML = '';

        var start = Math.max(1, currentPage - 1);
        var end = Math.min(totalPages, currentPage + 1);
        if (end - start < 2) {
            if (start === 1) end = Math.min(3, totalPages);
            else start = Math.max(1, totalPages - 2);
        }

        function addBtn(text, disabled, onClick) {
            var a = document.createElement('a');
            a.className = 'tt-page';
            a.textContent = text;
            if (disabled) {
                a.style.opacity = '0.4';
                a.style.pointerEvents = 'none';
            }
            a.addEventListener('click', onClick);
            pagEl.appendChild(a);
        }

        addBtn('First', currentPage <= 1, function () { loadContests(1); });
        addBtn('Prev', currentPage <= 1, function () { loadContests(currentPage - 1); });

        for (var i = start; i <= end; i++) {
            (function (pageNum) {
                var a = document.createElement('a');
                a.className = 'tt-page';
                if (pageNum === currentPage) a.classList.add('tt-active');
                a.textContent = pageNum;
                a.addEventListener('click', function () { loadContests(pageNum); });
                pagEl.appendChild(a);
            })(i);
        }

        addBtn('Next', currentPage >= totalPages, function () { loadContests(currentPage + 1); });
        addBtn('Last', currentPage >= totalPages, function () { loadContests(totalPages); });
    }

    // ── Search ──

    var searchInput = document.getElementById('contest-search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                currentSearch = searchInput.value.trim();
                loadContests(1);
            }
        });
    }

    // ── Load Contests ──

    async function loadContests(page) {
        showSpinner('contest-grid');
        var res = await getContests(page || 1, currentSearch);
        hideSpinner('contest-grid');
        if (res && res.data) {
            currentPage = res.pagination.page;
            totalPages = res.pagination.totalPages;
            renderContests(res.data);
            renderPagination();
        }
    }

    // ── Admin: Create Contest ──

    function showCreateButton() {
        var wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:var(--space-16px);';
        var btn = document.createElement('button');
        btn.className = 'btn-devclimb primary';
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">add</span> Create Contest';
        btn.addEventListener('click', showCreatePopup);
        wrap.appendChild(btn);
        gridEl.parentElement.insertBefore(wrap, gridEl);
    }

    async function showCreatePopup() {
        var trophies = [];
        try {
            var tRes = await apiGet('/admin/trophies?limit=100');
            if (tRes && tRes.data) trophies = tRes.data;
        } catch (e) {}

        Popup.open({
            id: 'create-contest-popup',
            size: 'md',
            title: 'Create Contest',
            render: function (ctx) {
                ctx.body.style.display = 'flex';
                ctx.body.style.flexDirection = 'column';
                ctx.body.style.gap = 'var(--space-12px)';

                var titleInput = buildInput('Title', 'text', true);
                var contentInput = buildTextarea('Description');
                var avatarInput = buildInput('Avatar URL', 'text', false);
                var endDateInput = buildInput('End Date', 'datetime-local', false);

                var trophyLabel = document.createElement('label');
                trophyLabel.style.cssText = 'font-size:0.6875rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-muted);';
                trophyLabel.textContent = 'Trophy';
                var trophySelect = document.createElement('select');
                trophySelect.style.cssText = 'background:var(--bg-base);border:1px solid var(--border-default);color:var(--text-primary);padding:var(--space-8px);font-family:var(--font-mono);font-size:0.8125rem;width:100%;';
                var defaultOpt = document.createElement('option');
                defaultOpt.value = '';
                defaultOpt.textContent = '— None —';
                trophySelect.appendChild(defaultOpt);
                for (var i = 0; i < trophies.length; i++) {
                    var opt = document.createElement('option');
                    opt.value = trophies[i].id;
                    opt.textContent = trophies[i].name || ('Trophy #' + trophies[i].id);
                    trophySelect.appendChild(opt);
                }
                trophyLabel.appendChild(trophySelect);

                ctx.body.appendChild(titleInput.el);
                ctx.body.appendChild(contentInput.el);
                ctx.body.appendChild(avatarInput.el);
                ctx.body.appendChild(endDateInput.el);
                ctx.body.appendChild(trophyLabel);

                ctx.footer.style.display = '';
                var submitBtn = document.createElement('button');
                submitBtn.className = 'btn-devclimb primary';
                submitBtn.textContent = 'CREATE';
                submitBtn.addEventListener('click', async function () {
                    var title = titleInput.input.value.trim();
                    if (!title) { titleInput.input.focus(); return; }

                    var body = { title: title };
                    if (contentInput.input.value.trim()) body.content = contentInput.input.value.trim();
                    if (avatarInput.input.value.trim()) body.avatar = avatarInput.input.value.trim();
                    if (endDateInput.input.value) body.end = endDateInput.input.value.replace('T', ' ') + ':00';

                    var trophyId = trophySelect.value;
                    if (trophyId) body.trophyId = parseInt(trophyId);

                    submitBtn.disabled = true;
                    submitBtn.textContent = 'CREATING...';
                    var res = await apiPost('/admin/contest', body);
                    if (res && res.id) {
                        ctx.close();
                        loadContests(1);
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'CREATE';
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

    // ── Hall of Fame ──

    function renderHallOfFame(data) {
        if (!data) return;
        var html = '';

        var standardBoards = [
            { title: 'Speed Champions', icon: 'speed', entries: data.speedChampions || [], valueKey: 'value', extraKey: 'contest' },
            { title: 'Contest Veterans', icon: 'flag', entries: data.contestVeterans || [], valueKey: 'value', extraKey: null }
        ];

        for (var b = 0; b < standardBoards.length; b++) {
            var board = standardBoards[b];
            html += '<div class="hall-fame-card">';
            html += '<div class="hall-fame-header">';
            html += '<span class="material-symbols-outlined trophy-icon">' + board.icon + '</span>';
            html += '<h3>' + board.title + '</h3>';
            html += '</div>';
            for (var i = 0; i < board.entries.length; i++) {
                var e = board.entries[i];
                var rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                html += '<div class="hall-fame-entry">';
                html += '<span class="rank ' + rankClass + '">#' + (i + 1) + '</span>';
                html += '<div class="avatar-sm"><span class="material-symbols-outlined" style="font-size:0.875rem;">person</span></div>';
                html += '<div style="flex:1;min-width:0;">';
                html += '<span class="entry-name">' + (e.name || '') + '</span>';
                if (board.extraKey && e[board.extraKey]) {
                    html += '<div style="font-size:0.625rem;color:var(--text-muted);letter-spacing:0.06em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + e[board.extraKey] + '</div>';
                }
                html += '</div>';
                html += '<span class="entry-value">' + (e.value || '') + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }

        var shortest = data.shortestSolves || [];
        html += '<div class="hall-fame-card shortest-card">';
        html += '<div class="hall-fame-header">';
        html += '<span class="material-symbols-outlined trophy-icon">code</span>';
        html += '<h3>Shortest Solves</h3>';
        html += '</div>';
        html += '<div class="solve-search">';
        html += '<input type="text" id="solve-search-input" placeholder="Search puzzles...">';
        html += '</div>';
        html += '<div class="hall-fame-body">';
        for (var j = 0; j < shortest.length; j++) {
            var s = shortest[j];
            html += '<div class="solve-entry" data-puzzle="' + (s.puzzle || '').toLowerCase() + '" data-author="' + (s.author || '').toLowerCase() + '">';
            html += '<div class="solve-entry-top">';
            html += '<span class="solve-entry-puzzle">' + (s.puzzle || '') + '</span>';
            html += '<span class="solve-entry-chars">' + (s.chars || 0) + ' chars</span>';
            html += '</div>';
            html += '<div class="solve-entry-author">' + (s.author || '') + '</div>';
            if (s.code) {
                html += '<pre class="solve-entry-code">' + s.code + '</pre>';
            } else {
                html += '<div class="solve-entry-locked">Solve to see the full solution</div>';
            }
            html += '</div>';
        }
        html += '</div></div>';

        hallEl.innerHTML = html;

        var solveSearch = document.getElementById('solve-search-input');
        if (solveSearch) {
            solveSearch.addEventListener('input', function () {
                var q = this.value.toLowerCase().trim();
                document.querySelectorAll('.solve-entry').forEach(function (el) {
                    var match = !q || el.dataset.puzzle.includes(q) || el.dataset.author.includes(q);
                    el.style.display = match ? '' : 'none';
                });
            });
        }
    }

    async function loadHallOfFame() {
        var res = await getHallOfFame();
        if (res) renderHallOfFame(res);
    }

    // ── Init ──

    if (typeof getMe === 'function') {
        getMe()
            .then(function (session) {
                if (session && session.userIsadmin) {
                    _isAdmin = true;
                    showCreateButton();
                }
            })
            .catch(function () {})
            .then(function () {
                loadContests(1);
                loadHallOfFame();
            });
    } else {
        loadContests(1);
        loadHallOfFame();
    }

})();
