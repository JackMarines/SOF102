// User team search — team catalog with search, sort, and pagination
window.addEventListener('deps-ready', function () {
    window.teamTable = TeamTable.init('team-table', {
        searchPlaceholder: 'Search teams...',
        sortByOptions: [
            { label: 'Members', value: 'members' },
            { label: 'Solved', value: 'solved' }
        ],
        sortByLabel: 'Sort by',
        orderOptions: [
            { label: 'Descending', value: 'desc' },
            { label: 'Ascending', value: 'asc' }
        ],
        orderLabel: 'Order',
        urlTemplate: '/frontend/pages/user/team/index.html?id=',
        onSearch: function () { loadTeams(1); },
        onSort: function () { loadTeams(1); },
        onPageChange: function (page) { loadTeams(page); }
    });

    loadTeams();

    var table = document.getElementById('team-table');
    var grid = table.querySelector('.tt-grid');
    if (grid) {
        var btn = document.createElement('button');
        btn.className = 'btn-devclimb primary';
        btn.id = 'create-team-btn';
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:1rem;vertical-align:middle;margin-right:var(--space-4px);">add</span> Create Team';
        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;justify-content:flex-end;margin-top:var(--space-12px);margin-bottom:var(--space-12px);';
        wrapper.appendChild(btn);
        table.insertBefore(wrapper, grid);
        btn.addEventListener('click', function () {
            Popup.open({
                id: 'create-team-popup',
                title: 'Create Team',
                size: 'md',
                render: function (ctx) {
                    var nameSection = document.createElement('div');
                    nameSection.style.marginBottom = 'var(--space-24px)';
                    nameSection.innerHTML =
                        '<label for="create-team-name" style="font-size:0.75rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:var(--space-4px);">Team Name</label>' +
                        '<input type="text" id="create-team-name" placeholder="Enter your team name" style="width:100%;">' +
                        '<div id="create-team-name-error" style="font-size:0.75rem;color:var(--error);margin-top:var(--space-4px);display:none;"></div>';
                    ctx.body.appendChild(nameSection);

                    var visSection = document.createElement('div');
                    visSection.style.marginBottom = 'var(--space-24px)';
                    visSection.innerHTML =
                        '<label style="font-size:0.75rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:var(--space-12px);">Team Visibility</label>' +
                        '<div class="visibility-toggle-grid">' +
                            '<div class="visibility-card active" data-type="public">' +
                                '<div class="vis-icon"><span class="material-symbols-outlined" style="font-size:1.5rem;color:var(--text-muted);">public</span></div>' +
                                '<div class="vis-label">Public</div>' +
                                '<div style="font-size:0.6875rem;color:var(--text-faint);margin-top:var(--space-4px);">Anyone can discover and join</div>' +
                            '</div>' +
                            '<div class="visibility-card" data-type="private">' +
                                '<div class="vis-icon"><span class="material-symbols-outlined" style="font-size:1.5rem;color:var(--text-muted);">lock</span></div>' +
                                '<div class="vis-label">Private</div>' +
                                '<div style="font-size:0.6875rem;color:var(--text-faint);margin-top:var(--space-4px);">No one can join</div>' +
                            '</div>' +
                        '</div>';
                    ctx.body.appendChild(visSection);

                    var cards = visSection.querySelectorAll('.visibility-card');
                    cards.forEach(function (c) {
                        c.onclick = function () {
                            cards.forEach(function (x) { x.classList.remove('active'); });
                            c.classList.add('active');
                        };
                    });

                    var btnRow = document.createElement('div');
                    btnRow.style.cssText = 'display:flex;gap:var(--space-12px);justify-content:flex-end;';
                    var cancelBtn = document.createElement('button');
                    cancelBtn.className = 'btn-devclimb secondary sm';
                    cancelBtn.textContent = 'Cancel';
                    cancelBtn.addEventListener('click', function () { ctx.close(); });
                    var createBtn = document.createElement('button');
                    createBtn.className = 'btn-devclimb primary sm';
                    createBtn.textContent = 'Create';
                    createBtn.addEventListener('click', async function () {
                        var btn = this;
                        if (btn.disabled) return;
                        var name = document.getElementById('create-team-name').value.trim();
                        var nameError = document.getElementById('create-team-name-error');
                        nameError.style.display = 'none';
                        if (!name) {
                            nameError.textContent = 'Team name is required';
                            nameError.style.display = 'block';
                            return;
                        }
                        var activeCard = visSection.querySelector('.visibility-card.active');
                        var isPublic = activeCard ? activeCard.getAttribute('data-type') === 'public' : true;
                        btn.disabled = true;
                        btn.textContent = 'Creating...';
                        var res = await createTeam({ name: name, isPublic: isPublic });
                        btn.disabled = false;
                        btn.textContent = 'Create';
                        if (res && !res.error) {
                            ctx.close();
                            window.location.reload();
                        } else {
                            var err = res ? res.error || 'Failed to create team' : 'Failed to create team';
                            if (err.toLowerCase().indexOf('duplicate') !== -1 || err.toLowerCase().indexOf('already exist') !== -1) {
                                nameError.textContent = 'A team with this name already exists';
                            } else {
                                nameError.textContent = err;
                            }
                            nameError.style.display = 'block';
                        }
                    });
                    btnRow.appendChild(cancelBtn);
                    btnRow.appendChild(createBtn);
                    ctx.body.appendChild(btnRow);
                }
            });
        });
    }
});
