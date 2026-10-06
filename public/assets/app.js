(function () {
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = false;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;

  /* ---------- non-animated essentials (always run) ---------- */
  $('#y').textContent = new Date().getFullYear();

  var st = $('#status');
  fetch('/api/estado').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    st.classList.toggle('on', d.abierto); $('span', st).textContent = d.mensaje;
  }).catch(function () {});

  var day = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' })).getDay();
  var li = $('#hours li[data-d="' + (day >= 1 && day <= 4 ? 1 : day) + '"]'); if (li) li.classList.add('today');

  // mobile menu
  var nav = $('#nav'), burger = $('.burger'), menu = $('#menu');
  var setMenu = function (o) { menu.classList.toggle('open', o); burger.textContent = o ? 'Cerrar' : 'Menú'; burger.setAttribute('aria-expanded', o); };
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  // file drop
  var drop = $('#drop'), fin = $('input', drop), img = $('img', drop), dt = $('.dt', drop);
  var show = function () {
    var f = fin.files[0]; if (!f) return;
    if (f.size > 8 * 1024 * 1024) { dt.textContent = 'La imagen supera 8 MB — elige otra'; fin.value = ''; img.style.display = 'none'; return; }
    img.src = URL.createObjectURL(f); img.style.display = 'block'; dt.textContent = f.name;
  };
  fin.addEventListener('change', show);
  ['dragover', 'dragenter'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); fin.files = e.dataTransfer.files; show(); });

  // testimonials
  var Q = [
    ['“Escucharon mi idea y la convirtieron en algo mucho mejor de lo que imaginé.”', '— Cliente de Númina'],
    ['“Todo súper limpio y profesional. Me sentí cómoda desde el primer momento.”', '— Cliente de Númina'],
    ['“Los trazos quedaron perfectos y cicatrizó increíble siguiendo sus indicaciones.”', '— Cliente de Númina']
  ];
  var qi = 0, qb = $('#q'), qw = $('#qw'), qd = $('#qd'), qt;
  Q.forEach(function (_, i) { var b = document.createElement('button'); b.setAttribute('aria-label', 'Opinión ' + (i + 1)); b.innerHTML = '<i></i>'; b.onclick = function () { goQ(i); }; qd.appendChild(b); });
  function goQ(i) {
    qi = i; clearTimeout(qt);
    $$('button', qd).forEach(function (b, k) { b.classList.remove('on'); void b.offsetWidth; if (k === i) b.classList.add('on'); });
    var swap = function () { qb.innerHTML = '<span>' + Q[i][0] + '</span>'; qw.textContent = Q[i][1]; };
    if (G && !reduce) G.to([qb, qw], { opacity: 0, y: -16, duration: .4, ease: 'power2.in', onComplete: function () { swap(); G.fromTo([qb, qw], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .7, ease: 'power3.out' }); } });
    else swap();
    qt = setTimeout(function () { goQ((qi + 1) % Q.length); }, 6000);
  }
  goQ(0);

  /* ---------- fallback when GSAP is unavailable or motion is reduced ---------- */
  if (!G || !ST || reduce) {
    root.classList.add('loaded');
    $$('.hero .art path').forEach(function (p) { p.style.strokeDashoffset = 0; });
    $('.fab').classList.add('in');
    addEventListener('scroll', function () { nav.classList.toggle('solid', scrollY > 40); }, { passive: true });
    return;
  }

  G.registerPlugin(ST);

  /* ---------- smooth scroll ---------- */
  var lenis;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = a.getAttribute('href'); if (t.length < 2) return;
        var el = $(t); if (!el) return; e.preventDefault();
        lenis.scrollTo(el, { offset: t === '#top' ? 0 : -70, duration: 1.6 });
      });
    });
  }

  /* ---------- text splitting helpers ---------- */
  $$('.split').forEach(function (h) {
    h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i).map(function (l) { return '<span class="ln"><span>' + l.trim() + '</span></span>'; }).join('');
  });
  var mani = $('.manifesto');
  (function wrapWords(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(w));
          else { var s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.appendChild(s); }
        });
        el.replaceChild(frag, n);
      } else if (n.nodeType === 1) n.classList.add('w');
    });
  })(mani);

  /* ---------- intro: loader -> hero ---------- */
  G.set('.hero h1 .ln>span', { yPercent: 110 });
  G.set(['.hero .meta', '.hero .foot'], { opacity: 0, y: 20 });
  G.set('.nav', { yPercent: -100 });
  var cnt = { v: 0 };
  var intro = G.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .to(cnt, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: function () { $('.loader .count').textContent = Math.round(cnt.v); } }, 0)
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut', onComplete: function () { root.classList.add('loaded'); } }, 1.7)
    .to('.hero h1 .ln>span', { yPercent: 0, duration: 1.4, stagger: .12 }, 2.2)
    .to('.hero .art path', { strokeDashoffset: 0, duration: 2.6, stagger: .25, ease: 'power2.inOut' }, 2.3)
    .to(['.hero .meta', '.hero .foot'], { opacity: 1, y: 0, duration: 1.2, stagger: .1 }, 2.6)
    .to('.nav', { yPercent: 0, duration: 1.2 }, 2.6);
  intro.fromTo('.loader .word span', { yPercent: 105 }, { yPercent: 0, duration: 1, stagger: .06 }, 0);
  intro.to('.loader .word span', { yPercent: -105, duration: .8, stagger: .04, ease: 'expo.in' }, 1.3);

  setTimeout(function () { if (!root.classList.contains('loaded')) { intro.progress(1); root.classList.add('loaded'); } }, 6000);

  // hero parallax out
  G.to('.hero h1', { yPercent: -18, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  G.to('.hero .art', { yPercent: 40, rotate: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- nav behaviour ---------- */
  var lastY = 0;
  ST.create({ start: 0, end: 'max', onUpdate: function (s) {
    var y = s.scroll();
    nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > lastY && y > 400 && !menu.classList.contains('open'));
    lastY = y;
    $('.fab').classList.toggle('in', y > innerHeight * .8);
  } });

  /* ---------- marquee with scroll velocity ---------- */
  var mq = G.to('.marq .t', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
  ST.create({ trigger: '.marq', start: 'top bottom', end: 'bottom top', onUpdate: function (s) {
    var v = G.utils.clamp(-6, 6, s.getVelocity() / 250);
    G.to(mq, { timeScale: v || (s.direction > 0 ? 1 : -1), duration: .2, overwrite: true });
    G.to(mq, { timeScale: s.direction > 0 ? 1 : -1, duration: 1.2, delay: .2 });
  } });

  /* ---------- section headings: line mask reveal ---------- */
  $$('.split').forEach(function (h) {
    G.from($$('.ln>span', h), { yPercent: 110, duration: 1.3, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  $$('.sh .lbl, .book aside > p, .book aside ul, .note').forEach(function (el) {
    G.from(el, { opacity: 0, y: 24, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- manifesto: words light up on scroll ---------- */
  G.to('.manifesto .w', { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: mani, start: 'top 80%', end: 'bottom 45%', scrub: true } });

  /* ---------- generic reveals ---------- */
  ST.batch('.rv', { start: 'top 88%', onEnter: function (els) { G.from(els, { opacity: 0, y: 40, duration: 1.1, stagger: .1, ease: 'power3.out' }); }, once: true });

  /* ---------- counters ---------- */
  $$('.cnt').forEach(function (c) {
    var to = +c.dataset.to, o = { v: 0 };
    ST.create({ trigger: c, start: 'top 90%', once: true, onEnter: function () {
      G.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: function () { c.textContent = Math.round(o.v); } });
    } });
  });
  G.from('.stat', { opacity: 0, y: 30, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

  /* ---------- styles list ---------- */
  G.from('.row', { opacity: 0, y: 50, duration: 1, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '#list', start: 'top 80%' } });
  var fl = $('#float');
  if (fine) {
    var fx = G.quickTo(fl, 'x', { duration: .6, ease: 'power3' }), fy = G.quickTo(fl, 'y', { duration: .6, ease: 'power3' });
    var list = $('#list');
    list.addEventListener('pointermove', function (e) { fx(e.clientX); fy(e.clientY); });
    list.addEventListener('pointerenter', function () { G.to(fl, { opacity: 1, scale: 1, duration: .5, ease: 'power3.out' }); });
    list.addEventListener('pointerleave', function () { G.to(fl, { opacity: 0, scale: .6, duration: .4 }); });
    $$('.row', list).forEach(function (r) {
      r.addEventListener('pointerenter', function () {
        $$('svg', fl).forEach(function (s) { s.classList.toggle('on', s.dataset.s === r.dataset.s); });
        G.fromTo(fl, { rotate: -4 }, { rotate: 0, duration: .6, ease: 'power3.out' });
      });
    });
  }

  /* ---------- horizontal process (desktop) ---------- */
  var mm = G.matchMedia();
  mm.add('(min-width: 901px)', function () {
    var track = $('.hz .track');
    var dist = function () { return track.scrollWidth - innerWidth; };
    var tw = G.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: '.hz', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
    $$('.panel:not(.intro)').forEach(function (p) {
      G.from($('.big', p), { yPercent: 60, opacity: 0, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left right', end: 'center center', scrub: true } });
      G.from($$('h3, p', p), { y: 40, opacity: 0, stagger: .1, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 85%', end: 'left 45%', scrub: true } });
    });
  });
  mm.add('(max-width: 900px)', function () {
    G.from('.panel', { opacity: 0, y: 40, stagger: .1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.hz', start: 'top 80%' } });
  });

  /* ---------- form fields stagger ---------- */
  G.from('.f > *:not(.hp):not([type=hidden])', { opacity: 0, y: 30, duration: .9, stagger: .06, ease: 'power3.out', scrollTrigger: { trigger: '.f', start: 'top 80%' } });

  /* ---------- FAQ smooth accordion ---------- */
  G.from('.faq details', { opacity: 0, y: 30, duration: .9, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: '.faq', start: 'top 85%' } });
  $$('.faq details').forEach(function (d) {
    var s = $('summary', d), a = $('.ans', d);
    s.addEventListener('click', function (e) {
      e.preventDefault();
      if (d.open) G.to(a, { height: 0, duration: .5, ease: 'power3.inOut', onComplete: function () { d.open = false; a.style.height = ''; ST.refresh(); } });
      else { d.open = true; G.fromTo(a, { height: 0 }, { height: 'auto', duration: .6, ease: 'power3.out', onComplete: function () { ST.refresh(); } }); }
    });
  });

  /* ---------- location ---------- */
  G.from('.hours li', { opacity: 0, x: -30, duration: .9, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.hours', start: 'top 85%' } });
  G.from('.map', { clipPath: 'inset(0 0 100% 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.map', start: 'top 85%' } });

  /* ---------- footer ---------- */
  G.from('.bigbtn', { scale: 0, rotate: -90, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.fcta', start: 'top 80%' } });
  G.from('.wordmark span', { yPercent: 100, stagger: .05, ease: 'none', scrollTrigger: { trigger: '.wordmark', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* ---------- cursor + magnetic ---------- */
  if (fine) {
    var c1 = $('.cur'), c2 = $('.cur-r');
    var x1 = G.quickTo(c1, 'x', { duration: .1 }), y1 = G.quickTo(c1, 'y', { duration: .1 });
    var x2 = G.quickTo(c2, 'x', { duration: .5, ease: 'power3' }), y2 = G.quickTo(c2, 'y', { duration: .5, ease: 'power3' });
    addEventListener('pointermove', function (e) { x1(e.clientX); y1(e.clientY); x2(e.clientX); y2(e.clientY); });
    $$('a, button, summary, [data-hover]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { c2.classList.add(el.hasAttribute('data-view') ? 'view' : 'hov'); if (el.hasAttribute('data-view')) c2.textContent = 'Ver'; });
      el.addEventListener('pointerleave', function () { c2.classList.remove('hov', 'view'); c2.textContent = ''; });
    });
    $$('#list .row').forEach(function (el) { el.addEventListener('pointerenter', function () { c2.classList.remove('hov'); G.set(c2, { opacity: 0 }); }); el.addEventListener('pointerleave', function () { G.set(c2, { opacity: 1 }); }); });
    $$('.magnetic').forEach(function (m) {
      var mx = G.quickTo(m, 'x', { duration: .6, ease: 'elastic.out(1,.4)' }), my = G.quickTo(m, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
      m.addEventListener('pointermove', function (e) { var r = m.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .35); my((e.clientY - r.top - r.height / 2) * .35); });
      m.addEventListener('pointerleave', function () { mx(0); my(0); });
    });
  }

  addEventListener('load', function () { ST.refresh(); });
})();
