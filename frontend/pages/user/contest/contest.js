// Contest page orchestrator — renders contest cards, search, pagination, hall of fame
(function () {

    var gridEl = document.getElementById('contest-grid');
    var pagEl = document.getElementById('contest-pagination');
    var hallEl = document.getElementById('hall-of-fame');

    var currentPage = 1;
    var currentSearch = '';
    var totalPages = 1;

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

            if (c.trophyImage) {
                var img = document.createElement('img');
                img.src = c.trophyImage;
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
            problemRow.innerHTML = '<i class="bi bi-code-slash"></i> ' + (c.problemCount || 0) + ' problems';
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
            var sRank = j === 0 ? 'gold' : j === 1 ? 'silver' : j === 2 ? 'bronze' : '';
            html += '<div class="solve-entry" data-puzzle="' + (s.puzzle || '').toLowerCase() + '" data-author="' + (s.author || '').toLowerCase() + '">';
            html += '<div class="solve-entry-top">';
            html += '<span class="rank ' + sRank + '">#' + (j + 1) + '</span>';
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

    loadContests(1);
    loadHallOfFame();

})();
