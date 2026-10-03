// ===== Team Page =====

function renderTeam() {
  const members = Store.get('members') || [];
  const cases = Store.get('cases') || [];
  const meetings = Store.get('meetings') || [];
  const notes = Store.get('notes') || [];

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1>Team</h1>
        <p class="text-secondary text-sm">WhynotGenZ — ${members.length} members</p>
      </div>
      <button class="btn btn-primary" onclick="showNewMemberModal()">+ Add Member</button>
    </div>
  `;

  if (members.length === 0) {
    html += `
      <div class="empty-state" style="padding:60px 20px">
        <div class="empty-icon">👥</div>
        <h4>No team members yet</h4>
        <p>Add your 5 team members to get started</p>
        <button class="btn btn-primary btn-lg mt-4" onclick="showNewMemberModal()">+ Add Member</button>
      </div>
    `;
    return html;
  }

  html += '<div class="grid-3">'

  members.forEach(m => {
    // Count tasks across all cases
    let activeTasks = 0, completedTasks = 0, meetingsAttended = 0, notesCreated = 0, researchAdded = 0;
    cases.forEach(c => {
      (c.tasks || []).forEach(t => {
        if (t.assignee === m.id) {
          if (t.status === 'done') completedTasks++;
          else activeTasks++;
        }
      });
      (c.research || []).forEach(r => {
        if (r.addedBy === m.id) researchAdded++;
      });
    });
    meetings.forEach(mt => {
      if (mt.participants.includes(m.id)) meetingsAttended++;
    });
    notes.forEach(n => {
      if (n.createdBy === m.id) notesCreated++;
    });

    html += `
      <div class="card" style="text-align:center;cursor:pointer" onclick="showMemberDetail('${m.id}')">
        <div class="avatar avatar-xl" style="background:${m.color};margin:0 auto 16px">${m.initials}</div>
        <h3>${escapeHtml(m.name)}</h3>
        <div class="text-sm text-secondary mb-4">${escapeHtml(m.role)}</div>
        <div class="grid-2" style="gap:8px">
          <div style="padding:10px;background:var(--bg-secondary);border-radius:var(--radius)">
            <div style="font-size:1.25rem;font-weight:700">${activeTasks}</div>
            <div class="text-xs text-secondary">Active Tasks</div>
          </div>
          <div style="padding:10px;background:var(--bg-secondary);border-radius:var(--radius)">
            <div style="font-size:1.25rem;font-weight:700">${completedTasks}</div>
            <div class="text-xs text-secondary">Completed</div>
          </div>
          <div style="padding:10px;background:var(--bg-secondary);border-radius:var(--radius)">
            <div style="font-size:1.25rem;font-weight:700">${meetingsAttended}</div>
            <div class="text-xs text-secondary">Meetings</div>
          </div>
          <div style="padding:10px;background:var(--bg-secondary);border-radius:var(--radius)">
            <div style="font-size:1.25rem;font-weight:700">${notesCreated + researchAdded}</div>
            <div class="text-xs text-secondary">Contributions</div>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

function showNewMemberModal() {
  const body = `
    <div class="form-group"><label>Name</label><input class="form-input" id="newMemberName" placeholder="e.g., Alex"></div>
    <div class="form-group"><label>Role</label><input class="form-input" id="newMemberRole" placeholder="e.g., Strategy Lead"></div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="createMember()">Add Member</button>
  `;
  openModal('Add Team Member', body, footer);
}

function createMember() {
  const name = document.getElementById('newMemberName').value.trim();
  const role = document.getElementById('newMemberRole').value.trim();
  if (!name || !role) { showToast('Please fill in all fields', 'error'); return; }

  const members = Store.get('members') || [];
  const colors = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4'];
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

  members.push({
    id: 'm' + (members.length + 1),
    name,
    role,
    initials,
    color: colors[members.length % colors.length],
  });

  Store.set('members', members);
  closeModal();
  showToast(name + ' added to the team!');
  App.navigate('team');
}

function deleteMember(memberId) {
  if (!confirm('Remove this team member?')) return;
  let members = Store.get('members') || [];
  members = members.filter(m => m.id !== memberId);
  Store.set('members', members);
  closeModal();
  showToast('Member removed');
  App.navigate('team');
}

function showMemberDetail(memberId) {
  const members = Store.get('members') || [];
  const member = members.find(m => m.id === memberId);
  if (!member) return;

  const cases = Store.get('cases') || [];
  const meetings = Store.get('meetings') || [];
  const notes = Store.get('notes') || [];

  let activeTasks = [], completedTasks = [], researchItems = [];
  cases.forEach(c => {
    (c.tasks || []).forEach(t => {
      if (t.assignee === memberId) {
        const task = { ...t, caseName: c.name };
        if (t.status === 'done') completedTasks.push(task);
        else activeTasks.push(task);
      }
    });
    (c.research || []).forEach(r => {
      if (r.addedBy === memberId) researchItems.push({ ...r, caseName: c.name });
    });
  });

  const memberMeetings = meetings.filter(m => m.participants.includes(memberId));
  const memberNotes = notes.filter(n => n.createdBy === memberId);

  const body = `
    <div style="text-align:center;margin-bottom:20px">
      <div class="avatar avatar-xl" style="background:${member.color};margin:0 auto 12px">${member.initials}</div>
      <h3>${escapeHtml(member.name)}</h3>
      <p class="text-secondary text-sm">${escapeHtml(member.role)}</p>
    </div>

    <h4 style="margin-bottom:8px">Active Tasks (${activeTasks.length})</h4>
    ${activeTasks.length > 0 ? activeTasks.map(t => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem">
        <span>${escapeHtml(t.title)}</span>
        <span class="text-xs text-secondary"> — ${t.caseName}</span>
      </div>
    `).join('') : '<p class="text-sm text-secondary mb-4">No active tasks</p>'}

    <h4 style="margin:16px 0 8px">Completed Tasks (${completedTasks.length})</h4>
    ${completedTasks.length > 0 ? completedTasks.slice(0, 5).map(t => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem;text-decoration:line-through;color:var(--text-secondary)">
        ${escapeHtml(t.title)}
      </div>
    `).join('') : '<p class="text-sm text-secondary">No completed tasks</p>'}

    <h4 style="margin:16px 0 8px">Meetings Attended (${memberMeetings.length})</h4>
    <p class="text-sm text-secondary">Attended ${memberMeetings.length} meetings total</p>

    <h4 style="margin:16px 0 8px">Research Added (${researchItems.length})</h4>
    ${researchItems.length > 0 ? researchItems.map(r => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem">
        ${escapeHtml(r.title)} ${r.keyInsight ? '⭐' : ''}
      </div>
    `).join('') : '<p class="text-sm text-secondary">No research added</p>'}

    <h4 style="margin:16px 0 8px">Notes Created (${memberNotes.length})</h4>
    ${memberNotes.length > 0 ? memberNotes.map(n => `
      <div style="padding:8px 0;border-bottom:1px solid var(--border-light);font-size:0.85rem">
        📝 ${escapeHtml(n.title)}
      </div>
    `).join('') : '<p class="text-sm text-secondary">No notes created</p>'}
  `;

  openModal(member.name + ' — Activity', body, '<button class="btn btn-secondary" onclick="closeModal()">Close</button>');
}
