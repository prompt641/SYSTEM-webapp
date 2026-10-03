// ===== Problem Tree Page =====

function renderProblemTree(caseId) {
  const cases = Store.get('cases') || [];
  let c;
  if (caseId) {
    c = cases.find(x => x.id === caseId);
  } else {
    c = cases.find(x => x.status === 'in-progress') || cases[0];
  }

  if (!c) {
    return '<div class="empty-state"><div class="empty-icon">🧠</div><h4>No case available</h4></div>';
  }

  const tree = c.problemTree || { root: '', branches: [] };

  let html = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="breadcrumb">
          <span onclick="App.navigate('case-workspace', '${c.id}')">${escapeHtml(c.name)}</span>
          <span class="separator">›</span>
          <span class="current">Problem Tree</span>
        </div>
        <h1 style="margin-top:4px">🧠 Problem Tree</h1>
      </div>
      <button class="btn btn-primary" onclick="addBranch('${c.id}')">+ Add Branch</button>
    </div>

    <!-- Root Problem -->
    <div class="card mb-6">
      <label class="text-sm font-semibold mb-2" style="display:block">🔴 Main Problem</label>
      <input class="form-input" value="${escapeHtml(tree.root)}" placeholder="Define the main problem..." onchange="updateProblemRoot('${c.id}', this.value); flashSave()">
    </div>

    <!-- Tree Visualization -->
    <div class="problem-tree-container" id="problemTreeContainer" style="padding:40px;min-height:500px">
      <svg id="treeSvg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1"></svg>
      <div id="treeNodes" style="position:relative;z-index:2">
        ${renderTreeNodes(c, tree)}
      </div>
    </div>
  `;

  return html;
}

function renderTreeNodes(c, tree) {
  if (!tree.branches || tree.branches.length === 0) {
    return `
      <div style="text-align:center;padding:60px;color:var(--text-secondary)">
        <p class="mb-4">No branches yet. Start by adding cause categories.</p>
        <button class="btn btn-primary" onclick="addBranch('${c.id}')">+ Add Branch</button>
      </div>
    `;
  }

  // Layout: root at top center, branches spread below
  const containerWidth = 900;
  const rootX = containerWidth / 2 - 100;
  const rootY = 20;
  const branchWidth = 180;
  const branchGap = 20;
  const totalWidth = tree.branches.length * (branchWidth + branchGap) - branchGap;
  const startX = (containerWidth - totalWidth) / 2;

  let html = '';

  // Root node
  html += `
    <div class="problem-tree-node root" style="left:${rootX}px;top:${rootY}px;width:200px;text-align:center">
      <div style="font-size:0.75rem;opacity:0.8;margin-bottom:4px">🔴 PROBLEM</div>
      <div>${escapeHtml(tree.root || 'Click to define problem')}</div>
    </div>
  `;

  // Branch nodes
  tree.branches.forEach((branch, bi) => {
    const bx = startX + bi * (branchWidth + branchGap);
    const by = 140;

    // Branch node
    html += `
      <div class="problem-tree-node" style="left:${bx}px;top:${by}px;width:${branchWidth}px;background:var(--accent-light);border-color:var(--accent)">
        <div class="node-actions">
          <button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:0.7rem" onclick="addSubCause('${c.id}','${branch.id}')">+</button>
          <button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:0.7rem" onclick="editBranchName('${c.id}','${branch.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:0.7rem" onclick="deleteBranch('${c.id}','${branch.id}')">✕</button>
        </div>
        <div style="text-align:center;font-weight:600;font-size:0.85rem">${escapeHtml(branch.name)}</div>
      </div>
    `;

    // Sub-cause nodes
    (branch.children || []).forEach((child, ci) => {
      const cx = bx + (branchWidth - 150) / 2;
      const cy = by + 90 + ci * 70;

      html += `
        <div class="problem-tree-node" style="left:${cx}px;top:${cy}px;width:150px;font-size:0.8rem">
          <div class="node-actions">
            <button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:0.7rem" onclick="editSubCause('${c.id}','${branch.id}','${child.id}')">✏️</button>
            <button class="btn btn-ghost btn-sm" style="padding:2px 6px;font-size:0.7rem" onclick="deleteSubCause('${c.id}','${branch.id}','${child.id}')">✕</button>
          </div>
          ${escapeHtml(child.name)}
        </div>
      `;
    });
  });

  return html;
}

function addBranch(caseId) {
  const name = prompt('Enter branch name (e.g., Customer, Product, Marketing):');
  if (!name || !name.trim()) return;

  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    if (!c.problemTree.branches) c.problemTree.branches = [];
    c.problemTree.branches.push({
      id: generateId(),
      name: name.trim(),
      children: []
    });
    Store.set('cases', cases);
    App.navigate('problem-tree', caseId);
    flashSave();
  }
}

function addSubCause(caseId, branchId) {
  const name = prompt('Enter sub-cause:');
  if (!name || !name.trim()) return;

  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  const branch = c?.problemTree.branches.find(b => b.id === branchId);
  if (branch) {
    if (!branch.children) branch.children = [];
    branch.children.push({ id: generateId(), name: name.trim() });
    Store.set('cases', cases);
    App.navigate('problem-tree', caseId);
    flashSave();
  }
}

function editBranchName(caseId, branchId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  const branch = c?.problemTree.branches.find(b => b.id === branchId);
  if (branch) {
    const name = prompt('Edit branch name:', branch.name);
    if (name && name.trim()) {
      branch.name = name.trim();
      Store.set('cases', cases);
      App.navigate('problem-tree', caseId);
      flashSave();
    }
  }
}

function deleteBranch(caseId, branchId) {
  if (!confirm('Delete this branch and all its sub-causes?')) return;
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  if (c) {
    c.problemTree.branches = c.problemTree.branches.filter(b => b.id !== branchId);
    Store.set('cases', cases);
    App.navigate('problem-tree', caseId);
    flashSave();
  }
}

function editSubCause(caseId, branchId, childId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  const branch = c?.problemTree.branches.find(b => b.id === branchId);
  const child = branch?.children.find(ch => ch.id === childId);
  if (child) {
    const name = prompt('Edit sub-cause:', child.name);
    if (name && name.trim()) {
      child.name = name.trim();
      Store.set('cases', cases);
      App.navigate('problem-tree', caseId);
      flashSave();
    }
  }
}

function deleteSubCause(caseId, branchId, childId) {
  const cases = Store.get('cases') || [];
  const c = cases.find(x => x.id === caseId);
  const branch = c?.problemTree.branches.find(b => b.id === branchId);
  if (branch) {
    branch.children = branch.children.filter(ch => ch.id !== childId);
    Store.set('cases', cases);
    App.navigate('problem-tree', caseId);
    flashSave();
  }
}
