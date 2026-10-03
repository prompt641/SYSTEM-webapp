// ===== Toast Notification =====

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠'}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function flashSave() {
  const el = document.getElementById('autoSaveIndicator');
  el.className = 'auto-save-indicator saving';
  el.innerHTML = '<span>Saving...</span>';
  setTimeout(() => {
    el.className = 'auto-save-indicator saved';
    el.innerHTML = '<span>Saved ✓</span>';
  }, 600);
}
