// ===== Judge Simulator =====

let judgeSessionActive = false;
let judgeType = null;
let judgeMessages = [];
let judgeScore = null;

function renderJudgeSimulator() {
  const sessions = Store.get('judgeSessions') || [];

  let html = `
    <div class="mb-6">
      <h1>🧑‍⚖️ Judge Simulator</h1>
      <p class="text-secondary text-sm">Practice answering tough judge questions with AI</p>
    </div>
  `;

  if (!judgeSessionActive) {
    // Judge Selection
    html += '<div class="grid-3 mb-6">';
    const judgeTypes = [
      { id: 'strategy', name: 'Strategy Judge', icon: '🎯', desc: 'Focuses on strategic thinking, market analysis, and competitive positioning', color: 'var(--accent)' },
      { id: 'finance', name: 'Finance Judge', icon: '💰', desc: 'Questions financial assumptions, ROI, and business model viability', color: 'var(--green)' },
      { id: 'marketing', name: 'Marketing Judge', icon: '📢', desc: 'Evaluates marketing strategy, customer targeting, and brand positioning', color: 'var(--yellow)' },
      { id: 'general', name: 'General Judge', icon: '📋', desc: 'Well-rounded questions covering all aspects of the case', color: 'var(--blue)' },
      { id: 'hard', name: 'Hard Judge', icon: '🔥', desc: 'Asks the toughest questions, challenges every assumption', color: 'var(--red)' },
    ];
    judgeTypes.forEach(jt => {
      html += `
        <div class="judge-card" onclick="startJudgeSession('${jt.id}')">
          <div class="judge-icon">${jt.icon}</div>
          <h4 style="color:${jt.color}">${jt.name}</h4>
          <p>${jt.desc}</p>
        </div>
      `;
    });
    html += '</div>';

    // Past Sessions
    html += '<h3 class="mb-4">📋 Past Sessions</h3>';
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
                <div class="font-semibold">${escapeHtml(s.judgeType)} Judge Session</div>
                <div class="text-sm text-secondary">${formatDateFull(s.date)}</div>
                ${s.strengths ? `<div class="text-sm mt-1" style="color:var(--green)">✓ ${escapeHtml(s.strengths).substring(0, 80)}</div>` : ''}
                ${s.weaknesses ? `<div class="text-sm mt-1" style="color:var(--red)">⚠ ${escapeHtml(s.weaknesses).substring(0, 80)}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<div class="empty-state"><p>No past sessions yet</p></div>';
    }
  } else {
    // Active session
    html += `
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="badge badge-progress">🔴 Session Active</span>
          <span class="text-secondary text-sm">${judgeType} Judge</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="endJudgeSession()">End Session</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <div class="ai-chat">
          <div class="ai-chat-messages" id="judgeChatMessages">
            ${judgeMessages.map(m => `
              <div class="ai-chat-message ${m.role}">
                ${m.role === 'ai' ? '<div class="avatar" style="background:var(--red)">🧑‍⚖️</div>' : '<div class="avatar" style="background:var(--green)">Y</div>'}
                <div class="message-bubble">${formatAiMessage(m.text)}</div>
              </div>
            `).join('')}
          </div>
          <div class="ai-chat-input">
            <input class="form-input" id="judgeChatInput" placeholder="Type your answer..." onkeydown="if(event.key==='Enter')sendJudgeMessage()">
            <button class="btn btn-primary" onclick="sendJudgeMessage()">Submit</button>
          </div>
        </div>
      </div>
    `;
  }

  return html;
}

function startJudgeSession(type) {
  judgeSessionActive = true;
  judgeType = type;
  judgeMessages = [];

  const judgeNames = {
    strategy: 'Strategy Judge',
    finance: 'Finance Judge',
    marketing: 'Marketing Judge',
    general: 'General Judge',
    hard: 'Hard Judge',
  };

  const openings = {
    strategy: "I'm the Strategy Judge. I'll be evaluating your strategic thinking and market analysis.\n\nLet's begin:\n\n> **Question 1:** Why did you choose this particular strategy over the alternatives? What tradeoffs did you make?\n\nTake your time and provide a structured answer.",
    finance: "I'm the Finance Judge. I'll be examining your financial model and business viability.\n\nLet's begin:\n\n> **Question 1:** Walk me through your revenue model. What are the key assumptions behind your numbers, and how did you validate them?",
    marketing: "I'm the Marketing Judge. I'll be evaluating your marketing and customer strategy.\n\nLet's begin:\n\n> **Question 1:** How did you identify your target customer segment? What data supports this choice?",
    general: "I'm the General Judge. I'll be asking questions across all dimensions of your case.\n\nLet's begin:\n\n> **Question 1:** Give me a 30-second elevator pitch of your entire solution. What problem are you solving and why is your approach the best?",
    hard: "I'm the Hard Judge. I won't go easy on you — real case competitions won't either.\n\nLet's begin:\n\n> **Question 1:** What is the single biggest flaw in your proposal? And don't say you don't have one.",
  };

  judgeMessages.push({ role: 'ai', text: openings[type] });
  Store.set('judgeSessions', Store.get('judgeSessions') || []);
  App.navigate('judge-simulator');
}

function sendJudgeMessage() {
  const input = document.getElementById('judgeChatInput');
  const text = input?.value.trim();
  if (!text) return;

  judgeMessages.push({ role: 'user', text });
  input.value = '';

  const response = generateJudgeResponse(text);
  judgeMessages.push({ role: 'ai', text: response });

  App.navigate('judge-simulator');

  // Auto-scroll
  setTimeout(() => {
    const container = document.getElementById('judgeChatMessages');
    if (container) container.scrollTop = container.scrollHeight;
  }, 100);
}

function generateJudgeResponse(answer) {
  const questionCount = judgeMessages.filter(m => m.role === 'ai').length;

  if (questionCount >= 6) {
    // End session with scoring
    setTimeout(() => endJudgeSessionWithScore(), 100);
    return "Thank you for your answers. I've evaluated your performance.\n\nLet me give you my final assessment...";
  }

  const nextQuestions = {
    strategy: [
      "Interesting answer. Let me push further:\n\n> **Question ${n}:** How does your strategy account for competitive response? If Competitor X does the same thing, what's your differentiator?",
      "Good point. Now:\n\n> **Question ${n}:** What are the **resource requirements** for this strategy? Can the company realistically execute with current capabilities?",
      "I see. But consider this:\n\n> **Question ${n}:** If you had to **cut your budget in half**, how would you adapt this strategy?",
    ],
    finance: [
      "Let me challenge that:\n\n> **Question ${n}:** What's your **customer acquisition cost**, and how does it compare to **customer lifetime value**?",
      "Now tell me:\n\n> **Question ${n}:** What's the **break-even point**, and how confident are you in reaching it within the timeline?",
      "One more:\n\n> **Question ${n}:** What happens if customer growth is **50% slower** than projected? Does the model still work?",
    ],
    marketing: [
      "Fair point. Now:\n\n> **Question ${n}:** How will you **measure the success** of your marketing campaigns? What metrics matter most?",
      "Let me push on that:\n\n> **Question ${n}:** What's your **content strategy**? How will you stand out in a saturated social media landscape?",
      "One more question:\n\n> **Question ${n}:** How will you build **brand loyalty** beyond the initial acquisition?",
    ],
    general: [
      "Now going deeper:\n\n> **Question ${n}:** What's the **biggest risk** to your proposal, and what's your mitigation strategy?",
      "Interesting. Let me ask:\n\n> **Question ${n}:** How does your solution create **sustainable competitive advantage**?",
      "Final area:\n\n> **Question ${n}:** What are the **key milestones** for the first 12 months, and what happens if you miss them?",
    ],
    hard: [
      "Hmm, I'm not fully convinced. Let me ask:\n\n> **Question ${n}:** Your competitor has **10x your budget** and a **stronger brand**. What makes you think you can win?",
      "That's a common answer. Try harder:\n\n> **Question ${n}:** Tell me something about this case that **nobody else in the room would notice**.",
      "Last question:\n\n> **Question ${n}:** If I gave you **one minute** to convince me your solution is better than the alternatives, what would you say?",
    ],
  };

  const questions = nextQuestions[judgeType] || nextQuestions.general;
  const qIndex = (questionCount - 1) % questions.length;
  const n = questionCount + 1;
  return questions[qIndex].replace('${n}', n);
}

function endJudgeSession() {
  judgeSessionActive = false;
  judgeType = null;
  judgeMessages = [];
  App.navigate('judge-simulator');
}

function endJudgeSessionWithScore() {
  const score = Math.floor(Math.random() * 25) + 65; // 65-90
  const strengths = ["Clear communication", "Structured answers", "Good market awareness"];
  const weaknesses = ["Could be more specific with numbers", "Need stronger competitive differentiation"];
  const hardQuestions = ["What if budget was halved?", "What's your biggest vulnerability?"];

  const sessions = Store.get('judgeSessions') || [];
  sessions.push({
    id: generateId(),
    judgeType: judgeType,
    date: new Date().toISOString(),
    score: score,
    strengths: strengths[Math.floor(Math.random() * strengths.length)],
    weaknesses: weaknesses[Math.floor(Math.random() * weaknesses.length)],
    hardQuestions: hardQuestions.join('; '),
    recommendations: "Focus on quantifying your claims and building a stronger competitive moat.",
    messageCount: judgeMessages.length,
  });
  Store.set('judgeSessions', sessions);

  judgeSessionActive = false;
  judgeType = null;
  judgeMessages = [];
  showToast(`Session complete! Score: ${score}/100`);
  App.navigate('judge-simulator');
}
