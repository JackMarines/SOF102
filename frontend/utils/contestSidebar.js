// ── Helpers sidebar panel (dùng chung cho contest-solve và contest-create) ──

function createPanel(id, label) {
    var panel = document.createElement('div');
    panel.className = 'sidebar-panel';
    panel.id = id;

    var header = document.createElement('div');
    header.className = 'solve-pane-header sidebar-toggle';
    header.onclick = function () { panel.classList.toggle('collapsed'); };

    var span = document.createElement('span');
    span.className = 'pane-label';
    span.textContent = label;
    header.appendChild(span);

    var dots = document.createElement('div');
    dots.className = 'pane-dots';
    for (var d = 0; d < 3; d++) {
        var dot = document.createElement('span');
        dot.className = 'pane-dot';
        dots.appendChild(dot);
    }
    header.appendChild(dots);

    panel.appendChild(header);

    var body = document.createElement('div');
    body.className = 'solve-pane-body sidebar-body';
    panel.appendChild(body);

    return panel;
}

function addRow(container, label, value) {
    var row = document.createElement('div');
    row.className = 'sidebar-row';
    var l = document.createElement('span');
    l.className = 'label';
    l.textContent = label;
    var v = document.createElement('span');
    v.className = 'value';
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    container.appendChild(row);
}
