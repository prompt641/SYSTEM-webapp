// ===== Dashboard Page =====

function renderDashboard() {
  const cases = Store.get('cases') || [];
  const meetings = Store.get('meetings') || [];
  const notes = Store.get('notes') || [];
  const activities = Store.get('activities') || [];
  const members = Store.get('members') || [];
  const today = new Date().toISOString().split('T')[0];

  const activeCase = cases.find(c => c.status === 'in-progress') || cases[0];
  const todayMeeting = meetings.find(m => m.date === today);
  const upcomingMeetings = meetings
    .filter(m => m.date >= today)
    .sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime))
    .slice(0, 4);

  const urgentTasks = activeCase ? activeCase.tasks.filter(t => t.status !== 'done' && t.priority === 'high') : [];
  const allActiveTasks = activeCase ? activeCase.tasks.filter(t => t.status !== 'done') : [];

  // === Empty state: no cases at all ===
  if (cases.length === 0 && members.length === 0) {
    return `
      <div style="max-width:560px;margin:60px auto;text-align:center">
        <div style="font-size:4rem;margin-bottom:16px">🏆</div>
        <h1 style="margin-bottom:8px">Welcome to WHyNotGenZ</h1>
        <p class="text-secondary mb-6">Your Case Competition Command Center.<br>Set up your team and create your first case to get started.</p>
        <div class="grid-2" style="gap:16px;max-width:360px;margin:0 auto">
          <button class="btn btn-primary btn-lg" onclick="App.navigate('team')" style="justify-content:center">👥 Add Team</button>
          <button class="btn btn-secondary btn-lg" onclick="App.navigate('cases')" style="justify-content:center">📁 New Case</button>
        </div>
      </div>
    `;
  }

  let html = '';

  // === Current Case Banner ===
  if (activeCase) {
    html += `
      <div class="dashboard-current-case" onclick="App.navigate('case-workspace', '${activeCase.id}')" style="cursor:pointer">
        <div class="flex items-center justify-between" style="margin-bottom:8px">
          <h3>📊 ${escapeHtml(activeCase.name)}</h3>
          <span style="font-size:0.8rem;opacity:0.8;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px">Open Case →</span>
        </div>
        <div class="case-meta">
          <div class="meta-item">
            <span class="meta-label">Competition</span>
            <span>${escapeHtml(activeCase.competition)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span>🟡 In Progress</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Deadline</span>
            <span style="font-weight:700">${getTimeRemaining(activeCase.deadline)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Progress</span>
            <span style="font-weight:700">${activeCase.progress}%</span>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${activeCase.progress}%"></div>
        </div>
      </div>
    `;
  } else if (cases.length > 0) {
    // Has cases but none active
    html += `
      <div class="card mb-6" style="text-align:center;padding:32px">
        <div class="empty-icon" style="font-size:2.5rem;margin-bottom:12px">📁</div>
        <h3>No Active Case</h3>
        <p class="text-secondary text-sm mb-4">You have ${cases.length} completed case${cases.length > 1 ? 's' : ''}. Start a new one to continue.</p>
        <button class="btn btn-primary" onclick="showNewCaseModal()">+ New Case</button>
      </div>
    `;
  } else {
    // No cases at all
    html += `
      <div class="card mb-6" style="text-align:center;padding:40px">
        <div class="empty-icon" style="font-size:3rem;margin-bottom:12px">📁</div>
        <h3>No cases yet</h3>
        <p class="text-secondary text-sm mb-4">Create your first case to start building your competition workspace.</p>
        <button class="btn btn-primary btn-lg" onclick="showNewCaseModal()">+ Create Case</button>
      </div>
    `;
  }

  // === Stats Row ===
  if (cases.length > 0 || members.length > 0) {
    const totalTasks = activeCase ? activeCase.tasks.length : 0;
    const completedTasks = activeCase ? activeCase.tasks.filter(t => t.status === 'done').length : 0;
    html += `
      <div class="grid-4 mb-6">
        <div class="stat-card">
          <div class="stat-label">Total Tasks</div>
          <div class="stat-value">${totalTasks}</div>
          <div class="stat-change up">${completedTasks} completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Urgent Tasks</div>
          <div class="stat-value" style="color:${urgentTasks.length > 0 ? 'var(--red)' : 'var(--green)'}">${urgentTasks.length}</div>
          <div class="stat-change ${urgentTasks.length > 0 ? 'down' : 'up'}">${urgentTasks.length > 0 ? 'Needs attention' : 'All clear'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Team Members</div>
          <div class="stat-value">${members.length}</div>
          <div class="stat-change">${members.length > 0 ? 'Active' : 'Add members'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Research Items</div>
          <div class="stat-value">${activeCase ? activeCase.research.length : 0}</div>
          <div class="stat-change">${activeCase ? activeCase.research.filter(r => r.keyInsight).length : 0} key insights</div>
        </div>
      </div>
    `;
  }

  // === Two Column Layout ===
  html += '<div style="display:grid;grid-template-columns:1fr 360px;gap:24px">';

  // Left Column
  html += '<div>';

  // === Today's Meeting ===
  html += '<div class="dashboard-section">';
  html += '<div class="dashboard-section-header"><h3>📅 Today</h3></div>';
  if (todayMeeting) {
    const attending = todayMeeting.participants.length;
    const totalMembers = members.length || 5;
    html += `
      <div class="card" style="border-left:4px solid var(--accent)">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div style="font-size:0.8rem;color:var(--accent);font-weight:600;margin-bottom:4px">🔴 MEETING TODAY</div>
            <h3>${escapeHtml(todayMeeting.title)}</h3>
            <div class="text-sm text-secondary mt-2">${formatTime(todayMeeting.startTime)} – ${formatTime(todayMeeting.endTime)}</div>
            <div class="text-sm text-secondary">${attending} / ${totalMembers} members attending</div>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-primary btn-sm" onclick="App.navigate('meetings')">Open Meeting</button>
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('meetings')">View Details</button>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="card">
        <div class="empty-state" style="padding:24px">
          <div class="empty-icon">📅</div>
          <h4>No meetings today</h4>
          <button class="btn btn-primary btn-sm mt-4" onclick="App.navigate('meetings')">+ Schedule Meeting</button>
        </div>
      </div>
    `;
  }
  html += '</div>';

  // === Task Board ===
  html += '<div class="dashboard-section">';
  html += '<div class="dashboard-section-header"><h3>📋 Team Tasks</h3>';
  if (activeCase && allActiveTasks.length > 0) {
    html += '<button class="btn btn-secondary btn-sm" onclick="App.navigate(\'tasks\')">View All →</button>';
  }
  html += '</div>';

  if (activeCase && allActiveTasks.length > 0) {
    html += '<div class="kanban-board">';
    html += renderKanbanColumn('To Do', 'badge-todo', allActiveTasks.filter(t => t.status === 'todo'));
    html += renderKanbanColumn('In Progress', 'badge-progress', allActiveTasks.filter(t => t.status === 'in-progress'));
    html += renderKanbanColumn('Review', 'badge-review', allActiveTasks.filter(t => t.status === 'review'));
    html += '</div>';
  } else {
    html += `
      <div class="card">
        <div class="empty-state" style="padding:24px">
          <div class="empty-icon">📋</div>
          <h4>No tasks yet</h4>
          <p class="text-sm text-secondary">${activeCase ? 'Add tasks to your case to get started.' : 'Create a case first, then add tasks.'}</p>
          ${activeCase ? `<button class="btn btn-primary btn-sm mt-4" onclick="showNewTaskModal('${activeCase.id}')">+ New Task</button>` : ''}
        </div>
      </div>
    `;
  }
  html += '</div>';

  // === Activity Feed ===
  html += '<div class="dashboard-section">';
  html += '<div class="dashboard-section-header"><h3>🔄 Activity Feed</h3></div>';
  html += '<div class="card">';
  if (activities.length > 0) {
    html += activities.slice(0, 5).map(a => `
      <div class="activity-item">
        <div class="activity-avatar" style="background:${a.color}">${a.icon}</div>
        <div>
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${a.time}</div>
        </div>
      </div>
    `).join('');
  } else {
    html += '<div class="empty-state" style="padding:16px"><p>No recent activity</p></div>';
  }
  html += '</div></div>';

  html += '</div>'; // end left column

  // Right Column
  html += '<div>';

  // === Upcoming Meetings ===
  html += '<div class="dashboard-section">';
  html += '<div class="dashboard-section-header"><h3>📅 Upcoming</h3>';
  if (upcomingMeetings.length > 0) {
    html += '<button class="btn btn-ghost btn-sm" onclick="App.navigate(\'meetings\')">View All →</button>';
  }
  html += '</div>';
  if (upcomingMeetings.length > 0) {
    html += '<div style="display:flex;flex-direction:column;gap:10px">';
    upcomingMeetings.forEach(m => {
      html += `
        <div class="meeting-card" onclick="App.navigate('meetings')">
          <div class="meeting-time">
            <span class="day">${getRelativeDate(m.date).substring(0, 3)}</span>
            <span class="time">${m.startTime}</span>
          </div>
          <div class="meeting-info">
            <div class="meeting-title">${escapeHtml(m.title)}</div>
            <div class="meeting-subtitle">${getRelativeDate(m.date)} • ${formatTime(m.startTime)}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += `
      <div class="card">
        <div class="empty-state" style="padding:20px">
          <div class="empty-icon">📅</div>
          <h4>No upcoming meetings</h4>
          <button class="btn btn-primary btn-sm mt-4" onclick="App.navigate('meetings')">+ Schedule Meeting</button>
        </div>
      </div>
    `;
  }
  html += '</div>';

  // === Next Up ===
  html += '<div class="dashboard-section">';
  html += '<div class="dashboard-section-header"><h3>🎯 Next Up</h3></div>';
  html += '<div class="card">';
  if (urgentTasks.length > 0) {
    html += urgentTasks.slice(0, 3).map(t => {
      const member = getMember(t.assignee);
      return `
        <div class="flex items-center gap-3" style="padding:8px 0;border-bottom:1px solid var(--border-light)">
          <span class="priority-dot high"></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:0.85rem;font-weight:600" class="truncate">${escapeHtml(t.title)}</div>
            <div class="text-xs text-secondary">${member.name} • Due ${getRelativeDate(t.deadline)}</div>
          </div>
          ${getStatusBadge(t.status)}
        </div>
      `;
    }).join('');
  } else if (allActiveTasks.length > 0) {
    html += allActiveTasks.slice(0, 3).map(t => {
      const member = getMember(t.assignee);
      return `
        <div class="flex items-center gap-3" style="padding:8px 0;border-bottom:1px solid var(--border-light)">
          ${getPriorityDot(t.priority)}
          <div style="flex:1;min-width:0">
            <div style="font-size:0.85rem;font-weight:600" class="truncate">${escapeHtml(t.title)}</div>
            <div class="text-xs text-secondary">${member.name} • Due ${getRelativeDate(t.deadline)}</div>
          </div>
          ${getStatusBadge(t.status)}
        </div>
      `;
    }).join('');
  } else {
    html += '<p class="text-secondary text-sm" style="padding:12px 0">No pending tasks</p>';
  }
  html += '</div></div>';

  // === Quick Actions ===
  html += '<div class="dashboard-section">';
  html += '<div class="dashboard-section-header"><h3>⚡ Quick Actions</h3></div>';
  html += `
    <div class="grid-2">
      <button class="btn btn-secondary w-full" onclick="App.navigate('cases')" style="justify-content:center;padding:14px">📁 Cases</button>
      <button class="btn btn-secondary w-full" onclick="App.navigate('meetings')" style="justify-content:center;padding:14px">📅 Meetings</button>
      <button class="btn btn-secondary w-full" onclick="App.navigate('ai-coach')" style="justify-content:center;padding:14px">🤖 AI Coach</button>
      <button class="btn btn-secondary w-full" onclick="App.navigate('pitch-practice')" style="justify-content:center;padding:14px">🎤 Pitch Practice</button>
    </div>
  `;
  html += '</div>';

  html += '</div>'; // end right column
  html += '</div>'; // end grid

  return html;
}

function renderKanbanColumn(title, badgeClass, tasks) {
  let html = `<div class="kanban-column" style="background:var(--bg-card)">`;
  html += `<div class="kanban-column-header"><h4>${title} <span class="count">${tasks.length}</span></h4></div>`;
  tasks.forEach(t => {
    const member = getMember(t.assignee);
    html += `
      <div class="kanban-card" onclick="App.navigate('tasks')">
        <div class="kanban-card-title">${escapeHtml(t.title)}</div>
        <div class="kanban-card-meta">
          <div class="kanban-card-assignee">
            <div class="avatar avatar-sm" style="background:${member.color}">${member.initials}</div>
            <span>${member.name}</span>
          </div>
          <span class="text-xs">${getRelativeDate(t.deadline)}</span>
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}
