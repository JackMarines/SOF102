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
        // Đang có appeal PENDING thì không hiện lại popup cảnh báo (đã kháng cáo rồi)
        if (!res.appealPending) {
            showWarningPopup(warningData);
        }
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
            icon.innerHTML = '<i class="bi bi-people-fill" style="color:var(--error);"></i>';
            ctx.body.appendChild(icon);

            var title = document.createElement('h5');
            title.className = 'fw-bold mb-3';
            title.style.color = 'var(--error)';
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
            icon.innerHTML = '<i class="bi bi-exclamation-triangle-fill" style="color:var(--error);"></i>';
            ctx.body.appendChild(icon);

            var titleEl = document.createElement('h5');
            titleEl.className = 'fw-bold mb-3';
            titleEl.style.color = 'var(--error)';
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

            var appeal = document.createElement('button');
            appeal.className = 'custom-btn border-0';
            appeal.style.minWidth = '120px';
            appeal.textContent = 'Appeal';
            appeal.addEventListener('click', function () {
                ctx.close();
                if (typeof window.openAppealForm === 'function') window.openAppealForm();
            });
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

// ── Appeal form (shared across pages) ──

window.openAppealForm = function () {
    Popup.open({
        id: 'appeal-form',
        size: 'sm',
        render: function (ctx) {
            var ta = document.createElement('textarea');
            ta.className = 'form-control';
            ta.id = 'appeal-message';
            ta.rows = 5;
            ta.placeholder = 'Explain why the warning should be removed...';
            ctx.body.appendChild(ta);

            var submit = document.createElement('button');
            submit.className = 'custom-btn border-0';
            submit.textContent = 'Submit';
            submit.addEventListener('click', window.submitAppeal);
            ctx.footer.appendChild(submit);
        }
    });
};

window.submitAppeal = async function () {
    var msg = document.getElementById('appeal-message');
    if (!msg || !msg.value.trim()) {
        Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--warning);">warning</span>', title: 'Validation Error', message: 'Please enter your appeal message.', okLabel: 'OK' });
        return;
    }

    var existing = await apiGet('/appeal');
    if (existing && existing.data) {
        for (var i = 0; i < existing.data.length; i++) {
            if (existing.data[i].status === 'PENDING') {
                Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--warning);">warning</span>', title: 'Pending Appeal', message: 'You already have a pending appeal. Wait for it to be reviewed.', okLabel: 'OK' });
                return;
            }
        }
    }

    var res = await apiPost('/appeal', { message: msg.value.trim() });
    if (res && !res.error) {
        Popup.close('appeal-form');
        if (warningData && warningData.teamId) {
            window.location.href = '/frontend/pages/user/team/index.html?id=' + warningData.teamId;
        } else {
            window.location.href = '/frontend/pages/user/profile/index.html?edit=1';
        }
    } else {
        Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res.message || 'Failed to submit appeal', okLabel: 'OK' });
    }
};
