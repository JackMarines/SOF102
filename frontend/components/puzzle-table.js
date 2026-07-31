// Puzzle table component — bảng phân trang với tìm kiếm, bộ lọc difficulty/language, và cột link tùy chọn
// Dùng CSS prefix `pt-`
(function () {

    // ── Constructor ──
    function PuzzleTable(containerId, options) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        // Gộp options mặc định với options caller truyền vào
        this.opts = Object.assign({
            columns: [],              // Mảng cột [{key, label, width, render}]
            searchPlaceholder: 'Search...',
            showSearch: true,         // false để ẩn ô tìm kiếm
            filterOptions: [],        // Tùy chọn bộ lọc 1 (VD: difficulty)
            filterLabel: 'Filter',
            filter2Options: [],       // Tùy chọn bộ lọc 2 (VD: language)
            filter2Label: 'Filter',
            urlTemplate: null,        // Nếu set, mỗi hàng sẽ là <a> trỏ đến urlTemplate + item.id
            emptyMessage: 'No items found.',
            onSearch: function () {}, // Callback khi tìm kiếm
            onFilter: function () {}, // Callback khi chọn bộ lọc 1
            onFilter2: function () {}, // Callback khi chọn bộ lọc 2
            onPageChange: function () {}, // Callback khi chuyển trang
            rowClass: null              // Function(item) => extra CSS class name for each row
        }, options || {});

        // Trạng thái nội bộ
        this._search = '';
        this._filter = '';
        this._filter2 = '';
        this._page = 1;
        this._totalPages = 1;

        this._build();
    }

    // ── Tạo chuỗi CSS grid template từ cấu hình cột ──
    PuzzleTable.prototype._buildGridTemplate = function () {
        var cols = this.opts.columns;
        var parts = [];
        for (var i = 0; i < cols.length; i++) {
            parts.push(cols[i].width || '1fr');
        }
        return parts.join(' ');
    };

    // ── Xây dựng toàn bộ khung DOM: search + filters + header + danh sách hàng + phân trang ──
    PuzzleTable.prototype._build = function () {
        var self = this;
        var grid = this._buildGridTemplate();
        var id = this.container.id;

        // Set CSS custom property cho grid template
        this.container.style.setProperty('--pt-grid', grid);
        this.container.innerHTML = '';

        // ── Ô tìm kiếm ──
        if (this.opts.showSearch !== false) {
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
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">search</span>';
            btn.addEventListener('click', function () { self._doSearch(); });

            searchBox.appendChild(input);
            searchBox.appendChild(btn);
            this.container.appendChild(searchBox);
        }

        // ── Hàng bộ lọc (dropdown Bootstrap) ──
        if (this.opts.filterOptions.length > 0 || this.opts.filter2Options.length > 0) {
            var filterRow = document.createElement('div');
            filterRow.className = 'pt-filter-row';

            // Helper: tạo dropdown Bootstrap từ mảng tùy chọn
            function buildDropdown(self, options, label, onSelect) {
                var dropdown = document.createElement('div');
                dropdown.className = 'dropdown';

                // Nút trigger
                var toggle = document.createElement('button');
                toggle.className = 'btn btn-secondary dropdown-toggle';
                toggle.type = 'button';
                toggle.setAttribute('data-bs-toggle', 'dropdown');
                toggle.textContent = label;

                // Menu items
                var menu = document.createElement('ul');
                menu.className = 'dropdown-menu';

                // Mục "None" để xóa bộ lọc
                var noneLi = document.createElement('li');
                var noneA = document.createElement('a');
                noneA.className = 'dropdown-item';
                noneA.textContent = 'None';
                noneA.addEventListener('click', function () { onSelect(toggle, ''); });
                noneLi.appendChild(noneA);
                menu.appendChild(noneLi);

                // Các tùy chọn lọc
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

            // Bộ lọc 1 (VD: difficulty)
            if (this.opts.filterOptions.length > 0) {
                this._toggleBtn = buildDropdown(this, this.opts.filterOptions, this.opts.filterLabel, function (btn, val) {
                    self._filter = val;
                    btn.textContent = val || self.opts.filterLabel;
                    self.opts.onFilter(val);
                });
                filterRow.appendChild(this._toggleBtn);
            }

            // Bộ lọc 2 (VD: language)
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

        // ── Scroll wrapper (tránh overflow trên mobile) ──
        var scrollWrap = document.createElement('div');
        scrollWrap.className = 'pt-scroll-wrap';
        this.container.appendChild(scrollWrap);

        // ── Header bảng (dòng tiêu đề cột) ──
        var header = document.createElement('div');
        header.className = 'pt-table-header';

        for (var j = 0; j < this.opts.columns.length; j++) {
            var span = document.createElement('span');
            span.textContent = this.opts.columns[j].label;
            header.appendChild(span);
        }
        scrollWrap.appendChild(header);

        // ── Vùng danh sách hàng ──
        this._listEl = document.createElement('div');
        this._listEl.className = 'pt-list';
        this._listEl.id = 'pt-list-' + id;
        scrollWrap.appendChild(this._listEl);

        // ── Vùng phân trang ──
        this._paginationEl = document.createElement('div');
        this._paginationEl.className = 'pt-pagination';
        this._paginationEl.id = 'pt-pagination-' + id;
        this.container.appendChild(this._paginationEl);
    };

    // ── Đọc giá trị ô tìm kiếm và gọi callback ──
    PuzzleTable.prototype._doSearch = function () {
        var input = document.getElementById('pt-input-' + this.container.id);
        this._search = input ? input.value.trim() : '';
        this.opts.onSearch(this._search);
    };

    // ── Áp dụng bộ lọc 1 (gọi từ bên ngoài nếu cần) ──
    PuzzleTable.prototype._doFilter = function (value) {
        this._filter = value;
        if (this._toggleBtn) {
            this._toggleBtn.textContent = value || this.opts.filterLabel;
        }
        this.opts.onFilter(value);
    };

    // Getter exposes trạng thái cho caller
    PuzzleTable.prototype.getSearchTerm = function () { return this._search; };
    PuzzleTable.prototype.getFilter = function () { return this._filter; };
    PuzzleTable.prototype.getFilter2 = function () { return this._filter2; };
    PuzzleTable.prototype.getCurrentPage = function () { return this._page; };

    // ── Nhận dữ liệu từ API, cập nhật phân trang và render lại ──
    PuzzleTable.prototype.setData = function (response) {
        if (!response || !response.data) return;
        this._page = response.pagination.page;
        this._totalPages = response.pagination.totalPages;
        this._renderRows(response.data);
        this._renderPagination();
    };

    // ── Render danh sách hàng ──
    PuzzleTable.prototype._renderRows = function (data) {
        showSpinner(this._listEl.id);
        var list = this._listEl;
        list.innerHTML = '';

        if (!data || data.length === 0) {
            list.innerHTML = '<div class="pt-empty">' + (this.opts.emptyMessage || 'No items found.') + '</div>';
            hideSpinner(this._listEl.id);
            return;
        }

        var cols = this.opts.columns;
        var urlTpl = this.opts.urlTemplate;

        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            var row = document.createElement('div');
            row.className = 'pt-row';

            if (typeof this.opts.rowClass === 'function') {
                var extra = this.opts.rowClass(item);
                if (extra) row.classList.add(extra);
            }

            // Render từng cột trong hàng
            for (var c = 0; c < cols.length; c++) {
                var col = cols[c];
                var cell = document.createElement('span');

                // Nếu cột có render function tùy chỉnh, dùng nó
                if (col.render) {
                    var rendered = col.render(item[col.key], item);
                    if (rendered instanceof Node) {
                        cell.appendChild(rendered);
                    } else {
                        cell.innerHTML = rendered;
                    }
                } else {
                    cell.textContent = item[col.key] != null ? item[col.key] : '';
                }

                // Đánh dấu class cho cột title
                if (col.key === 'title') {
                    cell.classList.add('pt-row-title');
                }

                row.appendChild(cell);
            }

            // Bọc hàng trong <a> nếu có urlTemplate
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

    // ── Render phân trang ──
    PuzzleTable.prototype._renderPagination = function () {
        var self = this;
        var pag = this._paginationEl;
        pag.innerHTML = '';

        var current = this._page;
        var total = this._totalPages;

        // Tính cửa sổ hiển thị 3 số trang quanh trang hiện tại
        var start = Math.max(1, current - 1);
        var end = Math.min(total, current + 1);
        if (end - start < 2) {
            if (start === 1) end = Math.min(3, total);
            else start = Math.max(1, total - 2);
        }

        // Helper tạo liên kết phân trang
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

        // Render số trang trong cửa sổ
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

    // ── Export toàn cục ──
    window.PuzzleTable = {
        init: function (containerId, options) {
            return new PuzzleTable(containerId, options);
        }
    };

})();
