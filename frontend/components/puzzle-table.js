(function () {

    var style = document.createElement('style');
    style.id = 'puzzle-table-injected';
    style.textContent = `
        /* --- Puzzle Table: Search --- */
        .pt-search-box {
            display: flex;
            width: 100%;
            margin-bottom: 10px;
        }
        .pt-search-box input {
            flex: 1;
            min-width: 0;
            padding: 10px 15px;
            border-radius: 8px 0 0 8px;
            border: 1px solid var(--border-input);
            background: var(--bg-input);
            color: var(--text-primary);
        }
        .pt-search-box button {
            width: 55px;
            flex-shrink: 0;
            border-radius: 0 8px 8px 0;
            border: 1px solid var(--border-input);
            background: var(--bg-input);
            color: var(--text-primary);
            cursor: pointer;
        }
        .pt-search-box button:hover {
            background: var(--bg-hover);
            color: var(--accent);
        }

        /* --- Puzzle Table: Dropdown --- */
        .pt-filter-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .pt-filter-row .dropdown {
            margin-left: 0;
        }
        .pt-filter-row .dropdown .btn {
            background: var(--bg-input);
            color: var(--text-primary);
            border: 1px solid var(--border-input);
            border-radius: 8px;
            min-width: 8rem;
            text-align: left;
            position: relative;
            padding-right: 20px;
        }
        .pt-filter-row .dropdown .btn:hover,
        .pt-filter-row .dropdown .btn:focus,
        .pt-filter-row .dropdown .btn:active,
        .pt-filter-row .dropdown .btn.show {
            background: var(--bg-input);
            color: var(--text-primary);
            border-color: var(--border-input);
            box-shadow: none;
        }
        .pt-filter-row .dropdown .btn::after {
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
        .pt-filter-row .dropdown .btn.show::after {
            border-top: 0;
            border-bottom: 0.3em solid;
        }
        .pt-filter-row .dropdown-menu {
            background: var(--bg-input);
            border: 1px solid var(--border-input);
            border-radius: 8px;
            padding: 6px;
            min-width: 100%;
            width: 8rem;
            text-align: center;
        }
        .pt-filter-row .dropdown-menu.show {
            animation: ptDropdownIn 0.2s ease forwards;
        }
        .pt-filter-row .dropdown-item {
            color: var(--text-primary);
            border-radius: 6px;
            transition: background 0.2s ease, transform 0.15s ease, color 0.2s ease;
        }
        .pt-filter-row .dropdown-item:hover,
        .pt-filter-row .dropdown-item:focus {
            background: var(--bg-hover);
            color: var(--accent);
            cursor: pointer;
        }
        .pt-filter-row .dropdown-item:active {
            background: var(--bg-active);
            color: var(--text-primary);
        }

        /* --- Puzzle Table: Header & Rows --- */
        .pt-table-header {
            display: grid;
            grid-template-columns: var(--pt-grid);
            padding: 12px 20px;
            font-weight: 600;
            color: var(--text-table-header);
            border-bottom: 1px solid var(--header-border);
        }
        .pt-list {
            margin-top: 10px;
        }
        .pt-row {
            display: grid;
            grid-template-columns: var(--pt-grid);
            padding: 14px 20px;
            border-bottom: 1px solid var(--row-border);
            transition: 0.2s;
            text-decoration: none;
            color: var(--text-primary);
        }
        .pt-row:hover {
            background: var(--row-hover);
        }
        .pt-row-title {
            text-align: left;
            font-weight: 400;
        }
        .pt-row-easy { color: #22c55e; }
        .pt-row-medium { color: #fbbf24; }
        .pt-row-hard { color: #ef4444; }

        /* --- Puzzle Table: Pagination --- */
        .pt-pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 25px;
        }
        .pt-page {
            padding: 6px 12px;
            border: 1px solid var(--border-input);
            border-radius: 6px;
            background: transparent;
            color: var(--text-primary);
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .pt-page:hover {
            background: var(--accent-hover);
            color: var(--text-on-accent);
        }
        .pt-page.pt-active {
            background: var(--accent-hover);
            color: var(--text-on-accent);
            font-weight: 600;
        }

        /* --- Puzzle Table: Animations --- */
        @keyframes ptDropdownIn {
            from { opacity: 0; transform: translateY(-8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ptFadeIn {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .pt-row {
            animation: ptFadeIn 0.4s ease backwards;
        }
        .pt-row:nth-child(1) { animation-delay: 0s; }
        .pt-row:nth-child(2) { animation-delay: 0.04s; }
        .pt-row:nth-child(3) { animation-delay: 0.08s; }
        .pt-row:nth-child(4) { animation-delay: 0.12s; }
        .pt-row:nth-child(5) { animation-delay: 0.16s; }
        .pt-row:nth-child(6) { animation-delay: 0.2s; }

        /* --- Puzzle Table: Responsive --- */
        @media (max-width: 768px) {
            .pt-table-header,
            .pt-row {
                font-size: 13px;
                padding: 12px;
                gap: 8px;
            }
            .pt-filter-row .dropdown {
                width: 100%;
            }
            .pt-filter-row .dropdown .btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);

    function PuzzleTable(containerId, options) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.opts = Object.assign({
            columns: [],
            searchPlaceholder: 'Search...',
            filterOptions: [],
            filterLabel: 'Filter',
            filter2Options: [],
            filter2Label: 'Filter',
            urlTemplate: null,
            onSearch: function () {},
            onFilter: function () {},
            onFilter2: function () {},
            onPageChange: function () {}
        }, options || {});

        this._search = '';
        this._filter = '';
        this._filter2 = '';
        this._page = 1;
        this._totalPages = 1;

        this._build();
    }

    PuzzleTable.prototype._buildGridTemplate = function () {
        var cols = this.opts.columns;
        var parts = [];
        for (var i = 0; i < cols.length; i++) {
            parts.push(cols[i].width || '1fr');
        }
        return parts.join(' ');
    };

    PuzzleTable.prototype._build = function () {
        var self = this;
        var grid = this._buildGridTemplate();
        var id = this.container.id;

        this.container.style.setProperty('--pt-grid', grid);
        this.container.innerHTML = '';

        // Search box
        var searchBox = document.createElement('div');
        searchBox.className = 'pt-search-box input-group';

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.placeholder = this.opts.searchPlaceholder;
        input.id = 'pt-input-' + id;
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

        // Filter dropdowns
        if (this.opts.filterOptions.length > 0 || this.opts.filter2Options.length > 0) {
            var filterRow = document.createElement('div');
            filterRow.className = 'pt-filter-row';

            function buildDropdown(self, options, label, onSelect) {
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
                noneA.addEventListener('click', function () { onSelect(toggle, ''); });
                noneLi.appendChild(noneA);
                menu.appendChild(noneLi);

                for (var i = 0; i < options.length; i++) {
                    (function (opt) {
                        var li = document.createElement('li');
                        var a = document.createElement('a');
                        a.className = 'dropdown-item';
                        a.textContent = opt;
                        a.addEventListener('click', function () { onSelect(toggle, opt); });
                        li.appendChild(a);
                        menu.appendChild(li);
                    })(options[i]);
                }

                dropdown.appendChild(toggle);
                dropdown.appendChild(menu);
                return dropdown;
            }

            var self = this;

            if (this.opts.filterOptions.length > 0) {
                this._toggleBtn = buildDropdown(this, this.opts.filterOptions, this.opts.filterLabel, function (btn, val) {
                    self._filter = val;
                    btn.textContent = val || self.opts.filterLabel;
                    self.opts.onFilter(val);
                });
                filterRow.appendChild(this._toggleBtn);
            }

            if (this.opts.filter2Options.length > 0) {
                this._toggleBtn2 = buildDropdown(this, this.opts.filter2Options, this.opts.filter2Label, function (btn, val) {
                    self._filter2 = val;
                    btn.textContent = val || self.opts.filter2Label;
                    self.opts.onFilter2(val);
                });
                filterRow.appendChild(this._toggleBtn2);
            }

            this.container.appendChild(filterRow);
        }

        // Table header
        var header = document.createElement('div');
        header.className = 'pt-table-header';

        for (var j = 0; j < this.opts.columns.length; j++) {
            var span = document.createElement('span');
            span.textContent = this.opts.columns[j].label;
            header.appendChild(span);
        }
        this.container.appendChild(header);

        // Row list container
        this._listEl = document.createElement('div');
        this._listEl.className = 'pt-list';
        this._listEl.id = 'pt-list-' + id;
        this.container.appendChild(this._listEl);

        // Pagination container
        this._paginationEl = document.createElement('div');
        this._paginationEl.className = 'pt-pagination';
        this._paginationEl.id = 'pt-pagination-' + id;
        this.container.appendChild(this._paginationEl);
    };

    PuzzleTable.prototype._doSearch = function () {
        var input = document.getElementById('pt-input-' + this.container.id);
        this._search = input ? input.value.trim() : '';
        this.opts.onSearch(this._search);
    };

    PuzzleTable.prototype._doFilter = function (value) {
        this._filter = value;
        if (this._toggleBtn) {
            this._toggleBtn.textContent = value || this.opts.filterLabel;
        }
        this.opts.onFilter(value);
    };

    PuzzleTable.prototype.getSearchTerm = function () { return this._search; };
    PuzzleTable.prototype.getFilter = function () { return this._filter; };
    PuzzleTable.prototype.getFilter2 = function () { return this._filter2; };
    PuzzleTable.prototype.getCurrentPage = function () { return this._page; };

    PuzzleTable.prototype.setData = function (response) {
        if (!response || !response.data) return;
        this._page = response.pagination.page;
        this._totalPages = response.pagination.totalPages;
        this._renderRows(response.data);
        this._renderPagination();
    };

    PuzzleTable.prototype._renderRows = function (data) {
        showSpinner(this._listEl.id);
        var list = this._listEl;
        list.innerHTML = '';

        var cols = this.opts.columns;
        var urlTpl = this.opts.urlTemplate;

        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            var row = document.createElement('div');
            row.className = 'pt-row';

            for (var c = 0; c < cols.length; c++) {
                var col = cols[c];
                var cell = document.createElement('span');

                if (col.render) {
                    cell.innerHTML = col.render(item[col.key], item);
                } else {
                    cell.textContent = item[col.key] != null ? item[col.key] : '';
                }

                if (col.key === 'title') {
                    cell.classList.add('pt-row-title');
                }

                row.appendChild(cell);
            }

            if (urlTpl) {
                var link = document.createElement('a');
                link.href = urlTpl + item.id;
                link.appendChild(row);
                list.appendChild(link);
            } else {
                list.appendChild(row);
            }
        }

        hideSpinner(this._listEl.id);
    };

    PuzzleTable.prototype._renderPagination = function () {
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
            a.className = 'pt-page';
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
                a.className = 'pt-page';
                if (pageNum === current) a.classList.add('pt-active');
                a.textContent = pageNum;
                a.addEventListener('click', function () { self.opts.onPageChange(pageNum); });
                pag.appendChild(a);
            })(i);
        }

        addBtn('Next', current >= total, function () { self.opts.onPageChange(current + 1); });
        addBtn('Last', current >= total, function () { self.opts.onPageChange(total); });
    };

    window.PuzzleTable = {
        init: function (containerId, options) {
            return new PuzzleTable(containerId, options);
        }
    };

})();
