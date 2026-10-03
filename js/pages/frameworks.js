// ===== Framework Library =====

function getFrameworkDefinitions() {
  return [
    {
      id: 'swot', name: 'SWOT Analysis', icon: '📊',
      description: 'Evaluate Strengths, Weaknesses, Opportunities, and Threats of a business or project.',
      when: 'At the beginning of case analysis to get a full picture of the internal and external environment.',
      what: 'Internal capabilities (strengths/weaknesses) and external factors (opportunities/threats).',
      template: '## Strengths\n- \n## Weaknesses\n- \n## Opportunities\n- \n## Threats\n- '
    },
    {
      id: '3c', name: '3C Analysis', icon: '🔺',
      description: 'Analyze the Company, Customers, and Competitors to develop strategy.',
      when: 'When you need to understand the competitive landscape and customer needs.',
      what: 'Company resources and capabilities, customer segments and needs, competitor strategies.',
      template: '## Company\n- Capabilities: \n- Resources: \n## Customers\n- Segments: \n- Needs: \n## Competitors\n- Key players: \n- Their advantages: '
    },
    {
      id: '4p', name: '4P Marketing Mix', icon: '🎯',
      description: 'Define Product, Price, Place, and Promotion strategy.',
      when: 'When developing a marketing strategy or go-to-market plan.',
      what: 'Product features, pricing strategy, distribution channels, promotional tactics.',
      template: '## Product\n- Features: \n- Benefits: \n## Price\n- Pricing model: \n- Price point: \n## Place\n- Distribution: \n- Channels: \n## Promotion\n- Channels: \n- Message: '
    },
    {
      id: 'stp', name: 'STP Framework', icon: '🎯',
      description: 'Segment the market, Target the right segment, and Position your offering.',
      when: 'When deciding which customer segments to focus on and how to differentiate.',
      what: 'Market segments, target segment profiles, positioning strategy.',
      template: '## Segmentation\n- Geographic: \n- Demographic: \n- Psychographic: \n## Targeting\n- Primary segment: \n- Why: \n## Positioning\n- Value proposition: \n- Differentiation: '
    },
    {
      id: 'tam-sam-som', name: 'TAM / SAM / SOM', icon: '📐',
      description: 'Calculate Total Addressable Market, Serviceable Available Market, and Serviceable Obtainable Market.',
      when: 'When estimating market size and revenue potential for a business case.',
      what: 'Market size data, penetration rates, growth projections.',
      template: '## TAM (Total Addressable Market)\n$ \n## SAM (Serviceable Available Market)\n$ \n## SOM (Serviceable Obtainable Market)\n$ \n## Assumptions\n- '
    },
    {
      id: 'porter', name: "Porter's Five Forces", icon: '⚡',
      description: 'Analyze competitive intensity: Threat of New Entrants, Suppliers, Buyers, Substitutes, and Rivalry.',
      when: 'When assessing industry attractiveness and competitive dynamics.',
      what: 'Industry data, barrier levels, supplier/buyer power, competitive intensity.',
      template: '## Threat of New Entrants\n- Barriers: \n## Supplier Power\n- \n## Buyer Power\n- \n## Threat of Substitutes\n- \n## Competitive Rivalry\n- '
    },
    {
      id: 'pestel', name: 'PESTEL Analysis', icon: '🌍',
      description: 'Analyze Political, Economic, Social, Technological, Environmental, and Legal factors.',
      when: 'When conducting macro-environment analysis for strategic decisions.',
      what: 'External macro-environmental data for each PESTEL dimension.',
      template: '## Political\n- \n## Economic\n- \n## Social\n- \n## Technological\n- \n## Environmental\n- \n## Legal\n- '
    },
    {
      id: 'bcg', name: 'BCG Matrix', icon: '📊',
      description: 'Classify products/portfolios as Stars, Cash Cows, Question Marks, or Dogs based on market share and growth.',
      when: 'When evaluating a product portfolio or business units for resource allocation.',
      what: 'Market growth rates, relative market share for each product/unit.',
      template: '## Stars (High Growth, High Share)\n- \n## Cash Cows (Low Growth, High Share)\n- \n## Question Marks (High Growth, Low Share)\n- \n## Dogs (Low Growth, Low Share)\n- '
    },
    {
      id: 'ansoff', name: 'Ansoff Matrix', icon: '📈',
      description: 'Evaluate growth strategies: Market Penetration, Market Development, Product Development, Diversification.',
      when: 'When deciding on growth direction and risk appetite.',
      what: 'Current market position, product portfolio, expansion options.',
      template: '## Market Penetration\n- Strategy: \n- Risk: Low\n## Market Development\n- Strategy: \n- Risk: Medium\n## Product Development\n- Strategy: \n- Risk: Medium\n## Diversification\n- Strategy: \n- Risk: High'
    },
    {
      id: 'journey', name: 'Customer Journey', icon: '🗺️',
      description: 'Map the customer experience from awareness to advocacy, identifying touchpoints and pain points.',
      when: 'When designing customer experience or identifying improvement opportunities.',
      what: 'Customer touchpoints, emotions, pain points, and opportunities at each stage.',
      template: '## Awareness\n- Touchpoints: \n- Emotion: \n## Consideration\n- Touchpoints: \n- Emotion: \n## Purchase\n- Touchpoints: \n- Emotion: \n## Retention\n- Touchpoints: \n- Emotion: \n## Advocacy\n- Touchpoints: \n- Emotion: '
    },
  ];
}

