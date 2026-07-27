// User table component — lưới thẻ phân trang với tìm kiếm, cột tùy chỉnh và menu ngữ cảnh tùy chọn
// Dùng chung CSS prefix `cg-` (cùng card-table) — không có bộ lọc tùy chỉnh, đơn giản hơn card-table
(function () {

    // Cờ ngăn gắn listener click toàn cục nhiều lần
    var _globalClickBound = false;

    // Ánh xạ key cột → hàm render HTML mặc định
    var DEFAULT_RENDERERS = {
        group: function (item) { return '<span class="material-symbols-outlined">group</span> ' + (item.groupName || '-'); },
        score: function (item) { return '<span class="material-symbols-outlined">star</span> ' + (item.totalScore != null ? item.totalScore.toLocaleString() : '0') + ' pts'; },
        puzzles: function (item) { return '<span class="material-symbols-outlined">extension</span> ' + (item.totalPuzzles != null ? item.totalPuzzles.toLocaleString() : '0') + ' solved'; },
        // Kiểm tra cả 2 field do backend dùng tên khác nhau giữa các controller
        admin: function (item) {
            if (item.isAdmin || item.userIsadmin) {
                return '<span class="material-symbols-outlined" style="color:var(--accent);font-size:1rem;">verified</span> Admin';
            }
            return '<span class="material-symbols-outlined" style="font-size:1rem;">person</span> Member';
        }
    };

    // ── Constructor ──
    function UserTable(containerId, options) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        // Gộp options mặc định với options caller truyền vào
        this.opts = Object.assign({
            searchPlaceholder: 'Search users...',
            columns: [
                { key: 'user', label: 'User' },
                { key: 'group', label: 'Group' },
                { key: 'score', label: 'Score' },
                { key: 'admin', label: 'Admin' }
            ],
            urlTemplate: null,        // Nếu set, mỗi thẻ sẽ là <a> trỏ đến urlTemplate + userId
            cardMenu: null,           // Mảng các mục menu ngữ cảnh (3 chấm)
            cardMenuFilter: null,     // Hàm (item) => bool — kiểm soát thẻ nào hiển thị menu
            columnRenderers: null,    // Ghi đè DEFAULT_RENDERERS
            onSearch: function () {}, // Callback khi tìm kiếm
            onPageChange: function () {} // Callback khi chuyển trang
        }, options || {});

        // Trạng thái nội bộ
        this._search = '';
        this._page = 1;
        this._totalPages = 1;

        this._build();

        // Listener toàn cục: click bất kỳ đâu sẽ đóng dropdown đang mở
        if (!_globalClickBound) {
            _globalClickBound = true;
            document.addEventListener('click', function () {
                document.querySelectorAll('.cg-card-dropdown.show').forEach(function (el) {
                    el.classList.remove('show');
                });
            });
        }
    }

    // ── Xây dựng khung DOM tĩnh ──
    UserTable.prototype._build = function () {
        var self = this;
        var id = this.container.id;
        this.container.innerHTML = '';

        // Ô tìm kiếm
        var searchBox = document.createElement('div');
        searchBox.className = 'cg-search-box input-group';

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.placeholder = this.opts.searchPlaceholder;
        input.id = 'cg-input-' + id;
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

        // Vùng lưới thẻ (xóa và render lại mỗi lần setData)
        this._gridEl = document.createElement('div');
        this._gridEl.className = 'cg-grid';
        this._gridEl.id = 'cg-grid-' + id;
        this.container.appendChild(this._gridEl);

        // Vùng phân trang
        this._paginationEl = document.createElement('div');
        this._paginationEl.className = 'cg-pagination';
        this.container.appendChild(this._paginationEl);
    };

    // ── Đọc giá trị ô tìm kiếm và gọi callback ──
    UserTable.prototype._doSearch = function () {
        var input = document.getElementById('cg-input-' + this.container.id);
        this._search = input ? input.value.trim() : '';
        this.opts.onSearch(this._search);
    };

    // Getter exposes trạng thái cho caller
    UserTable.prototype.getSearchTerm = function () { return this._search; };
    UserTable.prototype.getCurrentPage = function () { return this._page; };

    // ── Nhận dữ liệu từ API, cập nhật phân trang và render lại ──
    UserTable.prototype.setData = function (response) {
        if (!response || !response.data) return;
        this._page = response.pagination.page;
        this._totalPages = response.pagination.totalPages;
        this._renderCards(response.data);
        this._renderPagination();
    };

    // ── Render lưới thẻ ──
    UserTable.prototype._renderCards = function (data) {
        showSpinner(this._gridEl.id);
        var grid = this._gridEl;
        grid.innerHTML = '';

        // Trạng thái rỗng
        if (!data || data.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'cg-empty';
            empty.textContent = 'No users found.';
            grid.appendChild(empty);
            hideSpinner(this._gridEl.id);
            return;
        }

        var urlTpl = this.opts.urlTemplate;
        var cols = this.opts.columns;
        var cardMenu = this.opts.cardMenu;
        var cardMenuFilter = this.opts.cardMenuFilter;
        // Gộp renderer mặc định + renderer tùy chỉnh của caller
        var renderers = Object.assign({}, DEFAULT_RENDERERS, this.opts.columnRenderers || {});
        var self = this;

        for (var i = 0; i < data.length; i++) {
            var item = data[i];

            // Thẻ <a> bọc ngoài (điều hướng nếu có urlTemplate)
            var cardWrap = document.createElement('a');
            cardWrap.className = 'cg-card';
            if (urlTpl) cardWrap.href = urlTpl + item.userId;

            // Wrapper bọc thẻ + menu ngữ cảnh
            var outerWrap = document.createElement('div');
            outerWrap.className = 'cg-card-wrap';

            // Thân thẻ: avatar + metadata
            var card = document.createElement('div');
            card.className = 'glass-box p-3';

            // Avatar component trả về DOM element
            card.appendChild(Avatar.render({
                size: 120,
                avatar: item.avatar,
                isAdmin: item.isAdmin || item.userIsadmin
            }));

            // Header tên người dùng (chỉ khi cột đầu là 'user')
            if (cols[0] && cols[0].key === 'user') {
                var header = document.createElement('div');
                header.className = 'cg-card-header';
                var name = document.createElement('h6');
                name.className = 'cg-card-name mb-0';
                name.textContent = item.displayName || item.userName || '';
                header.appendChild(name);
                card.appendChild(header);
            }

            // Render các cột metadata còn lại bằng renderer tương ứng
            for (var c = 1; c < cols.length; c++) {
                var col = cols[c];
                var meta = document.createElement('div');
                meta.className = 'cg-card-meta';

                var renderer = renderers[col.key];
                if (renderer) {
                    meta.innerHTML = renderer(item);
                }

                card.appendChild(meta);
            }

            cardWrap.appendChild(card);

            // ── Menu ngữ cảnh (3 chấm) — chỉ hiển thị khi có cardMenu và item vượt qua filter ──
            if (cardMenu && cardMenu.length > 0 && (!cardMenuFilter || cardMenuFilter(item))) {
                outerWrap.appendChild(cardWrap);

                // Nút 3 chấm
                var menuBtn = document.createElement('button');
                menuBtn.className = 'cg-card-menu-btn';
                menuBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">more_vert</span>';
                menuBtn.type = 'button';

                // Dropdown menu
                var dropdown = document.createElement('div');
                dropdown.className = 'cg-card-dropdown';

                // Xây dựng từng mục menu
                for (var m = 0; m < cardMenu.length; m++) {
                    var mi = cardMenu[m];
                    var menuRow = document.createElement('div');
                    menuRow.className = 'cg-card-dropdown-item' + (mi.danger ? ' text-danger' : '');
                    menuRow.textContent = mi.label;
                    // Dùng IIFE để giữ giá trị đúng trong vòng lặp
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

                // Listener nút 3 chấm: đóng dropdown khác, toggle dropdown của mình
                (function (btn, dd) {
                    btn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        grid.querySelectorAll('.cg-card-dropdown.show').forEach(function (el) {
                            if (el !== dd) el.classList.remove('show');
                        });
                        dd.classList.toggle('show');
                    });
                })(menuBtn, dropdown);

                outerWrap.appendChild(menuBtn);
                outerWrap.appendChild(dropdown);
                grid.appendChild(outerWrap);
            } else {
                // Không có menu → thêm thẻ trực tiếp
                grid.appendChild(cardWrap);
            }
        }

        hideSpinner(this._gridEl.id);
    };

    // ── Render phân trang ──
    UserTable.prototype._renderPagination = function () {
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
            a.className = 'cg-page';
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
                a.className = 'cg-page';
                if (pageNum === current) a.classList.add('cg-active');
                a.textContent = pageNum;
                a.addEventListener('click', function () { self.opts.onPageChange(pageNum); });
                pag.appendChild(a);
            })(i);
        }

        addBtn('Next', current >= total, function () { self.opts.onPageChange(current + 1); });
        addBtn('Last', current >= total, function () { self.opts.onPageChange(total); });
    };

    // ── Export toàn cục ──
    window.UserTable = {
        init: function (containerId, options) {
            return new UserTable(containerId, options);
        }
    };

})();
