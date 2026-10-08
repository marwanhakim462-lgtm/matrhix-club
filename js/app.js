/* MATRIX site: hash router, Study Hub, team, contact and form. */
(function () {
  'use strict';

  var CFG = window.MATRIX_CONFIG;
  var DATA = window.MATRIX_STUDY || [];

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icon(id, cls) {
    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="#i-' + id + '"/></svg>';
  }
  function telHref(phone) { return 'tel:' + String(phone).replace(/[^\d+]/g, ''); }
  function waHref(number, text) {
    return 'https://wa.me/' + String(number).replace(/\D/g, '') + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  var RES = {
    notes: { label: 'Notes', icon: 'notes' },
    pdf: { label: 'PDFs', icon: 'pdf' },
    worksheet: { label: 'Worksheets', icon: 'worksheet' }
  };
  var SUBJECT_LABEL = { math: 'Math', mechanics: 'Mechanics' };

  /* ---------- router ---------- */
  var VIEWS = ['home', 'study', 'team', 'contact'];
  var TITLES = {
    home: 'MATRIX | Math & Mechanics Club',
    study: 'Study Hub | MATRIX',
    team: 'Team and leadership | MATRIX',
    contact: 'Contact and socials | MATRIX'
  };
  var firstRoute = true;

  function parseHash() {
    var raw = location.hash.replace(/^#\/?/, '');
    var parts = raw.split('?');
    var name = parts[0] || 'home';
    return { view: VIEWS.indexOf(name) >= 0 ? name : 'home', params: new URLSearchParams(parts[1] || '') };
  }

  function route() {
    var r = parseHash();
    $$('[data-view]').forEach(function (s) { s.hidden = s.getAttribute('data-view') !== r.view; });
    $$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === r.view) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = TITLES[r.view];
    closeMenu();

    if (r.view === 'study') applyStudyParams(r.params);

    var section = $('[data-view="' + r.view + '"]');
    section.classList.remove('view-enter');
    void section.offsetWidth; // restart the transition
    section.classList.add('view-enter');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (!firstRoute) {
      var h = $('h1', section);
      if (h) h.focus({ preventScroll: true });
    }
    firstRoute = false;
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = $('#menu-btn');
  var mobileNav = $('#mobile-nav');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.hidden = !open;
    $('[data-open]', menuBtn).classList.toggle('hidden', open);
    $('[data-close]', menuBtn).classList.toggle('hidden', !open);
  }
  function closeMenu() { setMenu(false); }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { closeMenu(); menuBtn.focus(); }
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', closeMenu);

  /* ---------- Study Hub ---------- */
  var state = { grade: '10', subject: 'all', topic: 'all', q: '' };
  var gridEl = $('#folder-grid');
  var countEl = $('#study-count');
  var chipsEl = $('#topic-chips');
  var searchEl = $('#study-search');
  var panelEl = $('#study-panel');
  var tabs = $$('.tab');
  var segBtns = $$('.seg-btn');

  function inScope(item) { return item.grade === state.grade && (state.subject === 'all' || item.subject === state.subject); }

  function topicList() {
    var seen = [];
    DATA.filter(inScope).forEach(function (d) { if (seen.indexOf(d.topic) < 0) seen.push(d.topic); });
    return seen;
  }

  function renderChips() {
    var topics = topicList();
    if (state.topic !== 'all' && topics.indexOf(state.topic) < 0) state.topic = 'all';
    var html = ['<button type="button" class="chip" data-topic="all" aria-pressed="' + (state.topic === 'all') + '">All topics</button>'];
    topics.forEach(function (t) {
      html.push('<button type="button" class="chip" data-topic="' + esc(t) + '" aria-pressed="' + (state.topic === t) + '">' + esc(t) + '</button>');
    });
    chipsEl.innerHTML = html.join('');
  }

  function folderCard(d) {
    var href = d.drive || CFG.driveRoot;
    var res = d.resources.map(function (r) {
      return '<li class="res">' + icon(RES[r].icon) + RES[r].label + '</li>';
    }).join('');
    return '' +
      '<article class="folder" data-subject="' + d.subject + '">' +
        '<p class="folder-topic">' + SUBJECT_LABEL[d.subject] + ' / ' + esc(d.topic) + '</p>' +
        '<h3 class="font-display">' + esc(d.title) + '</h3>' +
        '<p class="folder-sum">' + esc(d.summary) + '</p>' +
        '<ul class="res-list" aria-label="Inside this folder">' + res + '</ul>' +
        '<a class="folder-cta" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' +
          icon('folder') + 'Open folder in Drive' + icon('external', 'icon-sm') +
          '<span class="sr-only"> (opens in a new tab)</span>' +
        '</a>' +
      '</article>';
  }

  function renderGrid() {
    var q = state.q.trim().toLowerCase();
    var list = DATA.filter(function (d) {
      if (!inScope(d)) return false;
      if (state.topic !== 'all' && d.topic !== state.topic) return false;
      if (!q) return true;
      return (d.title + ' ' + d.summary + ' ' + d.topic + ' ' + SUBJECT_LABEL[d.subject]).toLowerCase().indexOf(q) >= 0;
    });

    countEl.textContent = list.length + (list.length === 1 ? ' folder' : ' folders') + ' in Grade ' + state.grade;

    if (!list.length) {
      gridEl.innerHTML = '<div class="empty glass">' +
        '<p class="font-display empty-title">No folders match that search</p>' +
        '<p>Try a shorter word, or clear the filters to see every Grade ' + state.grade + ' folder.</p>' +
        '<button type="button" class="btn btn-ghost" data-clear>Clear filters</button></div>';
      return;
    }
    gridEl.innerHTML = list.map(folderCard).join('');
  }

  var driveCta = $('#drive-cta');
  driveCta.href = CFG.driveRoot;

  function syncStudyUI() {
    $('#drive-cta-title').textContent = 'Grade ' + state.grade + ' resources on Google Drive';
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-grade') === state.grade;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) panelEl.setAttribute('aria-labelledby', t.id);
    });
    segBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-subject') === state.subject)); });
    if (searchEl.value !== state.q) searchEl.value = state.q;
    renderChips();
    renderGrid();
  }

  function applyStudyParams(params) {
    var changed = false;
    var g = params.get('grade'), s = params.get('subject'), t = params.get('topic');
    if (g === '10' || g === '11') { state.grade = g; changed = true; }
    if (s === 'math' || s === 'mechanics' || s === 'all') { state.subject = s; state.topic = 'all'; changed = true; }
    if (t) { state.topic = t; changed = true; }
    if (changed || !gridEl.children.length) syncStudyUI();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { state.grade = tab.getAttribute('data-grade'); syncStudyUI(); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
  });
  segBtns.forEach(function (b) {
    b.addEventListener('click', function () { state.subject = b.getAttribute('data-subject'); state.topic = 'all'; syncStudyUI(); });
  });
  chipsEl.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    state.topic = chip.getAttribute('data-topic');
    renderChips();
    renderGrid();
    var again = $('.chip[data-topic="' + (window.CSS && CSS.escape ? CSS.escape(state.topic) : state.topic) + '"]', chipsEl);
    if (again) again.focus();
  });
  searchEl.addEventListener('input', function () { state.q = searchEl.value; renderGrid(); });
  gridEl.addEventListener('click', function (e) {
    if (e.target.closest('[data-clear]')) {
      state.subject = 'all'; state.topic = 'all'; state.q = '';
      syncStudyUI();
      searchEl.focus();
    }
  });

  /* ---------- Team ---------- */
  function avatar(i, tone) {
    // A small generated figure: a bracketed shape that differs per person.
    var shapes = [
      '<path d="M12 4l7 4v8l-7 4-7-4V8z"/>',
      '<circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14"/>',
      '<path d="M4 18 12 5l8 13z"/>',
      '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="m5 5 14 14"/>',
      '<path d="M5 18c3-12 11-12 14 0"/><path d="M5 18h14"/>',
      '<path d="M12 4l3 6 6 .9-4.4 4.2 1 6.1L12 18.4 6.4 21.2l1-6.1L3 10.9 9 10z"/>'
    ];
    return '<span class="avatar avatar-' + tone + '" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24">' + shapes[i % shapes.length] + '</svg></span>';
  }

  function personCard(p, i, big) {
    return '' +
      '<article class="person glass' + (big ? ' person-big' : '') + '" data-tone="' + p.tone + '">' +
        '<div class="person-head">' + avatar(i, p.tone) +
          '<div><p class="person-role">' + esc(p.role) + '</p><h3 class="font-display">' + esc(p.name) + '</h3></div></div>' +
        '<p class="person-bio">' + esc(p.bio) + '</p>' +
        '<ul class="person-links">' +
          '<li><a href="' + esc(telHref(p.phone)) + '">' + icon('phone') + esc(p.phone) + '</a></li>' +
          '<li><a href="mailto:' + esc(p.email) + '">' + icon('mail') + esc(p.email) + '</a></li>' +
        '</ul>' +
        '<a class="btn btn-ghost btn-sm" href="' + esc(waHref(p.whatsapp, 'Hi ' + p.name + ', I found you on the MATRIX website.')) + '" target="_blank" rel="noopener noreferrer">' +
          icon('whatsapp') + 'Message on WhatsApp<span class="sr-only"> (opens in a new tab)</span></a>' +
      '</article>';
  }

  function renderTeam() {
    var groups = [];
    CFG.team.forEach(function (p, i) {
      var g = groups.filter(function (x) { return x.name === p.group; })[0];
      if (!g) { g = { name: p.group, people: [] }; groups.push(g); }
      g.people.push({ p: p, i: i });
    });
    $('#team-groups').innerHTML = groups.map(function (g, gi) {
      return '<section aria-labelledby="tg-' + gi + '">' +
        '<h2 id="tg-' + gi + '" class="block-title font-display">' + esc(g.name) + '</h2>' +
        '<div class="grid gap-5 ' + (gi === 0 ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-2') + '">' +
        g.people.map(function (x) { return personCard(x.p, x.i, gi === 0); }).join('') +
        '</div></section>';
    }).join('');
  }

  /* ---------- Contact ---------- */
  function renderContact() {
    $('#social-grid').innerHTML = CFG.socials.map(function (s) {
      return '<a class="social glass" data-social="' + s.id + '" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="social-icon">' + icon(s.id, 'icon-lg') + '</span>' +
        '<span class="social-body"><span class="social-name font-display">' + esc(s.label) + '</span>' +
        '<span class="social-handle">' + esc(s.handle) + '</span>' +
        '<span class="social-blurb">' + esc(s.blurb) + '</span></span>' +
        '<span class="social-go">' + esc(s.cta) + icon('external', 'icon-sm') + '</span>' +
        '<span class="sr-only">(opens in a new tab)</span></a>';
    }).join('');

    $('#contact-cards').innerHTML = CFG.contacts.map(function (c) {
      return '<article class="person glass">' +
        '<p class="person-role">' + esc(c.role) + '</p>' +
        '<h3 class="font-display">' + esc(c.name) + '</h3>' +
        '<ul class="person-links mt-3">' +
          '<li><a href="' + esc(telHref(c.phone)) + '">' + icon('phone') + esc(c.phone) + '</a></li>' +
          '<li><a href="mailto:' + esc(c.email) + '">' + icon('mail') + esc(c.email) + '</a></li>' +
        '</ul>' +
        '<a class="btn btn-whatsapp btn-sm mt-4" href="' + esc(waHref(c.whatsapp, c.message)) + '" target="_blank" rel="noopener noreferrer">' +
          icon('whatsapp') + 'Message on WhatsApp<span class="sr-only"> (opens in a new tab)</span></a>' +
      '</article>';
    }).join('');
  }

  /* ---------- YouTube stats ---------- */
  var YT = CFG.youtube;
  var ytEl = $('#yt-stats');
  var ytCounts = $$('.count', ytEl);
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nf = new Intl.NumberFormat('en-US');
  var ytData = { subscribers: YT.snapshot.subscribers, views: YT.snapshot.views };
  var ytLive = false;
  var ytShown = false; // true once the counters have animated for the current visit

  $('#yt-subscribe').href = YT.subscribeUrl;

  function ytLabel(v) { return typeof v === 'number' ? nf.format(v) : '–'; }

  function renderYtMeta() {
    $('#yt-badge-text').textContent = ytLive ? 'Live channel stats' : 'Channel stats';
    ytEl.classList.toggle('is-live', ytLive);
    var asOf = $('#yt-asof');
    if (ytLive) { asOf.textContent = 'Updated just now from YouTube.'; return; }
    var d = new Date(YT.snapshot.asOf + 'T00:00:00');
    asOf.textContent = isNaN(d) ? '' : 'As of ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '.';
  }

  function animateCount(el, to) {
    cancelAnimationFrame(el._raf);
    if (typeof to !== 'number') { el.textContent = ytLabel(to); return; }
    if (reduceMotion || to < 1) { el.textContent = ytLabel(to); return; }
    var from = 0, ms = 1600, t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / ms);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = nf.format(Math.round(from + (to - from) * eased));
      if (p < 1) el._raf = requestAnimationFrame(step);
    })(t0);
  }

  function runCounters() {
    ytShown = true;
    ytCounts.forEach(function (el) { animateCount(el, ytData[el.getAttribute('data-key')]); });
  }
  function resetCounters() {
    ytShown = false;
    ytCounts.forEach(function (el) { cancelAnimationFrame(el._raf); el.textContent = '0'; });
  }
  function syncYtFinal() {
    $$('[data-final]', ytEl).forEach(function (el) { el.textContent = ytLabel(ytData[el.getAttribute('data-final')]); });
  }

  function loadLiveYtStats() {
    if (!YT.apiKey) return;
    var url = 'https://www.googleapis.com/youtube/v3/channels?part=statistics&id=' + encodeURIComponent(YT.channelId) +
      '&key=' + encodeURIComponent(YT.apiKey);
    fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (json) {
      var s = json.items && json.items[0] && json.items[0].statistics;
      if (!s) throw new Error('no statistics');
      ytData = {
        subscribers: s.hiddenSubscriberCount ? null : Number(s.subscriberCount),
        views: Number(s.viewCount)
      };
      ytLive = true;
      renderYtMeta();
      syncYtFinal();
      if (ytShown) runCounters();
    }).catch(function () { /* keep the dated snapshot */ });
  }

  renderYtMeta();
  syncYtFinal();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { if (!ytShown) runCounters(); }
      else resetCounters();
    }, { threshold: 0.4 }).observe(ytEl);
  } else {
    runCounters();
  }
  loadLiveYtStats();

  /* ---------- Contact form ---------- */
  var form = $('#contact-form');
  var statusEl = $('#form-status');
  var submitBtn = $('#form-submit');

  var RULES = {
    name: function (v) { return v.trim() ? '' : 'Enter your name.'; },
    grade: function (v) { return v ? '' : 'Choose your grade.'; },
    email: function (v) {
      if (!v.trim()) return 'Enter your email so we can reply.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter an email like name@example.com.';
    },
    topic: function (v) { return v ? '' : 'Choose what this is about.'; },
    message: function (v) {
      var n = v.trim().length;
      return n >= 10 ? '' : (n === 0 ? 'Write a short message.' : 'Add a little more detail (at least 10 characters).');
    }
  };

  function setError(field, msg) {
    var input = form.elements[field];
    var err = $('#e-' + (field === 'message' ? 'message' : field));
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = msg;
      err.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      err.hidden = true;
      err.textContent = '';
    }
    return !msg;
  }
  function validateField(field) { return setError(field, RULES[field](form.elements[field].value)); }

  Object.keys(RULES).forEach(function (field) {
    var el = form.elements[field];
    el.addEventListener('blur', function () { if (el.value || el.hasAttribute('aria-invalid')) validateField(field); });
    el.addEventListener('input', function () { if (el.hasAttribute('aria-invalid')) validateField(field); });
  });

  function showStatus(kind, text) {
    statusEl.hidden = false;
    statusEl.className = 'form-status form-status-' + kind;
    statusEl.innerHTML = icon(kind === 'ok' ? 'check' : 'alert') + '<span>' + esc(text) + '</span>';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.hidden = true;
    var firstBad = null;
    Object.keys(RULES).forEach(function (field) {
      if (!validateField(field) && !firstBad) firstBad = form.elements[field];
    });
    if (firstBad) { firstBad.focus(); showStatus('error', 'Fix the highlighted fields and send again.'); return; }

    var payload = {};
    Object.keys(RULES).forEach(function (f) { payload[f] = form.elements[f].value.trim(); });

    if (CFG.form.endpoint) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      fetch(CFG.form.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        showStatus('ok', 'Message sent. A club member will reply by email.');
      }).catch(function () {
        showStatus('error', 'The message did not send. Check your connection and try again, or email ' + CFG.club.email + '.');
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send message';
      });
      return;
    }

    var subject = payload.topic + ' (' + payload.grade + ')';
    var body = payload.message + '\n\n' + payload.name + '\n' + payload.grade + '\n' + payload.email;
    window.location.href = 'mailto:' + encodeURIComponent(CFG.form.recipient).replace('%40', '@') +
      '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    showStatus('ok', 'Your email app should open with this message ready to send. If it does not, write to ' + CFG.form.recipient + '.');
  });

  /* ---------- boot ---------- */
  $('#year').textContent = new Date().getFullYear();
  renderTeam();
  renderContact();
  syncStudyUI();
  window.addEventListener('hashchange', route);
  route();
})();