function renderFrameworks(caseId) {
  const frameworks = getFrameworkDefinitions();
  const cases = Store.get('cases') || [];
  let c = caseId ? cases.find(x => x.id === caseId) : (cases.find(x => x.status === 'in-progress') || cases[0]);
  const appliedFrameworks = c ? (c.frameworks || []) : [];

  let html = `
    <div class="mb-6">
      <h1>📊 Framework Library</h1>
      <p class="text-secondary text-sm">Business analysis frameworks for case competitions</p>
    </div>
    <div class="grid-2">
  `;

  frameworks.forEach(fw => {
    const isApplied = appliedFrameworks.includes(fw.id);
    html += `
      <div class="card" style="cursor:pointer" onclick="openFramework('${fw.id}')">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <span style="font-size:1.5rem">${fw.icon}</span>
            <h3>${fw.name}</h3>
          </div>
          ${isApplied ? '<span class="badge badge-done">✓ Applied</span>' : ''}
        </div>
        <p class="text-sm text-secondary mb-4">${escapeHtml(fw.description)}</p>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm">View Template →</button>
          ${c && !isApplied ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); applyFramework('${fw.id}', '${c.id}')">Use This Framework</button>` : ''}
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

function openFramework(fwId) {
  const fw = getFrameworkDefinitions().find(f => f.id === fwId);
  if (!fw) return;

  const body = `
    <div style="text-align:center;margin-bottom:16px">
      <span style="font-size:3rem">${fw.icon}</span>
      <h2 style="margin-top:8px">${fw.name}</h2>
    </div>

    <h4>What is it?</h4>
    <p class="text-sm mb-4">${escapeHtml(fw.description)}</p>

    <h4>When should I use it?</h4>
    <p class="text-sm mb-4">${escapeHtml(fw.when)}</p>

    <h4>What information do I need?</h4>
    <p class="text-sm mb-4">${escapeHtml(fw.what)}</p>

    <h4>Template</h4>
    <pre style="background:var(--bg-secondary);padding:16px;border-radius:var(--radius);font-family:var(--font-mono);font-size:0.85rem;white-space:pre-wrap;line-height:1.6">${escapeHtml(fw.template)}</pre>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
  `;
  openModal(fw.name, body, footer);
}

function applyFramework(fwId, caseId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    if (!c.frameworks) c.frameworks = [];
    if (!c.frameworks.includes(fwId)) {
      c.frameworks.push(fwId);
      Store.set('cases', cases);
      showToast('Framework applied to case!');
      App.navigate('frameworks');
    }
  }
}
