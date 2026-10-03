// ===== AI Coach =====

let aiChatMessages = [];

function renderAiCoach() {
  aiChatMessages = Store.get('aiChatMessages') || [
    {
      role: 'ai',
      text: "Welcome! I'm the **WhynotGenZ AI Coach**. 🧠\n\nI won't solve your case for you — but I'll make sure you think deeply about it.\n\nTell me about your case or strategy, and I'll ask the hard questions a judge would ask.\n\nWhat are you working on right now?"
    }
  ];

  let html = `
    <div class="mb-6">
      <h1>🤖 AI Case Coach</h1>
      <p class="text-secondary text-sm">Your thinking partner — challenges assumptions, asks hard questions</p>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="ai-chat">
        <div class="ai-chat-messages" id="aiChatMessages">
          ${aiChatMessages.map(m => `
            <div class="ai-chat-message ${m.role}">
              ${m.role === 'ai' ? '<div class="avatar" style="background:var(--accent)">🤖</div>' : '<div class="avatar" style="background:var(--green)">Y</div>'}
              <div class="message-bubble">${formatAiMessage(m.text)}</div>
            </div>
          `).join('')}
        </div>
        <div class="ai-chat-input">
          <input class="form-input" id="aiChatInput" placeholder="Describe your strategy or ask a question..." onkeydown="if(event.key==='Enter')sendAiMessage()">
          <button class="btn btn-primary" onclick="sendAiMessage()">Send</button>
        </div>
      </div>
    </div>

    <div class="grid-3 mt-4">
      <div class="card" style="cursor:pointer" onclick="aiQuickPrompt('We are targeting Gen Z customers through social media marketing')">
        <div style="font-size:1.5rem;margin-bottom:8px">💡</div>
        <h4>Strategy Check</h4>
        <p class="text-xs text-secondary">Get feedback on your strategy</p>
      </div>
      <div class="card" style="cursor:pointer" onclick="aiQuickPrompt('Our revenue model is based on a subscription at $29.99/month')">
        <div style="font-size:1.5rem;margin-bottom:8px">💰</div>
        <h4>Financial Review</h4>
        <p class="text-xs text-secondary">Challenge your financial assumptions</p>
      </div>
      <div class="card" style="cursor:pointer" onclick="aiQuickPrompt('We chose this strategy because it has the highest potential market size')">
        <div style="font-size:1.5rem;margin-bottom:8px">🤔</div>
        <h4>Assumption Check</h4>
        <p class="text-xs text-secondary">Validate your key assumptions</p>
      </div>
    </div>
  `;

  return html;
}

function formatAiMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/^> (.+)/gm, '<div style="padding:8px 12px;background:rgba(0,0,0,0.05);border-left:3px solid var(--accent);margin:8px 0;border-radius:0 4px 4px 0">$1</div>');
}

function sendAiMessage() {
  const input = document.getElementById('aiChatInput');
  const text = input?.value.trim();
  if (!text) return;

  aiChatMessages.push({ role: 'user', text });
  input.value = '';

  // Generate AI response
  const response = generateAiResponse(text);
  aiChatMessages.push({ role: 'ai', text: response });

  Store.set('aiChatMessages', aiChatMessages);
  App.navigate('ai-coach');
}

function aiQuickPrompt(text) {
  aiChatMessages.push({ role: 'user', text });
  const response = generateAiResponse(text);
  aiChatMessages.push({ role: 'ai', text: response });
  Store.set('aiChatMessages', aiChatMessages);
  App.navigate('ai-coach');
}

function generateAiResponse(userMessage) {
  const lower = userMessage.toLowerCase();

  // Strategy-related
  if (lower.includes('strategy') || lower.includes('target') || lower.includes('approach')) {
    const responses = [
      "Interesting strategy. Let me challenge a few things:\n\n> Why this target segment specifically?\n\n1. What evidence do you have that this segment is underserved?\n2. What happens if a competitor copies this approach?\n3. How does this align with the company's core capabilities?\n4. What's your **unique value proposition** that competitors can't easily replicate?\n5. What KPI will you use to measure success?\n\nThe judges will ask **\"Why this over other options?\"** — do you have a clear answer?",
      "Before we go deeper, let me push back:\n\n> Is this strategy **defensible** or is it just the obvious choice?\n\n- What's your **moat**? (What prevents competitors from doing the same thing?)\n- Have you considered the **resource constraints** of implementation?\n- What are the **top 3 risks** of this strategy?\n- If you had half the budget, would you still choose this approach?\n\nStrong strategies aren't just good ideas — they're **best** ideas given constraints.",
      "I like that you're thinking strategically. But here's what the judges will want to know:\n\n> What did you **reject** and why?\n\nShowing you considered alternatives and deliberately chose this path demonstrates **rigorous thinking**. What were your other options? What tradeoffs did you make?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Financial
  if (lower.includes('revenue') || lower.includes('price') || lower.includes('money') || lower.includes('financial') || lower.includes('cost')) {
    const responses = [
      "Let me stress-test your financial assumptions:\n\n> $29.99/month — where does that number come from?\n\n1. Is this based on **competitor pricing** or customer willingness to pay?\n2. What's the **price elasticity** of demand in this market?\n3. Have you validated this price with any customer research?\n4. What happens at $39.99? What about $19.99?\n5. How does this price compare to the **value** you're delivering?\n\nRemember: The best financial models tell a **story**, not just numbers.",
      "Your revenue model needs to survive the **\"so what\" test**:\n\n> Revenue is $1.2M — but is that good?\n\n- What's the **market size** and what % are you capturing?\n- What's your **growth rate** assumption? Is it realistic?\n- How does this compare to **industry benchmarks**?\n- What are the **key drivers** of revenue?\n\nJudges want to see that your numbers are **grounded in reality**, not just calculations.",
      "Quick financial questions:\n\n> What's your **break-even timeline**?\n\n- How much capital do you need before becoming profitable?\n- What's the **customer acquisition cost (CAC)**?\n- What's the **lifetime value (LTV)** of a customer?\n- What's the **LTV:CAC ratio**?\n\nIf LTV:CAC < 3, judges will question the sustainability of your model.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Default probing questions
  const defaults = [
    "Good point. Now let me dig deeper:\n\n> Why should the judges care about this?\n\n1. What's the **so what?** — Why does this matter for the business?\n2. What **evidence** supports your claim?\n3. What's the **biggest assumption** you're making?\n4. If your competitor heard this strategy, what would they do?\n5. What's the **one thing** that could make this entire strategy fail?\n\nCase competitions reward **depth of thinking**, not breadth of ideas.",
    "Interesting. Let me challenge your thinking:\n\n> Have you considered the **opportunity cost**?\n\n- By pursuing this, what are you **giving up**?\n- Is this the **highest-impact** use of limited resources?\n- What would you do differently with **unlimited time**? (This reveals your real priorities)\n- What's the **80/20** — what 20% of effort drives 80% of results?\n\nJudges can tell when a team has truly **prioritized** vs. trying to do everything.",
    "Before you present this to judges, answer these:\n\n> What's the **one number** that proves your strategy works?\n\n- If you could only show **one chart**, what would it be?\n- What's the **most impressive** result of your analysis?\n- Where are you **most vulnerable** to criticism?\n- How will you handle the **\"What if this doesn't work?\"** question?\n\nStrong presentations have a **clear narrative thread** that ties everything together.",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}
