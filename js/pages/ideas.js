// ===== Ideas Board Page =====

function renderIdeas(caseId) {
  const cases = Store.get('cases') || [];
  let c;
  if (caseId) {
    c = cases.find(x => x.id === caseId);
  } else {
    c = cases.find(x => x.status === 'in-progress') || cases[0];
  }

  if (!c) {
    return '<div class="empty-state"><div class="empty-icon">💡</div><h4>No case available</h4></div>';
  }

  const ideas = (c.ideas || []).map(i => ({ ...i, score: calculateIdeaScore(i) })).sort((a, b) => b.score - a.score);
  const medals = ['🥇', '🥈', '🥉'];

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1>💡 Idea Board</h1>
        <p class="text-secondary text-sm">${escapeHtml(c.name)} • ${ideas.length} ideas</p>
      </div>
      <button class="btn btn-primary" onclick="showNewIdeaModal('${c.id}')">+ New Idea</button>
    </div>
  `;

  if (ideas.length > 0) {
    html += '<div style="display:flex;flex-direction:column;gap:16px">';
    ideas.forEach((idea, idx) => {
      const currentMember = Store.get('settings')?.currentMember || 'm1';
      const hasVoted = (idea.votes || []).includes(currentMember);
      html += `
        <div class="card" style="padding:24px">
          <div class="flex gap-6">
            <div class="flex flex-col items-center" style="min-width:80px">
              <span style="font-size:2.5rem">${medals[idx] || ''}</span>
              <div style="font-size:1.75rem;font-weight:800;color:var(--accent)">${idea.score}</div>
              <div class="text-xs text-secondary">/100</div>
            </div>
            <div style="flex:1">
              <h3 style="margin-bottom:4px">${escapeHtml(idea.name)}</h3>
              <p class="text-sm text-secondary mb-3">${escapeHtml(idea.description)}</p>
              <div class="flex gap-2 flex-wrap">
                <span class="tag" style="background:var(--green-light);color:#15803d">Impact: ${idea.impact}/10</span>
                <span class="tag" style="background:var(--blue-light);color:#1d4ed8">Feasibility: ${idea.feasibility}/10</span>
                <span class="tag" style="background:var(--yellow-light);color:#b45309">Cost: ${idea.cost}/10</span>
                <span class="tag" style="background:var(--red-light);color:#dc2626">Difficulty: ${idea.difficulty}/10</span>
              </div>
            </div>
            <div class="flex flex-col items-center gap-2" style="min-width:80px">
              <button class="btn ${hasVoted ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="voteIdea('${c.id}', '${idea.id}')">
                👍 ${(idea.votes || []).length} votes
              </button>
              <span class="text-xs text-secondary">${(idea.votes || []).length} team votes</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<div class="empty-state"><div class="empty-icon">💡</div><h4>No ideas yet</h4><p>Start brainstorming solutions and vote as a team</p></div>';
  }

  return html;
}
