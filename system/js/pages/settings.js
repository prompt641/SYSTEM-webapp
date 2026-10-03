/* =========================================================================
   SYSTEM — SETTINGS PAGE
   ========================================================================= */
window.SYS = window.SYS || {};
SYS.Pages = SYS.Pages || {};

(function () {
  const esc = s => SYS.UI.esc(s);
  const C = () => SYS.CONFIG;
  const Store = () => SYS.Store;
  const U = () => SYS.UI;

  function sw(on, act, key) {
    return `<button class="switch ${on ? 'on' : ''}" data-act="${act}" ${key ? `data-key="${key}"` : ''}
      role="switch" aria-checked="${on}" aria-label="toggle"></button>`;
  }

  SYS.Pages.settings = function () {
    const S = Store();
    const st = S.get();
    const s = st.settings;
    const d = S.derive();
    const syncCfg = SYS.Sync.getConfig();

    return `
      <section class="panel">
        <div class="sec-title">PLAYER PROFILE</div>
        <div class="set-row">
          <div class="set-info"><div class="k">PLAYER NAME</div><div class="d">แสดงบน Dashboard</div></div>
          <div class="row">
            <input class="sys-text" id="setName" type="text" maxlength="24" value="${esc(st.player.name)}" style="width:160px">
            <button class="btn btn-sm btn-primary" data-act="savename">SAVE</button>
          </div>
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">JOURNEY START DATE</div><div class="d">จุดเริ่มต้น DAY 01 / 37</div></div>
          <div class="row">
            <input class="sys-text" id="setDate" type="date" value="${esc(st.journey.startDate)}">
            <button class="btn btn-sm btn-primary" data-act="savedate">SAVE</button>
          </div>
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">CURRENT DAY</div><div class="d">ระบบคำนวณจากวันที่เริ่มอัตโนมัติ</div></div>
          <span class="chip">${U().pad2(d.day)} / ${C().journeyDays}</span>
        </div>
      </section>

      <section class="panel">
        <div class="sec-title">SYSTEM PREFERENCES</div>
        <div class="set-row">
          <div class="set-info"><div class="k">SOUND</div><div class="d">Futuristic SFX เมื่อทำ Quest / Level Up</div></div>
          ${sw(s.sound, 'toggle', 'sound')}
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">NOTIFICATIONS</div><div class="d">[ SYSTEM ] holographic toasts</div></div>
          ${sw(s.notifications, 'toggle', 'notifications')}
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">DARK MODE</div><div class="d">ปิดเพื่อใช้ธีมสว่าง</div></div>
          ${sw(s.dark, 'toggle', 'dark')}
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">ACCENT THEME</div><div class="d">สีโฮโลแกรฟิกของระบบ</div></div>
          <div class="theme-dots">
            ${['blue', 'cyan', 'violet'].map(t => `<button class="dot-holder" data-act="theme" data-theme="${t}"
                style="background:none;border:none;padding:0" aria-label="${t}">
                <span class="tdot ${s.theme === t ? 'active' : ''}" data-t="${t}"></span></button>`).join('')}
          </div>
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">AUDIO ENGINE</div><div class="d">เบราว์เซอร์อาจบล็อกเสียงอัตโนมัติ — กดเพื่ออนุญาต</div></div>
          <button class="btn btn-sm" data-act="enablesound">🔊 ENABLE SOUND</button>
        </div>
      </section>

      <section class="panel">
        <div class="sec-title">DATA BACKUP</div>
        <div class="set-row">
          <div class="set-info"><div class="k">EXPORT DATA</div><div class="d">ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON</div></div>
          <button class="btn btn-sm" data-act="export"><svg class="ic"><use href="#i-download"/></svg> EXPORT</button>
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">IMPORT DATA</div><div class="d">นำเข้าไฟล์ JSON (ระบบจะ Validate ก่อน)</div></div>
          <button class="btn btn-sm" data-act="import"><svg class="ic"><use href="#i-upload"/></svg> IMPORT</button>
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">STORAGE</div><div class="d">LocalStorage · key “${C().storageKey}” · schema v${C().schemaVersion}</div></div>
          <span class="chip">${st.started ? 'PERSISTENT' : 'IDLE'}</span>
        </div>
      </section>

      <section class="panel">
        <div class="sec-title">DANGER ZONE</div>
        <div class="set-row">
          <div class="set-info"><div class="k">RESET DAY</div><div class="d">ล้างความคืบหน้าของวัน ${U().pad2(d.day)} (เก็บ Journey ไว้)</div></div>
          <button class="btn btn-sm btn-ghost" data-act="resetday">RESET DAY</button>
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">RESET JOURNEY</div><div class="d">ล้างข้อมูลทั้งหมด — Level, EXP, History, Achievement</div></div>
          <button class="btn btn-sm btn-danger" data-act="resetjourney">RESET JOURNEY</button>
        </div>
      </section>

      <section class="panel">
        <div class="sec-title">CLOUD SYNC <span class="st-sub">SUPABASE · ซิงก์ข้ามเครื่องอัตโนมัติ</span></div>
        <div class="set-row">
          <div class="set-info"><div class="k">STATUS</div><div class="d">การเชื่อมต่อ cloud ล่าสุด</div></div>
          <span class="chip" id="syncChip">${esc(SYS.Sync.label().text)}</span>
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">SUPABASE URL</div><div class="d">https://xxxx.supabase.co</div></div>
          <input class="sys-text" id="syncUrl" type="url" placeholder="https://xxxx.supabase.co" style="width:250px" value="${esc(syncCfg ? syncCfg.u : '')}">
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">ANON KEY</div><div class="d">Project Settings → API → anon public</div></div>
          <input class="sys-text" id="syncKey" type="text" placeholder="eyJhbGciOi..." style="width:250px" value="${esc(syncCfg ? syncCfg.k : '')}">
        </div>
        <div class="set-row">
          <div class="set-info"><div class="k">SYNC CODE</div><div class="d">รหัสห้องซิงก์ — ใช้ร่วมกันทุกเครื่อง</div></div>
          <div class="row">
            <input class="sys-text" id="syncCode" type="text" maxlength="32" placeholder="AB12CD34EF56" style="width:150px" value="${esc(syncCfg ? syncCfg.c : '')}">
            <button class="btn btn-sm" data-act="syncgen">GENERATE</button>
          </div>
        </div>
        <div class="set-row">
          <div class="row" style="flex-wrap:wrap">
            <button class="btn btn-sm btn-primary" data-act="syncsave">SAVE &amp; CONNECT</button>
            <button class="btn btn-sm" data-act="syncnow">SYNC NOW</button>
            <button class="btn btn-sm" data-act="synclink">COPY JOIN LINK</button>
            <button class="btn btn-sm btn-ghost" data-act="syncoff">DISCONNECT</button>
          </div>
        </div>
        <details class="sync-guide">
          <summary>วิธีตั้งค่า SUPABASE (2 นาที)</summary>
          <ol>
            <li>ไปที่ <b>supabase.com</b> → สมัครบัญชีฟรี → <b>New project</b> (region <b>Southeast Asia</b> เร็วที่สุด)</li>
            <li>เปิด <b>SQL Editor</b> → วางโค้ดด้านล่าง → กด <b>RUN</b></li>
            <li>กลับมาหน้านี้ → ใส่ <b>URL</b> และ <b>anon key</b> (Project Settings → API) → กด <b>GENERATE</b> → <b>SAVE &amp; CONNECT</b></li>
            <li>กด <b>COPY JOIN LINK</b> แล้วเปิดในมือถือ — ข้อมูลจะซิงก์อัตโนมัติทุกครั้งที่ทำ Quest</li>
          </ol>
          <pre id="syncSql">create table if not exists public.system_sync (
  code text primary key,
  state jsonb not null,
  rev text not null default '',
  updated_at timestamptz default now()
);
alter table public.system_sync enable row level security;
create policy "sync_rw" on public.system_sync
  for all using (true) with check (true);</pre>
          <div class="row" style="margin-top:8px">
            <button class="btn btn-sm" data-act="syncsql">COPY SQL</button>
          </div>
        </details>
      </section>

      <section class="panel mb0">
        <div class="sec-title">ABOUT</div>
        <div class="mono dim" style="font-size:.64rem;line-height:1.8">
          SYSTEM v1.0 · PERSONAL LEVELING SYSTEM<br>
          37-DAY JOURNEY · ORIGINAL HOLOGRAPHIC UI<br>
          DATA IS STORED LOCALLY ON THIS DEVICE.
        </div>
      </section>`;
  };

  /* ---------------- settings actions ---------------- */
  SYS.handleSettingsAction = function (act, el) {
    const S = Store();
    const st = S.get();

    switch (act) {
      case 'toggle': {
        const key = el.dataset.key;
        const next = !st.settings[key];
        S.updateSettings({ [key]: next });
        SYS.App.applySettings();
        SYS.Sound.play('click');
        if (key === 'sound' && next) SYS.Sound.play('notify');
        SYS.App.render();
        return true;
      }
      case 'theme': {
        S.updateSettings({ theme: el.dataset.theme });
        SYS.App.applySettings();
        SYS.Sound.play('click');
        SYS.App.render();
        return true;
      }
      case 'savename': {
        const v = document.getElementById('setName').value;
        if (!v.trim()) { SYS.UI.notify({ kind: 'danger', title: 'INVALID NAME' }); SYS.Sound.play('error'); return true; }
        S.setPlayerName(v);
        SYS.Sound.play('notify');
        SYS.UI.notify({ title: 'PROFILE UPDATED', sub: 'PLAYER NAME SAVED' });
        SYS.App.render();
        return true;
      }
      case 'savedate': {
        const v = document.getElementById('setDate').value;
        if (!v) return true;
        SYS.UI.confirmDialog({
          tag: 'CHANGE START DATE',
          body: `<p>Journey start date → <b class="accent">${esc(v)}</b></p>
                 <p class="dim" style="font-size:.84rem">Current day will be recalculated. Existing day records are kept.</p>`,
          confirm: 'UPDATE', danger: false
        }).then(ok => {
          if (!ok) return;
          S.setStartDate(v);
          SYS.Sound.play('notify');
          SYS.UI.notify({ title: 'START DATE UPDATED', sub: v });
          SYS.App.render();
        });
        return true;
      }
      case 'enablesound':
        SYS.Sound.unlock();
        S.updateSettings({ sound: true });
        SYS.App.applySettings();
        SYS.Sound.play('levelup');
        SYS.UI.notify({ title: 'SOUND ENABLED', sub: 'Audio engine online' });
        SYS.App.render();
        return true;
      case 'export': {
        const json = S.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-backup-${S.dateStr(new Date())}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        SYS.Sound.play('notify');
        SYS.UI.notify({ title: 'DATA EXPORTED', sub: 'system-backup.json downloaded', exp: null });
        return true;
      }
      case 'import':
        document.getElementById('importFile').click();
        return true;
      case 'resetday':
        SYS.UI.confirmDialog({
          tag: 'WARNING',
          body: `<p>Reset progress of <b class="accent">DAY ${U().pad2(S.derive().day)}</b>?</p>
                 <p class="dim" style="font-size:.84rem">Quests, habits and EXP earned today will be cleared. Journey history stays.</p>`,
          confirm: 'RESET', danger: true
        }).then(ok => {
          if (!ok) return;
          SYS.App.runAction(() => S.resetDay());
          SYS.UI.notify({ kind: 'warn', title: 'DAY RESET', sub: 'Today’s progress cleared' });
        });
        return true;
      case 'resetjourney':
        SYS.UI.confirmDialog({
          tag: 'WARNING',
          body: `<p style="color:var(--danger);font-family:var(--font-d);letter-spacing:.08em">This will reset your entire 37-Day Journey.</p>
                 <p class="dim" style="font-size:.84rem">Level, EXP, Stats, Achievements และ History ทั้งหมดจะถูกลบ
                 การกระทำนี้ย้อนกลับไม่ได้ — แนะนำให้ EXPORT DATA ก่อน</p>`,
          confirm: 'RESET', danger: true
        }).then(ok => {
          if (!ok) return;
          S.resetJourney();
          SYS.Sound.play('error');
          location.reload();
        });
        return true;

      /* ---------------- cloud sync ---------------- */
      case 'syncgen': {
        let code = '';
        if (window.crypto && crypto.randomUUID) code = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
        else code = Math.random().toString(36).slice(2, 14).toUpperCase();
        const cel = document.getElementById('syncCode');
        if (cel) cel.value = code;
        SYS.Sound.play('click');
        return true;
      }
      case 'syncsave': {
        const r = SYS.Sync.configure(
          (document.getElementById('syncUrl') || {}).value,
          (document.getElementById('syncKey') || {}).value,
          (document.getElementById('syncCode') || {}).value
        );
        if (!r.ok) {
          SYS.UI.notify({ kind: 'danger', title: 'SYNC CONFIG', sub: r.error });
          SYS.Sound.play('error');
          return true;
        }
        SYS.Sound.play('notify');
        SYS.Sync.pullNow('manual').then(res => {
          if (res && res.ok) {
            SYS.UI.notify({ kind: 'ach', title: 'SYNC CONNECTED', sub: 'CODE ' + SYS.Sync.getCode() + (res.applied ? ' · โหลดข้อมูลจาก CLOUD แล้ว' : ''), icon: 'i-shield' });
          } else {
            SYS.UI.notify({ kind: 'warn', title: 'CONNECT SAVED', sub: 'ยังซิงก์ไม่สำเร็จ: ' + ((res && (res.error || res.reason)) || 'unknown') });
          }
          SYS.App.render();
        });
        return true;
      }
      case 'syncnow': {
        SYS.Sound.play('click');
        SYS.Sync.pullNow('manual').then(res => {
          if (res && res.ok && res.applied) SYS.UI.notify({ title: 'PULLED', sub: 'อัปเดตจาก CLOUD แล้ว' });
          else if (res && res.ok) SYS.UI.notify({ title: 'UP TO DATE', sub: 'ข้อมูลตรงกับ CLOUD แล้ว' });
          else SYS.UI.notify({ kind: 'danger', title: 'SYNC FAILED', sub: String((res && (res.error || res.reason)) || '') });
          SYS.App.render();
        });
        return true;
      }
      case 'synclink': {
        const link = SYS.Sync.makeLink();
        if (!link) {
          SYS.UI.notify({ kind: 'danger', title: 'NO SYNC YET', sub: 'CONNECT ก่อนจึงจะสร้างลิงก์ได้' });
          SYS.Sound.play('error');
          return true;
        }
        const okToast = () => {
          SYS.UI.notify({ title: 'JOIN LINK COPIED', sub: 'เปิดลิงก์นี้ในมือถือเพื่อซิงก์ข้อมูล' });
          SYS.Sound.play('notify');
        };
        const showModal = () => SYS.UI.openModal(`
          <div class="modal-tag is-info">[ JOIN LINK ]</div>
          <div class="modal-body">
            <p class="dim" style="margin-top:0">เปิดลิงก์นี้ในมือถือ:</p>
            <input class="sys-input" id="joinLinkBox" readonly value="${esc(link)}" style="width:100%">
          </div>
          <div class="modal-actions"><button class="btn btn-primary" data-modal-action="close">CLOSE</button></div>`);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(okToast, showModal);
        else showModal();
        return true;
      }
      case 'syncoff':
        SYS.Sync.disconnect();
        SYS.Sound.play('click');
        SYS.UI.notify({ kind: 'warn', title: 'SYNC OFF', sub: 'ยกเลิกการเชื่อมต่อ CLOUD แล้ว' });
        SYS.App.render();
        return true;
      case 'syncsql': {
        const pre = document.getElementById('syncSql');
        if (pre && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(pre.textContent).then(() => {
            SYS.UI.notify({ title: 'SQL COPIED', sub: 'นำไปวางใน Supabase SQL Editor แล้วกด RUN' });
            SYS.Sound.play('notify');
          }, () => {});
        }
        return true;
      }
    }
    return false;
  };
})();
