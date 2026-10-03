/* =========================================================================
   SYSTEM — STORE
   Single source of truth. Persists to localStorage (swappable repository,
   see SYS.Repository at the bottom for a future backend adapter).
   ========================================================================= */
window.SYS = window.SYS || {};

SYS.Store = (function () {
  const CFG = SYS.CONFIG;
  const KEY = CFG.storageKey;

  let state = null;
  const listeners = new Set();

  /* ---------------- date helpers ---------------- */
  const pad = n => String(n).padStart(2, '0');
  function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function parseDate(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
  function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return dateStr(d); }
  function diffDays(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
  function nowISO() { return new Date().toISOString(); }
  function minutesNow() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function minutesOfISO(iso) { if (!iso) return 0; const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); }

  /* ---------------- level system ----------------
     EXP needed to advance OUT of level L = base + (L-1)*step
     L1 -> 500, L2 -> 600, L3 -> 700 ...  (edit CFG.level to rebalance) */
  function neededToAdvance(L) { return CFG.level.base + (L - 1) * CFG.level.step; }
  function levelInfo(totalExp) {
    let level = 1, rest = Math.max(0, totalExp | 0), guard = 0;
    while (rest >= neededToAdvance(level) && guard++ < 999) { rest -= neededToAdvance(level); level++; }
    const need = neededToAdvance(level);
    return {
      level,
      expInLevel: rest,
      expNeeded: need,
      nextTotal: totalExp - rest + need,
      pct: Math.min(100, (rest / need) * 100)
    };
  }

  /* ---------------- day records ---------------- */
  function blankDay(n) {
    const quests = {}, habits = {};
    CFG.quests.forEach(q => { quests[q.id] = { progress: 0, done: false, at: null, exp: 0 }; });
    CFG.habits.forEach(h => { habits[h.id] = { value: 0, done: false, at: null, exp: 0 }; });
    const exercises = {};
    (CFG.questById('workout') || { exercises: [] }).exercises.forEach(e => { exercises[e.id] = 0; });
    return {
      day: n,
      date: state ? addDays(state.journey.startDate, n - 1) : dateStr(new Date()),
      unlocked: false,
      quests, habits, exercises,
      expEarned: 0,
      statsEarned: {},
      discipline: { awarded: false, missed: false, noticeShown: false }
    };
  }

  function getDay(n, create = true) {
    n = Number(n);
    if (!state.days[n] && create) state.days[n] = blankDay(n);
    return state.days[n] || null;
  }

  function todayRec() { return getDay(state.journey.currentDay); }
  function activeDay() { return UI_VIEW.day || state.journey.currentDay; }
  function activeRec() { return getDay(activeDay()); }
  const UI_VIEW = { day: null }; // set when the user unlocks/views a past day

  function canEdit(n) {
    if (!state.started) return false;
    if (Number(n) === state.journey.currentDay) return true;
    const rec = state.days[n];
    return !!(rec && rec.unlocked);
  }

  /* ---------------- derived values ---------------- */
  function dayCompletion(rec) {
    if (!rec) return { done: 0, total: 0, pct: 0 };
    let done = 0;
    const total = CFG.quests.length + CFG.habits.length;
    CFG.quests.forEach(q => { if (rec.quests[q.id] && rec.quests[q.id].done) done++; });
    CFG.habits.forEach(h => { if (rec.habits[h.id] && rec.habits[h.id].done) done++; });
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function streakUpTo(n) {
    let streak = 0;
    for (let i = n; i >= 1; i--) {
      const rec = state.days[i];
      if (rec && dayCompletion(rec).pct >= 60) streak++;
      else if (i === n) continue;      // today may still be in progress — don't break yet
      else break;
    }
    return streak;
  }

  function bestStreak() {
    let best = 0, run = 0;
    for (let i = 1; i <= state.journey.currentDay; i++) {
      const rec = state.days[i];
      if (rec && dayCompletion(rec).pct >= 60) { run++; best = Math.max(best, run); }
      else run = 0;
    }
    return best;
  }

  function derive() {
    const li = levelInfo(state.totals.exp);
    const cur = state.journey.currentDay;
    const today = getDay(cur);
    const todayC = dayCompletion(today);
    const yest = cur > 1 ? getDay(cur - 1, false) : null;
    const yestC = dayCompletion(yest);

    let totalQuests = 0, totalHabits = 0, studyMinutes = 0, workouts = 0,
      earlyDays = 0, perfectDays = 0, perfectHabitDays = 0, daysCompleted = 0,
      pctSum = 0, elapsed = 0, totalExpAll = 0;

    for (let i = 1; i <= cur; i++) {
      const rec = state.days[i];
      elapsed++;
      if (!rec) continue;
      const c = dayCompletion(rec);
      pctSum += c.pct;
      totalExpAll += rec.expEarned || 0;
      if (c.pct >= 60) daysCompleted++;
      if (c.pct === 100) perfectDays++;
      CFG.quests.forEach(q => {
        const r = rec.quests[q.id];
        if (!r) return;
        if (r.done) {
          totalQuests++;
          if (q.id === 'workout') workouts++;
        }
        if (q.studyMinutes && r.progress) studyMinutes += Math.min(r.progress, q.target);
      });
      const allHab = CFG.habits.every(h => rec.habits[h.id] && rec.habits[h.id].done);
      if (allHab) perfectHabitDays++;
      if (rec.discipline && rec.discipline.awarded) earlyDays++;
    }

    let habitDone = 0;
    CFG.habits.forEach(h => { if (today.habits[h.id].done) habitDone++; });

    return {
      /* player */
      name: state.player.name,
      level: li.level, expInLevel: li.expInLevel, expNeeded: li.expNeeded,
      expPct: li.pct, nextTotal: li.nextTotal,
      totalExp: state.totals.exp, totalExpAll,
      /* journey */
      day: cur, totalDays: CFG.journeyDays,
      daysCompleted, daysRemaining: CFG.journeyDays - cur,
      streak: streakUpTo(cur), bestStreak: Math.max(bestStreak(), state.counters.bestStreak || 0),
      /* today */
      todayPct: todayC.pct, todayDone: todayC.done, todayTotal: todayC.total,
      expToday: today.expEarned || 0,
      habitDone,
      yesterdayDone: yestC.done, yesterdayTotal: yestC.total,
      /* totals */
      totalQuests, totalHabits,
      completionRate: elapsed ? Math.round(pctSum / elapsed) : 0,
      studyMinutes, workouts, earlyDays, perfectDays, perfectHabitDays,
      achievementCount: Object.keys(state.achievements).length,
      achievementTotal: CFG.achievements.length,
      stats: Object.assign({}, state.stats),
      discipline: Object.assign({}, today.discipline),
      /* meta */
      started: state.started, todayKey: dateStr(new Date())
    };
  }

  /* ---------------- persistence ---------------- */
  function defaults() {
    const stats = {};
    Object.keys(CFG.stats).forEach(k => { stats[k] = 0; });
    return {
      schemaVersion: CFG.schemaVersion,
      createdAt: nowISO(),
      started: false,
      player: { name: '' },
      settings: { sound: true, notifications: true, dark: true, theme: 'blue' },
      journey: { startDate: dateStr(new Date()), currentDay: 1 },
      totals: { exp: 0, level: 1 },
      stats,
      achievements: {},
      counters: { bestStreak: 0 },
      days: {}
    };
  }

  function normalize(raw) {
    const d = defaults();
    const s = Object.assign(d, raw || {});
    s.player = Object.assign(d.player, raw && raw.player);
    s.settings = Object.assign({ sound: true, notifications: true, dark: true, theme: 'blue' }, raw && raw.settings);
    s.journey = Object.assign(d.journey, raw && raw.journey);
    s.totals = Object.assign(d.totals, raw && raw.totals);
    s.counters = Object.assign(d.counters, raw && raw.counters);
    s.achievements = (raw && raw.achievements) || {};
    s.days = (raw && raw.days) || {};
    s.stats = Object.assign(d.stats, raw && raw.stats);
    // rebuild day records so new content ids never crash the app
    Object.keys(s.days).forEach(k => {
      const rec = s.days[k];
      const blank = blankDay(Number(k));
      blank.date = rec.date || addDays(s.journey.startDate, Number(k) - 1);
      blank.unlocked = !!rec.unlocked;
      blank.expEarned = rec.expEarned || 0;
      blank.statsEarned = rec.statsEarned || {};
      blank.discipline = Object.assign(blank.discipline, rec.discipline || {});
      blank.exercises = Object.assign(blank.exercises, rec.exercises || {});
      CFG.quests.forEach(q => {
        const src = rec.quests && rec.quests[q.id];
        blank.quests[q.id] = Object.assign(blank.quests[q.id], src || {});
      });
      CFG.habits.forEach(h => {
        const src = rec.habits && rec.habits[h.id];
        blank.habits[h.id] = Object.assign(blank.habits[h.id], src || {});
      });
      s.days[k] = blank;
    });
    if (typeof s.totals.exp !== 'number' || s.totals.exp < 0) s.totals.exp = 0;
    s.totals.level = levelInfo(s.totals.exp).level;
    return s;
  }

  function save() {
    SYS.Repository.write(KEY, JSON.stringify(state));
  }

  function load() {
    const raw = SYS.Repository.read(KEY);
    if (!raw) { state = defaults(); return state; }
    try { state = normalize(JSON.parse(raw)); } catch (e) { state = defaults(); }
    return state;
  }

  /* ---------------- day rollover ---------------- */
  function syncDay() {
    if (!state.started) return [];
    const effects = [];
    const today = dateStr(new Date());
    const idx = diffDays(state.journey.startDate, today) + 1;
    const day = Math.min(Math.max(idx, 1), CFG.journeyDays);
    if (day !== state.journey.currentDay) {
      state.journey.currentDay = day;
      for (let i = 1; i <= day; i++) getDay(i);   // materialise skipped days as empty history
      effects.push({ type: 'newday', day });
    }
    state.lastActive = today;
    return effects;
  }

  /* ---------------- discipline (14:00 rule) ---------------- */
  function evaluateDiscipline(effects) {
    if (!state.started) return;
    const rec = todayRec();
    const D = CFG.discipline;
    const allDone = D.required.every(id => rec.quests[id] && rec.quests[id].done);
    const beforeDeadline = D.required.every(id => {
      const r = rec.quests[id];
      return r && r.done && minutesOfISO(r.at) < D.deadlineMinutes;
    });
    if (allDone && !rec.discipline.awarded) {
      rec.discipline.awarded = true;
      if (beforeDeadline) {
        state.totals.exp += D.bonusExp;
        rec.expEarned += D.bonusExp;
        Object.keys(D.bonusStats).forEach(k => {
          state.stats[k] = (state.stats[k] || 0) + D.bonusStats[k];
          rec.statsEarned[k] = (rec.statsEarned[k] || 0) + D.bonusStats[k];
        });
        effects.push({ type: 'discipline', met: true, exp: D.bonusExp });
      } else {
        rec.discipline.missed = true;
      }
    }
    if (minutesNow() >= D.deadlineMinutes && !beforeDeadline && !rec.discipline.noticeShown && !allDone) {
      rec.discipline.noticeShown = true;
      effects.push({ type: 'discipline', met: false });
    }
  }

  /* ---------------- achievements + commit ---------------- */
  function mutate(fn) {
    if (!state.started) return [];
    syncDay();
    const effects = [];
    let out = fn(effects) || [];
    if (Array.isArray(out)) effects.push(...out);

    const before = levelInfo(state.totals.exp).level;
    evaluateDiscipline(effects);

    // achievements
    const derived = derive();
    CFG.achievements.forEach(a => {
      if (!state.achievements[a.id]) {
        let ok = false;
        try { ok = !!a.check(derived); } catch (e) { ok = false; }
        if (ok) {
          state.achievements[a.id] = nowISO();
          state.totals.exp += a.exp;
          const rec = todayRec();
          rec.expEarned += a.exp;
          effects.push({ type: 'achievement', id: a.id, exp: a.exp });
        }
      }
    });

    const after = levelInfo(state.totals.exp).level;
    state.totals.level = after;
    if (after > before) effects.push({ type: 'levelup', from: before, level: after, delta: after - before });

    const bs = bestStreak();
    if (bs > (state.counters.bestStreak || 0)) state.counters.bestStreak = bs;

    save();
    listeners.forEach(l => { try { l(effects); } catch (e) { console.error(e); } });
    return effects;
  }

  function revokeExp(rec, amount) {
    rec.expEarned = Math.max(0, (rec.expEarned || 0) - amount);
    state.totals.exp = Math.max(0, state.totals.exp - amount);
  }
  function revokeStats(rec, gains) {
    Object.keys(gains || {}).forEach(k => {
      state.stats[k] = Math.max(0, (state.stats[k] || 0) - gains[k]);
      rec.statsEarned[k] = Math.max(0, (rec.statsEarned[k] || 0) - gains[k]);
    });
  }

  /* ---------------- ACTIONS ---------------- */
  function completeQuest(id, dayNum) {
    return mutate(effects => {
      const n = Number(dayNum) || activeDay();
      if (!canEdit(n)) { effects.push({ type: 'locked' }); return; }
      const rec = getDay(n), q = CFG.questById(id), r = rec.quests[id];
      if (!q || !r || r.done) return;
      r.done = true; r.at = nowISO(); r.exp = q.exp;
      rec.expEarned += q.exp;
      state.totals.exp += q.exp;
      Object.keys(q.statGains || {}).forEach(k => {
        state.stats[k] = (state.stats[k] || 0) + q.statGains[k];
        rec.statsEarned[k] = (rec.statsEarned[k] || 0) + q.statGains[k];
      });
      if (q.mode === 'track') r.progress = 100;
      if (q.mode === 'time' && r.progress < q.target) r.progress = q.target;
      effects.push({ type: 'quest', id, title: q.title, exp: q.exp, day: n });
      effects.push({ type: 'exp', amount: q.exp });
    });
  }

  function uncompleteQuest(id, dayNum) {
    return mutate(effects => {
      const n = Number(dayNum) || activeDay();
      if (!canEdit(n)) { effects.push({ type: 'locked' }); return; }
      const rec = getDay(n), q = CFG.questById(id), r = rec.quests[id];
      if (!q || !r || !r.done) return;
      r.done = false; r.at = null;
      revokeExp(rec, r.exp || 0);
      revokeStats(rec, q.statGains);
      r.exp = 0;
      effects.push({ type: 'undo', title: q.title });
    });
  }

  function addProgress(id, minutes, dayNum) {
    return mutate(effects => {
      const n = Number(dayNum) || activeDay();
      if (!canEdit(n)) { effects.push({ type: 'locked' }); return; }
      const rec = getDay(n), q = CFG.questById(id), r = rec.quests[id];
      if (!q || !r || q.mode !== 'time') return;
      r.progress = Math.max(0, r.progress + minutes);
      effects.push({ type: 'progress', id, progress: r.progress });
    });
  }

  function addExercise(exId, delta, dayNum) {
    return mutate(effects => {
      const n = Number(dayNum) || activeDay();
      if (!canEdit(n)) { effects.push({ type: 'locked' }); return; }
      const rec = getDay(n);
      const ex = (CFG.questById('workout').exercises || []).find(e => e.id === exId);
      if (!ex) return;
      const v = Math.min(ex.target, Math.max(0, (rec.exercises[exId] || 0) + delta));
      rec.exercises[exId] = v;
      effects.push({ type: 'exercise', id: exId, value: v, done: v >= ex.target });
    });
  }

  function workoutPct(rec) {
    const list = CFG.questById('workout').exercises || [];
    if (!list.length) return 0;
    let sum = 0;
    list.forEach(e => { sum += Math.min(1, (rec.exercises[e.id] || 0) / e.target); });
    return Math.round((sum / list.length) * 100);
  }

  function bumpHabit(id, delta, dayNum) {
    return mutate(effects => {
      const n = Number(dayNum) || activeDay();
      if (!canEdit(n)) { effects.push({ type: 'locked' }); return; }
      const rec = getDay(n), h = CFG.habitById(id), r = rec.habits[id];
      if (!h || !r) return;
      if (h.mode === 'toggle') {
        r.done = !r.done;
        r.value = r.done ? 1 : 0;
        r.at = r.done ? nowISO() : null;
        if (r.done) awardHabit(rec, h, r, effects);
        else undoHabit(rec, h, r);
        effects.push({ type: 'habit', id, done: r.done });
        return;
      }
      const next = Math.min(h.target, Math.max(0, r.value + delta));
      r.value = next;
      const nowDone = next >= h.target;
      if (nowDone && !r.done) { r.done = true; r.at = nowISO(); awardHabit(rec, h, r, effects); }
      else if (!nowDone && r.done) { r.done = false; r.at = null; undoHabit(rec, h, r); }
      effects.push({ type: 'habit', id, done: r.done, value: next });
    });
  }

  function awardHabit(rec, h, r, effects) {
    r.exp = h.exp;
    rec.expEarned += h.exp;
    state.totals.exp += h.exp;
    Object.keys(h.statGains || {}).forEach(k => {
      state.stats[k] = (state.stats[k] || 0) + h.statGains[k];
      rec.statsEarned[k] = (rec.statsEarned[k] || 0) + h.statGains[k];
    });
    effects.push({ type: 'habitdone', title: h.name, exp: h.exp });
    effects.push({ type: 'exp', amount: h.exp });
  }
  function undoHabit(rec, h, r) {
    revokeExp(rec, r.exp || 0);
    revokeStats(rec, h.statGains);
    r.exp = 0;
  }

  function setProgress(id, value, dayNum) {
    return mutate(effects => {
      const n = Number(dayNum) || activeDay();
      if (!canEdit(n)) { effects.push({ type: 'locked' }); return; }
      const rec = getDay(n), q = CFG.questById(id), r = rec.quests[id];
      if (!q || !r) return;
      r.progress = Math.max(0, value);
      effects.push({ type: 'progress', id, progress: r.progress });
    });
  }

  function setExercise(exId, value, dayNum) {
    return mutate(effects => {
      const n = Number(dayNum) || activeDay();
      if (!canEdit(n)) { effects.push({ type: 'locked' }); return; }
      const rec = getDay(n);
      const ex = (CFG.questById('workout').exercises || []).find(e => e.id === exId);
      if (!ex) return;
      rec.exercises[exId] = Math.min(ex.target, Math.max(0, value));
      effects.push({ type: 'exercise', id: exId, value: rec.exercises[exId] });
    });
  }

  function unlockDay(n) {
    return mutate(effects => {
      const rec = getDay(n, false);
      if (!rec) return;
      rec.unlocked = true;
      UI_VIEW.day = Number(n);
      effects.push({ type: 'unlock', day: Number(n) });
    });
  }
  function lockDay(n) {
    return mutate(effects => {
      const rec = getDay(n, false);
      if (!rec) return;
      rec.unlocked = false;
      if (UI_VIEW.day === Number(n)) UI_VIEW.day = null;
      effects.push({ type: 'lock', day: Number(n) });
    });
  }
  function viewDay(n) { UI_VIEW.day = n ? Number(n) : null; }
  function getViewDay() { return UI_VIEW.day; }

  function resetDay() {
    return mutate(effects => {
      const n = activeDay();
      const old = getDay(n);
      const fresh = blankDay(n);
      fresh.unlocked = old.unlocked;
      state.totals.exp = Math.max(0, state.totals.exp - (old.expEarned || 0));
      Object.keys(old.statsEarned || {}).forEach(k => {
        state.stats[k] = Math.max(0, (state.stats[k] || 0) - old.statsEarned[k]);
      });
      state.days[n] = fresh;
      state.totals.level = levelInfo(state.totals.exp).level;
      effects.push({ type: 'resetday', day: n });
    });
  }

  function startJourney(name) {
    state.started = true;
    state.player.name = String(name || 'PLAYER').trim().slice(0, 24) || 'PLAYER';
    state.journey.startDate = dateStr(new Date());
    state.journey.currentDay = 1;
    getDay(1);
    state.totals.level = 1;
    save();
    listeners.forEach(l => l([{ type: 'start' }]));
  }

  function resetJourney() {
    const keepSettings = Object.assign({}, state.settings);
    const keepName = state.player.name;
    state = defaults();
    state.settings = keepSettings;
    state.player.name = keepName;
    save();
    listeners.forEach(l => l([{ type: 'fullreset' }]));
  }

  function updateSettings(patch) {
    Object.assign(state.settings, patch);
    save();
    listeners.forEach(l => l([{ type: 'settings' }]));
  }
  function setPlayerName(name) {
    state.player.name = String(name || '').trim().slice(0, 24) || state.player.name;
    save();
    listeners.forEach(l => l([{ type: 'settings' }]));
  }
  function setStartDate(str) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
    state.journey.startDate = str;
    syncDay();
    save();
    listeners.forEach(l => l([{ type: 'settings' }]));
    return true;
  }

  /* ---------------- export / import ---------------- */
  function exportJSON() {
    return JSON.stringify({
      app: 'SYSTEM',
      exportedAt: nowISO(),
      schemaVersion: CFG.schemaVersion,
      state
    }, null, 2);
  }

  function validateImport(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { return { ok: false, error: 'INVALID JSON — file is not readable.' }; }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj))
      return { ok: false, error: 'INVALID DATA — root must be an object.' };
    const s = obj.state && typeof obj.state === 'object' ? obj.state : obj;
    if (!s.journey || typeof s.journey.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.journey.startDate))
      return { ok: false, error: 'INVALID DATA — missing journey.startDate.' };
    if (!s.days || typeof s.days !== 'object' || Array.isArray(s.days))
      return { ok: false, error: 'INVALID DATA — missing days history.' };
    if (!s.player || typeof s.player.name !== 'string')
      return { ok: false, error: 'INVALID DATA — missing player profile.' };
    if (typeof s.totals !== 'undefined' && (typeof s.totals.exp !== 'number'))
      return { ok: false, error: 'INVALID DATA — totals.exp must be a number.' };
    return { ok: true, state: s };
  }

  function importJSON(text) {
    const v = validateImport(text);
    if (!v.ok) return v;
    state = normalize(v.state);
    state.started = true;
    syncDay();
    save();
    listeners.forEach(l => l([{ type: 'import' }]));
    return { ok: true };
  }

  /* ---------------- subscription ---------------- */
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function get() { return state; }

  return {
    load, save, get, derive, subscribe, syncDay, mutate,
    /* actions */
    startJourney, completeQuest, uncompleteQuest, addProgress, setProgress,
    addExercise, setExercise, workoutPct, bumpHabit, unlockDay, lockDay,
    viewDay, getViewDay, resetDay, resetJourney,
    updateSettings, setPlayerName, setStartDate,
    exportJSON, importJSON, validateImport,
    /* reads */
    getDay, todayRec, activeRec, activeDay, dayCompletion, canEdit,
    levelInfo, neededToAdvance, streakUpTo, dateStr, addDays, diffDays,
    setViewDay: viewDay
  };
})();

/* =========================================================================
   REPOSITORY — persistence adapter.
   Currently localStorage. To connect a backend later, replace read/write
   with fetch()/IndexedDB calls; every other module talks only to SYS.Store.
   ========================================================================= */
SYS.Repository = {
  read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  write(key, value) { try { localStorage.setItem(key, value); return true; } catch (e) { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch (e) {} }
};
