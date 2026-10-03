// ===== Sidebar Component =====

function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  const settings = Store.get('settings') || {};
  const member = getMember(settings.currentMember);

  document.getElementById('userAvatar').textContent = member.initials;
  document.getElementById('userAvatar').style.background = member.color;
  document.getElementById('userName').textContent = member.name;

  nav.innerHTML = `
    <div class="nav-section-label">Main</div>
    <div class="nav-item" data-page="dashboard" onclick="App.navigate('dashboard')">
      <span class="nav-icon">🏠</span> Dashboard
    </div>

    <div class="nav-section-label">Workspace</div>
    <div class="nav-item" data-page="cases" onclick="App.navigate('cases')">
      <span class="nav-icon">📁</span> Cases
    </div>
    <div class="nav-item" data-page="team" onclick="App.navigate('team')">
      <span class="nav-icon">👥</span> Team
    </div>
    <div class="nav-item" data-page="meetings" onclick="App.navigate('meetings')">
      <span class="nav-icon">📅</span> Meetings
    </div>
    <div class="nav-item" data-page="notes" onclick="App.navigate('notes')">
      <span class="nav-icon">📝</span> Notes
    </div>

    <div class="nav-section-label">Analysis</div>
    <div class="nav-item" data-page="research" onclick="App.navigate('research')">
      <span class="nav-icon">🔎</span> Research
    </div>
    <div class="nav-item" data-page="problem-tree" onclick="App.navigate('problem-tree')">
      <span class="nav-icon">🧠</span> Problem Tree
    </div>
    <div class="nav-item" data-page="ideas" onclick="App.navigate('ideas')">
      <span class="nav-icon">💡</span> Ideas
    </div>
    <div class="nav-item" data-page="frameworks" onclick="App.navigate('frameworks')">
      <span class="nav-icon">📊</span> Frameworks
    </div>
    <div class="nav-item" data-page="finance" onclick="App.navigate('finance')">
      <span class="nav-icon">💰</span> Finance
    </div>

    <div class="nav-section-label">Practice</div>
    <div class="nav-item" data-page="ai-coach" onclick="App.navigate('ai-coach')">
      <span class="nav-icon">🤖</span> AI Coach
    </div>
    <div class="nav-item" data-page="pitch-practice" onclick="App.navigate('pitch-practice')">
      <span class="nav-icon">🎤</span> Pitch Practice
    </div>
    <div class="nav-item" data-page="judge-simulator" onclick="App.navigate('judge-simulator')">
      <span class="nav-icon">🧑‍⚖️</span> Judge Simulator
    </div>

    <div class="nav-section-label">System</div>
    <div class="nav-item" data-page="settings" onclick="App.navigate('settings')">
      <span class="nav-icon">⚙️</span> Settings
    </div>
  `;
}

function setActiveNav(page) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}
