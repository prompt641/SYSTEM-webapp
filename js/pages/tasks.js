// ===== Tasks Page (Kanban) =====

function renderTasks() {
  const cases = Store.get('cases') || [];
  const activeCase = cases.find(c => c.status === 'in-progress') || cases[0];

  if (!activeCase) {
    return `
      <div class="empty-state" style="padding:60px 20px">
        <div class="empty-icon">📋</div>
        <h4>No cases yet</h4>
        <p>Create a case first to manage tasks</p>
        <button class="btn btn-primary btn-lg mt-4" onclick="App.navigate('cases')">+ Create Case</button>
      </div>
    `;
  }

  const tasks = activeCase.tasks || [];

  const columns = [
    { id: 'todo', label: 'To Do', badge: 'badge-todo', icon: '⬜', tasks: tasks.filter(t => t.status === 'todo') },
    { id: 'in-progress', label: 'In Progress', badge: 'badge-progress', icon: '🟡', tasks: tasks.filter(t => t.status === 'in-progress') },
    { id: 'review', label: 'Review', badge: 'badge-review', icon: '🔵', tasks: tasks.filter(t => t.status === 'review') },
    { id: 'done', label: 'Done', badge: 'badge-done', icon: '✅', tasks: tasks.filter(t => t.status === 'done') },
  ];

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1>Tasks</h1>
        <p class="text-secondary text-sm">${escapeHtml(activeCase.name)} • ${tasks.length} tasks</p>
      </div>
      <button class="btn btn-primary" onclick="showNewTaskModal('${activeCase.id}')">+ New Task</button>
    </div>
    <div class="kanban-board" id="kanbanBoard">
  `;

  columns.forEach(col => {
    html += `
      <div class="kanban-column" data-status="${col.id}"
           ondragover="event.preventDefault(); this.style.background='var(--accent-light)'"
           ondragleave="this.style.background=''"
           ondrop="dropTask(event, '${col.id}', '${activeCase.id}'); this.style.background=''">
        <div class="kanban-column-header">
          <h4>${col.icon} ${col.label} <span class="count">${col.tasks.length}</span></h4>
          <button class="btn btn-ghost btn-sm" onclick="showNewTaskModal('${activeCase.id}', '${col.id}')" style="font-size:0.75rem">+</button>
        </div>
        ${col.tasks.map(t => renderTaskCard(t, activeCase.id)).join('')}
      </div>
    `;
  });

  html += '</div>';
  return html;
}

function renderTaskCard(task, caseId) {
  const member = getMember(task.assignee);
  return `
    <div class="kanban-card" draggable="true" ondragstart="dragTask(event, '${task.id}')" data-task-id="${task.id}">
      <div class="flex items-center justify-between mb-2">
        ${getPriorityDot(task.priority)}
        <button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:0.7rem" onclick="editTask('${caseId}', '${task.id}')">✏️</button>
      </div>
      <div class="kanban-card-title">${escapeHtml(task.title)}</div>
      <div class="kanban-card-meta">
        <div class="kanban-card-assignee">
          <div class="avatar avatar-sm" style="background:${member.color}">${member.initials}</div>
          <span>${member.name}</span>
        </div>
        <span class="text-xs" style="color:${getDeadlineClass(task.deadline) === 'danger' ? 'var(--red)' : ''}">${getRelativeDate(task.deadline)}</span>
      </div>
    </div>
  `;
}

// Drag and Drop
let draggedTaskId = null;

function dragTask(event, taskId) {
  draggedTaskId = taskId;
  event.dataTransfer.effectAllowed = 'move';
  event.target.classList.add('dragging');
}

function dropTask(event, newStatus, caseId) {
  event.preventDefault();
  if (!draggedTaskId) return;

  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    const task = c.tasks.find(t => t.id === draggedTaskId);
    if (task) {
      task.status = newStatus;
      Store.set('cases', cases);
      flashSave();
      App.navigate('tasks');
    }
  }
  draggedTaskId = null;
}

function showNewTaskModal(caseId, defaultStatus) {
  const members = Store.get('members') || [];
  const body = `
    <div class="form-group"><label>Task Name</label><input class="form-input" id="newTaskTitle" placeholder="e.g., Build Financial Model"></div>
    <div class="form-row">
      <div class="form-group"><label>Assignee</label><select class="form-input" id="newTaskAssignee">${members.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Priority</label><select class="form-input" id="newTaskPriority"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Deadline</label><input class="form-input" id="newTaskDeadline" type="date" value="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Status</label><select class="form-input" id="newTaskStatus"><option value="todo" ${defaultStatus === 'todo' ? 'selected' : ''}>To Do</option><option value="in-progress" ${defaultStatus === 'in-progress' ? 'selected' : ''}>In Progress</option><option value="review" ${defaultStatus === 'review' ? 'selected' : ''}>Review</option></select></div>
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="createTask('${caseId}')">Create Task</button>
  `;
  openModal('New Task', body, footer);
}

function createTask(caseId) {
  const title = document.getElementById('newTaskTitle').value.trim();
  if (!title) { showToast('Please enter a task name', 'error'); return; }

  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    c.tasks.push({
      id: generateId(),
      title,
      assignee: document.getElementById('newTaskAssignee').value,
      priority: document.getElementById('newTaskPriority').value,
      deadline: document.getElementById('newTaskDeadline').value,
      status: document.getElementById('newTaskStatus').value,
      caseId
    });
    Store.set('cases', cases);
    closeModal();
    showToast('Task created!');
    App.navigate('tasks');
  }
}

function editTask(caseId, taskId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  const task = c?.tasks.find(t => t.id === taskId);
  if (!task) return;
  const members = Store.get('members') || [];

  const body = `
    <div class="form-group"><label>Task Name</label><input class="form-input" id="editTaskTitle" value="${escapeHtml(task.title)}"></div>
    <div class="form-row">
      <div class="form-group"><label>Assignee</label><select class="form-input" id="editTaskAssignee">${members.map(m => `<option value="${m.id}" ${m.id === task.assignee ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Priority</label><select class="form-input" id="editTaskPriority"><option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option><option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option><option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Deadline</label><input class="form-input" id="editTaskDeadline" type="date" value="${task.deadline}"></div>
      <div class="form-group"><label>Status</label><select class="form-input" id="editTaskStatus"><option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option><option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option><option value="review" ${task.status === 'review' ? 'selected' : ''}>Review</option><option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option></select></div>
    </div>
  `;
  const footer = `
    <button class="btn btn-danger btn-sm" onclick="deleteTask('${caseId}','${taskId}')">Delete</button>
    <div style="flex:1"></div>
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="updateTask('${caseId}','${taskId}')">Save</button>
  `;
  openModal('Edit Task', body, footer);
}

function updateTask(caseId, taskId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  const task = c?.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.title = document.getElementById('editTaskTitle').value.trim();
  task.assignee = document.getElementById('editTaskAssignee').value;
  task.priority = document.getElementById('editTaskPriority').value;
  task.deadline = document.getElementById('editTaskDeadline').value;
  task.status = document.getElementById('editTaskStatus').value;
  Store.set('cases', cases);
  closeModal();
  showToast('Task updated!');
  App.navigate('tasks');
}

function deleteTask(caseId, taskId) {
  if (!confirm('Delete this task?')) return;
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    c.tasks = c.tasks.filter(t => t.id !== taskId);
    Store.set('cases', cases);
    closeModal();
    showToast('Task deleted');
    App.navigate('tasks');
  }
}
