(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const K_RSVP = 'hoh26:rsvp', K_POSTS = 'hoh26:posts', K_SEEN = 'hoh26:opened', K_NAME = 'hoh26:name';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const firstName = n => String(n).trim().split(/[\s&,]+/)[0] || n;

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }

  /* ---------------- Snow & festive shapes ---------------- */
  (function snow() {
    const c = $('#snow'), ctx = c.getContext('2d');
    const svg = b => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${b}</svg>`;
    const GOLD = '#e3c67e';
    const SPRITES = {
      note: svg(`<g fill="${GOLD}"><ellipse cx="14" cy="30" rx="6.5" ry="4.6" transform="rotate(-22 14 30)"/><rect x="18.6" y="5" width="2.4" height="25" rx="1"/><path d="M21 5c1.5 6 9.5 7 9 15-1.5-4.5-4.5-6-9-7z"/></g>`),
      notes: svg(`<g fill="${GOLD}"><ellipse cx="10" cy="31" rx="5.6" ry="4" transform="rotate(-22 10 31)"/><ellipse cx="28" cy="27" rx="5.6" ry="4" transform="rotate(-22 28 27)"/><rect x="13.9" y="9" width="2.2" height="22"/><rect x="31.9" y="5" width="2.2" height="22"/><path d="M13.9 9 34.1 5v5.2L13.9 14.2z"/></g>`),
      mistletoe: svg(`<path d="M20 4v17" stroke="#3f6f4a" stroke-width="1.8" stroke-linecap="round"/><path d="M20 20C13 19 6 15 4 8c7 1 13 5 16 12z" fill="#6aa877"/><path d="M20 20c7-1 14-5 16-12-7 1-13 5-16 12z" fill="#549660"/><path d="M20 21c-4 3-9 5-13 4 3-4 8-6 13-4z" fill="#4c8a58"/><path d="M20 21c4 3 9 5 13 4-3-4-8-6-13-4z" fill="#5f9f6c"/><g fill="#f6f2e2" stroke="#d9d2b8" stroke-width=".6"><circle cx="16.5" cy="25" r="3.2"/><circle cx="23.5" cy="25" r="3.2"/><circle cx="20" cy="30" r="3.2"/></g><g fill="#fff" opacity=".8"><circle cx="15.6" cy="24" r="1"/><circle cx="22.6" cy="24" r="1"/><circle cx="19.1" cy="29" r="1"/></g>`),
      holly: svg(`<path d="M6 32c2-3 1-6 4-7-1-3 1-6 4-6 0-3 3-5 6-4 1-3 4-4 7-3 1-3 4-4 7-3-1 3 1 6-2 8 1 3-1 6-4 6 0 3-3 5-6 4-1 3-4 4-7 3-1 3-4 4-7 3-1 0-1-1-2-1z" fill="#3f7d52"/><path d="M8 31 32 9" stroke="#2d5e3c" stroke-width="1.2"/><circle cx="30" cy="30" r="4" fill="#b3232d"/><circle cx="24" cy="33" r="4" fill="#9c1c25"/><circle cx="29" cy="29" r="1.2" fill="#fff" opacity=".6"/>`),
      star: svg(`<path fill="${GOLD}" d="M20 4l4.4 10.2 11 .9-8.4 7.2 2.6 10.8L20 27.4l-9.6 5.7 2.6-10.8-8.4-7.2 11-.9z"/>`),
      bauble: svg(`<defs><radialGradient id="g" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#d64550"/><stop offset=".55" stop-color="#a3202a"/><stop offset="1" stop-color="#6d1219"/></radialGradient></defs><path d="M20 3a3 3 0 0 1 0 6" fill="none" stroke="${GOLD}" stroke-width="1.6"/><rect x="16" y="8" width="8" height="5" rx="1" fill="${GOLD}"/><circle cx="20" cy="25" r="12.5" fill="url(#g)"/><path d="M8.5 23c7 3 16 3 23 0" stroke="${GOLD}" stroke-width="1.4" fill="none" opacity=".9"/><ellipse cx="15.5" cy="19" rx="3" ry="2" fill="#fff" opacity=".45"/>`),
    };
    const WEIGHTS = [['note', 3], ['notes', 3], ['mistletoe', 3], ['holly', 2], ['star', 2], ['bauble', 2]];
    const TOTAL = WEIGHTS.reduce((a, [, n]) => a + n, 0);
    const imgs = {};
    for (const [k, v] of Object.entries(SPRITES)) {
      const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(v); imgs[k] = im;
    }
    const pick = () => { let r = Math.random() * TOTAL; for (const [k, n] of WEIGHTS) { if ((r -= n) < 0) return k; } return 'note'; };

    let w, h, dpr, flakes = [], orns = [];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
      w /= dpr; h /= dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = w * h;
      const n = reduceMotion ? 30 : Math.round(Math.min(95, area / 10000));
      const m = Math.round(Math.max(6, Math.min(16, area / 45000)));
      while (flakes.length < n) flakes.push(flake(true));
      flakes.length = n;
      while (orns.length < m) orns.push(orn(true));
      orns.length = m;
    }
    function flake(anywhere) {
      const r = Math.random() ** 2 * 2.6 + .6;
      return { x: Math.random() * w, y: anywhere ? Math.random() * h : -10, r,
        vy: .25 + r * .28, sway: Math.random() * Math.PI * 2, swaySp: .004 + Math.random() * .01,
        a: .35 + Math.random() * .55, gold: Math.random() < .12 };
    }
    function orn(anywhere) {
      const s = 18 + Math.random() * 12;
      return { k: pick(), s, x: Math.random() * w, y: anywhere ? Math.random() * h : -s - 10,
        vy: .3 + Math.random() * .3, sway: Math.random() * Math.PI * 2, swaySp: .006 + Math.random() * .008,
        rot: (Math.random() - .5) * .8, vr: (Math.random() - .5) * .01, a: .7 + Math.random() * .25 };
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        ctx.beginPath();
        ctx.fillStyle = f.gold ? `rgba(230,205,140,${f.a})` : `rgba(255,255,255,${f.a})`;
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const o of orns) {
        const im = imgs[o.k];
        if (!im.complete || !im.naturalWidth) continue;
        ctx.save();
        ctx.globalAlpha = o.a;
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot + Math.sin(o.sway) * .25);
        ctx.drawImage(im, -o.s / 2, -o.s / 2, o.s, o.s);
        ctx.restore();
      }
    }
    function tick() {
      for (const f of flakes) {
        f.sway += f.swaySp; f.y += f.vy; f.x += Math.sin(f.sway) * .35;
        if (f.y > h + 10) Object.assign(f, flake(false));
        if (f.x > w + 10) f.x = -10; else if (f.x < -10) f.x = w + 10;
      }
      for (const o of orns) {
        o.sway += o.swaySp; o.y += o.vy; o.x += Math.sin(o.sway) * .45; o.rot += o.vr;
        if (o.y > h + o.s + 10) Object.assign(o, orn(false));
        if (o.x > w + 30) o.x = -30; else if (o.x < -30) o.x = w + 30;
      }
      draw();
      if (!document.hidden) requestAnimationFrame(tick);
    }
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduceMotion) requestAnimationFrame(tick); });
    resize();
    if (reduceMotion) { draw(); Object.values(imgs).forEach(im => im.addEventListener('load', draw)); }
    else requestAnimationFrame(tick);
  })();

  /* ---------------- Envelope ---------------- */
  const stage = $('#stage'), env = $('#envelope'), invite = $('#invite');
  function showInvite(animate) {
    invite.hidden = false;
    if (animate) invite.classList.add('reveal');
    stage.classList.add('gone');
    setTimeout(() => stage.remove(), 900);
    if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 60);
  }
  const deepLink = /^#(rsvp|wall)$/.test(location.hash);
  if (store.get(K_SEEN) || deepLink) {
    showInvite(false);
  } else {
    env.addEventListener('click', () => {
      if (env.classList.contains('open')) return;
      store.set(K_SEEN, true);
      stage.classList.add('opening');
      env.classList.add('open');
      if (navigator.vibrate) try { navigator.vibrate(12); } catch {}
      const t = reduceMotion ? [0, 0, 0] : [700, 1150, 2250];
      setTimeout(() => env.classList.add('flap-behind'), t[0]);
      setTimeout(() => env.classList.add('card-out'), t[1]);
      setTimeout(() => { window.scrollTo(0, 0); showInvite(true); }, t[2]);
    }, { once: false });
    // Tapping anywhere on the envelope screen (e.g. "Tap to open") opens it too
    stage.addEventListener('click', e => { if (!env.contains(e.target)) env.click(); });
  }

  /* ---------------- Calendar menu ---------------- */
  const calBtn = $('#calBtn'), calMenu = $('#calMenu');
  calBtn.addEventListener('click', e => {
    e.stopPropagation();
    calMenu.hidden = !calMenu.hidden;
    calBtn.setAttribute('aria-expanded', String(!calMenu.hidden));
  });
  document.addEventListener('click', () => { calMenu.hidden = true; calBtn.setAttribute('aria-expanded', 'false'); });

  /* ---------------- RSVP ---------------- */
  const form = $('#rsvpForm'), done = $('#rsvpDone'), err = $('#rsvpError'), out = $('#partyOut');
  let party = 1;
  const setParty = n => { party = Math.max(1, Math.min(20, n)); out.textContent = party; };
  form.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => setParty(party + Number(b.dataset.step))));
  form.addEventListener('change', e => {
    if (e.target.name === 'status') form.classList.toggle('declined', e.target.value === 'no');
  });

  function fillForm(r) {
    if (!r) return;
    form.elements.namedItem('name').value = r.name || '';
    form.elements.namedItem('dietary').value = r.dietary || '';
    form.elements.namedItem('note').value = r.note || '';
    setParty(r.party || 1);
    const radio = form.querySelector(`input[name=status][value="${r.status}"]`);
    if (radio) { radio.checked = true; form.classList.toggle('declined', r.status === 'no'); }
  }
  function showDone(r) {
    const n = `<strong>${esc(firstName(r.name))}</strong>`;
    const msg = {
      yes: `Wonderful, ${n} — we can’t wait to see ${r.party > 1 ? `all ${r.party} of you` : 'you'}!`,
      maybe: `Thank you, ${n}. We do hope you can make it.`,
      no: `We’ll miss you, ${n}. Thank you for letting us know.`,
    }[r.status];
    $('#doneMsg').innerHTML = msg;
    form.hidden = true; done.hidden = false;
  }
  const saved = store.get(K_RSVP);
  if (saved) { fillForm(saved); showDone(saved); }
  $('#changeReply').addEventListener('click', () => { done.hidden = true; form.hidden = false; form.elements.namedItem('name').focus(); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    err.hidden = true;
    const status = form.querySelector('input[name=status]:checked')?.value;
    const payload = {
      status, party,
      name: form.elements.namedItem('name').value.trim(),
      dietary: form.elements.namedItem('dietary').value.trim(),
      note: form.elements.namedItem('note').value.trim(),
      website: form.elements.namedItem('website').value,
    };
    if (!status) return showErr(err, 'Please choose Yes, Maybe or No.');
    if (!payload.name) { form.elements.namedItem('name').focus(); return showErr(err, 'Please add your name.'); }
    const prev = store.get(K_RSVP);
    if (prev) { payload.id = prev.id; payload.token = prev.token; }
    const btn = $('#rsvpSubmit'); btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const r = await api('/api/rsvp', { method: 'POST', body: payload });
      const record = { ...payload, id: r.id, token: r.token, party: r.guest.party };
      delete record.website;
      store.set(K_RSVP, record);
      store.set(K_NAME, record.name);
      if (!wallForm.elements.namedItem('name').value) wallForm.elements.namedItem('name').value = record.name;
      showDone(record);
      toast(prev ? 'Your reply has been updated' : 'Thank you — reply sent');
      $('#rsvp').scrollIntoView({ behavior: 'smooth', block: 'start' });
      load();
    } catch (ex) {
      showErr(err, ex.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Send my reply';
    }
  });
  function showErr(el, m) { el.textContent = m; el.hidden = false; }

  /* ---------------- Guest list & wall ---------------- */
  const wallForm = $('#wallForm'), wallErr = $('#wallError');
  wallForm.elements.namedItem('name').value = store.get(K_NAME, '') || '';
  const myPosts = () => store.get(K_POSTS, {});

  function rel(ts) {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
    return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function render({ guests, comments }) {
    const yes = guests.filter(g => g.status === 'yes');
    const maybe = guests.filter(g => g.status === 'maybe');
    const total = yes.reduce((a, g) => a + (g.party || 1), 0);
    $('#tally').textContent = total
      ? `${total} ${total === 1 ? 'guest' : 'guests'} attending`
      : 'Be the first to reply';
    $('#guestList').innerHTML = yes.length
      ? yes.map(g => `<li><span>${esc(g.name)}</span>${g.party > 1 ? `<span class="n">(${g.party})</span>` : ''}</li>`).join('')
      : '<li class="empty">The guest list is waiting for you…</li>';
    const ml = $('#maybeList');
    ml.hidden = !maybe.length;
    ml.textContent = maybe.length ? `Hoping to make it: ${maybe.map(g => g.name).join(', ')}` : '';

    const mine = myPosts();
    $('#posts').innerHTML = comments.length
      ? comments.map(c => `
        <li class="post">
          <p>${esc(c.message)}</p>
          <footer><span><b>${esc(c.name)}</b> · ${rel(c.createdAt)}</span>
          ${mine[c.id] ? `<button class="del" data-id="${esc(c.id)}">Delete</button>` : ''}</footer>
        </li>`).join('')
      : '<li class="empty">No messages yet — say hello!</li>';
  }

  let lastJSON = '';
  async function load() {
    try {
      const data = await api('/api/state');
      const j = JSON.stringify(data);
      if (j !== lastJSON) { lastJSON = j; render(data); }
    } catch { /* keep showing what we have */ }
  }
  load();
  setInterval(() => { if (!document.hidden) load(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });

  wallForm.addEventListener('submit', async e => {
    e.preventDefault();
    wallErr.hidden = true;
    const name = wallForm.elements.namedItem('name').value.trim(), message = wallForm.elements.namedItem('message').value.trim();
    if (!name) { wallForm.elements.namedItem('name').focus(); return showErr(wallErr, 'Please add your name.'); }
    if (!message) { wallForm.elements.namedItem('message').focus(); return showErr(wallErr, 'Please write a message.'); }
    const btn = wallForm.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      const r = await api('/api/comment', { method: 'POST', body: { name, message, website: wallForm.elements.namedItem('website').value } });
      if (r.comment) { const m = myPosts(); m[r.comment.id] = r.token; store.set(K_POSTS, m); }
      store.set(K_NAME, name);
      wallForm.elements.namedItem('message').value = '';
      toast('Message posted');
      await load();
    } catch (ex) { showErr(wallErr, ex.message); }
    finally { btn.disabled = false; }
  });

  $('#posts').addEventListener('click', async e => {
    const b = e.target.closest('.del'); if (!b) return;
    if (!confirm('Delete your message?')) return;
    const m = myPosts();
    try {
      await api('/api/comment', { method: 'DELETE', body: { id: b.dataset.id, token: m[b.dataset.id] } });
      delete m[b.dataset.id]; store.set(K_POSTS, m);
      toast('Message deleted'); load();
    } catch (ex) { toast(ex.message); }
  });
})();
