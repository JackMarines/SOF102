var _skeletonTemplates = {
  'announcement-rows': function () {
    var html = '';
    for (var i = 0; i < 5; i++) {
      html += '<div class="skeleton-table-row" style="padding:16px 20px;">' +
        '<div class="skeleton skeleton-text" style="width:60%;"></div>' +
        '<div class="skeleton skeleton-text"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:60%;margin:0 auto;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:50%;margin:0 0 0 auto;"></div>' +
        '</div>';
    }
    return html;
  },

  'puzzle-rows': function () {
    var html = '';
    for (var i = 0; i < 6; i++) {
      html += '<div class="skeleton-table-row" style="grid-template-columns:60px 1fr 150px 120px;">' +
        '<div class="skeleton skeleton-text-sm" style="width:40%;"></div>' +
        '<div class="skeleton skeleton-text"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:50%;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:50%;"></div>' +
        '</div>';
    }
    return html;
  },

  'puzzle-rows-has-user': function () {
    var html = '';
    for (var i = 0; i < 6; i++) {
      html += '<div class="skeleton-table-row has-user" style="grid-template-columns:150px 1fr 120px 100px;">' +
        '<div class="skeleton skeleton-text" style="width:60%;"></div>' +
        '<div class="skeleton skeleton-text"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:50%;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:50%;"></div>' +
        '</div>';
    }
    return html;
  },

  'stat-cards': function () {
    var html = '<div class="skeleton-stat-grid">';
    for (var i = 0; i < 4; i++) {
      html += '<div class="skeleton skeleton-stat-card">' +
        '<div class="skeleton skeleton-title" style="width:40%;margin:0 auto;"></div>' +
        '<div class="skeleton skeleton-text" style="width:60%;margin:var(--space-8px) auto 0;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:30%;margin:var(--space-4px) auto 0;"></div>' +
        '</div>';
    }
    return html + '</div>';
  },

  'profile-info': function () {
    return '<div style="display:flex;align-items:center;gap:var(--space-32px);">' +
      '<div class="skeleton skeleton-avatar-lg" style="width:120px;height:120px;"></div>' +
      '<div style="flex:1;">' +
      '<div class="skeleton skeleton-title" style="width:40%;"></div>' +
      '<div class="skeleton skeleton-text" style="width:70%;"></div>' +
      '<div class="skeleton skeleton-text-sm" style="width:30%;"></div>' +
      '</div></div>';
  },

  'chart-area': function () {
    return '<div class="skeleton skeleton-chart"></div>';
  },

  'team-grid': function () {
    var html = '';
    for (var i = 0; i < 6; i++) {
      html += '<div class="skeleton skeleton-team-card">' +
        '<div class="skeleton skeleton-avatar" style="width:64px;height:64px;margin-bottom:8px;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:60%;margin:0 auto 4px;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:50%;margin:0 auto 8px;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:40%;margin:0 auto;"></div>' +
        '</div>';
    }
    return html;
  },

  'solve-panel': function () {
    return '<div class="skeleton-puzzle-panel">' +
      '<div class="skeleton skeleton-text-sm" style="width:100px;"></div>' +
      '<div class="skeleton skeleton-heading" style="width:80%;"></div>' +
      '<div class="skeleton-badge-row">' +
      '<div class="skeleton" style="width:70px;height:1.5rem;"></div>' +
      '<div class="skeleton" style="width:60px;height:1.5rem;"></div>' +
      '</div>' +
      '<div class="skeleton skeleton-text"></div>' +
      '<div class="skeleton skeleton-text"></div>' +
      '<div class="skeleton skeleton-text" style="width:60%;"></div>' +
      '<div style="margin-top:var(--space-16px);">' +
      '<div class="skeleton skeleton-text-sm" style="width:80px;"></div>' +
      '<div class="skeleton skeleton-text" style="width:50%;"></div>' +
      '<div class="skeleton skeleton-text" style="width:40%;"></div>' +
      '</div></div>';
  },

  'team-info': function () {
    return '<div style="display:flex;align-items:center;gap:var(--space-24px);margin-bottom:var(--space-24px);">' +
      '<div class="skeleton skeleton-avatar-lg" style="width:120px;height:120px;"></div>' +
      '<div style="flex:1;">' +
      '<div class="skeleton skeleton-heading" style="width:50%;"></div>' +
      '<div class="skeleton skeleton-text" style="width:30%;"></div>' +
      '<div class="skeleton skeleton-text-sm" style="width:20%;"></div>' +
      '</div></div>';
  },

  'member-rows': function () {
    var html = '<div class="cg-grid">';
    for (var i = 0; i < 11; i++) {
      html += '<a class="cg-card" style="pointer-events:none;">' +
        '<div class="skeleton skeleton-avatar" style="width:48px;height:48px;margin:0 auto 8px;"></div>' +
        '<div class="skeleton skeleton-text" style="width:60%;margin:0 auto 4px;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:40%;margin:0 auto;"></div>' +
        '</a>';
    }
    return html + '</div>';
  },

  'contributor-rows': function () {
    var html = '';
    for (var i = 0; i < 5; i++) {
      html += '<div style="display:flex;align-items:center;gap:var(--space-12px);padding:8px 0;border-bottom:1px solid var(--border-subtle);">' +
        '<div class="skeleton skeleton-avatar" style="width:28px;height:28px;"></div>' +
        '<div class="skeleton skeleton-text" style="flex:1;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:40px;"></div>' +
        '</div>';
    }
    return html;
  },

  'contest-grid': function () {
    var html = '';
    for (var i = 0; i < 6; i++) {
      html += '<div class="glass-box" style="padding:var(--space-24px) var(--space-16px);">' +
        '<div class="skeleton skeleton-avatar" style="width:80px;height:80px;margin:0 auto var(--space-12px);"></div>' +
        '<div class="skeleton skeleton-heading" style="width:70%;margin:0 auto var(--space-8px);"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:50%;margin:0 auto var(--space-12px);"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:60%;margin:0 auto var(--space-8px);"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:40%;margin:0 auto;"></div>' +
        '</div>';
    }
    return html;
  },

  'search-rows': function () {
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">';
    for (var i = 0; i < 8; i++) {
      html += '<div class="glass-box p-3" style="text-align:center;">' +
        '<div class="skeleton skeleton-avatar" style="width:80px;height:80px;margin:0 auto 12px;"></div>' +
        '<div class="skeleton skeleton-text" style="width:70%;margin:0 auto 8px;"></div>' +
        '<div class="skeleton skeleton-text-sm" style="width:40%;margin:0 auto;"></div>' +
        '</div>';
    }
    return html + '</div>';
  }
};

function showSkeleton(containerId, type) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var template = _skeletonTemplates[type];
  if (!template) {
    container.innerHTML = '<div class="skeleton" style="height:100px;"></div>';
    return;
  }
  container.innerHTML = template();
}

function hideSkeleton(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
}
