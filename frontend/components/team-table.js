// Team table component — lưới thẻ phân trang với tìm kiếm, sắp xếp và điều khiển thứ tự
// Dùng CSS prefix `tt-`
(function () {

    // ── Constructor ──
    function TeamTable(containerId, options) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        // Gộp options mặc định với options caller truyền vào
        this.opts = Object.assign({
            searchPlaceholder: 'Search teams...',
            sortByOptions: [],       // Tùy chọn sắp xếp [{label, value}]
            sortByLabel: 'Sort by',
            orderOptions: [],        // Tùy chọn thứ tự [{label, value}]
            orderLabel: 'Order',
            urlTemplate: null,       // Nếu set, mỗi thẻ sẽ là <a> trỏ đến urlTemplate + item.id
            onSearch: function () {}, // Callback khi tìm kiếm
            onSort: function () {},   // Callback khi thay đổi sắp xếp
            onPageChange: function () {} // Callback khi chuyển trang
        }, options || {});

        // Trạng thái nội bộ
        this._search = '';
        this._sortBy = '';
        this._order = '';
        this._page = 1;
        this._totalPages = 1;

        this._build();
    }

    // ── Xây dựng khung DOM tĩnh ──
    TeamTable.prototype._build = function () {
        var self = this;
        var id = this.container.id;
        this.container.innerHTML = '';

        // ── Ô tìm kiếm ──
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
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">search</span>';
        btn.addEventListener('click', function () { self._doSearch(); });

        searchBox.appendChild(input);
        searchBox.appendChild(btn);
        this.container.appendChild(searchBox);

        // ── Hàng bộ lọc (dropdown sắp xếp) ──
        if (this.opts.sortByOptions.length > 0) {
            var filterRow = document.createElement('div');
            filterRow.className = 'tt-filter-row';

            // Helper: tạo dropdown Bootstrap từ mảng tùy chọn {label, value}
            function buildDropdown(options, label, onSelect) {
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
                noneA.addEventListener('click', function () {
                    toggle.textContent = label;
                    onSelect('');
                });
                noneLi.appendChild(noneA);
                menu.appendChild(noneLi);

                // Các tùy chọn sắp xếp
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

            // Dropdown sắp xếp theo (VD: Name, Score, Members)
            this._sortByBtn = buildDropdown(this.opts.sortByOptions, this.opts.sortByLabel, function (val) {
                self._sortBy = val;
                self.opts.onSort(self._sortBy, self._order);
            });
            filterRow.appendChild(this._sortByBtn);

            // Dropdown thứ tự (ASC/DESC)
            if (this.opts.orderOptions.length > 0) {
                this._orderBtn = buildDropdown(this.opts.orderOptions, this.opts.orderLabel, function (val) {
                    self._order = val;
                    self.opts.onSort(self._sortBy, self._order);
                });
                filterRow.appendChild(this._orderBtn);
            }

            this.container.appendChild(filterRow);
        }

        // ── Vùng lưới thẻ ──
        this._gridEl = document.createElement('div');
        this._gridEl.className = 'tt-grid';
        this._gridEl.id = 'tt-grid-' + id;
        this.container.appendChild(this._gridEl);

        // ── Vùng phân trang ──
        this._paginationEl = document.createElement('div');
        this._paginationEl.className = 'tt-pagination';
        this._paginationEl.id = 'tt-pagination-' + id;
        this.container.appendChild(this._paginationEl);
    };

    // ── Đọc giá trị ô tìm kiếm và gọi callback ──
    TeamTable.prototype._doSearch = function () {
        var input = document.getElementById('tt-input-' + this.container.id);
        this._search = input ? input.value.trim() : '';
        this.opts.onSearch(this._search);
    };

    // Getter exposes trạng thái cho caller
    TeamTable.prototype.getSearchTerm = function () { return this._search; };
    TeamTable.prototype.getSortBy = function () { return this._sortBy; };
    TeamTable.prototype.getOrder = function () { return this._order; };
    TeamTable.prototype.getCurrentPage = function () { return this._page; };

    // ── Nhận dữ liệu từ API, cập nhật phân trang và render lại ──
    TeamTable.prototype.setData = function (response) {
        if (!response || !response.data) return;
        this._page = response.pagination.page;
        this._totalPages = response.pagination.totalPages;
        this._renderCards(response.data);
        this._renderPagination();
    };

    // ── Render lưới thẻ ──
    TeamTable.prototype._renderCards = function (data) {
        showSpinner(this._gridEl.id);
        var grid = this._gridEl;
        grid.innerHTML = '';

        // Trạng thái rỗng
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

            // Thẻ <a> bọc ngoài (điều hướng nếu có urlTemplate)
            var cardWrap = document.createElement('a');
            cardWrap.className = 'tt-card';
            if (urlTpl) cardWrap.href = urlTpl + item.id;

            // Thân thẻ
            var card = document.createElement('div');
            card.className = 'glass-box p-3';

            // Ảnh đại diện nhóm (fallback icon nếu không có avatar)
            if (item.avatar) {
                var img = document.createElement('img');
                img.src = item.avatar;
                img.alt = item.name || '';
                img.className = 'tt-card-avatar';
                card.appendChild(img);
            } else {
                var fallback = document.createElement('div');
                fallback.className = 'tt-card-avatar-fallback';
                fallback.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">group</span>';
                card.appendChild(fallback);
            }

            // Hàng tên + badge công khai/riêng tư
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

            // Thông tin số thành viên
            var members = document.createElement('p');
            members.className = 'tt-card-meta mb-1';
            members.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">group</span> ' + (item.memberCount != null ? item.memberCount : '0') + ' Members';
            card.appendChild(members);

            // Thông tin số câu đã giải
            var solved = document.createElement('p');
            solved.className = 'tt-card-meta mb-2';
            solved.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">extension</span> ' + (item.totalSolved != null ? item.totalSolved.toLocaleString() : '0') + ' Solved';
            card.appendChild(solved);

            cardWrap.appendChild(card);
            grid.appendChild(cardWrap);
        }

        hideSpinner(this._gridEl.id);
    };

    // ── Render phân trang ──
    TeamTable.prototype._renderPagination = function () {
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

        // Render số trang trong cửa sổ
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

    // ── Export toàn cục ──
    window.TeamTable = {
        init: function (containerId, options) {
            return new TeamTable(containerId, options);
        }
    };

})();
