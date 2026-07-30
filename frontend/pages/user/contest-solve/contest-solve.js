// Contest-solve page orchestrator — tải chi tiết contest, hiển thị header + danh sách puzzle + sidebar
(function () {

    var leftEl = document.getElementById('contest-left');
    var rightEl = document.getElementById('contest-right');

    function formatDate(ts) {
        if (!ts) return '';
        var d = new Date(ts);
        var opts = { month: 'short', day: 'numeric', year: 'numeric' };
        return d.toLocaleDateString('en-US', opts);
    }

    function formatDuration(start, end) {
        if (!start || !end) return '—';
        var ms = end - start;
        var days = Math.floor(ms / 86400000);
        if (days >= 1) return days + ' day' + (days > 1 ? 's' : '');
        var hours = Math.floor(ms / 3600000);
        return hours + ' hour' + (hours > 1 ? 's' : '');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Left Column ──

    function renderHeader(c) {
        var header = document.createElement('div');
        header.className = 'contest-header';

        var banner = document.createElement('div');
        banner.className = 'contest-header-banner';
        if (c.avatar) {
            var img = document.createElement('img');
            img.src = c.avatar;
            img.alt = c.title || '';
            banner.appendChild(img);
        }
        var gradient = document.createElement('div');
        gradient.className = 'banner-gradient';
        banner.appendChild(gradient);

        var badge = document.createElement('span');
        badge.className = 'contest-status-badge ' + (c.status || 'ended');
        badge.textContent = c.status || 'ended';
        banner.appendChild(badge);

        header.appendChild(banner);

        var body = document.createElement('div');
        body.className = 'contest-header-body';

        var title = document.createElement('h1');
        title.className = 'contest-header-title';
        title.textContent = c.title || '';
        body.appendChild(title);

        var meta = document.createElement('div');
        meta.className = 'contest-header-meta';

        if (c.authorName) {
            var authorLink = document.createElement('a');
            authorLink.className = 'contest-header-author';
            authorLink.href = '#';
            var authorAvatar = Avatar.render({ size: 18, avatar: c.authorAvatar || null, isAdmin: !!c.authorIsAdmin, trophySrc: c.authorSelectedTrophyAvatar || null });
            authorLink.appendChild(authorAvatar);
            var authorText = document.createElement('span');
            authorText.textContent = ' ' + c.authorName;
            authorLink.appendChild(authorText);
            meta.appendChild(authorLink);
        }

        if (c.start) {
            var dates = document.createElement('span');
            dates.className = 'contest-header-dates';
            dates.innerHTML = '<span class="material-symbols-outlined" style="font-size:0.875rem;">calendar_today</span> ' + formatDate(c.start) + (c.end ? ' — ' + formatDate(c.end) : '');
            meta.appendChild(dates);
        }

        body.appendChild(meta);

        if (c.content) {
            var desc = document.createElement('p');
            desc.className = 'contest-header-desc';
            desc.textContent = c.content;
            body.appendChild(desc);
        }

        header.appendChild(body);
        leftEl.appendChild(header);
    }

    function renderPuzzles(puzzles) {
        if (!puzzles || puzzles.length === 0) return;

        for (var i = 0; i < puzzles.length; i++) {
            var p = puzzles[i];

            var section = document.createElement('div');
            section.className = 'puzzle-section';

            var termHeader = document.createElement('div');
            termHeader.className = 'puzzle-terminal-header';
            var headerLabel = document.createElement('span');
            headerLabel.textContent = 'CHALLENGE_' + String(i + 1).padStart(2, '0');
            termHeader.appendChild(headerLabel);
            section.appendChild(termHeader);

            var body = document.createElement('div');
            body.className = 'puzzle-body';

            var titleRow = document.createElement('div');
            titleRow.className = 'puzzle-title-row';

            var h2 = document.createElement('h2');
            h2.textContent = p.title || '';
            titleRow.appendChild(h2);

            var diff = (p.difficulty || '').toLowerCase();
            if (diff) {
                var diffBadge = document.createElement('span');
                diffBadge.className = 'puzzle-badge ' + diff;
                diffBadge.textContent = p.difficulty;
                titleRow.appendChild(diffBadge);
            }

            if (p.language) {
                var langBadge = document.createElement('span');
                langBadge.className = 'puzzle-badge lang';
                langBadge.textContent = p.language;
                titleRow.appendChild(langBadge);
            }

            if (p.solved) {
                var solvedBadge = document.createElement('span');
                solvedBadge.className = 'puzzle-badge solved';
                solvedBadge.textContent = 'SOLVED';
                titleRow.appendChild(solvedBadge);
            }

            body.appendChild(titleRow);

            if (p.content) {
                var content = document.createElement('div');
                content.className = 'puzzle-content';
                content.append(...parsePuzzleContent(p.content || ''));
                body.appendChild(content);
            }

            var btnRow = document.createElement('div');
            btnRow.className = 'solve-btn';
            var btn = document.createElement('a');
            btn.className = 'btn-devclimb ' + (p.solved ? 'secondary' : 'primary');
            btn.href = '/frontend/pages/user/solve/?id=' + p.id;
            btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">' + (p.solved ? 'replay' : 'play_arrow') + '</span> ' + (p.solved ? 'REVISIT' : 'SOLVE PUZZLE');
            btnRow.appendChild(btn);
            body.appendChild(btnRow);

            section.appendChild(body);
            leftEl.appendChild(section);
        }
    }

    // ── Right Column ──

    function renderSidebar(c) {
        // Thông tin hệ thống
        var sysPanel = createPanel('panel-system', 'SYSTEM_INFO');
        var sysBody = sysPanel.querySelector('.sidebar-body');
        addRow(sysBody, 'Duration', formatDuration(c.start, c.end));
        addRow(sysBody, 'Puzzles', String(c.problemCount || 0));
        addRow(sysBody, 'Participants', String(c.participants || 0));
        rightEl.appendChild(sysPanel);

        // Phần thưởng
        if (c.trophyName) {
            var rewardPanel = createPanel('panel-reward', 'REWARD');
            var rewardBody = rewardPanel.querySelector('.sidebar-body');
            rewardBody.style.textAlign = 'center';

            if (c.trophyAvatar) {
                var img = document.createElement('img');
                img.className = 'reward-image';
                img.src = c.trophyAvatar;
                img.alt = c.trophyName;
                rewardBody.appendChild(img);
            }

            var rName = document.createElement('div');
            rName.className = 'reward-name';
            rName.textContent = c.trophyName;
            rewardBody.appendChild(rName);

            if (c.trophyContent) {
                var rDesc = document.createElement('div');
                rDesc.className = 'reward-desc';
                rDesc.textContent = c.trophyContent;
                rewardBody.appendChild(rDesc);
            }

            if (c.userHasTrophy) {
                var earned = document.createElement('div');
                earned.className = 'reward-earned';
                earned.textContent = 'TROPHY EARNED';
                rewardBody.appendChild(earned);
            } else if (c.status === 'ended') {
                var ended = document.createElement('div');
                ended.className = 'reward-ended';
                ended.textContent = 'CONTEST ENDED';
                rewardBody.appendChild(ended);
            }

            rightEl.appendChild(rewardPanel);
        }

        // Luật lệ
        var rulesPanel = createPanel('panel-rules', 'CONTEST_RULES');
        var rulesBody = rulesPanel.querySelector('.sidebar-body');
        var rulesList = document.createElement('ul');
        rulesList.className = 'sidebar-rules-list';
        var rules = [
            'Solve all puzzles to earn the trophy',
            'Each puzzle has multiple test cases',
            'Timer tracks your solve duration',
            'Best time wins on the leaderboard'
        ];
        for (var i = 0; i < rules.length; i++) {
            var li = document.createElement('li');
            li.innerHTML = '<span class="arrow">›</span> ' + rules[i];
            rulesList.appendChild(li);
        }
        rulesBody.appendChild(rulesList);
        rightEl.appendChild(rulesPanel);
    }

    // ── Init ──

    async function init() {
        var params = new URLSearchParams(window.location.search);
        var id = params.get('id');
        if (!id) {
            leftEl.innerHTML = '<p style="color:var(--text-muted);">No contest specified.</p>';
            return;
        }

        showSpinner('contest-left');
        var data = await getContest(id);
        hideSpinner('contest-left');

        if (!data || data.error) {
            leftEl.innerHTML = '<p style="color:var(--text-muted);">' + (data && data.error ? data.error : 'Contest not found.') + '</p>';
            return;
        }

        renderHeader(data);
        renderPuzzles(data.puzzles);
        renderSidebar(data);

        if (typeof getMe === 'function') {
            try {
                var session = await getMe();
                if (session && session.userIsadmin) {
                    renderAdminBar(id);
                }
            } catch (e) {}
        }
    }

    function renderAdminBar(contestId) {
        var bar = document.createElement('div');
        bar.style.cssText = 'display:flex;gap:var(--space-8px);margin-bottom:var(--space-16px);';
        var btn = document.createElement('a');
        btn.className = 'btn-devclimb secondary';
        btn.href = '/frontend/pages/admin/contest-create/index.html?id=' + contestId;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;">edit</span> EDIT CONTEST';
        btn.style.textDecoration = 'none';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        bar.appendChild(btn);
        var grid = leftEl.parentElement;
        grid.parentElement.insertBefore(bar, grid);
    }

    window.addEventListener('deps-ready', init);

})();
