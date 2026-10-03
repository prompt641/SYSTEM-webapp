// ===== Meetings Page =====

function renderMeetings() {
  const meetings = Store.get('meetings') || [];
  const cases = Store.get('cases') || [];
  const today = new Date().toISOString().split('T')[0];

  const todayMeetings = meetings.filter(m => m.date === today);
  const upcomingMeetings = meetings.filter(m => m.date > today).sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime));
  const pastMeetings = meetings.filter(m => m.date < today).sort((a, b) => new Date(b.date + 'T' + b.startTime) - new Date(a.date + 'T' + a.startTime));

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1>Meetings</h1>
        <p class="text-secondary text-sm">Schedule and manage team meetings</p>
      </div>
      <button class="btn btn-primary" onclick="showNewMeetingModal()">+ Schedule Meeting</button>
    </div>
  `;

  // Main empty state
  if (meetings.length === 0) {
    html += `
      <div class="empty-state" style="padding:60px 20px">
        <div class="empty-icon">📅</div>
        <h4>No meetings scheduled</h4>
        <p>Schedule your first team meeting</p>
        <button class="btn btn-primary btn-lg mt-4" onclick="showNewMeetingModal()">+ Schedule Meeting</button>
      </div>
    `;
    return html;
  }

  // Today
  html += '<h3 class="mb-4">📅 Today</h3>';
  if (todayMeetings.length > 0) {
    html += '<div class="mb-6" style="display:flex;flex-direction:column;gap:12px">';
    todayMeetings.forEach(m => {
      html += renderMeetingCard(m, cases);
    });
    html += '</div>';
  } else {
    html += '<div class="card mb-6"><div class="empty-state" style="padding:20px"><p>No meetings today</p></div></div>';
  }

  // Upcoming
  html += '<h3 class="mb-4">📆 Upcoming</h3>';
  if (upcomingMeetings.length > 0) {
    html += '<div class="mb-6" style="display:flex;flex-direction:column;gap:12px">';
    upcomingMeetings.forEach(m => {
      html += renderMeetingCard(m, cases);
    });
    html += '</div>';
  } else {
    html += '<div class="card mb-6"><div class="empty-state" style="padding:20px"><p>No upcoming meetings</p></div></div>';
  }

  // Past
  html += '<h3 class="mb-4">📋 Past Meetings</h3>';
  if (pastMeetings.length > 0) {
    html += '<div style="display:flex;flex-direction:column;gap:12px">';
    pastMeetings.forEach(m => {
      html += renderMeetingCard(m, cases, true);
    });
    html += '</div>';
  } else {
    html += '<div class="card"><div class="empty-state" style="padding:20px"><p>No past meetings</p></div></div>';
  }

  return html;
}

function renderMeetingCard(m, cases, isPast = false) {
  const c = cases.find(x => x.id === m.caseId);
  const members = Store.get('members') || [];
  const participants = m.participants.map(id => members.find(mem => mem.id === id)).filter(Boolean);

  return `
    <div class="meeting-card" onclick="openMeeting('${m.id}')">
      <div class="meeting-time">
        <span class="day">${getRelativeDate(m.date).substring(0, 3)}</span>
        <span class="time">${m.startTime}</span>
      </div>
      <div class="meeting-info" style="flex:1">
        <div class="meeting-title">${escapeHtml(m.title)}</div>
        <div class="meeting-subtitle">${formatDate(m.date)} • ${formatTime(m.startTime)} – ${formatTime(m.endTime)}${c ? ` • ${escapeHtml(c.name)}` : ''}</div>
        <div class="flex items-center gap-2 mt-2">
          <div class="avatar-group">
            ${participants.slice(0, 4).map(p => `<div class="avatar avatar-sm" style="background:${p.color}">${p.initials}</div>`).join('')}
          </div>
          <span class="text-xs text-secondary">${participants.length} / ${members.length} attending</span>
        </div>
      </div>
      <div class="flex flex-col items-center gap-2">
        ${isPast && m.notes ? '<span class="badge badge-done">✓ Notes</span>' : ''}
        ${m.recording ? '<span class="badge badge-review">🎥 Recording</span>' : ''}
        <button class="btn btn-secondary btn-sm">Open →</button>
      </div>
    </div>
  `;
}

function openMeeting(meetingId) {
  const meetings = Store.get('meetings') || [];
  const m = meetings.find(x => x.id === meetingId);
  if (!m) return;
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === m.caseId);
  const members = Store.get('members') || [];
  const participants = m.participants.map(id => members.find(mem => mem.id === id)).filter(Boolean);

  const body = `
    <div style="margin-bottom:16px">
      <h3>${escapeHtml(m.title)}</h3>
      <p class="text-sm text-secondary">${formatDate(m.date)} • ${formatTime(m.startTime)} – ${formatTime(m.endTime)}</p>
      ${c ? `<p class="text-sm text-secondary">Case: ${escapeHtml(c.name)}</p>` : ''}
      <div class="flex items-center gap-2 mt-2">
        <span class="text-sm text-secondary">Participants:</span>
        <div class="avatar-group">
          ${participants.map(p => `<div class="avatar avatar-sm" style="background:${p.color}" title="${p.name}">${p.initials}</div>`).join('')}
        </div>
      </div>
    </div>

    <h4 class="mb-2">Agenda</h4>
    <ol style="padding-left:20px;margin-bottom:20px">
      ${(m.agenda || []).map(a => `<li style="padding:4px 0;font-size:0.9rem;list-style:decimal">${escapeHtml(a)}</li>`).join('')}
    </ol>

    <h4 class="mb-2">📝 Notes</h4>
    <textarea class="form-input" id="meetingNotes_${m.id}" placeholder="Write meeting notes here..." style="min-height:150px">${escapeHtml(m.notes || '')}</textarea>

    <h4 class="mb-2 mt-4">✅ Decisions</h4>
    <div id="meetingDecisions_${m.id}">
      ${(m.decisions || []).map(d => `<div style="padding:8px;background:var(--green-light);border-radius:var(--radius-sm);margin-bottom:6px;font-size:0.9rem">✓ ${escapeHtml(d)}</div>`).join('')}
    </div>
    <div class="flex gap-2 mt-2">
      <input class="form-input" id="newDecision_${m.id}" placeholder="Add a decision..." style="flex:1">
      <button class="btn btn-secondary btn-sm" onclick="addDecision('${m.id}')">+ Add</button>
    </div>

    <h4 class="mb-2 mt-4">📌 Action Items</h4>
    <div id="meetingActions_${m.id}">
      ${(m.actionItems || []).map(ai => `
        <div class="flex items-center gap-3" style="padding:8px 0;border-bottom:1px solid var(--border-light)">
          <div class="checklist-checkbox ${ai.done ? 'checked' : ''}" onclick="toggleActionItem('${m.id}','${ai.id}')">${ai.done ? '✓' : ''}</div>
          <div style="flex:1">
            <div class="text-sm ${ai.done ? 'completed' : ''}">${escapeHtml(ai.task)}</div>
            <div class="text-xs text-secondary">${getMember(ai.assignee).name} • Due ${getRelativeDate(ai.deadline)}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="flex gap-2 mt-2">
      <input class="form-input" id="newActionTask_${m.id}" placeholder="Action item..." style="flex:1">
      <button class="btn btn-secondary btn-sm" onclick="addActionItem('${m.id}')">+ Add</button>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    <button class="btn btn-primary" onclick="saveMeetingNotes('${m.id}')">Save Notes</button>
  `;
  openModal(m.title, body, footer);
}

function saveMeetingNotes(meetingId) {
  const meetings = Store.get('meetings') || [];
  const m = meetings.find(x => x.id === meetingId);
  if (m) {
    m.notes = document.getElementById('meetingNotes_' + meetingId)?.value || '';
    Store.set('meetings', meetings);
    flashSave();
    showToast('Meeting notes saved!');
  }
}

function addDecision(meetingId) {
  const input = document.getElementById('newDecision_' + meetingId);
  const value = input?.value.trim();
  if (!value) return;

  const meetings = Store.get('meetings') || [];
  const m = meetings.find(x => x.id === meetingId);
  if (m) {
    if (!m.decisions) m.decisions = [];
    m.decisions.push(value);
    Store.set('meetings', meetings);
    input.value = '';
    openMeeting(meetingId); // re-render
    flashSave();
  }
}

function addActionItem(meetingId) {
  const input = document.getElementById('newActionTask_' + meetingId);
  const value = input?.value.trim();
  if (!value) return;

  const meetings = Store.get('meetings') || [];
  const m = meetings.find(x => x.id === meetingId);
  if (m) {
    if (!m.actionItems) m.actionItems = [];
    m.actionItems.push({
      id: generateId(),
      task: value,
      assignee: Store.get('settings')?.currentMember || 'm1',
      deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      done: false
    });
    Store.set('meetings', meetings);
    input.value = '';
    openMeeting(meetingId);
    flashSave();
  }
}

function toggleActionItem(meetingId, itemId) {
  const meetings = Store.get('meetings') || [];
  const m = meetings.find(x => x.id === meetingId);
  if (m) {
    const item = m.actionItems.find(x => x.id === itemId);
    if (item) {
      item.done = !item.done;
      Store.set('meetings', meetings);
      openMeeting(meetingId);
      flashSave();
    }
  }
}

function showNewMeetingModal() {
  const cases = Store.get('cases') || [];
  const members = Store.get('members') || [];
  const today = new Date().toISOString().split('T')[0];

  const body = `
    <div class="form-group"><label>Meeting Title</label><input class="form-input" id="newMeetingTitle" placeholder="e.g., Strategy Review"></div>
    <div class="form-row">
      <div class="form-group"><label>Date</label><input class="form-input" id="newMeetingDate" type="date" value="${today}"></div>
      <div class="form-group"><label>Category</label><select class="form-input" id="newMeetingCategory"><option value="strategy">Strategy</option><option value="research">Research</option><option value="finance">Finance</option><option value="pitch">Pitch</option><option value="general">General</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Start Time</label><input class="form-input" id="newMeetingStart" type="time" value="18:00"></div>
      <div class="form-group"><label>End Time</label><input class="form-input" id="newMeetingEnd" type="time" value="19:00"></div>
    </div>
    <div class="form-group"><label>Related Case</label><select class="form-input" id="newMeetingCase"><option value="">None</option>${cases.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label>Agenda (one per line)</label><textarea class="form-input" id="newMeetingAgenda" placeholder="Agenda item 1&#10;Agenda item 2&#10;Agenda item 3" style="min-height:80px"></textarea></div>
    <div class="form-group"><label>Participants</label><div class="flex gap-2 flex-wrap mt-2">${members.map(m => `
      <label style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--bg-secondary);border-radius:var(--radius);cursor:pointer;font-size:0.85rem">
        <input type="checkbox" value="${m.id}" checked class="meetingParticipant"> ${m.name}
      </label>
    `).join('')}</div></div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="createMeeting()">Schedule Meeting</button>
  `;
  openModal('Schedule Meeting', body, footer);
}

function createMeeting() {
  const title = document.getElementById('newMeetingTitle').value.trim();
  if (!title) { showToast('Please enter a meeting title', 'error'); return; }

  const participants = Array.from(document.querySelectorAll('.meetingParticipant:checked')).map(cb => cb.value);
  const agendaText = document.getElementById('newMeetingAgenda').value.trim();
  const agenda = agendaText ? agendaText.split('\n').filter(a => a.trim()) : [];

  const meetings = Store.get('meetings') || [];
  meetings.push({
    id: generateId(),
    title,
    date: document.getElementById('newMeetingDate').value,
    startTime: document.getElementById('newMeetingStart').value,
    endTime: document.getElementById('newMeetingEnd').value,
    participants,
    agenda,
    caseId: document.getElementById('newMeetingCase').value,
    category: document.getElementById('newMeetingCategory').value,
    notes: '',
    decisions: [],
    actionItems: [],
    recording: null,
  });

  Store.set('meetings', meetings);
  closeModal();
  showToast('Meeting scheduled!');
  App.navigate('meetings');
}
