// ===== Financial Calculator =====

function renderFinance(caseId) {
  const cases = Store.get('cases') || [];
  let c = caseId ? cases.find(x => x.id === caseId) : (cases.find(x => x.status === 'in-progress') || cases[0]);

  if (!c) {
    return '<div class="empty-state"><div class="empty-icon">💰</div><h4>No case available</h4></div>';
  }

  // Get stored finance data or defaults
  const finData = c.financeData || {
    customers: 10000,
    price: 29.99,
    fixedCost: 50000,
    variableCost: 12,
    marketingCost: 10000,
    investment: 100000,
    months: 12,
  };

  const revenue = finData.customers * finData.price;
  const totalVariableCost = finData.customers * finData.variableCost;
  const totalCost = finData.fixedCost + totalVariableCost + finData.marketingCost;
  const profit = revenue - totalCost;
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
  const roi = finData.investment > 0 ? (((profit - finData.investment) / finData.investment) * 100).toFixed(1) : 0;
  const breakEven = finData.price > finData.variableCost ? Math.ceil(finData.fixedCost / (finData.price - finData.variableCost)) : 0;

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1>💰 Financial Calculator</h1>
        <p class="text-secondary text-sm">${escapeHtml(c.name)} • Quick financial modeling</p>
      </div>
      <div class="auto-save-indicator saved" id="finAutoSave"><span>Saved ✓</span></div>
    </div>

    <div class="grid-2" style="gap:24px">
      <!-- Inputs -->
      <div>
        <div class="card">
          <h3 class="mb-4">📊 Inputs</h3>
          <div class="grid-2" style="gap:14px">
            <div class="form-group">
              <label>Number of Customers</label>
              <input class="form-input" id="finCustomers" type="number" value="${finData.customers}" onchange="updateFinance('${c.id}')">
            </div>
            <div class="form-group">
              <label>Price per Unit ($)</label>
              <input class="form-input" id="finPrice" type="number" step="0.01" value="${finData.price}" onchange="updateFinance('${c.id}')">
            </div>
            <div class="form-group">
              <label>Fixed Cost ($/month)</label>
              <input class="form-input" id="finFixedCost" type="number" value="${finData.fixedCost}" onchange="updateFinance('${c.id}')">
            </div>
            <div class="form-group">
              <label>Variable Cost per Unit ($)</label>
              <input class="form-input" id="finVariableCost" type="number" step="0.01" value="${finData.variableCost}" onchange="updateFinance('${c.id}')">
            </div>
            <div class="form-group">
              <label>Marketing Cost ($/month)</label>
              <input class="form-input" id="finMarketingCost" type="number" value="${finData.marketingCost}" onchange="updateFinance('${c.id}')">
            </div>
            <div class="form-group">
              <label>Initial Investment ($)</label>
              <input class="form-input" id="finInvestment" type="number" value="${finData.investment}" onchange="updateFinance('${c.id}')">
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div>
        <div class="card">
          <h3 class="mb-4">📈 Results</h3>
          <div class="grid-2" style="gap:14px">
            <div class="fin-result">
              <div class="fin-result-label">Revenue</div>
              <div class="fin-result-value" style="color:var(--accent)">$${revenue.toLocaleString()}</div>
            </div>
            <div class="fin-result">
              <div class="fin-result-label">Total Cost</div>
              <div class="fin-result-value">$${totalCost.toLocaleString()}</div>
            </div>
            <div class="fin-result ${profit >= 0 ? 'positive' : 'negative'}">
              <div class="fin-result-label">Profit</div>
              <div class="fin-result-value">$${profit.toLocaleString()}</div>
            </div>
            <div class="fin-result">
              <div class="fin-result-label">Profit Margin</div>
              <div class="fin-result-value" style="color:${parseFloat(profitMargin) >= 0 ? 'var(--green)' : 'var(--red)'}">${profitMargin}%</div>
            </div>
            <div class="fin-result">
              <div class="fin-result-label">ROI</div>
              <div class="fin-result-value" style="color:${parseFloat(roi) >= 0 ? 'var(--green)' : 'var(--red)'}">${roi}%</div>
            </div>
            <div class="fin-result">
              <div class="fin-result-label">Break-Even Point</div>
              <div class="fin-result-value">${breakEven.toLocaleString()} units</div>
            </div>
          </div>
        </div>

        <!-- Revenue vs Cost Visual -->
        <div class="card mt-4">
          <h3 class="mb-4">📊 Revenue vs Cost</h3>
          <div style="display:flex;align-items:flex-end;gap:12px;height:200px;padding:0 20px">
            <div style="flex:1;display:flex;flex-direction:column;align-items:center">
              <div style="width:100%;background:var(--accent);border-radius:4px 4px 0 0;height:${Math.min((revenue / Math.max(revenue, totalCost)) * 160, 160)}px;transition:height 0.3s"></div>
              <div class="text-xs text-secondary mt-2">Revenue</div>
              <div class="text-xs font-bold">$${(revenue/1000).toFixed(0)}k</div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center">
              <div style="width:100%;background:var(--red);border-radius:4px 4px 0 0;height:${Math.min((totalCost / Math.max(revenue, totalCost)) * 160, 160)}px;transition:height 0.3s"></div>
              <div class="text-xs text-secondary mt-2">Total Cost</div>
              <div class="text-xs font-bold">$${(totalCost/1000).toFixed(0)}k</div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center">
              <div style="width:100%;background:${profit >= 0 ? 'var(--green)' : 'var(--red)'};border-radius:4px 4px 0 0;height:${Math.abs(Math.min((profit / Math.max(revenue, totalCost)) * 160, 160))}px;transition:height 0.3s"></div>
              <div class="text-xs text-secondary mt-2">Profit</div>
              <div class="text-xs font-bold">$${(profit/1000).toFixed(1)}k</div>
            </div>
          </div>
        </div>

        <!-- Cost Breakdown -->
        <div class="card mt-4">
          <h3 class="mb-4">💡 Cost Breakdown</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div class="flex items-center justify-between">
              <span class="text-sm">Fixed Costs</span>
              <span class="text-sm font-semibold">$${finData.fixedCost.toLocaleString()} (${totalCost > 0 ? ((finData.fixedCost/totalCost)*100).toFixed(0) : 0}%)</span>
            </div>
            <div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:${totalCost > 0 ? (finData.fixedCost/totalCost)*100 : 0}%;background:var(--red)"></div></div>

            <div class="flex items-center justify-between">
              <span class="text-sm">Variable Costs</span>
              <span class="text-sm font-semibold">$${totalVariableCost.toLocaleString()} (${totalCost > 0 ? ((totalVariableCost/totalCost)*100).toFixed(0) : 0}%)</span>
            </div>
            <div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:${totalCost > 0 ? (totalVariableCost/totalCost)*100 : 0}%;background:var(--yellow)"></div></div>

            <div class="flex items-center justify-between">
              <span class="text-sm">Marketing</span>
              <span class="text-sm font-semibold">$${finData.marketingCost.toLocaleString()} (${totalCost > 0 ? ((finData.marketingCost/totalCost)*100).toFixed(0) : 0}%)</span>
            </div>
            <div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:${totalCost > 0 ? (finData.marketingCost/totalCost)*100 : 0}%;background:var(--accent)"></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  return html;
}

function updateFinance(caseId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (!c) return;

  c.financeData = {
    customers: parseFloat(document.getElementById('finCustomers').value) || 0,
    price: parseFloat(document.getElementById('finPrice').value) || 0,
    fixedCost: parseFloat(document.getElementById('finFixedCost').value) || 0,
    variableCost: parseFloat(document.getElementById('finVariableCost').value) || 0,
    marketingCost: parseFloat(document.getElementById('finMarketingCost').value) || 0,
    investment: parseFloat(document.getElementById('finInvestment').value) || 0,
    months: 12,
  };

  Store.set('cases', cases);
  App.navigate('finance', caseId);
  flashSave();
}
