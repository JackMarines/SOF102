// User table component — paginated card grid with search, configurable columns, and optional card context menus
(function () {

    var style = document.createElement('style');
    style.id = 'user-table-injected';
    style.textContent = `
        /* --- User Table: Search --- */
        .ut-search-box {
            display: flex;
            width: 100%;
            margin-bottom: 10px;
        }
        .ut-search-box input {
            flex: 1;
            min-width: 0;
            padding: 10px 15px;
            border-radius: 8px 0 0 8px;
            border: 1px solid var(--border-input);
            background: var(--bg-input);
            color: var(--text-primary);
        }
        .ut-search-box button {
            width: 55px;
            flex-shrink: 0;
            border-radius: 0 8px 8px 0;
            border: 1px solid var(--border-input);
            background: var(--bg-input);
            color: var(--text-primary);
            cursor: pointer;
        }
        .ut-search-box button:hover {
            background: var(--bg-hover);
            color: var(--accent);
        }

        /* --- User Table: Card Grid --- */
        .ut-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-top: 10px;
        }
        .ut-card {
            text-decoration: none;
            color: var(--text-primary);
            overflow: hidden;
        }
        .ut-card .glass-box {
            height: 100%;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ut-card:hover .glass-box {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }
        .ut-card-avatar {
            width: 100%;
            aspect-ratio: 1/1;
            object-fit: cover;
            border-radius: 12px;
        }
        .ut-card-avatar-fallback {
            width: 100%;
            aspect-ratio: 1/1;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-input);
            color: var(--text-secondary);
            font-size: 42px;
        }
        .ut-card-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
            margin-bottom: 6px;
            min-width: 0;
        }
        .ut-card-name {
            font-weight: 600;
            font-size: 14px;
            min-width: 0;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--text-primary) !important;
        }
        .ut-card-meta {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .ut-card-meta i {
            font-size: 14px;
            flex-shrink: 0;
        }

        /* --- User Table: Empty State --- */
        .ut-empty {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-secondary);
        }

        /* --- User Table: Pagination --- */
        .ut-pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 25px;
        }
        .ut-page {
            padding: 6px 12px;
            border: 1px solid var(--border-input);
            border-radius: 6px;
            background: transparent;
            color: var(--text-primary);
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .ut-page:hover {
            background: var(--accent-hover);
            color: var(--text-on-accent);
        }
        .ut-page.ut-active {
            background: var(--accent-hover);
            color: var(--text-on-accent);
            font-weight: 600;
        }

        /* --- User Table: Animations --- */
        @keyframes utFadeIn {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .ut-card {
            animation: utFadeIn 0.4s ease backwards;
        }
        .ut-card:nth-child(1) { animation-delay: 0s; }
        .ut-card:nth-child(2) { animation-delay: 0.04s; }
        .ut-card:nth-child(3) { animation-delay: 0.08s; }
        .ut-card:nth-child(4) { animation-delay: 0.12s; }
        .ut-card:nth-child(5) { animation-delay: 0.16s; }
        .ut-card:nth-child(6) { animation-delay: 0.2s; }
        .ut-card:nth-child(7) { animation-delay: 0.24s; }
        .ut-card:nth-child(8) { animation-delay: 0.28s; }

        /* --- User Table: Responsive --- */
        @media (max-width: 1199px) {
            .ut-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        @media (max-width: 991px) {
            .ut-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media (max-width: 576px) {
            .ut-grid {
                grid-template-columns: 1fr;
            }
        }

        /* --- User Table: Card Menu --- */
        .ut-card-wrap {
            position: relative;
        }
        .ut-card-menu-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 10;
            width: 30px;
            height: 30px;
            border: none;
            border-radius: 50%;
            background: transparent;
            color: var(--text-secondary);
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
        }
        .ut-card-menu-btn:hover {
            background: var(--bg-hover);
            color: var(--accent);
        }
        .ut-card-dropdown {
            position: absolute;
            top: 40px;
            right: 8px;
            z-index: 20;
            min-width: 160px;
            background: var(--bg-panel);
            border: 1px solid var(--border-input);
            border-radius: 8px;
            padding: 4px 0;
            display: none;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .ut-card-dropdown.show {
            display: block;
        }
        .ut-card-dropdown-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            font-size: 14px;
            color: var(--text-primary);
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.15s;
        }
        .ut-card-dropdown-item:hover {
            background: var(--bg-hover);
        }
        .ut-card-dropdown-item.text-danger {
            color: var(--danger) !important;
        }
    `;
    document.head.appendChild(style);

    function UserTable(containerId, options) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.opts = Object.assign({
            searchPlaceholder: 'Search users...',
            columns: [
                { key: 'user', label: 'User' },
                { key: 'group', label: 'Group' },
                { key: 'score', label: 'Score' },
                { key: 'admin', label: 'Admin' }
            ],
            urlTemplate: null,
            cardMenu: null,
            cardMenuFilter: null,
            onSearch: function () {},
            onPageChange: function () {}
        }, options || {});

        this._search = '';
        this._page = 1;
        this._totalPages = 1;

        this._build();
    }

    UserTable.prototype._build = function () {
        var self = this;
        var id = this.container.id;
        this.container.innerHTML = '';

        // Search box
        var searchBox = document.createElement('div');
        searchBox.className = 'ut-search-box input-group';

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.placeholder = this.opts.searchPlaceholder;
        input.id = 'ut-input-' + id;
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') self._doSearch();
        });

        var btn = document.createElement('button');
        btn.className = 'btn';
        btn.type = 'button';
        btn.innerHTML = '<i class="bi bi-search"></i>';
        btn.addEventListener('click', function () { self._doSearch(); });

        searchBox.appendChild(input);
        searchBox.appendChild(btn);
        this.container.appendChild(searchBox);

        // Card grid container
        this._gridEl = document.createElement('div');
        this._gridEl.className = 'ut-grid';
        this._gridEl.id = 'ut-grid-' + id;
        this.container.appendChild(this._gridEl);

        // Pagination container
        this._paginationEl = document.createElement('div');
        this._paginationEl.className = 'ut-pagination';
        this._paginationEl.id = 'ut-pagination-' + id;
        this.container.appendChild(this._paginationEl);

        // Close card dropdowns on outside click
        document.addEventListener('click', function () {
            self._gridEl.querySelectorAll('.ut-card-dropdown.show').forEach(function (el) {
                el.classList.remove('show');
            });
        });
    };

    UserTable.prototype._doSearch = function () {
        var input = document.getElementById('ut-input-' + this.container.id);
        this._search = input ? input.value.trim() : '';
        this.opts.onSearch(this._search);
    };

    UserTable.prototype.getSearchTerm = function () { return this._search; };
    UserTable.prototype.getCurrentPage = function () { return this._page; };

    UserTable.prototype.setData = function (response) {
        if (!response || !response.data) return;
        this._page = response.pagination.page;
        this._totalPages = response.pagination.totalPages;
        this._renderCards(response.data);
        this._renderPagination();
    };

    UserTable.prototype._renderCards = function (data) {
        showSpinner(this._gridEl.id);
        var grid = this._gridEl;
        grid.innerHTML = '';

        if (!data || data.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'ut-empty';
            empty.textContent = 'No users found.';
            grid.appendChild(empty);
            hideSpinner(this._gridEl.id);
            return;
        }

        var urlTpl = this.opts.urlTemplate;
        var cols = this.opts.columns;
        var cardMenu = this.opts.cardMenu;
        var cardMenuFilter = this.opts.cardMenuFilter;
        var self = this;

        for (var i = 0; i < data.length; i++) {
            var item = data[i];

            var cardWrap = document.createElement('a');
            cardWrap.className = 'ut-card';
            if (urlTpl) cardWrap.href = urlTpl + item.userId;

            var outerWrap = document.createElement('div');
            outerWrap.className = 'ut-card-wrap';

            var card = document.createElement('div');
            card.className = 'glass-box p-3';

            // Avatar (full width)
            card.appendChild(Avatar.render({
                size: 120,
                avatar: item.avatar,
                isAdmin: item.isAdmin
            }));

            // Name
            if (cols[0] && cols[0].key === 'user') {
                var header = document.createElement('div');
                header.className = 'ut-card-header';
                var name = document.createElement('h6');
                name.className = 'ut-card-name mb-0';
                name.textContent = item.displayName || '';
                header.appendChild(name);
                card.appendChild(header);
            }

            // Remaining columns as meta lines
            for (var c = 1; c < cols.length; c++) {
                var col = cols[c];
                var meta = document.createElement('div');
                meta.className = 'ut-card-meta';

                if (col.key === 'group') {
                    meta.innerHTML = '<i class="bi bi-people-fill"></i> ' + (item.groupName || '-');
                } else if (col.key === 'score') {
                    meta.innerHTML = '<i class="bi bi-star-fill"></i> ' + (item.totalScore != null ? item.totalScore.toLocaleString() : '0') + ' pts';
                } else if (col.key === 'puzzles') {
                    meta.innerHTML = '<i class="bi bi-puzzle-fill"></i> ' + (item.totalPuzzles != null ? item.totalPuzzles.toLocaleString() : '0') + ' solved';
                } else if (col.key === 'admin') {
                    if (item.isAdmin) {
                        meta.innerHTML = '<i class="bi bi-patch-check-fill text-info"></i> Admin';
                    } else {
                        meta.innerHTML = '<i class="bi bi-person"></i> Member';
                    }
                }

                card.appendChild(meta);
            }

            cardWrap.appendChild(card);

            // Card menu
            if (cardMenu && cardMenu.length > 0 && (!cardMenuFilter || cardMenuFilter(item))) {
                outerWrap.appendChild(cardWrap);

                var menuBtn = document.createElement('button');
                menuBtn.className = 'ut-card-menu-btn';
                menuBtn.innerHTML = '<i class="bi bi-three-dots-vertical"></i>';
                menuBtn.type = 'button';

                var dropdown = document.createElement('div');
                dropdown.className = 'ut-card-dropdown';

                for (var m = 0; m < cardMenu.length; m++) {
                    var mi = cardMenu[m];
                    var menuRow = document.createElement('div');
                    menuRow.className = 'ut-card-dropdown-item' + (mi.danger ? ' text-danger' : '');
                    menuRow.textContent = mi.label;
                    (function (menuItem, menuData) {
                        menuRow.addEventListener('click', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            dropdown.classList.remove('show');
                            if (menuItem.onClick) menuItem.onClick(menuData);
                        });
                    })(mi, item);
                    dropdown.appendChild(menuRow);
                }

                (function (btn, dd) {
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        // Close other dropdowns
                        grid.querySelectorAll('.ut-card-dropdown.show').forEach(function (el) {
                            if (el !== dd) el.classList.remove('show');
                        });
                        dd.classList.toggle('show');
                    });
                })(menuBtn, dropdown);

                outerWrap.appendChild(menuBtn);
                outerWrap.appendChild(dropdown);
                grid.appendChild(outerWrap);
            } else {
                grid.appendChild(cardWrap);
            }
        }

        hideSpinner(this._gridEl.id);
    };

    UserTable.prototype._renderPagination = function () {
        var self = this;
        var pag = this._paginationEl;
        pag.innerHTML = '';

        var current = this._page;
        var total = this._totalPages;

        var start = Math.max(1, current - 1);
        var end = Math.min(total, current + 1);
        if (end - start < 2) {
            if (start === 1) end = Math.min(3, total);
            else start = Math.max(1, total - 2);
        }

        function addBtn(text, disabled, onClick) {
            var a = document.createElement('a');
            a.className = 'ut-page';
            a.textContent = text;
            if (disabled) {
                a.style.opacity = '0.4';
                a.style.pointerEvents = 'none';
            }
            a.addEventListener('click', onClick);
            pag.appendChild(a);
        }

        addBtn('First', current <= 1, function () { self.opts.onPageChange(1); });
        addBtn('Prev', current <= 1, function () { self.opts.onPageChange(current - 1); });

        for (var i = start; i <= end; i++) {
            (function (pageNum) {
                var a = document.createElement('a');
                a.className = 'ut-page';
                if (pageNum === current) a.classList.add('ut-active');
                a.textContent = pageNum;
                a.addEventListener('click', function () { self.opts.onPageChange(pageNum); });
                pag.appendChild(a);
            })(i);
        }

        addBtn('Next', current >= total, function () { self.opts.onPageChange(current + 1); });
        addBtn('Last', current >= total, function () { self.opts.onPageChange(total); });
    };

    window.UserTable = {
        init: function (containerId, options) {
            return new UserTable(containerId, options);
        }
    };

})();
