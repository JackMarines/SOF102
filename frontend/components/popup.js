// Popup component — shell bao quanh (overlay + panel + header + body/footer), không fetch API
// Hai phương thức chính:
//   Popup.open(config)   — popup nội dung tùy ý, render(ctx) điền vào body
//   Popup.confirm(opts)  — popup xác nhận nhỏ (icon + title + message + nút)
(function () {

    // ── Kích thước preset ──

    var SIZE_MAP = { sm: '420px', md: '700px', lg: '900px' };

    // ── Popup instance ──

    function Popup(config) {
        this.id = config.id || 'popup-' + (++Popup._counter);
        this.size = SIZE_MAP[config.size] || SIZE_MAP.md;
        this.title = config.title || null;
        this.closeable = config.closeable !== false;
        this.scroll = !!config.scroll;
        this.className = config.className || '';
        this.onClose = config.onClose || null;
        this.render = config.render || null;
        this._overlay = null;
        this._body = null;
        this._footer = null;
        this._titleEl = null;
        this._escHandler = null;
    }

    Popup._counter = 0;
    Popup._confirmInstance = null;

    // ── Xây dựng overlay + panel (lazy, chỉ khi open lần đầu) ──

    Popup.prototype._build = function () {
        if (this._overlay) return;

        var self = this;

        // Overlay
        var overlay = document.createElement('div');
        overlay.id = this.id;
        overlay.className = 'popup-overlay';

        // Panel
        var panel = document.createElement('div');
        panel.className = 'popup-panel' + (this.className ? ' ' + this.className : '');
        panel.style.maxWidth = this.size;
        if (this.scroll) {
            panel.style.maxHeight = '90vh';
            panel.style.overflowY = 'auto';
        }

        // Header — chỉ tạo nếu có title
        if (this.title !== null) {
            var header = document.createElement('div');
            header.className = 'd-flex justify-content-between align-items-center mb-3';

            var titleEl = document.createElement('h5');
            titleEl.className = 'fw-bold mb-0';
            titleEl.style.color = 'var(--text-primary)';
            titleEl.textContent = this.title;
            header.appendChild(titleEl);
            this._titleEl = titleEl;

            if (this.closeable) {
                var closeBtn = document.createElement('button');
                closeBtn.className = 'btn-close btn-close-white';
                closeBtn.addEventListener('click', function () { self.close(); });
                header.appendChild(closeBtn);
            }

            panel.appendChild(header);
        }

        // Body
        var body = document.createElement('div');
        body.className = 'popup-body';
        panel.appendChild(body);
        this._body = body;

        // Footer (ẩn nếu rỗng)
        var footer = document.createElement('div');
        footer.className = 'popup-footer d-flex gap-2 justify-content-center mt-3';
        footer.style.display = 'none';
        panel.appendChild(footer);
        this._footer = footer;

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        this._overlay = overlay;

        // Đóng khi click ngoài panel
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) self.close();
        });
    };

    // ── Hiển thị popup ──

    Popup.prototype.open = function () {
        this._build();

        // Gọi render nếu có
        if (this.render && this._body.childNodes.length === 0) {
            var self = this;
            this.render({
                body: this._body,
                footer: this._footer,
                close: function () { self.close(); },
                setTitle: function (t) { if (self._titleEl) self._titleEl.textContent = t; },
                getOverlay: function () { return self._overlay; }
            });
            // Hiện footer nếu render đã thêm nội dung
            if (this._footer.childNodes.length > 0) {
                this._footer.style.display = '';
            }
        }

        this._overlay.classList.add('show');

        // Đóng bằng Escape
        var self = this;
        this._escHandler = function (e) {
            if (e.key === 'Escape' && self._overlay.classList.contains('show')) {
                self.close();
            }
        };
        document.addEventListener('keydown', this._escHandler);

        return this;
    };

    // ── Đóng popup ──

    Popup.prototype.close = function () {
        if (!this._overlay) return;
        this._overlay.classList.remove('show');
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
        if (this.onClose) this.onClose();
    };

    // ── Đặt lại nội dung body (mở lại popup cũ với nội dung mới) ──

    Popup.prototype.setContent = function (renderFn) {
        this._body.innerHTML = '';
        this._footer.innerHTML = '';
        this._footer.style.display = 'none';
        this.render = renderFn;
        return this;
    };

    // ── Getter ──

    Popup.prototype.getBody = function () { this._build(); return this._body; };
    Popup.prototype.getOverlay = function () { this._build(); return this._overlay; };
    Popup.prototype.setTitle = function (t) { this.title = t; if (this._titleEl) this._titleEl.textContent = t; return this; };
    Popup.prototype.isOpen = function () { return this._overlay && this._overlay.classList.contains('show'); };

    // ── Static: Popup.open(config) ──

    Popup.open = function (config) {
        // Nếu có id trùng, tái sử dụng overlay
        var existing = null;
        if (config.id) {
            existing = Popup._registry[config.id];
        }
        if (existing) {
            // Reset body/footer rồi gọi render mới
            existing._body.innerHTML = '';
            existing._footer.innerHTML = '';
            existing._footer.style.display = 'none';
            existing.render = config.render || null;
            existing.onClose = config.onClose || null;
            if (config.title !== undefined) {
                existing.title = config.title;
                if (existing._titleEl) existing._titleEl.textContent = config.title;
            }
            return existing.open();
        }

        var popup = new Popup(config);
        if (config.id) Popup._registry[config.id] = popup;
        return popup.open();
    };

    Popup._registry = {};

    // ── Static: Popup.confirm(opts) ──

    Popup.confirm = function (opts) {
        var key = 'confirm-popup';
        var existing = Popup._registry[key];

        // Tạo lại mỗi lần để đảm bảo listener sạch
        if (existing && existing._overlay) {
            existing._overlay.remove();
            delete Popup._registry[key];
        }

        var popup = new Popup({
            id: key,
            size: 'sm',
            title: null,
            closeable: false,
            onClose: null
        });

        Popup._registry[key] = popup;
        popup._build();

        // Xây nội dung confirm
        popup._body.innerHTML = '';

        // Icon
        var iconEl = document.createElement('div');
        iconEl.className = 'popup-icon';
        iconEl.innerHTML = opts.icon || '<span class="material-symbols-outlined" style="font-size:48px;color:var(--accent);">warning</span>';
        popup._body.appendChild(iconEl);

        // Title
        var titleEl = document.createElement('h5');
        titleEl.className = 'mb-2';
        titleEl.style.color = 'var(--text-primary)';
        titleEl.textContent = opts.title || '';
        popup._body.appendChild(titleEl);

        // Message
        if (opts.message) {
            var msgEl = document.createElement('p');
            msgEl.className = 'text-secondary mb-3';
            msgEl.style.fontSize = '14px';
            msgEl.textContent = opts.message;
            popup._body.appendChild(msgEl);
        }

        // Buttons
        popup._footer.innerHTML = '';
        popup._footer.style.display = '';

        if (opts.okLabel) {
            var okBtn = document.createElement('button');
            okBtn.className = 'custom-btn' + (opts.okClass ? ' ' + opts.okClass : '');
            okBtn.style.minWidth = '120px';
            okBtn.textContent = opts.okLabel;
            okBtn.addEventListener('click', function () {
                popup.close();
                if (opts.onConfirm) opts.onConfirm();
            });
            popup._footer.appendChild(okBtn);
        }

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'custom-btn btn-secondary';
        cancelBtn.style.minWidth = '120px';
        cancelBtn.textContent = opts.okLabel ? 'Cancel' : 'Close';
        cancelBtn.addEventListener('click', function () { popup.close(); });
        popup._footer.appendChild(cancelBtn);

        popup._overlay.classList.add('show');

        // Escape key
        popup._escHandler = function (e) {
            if (e.key === 'Escape') popup.close();
        };
        document.addEventListener('keydown', popup._escHandler);

        popup.onClose = opts.onClose || null;

        return popup;
    };

    // ── Export ──

    window.Popup = Popup;

})();
