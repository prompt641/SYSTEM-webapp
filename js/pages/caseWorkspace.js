// ===== Case Workspace =====

let caseWorkspaceTab = 'overview';
let caseTimerInterval = null;
let caseTimerSeconds = 0;
let caseTimerRunning = false;

function renderCaseWorkspace(caseId) {
  const cases = Store.get('cases') || [];
  const caseData = cases.find(c => c.id === caseId);
  if (!caseData) return '<div class="empty-state"><h4>Case not found</h4></div>';

  caseWorkspaceTab = window._caseTab || 'overview';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'problem', label: 'Problem' },
    { id: 'research', label: 'Research' },
    { id: 'ideas', label: 'Ideas' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'finance', label: 'Finance' },
    { id: 'slides', label: 'Slides' },
    { id: 'pitch', label: 'Pitch' },
    { id: 'files', label: 'Files' },
    { id: 'checklist', label: 'Checklist' },
  ];

  let html = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="breadcrumb">
          <span onclick="App.navigate('cases')">Cases</span>
          <span class="separator">›</span>
          <span class="current">${escapeHtml(caseData.name)}</span>
        </div>
        <h1 style="margin-top:4px">${escapeHtml(caseData.name)}</h1>
        <p class="text-secondary text-sm">${escapeHtml(caseData.competition)} • Deadline: ${getTimeRemaining(caseData.deadline)}</p>
      </div>
      <div class="flex gap-2">
        ${caseData.status === 'in-progress' ? `<span class="badge badge-progress">🟡 In Progress</span>` : `<span class="badge badge-done">🟢 Completed</span>`}
      </div>
    </div>
    <div class="tabs mb-6">
      ${tabs.map(t => `
        <div class="tab ${caseWorkspaceTab === t.id ? 'active' : ''}" onclick="window._caseTab='${t.id}'; App.navigate('case-workspace', '${caseId}')">${t.label}</div>
      `).join('')}
    </div>
  `;

  switch (caseWorkspaceTab) {
    case 'overview': html += renderCaseOverview(caseData); break;
    case 'problem': html += renderCaseProblem(caseData); break;
    case 'research': html += renderCaseResearch(caseData); break;
    case 'ideas': html += renderCaseIdeas(caseData); break;
    case 'strategy': html += renderCaseStrategy(caseData); break;
    case 'finance': html += renderCaseFinance(caseData); break;
    case 'slides': html += renderCaseSlides(caseData); break;
    case 'pitch': html += renderCasePitch(caseData); break;
    case 'files': html += renderCaseFiles(caseData); break;
    case 'checklist': html += renderCaseChecklist(caseData); break;
  }

  return html;
}

function renderCaseOverview(c) {
  const tasks = c.tasks || [];
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const review = tasks.filter(t => t.status === 'review').length;
  const done = tasks.filter(t => t.status === 'done').length;

  let html = `
    <div class="grid-4 mb-6">
      <div class="stat-card">
        <div class="stat-label">Progress</div>
        <div class="stat-value" style="color:var(--accent)">${c.progress}%</div>
        <div class="progress-bar mt-2"><div class="progress-fill" style="width:${c.progress}%"></div></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Tasks</div>
        <div class="stat-value">${tasks.length}</div>
        <div class="stat-change up">${done} completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Research</div>
        <div class="stat-value">${(c.research || []).length}</div>
        <div class="stat-change">${(c.research || []).filter(r => r.keyInsight).length} key insights</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ideas</div>
        <div class="stat-value">${(c.ideas || []).length}</div>
        <div class="stat-change up">${(c.ideas || []).filter(i => (i.votes || []).length >= 3).length} top voted</div>
      </div>
    </div>

    <div class="grid-2 mb-6">
      <!-- Timer -->
      <div class="card">
        <h3 class="mb-4">⏱️ Case Timer</h3>
        <div class="timer-display" id="caseTimerDisplay">${formatTimerDisplay(c.timer?.preparation || 14400)}</div>
        <div class="text-center text-sm text-secondary mt-2" id="caseTimerLabel">Preparation Time</div>
        <div class="timer-controls">
          <button class="btn btn-primary btn-sm" onclick="startCaseTimer('${c.id}')">▶ Start</button>
          <button class="btn btn-secondary btn-sm" onclick="pauseCaseTimer()">⏸ Pause</button>
          <button class="btn btn-secondary btn-sm" onclick="resetCaseTimer(${c.timer?.preparation || 14400})">↺ Reset</button>
        </div>
        <div class="flex gap-2 mt-4" style="justify-content:center">
          <button class="btn btn-ghost btn-sm" onclick="switchTimerMode('${c.id}', 'prep')" id="timerModePrep" style="font-weight:600">Preparation</button>
          <button class="btn btn-ghost btn-sm" onclick="switchTimerMode('${c.id}', 'comp')" id="timerModeComp">Competition</button>
        </div>
      </div>

      <!-- Timeline -->
      <div class="card">
        <h3 class="mb-4">📋 Timeline</h3>
        <div class="timeline">
          ${(c.timeline || []).map((t, i) => `
            <div class="timeline-item ${t.completed ? 'completed' : i === (c.timeline || []).findIndex(x => !x.completed) ? 'current' : ''}">
              <div class="timeline-date">${formatDate(t.date)}</div>
              <div class="timeline-title">${escapeHtml(t.title)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Key Insights -->
    ${(c.research || []).filter(r => r.keyInsight).length > 0 ? `
    <div class="card mb-6">
      <h3 class="mb-4">⭐ Key Insights</h3>
      <div class="grid-2">
        ${(c.research || []).filter(r => r.keyInsight).map(r => `
          <div style="padding:14px;background:var(--accent-light);border-radius:var(--radius);border-left:3px solid var(--accent)">
            <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px">${escapeHtml(r.title)}</div>
            <div class="text-sm text-secondary">${escapeHtml(r.insight)}</div>
            <div class="text-xs text-secondary mt-2">Source: ${escapeHtml(r.source)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  `;

  return html;
}

function renderCaseProblem(c) {
  const tree = c.problemTree || { root: '', branches: [] };
  return `
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3>🧠 Problem Tree</h3>
        <button class="btn btn-primary btn-sm" onclick="App.navigate('problem-tree', '${c.id}')">Open Full View →</button>
      </div>
      <div class="form-group mb-4">
        <label>Main Problem</label>
        <input class="form-input" value="${escapeHtml(tree.root)}" placeholder="Define the main problem..." onchange="updateProblemRoot('${c.id}', this.value)">
      </div>
      <div class="grid-3 mt-4">
        ${(tree.branches || []).map(b => `
          <div style="background:var(--bg-secondary);border-radius:var(--radius);padding:16px">
            <h4 style="color:var(--accent);margin-bottom:10px">${escapeHtml(b.name)}</h4>
            ${(b.children || []).map(child => `
              <div style="padding:6px 10px;background:white;border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.85rem;border:1px solid var(--border)">
                ${escapeHtml(child.name)}
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderCaseResearch(c) {
  return `
    <div class="flex items-center justify-between mb-4">
      <h3>🔎 Research Hub</h3>
      <button class="btn btn-primary btn-sm" onclick="showNewResearchModal('${c.id}')">+ Add Research</button>
    </div>
    <div class="flex gap-3 mb-4">
      <select class="form-input" style="width:auto" onchange="filterCaseResearch('${c.id}', this.value)">
        <option value="all">All Categories</option>
        <option value="market">Market</option>
        <option value="customer">Customer</option>
        <option value="competitor">Competitor</option>
        <option value="industry">Industry</option>
        <option value="financial">Financial</option>
        <option value="trend">Trend</option>
      </select>
      <input class="form-input" placeholder="Search research..." style="max-width:300px" oninput="searchCaseResearch('${c.id}', this.value)">
    </div>
    ${(c.research || []).length > 0 ? `
      <div style="display:flex;flex-direction:column;gap:12px">
        ${(c.research || []).map(r => `
          <div class="card" style="padding:16px;border-left:3px solid ${r.keyInsight ? 'var(--accent)' : 'var(--border)'}">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                ${r.keyInsight ? '<span style="font-size:1rem">⭐</span>' : ''}
                <h4>${escapeHtml(r.title)}</h4>
                <span class="tag">${r.category}</span>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-ghost btn-sm" onclick="toggleKeyInsight('${c.id}', '${r.id}')">${r.keyInsight ? '⭐ Key Insight' : '☆ Mark as Key'}</button>
                <button class="btn btn-ghost btn-sm" onclick="deleteResearch('${c.id}', '${r.id}')">🗑️</button>
              </div>
            </div>
            <p class="text-sm mt-2">${escapeHtml(r.insight)}</p>
            <div class="flex items-center gap-4 mt-2 text-xs text-secondary">
              <span>Source: ${escapeHtml(r.source)}</span>
              <span>Added by ${getMember(r.addedBy).name}</span>
              <span>${formatDate(r.date)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<div class="empty-state"><div class="empty-icon">🔎</div><h4>No research yet</h4><p>Add your first research entry</p></div>'}
  `;
}

function renderCaseIdeas(c) {
  const ideas = (c.ideas || []).map(i => ({ ...i, score: calculateIdeaScore(i) })).sort((a, b) => b.score - a.score);
  const medals = ['🥇', '🥈', '🥉'];

  return `
    <div class="flex items-center justify-between mb-4">
      <h3>💡 Idea Board</h3>
      <button class="btn btn-primary btn-sm" onclick="showNewIdeaModal('${c.id}')">+ New Idea</button>
    </div>
    ${ideas.length > 0 ? `
      <div style="display:flex;flex-direction:column;gap:12px">
        ${ideas.map((idea, idx) => `
          <div class="card" style="padding:20px">
            <div class="flex items-center gap-4">
              <div class="idea-score">
                <span style="font-size:2rem">${medals[idx] || ''}</span>
                <div>
                  <div class="score-value">${idea.score}</div>
                  <div class="score-label">/100</div>
                </div>
              </div>
              <div style="flex:1">
                <h3>${escapeHtml(idea.name)}</h3>
                <p class="text-sm text-secondary mt-1">${escapeHtml(idea.description)}</p>
                <div class="flex gap-3 mt-2">
                  <span class="tag">Impact: ${idea.impact}/10</span>
                  <span class="tag">Feasibility: ${idea.feasibility}/10</span>
                  <span class="tag">Cost: ${idea.cost}/10</span>
                  <span class="tag">Difficulty: ${idea.difficulty}/10</span>
                </div>
              </div>
              <div class="flex flex-col items-center gap-2">
                <button class="btn ${idea.votes.includes(Store.get('settings')?.currentMember || 'm1') ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="voteIdea('${c.id}', '${idea.id}')">
                  👍 ${(idea.votes || []).length}
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '<div class="empty-state"><div class="empty-icon">💡</div><h4>No ideas yet</h4><p>Start brainstorming solutions</p></div>'}
  `;
}

function renderCaseStrategy(c) {
  const frameworks = c.frameworks || [];
  const allFrameworks = getFrameworkDefinitions();
  return `
    <div class="card">
      <h3 class="mb-4">📊 Strategy & Frameworks</h3>
      <p class="text-secondary text-sm mb-4">Frameworks applied to this case:</p>
      ${frameworks.length > 0 ? `
        <div class="grid-2">
          ${frameworks.map(fId => {
            const fw = allFrameworks.find(f => f.id === fId);
            if (!fw) return '';
            return `
              <div style="padding:16px;background:var(--bg-secondary);border-radius:var(--radius)">
                <h4>${fw.icon} ${fw.name}</h4>
                <p class="text-sm text-secondary mt-2">${fw.description.substring(0, 100)}...</p>
              </div>
            `;
          }).join('')}
        </div>
      ` : '<p class="text-secondary">No frameworks applied yet. Visit the <a href="#" onclick="App.navigate(\'frameworks\'); return false" style="color:var(--accent)">Frameworks Library</a> to add some.</p>'}
    </div>
  `;
}

function renderCaseFinance(c) {
  return `
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3>💰 Financial Model</h3>
        <button class="btn btn-primary btn-sm" onclick="App.navigate('finance', '${c.id}')">Open Calculator →</button>
      </div>
      <p class="text-secondary text-sm">Use the Financial Calculator to build your revenue model, cost structure, and ROI analysis.</p>
    </div>
  `;
}

function renderCaseSlides(c) {
  return `
    <div class="card">
      <h3 class="mb-4">📊 Presentation Slides</h3>
      <div class="empty-state" style="padding:40px">
        <div class="empty-icon">📊</div>
        <h4>Slides workspace</h4>
        <p>Upload and manage your presentation slides here</p>
        <button class="btn btn-primary btn-sm mt-4" onclick="App.navigate('files', '${c.id}')">Upload Files →</button>
      </div>
    </div>
  `;
}

function renderCasePitch(c) {
  return `
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3>🎤 Pitch Practice</h3>
        <button class="btn btn-primary btn-sm" onclick="App.navigate('pitch-practice', '${c.id}')">Start Practice →</button>
      </div>
      <div class="empty-state" style="padding:40px">
        <div class="empty-icon">🎤</div>
        <h4>Practice your pitch</h4>
        <p>Time your presentation and get AI feedback</p>
      </div>
    </div>
  `;
}

function renderCaseFiles(c) {
  return `
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3>📁 Files</h3>
        <button class="btn btn-primary btn-sm">+ Upload File</button>
      </div>
      <div class="grid-3 mb-4">
        ${['Case Brief', 'Research', 'Financial', 'Slides', 'Final Submission'].map(folder => `
          <div style="padding:16px;background:var(--bg-secondary);border-radius:var(--radius);text-align:center;cursor:pointer">
            <div style="font-size:2rem;margin-bottom:8px">📁</div>
            <div class="text-sm font-semibold">${folder}</div>
            <div class="text-xs text-secondary">0 files</div>
          </div>
        `).join('')}
      </div>
      <div class="empty-state" style="padding:24px">
        <p class="text-secondary text-sm">No files uploaded yet</p>
      </div>
    </div>
  `;
}

function renderCaseChecklist(c) {
  const checklist = c.checklist || [];
  const doneCount = checklist.filter(i => i.done).length;
  const total = checklist.length;
  const allDone = total > 0 && doneCount === total;

  let html = '<div class="card">';
  html += `<div class="flex items-center justify-between mb-4"><h3>🏆 Competition Ready?</h3><span class="text-sm text-secondary">${doneCount}/${total}</span></div>`;

  if (allDone) {
    html += `
      <div style="text-align:center;padding:32px;background:var(--green-light);border-radius:var(--radius-lg);margin-bottom:20px">
        <div style="font-size:3rem;margin-bottom:8px">🏆</div>
        <h2 style="color:var(--green)">WHyNotGenZ IS READY!</h2>
        <p class="text-secondary">All checklist items completed. Good luck!</p>
      </div>
    `;
  }

  html += `<div class="progress-bar mb-4"><div class="progress-fill ${allDone ? '' : ''}" style="width:${total > 0 ? (doneCount/total)*100 : 0}%;background:${allDone ? 'var(--green)' : 'var(--accent)'}"></div></div>`;

  checklist.forEach(item => {
    html += `
      <div class="checklist-item ${item.done ? 'completed' : ''}">
        <div class="checklist-checkbox ${item.done ? 'checked' : ''}" onclick="toggleChecklist('${c.id}', '${item.id}')">${item.done ? '✓' : ''}</div>
        <span class="checklist-text">${escapeHtml(item.text)}</span>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

// ===== Helper functions =====

function formatTimerDisplay(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startCaseTimer(caseId) {
  if (caseTimerRunning) return;
  caseTimerRunning = true;
  const display = document.getElementById('caseTimerDisplay');
  const label = document.getElementById('caseTimerLabel');
  if (!display) return;

  caseTimerInterval = setInterval(() => {
    if (caseTimerSeconds <= 0) {
      pauseCaseTimer();
      showToast('Time is up!', 'warning');
      return;
    }
    caseTimerSeconds--;
    display.textContent = formatTimerDisplay(caseTimerSeconds);
    if (caseTimerSeconds <= 300) { display.className = 'timer-display danger'; }
    else if (caseTimerSeconds <= 600) { display.className = 'timer-display warning'; }
    else { display.className = 'timer-display'; }
  }, 1000);
}

function pauseCaseTimer() {
  caseTimerRunning = false;
  if (caseTimerInterval) clearInterval(caseTimerInterval);
}

function resetCaseTimer(seconds) {
  pauseCaseTimer();
  caseTimerSeconds = seconds;
  const display = document.getElementById('caseTimerDisplay');
  if (display) {
    display.textContent = formatTimerDisplay(seconds);
    display.className = 'timer-display';
  }
}

function switchTimerMode(caseId, mode) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (!c) return;
  pauseCaseTimer();
  caseTimerSeconds = mode === 'prep' ? (c.timer?.preparation || 14400) : (c.timer?.competition || 3600);
  const display = document.getElementById('caseTimerDisplay');
  const label = document.getElementById('caseTimerLabel');
  if (display) {
    display.textContent = formatTimerDisplay(caseTimerSeconds);
    display.className = 'timer-display';
  }
  if (label) label.textContent = mode === 'prep' ? 'Preparation Time' : 'Competition Time';

  document.getElementById('timerModePrep')?.classList.toggle('btn-primary', mode === 'prep');
  document.getElementById('timerModePrep')?.classList.toggle('btn-ghost', mode !== 'prep');
  document.getElementById('timerModeComp')?.classList.toggle('btn-primary', mode === 'comp');
  document.getElementById('timerModeComp')?.classList.toggle('btn-ghost', mode !== 'comp');
}

function updateProblemRoot(caseId, value) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    c.problemTree.root = value;
    Store.set('cases', cases);
    flashSave();
  }
}

function toggleKeyInsight(caseId, researchId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    const r = c.research.find(x => x.id === researchId);
    if (r) {
      r.keyInsight = !r.keyInsight;
      Store.set('cases', cases);
      App.navigate('case-workspace', caseId);
      flashSave();
    }
  }
}

function deleteResearch(caseId, researchId) {
  if (!confirm('Delete this research entry?')) return;
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    c.research = c.research.filter(x => x.id !== researchId);
    Store.set('cases', cases);
    App.navigate('case-workspace', caseId);
    showToast('Research deleted');
  }
}

function voteIdea(caseId, ideaId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    const idea = c.ideas.find(x => x.id === ideaId);
    if (idea) {
      const currentMember = Store.get('settings')?.currentMember || 'm1';
      const idx = idea.votes.indexOf(currentMember);
      if (idx >= 0) idea.votes.splice(idx, 1);
      else idea.votes.push(currentMember);
      Store.set('cases', cases);
      App.navigate('case-workspace', caseId);
    }
  }
}

function toggleChecklist(caseId, itemId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    const item = c.checklist.find(x => x.id === itemId);
    if (item) {
      item.done = !item.done;
      // Update progress
      const done = c.checklist.filter(i => i.done).length;
      c.progress = Math.round((done / c.checklist.length) * 100);
      Store.set('cases', cases);
      App.navigate('case-workspace', caseId);
      flashSave();
    }
  }
}

function showNewResearchModal(caseId) {
  const body = `
    <div class="form-group"><label>Title</label><input class="form-input" id="researchTitle" placeholder="e.g., Gen Z Spending Behavior"></div>
    <div class="form-group"><label>Insight</label><textarea class="form-input" id="researchInsight" placeholder="Describe the key insight..."></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Source</label><input class="form-input" id="researchSource" placeholder="e.g., McKinsey Report"></div>
      <div class="form-group"><label>Category</label><select class="form-input" id="researchCategory"><option value="market">Market</option><option value="customer">Customer</option><option value="competitor">Competitor</option><option value="industry">Industry</option><option value="financial">Financial</option><option value="trend">Trend</option></select></div>
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="addResearch('${caseId}')">Add Research</button>
  `;
  openModal('Add Research', body, footer);
}

function addResearch(caseId) {
  const title = document.getElementById('researchTitle').value.trim();
  const insight = document.getElementById('researchInsight').value.trim();
  const source = document.getElementById('researchSource').value.trim();
  const category = document.getElementById('researchCategory').value;

  if (!title || !insight) { showToast('Please fill in title and insight', 'error'); return; }

  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    c.research.push({
      id: generateId(),
      title, insight, source, category,
      url: '', addedBy: Store.get('settings')?.currentMember || 'm1',
      date: new Date().toISOString().split('T')[0],
      keyInsight: false, caseId
    });
    Store.set('cases', cases);
    closeModal();
    showToast('Research added!');
    App.navigate('case-workspace', caseId);
  }
}

function showNewIdeaModal(caseId) {
  const body = `
    <div class="form-group"><label>Idea Name</label><input class="form-input" id="ideaName" placeholder="e.g., TikTok-First Launch"></div>
    <div class="form-group"><label>Description</label><textarea class="form-input" id="ideaDesc" placeholder="Describe your idea..."></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Impact (1-10)</label><input class="form-input" id="ideaImpact" type="number" min="1" max="10" value="5"></div>
      <div class="form-group"><label>Feasibility (1-10)</label><input class="form-input" id="ideaFeasibility" type="number" min="1" max="10" value="5"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Cost (1=low, 10=high)</label><input class="form-input" id="ideaCost" type="number" min="1" max="10" value="5"></div>
      <div class="form-group"><label>Difficulty (1=easy, 10=hard)</label><input class="form-input" id="ideaDifficulty" type="number" min="1" max="10" value="5"></div>
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="addIdea('${caseId}')">Add Idea</button>
  `;
  openModal('New Idea', body, footer);
}

function addIdea(caseId) {
  const name = document.getElementById('ideaName').value.trim();
  const description = document.getElementById('ideaDesc').value.trim();
  if (!name || !description) { showToast('Please fill in all fields', 'error'); return; }

  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    c.ideas.push({
      id: generateId(),
      name, description,
      impact: parseInt(document.getElementById('ideaImpact').value) || 5,
      feasibility: parseInt(document.getElementById('ideaFeasibility').value) || 5,
      cost: parseInt(document.getElementById('ideaCost').value) || 5,
      difficulty: parseInt(document.getElementById('ideaDifficulty').value) || 5,
      votes: [],
      caseId,
      comments: []
    });
    Store.set('cases', cases);
    closeModal();
    showToast('Idea added!');
    App.navigate('case-workspace', caseId);
  }
}

function filterCaseResearch(caseId, category) {
  // Re-render with filter
  App.navigate('case-workspace', caseId);
}

function searchCaseResearch(caseId, query) {
  // Simple search re-render
  App.navigate('case-workspace', caseId);
}
