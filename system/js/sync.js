/* =========================================================================
   SYSTEM — CLOUD SYNC (Supabase PostgREST)
   Optional layer: links devices through a shared sync code.
   - push: debounced after every store mutation (last-write-wins via rev)
   - pull: on boot / window focus / every 60s
   - join: open a link containing ?sync=<base64 {u,k,c}>
   Config lives in its own localStorage key so it never rides along
   with exported backups.
   ========================================================================= */
window.SYS = window.SYS || {};

SYS.Sync = (function () {
  const CFG_KEY = 'system.sync.v1';
  const TABLE = '/rest/v1/system_sync';

  let cfg = null;        // { u: supabase url, k: anon key, c: sync code }
  let localRev = '';     // ISO timestamp of last local mutation (LWW)
  let dirty = false;     // local changes not yet pushed
  let applying = false;  // true while a remote snapshot is being applied
  let pullBusy = false;
  let pushTimer = null;
  let status = 'off';    // off | idle | syncing | synced | error
  let lastError = '';

  /* ---------------- config ---------------- */
  function loadCfg() {
    try { cfg = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch (e) { cfg = null; }
    if (cfg) {
      localRev = cfg.rev || '';
      dirty = !!cfg.dirty;
    }
    return cfg;
  }
  function saveCfg() {
    if (!cfg) return;
    try {
      localStorage.setItem(CFG_KEY, JSON.stringify({
        u: cfg.u, k: cfg.k, c: cfg.c, rev: localRev, dirty: dirty, joinedAt: cfg.joinedAt || ''
      }));
    } catch (e) { /* storage full / private mode */ }
  }
  function hasConfig() { return !!(cfg && cfg.u && cfg.k && cfg.c); }

  function setStatus(s, err) {
    status = s;
    if (err != null) lastError = err;
    if (s !== 'error') lastError = err || lastError;
    updateChip();
  }
  function updateChip() {
    const chip = document.getElementById('syncChip');
    if (chip) {
      const l = label();
      chip.textContent = l.text;
      chip.className = 'chip ' + l.cls;
    }
  }

  /* ---------------- REST helpers ---------------- */
  function api(path, opts) {
    const base = String(cfg.u).replace(/\/+$/, '');
    const headers = {
      'apikey': cfg.k,
      'Authorization': 'Bearer ' + cfg.k,
      'Content-Type': 'application/json'
    };
    if (opts && opts.headers) Object.assign(headers, opts.headers);
    return fetch(base + path, Object.assign({}, opts, { headers: headers }));
  }

  /* ---------------- push (debounced) ---------------- */
  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { pushNow(); }, 1200);
  }

  function pushNow(silent) {
    if (!hasConfig()) return Promise.resolve({ ok: false, reason: 'no-config' });
    const st = SYS.Store.get();
    if (!st || !st.started) return Promise.resolve({ ok: false, reason: 'not-started' });
    const rev = localRev || new Date().toISOString();
    setStatus('syncing');
    const body = JSON.stringify({ code: cfg.c, state: st, rev: rev });
    return api(TABLE, {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: body,
      keepalive: true
    }).then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      dirty = false;
      saveCfg();
      setStatus('synced');
      if (!silent) updateChip();
      return { ok: true };
    }).catch(err => {
      setStatus('error', String(err && err.message || err));
      if (!silent) console.warn('[SYNC] push failed:', err);
      return { ok: false, error: String(err && err.message || err) };
    });
  }

  /* ---------------- pull ---------------- */
  function applyRemote(row, reason) {
    if (!row || !row.state || !row.state.started) return false;
    const remoteRev = String(row.rev || '');
    if (remoteRev && remoteRev <= localRev) return false;
    applying = true;
    let ok = false;
    try {
      const res = SYS.Store.importJSON(JSON.stringify(row.state));
      ok = !!(res && res.ok);
      if (ok) {
        localRev = remoteRev || new Date().toISOString();
        dirty = false;
        saveCfg();
        SYS.Store.viewDay(null);
        SYS.App.applySettings();
        SYS.App.render();
        /* if state arrived while the boot screen was still up, skip the form */
        const boot = document.getElementById('bootScreen');
        const app = document.getElementById('app');
        if (boot && !boot.hidden && SYS.Store.get().started) {
          boot.hidden = true;
          if (app) app.hidden = false;
        }
      }
    } catch (e) {
      console.warn('[SYNC] apply failed:', e);
    } finally {
      applying = false;
    }
    if (ok && (reason === 'first' || reason === 'join')) {
      SYS.UI.notify({ kind: 'ach', title: 'CLOUD SYNC', sub: 'โหลดข้อมูลล่าสุดจาก Cloud แล้ว', icon: 'i-shield' });
      SYS.Sound.play('notify');
    }
    return ok;
  }

  function pullNow(reason) {
    if (!hasConfig()) return Promise.resolve({ ok: false, reason: 'no-config' });
    if (pullBusy) return Promise.resolve({ ok: false, reason: 'busy' });
    pullBusy = true;
    setStatus('syncing');
    const q = TABLE + '?code=eq.' + encodeURIComponent(cfg.c) + '&select=state,rev';
    return api(q).then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(rows => {
      pullBusy = false;
      const row = rows && rows[0];
      if (!row) {
        // remote empty → seed it from this device
        if (SYS.Store.get().started) { localRev = localRev || new Date().toISOString(); saveCfg(); return pushNow(true); }
        setStatus('idle');
        return { ok: true, empty: true };
      }
      const applied = applyRemote(row, reason);
      if (applied) { setStatus('synced'); return { ok: true, applied: true }; }
      if (dirty) return pushNow(true);
      setStatus('synced');
      return { ok: true, noop: true };
    }).catch(err => {
      pullBusy = false;
      setStatus('error', String(err && err.message || err));
      console.warn('[SYNC] pull failed:', err);
      return { ok: false, error: String(err && err.message || err) };
    });
  }

  /* Initial pull used by the boot decision: resolves within ~4.5s always. */
  function pullFirst() {
    if (!hasConfig()) return Promise.resolve({ ok: false, reason: 'no-config' });
    return Promise.race([
      pullNow('first'),
      new Promise(r => setTimeout(() => r({ ok: false, reason: 'timeout' }), 4500))
    ]);
  }

  /* ---------------- store hook ---------------- */
  function onStoreEvent() {
    if (applying || !hasConfig()) return;
    localRev = new Date().toISOString();
    dirty = true;
    saveCfg();
    setStatus('idle');
    schedulePush();
  }

  /* ---------------- join link ---------------- */
  function makeLink() {
    if (!hasConfig()) return '';
    const payload = btoa(JSON.stringify({ u: cfg.u, k: cfg.k, c: cfg.c }));
    return location.origin + location.pathname + '?sync=' + payload + location.hash;
  }

  function consumeJoinParam() {
    let p = null;
    try { p = new URLSearchParams(location.search).get('sync'); } catch (e) { return false; }
    if (!p) return false;
    try {
      const o = JSON.parse(atob(p));
      if (!o || !o.u || !o.k || !o.c) return false;
      cfg = { u: String(o.u).replace(/\/+$/, ''), k: String(o.k), c: String(o.c), joinedAt: new Date().toISOString() };
      localRev = '';
      dirty = false;
      saveCfg();
      history.replaceState(null, '', location.pathname + location.hash);
      return true;
    } catch (e) { return false; }
  }

  function configure(url, key, code) {
    const clean = String(url || '').trim().replace(/\/+$/, '');
    const k = String(key || '').trim();
    const c = String(code || '').trim().toUpperCase();
    if (!/^https?:\/\//.test(clean)) return { ok: false, error: 'URL ต้องขึ้นต้นด้วย http(s)://' };
    if (!k) return { ok: false, error: 'ใส่ anon key ด้วย' };
    if (c.length < 4) return { ok: false, error: 'SYNC CODE ต้องอย่างน้อย 4 ตัวอักษร' };
    cfg = { u: clean, k: k, c: c, joinedAt: (cfg && cfg.joinedAt) || new Date().toISOString() };
    saveCfg();
    setStatus('idle');
    return { ok: true };
  }

  function disconnect() {
    cfg = null; localRev = ''; dirty = false;
    try { localStorage.removeItem(CFG_KEY); } catch (e) {}
    setStatus('off');
  }

  /* ---------------- status label ---------------- */
  function label() {
    if (!hasConfig()) return { text: 'OFF', cls: 'chip-dim' };
    switch (status) {
      case 'syncing': return { text: 'SYNCING…', cls: '' };
      case 'synced': return { text: '☁ SYNCED', cls: 'chip-ok' };
      case 'idle': return { text: dirty ? '☁ PENDING' : '☁ READY', cls: '' };
      case 'error': return { text: '☁ ERROR', cls: 'chip-danger' };
      default: return { text: '☁ READY', cls: '' };
    }
  }

  /* ---------------- lifecycle ---------------- */
  function init() {
    loadCfg();
    const joined = consumeJoinParam();
    SYS.Store.subscribe(onStoreEvent);

    document.addEventListener('visibilitychange', () => { if (!document.hidden) pullNow('focus'); });
    window.addEventListener('focus', () => pullNow('focus'));
    setInterval(() => { if (!document.hidden) pullNow('interval'); }, 60000);
    window.addEventListener('beforeunload', () => {
      if (dirty && hasConfig() && SYS.Store.get().started) {
        try {
          api(TABLE, {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({ code: cfg.c, state: SYS.Store.get(), rev: localRev || new Date().toISOString() }),
            keepalive: true
          });
        } catch (e) { /* ignore */ }
      }
    });

    if (hasConfig()) setStatus('idle');
    if (joined) {
      console.log('[SYNC] joined via link, code =', cfg.c);
    }
    return joined;
  }

  return {
    init, pullNow, pullFirst, pushNow, configure, disconnect,
    makeLink, hasConfig, label, updateChip,
    getConfig: () => cfg,
    getStatus: () => status,
    getError: () => lastError,
    getCode: () => (cfg ? cfg.c : '')
  };
})();
