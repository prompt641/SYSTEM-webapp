// ===== Cases Page =====

function renderCases() {
  const cases = Store.get('cases') || [];

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1>Cases</h1>
        <p class="text-secondary text-sm">Manage your case competition workspaces</p>
      </div>
      <button class="btn btn-primary" onclick="showNewCaseModal()">+ New Case</button>
    </div>
    <div class="grid-3">
  `;

  if (cases.length === 0) {
    html += `
      <div class="empty-state" style="grid-column:1/-1;padding:60px 20px">
        <div class="empty-icon">📁</div>
        <h4>No cases yet</h4>
        <p>Create your first case to get started</p>
        <button class="btn btn-primary btn-lg mt-4" onclick="showNewCaseModal()">+ Create Case</button>
      </div>
    `;
    return html;
  }

  cases.forEach(c => {
    const deadlineClass = getDeadlineClass(c.deadline);
    html += `
      <div class="card" style="cursor:pointer" onclick="App.navigate('case-workspace', '${c.id}')">
        <div class="flex items-center justify-between mb-4">
          <span class="badge ${c.status === 'in-progress' ? 'badge-progress' : 'badge-done'}">
            ${c.status === 'in-progress' ? '🟡 In Progress' : '🟢 Completed'}
          </span>
          <span class="text-xs text-secondary">${c.competition}</span>
        </div>
        <h3 style="margin-bottom:8px">${escapeHtml(c.name)}</h3>
        <div class="text-sm text-secondary mb-4">
          ${c.status === 'in-progress' ? `⏰ ${getTimeRemaining(c.deadline)} remaining` : `✓ Completed ${formatDate(c.createdAt)}`}
        </div>
        <div class="progress-bar ${c.progress >= 80 ? 'green' : c.progress >= 50 ? '' : 'yellow'}" style="margin-bottom:12px">
          <div class="progress-fill" style="width:${c.progress}%"></div>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold">${c.progress}% Complete</span>
          <div class="avatar-group">
            ${(c.tasks || []).slice(0, 3).map(t => {
              const m = getMember(t.assignee);
              return `<div class="avatar avatar-sm" style="background:${m.color}" title="${m.name}">${m.initials}</div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

function showNewCaseModal() {
  const body = `
    <div class="form-group">
      <label>Case Name</label>
      <input class="form-input" id="newCaseName" placeholder="e.g., ABC Business Challenge">
    </div>
    <div class="form-group">
      <label>Competition Name</label>
      <input class="form-input" id="newCaseCompetition" placeholder="e.g., Global Case Comp 2026">
    </div>
    <div class="form-group">
      <label>Deadline</label>
      <input class="form-input" id="newCaseDeadline" type="datetime-local">
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="createNewCase()">Create Case</button>
  `;
  openModal('New Case', body, footer);
}

function createNewCase() {
  const name = document.getElementById('newCaseName').value.trim();
  const competition = document.getElementById('newCaseCompetition').value.trim();
  const deadline = document.getElementById('newCaseDeadline').value;

  if (!name || !competition) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  const cases = Store.get('cases') || [];
  cases.unshift({
    id: generateId(),
    name,
    competition,
    deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'in-progress',
    progress: 0,
    createdAt: new Date().toISOString().split('T')[0],
    timer: { preparation: 14400, competition: 3600 },
    tasks: [],
    research: [],
    ideas: [],
    frameworks: [],
    files: [],
    timeline: [
      { id: generateId(), title: 'Case Received', date: new Date().toISOString().split('T')[0], completed: true },
    ],
    checklist: [
      { id: generateId(), text: 'Problem clearly defined', done: false },
      { id: generateId(), text: 'Key Insights confirmed', done: false },
      { id: generateId(), text: 'Strategy selected', done: false },
      { id: generateId(), text: 'Financial model completed', done: false },
      { id: generateId(), text: 'ROI calculated', done: false },
      { id: generateId(), text: 'Slides completed', done: false },
      { id: generateId(), text: 'Sources checked', done: false },
      { id: generateId(), text: 'Pitch practiced', done: false },
      { id: generateId(), text: 'Q&A practiced', done: false },
      { id: generateId(), text: 'Final files uploaded', done: false },
    ],
    problemTree: { root: '', branches: [] }
  });

  Store.set('cases', cases);
  closeModal();
  showToast('Case created successfully!');
  App.navigate('cases');
}
