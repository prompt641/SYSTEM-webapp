// ===== Pitch Practice =====

let pitchTimerInterval = null;
let pitchTimerSeconds = 0;
let pitchTimerRunning = false;

function renderPitchPractice() {
  const sessions = Store.get('pitchSessions') || [];

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1>🎤 Pitch Practice</h1>
        <p class="text-secondary text-sm">Practice your presentation and track improvement</p>
      </div>
      <button class="btn btn-primary" onclick="showNewPitchSessionModal()">+ New Practice Session</button>
    </div>

    <!-- Active Timer -->
    <div class="card mb-6" style="text-align:center">
      <h3 class="mb-4">⏱️ Pitch Timer</h3>
      <div class="timer-display" id="pitchTimerDisplay" style="font-size:3.5rem">00:00:00</div>
      <div class="timer-controls" style="margin-top:20px">
        <button class="btn btn-primary" onclick="startPitchTimer()">▶ Start</button>
        <button class="btn btn-secondary" onclick="pausePitchTimer()">⏸ Pause</button>
        <button class="btn btn-secondary" onclick="resetPitchTimer()">↺ Reset</button>
      </div>
    </div>

    <!-- Past Sessions -->
    <h3 class="mb-4">📋 Practice History</h3>
  `;

  if (sessions.length > 0) {
    html += '<div style="display:flex;flex-direction:column;gap:12px">';
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(s => {
      const scoreColor = s.score >= 80 ? 'var(--green)' : s.score >= 60 ? 'var(--yellow)' : 'var(--red)';
      html += `
        <div class="card" style="padding:16px">
          <div class="flex items-center gap-4">
            <div style="min-width:60px;text-align:center">
              <div style="font-size:1.5rem;font-weight:800;color:${scoreColor}">${s.score || '—'}</div>
              <div class="text-xs text-secondary">Score</div>
            </div>
            <div style="flex:1">
              <div class="font-semibold">${escapeHtml(s.title || 'Practice Session')}</div>
              <div class="text-sm text-secondary">${formatDateFull(s.date)} • ${s.duration} min</div>
              ${s.feedback ? `<div class="text-sm mt-2">${escapeHtml(s.feedback).substring(0, 100)}...</div>` : ''}
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<div class="empty-state"><div class="empty-icon">🎤</div><h4>No practice sessions yet</h4><p>Start your first practice session to track improvement</p></div>';
  }

  return html;
}

function startPitchTimer() {
  if (pitchTimerRunning) return;
  pitchTimerRunning = true;
  const display = document.getElementById('pitchTimerDisplay');
  if (!display) return;

  pitchTimerInterval = setInterval(() => {
    pitchTimerSeconds++;
    display.textContent = formatTimerDisplay(pitchTimerSeconds);
    if (pitchTimerSeconds >= 600) display.className = 'timer-display danger';
    else if (pitchTimerSeconds >= 480) display.className = 'timer-display warning';
    else display.className = 'timer-display';
  }, 1000);
}

function pausePitchTimer() {
  pitchTimerRunning = false;
  if (pitchTimerInterval) clearInterval(pitchTimerInterval);
}

function resetPitchTimer() {
  pausePitchTimer();
  pitchTimerSeconds = 0;
  const display = document.getElementById('pitchTimerDisplay');
  if (display) {
    display.textContent = '00:00:00';
    display.className = 'timer-display';
  }
}

function showNewPitchSessionModal() {
  const members = Store.get('members') || [];
  const body = `
    <div class="form-group"><label>Session Title</label><input class="form-input" id="pitchTitle" placeholder="e.g., Full Pitch Rehearsal"></div>
    <div class="form-row">
      <div class="form-group"><label>Presentation Time (min)</label><input class="form-input" id="pitchDuration" type="number" value="15"></div>
      <div class="form-group"><label>Score (0-100)</label><input class="form-input" id="pitchScore" type="number" min="0" max="100"></div>
    </div>
    <div class="form-group"><label>Feedback</label><textarea class="form-input" id="pitchFeedback" placeholder="What went well? What needs improvement?"></textarea></div>
    <div class="form-group"><label>What Went Well</label><input class="form-input" id="pitchGood" placeholder="e.g., Strong opening, clear financials"></div>
    <div class="form-group"><label>Needs Improvement</label><input class="form-input" id="pitchImprove" placeholder="e.g., Q&A section was weak"></div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="savePitchSession()">Save Session</button>
  `;
  openModal('New Practice Session', body, footer);
}

function savePitchSession() {
  const title = document.getElementById('pitchTitle').value.trim();
  const duration = document.getElementById('pitchDuration').value;
  const score = document.getElementById('pitchScore').value;
  const feedback = document.getElementById('pitchFeedback').value.trim();
  const good = document.getElementById('pitchGood').value.trim();
  const improve = document.getElementById('pitchImprove').value.trim();

  const sessions = Store.get('pitchSessions') || [];
  sessions.push({
    id: generateId(),
    title: title || 'Practice Session',
    date: new Date().toISOString(),
    duration: parseInt(duration) || 0,
    score: parseInt(score) || null,
    feedback: feedback || '',
    wentWell: good,
    needsImprovement: improve,
  });

  Store.set('pitchSessions', sessions);
  closeModal();
  showToast('Practice session saved!');
  App.navigate('pitch-practice');
}
