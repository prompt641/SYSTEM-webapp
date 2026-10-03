/* =========================================================================
   SYSTEM — APP CONTROLLER
   Boot sequence · router · event delegation · effect handling
   ========================================================================= */
window.SYS = window.SYS || {};

SYS.App = (function () {
  const U = () => SYS.UI;
  const S = () => SYS.Store;
  const CFG = SYS.CONFIG;

  let route = 'dashboard';
  let lastRenderedRoute = null;
  const ROUTES = ['dashboard', 'quests', 'stats', 'achievements', 'journey', 'settings'];
  const TITLES = {
    dashboard: 'DASHBOARD', quests: 'QUEST LOG', stats: 'PLAYER STATS',
    achievements: 'ACHIEVEMENTS', journey: '37-DAY JOURNEY', settings: 'SETTINGS'
  };

  const $ = id => document.getElementById(id);

  /* ------------------------------------------------------------------
     SETTINGS APPLY (theme, mode, sound)
  ------------------------------------------------------------------ */
  function applySettings() {
    const s = S().get().settings;
    document.documentElement.setAttribute('data-theme', s.theme || 'blue');
    document.body.classList.toggle('light-mode', !s.dark);
    SYS.Sound.init(s.sound);
    const btn = $('soundToggle');
    if (btn) {
      btn.innerHTML = `<svg class="ic"><use href="#${s.sound ? 'i-sound' : 'i-mute'}"/></svg>`;
      btn.title = s.sound ? 'SOUND ON — click to mute' : 'SOUND OFF — click to unmute';
    }
  }

  /* ------------------------------------------------------------------
     EFFECT HANDLING — turn store effects into feedback
  ------------------------------------------------------------------ */
  function toastEnabled() { return S().get().settings.notifications; }

  function handleEffects(effects, ctx) {
    if (!effects || !effects.length) return;
    let levelUpEv = null;

    effects.forEach(ev => {
      switch (ev.type) {
        case 'quest':
          if (toastEnabled()) U().notify({
            title: 'QUEST COMPLETE', sub: ev.title, exp: ev.exp, icon: 'i-quest'
          });
          SYS.Sound.play('quest');
          U().flashCard(`[data-qcard="${ev.id}"]`);
          break;
        case 'habitdone':
          if (toastEnabled()) U().notify({ title: 'HABIT COMPLETE', sub: ev.title, exp: ev.exp, icon: 'i-check' });
          SYS.Sound.play('habit');
          break;
        case 'exp':
          SYS.Sound.play('exp');
          U().floatExp(ev.amount, ctx && ctx.target);
          break;
        case 'undo':
          if (toastEnabled()) U().notify({ kind: 'warn', title: 'QUEST REVERTED', sub: ev.title });
          SYS.Sound.play('click');
          break;
        case 'discipline':
          if (ev.met) {
            if (toastEnabled()) U().notify({
              kind: 'ach', title: 'DISCIPLINE BONUS', sub: 'ALL WORK DONE BEFORE 14:00', exp: ev.exp
            });
            SYS.Sound.play('achievement');
          } else {
            if (toastEnabled()) U().notify({
              kind: 'warn', title: 'SYSTEM NOTICE', sub: 'Daily Work was not completed before 14:00.'
            });
            SYS.Sound.play('notify');
          }
          break;
        case 'achievement': {
          const a = CFG.achById(ev.id);
          if (toastEnabled()) U().notify({
            kind: 'ach', title: 'ACHIEVEMENT UNLOCKED', sub: (a ? a.name : ev.id) + ' · +' + ev.exp + ' EXP', icon: 'i-trophy', long: true
          });
          SYS.Sound.play('achievement');
          break;
        }
        case 'newday':
          if (toastEnabled()) U().notify({ title: 'NEW DAY INITIALIZED', sub: 'DAY ' + U().pad2(ev.day) + ' / 37 — quests refreshed' });
          SYS.Sound.play('notify');
          break;
        case 'locked':
          if (toastEnabled()) U().notify({ kind: 'danger', title: 'RECORD LOCKED', sub: 'Unlock this day from the Journey page to edit it.' });
          SYS.Sound.play('error');
          break;
        case 'resetday':
          SYS.Sound.play('error');
          break;
        case 'import':
          if (toastEnabled()) U().notify({ kind: 'ach', title: 'DATA RESTORED', sub: 'Backup imported successfully' });
          SYS.Sound.play('achievement');
          break;
        case 'levelup':
          levelUpEv = ev;
          break;
        default:
          break;
      }
    });

    if (levelUpEv) {
      setTimeout(() => {
        U().levelUp(levelUpEv.level, levelUpEv.delta);
        SYS.Sound.play('levelup');
        if (toastEnabled()) U().notify({ title: 'LEVEL UP', sub: 'LEVEL ' + U().pad2(levelUpEv.level) + ' UNLOCKED', long: true });
      }, 380);
    }
  }

  /* Run a store action and feed its effects through the feedback pipeline. */
  function runAction(fn, ctx) {
    let effects = [];
    try { effects = fn() || []; } catch (e) { console.error(e); SYS.Sound.play('error'); return; }
    handleEffects(effects, ctx);
    render();
  }

  /* ------------------------------------------------------------------
     RENDER / ROUTER
  ------------------------------------------------------------------ */
  function go(r) {
    if (!ROUTES.includes(r)) r = 'dashboard';
    route = r;
    if (location.hash !== '#/' + r) location.hash = '#/' + r;
    else render();
  }

  function readHash() {
    const r = (location.hash || '').replace(/^#\/?/, '');
    route = ROUTES.includes(r) ? r : 'dashboard';
  }

  function render() {
    const page = $('pageContent');
    if (!page) return;
    const st = S().get();

    if (!st.started) return;

    const view = SYS.Pages[route] || SYS.Pages.dashboard;
    page.innerHTML = view();

    if (lastRenderedRoute !== route) {
      page.classList.remove('enter');
      void page.offsetWidth;
      page.classList.add('enter');
      lastRenderedRoute = route;
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    /* topbar + nav state */
    $('topbarTitle').textContent = TITLES[route] || 'SYSTEM';
    const d = S().derive();
    $('topbarDay').textContent = 'DAY ' + U().pad2(d.day) + ' / ' + d.totalDays;
    $('topbarStreak').querySelector('span').textContent = d.streak;
    $('sidePlayerName').textContent = (st.player.name || 'PLAYER').toUpperCase();
    $('sidePlayerLv').textContent = 'LEVEL ' + U().pad2(d.level) + ' · ' + d.totalExp + ' EXP';
    $('sideAvatar').textContent = (st.player.name || 'P').trim().charAt(0).toUpperCase() || 'P';
    $('sideExpBar').style.width = d.expPct.toFixed(1) + '%';

    document.querySelectorAll('[data-nav]').forEach(n => {
      n.classList.toggle('active', n.dataset.nav === route);
    });
  }

  /* ------------------------------------------------------------------
     EVENT DELEGATION
  ------------------------------------------------------------------ */
  function onClick(e) {
    const t = e.target;

    /* navigation */
    const nav = t.closest('[data-nav]');
    if (nav) {
      SYS.Sound.play('click');
      go(nav.dataset.nav);
      return;
    }

    /* modal close on backdrop */
    if (t.id === 'modalOverlay') { U().closeModal(); return; }

    /* level up overlay */
    if (t.closest('#levelupClose') || t.id === 'levelupOverlay') { U().closeLevelUp(); return; }

    /* sound toggle */
    if (t.closest('#soundToggle')) {
      const st = S().get();
      const next = !st.settings.sound;
      S().updateSettings({ sound: next });
      applySettings();
      if (next) { SYS.Sound.unlock(); SYS.Sound.play('notify'); U().notify({ title: 'SOUND ON', sub: 'System audio enabled' }); }
      else U().notify({ kind: 'warn', title: 'SOUND OFF', sub: 'System audio muted' });
      render();
      return;
    }

    /* generic actions */
    const act = t.closest('[data-act]');
    if (act) {
      const name = act.dataset.act;
      /* journey day */
      if (name === 'day') { SYS.openDayModal(act.dataset.day); SYS.Sound.play('click'); return; }
      if (name === 'backtoday') { S().viewDay(null); SYS.Sound.play('click'); render(); return; }
      if (SYS.handleQuestAction && SYS.handleQuestAction(name, act)) return;
      if (SYS.handleSettingsAction && SYS.handleSettingsAction(name, act)) return;
    }
  }

  /* ------------------------------------------------------------------
     IMPORT FILE
  ------------------------------------------------------------------ */
  function bindImport() {
    const input = $('importFile');
    if (!input) return;
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const res = S().validateImport(String(reader.result || ''));
        if (!res.ok) {
          U().notify({ kind: 'danger', title: 'IMPORT FAILED', sub: res.error, sticky: true });
          SYS.Sound.play('error');
          return;
        }
        U().confirmDialog({
          tag: 'IMPORT DATA',
          body: `<p>Replace current data with backup from <b class="accent">${U().esc(file.name)}</b>?</p>
                 <p class="dim" style="font-size:.84rem">Current progress on this device will be overwritten.</p>`,
          confirm: 'IMPORT', danger: false
        }).then(ok => {
          if (!ok) return;
          const r = S().importJSON(String(reader.result || ''));
          if (!r.ok) {
            U().notify({ kind: 'danger', title: 'IMPORT FAILED', sub: r.error });
            SYS.Sound.play('error');
            return;
          }
          applySettings();
          go('dashboard');
          render();
          U().notify({ kind: 'ach', title: 'DATA RESTORED', sub: 'Backup imported successfully' });
          SYS.Sound.play('achievement');
        });
      };
      reader.onerror = () => {
        U().notify({ kind: 'danger', title: 'IMPORT FAILED', sub: 'Cannot read file.' });
        SYS.Sound.play('error');
      };
      reader.readAsText(file);
    });
  }

  /* ------------------------------------------------------------------
     BOOT (first-time experience)
  ------------------------------------------------------------------ */
  const BOOT_LINES = [
    { t: '[ SYSTEM INITIALIZING... ]', c: 'hl', d: 260 },
    { t: '> BOOT SEQUENCE ............... OK', c: 'ok', d: 220 },
    { t: '> LOADING HOLOGRAPHIC UI ...... OK', c: 'ok', d: 200 },
    { t: '> MOUNTING QUEST TEMPLATES .... OK', c: 'ok', d: 200 },
    { t: '> CALIBRATING LEVEL ENGINE .... OK', c: 'ok', d: 220 },
    { t: '> 37-DAY JOURNEY READY', c: 'dim', d: 260 },
    { t: '[ SYSTEM ONLINE ]', c: 'hl', d: 380 },
    { t: 'WELCOME, PLAYER.', c: 'hl', d: 420 }
  ];

  function typeBoot(done) {
    const log = $('bootLog');
    let i = 0;
    (function next() {
      if (i >= BOOT_LINES.length) { done(); return; }
      const line = BOOT_LINES[i++];
      const div = document.createElement('div');
      div.className = 'ln ' + line.c;
      div.textContent = line.t;
      log.appendChild(div);
      setTimeout(next, line.d);
    })();
  }

  function startBoot() {
    const boot = $('bootScreen');
    boot.hidden = false;
    $('app').hidden = true;
    typeBoot(() => {
      const form = $('bootForm');
      form.hidden = false;
      $('playerNameInput').focus();
    });
    $('bootForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('playerNameInput').value.trim();
      if (!name) {
        $('playerNameInput').focus();
        U().notify({ kind: 'danger', title: 'NAME REQUIRED', sub: 'Enter your player name.' });
        SYS.Sound.play('error');
        return;
      }
      SYS.Sound.unlock();
      S().startJourney(name);
      SYS.Sound.play('levelup');
      boot.classList.add('leaving');
      setTimeout(() => { boot.hidden = true; }, 500);
      $('app').hidden = false;
      go('dashboard');
      render();
      U().notify({ title: 'SYSTEM ONLINE', sub: 'DAY 01 / 37 — STARTED', icon: 'i-shield', long: true });
    });
    $('bootSoundBtn').addEventListener('click', () => {
      SYS.Sound.unlock();
      S().updateSettings({ sound: true });
      applySettings();
      SYS.Sound.play('notify');
      $('bootSoundBtn').textContent = '🔊 SOUND ENABLED';
    });
  }

  /* ------------------------------------------------------------------
     INIT
  ------------------------------------------------------------------ */
  function tick() {
    /* day rollover while the app is open */
    const effects = S().syncDay();
    if (effects.length) { handleEffects(effects); render(); }
  }

  function init() {
    S().load();
    applySettings();
    bindImport();

    document.addEventListener('click', onClick, false);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { U().closeModal(); U().closeLevelUp(); }
    });
    /* unlock audio on first interaction anywhere */
    const unlockOnce = () => { SYS.Sound.unlock(); window.removeEventListener('pointerdown', unlockOnce); };
    window.addEventListener('pointerdown', unlockOnce);

    window.addEventListener('hashchange', () => { readHash(); render(); });

    SYS.Sync.init();

    const bootOrResume = () => {
      const st = S().get();
      if (!st.started) {
        startBoot();
      } else {
        S().syncDay();
        $('bootScreen').hidden = true;
        $('app').hidden = false;
        readHash();
        render();
        /* morning / rollover notice */
        const d = S().derive();
        if (d.day === 1 && d.todayDone === 0) {
          U().notify({ title: 'SYSTEM ONLINE', sub: 'DAY 01 / 37 — welcome back, ' + (st.player.name || 'PLAYER') });
        }
      }
    };

    /* Cloud sync: if this device may have state waiting (join link or known
       config), give the first pull a moment before choosing boot vs resume. */
    if (!S().get().started && SYS.Sync.hasConfig()) {
      SYS.Sync.pullFirst().then(bootOrResume, bootOrResume);
    } else {
      bootOrResume();
      if (S().get().started) SYS.Sync.pullNow('boot');
    }

    setInterval(tick, 30000);
    /* re-render occasionally so schedule NOW marker / free-time stay fresh */
    setInterval(() => { if (S().get().started && !document.hidden) render(); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { go, render, runAction, applySettings, handleEffects, init };
})();
