// ===== Settings Page =====

function renderSettings() {
  const settings = Store.get('settings') || {};
  const members = Store.get('members') || [];
  const currentMember = members.find(m => m.id === settings.currentMember) || members[0];

  let html = `
    <div class="mb-6">
      <h1>⚙️ Settings</h1>
      <p class="text-secondary text-sm">Manage your team workspace</p>
    </div>

    <div class="grid-2" style="gap:24px">
      <!-- Profile -->
      <div class="card">
        <h3 class="mb-4">👤 Your Profile</h3>
        ${currentMember ? `
        <div class="flex items-center gap-4 mb-4">
          <div class="avatar avatar-lg" style="background:${currentMember.color}">${currentMember.initials}</div>
          <div>
            <h4>${escapeHtml(currentMember.name)}</h4>
            <p class="text-sm text-secondary">${escapeHtml(currentMember.role)}</p>
          </div>
        </div>
        <div class="form-group">
          <label>Switch Member</label>
          <select class="form-input" id="settingsMember" onchange="switchMember(this.value)">
            ${members.map(m => `<option value="${m.id}" ${m.id === settings.currentMember ? 'selected' : ''}>${escapeHtml(m.name)} — ${escapeHtml(m.role)}</option>`).join('')}
          </select>
        </div>
        ` : '<p class="text-secondary">Add team members to manage profiles</p>'}
      </div>

      <!-- Team -->
      <div class="card">
        <h3 class="mb-4">👥 Team Members</h3>
        ${members.length > 0 ? members.map(m => `
          <div class="flex items-center gap-3" style="padding:10px 0;border-bottom:1px solid var(--border-light)">
            <div class="avatar avatar-sm" style="background:${m.color}">${m.initials}</div>
            <div style="flex:1">
              <div class="text-sm font-semibold">${escapeHtml(m.name)}</div>
              <div class="text-xs text-secondary">${escapeHtml(m.role)}</div>
            </div>
          </div>
        `).join('') : '<p class="text-secondary text-sm">No members yet. <a href="#team" style="color:var(--accent)">Add team members</a></p>'}
      </div>

      <!-- Data Management -->
      <div class="card">
        <h3 class="mb-4">💾 Data Management</h3>
        <p class="text-sm text-secondary mb-4">All data is stored in your browser's local storage.</p>
        <div class="flex gap-2">
          <button class="btn btn-secondary" onclick="exportData()">📤 Export Data</button>
          <button class="btn btn-danger" onclick="resetAllData()">🗑️ Reset All Data</button>
        </div>
      </div>

      <!-- About -->
      <div class="card">
        <h3 class="mb-4">ℹ️ About</h3>
        <div class="text-sm" style="line-height:1.8">
          <p><strong>WHyNotGenZ</strong> Case Competition Hub</p>
          <p class="text-secondary">Your team's command center for case competitions.</p>
          <p class="text-secondary mt-4">Version 1.0</p>
        </div>
      </div>
    </div>
  `;

  return html;
}

function switchMember(memberId) {
  const settings = Store.get('settings') || {};
  settings.currentMember = memberId;
  Store.set('settings', settings);
  const member = getMember(memberId);
  document.getElementById('userAvatar').textContent = member.initials;
  document.getElementById('userAvatar').style.background = member.color;
  document.getElementById('userName').textContent = member.name;
  showToast(`Switched to ${member.name}`);
}

function exportData() {
  const data = {};
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('whynotgenz_')) {
      data[k] = localStorage.getItem(k);
    }
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whynotgenz-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!');
}

function resetAllData() {
  if (!confirm('This will delete ALL data. Are you sure?')) return;
  if (!confirm('This action cannot be undone. Type "RESET" in your mind and click OK.')) return;
  Store.reset();
  showToast('All data has been reset');
  App.navigate('dashboard');
  renderSidebar();
}
