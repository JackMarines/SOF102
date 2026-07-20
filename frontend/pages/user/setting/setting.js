document.addEventListener('DOMContentLoaded', function() {

    // ── 1. Active warning glass-box ──
    apiGet('/my-warning').then(function(res) {
        if (!res || res.error || !res.warning) return;
        renderWarningBox(res.warning);
    });

    function renderWarningBox(w) {
        var section = document.createElement('div');
        section.className = 'glass-box p-4 mb-4 border border-danger';
        section.id = 'warning-section';

        var isTeam = !!w.teamId;
        var title = isTeam ? 'Team Warning' : 'Account Warning';

        var startStr = new Date(w.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        var endStr = new Date(w.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        section.innerHTML =
            '<h5 class="fw-bold text-danger mb-3"><i class="bi bi-exclamation-triangle-fill me-2"></i>' + title + '</h5>' +
            '<div class="text-secondary mb-1"><strong>Reason:</strong> ' + w.reason + '</div>' +
            '<div class="text-secondary mb-1"><strong>Issued by:</strong> ' + w.authorName + '</div>' +
            '<div class="text-secondary mb-3"><strong>Period:</strong> ' + startStr + ' — ' + endStr + '</div>';

        var statusArea = document.createElement('div');
        statusArea.id = 'appeal-status-area';
        section.appendChild(statusArea);

        apiGet('/appeal').then(function(ar) {
            var appeals = ar && ar.data || [];
            var last = appeals.length > 0 ? appeals[0] : null;

            if (last && last.status === 'PENDING') {
                statusArea.innerHTML = '<span class="badge bg-warning text-dark">You have a pending appeal</span>';
            } else if (last && last.status === 'APPROVED') {
                statusArea.innerHTML = '<span class="badge bg-success">✓ Approved by ' + (last.reviewedBy || 'Unknown') + ' on ' + formatDate(last.reviewedAt) + '</span>';
            } else if (last && last.status === 'REJECTED') {
                statusArea.innerHTML = '<span class="badge bg-danger">✗ Rejected by ' + (last.reviewedBy || 'Unknown') + ' on ' + formatDate(last.reviewedAt) + '</span>';
                addAppealButton(section);
            } else {
                addAppealButton(section);
            }
        });

        var appearance = document.querySelector('.glass-box');
        if (appearance) appearance.parentNode.insertBefore(section, appearance);
    }

    function formatDate(d) {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function addAppealButton(section) {
        var btn = document.createElement('button');
        btn.className = 'custom-btn border-0 mt-3';
        btn.textContent = 'Submit Appeal';
        btn.addEventListener('click', openAppealForm);
        section.appendChild(btn);
    }

    function openAppealForm() {
        Popup.open({
            id: 'appeal-form',
            size: 'sm',
            render: function(ctx) {
                var ta = document.createElement('textarea');
                ta.className = 'form-control';
                ta.id = 'appeal-message';
                ta.rows = 5;
                ta.placeholder = 'Explain why the warning should be removed...';
                ctx.body.appendChild(ta);

                var submit = document.createElement('button');
                submit.className = 'custom-btn border-0';
                submit.textContent = 'Submit';
                submit.addEventListener('click', submitAppeal);
                ctx.footer.appendChild(submit);
            }
        });
    }

    async function submitAppeal() {
        var msg = document.getElementById('appeal-message');
        if (!msg || !msg.value.trim()) { alert('Please enter your appeal message.'); return; }

        var existing = await apiGet('/appeal');
        if (existing && existing.data) {
            for (var i = 0; i < existing.data.length; i++) {
                if (existing.data[i].status === 'PENDING') {
                    alert('You already have a pending appeal. Wait for it to be reviewed.');
                    return;
                }
            }
        }

        var res = await apiPost('/appeal', { message: msg.value.trim() });
        if (res && !res.error) {
            Popup.close('appeal-form');
            location.reload();
        } else {
            alert(res.message || 'Failed to submit appeal');
        }
    }

    // ── 2. Theme selection visual ──
    document.querySelectorAll('.glass-box .bi-display, .glass-box .bi-sun-fill, .glass-box .bi-moon-stars-fill')
        .forEach(function(icon) {
            icon.parentElement.style.cursor = 'pointer';
            icon.parentElement.addEventListener('click', function() {
                document.querySelectorAll('.glass-box .bi-display, .glass-box .bi-sun-fill, .glass-box .bi-moon-stars-fill')
                    .forEach(function(item) { item.parentElement.style.border = ''; });
                this.style.border = '2px solid #b388ff';
            });
        });

    // ── 3. Save / Cancel / Delete Account ──
    document.querySelector('.custom-btn')?.addEventListener('click', function() {
        alert('Settings saved successfully.');
    });

    document.querySelector('.btn-outline-light')?.addEventListener('click', function() {
        location.reload();
    });

    document.querySelector('.btn-danger')?.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete your account?')) {
            alert('Your account has been deleted.');
        }
    });
});
