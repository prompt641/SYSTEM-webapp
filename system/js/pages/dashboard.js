/* =========================================================================
   SYSTEM — DASHBOARD PAGE
   ========================================================================= */
window.SYS = window.SYS || {};
SYS.Pages = SYS.Pages || {};

(function () {
  const esc = s => SYS.UI.esc(s);
  const C = () => SYS.CONFIG;
  const Store = () => SYS.Store;
  const U = () => SYS.UI;

  function scheduleNow() {
    const d = new Date();
    const mins = d.getHours() * 60 + d.getMinutes();
    const toMins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let current = -1, free = false;
    C().schedule.forEach((s, i) => {
      const a = toMins(s.from), b = toMins(s.to);
      if (s.kind === 'free' && mins >= a) free = true;
      if (mins >= a && (s.to === '23:59' ? mins <= b : mins < b)) current = i;
    });
    return { current, free };
  }

  SYS.Pages.dashboard = function () {
    const S = Store();
    const d = S.derive();
    const rec = S.activeRec();
    const now = scheduleNow();
    const viewDay = S.getViewDay();

    /* ---------- view-day banner ---------- */
    const banner = viewDay && viewDay !== d.day ? `
      <div class="viewbar">
        <span class="vt">⚠ EDITING DAY ${U().pad2(viewDay)} — HISTORICAL RECORD</span>
        <button class="btn btn-sm btn-ghost" data-act="backtoday">RETURN TO TODAY</button>
      </div>` : '';

    /* ---------- notices ---------- */
    let notices = '';
    if (now.free) {
      notices += `
        <div class="notice free">
          <svg class="ic"><use href="#i-bolt"/></svg>
          <div><div class="notice-t">[ FREE TIME ACTIVE ]</div>
          <div class="notice-d">15:30+ — ไม่ต้องนับเป็น Quest พักผ่อน เล่นเกม ดูหนัง หรือทำสิ่งที่อยากทำ</div></div>
        </div>`;
    }
    if (d.discipline.missed) {
      notices += `
        <div class="notice">
          <svg class="ic"><use href="#i-clock"/></svg>
          <div><div class="notice-t">SYSTEM NOTICE</div>
          <div class="notice-d">Daily Work was not completed before 14:00. พรุ่งนี้ลองใหม่ — ไม่มีบทลงโทษ</div></div>
        </div>`;
    } else if (!d.discipline.awarded && !d.discipline.missed) {
      notices += `
        <div class="notice info">
          <svg class="ic"><use href="#i-shield"/></svg>
          <div><div class="notice-t">14:00 RULE</div>
          <div class="notice-d">COMPLETE MAIN WORK BEFORE 14:00 → DISCIPLINE BONUS +${C().discipline.bonusExp} EXP</div></div>
        </div>`;
    }
    if (d.discipline.awarded && !d.discipline.missed) {
      notices += `
        <div class="notice free">
          <svg class="ic"><use href="#i-check"/></svg>
          <div><div class="notice-t">DISCIPLINE BONUS SECURED</div>
          <div class="notice-d">งานหลักเสร็จก่อน 14:00 — +${C().discipline.bonusExp} EXP เข้าบัญชีแล้ว</div></div>
        </div>`;
    }

    /* ---------- hero ---------- */
    const hero = `
      <section class="panel hero">
        <div class="hero-top">
          <div>
            <div class="eyebrow">[ SYSTEM ONLINE ]</div>
            <h1 class="hero-greet">${U().greeting()}, <span class="nm">${esc(d.name || 'PLAYER')}</span></h1>
            <div class="hero-sub">DAY ${U().pad2(d.day)} / ${d.totalDays} · ${d.todayKey}</div>
          </div>
          <div class="hero-stats">
            <div class="hstat"><span class="k">STREAK</span><span class="v">🔥 ${d.streak}<small> D</small></span></div>
            <div class="hstat"><span class="k">TOTAL EXP</span><span class="v">${d.totalExp}</span></div>
            <div class="hstat"><span class="k">QUESTS</span><span class="v">${d.totalQuests}</span></div>
          </div>
        </div>
        <div class="lv-row">
          <div class="lv-badge">LEVEL ${U().pad2(d.level)}</div>
          <div class="lv-exp">
            <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100">
              <div class="bar-ticks"></div>
              <div class="bar-fill" id="heroExpBar" style="width:${d.expPct.toFixed(1)}%"></div>
            </div>
            <div class="bar-row">
              <span><b>${d.expInLevel}</b> / ${d.expNeeded} EXP</span>
              <span>NEXT: LEVEL ${U().pad2(d.level + 1)} @ ${d.nextTotal} TOTAL</span>
            </div>
          </div>
        </div>
      </section>`;

    /* ---------- yesterday / today strip ---------- */
    const strip = `
      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="mini">
          <span class="k">YESTERDAY</span>
          <span class="v">${d.yesterdayTotal ? `${d.yesterdayDone} <small>/ ${d.yesterdayTotal}</small>` : '—'}</span>
          <span class="k" style="margin-top:6px;letter-spacing:.12em">DAY ${U().pad2(Math.max(1, d.day - 1))}</span>
        </div>
        <div class="mini">
          <span class="k">TODAY</span>
          <span class="v">${d.todayDone} <small>/ ${d.todayTotal}</small></span>
          <span class="k" style="margin-top:6px;letter-spacing:.12em">DAY ${U().pad2(d.day)}</span>
        </div>
      </div>`;

    /* ---------- today's quests (compact) ---------- */
    const questBlock = `
      <section class="panel">
        <div class="sec-title">TODAY'S QUEST <span class="st-sub">${d.todayDone}/${d.todayTotal} DONE</span></div>
        ${C().quests.map(q => SYS.renderQuestCard(q, rec)).join('')}
        <button class="btn btn-block" data-nav="quests">
          <svg class="ic"><use href="#i-arrow"/></svg> VIEW ALL QUESTS
        </button>
      </section>`;

    /* ---------- habits ---------- */
    const habitBlock = `
      <section class="panel">
        <div class="sec-title">DAILY HABIT <span class="st-sub">${d.habitDone}/${C().habits.length} DONE</span></div>
        ${SYS.renderHabits(rec)}
      </section>`;

    /* ---------- today's progress ---------- */
    const progressBlock = `
      <section class="panel">
        <div class="sec-title">TODAY'S PROGRESS</div>
        <div class="q-prog" style="gap:14px">
          <div class="bar" style="height:22px">
            <div class="bar-ticks"></div>
            <div class="bar-fill ${d.todayPct >= 100 ? 'is-ok' : ''}" style="width:${d.todayPct}%"></div>
          </div>
          <div class="pv" style="font-family:var(--font-d);font-size:1rem;color:var(--accent-2);min-width:64px">${d.todayPct}%</div>
        </div>
        <div class="bar-row">
          <span><b>${d.todayDone} / ${d.todayTotal}</b> COMPLETED</span>
          <span><b>+${d.expToday}</b> EXP TODAY</span>
        </div>
        <div class="mini-cards mt">
          <div class="mini"><span class="k">COMPLETION RATE</span><span class="v">${d.completionRate}<small>%</small></span></div>
          <div class="mini"><span class="k">DAYS COMPLETED</span><span class="v">${d.daysCompleted}</span></div>
          <div class="mini"><span class="k">BEST STREAK</span><span class="v">${d.bestStreak}<small> D</small></span></div>
        </div>
      </section>`;

    /* ---------- schedule ---------- */
    const sched = `
      <section class="panel">
        <div class="sec-title">DAILY SCHEDULE <span class="st-sub">${U().fmtClock()}</span></div>
        <div class="sched">
          ${C().schedule.map((s, i) => `
            <div class="srow k-${s.kind} ${i === now.current ? 'now' : ''}">
              <span class="st">${s.from === s.to ? s.from : s.from + '–' + s.to}</span>
              <span class="sl">${esc(s.label)}</span>
            </div>`).join('')}
        </div>
      </section>`;

    return banner + hero + notices + strip + questBlock + habitBlock + progressBlock + sched;
  };
})();
