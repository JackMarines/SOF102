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
        if (!msg || !msg.value.trim()) { Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--warning);">warning</span>', title: 'Validation Error', message: 'Please enter your appeal message.', okLabel: 'OK' }); return; }

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
            location.reload();
        } else {
            Popup.confirm({ icon: '<span class="material-symbols-outlined" style="font-size:48px;color:var(--error);">error</span>', title: 'Error', message: res.message || 'Failed to submit appeal', okLabel: 'OK' });
        }
    }

    // ── 2. Theme selection ──
    function applyTheme(theme) {
        var el = document.documentElement;
        if (theme === 'light') {
            el.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else if (theme === 'system') {
            el.classList.remove('light-mode');
            localStorage.removeItem('theme');
        } else {
            el.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
        var icon = document.querySelector('.theme-toggle');
        if (icon) icon.textContent = el.classList.contains('light-mode') ? '\u263E' : '\u2600';
    }

    document.querySelectorAll('.glass-box .bi-display, .glass-box .bi-sun-fill, .glass-box .bi-moon-stars-fill')
        .forEach(function(icon) {
            icon.parentElement.style.cursor = 'pointer';
            icon.parentElement.addEventListener('click', function() {
                document.querySelectorAll('.glass-box .bi-display, .glass-box .bi-sun-fill, .glass-box .bi-moon-stars-fill')
                    .forEach(function(item) { item.parentElement.style.border = ''; });
                this.style.border = '2px solid var(--accent)';

                var cls = icon.classList;
                if (cls.contains('bi-sun-fill')) {
                    applyTheme('light');
                } else if (cls.contains('bi-moon-stars-fill')) {
                    applyTheme('dark');
                } else {
                    applyTheme('system');
                }
            });
        });

    // Highlight current theme on load
    (function() {
        var theme = localStorage.getItem('theme');
        var selector = theme === 'light' ? '.bi-sun-fill' : theme === 'dark' ? '.bi-moon-stars-fill' : '.bi-display';
        var icon = document.querySelector(selector);
        if (icon) icon.style.border = '2px solid var(--accent)';
    })();

    // ── 3. Account actions ──

    document.getElementById('changePasswordBtn')?.addEventListener('click', function() {
        var user = firebase.auth().currentUser;
        if (!user || !user.email) {
            Popup.open({
                id: 'pwd-popup',
                size: 'sm',
                title: 'Change Password',
                render: function(ctx) {
                    ctx.body.innerHTML = '<p class="text-secondary mb-0">Please login again to change your password.</p>';
                }
            });
            return;
        }
        firebase.auth().sendPasswordResetEmail(user.email).then(function() {
            Popup.open({
                id: 'pwd-popup',
                size: 'sm',
                render: function(ctx) {
                    var icon = document.createElement('div');
                    icon.className = 'popup-icon';
                    icon.innerHTML = '<i class="bi bi-check-circle-fill" style="color:var(--success);"></i>';
                    ctx.body.appendChild(icon);
                    var msg = document.createElement('p');
                    msg.className = 'text-secondary mb-0';
                    msg.textContent = 'Password reset email sent to ' + user.email;
                    ctx.body.appendChild(msg);
                }
            });
        }).catch(function(err) {
            Popup.open({
                id: 'pwd-popup',
                size: 'sm',
                title: 'Error',
                render: function(ctx) {
                    ctx.body.innerHTML = '<p class="text-secondary mb-0">' + (err.message || 'Failed to send reset email') + '</p>';
                }
            });
        });
    });

    document.getElementById('changeEmailBtn')?.addEventListener('click', function() {
        Popup.open({
            id: 'email-popup',
            size: 'sm',
            title: 'Change Email',
            render: function(ctx) {
                var input = document.createElement('input');
                input.type = 'email';
                input.className = 'form-control';
                input.id = 'popup-email';
                input.placeholder = 'Enter new email';
                ctx.body.appendChild(input);

                var status = document.createElement('div');
                status.id = 'popup-email-status';
                status.className = 'mt-2 small';
                ctx.body.appendChild(status);

                var submit = document.createElement('button');
                submit.className = 'custom-btn border-0';
                submit.textContent = 'Update';
                submit.addEventListener('click', async function() {
                    if (submit.disabled) return;
                    submit.disabled = true;
                    var email = input.value.trim();
                    if (!email || !email.includes('@')) {
                        submit.disabled = false;
                        status.textContent = 'Please enter a valid email';
                        status.style.color = '#ef4444';
                        return;
                    }
                    try {
                        var user = firebase.auth().currentUser;
                        if (!user) {
                            submit.disabled = false;
                            status.textContent = 'Please login again';
                            status.style.color = 'var(--error)';
                            return;
                        }
                        await user.updateEmail(email);
                        var res = await apiPut('/profile', { email: email });
                        if (res && !res.error) {
                            Popup.close('email-popup');
                        } else {
                            submit.disabled = false;
                            status.textContent = res.error || 'Failed to update email';
                            status.style.color = 'var(--error)';
                        }
                    } catch (err) {
                        submit.disabled = false;
                        if (err.code === 'auth/requires-recent-login') {
                            status.textContent = 'Please login again before changing email';
                        } else if (err.code === 'auth/email-already-in-use') {
                            status.textContent = 'Email already in use';
                        } else {
                            status.textContent = err.message || 'Failed to change email';
                        }
                        status.style.color = '#ef4444';
                    }
                });
                ctx.footer.appendChild(submit);
            }
        });
    });

    document.getElementById('logoutBtn')?.addEventListener('click', function() {
        logout().then(function() {
            window.location.href = '/frontend/pages/guest/auth/login.html';
        });
    });
});
