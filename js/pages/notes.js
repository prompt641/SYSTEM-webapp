// ===== Notes Page =====

function renderNotes() {
  const notes = Store.get('notes') || [];
  const cases = Store.get('cases') || [];

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1>Notes</h1>
        <p class="text-secondary text-sm">${notes.length} notes</p>
      </div>
      <button class="btn btn-primary" onclick="showNewNoteModal()">+ New Note</button>
    </div>
    <div class="flex gap-3 mb-6">
      <input class="form-input" placeholder="Search notes..." style="max-width:300px" oninput="filterNotes(this.value)">
      <select class="form-input" style="width:auto" id="notesFilter" onchange="filterNotes(document.getElementById('notesSearch')?.value || '')">
        <option value="all">All Categories</option>
        <option value="meeting">Meeting</option>
        <option value="research">Research</option>
        <option value="strategy">Strategy</option>
        <option value="idea">Idea</option>
        <option value="finance">Finance</option>
        <option value="general">General</option>
      </select>
      <select class="form-input" style="width:auto" id="notesSort">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="updated">Recently Updated</option>
      </select>
    </div>
    <div id="notesContainer" class="grid-3">
  `;

  notes.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(n => {
    const catColors = { meeting: '#3b82f6', research: '#22c55e', strategy: '#6366f1', idea: '#f59e0b', finance: '#a855f7', general: '#6b7280' };
    html += `
      <div class="card" style="cursor:pointer" onclick="openNote('${n.id}')">
        <div class="flex items-center justify-between mb-2">
          <span class="tag" style="background:${catColors[n.category] || '#6b7280'}22;color:${catColors[n.category] || '#6b7280'}">${n.category}</span>
          <span class="text-xs text-secondary">${formatDate(n.date)}</span>
        </div>
        <h4 style="margin-bottom:8px">${escapeHtml(n.title)}</h4>
        <p class="text-sm text-secondary" style="overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">${escapeHtml(n.content).substring(0, 150)}...</p>
        <div class="flex items-center gap-2 mt-3">
          <div class="avatar avatar-sm" style="background:${getMember(n.createdBy).color}">${getMember(n.createdBy).initials}</div>
          <span class="text-xs text-secondary">${getMember(n.createdBy).name}</span>
        </div>
      </div>
    `;
  });

  html += '</div>';
  if (notes.length === 0) {
    html = html.replace('</div>', `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">📝</div>
        <h4>No notes yet</h4>
        <p>Create your first note to start organizing your thoughts</p>
        <button class="btn btn-primary mt-4" onclick="showNewNoteModal()">+ New Note</button>
      </div>
    </div>`);
  }

  return html;
}

function openNote(noteId) {
  const notes = Store.get('notes') || [];
  const n = notes.find(x => x.id === noteId);
  if (!n) return;

  const body = `
    <div class="form-group"><label>Title</label><input class="form-input" id="editNoteTitle" value="${escapeHtml(n.title)}"></div>
    <div class="form-row">
      <div class="form-group"><label>Category</label><select class="form-input" id="editNoteCategory">
        <option value="meeting" ${n.category === 'meeting' ? 'selected' : ''}>Meeting</option>
        <option value="research" ${n.category === 'research' ? 'selected' : ''}>Research</option>
        <option value="strategy" ${n.category === 'strategy' ? 'selected' : ''}>Strategy</option>
        <option value="idea" ${n.category === 'idea' ? 'selected' : ''}>Idea</option>
        <option value="finance" ${n.category === 'finance' ? 'selected' : ''}>Finance</option>
        <option value="general" ${n.category === 'general' ? 'selected' : ''}>General</option>
      </select></div>
      <div class="form-group"><label>Related Case</label><select class="form-input" id="editNoteCase">
        <option value="">None</option>
        ${(Store.get('cases') || []).map(c => `<option value="${c.id}" ${c.id === n.caseId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
      </select></div>
    </div>
    <div class="form-group"><label>Content</label><textarea class="form-input" id="editNoteContent" style="min-height:250px">${escapeHtml(n.content)}</textarea></div>
    <div class="text-xs text-secondary">Created by ${getMember(n.createdBy).name} on ${formatDateFull(n.date)}</div>
  `;
  const footer = `
    <button class="btn btn-danger btn-sm" onclick="deleteNote('${n.id}')">Delete</button>
    <div style="flex:1"></div>
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveNote('${n.id}')">Save</button>
  `;
  openModal('Edit Note', body, footer);
}

function showNewNoteModal() {
  const body = `
    <div class="form-group"><label>Title</label><input class="form-input" id="newNoteTitle" placeholder="e.g., Strategy Direction"></div>
    <div class="form-row">
      <div class="form-group"><label>Category</label><select class="form-input" id="newNoteCategory">
        <option value="strategy">Strategy</option>
        <option value="research">Research</option>
        <option value="meeting">Meeting</option>
        <option value="idea">Idea</option>
        <option value="finance">Finance</option>
        <option value="general">General</option>
      </select></div>
      <div class="form-group"><label>Related Case</label><select class="form-input" id="newNoteCase">
        <option value="">None</option>
        ${(Store.get('cases') || []).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
      </select></div>
    </div>
    <div class="form-group"><label>Content</label><textarea class="form-input" id="newNoteContent" placeholder="Write your note..." style="min-height:200px"></textarea></div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="createNote()">Create Note</button>
  `;
  openModal('New Note', body, footer);
}

function createNote() {
  const title = document.getElementById('newNoteTitle').value.trim();
  const content = document.getElementById('newNoteContent').value.trim();
  if (!title) { showToast('Please enter a title', 'error'); return; }

  const notes = Store.get('notes') || [];
  const now = new Date().toISOString().split('T')[0];
  notes.unshift({
    id: generateId(),
    title,
    content,
    category: document.getElementById('newNoteCategory').value,
    caseId: document.getElementById('newNoteCase').value,
    createdBy: Store.get('settings')?.currentMember || 'm1',
    date: now,
    updatedAt: now,
  });
  Store.set('notes', notes);
  closeModal();
  showToast('Note created!');
  App.navigate('notes');
}

function saveNote(noteId) {
  const notes = Store.get('notes') || [];
  const n = notes.find(x => x.id === noteId);
  if (n) {
    n.title = document.getElementById('editNoteTitle').value.trim();
    n.content = document.getElementById('editNoteContent').value;
    n.category = document.getElementById('editNoteCategory').value;
    n.caseId = document.getElementById('editNoteCase').value;
    n.updatedAt = new Date().toISOString().split('T')[0];
    Store.set('notes', notes);
    closeModal();
    showToast('Note saved!');
    App.navigate('notes');
    flashSave();
  }
}

function deleteNote(noteId) {
  if (!confirm('Delete this note?')) return;
  let notes = Store.get('notes') || [];
  notes = notes.filter(n => n.id !== noteId);
  Store.set('notes', notes);
  closeModal();
  showToast('Note deleted');
  App.navigate('notes');
}

function filterNotes(query) {
  // Simple re-render approach
  App.navigate('notes');
}
