(() => {
  'use strict';
  const d = document, root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- toast ---------- */
  const toastEl = $('.toast');
  let toastT;
  const toast = msg => { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('is-show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-show'), 2200); };

  /* ---------- theme + accent ---------- */
  const metaTheme = $('meta[name="theme-color"]');
  const paintMeta = () => metaTheme && metaTheme.setAttribute('content', root.dataset.theme === 'dark' ? '#0c0b0a' : '#efe5d3');
  const setTheme = (t, persist = true) => {
    const apply = () => { root.dataset.theme = t; paintMeta(); };
    if (d.startViewTransition && !reduce) d.startViewTransition(apply); else apply();
    if (persist) store.set('shah-theme', t);
  };
  const toggleTheme = () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  paintMeta();
  $$('.theme-toggle').forEach(b => b.addEventListener('click', toggleTheme));
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', e => { if (!store.get('shah-theme')) setTheme(e.matches ? 'dark' : 'light', false); });

  const setAccent = a => {
    if (a === 'orange') delete root.dataset.accent; else root.dataset.accent = a;
    store.set('shah-accent', a);
    $$('[data-accent-set]').forEach(s => s.classList.toggle('is-active', s.dataset.accentSet === a));
  };
  $$('[data-accent-set]').forEach(s => {
    s.classList.toggle('is-active', s.dataset.accentSet === (root.dataset.accent || 'orange'));
    s.addEventListener('click', () => setAccent(s.dataset.accentSet));
  });

  /* ---------- boot loader ---------- */
  const boot = $('.boot');
  const ready = () => { d.body.classList.add('is-ready'); counters(); };
  if (boot) {
    const seen = sessionStorage.getItem('shah-booted');
    const lines = $$('.boot__log li', boot), bar = $('.boot__bar i', boot), pct = $('[data-boot-pct]', boot);
    const total = reduce ? 300 : seen ? 800 : 2300;
    const start = performance.now();
    let loaded = d.readyState === 'complete', done = false;
    window.addEventListener('load', () => { loaded = true; });
    const finish = () => {
      if (done) return; done = true;
      sessionStorage.setItem('shah-booted', '1');
      if (bar) bar.style.width = '100%'; if (pct) pct.textContent = '100%';
      lines.forEach(l => l.classList.add('is-on', 'is-ok'));
      setTimeout(() => { boot.classList.add('is-done'); ready(); setTimeout(() => boot.classList.add('is-gone'), 1000); }, 180);
      d.removeEventListener('keydown', finish); boot.removeEventListener('click', finish);
    };
    const tick = now => {
      if (done) return;
      const t = Math.min(1, (now - start) / total);
      const p = Math.round((loaded ? t : Math.min(t, .9)) * 100);
      if (bar) bar.style.width = p + '%'; if (pct) pct.textContent = p + '%';
      lines.forEach((l, i) => { const at = i / lines.length; l.classList.toggle('is-on', t >= at); l.classList.toggle('is-ok', t >= at + 1 / lines.length); });
      if ((t >= 1 && loaded) || now - start > 5000) finish(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    d.addEventListener('keydown', finish); boot.addEventListener('click', finish);
  } else {
    requestAnimationFrame(ready);
  }

  /* ---------- clock + year + age ---------- */
  const clocks = $$('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' });
  const tickClock = () => clocks.forEach(c => (c.textContent = fmt.format(new Date())));
  if (clocks.length) { tickClock(); setInterval(tickClock, 30000); }
  $$('[data-year]').forEach(y => (y.textContent = new Date().getFullYear()));
  $$('[data-age]').forEach(el => {
    const b = new Date(el.dataset.age), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    el.textContent = a + ' years';
  });

  /* ---------- typed role ---------- */
  const typed = $('[data-typed]');
  if (typed && !reduce) {
    const words = typed.dataset.typed.split('|');
    let w = 0, c = words[0].length, del = true;
    const step = () => {
      const word = words[w];
      typed.textContent = word.slice(0, c);
      let delay = del ? 35 : 70;
      if (del && c === 0) { del = false; w = (w + 1) % words.length; delay = 300; }
      else if (!del && c === words[w].length) { del = true; delay = 2200; }
      c += del ? -1 : 1;
      if (!del && c > words[w].length) c = words[w].length;
      setTimeout(step, delay);
    };
    setTimeout(step, 2600);
  }

  /* ---------- counters ---------- */
  function counters() {
    $$('[data-count]').forEach(el => {
      const to = +el.dataset.count, dur = reduce ? 0 : 1400, s = performance.now();
      const f = now => { const t = dur ? Math.min(1, (now - s) / dur) : 1; el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))) + (t === 1 && el.dataset.suffix ? el.dataset.suffix : ''); if (t < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
  }

  /* ---------- header: progress, back-to-top, active link, mobile menu ---------- */
  const prog = $('.progress'), top = $('.fab--top'), ring = top && $('.ring rect', top);
  if (ring) { ring.style.strokeDasharray = '100'; ring.style.strokeDashoffset = '100'; }
  let raf;
  const onScroll = () => {
    raf = null;
    const h = d.documentElement.scrollHeight - innerHeight, p = h > 0 ? scrollY / h : 0;
    if (prog) prog.style.transform = `scaleX(${p})`;
    if (ring) ring.style.strokeDashoffset = String(100 - p * 100);
    if (top) top.classList.toggle('is-visible', scrollY > 600);
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();
  top && top.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  const nav = $('#nav'), menuBtn = $('.menu-btn');
  const closeMenu = () => { if (!nav) return; nav.classList.remove('is-open'); menuBtn && menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn && menuBtn.addEventListener('click', () => { const o = nav.classList.toggle('is-open'); menuBtn.setAttribute('aria-expanded', String(o)); });
  $$('.nav__link').forEach(a => a.addEventListener('click', closeMenu));

  const links = $$('.nav__link[href^="#"]');
  if (links.length && 'IntersectionObserver' in window) {
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && map.has(e.target.id)) { links.forEach(l => l.classList.remove('is-active')); map.get(e.target.id).classList.add('is-active'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = d.getElementById(id); s && io.observe(s); });
  }

  /* ---------- reveal ---------- */
  const reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el, i) => { el.style.transitionDelay = ((i % 3) * 70) + 'ms'; io.observe(el); });
  } else reveals.forEach(el => el.classList.add('is-in'));

  /* ---------- experience accordion ---------- */
  $$('.commit__head').forEach(h => h.addEventListener('click', () => {
    const c = h.closest('.commit'), o = c.classList.toggle('is-open');
    h.setAttribute('aria-expanded', String(o));
  }));

  /* ---------- volunteer nodes ---------- */
  $$('.node').forEach(n => n.addEventListener('click', () => {
    const wrap = n.closest('.window__body');
    $$('.node', wrap).forEach(x => { x.classList.toggle('is-active', x === n); x.setAttribute('aria-pressed', String(x === n)); });
    $$('.node-panel', wrap).forEach(p => p.classList.toggle('is-active', p.dataset.panel === n.dataset.node));
  }));

  /* ---------- project filters ---------- */
  $$('[data-filter]').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.filter, grid = $('[data-filter-target]');
    $$('[data-filter]').forEach(x => x.classList.toggle('is-active', x === b));
    $$('.proj', grid).forEach(p => p.classList.toggle('is-hidden', f !== 'all' && !p.dataset.cat.split(' ').includes(f)));
  }));

  /* ---------- certificate search + filter ---------- */
  const certSearch = $('[data-cert-search]'), certs = $$('.cert'), empty = $('[data-cert-empty]');
  let certCat = 'all';
  const applyCerts = () => {
    const q = (certSearch ? certSearch.value : '').trim().toLowerCase(); let shown = 0;
    certs.forEach(c => { const ok = (certCat === 'all' || c.dataset.cat === certCat) && (!q || c.dataset.title.toLowerCase().includes(q)); c.classList.toggle('is-hidden', !ok); if (ok) shown++; });
    if (empty) empty.hidden = shown > 0;
  };
  certSearch && certSearch.addEventListener('input', applyCerts);
  $$('[data-cert-filter]').forEach(b => b.addEventListener('click', () => {
    certCat = b.dataset.certFilter; $$('[data-cert-filter]').forEach(x => x.classList.toggle('is-active', x === b)); applyCerts();
  }));

  /* ---------- modals ---------- */
  let lastFocus;
  const openModal = m => {
    if (!m) return; lastFocus = d.activeElement;
    m.hidden = false; requestAnimationFrame(() => m.classList.add('is-open'));
    root.style.overflow = 'hidden';
    const f = $('input, [data-close]', m); f && setTimeout(() => f.focus(), 60);
  };
  const closeModal = m => {
    if (!m || m.hidden) return; m.classList.remove('is-open');
    setTimeout(() => { m.hidden = true; }, 250);
    if (!$$('.modal.is-open').length) root.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus();
  };
  $$('[data-modal-open]').forEach(b => b.addEventListener('click', () => openModal(d.getElementById(b.dataset.modalOpen))));
  $$('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) closeModal(m); });
  });

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox');
  let group = [], idx = 0;
  const lbShow = () => {
    const it = group[idx]; if (!it || !lb) return;
    const img = $('img', lb); img.src = it.dataset.src; img.alt = it.dataset.title || '';
    $('[data-lb-title]', lb).textContent = it.dataset.title || 'preview';
    $('[data-lb-count]', lb).textContent = `${idx + 1} / ${group.length}`;
    $$('.lb-nav', lb).forEach(n => (n.hidden = group.length < 2));
  };
  const lbOpen = el => {
    const g = el.dataset.lightbox;
    group = $$(`[data-lightbox="${g}"]`).filter(x => !x.classList.contains('is-hidden'));
    idx = Math.max(0, group.indexOf(el)); lbShow(); openModal(lb);
  };
  $$('[data-lightbox]').forEach(el => el.addEventListener('click', () => lbOpen(el)));
  if (lb) {
    $('.lb-prev', lb).addEventListener('click', () => { idx = (idx - 1 + group.length) % group.length; lbShow(); });
    $('.lb-next', lb).addEventListener('click', () => { idx = (idx + 1) % group.length; lbShow(); });
  }

  /* ---------- recommendations ---------- */
  const preview = $('.endorse__preview'), items = $$('.endorse__item');
  items.forEach((it, i) => it.addEventListener('click', () => {
    items.forEach(x => x.classList.toggle('is-active', x === it));
    const img = $('img', preview); preview.classList.add('is-swapping');
    setTimeout(() => { img.src = it.dataset.src; img.alt = it.dataset.title; img.onload = () => preview.classList.remove('is-swapping'); }, 180);
    preview.dataset.idx = i;
  }));
  if (preview) preview.addEventListener('click', () => {
    group = items.map(x => x); idx = +(preview.dataset.idx || 0);
    group.forEach(x => { x.dataset.lightbox = x.dataset.lightbox || 'letters'; });
    lbShow(); openModal(lb);
  });

  /* ---------- copy ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('Copied ' + b.dataset.copy); }
    catch (e) { toast('Copy failed — ' + b.dataset.copy); }
  }));

  /* ---------- lazy contact form ---------- */
  const ff = $('.form-frame[data-src]');
  if (ff && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) {
      io.disconnect();
      const ifr = d.createElement('iframe'); ifr.src = ff.dataset.src; ifr.title = 'Contact form'; ifr.loading = 'lazy';
      const ld = d.createElement('div'); ld.className = 'loading'; ld.textContent = 'establishing secure connection…';
      ifr.addEventListener('load', () => ff.classList.add('is-loaded'));
      ff.replaceChildren(ld, ifr);
    } }, { rootMargin: '400px' });
    io.observe(ff);
  }

  /* ---------- terminal ---------- */
  const term = $('#terminal');
  if (term) {
    const out = $('.term-out', term), input = $('input', term);
    const print = (html, cls = '') => { const p = d.createElement('div'); if (cls) p.className = cls; p.innerHTML = html; out.appendChild(p); out.scrollTop = out.scrollHeight; };
    const go = url => { closeModal(term); setTimeout(() => { location.href = url; }, 220); };
    const cmds = {
      help: () => print('<span class="m">commands:</span> whoami · home · about · resume · portfolio · projects · blog · contact · pdf · theme [light|dark] · accent [orange|violet|teal|pink|blue] · socials · shahhub · clear · exit'),
      whoami: () => print('Shah Htet Naing — IT Network Analyst · Cybersecurity · Ph.D. researcher (Digital Forensics) · Singapore'),
      home: () => go('index.html'), about: () => go('about.html'), resume: () => go('resume.html'), experience: () => go('resume.html'),
      portfolio: () => go('portfolio.html'), certs: () => go('portfolio.html'), projects: () => go('projects.html'), work: () => go('projects.html'),
      blog: () => go('blog.html'), contact: () => go('contact.html'),
      pdf: () => { open($('.header-actions .btn')?.href, '_blank', 'noopener'); print('<span class="ok">✔</span> opening resume PDF…'); },
      shahhub: () => { open('https://shahhubtools.base44.app/', '_blank', 'noopener'); print('<span class="ok">✔</span> launching SHAHHUB…'); },
      socials: () => print('<a href="https://www.linkedin.com/in/shah-htet-naing" target="_blank" rel="noopener">linkedin</a> · <a href="https://www.youtube.com/@ShahsHaven" target="_blank" rel="noopener">youtube</a> · <a href="mailto:shahhtetnaing@gmail.com">email</a>'),
      theme: a => { const t = a === 'light' || a === 'dark' ? a : (root.dataset.theme === 'dark' ? 'light' : 'dark'); setTheme(t); print(`<span class="ok">✔</span> theme → ${t}`); },
      accent: a => { const ok = ['orange', 'violet', 'teal', 'pink', 'blue']; if (!ok.includes(a)) return print('usage: accent ' + ok.join('|')); setAccent(a); print(`<span class="ok">✔</span> accent → ${a}`); },
      sudo: () => print('nice try. this incident will be reported. 🙂'),
      clear: () => (out.innerHTML = ''), exit: () => closeModal(term),
    };
    const run = raw => {
      const v = raw.trim(); if (!v) return;
      print(`<span class="c">shah@os:~$</span> ${v.replace(/</g, '&lt;')}`);
      const [c, a] = v.toLowerCase().split(/\s+/);
      (cmds[c] || (() => print(`command not found: ${c.replace(/</g, '&lt;')} — try <span class="m">help</span>`)))(a);
    };
    let hist = [], hi = 0;
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { hist.push(input.value); hi = hist.length; run(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp' && hi > 0) { input.value = hist[--hi]; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
      else if (e.key === 'Tab') { e.preventDefault(); const m = Object.keys(cmds).find(k => k.startsWith(input.value)); if (m) input.value = m; }
    });
    $$('.term-hints button', term).forEach(b => b.addEventListener('click', () => { run(b.textContent); input.focus(); }));
    print('SHAH.OS v4.0 — type <span class="m">help</span> to list commands.', 'm');
    $$('[data-terminal-open]').forEach(b => b.addEventListener('click', () => openModal(term)));
  }

  /* ---------- keyboard ---------- */
  d.addEventListener('keydown', e => {
    const open = $('.modal.is-open');
    if (e.key === 'Escape') { if (open) closeModal(open); closeMenu(); return; }
    if (open && open === lb && group.length > 1) {
      if (e.key === 'ArrowRight') { idx = (idx + 1) % group.length; lbShow(); }
      if (e.key === 'ArrowLeft') { idx = (idx - 1 + group.length) % group.length; lbShow(); }
    }
    const typing = /INPUT|TEXTAREA|SELECT/.test(d.activeElement.tagName);
    if (!open && !typing && (e.key === '/' || e.key === '`') && term && d.body.classList.contains('is-ready')) { e.preventDefault(); openModal(term); }
    if (!open && !typing && e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && d.body.classList.contains('is-ready')) toggleTheme();
  });
})();
document.querySelectorAll('[data-share]').forEach(a => { a.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(location.href); });
(() => {
  const ly = document.querySelector('[data-lanyard]');
  if (!ly) return;
  const sw = ly.querySelector('.lanyard__swing'), card = ly.querySelector('.lanyard__card');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let a = still ? 0 : 0.42, v = 0, drag = false, last = performance.now(), tilt = 0, lastY = scrollY, visible = true;
  const pivot = () => { const r = ly.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top }; };
  const frame = now => {
    const dt = Math.min(0.032, (now - last) / 1000); last = now;
    if (!drag) { v += (-26 * Math.sin(a) - 1.5 * v) * dt; a += v * dt; }
    tilt += (Math.max(-18, Math.min(18, -v * 9)) - tilt) * 0.12;
    sw.style.transform = `rotate(${a}rad)`;
    card.style.transform = `rotateY(${tilt}deg)`;
    if (visible) requestAnimationFrame(frame);
  };
  new IntersectionObserver(es => { const was = visible; visible = es[0].isIntersecting; if (visible && !was) { last = performance.now(); requestAnimationFrame(frame); } }).observe(ly);
  requestAnimationFrame(frame);
  let pt = 0, sx = 0, sy = 0, t0 = 0;
  const flip = () => { const f = card.classList.toggle('is-flipped'); card.setAttribute('aria-pressed', f); v += f ? -1.4 : 1.4; };
  card.addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; sx = e.clientX; sy = e.clientY; t0 = performance.now(); drag = true; ly.classList.add('is-drag'); card.setPointerCapture(e.pointerId); pt = performance.now(); e.preventDefault(); });
  card.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = pivot(), now = performance.now();
    const na = Math.max(-1.25, Math.min(1.25, Math.atan2(-(e.clientX - p.x), Math.max(40, e.clientY - p.y))));
    const dt = Math.max(0.008, (now - pt) / 1000); pt = now;
    v = (na - a) / dt * 0.6; a = na;
  });
  const end = e => { if (!drag) return; drag = false; if (e && Math.hypot(e.clientX - sx, e.clientY - sy) < 6 && performance.now() - t0 < 400) flip(); ly.classList.remove('is-drag'); v = Math.max(-9, Math.min(9, v)); };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  ly.addEventListener('pointermove', e => { if (!drag && e.pointerType === 'mouse') v -= e.movementX * 0.0025; });
  addEventListener('scroll', () => { if (!still) v += (scrollY - lastY) * 0.0009; lastY = scrollY; }, { passive: true });
  card.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); flip(); } if (e.key === 'ArrowLeft') v += 2.5; if (e.key === 'ArrowRight') v -= 2.5; });
})();
