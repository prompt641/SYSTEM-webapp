// ===== Helper Functions =====

function generateId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function getRelativeDate(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((target - today) / 86400000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  return formatDate(dateStr);
}

function getTimeRemaining(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  if (diff <= 0) return 'Past due';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function getDeadlineClass(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end - now;
  if (diff <= 0) return 'danger';
  if (diff < 86400000) return 'danger'; // < 1 day
  if (diff < 172800000) return 'warning'; // < 2 days
  return '';
}

function getMember(id) {
  const members = Store.get('members') || [];
  return members.find(m => m.id === id) || { name: 'Unknown', initials: '??', color: '#999' };
}

function getStatusBadge(status) {
  const map = {
    'todo': '<span class="badge badge-todo">To Do</span>',
    'in-progress': '<span class="badge badge-progress">🟡 In Progress</span>',
    'review': '<span class="badge badge-review">Review</span>',
    'done': '<span class="badge badge-done">✅ Done</span>',
  };
  return map[status] || status;
}

function getPriorityDot(priority) {
  return `<span class="priority-dot ${priority}"></span>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - now) / 86400000);
}

function calculateIdeaScore(idea) {
  const impact = (idea.impact || 5) * 2;
  const feasibility = (idea.feasibility || 5) * 2;
  const costScore = (10 - (idea.cost || 5)) * 1.5;
  const difficultyScore = (10 - (idea.difficulty || 5)) * 1.5;
  const voteScore = Math.min((idea.votes || []).length * 4, 16);
  return Math.round(impact + feasibility + costScore + difficultyScore + voteScore);
}
