// ===== WhynotGenZ App - Main Entry =====

const App = {
  currentPage: 'dashboard',
  currentParams: null,

  init() {
    Store.init();
    renderSidebar();
    this.handleHashRoute();
    window.addEventListener('hashchange', () => this.handleHashRoute());
  },

  navigate(page, param) {
    this.currentPage = page;
    this.currentParams = param || null;
    const hash = param ? `#${page}/${param}` : `#${page}`;
    window.location.hash = hash;
    this.render();
  },

  handleHashRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const parts = hash.split('/');
    this.currentPage = parts[0] || 'dashboard';
    this.currentParams = parts[1] || null;
    this.render();
  },

  render() {
    const content = document.getElementById('pageContent');
    const headerTitle = document.getElementById('headerTitle');

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');

    let pageTitle = 'Dashboard';
    let html = '';

    switch (this.currentPage) {
      case 'dashboard':
        pageTitle = 'Dashboard';
        html = renderDashboard();
        break;
      case 'cases':
        pageTitle = 'Cases';
        html = renderCases();
        break;
      case 'case-workspace':
        pageTitle = 'Case Workspace';
        html = renderCaseWorkspace(this.currentParams);
        break;
      case 'team':
        pageTitle = 'Team';
        html = renderTeam();
        break;
      case 'meetings':
        pageTitle = 'Meetings';
        html = renderMeetings();
        break;
      case 'tasks':
        pageTitle = 'Tasks';
        html = renderTasks();
        break;
      case 'notes':
        pageTitle = 'Notes';
        html = renderNotes();
        break;
      case 'research':
        pageTitle = 'Research Hub';
        html = renderResearch();
        break;
      case 'problem-tree':
        pageTitle = 'Problem Tree';
        html = renderProblemTree(this.currentParams);
        break;
      case 'ideas':
        pageTitle = 'Ideas';
        html = renderIdeas(this.currentParams);
        break;
      case 'frameworks':
        pageTitle = 'Frameworks';
        html = renderFrameworks(this.currentParams);
        break;
      case 'finance':
        pageTitle = 'Finance';
        html = renderFinance(this.currentParams);
        break;
      case 'ai-coach':
        pageTitle = 'AI Coach';
        html = renderAiCoach();
        break;
      case 'pitch-practice':
        pageTitle = 'Pitch Practice';
        html = renderPitchPractice();
        break;
      case 'judge-simulator':
        pageTitle = 'Judge Simulator';
        html = renderJudgeSimulator();
        break;
      case 'settings':
        pageTitle = 'Settings';
        html = renderSettings();
        break;
      default:
        pageTitle = 'Dashboard';
        html = renderDashboard();
        this.currentPage = 'dashboard';
    }

    headerTitle.innerHTML = `<h2>${pageTitle}</h2>`;
    content.innerHTML = html;
    content.scrollTop = 0;
    setActiveNav(this.currentPage);

    // Animate in
    content.classList.remove('animate-fade-in');
    void content.offsetWidth;
    content.classList.add('animate-fade-in');
  }
};

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// ===== Mobile Sidebar =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
  });

  document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  });
});

// ===== Responsive grid fix for dashboard =====
const style = document.createElement('style');
style.textContent = `
  @media (max-width: 900px) {
    .dashboard-current-case .case-meta { flex-wrap: wrap; gap: 12px; }
    div[style*="grid-template-columns:1fr 360px"] {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(style);
