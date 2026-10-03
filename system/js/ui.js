/* =========================================================================
   SYSTEM — UI PRIMITIVES
   Holographic notifications, modals, level-up overlay, progress bars,
   floating EXP text and small animations.
   ========================================================================= */
window.SYS = window.SYS || {};

SYS.UI = (function () {
  const $ = id => document.getElementById(id);

  /* ---------------- helpers ---------------- */
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function fmtTime(iso) {
    if (!iso) return '--:--';
    const d = new Date(iso);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  function fmtClock(d) { d = d || new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }

  /* ---------------- notifications ([ SYSTEM ] toasts) ---------------- */
  function notify(opts) {
    const stack = $('toastStack');
    if (!stack) return;
    const kind = opts.kind || 'info';
    const icon = opts.icon || 'i-bolt';
    const node = el(`
      <div class="toast toast-${kind}" role="status">
        <div class="toast-glow"></div>
        <div class="toast-head">[ SYSTEM ]</div>
        <div class="toast-title">${esc(opts.title || '')}</div>
        ${opts.sub ? `<div class="toast-sub">${esc(opts.sub)}</div>` : ''}
        ${opts.exp ? `<div class="toast-exp">+${esc(opts.exp)} EXP</div>` : ''}
        <div class="toast-bar"><i></i></div>
      </div>`);
    stack.appendChild(node);
    requestAnimationFrame(() => node.classList.add('in'));
    const life = opts.sticky ? 6000 : (opts.long ? 4200 : 3000);
    setTimeout(() => {
      node.classList.remove('in');
      node.classList.add('out');
      setTimeout(() => node.remove(), 400);
    }, life);
    // cap stack
    while (stack.children.length > 4) stack.firstChild.remove();
    return node;
  }

  /* ---------------- modal / confirm dialog ---------------- */
  let modalResolve = null;
  function openModal(html, onClick) {
    const ov = $('modalOverlay'), box = $('modalBox');
    box.innerHTML = html;
    ov.hidden = false;
    requestAnimationFrame(() => ov.classList.add('in'));
    box.onclick = e => {
      const btn = e.target.closest('[data-modal-action]');
      if (!btn) return;
      const action = btn.dataset.modalAction;
      if (onClick) {
        const keep = onClick(action, e);
        if (keep === 'keep') return;
      }
      if (action !== 'keep') closeModal();
    };
    return box;
  }
  function closeModal() {
    const ov = $('modalOverlay');
    if (!ov || ov.hidden) return;
    ov.classList.remove('in');
    setTimeout(() => { ov.hidden = true; $('modalBox').innerHTML = ''; }, 220);
    if (modalResolve) { modalResolve(false); modalResolve = null; }
  }
  function confirmDialog({ tag = 'WARNING', body = '', confirm = 'CONFIRM', cancel = 'CANCEL', danger = true }) {
    return new Promise(resolve => {
      modalResolve = resolve;
      openModal(`
        <div class="modal-tag ${danger ? 'is-danger' : 'is-info'}">[ ${esc(tag)} ]</div>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-modal-action="cancel">${esc(cancel)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-modal-action="ok">${esc(confirm)}</button>
        </div>`, action => {
        if (action === 'ok') { modalResolve = null; resolve(true); }
        else if (action === 'cancel') { modalResolve = null; resolve(false); }
      });
    });
  }

  /* ---------------- level up overlay ---------------- */
  let luTimer = null;
  function levelUp(level, delta) {
    const ov = $('levelupOverlay');
    $('levelupNum').textContent = pad2(level);
    $('levelupSub').textContent = `+${delta || 1} LEVEL`;
    ov.hidden = false;
    ov.classList.remove('in');
    requestAnimationFrame(() => ov.classList.add('in'));
    burst();
    clearTimeout(luTimer);
    luTimer = setTimeout(closeLevelUp, 3400);
  }
  function closeLevelUp() {
    const ov = $('levelupOverlay');
    if (!ov || ov.hidden) return;
    ov.classList.remove('in');
    setTimeout(() => { ov.hidden = true; }, 500);
  }

  /* light particle burst (canvas, self-cleaning) */
  function burst() {
    const cv = $('levelupCanvas');
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = w / 2, cy = h / 2;
    const parts = [];
    const N = 70;
    for (let i = 0; i < N; i++) {
      const a = (Math.PI * 2 * i) / N + Math.random() * 0.2;
      const sp = 2.4 + Math.random() * 5.2;
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 1, size: 1 + Math.random() * 2.4,
        hue: 195 + Math.random() * 30
      });
    }
    let raf, last = performance.now();
    function frame(t) {
      const dt = Math.min(48, t - last); last = t;
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      parts.forEach(p => {
        if (p.life <= 0) return;
        alive++;
        p.x += p.vx * dt / 16;
        p.y += p.vy * dt / 16;
        p.vx *= 0.975; p.vy *= 0.975;
        p.life -= 0.014 * dt / 16;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = `hsl(${p.hue} 100% 68%)`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1;
      if (alive > 0) raf = requestAnimationFrame(frame);
      else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, w, h); }
    }
    raf = requestAnimationFrame(frame);
  }

  /* ---------------- floating +EXP text ---------------- */
  function floatExp(amount, anchor) {
    const layer = $('flashLayer');
    if (!layer || !amount) return;
    const r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
    const node = el(`<div class="float-exp">+${amount} EXP</div>`);
    if (r) {
      node.style.left = `${Math.min(window.innerWidth - 90, r.left + r.width / 2)}px`;
      node.style.top = `${Math.max(10, r.top - 6)}px`;
    } else {
      node.style.left = '50%'; node.style.top = '22%';
    }
    layer.appendChild(node);
    setTimeout(() => node.remove(), 1400);
  }

  /* ---------------- progress bars (animated width) ---------------- */
  function setBar(node, pct) {
    if (!node) return;
    const v = Math.max(0, Math.min(100, pct));
    node.style.width = v + '%';
    node.parentElement && node.parentElement.setAttribute('aria-valuenow', Math.round(v));
  }

  /* small complete pop applied to a quest card */
  function flashCard(sel) {
    const node = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!node) return;
    node.classList.remove('flash');
    void node.offsetWidth;
    node.classList.add('flash');
    setTimeout(() => node.classList.remove('flash'), 1200);
  }

  return {
    el, esc, pad2, fmtTime, fmtClock, greeting,
    notify, openModal, closeModal, confirmDialog,
    levelUp, closeLevelUp, floatExp, setBar, flashCard
  };
})();
