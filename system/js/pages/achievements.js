/* =========================================================================
   SYSTEM — ACHIEVEMENT PAGE
   ========================================================================= */
window.SYS = window.SYS || {};
SYS.Pages = SYS.Pages || {};

(function () {
  const esc = s => SYS.UI.esc(s);
  const C = () => SYS.CONFIG;
  const Store = () => SYS.Store;
  const U = () => SYS.UI;

  SYS.Pages.achievements = function () {
    const S = Store();
    const st = S.get();
    const d = S.derive();
    const unlocked = st.achievements || {};
    const count = Object.keys(unlocked).length;
    const total = C().achievements.length;

    const cards = C().achievements.map(a => {
      const isOn = !!unlocked[a.id];
      let prog = '';
      if (!isOn && a.progress) {
        try {
          const [cur, max, unit] = a.progress(d);
          const pct = Math.min(100, Math.round((cur / max) * 100));
          prog = `
            <div class="ach-prog">
              <div class="bar bar-sm"><div class="bar-fill" style="width:${pct}%"></div></div>
              <div class="bar-row" style="margin-top:5px"><span>${cur} / ${max}</span><span>${unit}</span></div>
            </div>`;
        } catch (e) { /* progress optional */ }
      }
      return `
        <div class="ach ${isOn ? 'unlocked' : 'locked'}">
          <div class="ach-inner">
            <div class="ach-ic"><svg class="ic"><use href="#${isOn ? a.icon : 'i-lock'}"/></svg></div>
            <div class="ach-name">${esc(a.name)}</div>
            <div class="ach-desc">${esc(a.desc)}</div>
            ${prog}
            <div class="ach-state">${isOn
              ? `UNLOCKED · ${U().fmtTime(unlocked[a.id])} · +${a.exp} EXP`
              : `LOCKED · REWARD ${a.exp} EXP`}</div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="grid grid-3" style="margin-bottom:16px">
        <div class="mini"><span class="k">UNLOCKED</span><span class="v">${count}<small>/${total}</small></span></div>
        <div class="mini"><span class="k">REWARD EARNED</span><span class="v">${
          C().achievements.filter(a => unlocked[a.id]).reduce((s, a) => s + a.exp, 0)}<small> EXP</small></span></div>
        <div class="mini"><span class="k">RAREST</span><span class="v" style="font-size:.8rem">${esc((C().achievements.find(a => !unlocked[a.id]) || { name: 'ALL DONE' }).name)}</span></div>
      </div>
      <div class="sec-title">ACHIEVEMENT <span class="st-sub">${count} / ${total} UNLOCKED</span></div>
      <div class="ach-grid">${cards}</div>`;
  };
})();
