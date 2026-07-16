// Team table component — paginated card grid with search, sort, and order controls
(function () {

    var style = document.createElement('style');
    style.id = 'team-table-injected';
    style.textContent = `
        /* --- Team Table: Search & Sort --- */
        .tt-search-box {
            display: flex;
            width: 100%;
            margin-bottom: 10px;
        }
        .tt-search-box input {
            flex: 1;
            min-width: 0;
            padding: 10px 15px;
            border-radius: 8px 0 0 8px;
            border: 1px solid var(--border-input);
            background: var(--bg-input);
            color: var(--text-primary);
        }
        .tt-search-box button {
            width: 55px;
            flex-shrink: 0;
            border-radius: 0 8px 8px 0;
            border: 1px solid var(--border-input);
            background: var(--bg-input);
            color: var(--text-primary);
            cursor: pointer;
        }
        .tt-search-box button:hover {
            background: var(--bg-hover);
            color: var(--accent);
        }
        .tt-filter-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .tt-filter-row .dropdown .btn {
            background: var(--bg-input);
            color: var(--text-primary);
            border: 1px solid var(--border-input);
            border-radius: 8px;
            min-width: 8rem;
            text-align: left;
            position: relative;
            padding-right: 20px;
        }
        .tt-filter-row .dropdown .btn:hover,
        .tt-filter-row .dropdown .btn:focus,
        .tt-filter-row .dropdown .btn:active,
        .tt-filter-row .dropdown .btn.show {
            background: var(--bg-input);
            color: var(--text-primary);
            border-color: var(--border-input);
            box-shadow: none;
        }
        .tt-filter-row .dropdown .btn::after {
            content: "";
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            border-top: 0.3em solid;
            border-right: 0.3em solid transparent;
            border-left: 0.3em solid transparent;
            border-bottom: 0;
        }
        .tt-filter-row .dropdown .btn.show::after {
            border-top: 0;
            border-bottom: 0.3em solid;
        }
        .tt-filter-row .dropdown-menu {
            background: var(--bg-input);
            border: 1px solid var(--border-input);
            border-radius: 8px;
            padding: 6px;
            min-width: 100%;
            width: 8rem;
        }
        .tt-filter-row .dropdown-menu.show {
            animation: ttDropdownIn 0.2s ease forwards;
        }
        .tt-filter-row .dropdown-menu .dropdown-item {
            color: var(--text-primary);
            border-radius: 6px;
            transition: background 0.2s ease, transform 0.15s ease, color 0.2s ease;
            text-align: center;
            padding: 4px 8px;
        }
        .tt-filter-row .dropdown-menu .dropdown-item:hover,
        .tt-filter-row .dropdown-menu .dropdown-item:focus {
            background: var(--bg-hover);
            color: var(--accent);
            cursor: pointer;
        }
        .tt-filter-row .dropdown-menu .dropdown-item:active {
            background: var(--bg-active);
            color: var(--text-primary);
        }

        /* --- Team Table: Card Grid --- */
        .tt-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-top: 10px;
        }
        .tt-card {
            text-decoration: none;
            color: var(--text-primary);
        }
        .tt-card .glass-box {
            height: 100%;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .tt-card:hover .glass-box {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }
        .tt-card-avatar {
            width: 100%;
            aspect-ratio: 1/1;
            object-fit: cover;
            border-radius: 12px;
        }
        .tt-card-avatar-fallback {
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
        .tt-card-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
            margin-bottom: 6px;
            min-width: 0;
        }
        .tt-card-name {
            font-weight: 600;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .tt-card-meta {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .tt-card-meta i {
            font-size: 14px;
            flex-shrink: 0;
        }
        .tt-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .tt-badge-public {
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
        }
        .tt-badge-private {
            background: rgba(156, 163, 175, 0.15);
            color: #9ca3af;
        }

        /* --- Team Table: Empty State --- */
        .tt-empty {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-secondary);
        }

        /* --- Team Table: Pagination --- */
        .tt-pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 25px;
        }
        .tt-page {
            padding: 6px 12px;
            border: 1px solid var(--border-input);
            border-radius: 6px;
            background: transparent;
            color: var(--text-primary);
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .tt-page:hover {
            background: var(--accent-hover);
            color: var(--text-on-accent);
        }
        .tt-page.tt-active {
            background: var(--accent-hover);
            color: var(--text-on-accent);
            font-weight: 600;
        }

        /* --- Team Table: Animations --- */
        @keyframes ttDropdownIn {
            from { opacity: 0; transform: translateY(-8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ttCardIn {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .tt-card {
            animation: ttCardIn 0.4s ease backwards;
        }
        .tt-card:nth-child(1)  { animation-delay: 0s; }
        .tt-card:nth-child(2)  { animation-delay: 0.04s; }
        .tt-card:nth-child(3)  { animation-delay: 0.08s; }
        .tt-card:nth-child(4)  { animation-delay: 0.12s; }
        .tt-card:nth-child(5)  { animation-delay: 0.16s; }
        .tt-card:nth-child(6)  { animation-delay: 0.2s; }
        .tt-card:nth-child(7)  { animation-delay: 0.24s; }
        .tt-card:nth-child(8)  { animation-delay: 0.28s; }

        /* --- Team Table: Responsive --- */
        @media (max-width: 991px) {
            .tt-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        @media (max-width: 768px) {
            .tt-filter-row {
                flex-wrap: wrap;
            }
            .tt-filter-row .dropdown {
                width: 100%;
            }
            .tt-filter-row .dropdown .btn {
                width: 100%;
            }
            .tt-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        @media (max-width: 480px) {
            .tt-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);

    function TeamTable(containerId, options) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.opts = Object.assign({
            searchPlaceholder: 'Search teams...',
            sortByOptions: [],
            sortByLabel: 'Sort by',
            orderOptions: [],
            orderLabel: 'Order',
            urlTemplate: null,
            onSearch: function () {},
            onSort: function () {},
            onPageChange: function () {}
        }, options || {});

        this._search = '';
        this._sortBy = '';
        this._order = '';
        this._page = 1;
        this._totalPages = 1;

        this._build();
    }

    TeamTable.prototype._build = function () {
        var self = this;
        var id = this.container.id;
        this.container.innerHTML = '';

        // Search box
        var searchBox = document.createElement('div');
        searchBox.className = 'tt-search-box input-group';

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.placeholder = this.opts.searchPlaceholder;
        input.id = 'tt-input-' + id;
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

        // Filter row (sort dropdowns)
        if (this.opts.sortByOptions.length > 0) {
            var filterRow = document.createElement('div');
            filterRow.className = 'tt-filter-row';

            function buildDropdown(options, label, onSelect) {
                var dropdown = document.createElement('div');
                dropdown.className = 'dropdown';

                var toggle = document.createElement('button');
                toggle.className = 'btn btn-secondary dropdown-toggle';
                toggle.type = 'button';
                toggle.setAttribute('data-bs-toggle', 'dropdown');
                toggle.textContent = label;

                var menu = document.createElement('ul');
                menu.className = 'dropdown-menu';

                var noneLi = document.createElement('li');
                var noneA = document.createElement('a');
                noneA.className = 'dropdown-item';
                noneA.textContent = 'None';
                noneA.addEventListener('click', function () {
                    toggle.textContent = label;
                    onSelect('');
                });
                noneLi.appendChild(noneA);
                menu.appendChild(noneLi);

                for (var i = 0; i < options.length; i++) {
                    (function (opt) {
                        var li = document.createElement('li');
                        var a = document.createElement('a');
                        a.className = 'dropdown-item';
                        a.textContent = opt.label;
                        a.addEventListener('click', function () {
                            toggle.textContent = opt.label;
                            onSelect(opt.value);
                        });
                        li.appendChild(a);
                        menu.appendChild(li);
                    })(options[i]);
                }

                dropdown.appendChild(toggle);
                dropdown.appendChild(menu);
                return dropdown;
            }

            this._sortByBtn = buildDropdown(this.opts.sortByOptions, this.opts.sortByLabel, function (val) {
                self._sortBy = val;
                self.opts.onSort(self._sortBy, self._order);
            });
            filterRow.appendChild(this._sortByBtn);

            if (this.opts.orderOptions.length > 0) {
                this._orderBtn = buildDropdown(this.opts.orderOptions, this.opts.orderLabel, function (val) {
                    self._order = val;
                    self.opts.onSort(self._sortBy, self._order);
                });
                filterRow.appendChild(this._orderBtn);
            }

            this.container.appendChild(filterRow);
        }

        // Card grid container
        this._gridEl = document.createElement('div');
        this._gridEl.className = 'tt-grid';
        this._gridEl.id = 'tt-grid-' + id;
        this.container.appendChild(this._gridEl);

        // Pagination container
        this._paginationEl = document.createElement('div');
        this._paginationEl.className = 'tt-pagination';
        this._paginationEl.id = 'tt-pagination-' + id;
        this.container.appendChild(this._paginationEl);
    };

    TeamTable.prototype._doSearch = function () {
        var input = document.getElementById('tt-input-' + this.container.id);
        this._search = input ? input.value.trim() : '';
        this.opts.onSearch(this._search);
    };

    TeamTable.prototype.getSearchTerm = function () { return this._search; };
    TeamTable.prototype.getSortBy = function () { return this._sortBy; };
    TeamTable.prototype.getOrder = function () { return this._order; };
    TeamTable.prototype.getCurrentPage = function () { return this._page; };

    TeamTable.prototype.setData = function (response) {
        if (!response || !response.data) return;
        this._page = response.pagination.page;
        this._totalPages = response.pagination.totalPages;
        this._renderCards(response.data);
        this._renderPagination();
    };

    TeamTable.prototype._renderCards = function (data) {
        showSpinner(this._gridEl.id);
        var grid = this._gridEl;
        grid.innerHTML = '';

        if (!data || data.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'tt-empty';
            empty.textContent = 'No teams found.';
            grid.appendChild(empty);
            hideSpinner(this._gridEl.id);
            return;
        }

        var urlTpl = this.opts.urlTemplate;

        for (var i = 0; i < data.length; i++) {
            var item = data[i];

            var cardWrap = document.createElement('a');
            cardWrap.className = 'tt-card';
            if (urlTpl) cardWrap.href = urlTpl + item.id;

            var card = document.createElement('div');
            card.className = 'glass-box p-3';

            // Avatar
            if (item.avatar) {
                var img = document.createElement('img');
                img.src = item.avatar;
                img.alt = item.name || '';
                img.className = 'tt-card-avatar';
                card.appendChild(img);
            } else {
                var fallback = document.createElement('div');
                fallback.className = 'tt-card-avatar-fallback';
                fallback.innerHTML = '<i class="bi bi-people-fill"></i>';
                card.appendChild(fallback);
            }

            // Name + badge row
            var header = document.createElement('div');
            header.className = 'tt-card-header';

            var name = document.createElement('h5');
            name.className = 'tt-card-name';
            name.textContent = item.name || '';
            header.appendChild(name);

            var badge = document.createElement('span');
            badge.className = 'tt-badge ' + (item.isPublic ? 'tt-badge-public' : 'tt-badge-private');
            badge.textContent = item.isPublic ? 'Public' : 'Private';
            header.appendChild(badge);

            card.appendChild(header);

            // Members
            var members = document.createElement('p');
            members.className = 'tt-card-meta mb-1';
            members.innerHTML = '<i class="bi bi-people-fill"></i> ' + (item.memberCount != null ? item.memberCount : '0') + ' Members';
            card.appendChild(members);

            // Solved
            var solved = document.createElement('p');
            solved.className = 'tt-card-meta mb-2';
            solved.innerHTML = '<i class="bi bi-puzzle-fill"></i> ' + (item.totalSolved != null ? item.totalSolved.toLocaleString() : '0') + ' Solved';
            card.appendChild(solved);

            cardWrap.appendChild(card);
            grid.appendChild(cardWrap);
        }

        hideSpinner(this._gridEl.id);
    };

    TeamTable.prototype._renderPagination = function () {
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
            a.className = 'tt-page';
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
                a.className = 'tt-page';
                if (pageNum === current) a.classList.add('tt-active');
                a.textContent = pageNum;
                a.addEventListener('click', function () { self.opts.onPageChange(pageNum); });
                pag.appendChild(a);
            })(i);
        }

        addBtn('Next', current >= total, function () { self.opts.onPageChange(current + 1); });
        addBtn('Last', current >= total, function () { self.opts.onPageChange(total); });
    };

    window.TeamTable = {
        init: function (containerId, options) {
            return new TeamTable(containerId, options);
        }
    };

})();
