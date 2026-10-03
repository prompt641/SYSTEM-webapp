/* =========================================================================
   SYSTEM — STATS PAGE
   ========================================================================= */
window.SYS = window.SYS || {};
SYS.Pages = SYS.Pages || {};

(function () {
  const esc = s => SYS.UI.esc(s);
  const C = () => SYS.CONFIG;
  const Store = () => SYS.Store;
  const U = () => SYS.UI;

  /* attribute icons (original line icons) */
  function statIcon(kind) {
    const paths = {
      power:   '<path d="M13 2.5 5 13.5h5.5L10 21.5l8-11H12.5z"/>',
      brain:   '<path d="M9 4.5A3.2 3.2 0 0 0 5.8 7.7 3 3 0 0 0 4 10.4a3 3 0 0 0 1.6 2.7A3 3 0 0 0 7 18.4a3 3 0 0 0 5 .6V5.6A3 3 0 0 0 9 4.5zM15 4.5a3.2 3.2 0 0 1 3.2 3.2A3 3 0 0 1 20 10.4a3 3 0 0 1-1.6 2.7 3 3 0 0 1-1.4 5.3 3 3 0 0 1-5 .6"/>',
      shield:  '<path d="M12 3 19.5 6v6c0 4-3.2 7-7.5 8.4C7.7 19 4.5 16 4.5 12V6z"/>',
      chip:    '<rect x="7" y="7" width="10" height="10" rx="1.6"/><path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5"/>',
      wave:    '<path d="M3 12h2.5M7.5 7.5v9M11.5 4.5v15M15.5 8.5v7M19.5 11h1.5"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px">${paths[kind] || paths.shield}</svg>`;
  }

  SYS.Pages.stats = function () {
    const S = Store();
    const d = S.derive();

    const summary = `
      <div class="grid grid-3" style="margin-bottom:16px">
        <div class="mini"><span class="k">LEVEL</span><span class="v">${U().pad2(d.level)}</span></div>
        <div class="mini"><span class="k">EXP</span><span class="v">${d.totalExp}<small> total</small></span></div>
        <div class="mini"><span class="k">STREAK</span><span class="v">${d.streak}<small> days</small></span></div>
        <div class="mini"><span class="k">TOTAL QUEST</span><span class="v">${d.totalQuests}</span></div>
        <div class="mini"><span class="k">COMPLETION RATE</span><span class="v">${d.completionRate}<small>%</small></span></div>
        <div class="mini"><span class="k">ACHIEVEMENTS</span><span class="v">${d.achievementCount}<small>/${d.achievementTotal}</small></span></div>
      </div>`;

    const attrs = Object.keys(C().stats).map(key => {
      const def = C().stats[key];
      const val = d.stats[key] || 0;
      const pct = Math.min(100, val);
      return `
        <div class="stat-row">
          <div class="stat-top">
            <span class="stat-name">${def.label} <span class="stat-hint">· ${def.hint}</span></span>
            <span class="stat-num">${val}</span>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div><div class="bar-ticks"></div></div>
        </div>`;
    }).join('');

    const attrPanel = `
      <section class="panel">
        <div class="sec-title">PLAYER STATS <span class="st-sub">GROW BY DOING</span></div>
        ${attrs}
        <div class="mono dim" style="font-size:.62rem;line-height:1.7;margin-top:6px">
          WORKOUT → STRENGTH · MATH/IELTS → INTELLIGENCE · CODING → TECH<br>
          IELTS/SINGING → ENGLISH · CONSISTENT DAYS → DISCIPLINE
        </div>
      </section>`;

    /* last 7 days completion chart */
    const days = [];
    const st = S.get();
    for (let i = Math.max(1, d.day - 6); i <= d.day; i++) {
      const rec = st.days[i];
      days.push({ n: i, pct: rec ? S.dayCompletion(rec).pct : 0 });
    }
    const chart = `
      <section class="panel">
        <div class="sec-title">COMPLETION · LAST ${days.length} DAYS</div>
        <div style="display:flex;align-items:flex-end;gap:8px;height:130px">
          ${days.map(x => `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">
              <span class="mono" style="font-size:.58rem;color:var(--accent-2)">${x.pct}%</span>
              <div style="width:100%;height:${Math.max(4, x.pct)}%;border-radius:6px 6px 3px 3px;
                background:linear-gradient(180deg,var(--accent-2),var(--accent));
                box-shadow:0 0 14px var(--glow);transition:height .6s cubic-bezier(.22,.9,.3,1)"></div>
              <span class="mono dim" style="font-size:.56rem">D${U().pad2(x.n)}</span>
            </div>`).join('')}
        </div>
      </section>`;

    const ledger = `
      <section class="panel">
        <div class="sec-title">SYSTEM LEDGER</div>
        <div class="modal-kv"><span>TOTAL EXP EARNED (HISTORY)</span><b>${d.totalExpAll}</b></div>
        <div class="modal-kv"><span>STUDY MINUTES</span><b>${d.studyMinutes} min (${Math.floor(d.studyMinutes / 60)}h)</b></div>
        <div class="modal-kv"><span>WORKOUT SESSIONS</span><b>${d.workouts}</b></div>
        <div class="modal-kv"><span>PERFECT DAYS (100%)</span><b>${d.perfectDays}</b></div>
        <div class="modal-kv"><span>DISCIPLINE DAYS (BEFORE 14:00)</span><b>${d.earlyDays}</b></div>
        <div class="modal-kv"><span>ALL-HABIT DAYS</span><b>${d.perfectHabitDays}</b></div>
        <div class="modal-kv mb0"><span>JOURNEY START</span><b>${S.get().journey.startDate}</b></div>
      </section>`;

    return summary + attrPanel + chart + ledger;
  };
})();
