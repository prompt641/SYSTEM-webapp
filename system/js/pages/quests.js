/* =========================================================================
   SYSTEM — QUEST PAGE (+ shared quest / habit renderers)
   ========================================================================= */
window.SYS = window.SYS || {};
SYS.Pages = SYS.Pages || {};

(function () {
  const esc = s => SYS.UI.esc(s);
  const C = () => SYS.CONFIG;
  const Store = () => SYS.Store;
  const U = () => SYS.UI;

  /* ---------- shared: one quest card ---------- */
  SYS.renderQuestCard = function (q, rec, opts) {
    opts = opts || {};
    const r = rec.quests[q.id];
    const done = r.done;
    const editable = Store().canEdit(rec.day);
    const pct = q.mode === 'track'
      ? Store().workoutPct(rec)
      : Math.min(100, Math.round((r.progress / q.target) * 100));
    const typeTag = q.type === 'main'
      ? '<span class="tag main">MAIN</span>'
      : '<span class="tag daily">DAILY</span>';

    let body = '';
    if (q.mode === 'time') {
      body = `
        <div class="q-prog">
          <div class="bar"><div class="bar-fill ${pct >= 100 ? 'is-ok' : ''}" style="width:${pct}%"></div></div>
          <div class="pv">${r.progress} / ${q.target} ${q.unit}</div>
        </div>
        ${editable ? `
        <div class="q-actions">
          <button class="btn btn-sm" data-act="progress" data-id="${q.id}" data-delta="-15">−15</button>
          <button class="btn btn-sm" data-act="progress" data-id="${q.id}" data-delta="15">+15</button>
          <button class="btn btn-sm" data-act="progress" data-id="${q.id}" data-delta="30">+30</button>
          <span class="dim mono" style="font-size:.6rem;letter-spacing:.1em">MIN</span>
        </div>` : ''}`;
    } else {
      const list = q.exercises.map(e => {
        const v = rec.exercises[e.id] || 0;
        const ep = Math.min(100, Math.round((v / e.target) * 100));
        const full = v >= e.target;
        return `
          <div class="ex ${full ? 'done' : ''}">
            <div class="ex-top">
              <span class="ex-name">${esc(e.name)}</span>
              <span class="ex-val">${v} / ${e.target}${e.unit === 'sec' ? 's' : ''}</span>
            </div>
            <div class="bar bar-sm"><div class="bar-fill ${full ? 'is-ok' : ''}" style="width:${ep}%"></div></div>
            ${editable ? `
            <div class="ex-btns">
              <button class="btn btn-sm" data-act="ex" data-ex="${e.id}" data-delta="-${e.step}">−${e.step}</button>
              <button class="btn btn-sm" data-act="ex" data-ex="${e.id}" data-delta="${e.step}">+${e.step}</button>
              <button class="btn btn-sm" data-act="exset" data-ex="${e.id}">SET</button>
            </div>` : ''}
          </div>`;
      }).join('');
      body = `<div class="ex-list">${list}</div>`;
    }

    const tags = `${typeTag}
      <span class="tag">${q.mode === 'time' ? q.target + ' ' + q.unit : 'TRACK'}</span>
      ${done ? '<span class="tag done">✓ ' + U().fmtTime(r.at) + '</span>' : ''}
      ${opts.hideSub ? '' : `<span class="tag exp">+${q.exp} EXP</span>`}`;

    return `
      <article class="q-card ${done ? 'done' : ''}" data-qcard="${q.id}">
        <div class="q-head">
          <div class="q-check">${done ? '<svg class="ic"><use href="#i-check"/></svg>' : ''}</div>
          <div class="q-meta">
            <div class="q-title">${esc(q.title)}</div>
            <div class="q-sub">${esc(q.subtitle)}</div>
            <div class="q-tags">${tags}</div>
          </div>
          <div class="q-exp">+${q.exp}<br><span class="dim" style="font-size:.55rem">EXP</span></div>
        </div>
        <div class="q-body">${body}</div>
        <div class="q-actions">
          ${done
            ? (editable ? `<button class="btn btn-sm btn-ghost" data-act="undo" data-id="${q.id}">UNDO</button>` : `<span class="mono dim" style="font-size:.6rem">LOCKED RECORD</span>`)
            : (editable ? `<button class="btn btn-sm ${pct >= 100 ? 'btn-ok' : 'btn-primary'}" data-act="complete" data-id="${q.id}">[ COMPLETE ]</button>` : `<span class="mono dim" style="font-size:.6rem">DAY LOCKED</span>`)}
          ${q.type === 'main' ? '<span class="tag main">MAIN QUEST</span>' : '<span class="tag daily">DAILY QUEST</span>'}
        </div>
      </article>`;
  };

  /* ---------- shared: habit card ---------- */
  SYS.renderHabitCard = function (h, rec) {
    const r = rec.habits[h.id];
    const editable = Store().canEdit(rec.day);
    const isCounter = h.mode === 'counter';
    const pct = isCounter ? Math.min(100, Math.round((r.value / h.target) * 100)) : (r.done ? 100 : 0);
    return `
      <div class="habit ${r.done ? 'done' : ''}" data-hcard="${h.id}">
        <div class="habit-name">${esc(h.name)}</div>
        <div class="habit-val">
          ${isCounter ? `${r.value} <small>/ ${h.target}${h.unit ? ' ' + h.unit : ''}</small>`
                      : (r.done ? '✓ Complete' : '□ Complete')}
        </div>
        ${isCounter ? `<div class="bar bar-sm" style="margin-bottom:8px"><div class="bar-fill ${r.done ? 'is-ok' : ''}" style="width:${pct}%"></div></div>` : ''}
        ${editable ? (isCounter
          ? `<div class="habit-ctrl">
               <button class="btn btn-sm" data-act="habit" data-id="${h.id}" data-delta="-1" aria-label="decrease">−</button>
               <button class="btn btn-sm btn-primary" data-act="habit" data-id="${h.id}" data-delta="1">+</button>
             </div>`
          : `<button class="habit-check" data-act="habit" data-id="${h.id}" data-delta="1">${r.done ? '✓ COMPLETED' : 'MARK COMPLETE'}</button>`)
        : `<div class="mono dim center" style="font-size:.58rem">LOCKED</div>`}
      </div>`;
  };

  SYS.renderHabits = function (rec) {
    return `<div class="habit-grid">${C().habits.map(h => SYS.renderHabitCard(h, rec)).join('')}</div>`;
  };

  /* ---------- tabs state ---------- */
  const UI = { tab: 'ALL' };
  SYS.questTab = () => UI.tab;
  SYS.setQuestTab = t => { UI.tab = t; };

  /* ---------- page ---------- */
  SYS.Pages.quests = function () {
    const S = Store();
    const rec = S.activeRec();
    const viewDay = S.getViewDay();
    const d = S.derive();
    const banner = viewDay && viewDay !== d.day ? `
      <div class="viewbar">
        <span class="vt">⚠ EDITING DAY ${U().pad2(viewDay)} — HISTORICAL RECORD</span>
        <button class="btn btn-sm btn-ghost" data-act="backtoday">RETURN TO TODAY</button>
      </div>` : '';
    const tabs = ['ALL', 'MAIN', 'DAILY', 'HABIT', 'COMPLETED'];
    const tabHtml = tabs.map(t =>
      `<button class="tab ${UI.tab === t ? 'active' : ''}" data-act="tab" data-tab="${t}">${t}</button>`).join('');

    let quests = C().quests.slice();
    if (UI.tab === 'MAIN') quests = quests.filter(q => q.type === 'main');
    if (UI.tab === 'DAILY') quests = quests.filter(q => q.type === 'daily');
    if (UI.tab === 'COMPLETED') quests = quests.filter(q => rec.quests[q.id].done);

    let html = '';
    if (UI.tab !== 'HABIT') {
      const main = quests.filter(q => q.type === 'main');
      const daily = quests.filter(q => q.type === 'daily');
      const block = (title, list, note) => list.length ? `
        <div class="sec-title">${title} <span class="st-sub">${note || ''}</span></div>
        ${list.map(q => SYS.renderQuestCard(q, rec)).join('')}` : '';
      html += block('MAIN QUEST', main, 'PRIORITY OBJECTIVES');
      html += block('DAILY QUEST', daily, 'REPEATABLE');
      if (!quests.length) html += `<div class="empty">NO QUEST IN THIS TAB</div>`;
    }
    if (UI.tab === 'HABIT' || UI.tab === 'ALL') {
      html += `<div class="sec-title">DAILY HABIT <span class="st-sub">NO TIME LIMIT</span></div>`;
      html += SYS.renderHabits(rec);
    }

    /* history of completed quests (all days) */
    let history = '';
    if (UI.tab === 'COMPLETED') {
      const rows = [];
      Object.keys(S.get().days).sort((a, b) => b - a).forEach(k => {
        const d = S.get().days[k];
        C().quests.forEach(q => {
          const r = d.quests[q.id];
          if (r && r.done) rows.push({ day: k, title: q.title, at: r.at, exp: r.exp });
        });
      });
      history = `
        <div class="sec-title">QUEST HISTORY <span class="st-sub">${rows.length} RECORDS</span></div>
        ${rows.length ? `<div class="panel mb0">${rows.slice(0, 40).map(x => `
          <div class="modal-list" style="margin:0">
            <li><span>DAY ${U().pad2(x.day)} · ${esc(x.title)}</span><b>${U().fmtTime(x.at)} · +${x.exp} EXP</b></li>
          </div>`).join('')}</div>` : `<div class="empty">NO COMPLETED QUEST YET</div>`}`;
    }

    return `
      ${banner}
      <div class="tabs">${tabHtml}</div>
      ${html}
      ${history}`;
  };

  /* delegated actions for quest interactions */
  SYS.handleQuestAction = function (act, el) {
    const S = Store();
    const id = el.dataset.id;
    switch (act) {
      case 'tab': SYS.setQuestTab(el.dataset.tab); SYS.App.render(); SYS.Sound.play('click'); return true;
      case 'complete': SYS.App.runAction(() => S.completeQuest(id)); return true;
      case 'undo': SYS.App.runAction(() => S.uncompleteQuest(id)); return true;
      case 'progress': SYS.App.runAction(() => S.addProgress(id, Number(el.dataset.delta))); SYS.Sound.play('click'); return true;
      case 'ex': SYS.App.runAction(() => S.addExercise(el.dataset.ex, Number(el.dataset.delta))); SYS.Sound.play('click'); return true;
      case 'exset': {
        const ex = el.dataset.ex;
        const list = C().questById('workout').exercises;
        const def = list.find(e => e.id === ex);
        const cur = S.activeRec().exercises[ex] || 0;
        SYS.UI.openModal(`
          <div class="modal-tag is-info">[ SET EXERCISE ]</div>
          <div class="modal-body">
            <h4>${esc(def.name)}</h4>
            <p class="dim" style="margin-top:0">Target: ${def.target} ${def.unit === 'sec' ? 'seconds' : 'reps'}</p>
            <input class="sys-input" id="exInput" type="number" min="0" max="${def.target}" value="${cur}" inputmode="numeric">
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" data-modal-action="cancel">CANCEL</button>
            <button class="btn btn-primary" data-modal-action="save">SAVE</button>
          </div>`, action => {
          if (action === 'save') {
            const v = Number(document.getElementById('exInput').value);
            if (!isNaN(v)) { SYS.App.runAction(() => S.setExercise(ex, v)); }
          }
        });
        return true;
      }
      case 'habit': SYS.App.runAction(() => S.bumpHabit(id, Number(el.dataset.delta))); return true;
    }
    return false;
  };
})();
