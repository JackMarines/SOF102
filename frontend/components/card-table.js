// Card table component — lưới thẻ phân trang với tìm kiếm, bộ lọc, cột tùy chỉnh và menu ngữ cảnh
(function () {

    // Cờ ngăn chặn gắn listener click toàn cục nhiều lần (dù có nhiều CardTable)
    var _globalClickBound = false;

    // Ánh xạ key cột → hàm render HTML mặc định
    // Caller có thể ghi đè bằng columnRenderers trong options
    var DEFAULT_RENDERERS = {
        group:   function (item) { return '<i class="bi bi-people-fill"></i> ' + (item.groupName || '-'); },
        score:   function (item) { return '<i class="bi bi-star-fill"></i> ' + (item.totalScore != null ? item.totalScore.toLocaleString() : '0') + ' pts'; },
        puzzles: function (item) { return '<i class="bi bi-puzzle-fill"></i> ' + (item.totalPuzzles != null ? item.totalPuzzles.toLocaleString() : '0') + ' solved'; },
        // Kiểm tra cả 2 field do backend dùng tên khác nhau giữa các controller
        admin:   function (item) {
            return item.isAdmin || item.userIsadmin
                ? '<i class="bi bi-patch-check-fill" style="color:var(--accent)"></i> Admin'
                : '<i class="bi bi-person"></i> Member';
        },
        email:   function (item) { return '<i class="bi bi-envelope-fill"></i> ' + (item.userEmail || '-'); },
        status:  function (item) {
            // userIsactive có thể là boolean, number 0/1, hoặc undefined
            var active = item.userIsactive !== false && item.userIsactive !== 0;
            return '<i class="bi ' + (active ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger') + '"></i> ' + (active ? 'Active' : 'Banned');
        },
        team:    function (item) { return '<i class="bi bi-people-fill"></i> ' + (item.groupName || 'No Team'); }
    };

    // ── Constructor ──
    function CardTable(containerId, options) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        // Gộp options mặc định với options caller truyền vào
        this.opts = Object.assign({
            searchPlaceholder: 'Search...',
            columns: [{ key: 'user', label: 'User' }, { key: 'score', label: 'Score' }],
            urlTemplate: null,          // Nếu set, mỗi thẻ sẽ là <a> trỏ đến urlTemplate + userId
            cardMenu: null,             // Mảng các mục menu ngữ cảnh (3 chấm)
            cardMenuFilter: null,       // Hàm (item) => bool — kiểm soát thẻ nào hiển thị menu
            filters: null,              // Mảng nhóm bộ lọc dropdown tùy chỉnh
            columnRenderers: null,      // Ghi đè DEFAULT_RENDERERS
            onSearch: function () {},   // Callback khi người dùng tìm kiếm
            onPageChange: function () {}, // Callback khi chuyển trang
            onFilterChange: function () {} // Callback khi chọn bộ lọc
        }, options || {});

        // Trạng thái nội bộ
        this._search = '';
        this._page = 1;
        this._totalPages = 1;
        this._filterValue = null;

        // Mặc định chọn option đầu tiên của nhóm lọc đầu tiên
        if (this.opts.filters && this.opts.filters.length > 0) {
            this._filterValue = this.opts.filters[0].options[0].value;
        }

        this._build();

        // Listener toàn cục: click bất kỳ đâu sẽ đóng tất cả dropdown đang mở
        if (!_globalClickBound) {
            _globalClickBound = true;
            document.addEventListener('click', function () {
                document.querySelectorAll('.cg-card-dropdown.show, .cg-filter-dropdown.show').forEach(function (el) {
                    el.classList.remove('show');
                });
            });
        }
    }

    // ── Xây dựng khung DOM tĩnh ──
    CardTable.prototype._build = function () {
        var self = this;
        var id = this.container.id;
        this.container.innerHTML = '';

        // Thanh công cụ: ô tìm kiếm + các bộ lọc
        var toolbar = document.createElement('div');
        toolbar.className = 'cg-toolbar';
        toolbar.innerHTML =
            '<div class="cg-search-box input-group">' +
                '<input type="text" class="form-control" placeholder="' + this.opts.searchPlaceholder + '" id="cg-input-' + id + '">' +
                '<button class="btn" type="button"><span class="material-symbols-outlined" style="font-size:1rem;">search</span></button>' +
            '</div>';

        // Thêm dropdown lọc nếu có
        if (this.opts.filters && this.opts.filters.length > 0) {
            this._buildFilters(toolbar);
        }

        this.container.appendChild(toolbar);

        // Gắn sự kiện tìm kiếm (Enter + nút)
        toolbar.querySelector('input').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') self._doSearch();
        });
        toolbar.querySelector('button').addEventListener('click', function () { self._doSearch(); });

        // Vùng lưới thẻ (sẽ được xóa và render lại mỗi lần setData)
        this._gridEl = document.createElement('div');
        this._gridEl.className = 'cg-grid';
        this._gridEl.id = 'cg-grid-' + id;
        this.container.appendChild(this._gridEl);

        // Vùng phân trang
        this._paginationEl = document.createElement('div');
        this._paginationEl.className = 'cg-pagination';
        this.container.appendChild(this._paginationEl);
    };

    // ── Xây dựng dropdown lọc tùy chỉnh ──
    CardTable.prototype._buildFilters = function (toolbar) {
        var self = this;

        this.opts.filters.forEach(function (filter) {
            // Tạo wrapper chứa nút trigger + dropdown
            var wrap = document.createElement('div');
            wrap.className = 'cg-filter-wrap';

            // Xây dựng HTML: nút funnel + dropdown với các tùy chọn
            wrap.innerHTML =
                '<button class="cg-filter-btn" type="button">' +
                    '<span class="material-symbols-outlined" style="font-size:1rem;">filter_list</span> ' + filter.options[0].label +
                    ' <span class="material-symbols-outlined" style="font-size:0.8125rem;">expand_more</span>' +
                '</button>' +
                '<div class="cg-filter-dropdown">' +
                    filter.options.map(function (opt) {
                        return '<div class="cg-filter-option' + (opt.value === self._filterValue ? ' cg-filter-active' : '') +
                            '" data-value="' + opt.value + '">' + opt.label + '</div>';
                    }).join('') +
                '</div>';

            var btn = wrap.querySelector('.cg-filter-btn');
            var dd = wrap.querySelector('.cg-filter-dropdown');

            // Bật/tắt dropdown
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                dd.classList.toggle('show');
            });

            // Xử lý chọn tùy chọn lọc
            dd.querySelectorAll('.cg-filter-option').forEach(function (row) {
                row.addEventListener('click', function (e) {
                    e.stopPropagation();
                    self._filterValue = row.getAttribute('data-value');
                    // Cập nhật nhãn nút trigger
                    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">filter_list</span> ' + row.textContent +
                        ' <span class="material-symbols-outlined" style="font-size:0.8125rem;">expand_more</span>';
                    // Bỏ active tất cả, active mục được chọn
                    dd.querySelectorAll('.cg-filter-option').forEach(function (el) { el.classList.remove('cg-filter-active'); });
                    row.classList.add('cg-filter-active');
                    dd.classList.remove('show');
                    self.opts.onFilterChange(self._filterValue);
                });
            });

            toolbar.appendChild(wrap);
        });
    };

    // ── Đọc giá trị ô tìm kiếm và gọi callback ──
    CardTable.prototype._doSearch = function () {
        var input = document.getElementById('cg-input-' + this.container.id);
        this._search = input ? input.value.trim() : '';
        this.opts.onSearch(this._search);
    };

    // Getter exposes trạng thái cho caller
    CardTable.prototype.getSearchTerm = function () { return this._search; };
    CardTable.prototype.getCurrentPage = function () { return this._page; };
    CardTable.prototype.getFilterValue = function () { return this._filterValue; };

    // ── Nhận dữ liệu từ API, cập nhật phân trang và render lại ──
    CardTable.prototype.setData = function (response) {
        if (!response || !response.data) return;
        this._page = response.pagination.page;
        this._totalPages = response.pagination.totalPages;
        this._renderCards(response.data);
        this._renderPagination();
    };

    // ── Render lưới thẻ ──
    CardTable.prototype._renderCards = function (data) {
        var grid = this._gridEl;
        grid.innerHTML = '';

        // Trạng thái rỗng
        if (!data || data.length === 0) {
            grid.innerHTML = '<div class="cg-empty">No results found.</div>';
            return;
        }

        var opts = this.opts;
        var cols = opts.columns;
        // Gộp renderer mặc định + renderer tùy chỉnh của caller
        var renderers = Object.assign({}, DEFAULT_RENDERERS, opts.columnRenderers || {});
        // Cột đầu tiên có key 'user' được special-case: render avatar + tên
        var isUserCard = cols[0] && cols[0].key === 'user';
        var hasFilters = opts.filters && opts.filters.length > 0;

        data.forEach(function (item) {
            // Tạo thân thẻ: avatar + metadata
            var card = document.createElement('div');
            card.className = 'glass-box p-3 text-center';
            // Avatar component trả về DOM element, không phải HTML string
            card.appendChild(Avatar.render({
                size: 120,
                avatar: item.avatar,
                isAdmin: item.isAdmin || item.userIsadmin
            }));

            // Header tên người dùng (chỉ khi cột đầu là 'user')
            if (isUserCard) {
                card.insertAdjacentHTML('beforeend',
                    '<div class="cg-card-header"><h6 class="cg-card-name mb-0">' +
                    (item.displayName || item.userName || '') + '</h6></div>');
            }

            // Render các cột metadata còn lại bằng renderer tương ứng
            for (var c = isUserCard ? 1 : 0; c < cols.length; c++) {
                var r = renderers[cols[c].key];
                var meta = document.createElement('div');
                meta.className = 'cg-card-meta';
                if (r) {
                    var result = r(item);
                    if (result instanceof Node) meta.appendChild(result);
                    else meta.innerHTML = result || '';
                }
                card.appendChild(meta);
            }

            // Bọc trong thẻ <a> (điều hướng nếu có urlTemplate)
            var cardWrap = document.createElement('a');
            cardWrap.className = 'cg-card' + (hasFilters ? ' cg-no-lift' : '');
            if (opts.urlTemplate) cardWrap.href = opts.urlTemplate + (item.userId || item.id);
            cardWrap.appendChild(card);

            // ── Menu ngữ cảnh (3 chấm) ──
            if (opts.cardMenu && opts.cardMenu.length > 0 && (!opts.cardMenuFilter || opts.cardMenuFilter(item))) {
                // Lọc bỏ mục menu bị ẩn bởi visible()
                var visibleItems = opts.cardMenu.filter(function (mi) { return !mi.visible || mi.visible(item); });
                if (visibleItems.length > 0) {
                    var wrap = document.createElement('div');
                    wrap.className = 'cg-card-wrap';
                    // Xây dựng HTML: nút 3 chấm + dropdown với các mục
                    wrap.innerHTML =
                        '<button class="cg-card-menu-btn" type="button"><span class="material-symbols-outlined" style="font-size:1rem;">more_vert</span></button>' +
                        '<div class="cg-card-dropdown">' +
                            visibleItems.map(function (mi) {
                                var cls = 'cg-card-dropdown-item' + (mi.danger ? ' text-danger' : '');
                                var icon = mi.icon ? '<i class="bi bi-' + mi.icon + '"></i> ' : '';
                                return '<div class="' + cls + '">' + icon + mi.label + '</div>';
                            }).join('') +
                        '</div>';
                    // Đặt thẻ vào vị trí đầu tiên (trước nút menu)
                    wrap.insertBefore(cardWrap, wrap.firstChild);

                    var btn = wrap.querySelector('.cg-card-menu-btn');
                    var dropdown = wrap.querySelector('.cg-card-dropdown');
                    var menuEls = dropdown.querySelectorAll('.cg-card-dropdown-item');

                    // Gắn listener cho từng mục menu
                    menuEls.forEach(function (el, idx) {
                        el.addEventListener('click', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            dropdown.classList.remove('show');
                            if (visibleItems[idx].onClick) visibleItems[idx].onClick(item);
                        });
                    });

                    // Nút 3 chấm: đóng dropdown khác, toggle dropdown của mình
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        grid.querySelectorAll('.cg-card-dropdown.show').forEach(function (el) {
                            if (el !== dropdown) el.classList.remove('show');
                        });
                        dropdown.classList.toggle('show');
                    });

                    grid.appendChild(wrap);
                    return;
                }
            }

            // Không có menu → thêm thẻ trực tiếp
            grid.appendChild(cardWrap);
        });
    };

    // ── Render phân trang ──
    CardTable.prototype._renderPagination = function () {
        var self = this;
        var pag = this._paginationEl;
        var current = this._page;
        var total = this._totalPages;

        // Ẩn phân trang nếu chỉ có 1 trang
        if (total <= 1) { pag.innerHTML = ''; return; }

        // Tính cửa sổ hiển thị 3 số trang quanh trang hiện tại
        var start = Math.max(1, current - 1);
        var end = Math.min(total, current + 1);
        if (end - start < 2) {
            if (start === 1) end = Math.min(3, total);
            else start = Math.max(1, total - 2);
        }

        // Helper tạo liên kết phân trang
        function link(text, disabled, page) {
            if (disabled) return '<a class="cg-page" style="opacity:0.4;pointer-events:none;">' + text + '</a>';
            if (text === current) return '<a class="cg-page cg-active">' + text + '</a>';
            return '<a class="cg-page" data-page="' + page + '">' + text + '</a>';
        }

        var html = link('First', current <= 1, 1) + link('Prev', current <= 1, current - 1);
        for (var i = start; i <= end; i++) html += link(i, false, i);
        html += link('Next', current >= total, current + 1) + link('Last', current >= total, total);

        pag.innerHTML = html;
        // Gắn listener qua data-page attribute (event delegation)
        pag.querySelectorAll('.cg-page[data-page]').forEach(function (a) {
            a.addEventListener('click', function () {
                self.opts.onPageChange(parseInt(a.getAttribute('data-page')));
            });
        });
    };

    // ── Export toàn cục ──
    window.CardTable = {
        init: function (containerId, options) {
            return new CardTable(containerId, options);
        }
    };

})();
