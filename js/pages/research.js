// ===== Research Hub Page =====

function renderResearch() {
  const cases = Store.get('cases') || [];
  const activeCase = cases.find(c => c.status === 'in-progress') || cases[0];

  if (!activeCase) {
    return '<div class="empty-state"><div class="empty-icon">🔎</div><h4>No cases available</h4><p>Create a case first to manage research</p></div>';
  }

  const research = activeCase.research || [];
  const keyInsights = research.filter(r => r.keyInsight);

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1>Research Hub</h1>
        <p class="text-secondary text-sm">${escapeHtml(activeCase.name)} • ${research.length} entries</p>
      </div>
      <button class="btn btn-primary" onclick="showNewResearchModal('${activeCase.id}')">+ Add Research</button>
    </div>
  `;

  // Key Insights
  if (keyInsights.length > 0) {
    html += '<div class="card mb-6"><h3 class="mb-4">⭐ Key Insights</h3><div class="grid-2">';
    keyInsights.forEach(r => {
      html += `
        <div style="padding:16px;background:var(--accent-light);border-radius:var(--radius);border-left:3px solid var(--accent)">
          <h4 style="margin-bottom:4px">${escapeHtml(r.title)}</h4>
          <p class="text-sm">${escapeHtml(r.insight)}</p>
          <div class="text-xs text-secondary mt-2">Source: ${escapeHtml(r.source)}</div>
        </div>
      `;
    });
    html += '</div></div>';
  }

  // All Research
  html += '<div class="flex gap-3 mb-4">';
  html += `<input class="form-input" placeholder="Search research..." style="max-width:300px" oninput="filterResearchList(this.value)">`;
  html += '<select class="form-input" style="width:auto"><option value="all">All Categories</option><option value="market">Market</option><option value="customer">Customer</option><option value="competitor">Competitor</option><option value="industry">Industry</option><option value="financial">Financial</option><option value="trend">Trend</option></select>';
  html += '<select class="form-input" style="width:auto"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="important">Most Important</option></select>';
  html += '</div>';

  if (research.length > 0) {
    html += '<div style="display:flex;flex-direction:column;gap:12px">';
    research.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(r => {
      const member = getMember(r.addedBy);
      html += `
        <div class="card" style="padding:16px;border-left:3px solid ${r.keyInsight ? 'var(--accent)' : 'var(--border)'}">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              ${r.keyInsight ? '<span>⭐</span>' : ''}
              <h4>${escapeHtml(r.title)}</h4>
              <span class="tag">${r.category}</span>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-sm" onclick="toggleKeyInsight('${activeCase.id}', '${r.id}')">${r.keyInsight ? '★ Key Insight' : '☆ Mark as Key'}</button>
              <button class="btn btn-ghost btn-sm" onclick="deleteResearch('${activeCase.id}', '${r.id}')">🗑️</button>
            </div>
          </div>
          <p class="text-sm mt-2">${escapeHtml(r.insight)}</p>
          <div class="flex items-center gap-4 mt-2 text-xs text-secondary">
            <span>Source: ${escapeHtml(r.source)}</span>
            <span>By ${member.name}</span>
            <span>${formatDate(r.date)}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<div class="empty-state"><div class="empty-icon">🔎</div><h4>No research yet</h4><p>Add research entries with sources to build your knowledge base</p></div>';
  }

  return html;
}

function filterResearchList(query) {
  // Simple re-render approach — search is visual only for now
  App.navigate('research');
}
