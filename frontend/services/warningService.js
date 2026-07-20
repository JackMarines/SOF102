// Warning check service — kiểm tra cảnh báo active của người dùng và hiển thị popup nếu có
// Chỉ kiểm tra 1 lần mỗi phiên đăng nhập (dùng sessionStorage)

var warningData = null;

async function checkUserWarning() {
    // Nếu đã kiểm tra rồi trong phiên này → bỏ qua
    if (sessionStorage.getItem('warningChecked')) return;
    sessionStorage.setItem('warningChecked', '1');

    var res = await apiGet('/my-warning');
    if (!res || res.error || !res.warning) return;

    warningData = res.warning;
    buildWarningPopup(warningData);
}

// ── Xây dựng popup cảnh báo ──
function buildWarningPopup(w) {
    var overlay = document.createElement('div');
    overlay.className = 'confirm-popup-overlay';
    overlay.id = 'warning-popup';

    // Format ngày tháng
    var start = new Date(w.startDate);
    var end = new Date(w.endDate);
    var opts = { day: '2-digit', month: 'short', year: 'numeric' };
    var startStr = start.toLocaleDateString('en-GB', opts);
    var endStr = end.toLocaleDateString('en-GB', opts);

    // Xác định đối tượng bị cảnh báo (tài khoản hoặc nhóm)
    var target = w.userId ? 'Your account' : 'Your team';

    overlay.innerHTML =
        '<div class="confirm-popup" style="max-width:480px;">' +
            '<div class="confirm-popup-icon"><i class="bi bi-exclamation-triangle-fill" style="color:#ef4444;"></i></div>' +
            '<h5 class="fw-bold mb-3" style="color:#ef4444;">Account Warning</h5>' +
            '<div class="text-start mb-3">' +
                '<div class="mb-2"><strong>Reason:</strong> <span class="text-secondary">' + w.reason + '</span></div>' +
                '<div class="mb-2"><strong>Issued by:</strong> <span class="text-secondary">' + w.authorName + '</span></div>' +
                '<div class="mb-2"><strong>Period:</strong> <span class="text-secondary">' + startStr + ' — ' + endStr + '</span></div>' +
            '</div>' +
            '<p class="text-secondary mb-3" style="font-size:13px;">' +
                '<i class="bi bi-info-circle me-1"></i>' +
                target + ' will be automatically banned if you do not submit an appeal before <strong>' + endStr + '</strong>.' +
            '</p>' +
            '<div class="d-flex gap-2 justify-content-center">' +
                '<a href="/frontend/pages/user/setting/index.html" class="custom-btn border-0" style="min-width:120px;">Appeal</a>' +
                '<button id="warning-dismiss" class="custom-btn btn-secondary border-0" style="min-width:120px;">Dismiss</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);
    overlay.classList.add('show');

    // Đóng popup khi bấm Dismiss
    document.getElementById('warning-dismiss').addEventListener('click', function () {
        overlay.classList.remove('show');
        overlay.remove();
    });

    // Đóng popup khi bấm ra ngoài
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            overlay.remove();
        }
    });
}
