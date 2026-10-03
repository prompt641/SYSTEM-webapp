// ===== Global Search =====

function openSearch() {
  const overlay = document.getElementById('searchOverlay');
  overlay.classList.add('active');
  const input = document.getElementById('searchInput');
  input.value = '';
  input.focus();
  document.getElementById('searchResults').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">Type to search across cases, tasks, notes, research, and more...</div>';
}

function closeSearch() {
  document.getElementById('searchOverlay').classList.remove('active');
}

function performSearch(query) {
  if (!query || query.length < 2) {
    document.getElementById('searchResults').innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">Type to search...</div>';
    return;
  }

  const q = query.toLowerCase();
  const results = [];

  // Search cases
  const cases = Store.get('cases') || [];
  cases.forEach(c => {
    if (c.name.toLowerCase().includes(q) || c.competition.toLowerCase().includes(q)) {
      results.push({ type: 'Case', icon: '📁', iconBg: '#eef2ff', title: c.name, subtitle: c.competition, action: () => App.navigate('case-workspace', c.id) });
    }
    // Search tasks within cases
    (c.tasks || []).forEach(t => {
      if (t.title.toLowerCase().includes(q)) {
        results.push({ type: 'Task', icon: '📝', iconBg: '#fef3c7', title: t.title, subtitle: `${c.name} — ${getMember(t.assignee).name}`, action: () => App.navigate('tasks') });
      }
    });
    // Search research
    (c.research || []).forEach(r => {
      if (r.title.toLowerCase().includes(q) || r.insight.toLowerCase().includes(q)) {
        results.push({ type: 'Research', icon: '🔎', iconBg: '#f0fdf4', title: r.title, subtitle: r.insight.substring(0, 60) + '...', action: () => App.navigate('research', c.id) });
      }
    });
    // Search ideas
    (c.ideas || []).forEach(i => {
      if (i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) {
        results.push({ type: 'Idea', icon: '💡', iconBg: '#fffbeb', title: i.name, subtitle: i.description.substring(0, 60) + '...', action: () => App.navigate('ideas', c.id) });
      }
    });
  });

  // Search notes
  const notes = Store.get('notes') || [];
  notes.forEach(n => {
    if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
      results.push({ type: 'Note', icon: '📝', iconBg: '#faf5ff', title: n.title, subtitle: `${n.category} — ${formatDate(n.date)}`, action: () => App.navigate('notes') });
    }
  });

  // Search meetings
  const meetings = Store.get('meetings') || [];
  meetings.forEach(m => {
    if (m.title.toLowerCase().includes(q) || m.agenda.some(a => a.toLowerCase().includes(q))) {
      results.push({ type: 'Meeting', icon: '📅', iconBg: '#eff6ff', title: m.title, subtitle: `${formatDate(m.date)} ${formatTime(m.startTime)}`, action: () => App.navigate('meetings') });
    }
  });

  // Search members
  const members = Store.get('members') || [];
  members.forEach(m => {
    if (m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)) {
      results.push({ type: 'Team', icon: '👥', iconBg: '#fef2f2', title: m.name, subtitle: m.role, action: () => App.navigate('team') });
    }
  });

  renderSearchResults(results);
}

function renderSearchResults(results) {
  const container = document.getElementById('searchResults');
  if (results.length === 0) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">No results found</div>';
    return;
  }

  container.innerHTML = results.map(r => `
    <div class="search-result-item" onclick="handleSearchResultClick(this)" data-index="${results.indexOf(r)}">
      <div class="search-result-icon" style="background:${r.iconBg}">${r.icon}</div>
      <div class="search-result-text">
        <div class="title">${escapeHtml(r.title)}</div>
        <div class="subtitle">${escapeHtml(r.subtitle)}</div>
      </div>
      <span class="search-result-type">${r.type}</span>
    </div>
  `).join('');

  // Store results for click handling
  container._results = results;
}

function handleSearchResultClick(el) {
  const idx = parseInt(el.dataset.index);
  const container = document.getElementById('searchResults');
  if (container._results && container._results[idx]) {
    closeSearch();
    container._results[idx].action();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    closeSearch();
    closeModal();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchOverlay')?.addEventListener('click', e => {
    if (e.target.id === 'searchOverlay') closeSearch();
  });

  document.getElementById('searchInput')?.addEventListener('input', debounce(e => {
    performSearch(e.target.value);
  }, 200));
});
