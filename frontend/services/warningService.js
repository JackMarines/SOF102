// Warning check service — kiểm tra cảnh báo active của người dùng và hiển thị popup nếu có
// Sử dụng Popup.open() thay vì DOM thủ công
// Chỉ kiểm tra 1 lần mỗi phiên đăng nhập (dùng sessionStorage)

var warningData = null;

async function checkUserWarning() {
    if (sessionStorage.getItem('warningChecked')) return;
    sessionStorage.setItem('warningChecked', '1');

    var res = await apiGet('/my-warning');
    if (!res || res.error) return;

    if (res.teamBanNotification) {
        showTeamBanPopup(res.teamBanNotification);
    }

    if (res.warning) {
        warningData = res.warning;
        showWarningPopup(warningData);
    }
}

// ── Team bị cấm ──

function showTeamBanPopup(ban) {
    Popup.open({
        id: 'team-ban-popup',
        title: null,
        size: 'sm',
        closeable: false,
        onClose: function () { apiPost('/auth/acknowledge', {}); },
        render: function (ctx) {
            var icon = document.createElement('div');
            icon.className = 'popup-icon';
            icon.innerHTML = '<i class="bi bi-people-fill" style="color:#ef4444;"></i>';
            ctx.body.appendChild(icon);

            var title = document.createElement('h5');
            title.className = 'fw-bold mb-3';
            title.style.color = '#ef4444';
            title.textContent = 'Team Banned';
            ctx.body.appendChild(title);

            var info = document.createElement('div');
            info.className = 'text-start mb-3';
            info.innerHTML = '<div class="mb-2"><strong>Team:</strong> <span class="text-secondary">' + (ban.lastTeamName || 'Unknown') + '</span></div>';
            ctx.body.appendChild(info);

            var msg = document.createElement('p');
            msg.className = 'text-secondary mb-3';
            msg.style.fontSize = '13px';
            msg.innerHTML = '<i class="bi bi-info-circle me-1"></i>Your team has been banned and you have been removed. You can join or create a new team.';
            ctx.body.appendChild(msg);

            var dismiss = document.createElement('button');
            dismiss.className = 'custom-btn btn-secondary border-0';
            dismiss.style.minWidth = '120px';
            dismiss.textContent = 'Dismiss';
            dismiss.addEventListener('click', function () { ctx.close(); });
            ctx.footer.appendChild(dismiss);
        }
    });
}

// ── Cảnh báo (tài khoản hoặc nhóm) ──

function showWarningPopup(w) {
    var start = new Date(w.startDate);
    var end = new Date(w.endDate);
    var opts = { day: '2-digit', month: 'short', year: 'numeric' };
    var startStr = start.toLocaleDateString('en-GB', opts);
    var endStr = end.toLocaleDateString('en-GB', opts);

    var isTeam = !!w.teamId;
    var target = isTeam ? 'Your team' : 'Your account';
    var title = isTeam ? 'Team Warning' : 'Account Warning';

    Popup.open({
        id: 'warning-popup',
        title: null,
        size: 'sm',
        closeable: false,
        render: function (ctx) {
            var icon = document.createElement('div');
            icon.className = 'popup-icon';
            icon.innerHTML = '<i class="bi bi-exclamation-triangle-fill" style="color:#ef4444;"></i>';
            ctx.body.appendChild(icon);

            var titleEl = document.createElement('h5');
            titleEl.className = 'fw-bold mb-3';
            titleEl.style.color = '#ef4444';
            titleEl.textContent = title;
            ctx.body.appendChild(titleEl);

            var detail = document.createElement('div');
            detail.className = 'text-start mb-3';
            detail.innerHTML =
                '<div class="mb-2"><strong>Reason:</strong> <span class="text-secondary">' + w.reason + '</span></div>' +
                '<div class="mb-2"><strong>Issued by:</strong> <span class="text-secondary">' + w.authorName + '</span></div>' +
                '<div class="mb-2"><strong>Period:</strong> <span class="text-secondary">' + startStr + ' — ' + endStr + '</span></div>';
            ctx.body.appendChild(detail);

            var msg = document.createElement('p');
            msg.className = 'text-secondary mb-3';
            msg.style.fontSize = '13px';
            msg.innerHTML = '<i class="bi bi-info-circle me-1"></i>' + target + ' will be automatically banned if you do not submit an appeal before <strong>' + endStr + '</strong>.';
            ctx.body.appendChild(msg);

            var appeal = document.createElement('a');
            appeal.href = '/frontend/pages/user/setting/index.html';
            appeal.className = 'custom-btn border-0';
            appeal.style.minWidth = '120px';
            appeal.textContent = 'Appeal';
            ctx.footer.appendChild(appeal);

            var dismiss = document.createElement('button');
            dismiss.className = 'custom-btn btn-secondary border-0';
            dismiss.style.minWidth = '120px';
            dismiss.textContent = 'Dismiss';
            dismiss.addEventListener('click', function () { ctx.close(); });
            ctx.footer.appendChild(dismiss);
        }
    });
}
