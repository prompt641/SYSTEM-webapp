/* =========================================================================
   SYSTEM — JOURNEY PAGE (37 days) + day detail modal
   ========================================================================= */
window.SYS = window.SYS || {};
SYS.Pages = SYS.Pages || {};

(function () {
  const esc = s => SYS.UI.esc(s);
  const C = () => SYS.CONFIG;
  const Store = () => SYS.Store;
  const U = () => SYS.UI;

  SYS.Pages.journey = function () {
    const S = Store();
    const st = S.get();
    const d = S.derive();
    const total = C().journeyDays;

    const summary = `
      <div class="grid grid-4" style="margin-bottom:16px">
        <div class="mini"><span class="k">CURRENT DAY</span><span class="v">${U().pad2(d.day)} <small>/ ${total}</small></span></div>
        <div class="mini"><span class="k">DAYS COMPLETED</span><span class="v">${d.daysCompleted}</span></div>
        <div class="mini"><span class="k">DAYS REMAINING</span><span class="v">${Math.max(0, total - d.day)}</span></div>
        <div class="mini"><span class="k">TOTAL EXP</span><span class="v">${d.totalExp}</span></div>
      </div>`;

    const cells = [];
    for (let i = 1; i <= total; i++) {
      const rec = st.days[i];
      const c = rec ? S.dayCompletion(rec) : { pct: 0, done: 0, total: 0 };
      const isCurrent = i === d.day;
      const isPast = i < d.day;
      const isFuture = i > d.day;
      let cls = '', sym = '', sub = `${c.pct}%`;
      if (isCurrent) { cls = 'current'; sym = '◈'; sub = `${c.pct}% NOW`; }
      else if (c.pct >= 60) { cls = 'done'; sym = '✓'; }
      else if (rec && c.pct > 0) { cls = 'partial'; sym = '◐'; }
      else if (isPast) { cls = 'partial'; sym = '○'; sub = 'EMPTY'; }
      else if (isFuture) { cls = 'locked'; sym = i === total ? '🔒' : '○'; sub = 'LOCKED'; }
      if (rec && rec.unlocked && !isCurrent) cls += ' unlocked-edit';
      cells.push(`
        <button class="jday ${cls}" data-act="day" data-day="${i}" title="Day ${i}">
          <span class="js">${sym}</span>
          <span class="jn">D${U().pad2(i)}</span>
          <span class="jp">${sub}</span>
        </button>`);
    }

    return `
      ${summary}
      <div class="sec-title">37-DAY TIMELINE <span class="st-sub">TAP A DAY FOR DETAILS</span></div>
      <div class="jr-grid">${cells.join('')}</div>
      <div class="row mt">
        <span class="tag done">✓ DONE ≥60%</span>
        <span class="tag" style="color:var(--warn)">◐ PARTIAL</span>
        <span class="tag">○ PENDING</span>
        <span class="tag">🔒 FUTURE</span>
        <span class="tag" style="color:var(--warn);border-style:dashed">UNLOCKED FOR EDIT</span>
      </div>`;
  };

  /* ---------- day detail modal ---------- */
  SYS.openDayModal = function (dayNum) {
    const S = Store();
    const st = S.get();
    const n = Number(dayNum);
    const rec = st.days[n];
    const current = S.derive().day;
    const isFuture = n > current;

    if (!rec) {
      if (isFuture) {
        SYS.UI.notify({ kind: 'warn', title: 'DAY ' + U().pad2(n) + ' NOT AVAILABLE', sub: 'This day has not started yet.' });
        SYS.Sound.play('error');
      } else {
        SYS.UI.notify({ kind: 'warn', title: 'NO RECORD', sub: 'Nothing was tracked on this day.' });
        SYS.Sound.play('error');
      }
      return;
    }

    const c = S.dayCompletion(rec);
    const editable = S.canEdit(n);
    const streakAt = S.streakUpTo(n);

    const questRows = C().quests.map(q => {
      const r = rec.quests[q.id];
      return `<li><span>${r.done ? '✓' : '□'} ${esc(q.title)} <span class="dim">(${q.mode === 'time' ? r.progress + '/' + q.target + ' MIN' : S.workoutPct(rec) + '%'})</span></span>
        <b>${r.done ? U().fmtTime(r.at) + ' · +' + (r.exp || 0) : '—'}</b></li>`;
    }).join('');

    const habitRows = C().habits.map(h => {
      const r = rec.habits[h.id];
      return `<li><span>${r.done ? '✓' : '□'} ${esc(h.name)} ${h.mode === 'counter' ? `<span class="dim">${r.value}/${h.target}</span>` : ''}</span>
        <b>${r.done ? '+' + (r.exp || 0) + ' EXP' : '—'}</b></li>`;
    }).join('');

    SYS.UI.openModal(`
      <div class="modal-tag is-info">[ DAY ${U().pad2(n)} RECORD ]</div>
      <div class="modal-body">
        <h4>${rec.date} ${editable ? '' : '· 🔒 LOCKED'}</h4>
        <div class="modal-kv"><span>COMPLETION</span><b>${c.pct}% (${c.done}/${c.total})</b></div>
        <div class="modal-kv"><span>EXP EARNED</span><b>+${rec.expEarned || 0} EXP</b></div>
        <div class="modal-kv"><span>STREAK UP TO THIS DAY</span><b>${streakAt} days</b></div>
        <div class="modal-kv"><span>14:00 RULE</span><b>${rec.discipline && rec.discipline.awarded && !rec.discipline.missed ? 'MET · BONUS +' + C().discipline.bonusExp : (rec.discipline && rec.discipline.missed ? 'MISSED' : '—')}</b></div>
        <div style="margin-top:14px" class="sec-title">QUESTS</div>
        <ul class="modal-list">${questRows}</ul>
        <div style="margin-top:14px" class="sec-title">HABITS</div>
        <ul class="modal-list">${habitRows}</ul>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-modal-action="close">CLOSE</button>
        ${!isFuture ? (editable
          ? `<button class="btn btn-primary" data-modal-action="edit">EDIT THIS DAY</button>
             ${rec.unlocked ? `<button class="btn btn-ghost" data-modal-action="lock">LOCK</button>` : ''}`
          : `<button class="btn btn-primary" data-modal-action="unlock">UNLOCK</button>`) : ''}
      </div>`, action => {
      if (action === 'edit') {
        S.viewDay(n);
        SYS.Sound.play('click');
        SYS.App.go('quests');
        SYS.App.render();
      } else if (action === 'lock') {
        S.lockDay(n);
        SYS.Sound.play('click');
        SYS.UI.notify({ title: 'DAY ' + U().pad2(n) + ' LOCKED', sub: 'Historical record is protected again.' });
        SYS.App.render();
      } else if (action === 'unlock') {
        SYS.UI.confirmDialog({
          tag: 'UNLOCK RECORD',
          body: `<p>Unlock <b class="accent">DAY ${U().pad2(n)}</b> for editing?</p>
                 <p class="dim" style="font-size:.84rem">Historical data can be changed. The day will stay unlocked until you lock it again.</p>`,
          confirm: 'UNLOCK', danger: false
        }).then(ok => {
          if (!ok) return;
          S.unlockDay(n);
          SYS.Sound.play('notify');
          SYS.UI.notify({ title: 'DAY ' + U().pad2(n) + ' UNLOCKED', sub: 'Historical record is now editable.' });
          SYS.App.render();
        });
        return 'keep';   // the confirm dialog replaced this modal — let it stay open
      }
    });
  };
})();
