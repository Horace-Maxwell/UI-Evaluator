/* Fernhill Tool Library: reservation flow. Static pages; the basket lives in sessionStorage and the chosen day and
   session travel in the address between steps. Dates are fixed to October 2026 so the fixture is reproducible. */
(function () {
  'use strict';

  var TODAY = '2026-10-08';
  var HOLD_MINUTES = 10;

  var TOOLS = [
    { id: 'drill-18v-two', name: 'Cordless drill 18 V, combi, two batteries', category: 'Drills and drivers', deposit: 20, from: '2026-10-10', blurb: 'A brushless combi drill with hammer action, two 4 Ah batteries and a charger. Enough for a day of fixing shelves and a fence.', specs: [['Chuck', '13 mm keyless'], ['Batteries', 'two, 4 Ah, with charger'], ['Weight', '1.7 kg with battery'], ['Case', 'hard case, 18 bits included']] },
    { id: 'drill-18v-one', name: 'Cordless drill 18 V, combi, one battery', category: 'Drills and drivers', deposit: 20, from: '2026-10-10', blurb: 'The same combi drill with a single 2 Ah battery. Fine for a few hours of light work; charge it before you start.', specs: [['Chuck', '13 mm keyless'], ['Batteries', 'one, 2 Ah, with charger'], ['Weight', '1.5 kg with battery'], ['Case', 'soft bag, no bits']] },
    { id: 'ladder-3m', name: 'Extension ladder 3 m to 5.4 m', category: 'Access', deposit: 30, from: '2026-10-10', blurb: 'A two-section aluminium ladder for gutters and first-floor windows. It needs two people to carry.', specs: [['Closed length', '3.0 m'], ['Extended length', '5.4 m'], ['Load', '150 kg'], ['Weight', '14 kg']] },
    { id: 'hedge-trimmer', name: 'Hedge trimmer, corded, 60 cm blade', category: 'Garden', deposit: 15, from: '2026-10-14', blurb: 'A 600 W corded trimmer with a 60 cm blade. Comes with a 20 m extension lead and a blade cover.', specs: [['Blade', '60 cm, 24 mm gap'], ['Power', '600 W, mains'], ['Lead', '20 m extension included'], ['Weight', '3.6 kg']] },
    { id: 'pressure-washer', name: 'Pressure washer, 130 bar', category: 'Cleaning', deposit: 30, from: '2026-10-17', blurb: 'For patios, paths and cars. Comes with a patio head, a lance and 8 m of hose. Needs an outside tap.', specs: [['Pressure', '130 bar'], ['Hose', '8 m'], ['Heads', 'patio head, variable lance'], ['Weight', '9 kg']] },
    { id: 'tile-cutter', name: 'Manual tile cutter, 600 mm', category: 'Building', deposit: 20, from: '2026-10-10', blurb: 'A rail cutter for ceramic and porcelain tiles up to 600 mm. Score and snap; no water or power needed.', specs: [['Cut length', '600 mm'], ['Tile thickness', 'up to 14 mm'], ['Wheel', 'tungsten carbide, spare included'], ['Weight', '6 kg']] },
    { id: 'wallpaper-steamer', name: 'Wallpaper steamer', category: 'Decorating', deposit: 15, from: '2026-10-10', blurb: 'A 2 kW steamer with a large plate for stripping paper. Allow fifteen minutes to heat up.', specs: [['Power', '2 kW'], ['Tank', '4 l, about 70 minutes'], ['Hose', '3.5 m'], ['Weight', '3 kg']] },
    { id: 'sander', name: 'Random orbit sander, 125 mm', category: 'Finishing', deposit: 15, from: '2026-10-21', blurb: 'A 125 mm sander with dust extraction. Bring your own discs, or buy a pack of mixed grits at the desk.', specs: [['Pad', '125 mm hook and loop'], ['Power', '300 W, mains'], ['Dust', 'bag included, vacuum port'], ['Weight', '1.9 kg']] },
    { id: 'jigsaw', name: 'Jigsaw, corded, with 8 blades', category: 'Saws', deposit: 15, from: '2026-10-10', blurb: 'A pendulum jigsaw for wood up to 80 mm and thin metal. Comes with eight blades for wood, metal and laminate.', specs: [['Cut depth', '80 mm wood, 8 mm steel'], ['Power', '650 W, mains'], ['Blades', 'eight, T-shank'], ['Weight', '2.4 kg']] },
    { id: 'tile-cutter-wet', name: 'Electric wet tile saw, 180 mm', category: 'Building', deposit: 40, from: '2026-10-24', blurb: 'A bench saw with a water tray for porcelain and stone. Heavy; bring a car and a second pair of hands.', specs: [['Blade', '180 mm diamond'], ['Cut depth', '34 mm'], ['Power', '800 W, mains'], ['Weight', '17 kg']] },
  ];

  var SESSIONS = [
    { id: 'sat-2026-10-10', date: '2026-10-10', label: 'Saturday 10 October, 10:00 to 13:00', short: 'Sat 10 Oct, 10:00 to 13:00' },
    { id: 'wed-2026-10-14', date: '2026-10-14', label: 'Wednesday 14 October, 18:00 to 20:00', short: 'Wed 14 Oct, 18:00 to 20:00' },
    { id: 'sat-2026-10-17', date: '2026-10-17', label: 'Saturday 17 October, 10:00 to 13:00', short: 'Sat 17 Oct, 10:00 to 13:00' },
    { id: 'wed-2026-10-21', date: '2026-10-21', label: 'Wednesday 21 October, 18:00 to 20:00', short: 'Wed 21 Oct, 18:00 to 20:00' },
    { id: 'sat-2026-10-24', date: '2026-10-24', label: 'Saturday 24 October, 10:00 to 13:00', short: 'Sat 24 Oct, 10:00 to 13:00' },
    { id: 'wed-2026-10-28', date: '2026-10-28', label: 'Wednesday 28 October, 18:00 to 20:00', short: 'Wed 28 Oct, 18:00 to 20:00' },
  ];

  var LOANS = [
    { id: '1w', label: 'One week' },
    { id: '2w', label: 'Two weeks' },
  ];

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function parseDate(iso) {
    var p = iso.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  }
  function iso(d) {
    return d.toISOString().slice(0, 10);
  }
  function longDate(isoDate) {
    var d = parseDate(isoDate);
    return DAYS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
  }
  function shortDate(isoDate) {
    var d = parseDate(isoDate);
    return DAYS[d.getUTCDay()].slice(0, 3) + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()].slice(0, 3);
  }
  function addDays(isoDate, n) {
    var d = parseDate(isoDate);
    d.setUTCDate(d.getUTCDate() + n);
    return iso(d);
  }
  function params() {
    return new URLSearchParams(location.search);
  }
  function toolById(id) {
    for (var i = 0; i < TOOLS.length; i += 1) if (TOOLS[i].id === id) return TOOLS[i];
    return null;
  }
  function sessionById(id) {
    for (var i = 0; i < SESSIONS.length; i += 1) if (SESSIONS[i].id === id) return SESSIONS[i];
    return null;
  }
  function isOpenDay(isoDate) {
    for (var i = 0; i < SESSIONS.length; i += 1) if (SESSIONS[i].date === isoDate) return true;
    return false;
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --- basket -------------------------------------------------------------------------------------------------------

  function readBasket() {
    try {
      return JSON.parse(sessionStorage.getItem('basket') || '{"items":[]}');
    } catch (e) {
      return { items: [] };
    }
  }
  function writeBasket(b) {
    sessionStorage.setItem('basket', JSON.stringify(b));
  }
  function holdStart() {
    var v = Number(sessionStorage.getItem('hold_started') || 0);
    return v || null;
  }
  function startHoldIfNeeded() {
    if (!holdStart()) sessionStorage.setItem('hold_started', String(Date.now()));
  }
  function holdExpired() {
    var s = holdStart();
    return !!s && Date.now() - s > HOLD_MINUTES * 60 * 1000;
  }
  function updateBasketCount() {
    var el = document.getElementById('basket-link');
    if (el) el.textContent = 'Basket (' + readBasket().items.length + ')';
  }

  // --- pages --------------------------------------------------------------------------------------------------------

  // Each page calls FTL.init() inline at the end of its body, so the content is in place before the first paint.
  function init() {
    var page = document.body.getAttribute('data-page');
    seedFromParams(params());
    updateBasketCount();
    if (page === 'find') initFind();
    if (page === 'tool') initTool();
    if (page === 'basket') initBasket();
    if (page === 'confirm') initConfirm();
    if (page === 'done') initDone();
  }
  window.FTL = { init: init };

  function initFind() {
    var form = document.getElementById('search-form');
    var q = document.getElementById('q');
    var from = document.getElementById('from');
    var category = document.getElementById('category');
    var results = document.getElementById('results');
    var status = document.getElementById('results-status');
    var toggle = document.getElementById('filters-toggle');
    var filters = document.getElementById('filters');

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      filters.hidden = open;
    });

    function matches(tool) {
      var text = (q.value || '').trim().toLowerCase();
      if (text && (tool.name + ' ' + tool.category).toLowerCase().indexOf(text) === -1) return false;
      if (category.value && tool.category !== category.value) return false;
      if (from.value && tool.from > from.value) return false;
      return true;
    }

    function render(list) {
      results.innerHTML = list.map(function (t) {
        var soon = t.from <= addDays(TODAY, 7);
        return '<li><article class="card">' +
          '<div class="card__thumb" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2.1-.6-.6-2.1z"/></svg></div>' +
          '<div class="card__body">' +
          '<h2 class="card__name"><a href="tool.html?id=' + t.id + '">' + escapeHtml(t.name) + '</a></h2>' +
          '<p class="card__meta">' + escapeHtml(t.category) + ' · deposit £' + t.deposit + '</p>' +
          '<span class="badge ' + (soon ? 'badge--ok' : 'badge--later') + '">Available from ' + shortDate(t.from) + '</span>' +
          '</div></article></li>';
      }).join('');
    }

    function search() {
      var list = TOOLS.filter(matches);
      if (list.length) {
        render(list);
        status.textContent = list.length + ' tool' + (list.length === 1 ? '' : 's') + ' found';
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      search();
    });
    from.addEventListener('change', search);
    category.addEventListener('change', search);
    render(TOOLS);
  }

  function initTool() {
    var tool = toolById(params().get('id')) || TOOLS[0];
    var selectedDay = params().get('day') || '';
    var loan = params().get('loan') || '1w';
    document.title = tool.name + ' - Fernhill Tool Library';
    document.getElementById('tool-name').textContent = tool.name;
    document.getElementById('tool-blurb').textContent = tool.blurb;
    document.getElementById('tool-category').textContent = tool.category;
    document.getElementById('tool-deposit').textContent = '£' + tool.deposit + ', returned when the tool comes back';
    document.getElementById('tool-from').textContent = longDate(tool.from);
    document.getElementById('specs').innerHTML = tool.specs.map(function (s) {
      return '<dt>' + escapeHtml(s[0]) + '</dt><dd>' + escapeHtml(s[1]) + '</dd>';
    }).join('');

    // Pick-up day: the next three weeks.
    var cal = document.getElementById('calendar');
    var firstDay = addDays(TODAY, 1);
    var pad = parseDate(firstDay).getUTCDay();
    var html = DAYS.map(function (d) { return '<div class="calendar__weekday" aria-hidden="true">' + d.slice(0, 2) + '</div>'; }).join('');
    for (var i = 0; i < pad; i += 1) html += '<div></div>';
    for (var n = 0; n < 21; n += 1) {
      var d = addDays(firstDay, n);
      var open = isOpenDay(d);
      html += '<button type="button" class="day" data-day="' + d + '" aria-pressed="' + (d === selectedDay) + '" aria-label="' + longDate(d) + (open ? ', open' : '') + '">' +
        '<span class="day__num">' + parseDate(d).getUTCDate() + '</span>' + (open ? '<span class="day__mark" aria-hidden="true"></span><span class="day__open">Open</span>' : '') + '</button>';
    }
    cal.innerHTML = html;
    cal.addEventListener('click', function (e) {
      var b = e.target.closest('.day');
      if (!b) return;
      selectedDay = b.getAttribute('data-day');
      Array.prototype.forEach.call(cal.querySelectorAll('.day'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      document.getElementById('day-chosen').textContent = 'Pick-up day: ' + longDate(selectedDay);
    });
    if (selectedDay) document.getElementById('day-chosen').textContent = 'Pick-up day: ' + longDate(selectedDay);

    // Loan length listbox.
    var lb = document.getElementById('loan-button');
    var list = document.getElementById('loan-list');
    function setLoan(id) {
      loan = id;
      var l = LOANS.filter(function (x) { return x.id === id; })[0] || LOANS[0];
      lb.querySelector('.listbox__value').textContent = l.label;
      Array.prototype.forEach.call(list.querySelectorAll('.listbox__option'), function (o) { o.setAttribute('aria-selected', String(o.getAttribute('data-loan') === id)); });
    }
    list.innerHTML = LOANS.map(function (l) {
      return '<li role="none"><button type="button" role="option" class="listbox__option" data-loan="' + l.id + '" aria-selected="false">' + l.label + '</button></li>';
    }).join('');
    setLoan(loan);
    lb.addEventListener('click', function () {
      var open = lb.getAttribute('aria-expanded') === 'true';
      lb.setAttribute('aria-expanded', String(!open));
      list.hidden = open;
      if (!open) list.querySelector('[aria-selected="true"]').focus();
    });
    list.addEventListener('click', function (e) {
      var o = e.target.closest('.listbox__option');
      if (!o) return;
      setLoan(o.getAttribute('data-loan'));
      lb.setAttribute('aria-expanded', 'false');
      list.hidden = true;
      lb.focus();
    });
    list.addEventListener('keydown', function (e) {
      var options = Array.prototype.slice.call(list.querySelectorAll('.listbox__option'));
      var i = options.indexOf(document.activeElement);
      if (e.key === 'Tab' || e.key === 'ArrowDown') {
        e.preventDefault();
        options[(i + 1) % options.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        options[(i - 1 + options.length) % options.length].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.activeElement.click();
      }
    });

    // Reserve: add to the basket, start the hold, show a toast.
    var toast = document.getElementById('toast');
    var toastTimer = null;
    document.getElementById('reserve').addEventListener('click', function () {
      var error = document.getElementById('day-error');
      if (!selectedDay) {
        error.hidden = false;
        error.textContent = 'Choose a pick-up day first.';
        cal.querySelector('.day').focus();
        return;
      }
      error.hidden = true;
      var b = readBasket();
      b.items = b.items.filter(function (it) { return it.id !== tool.id; });
      b.items.push({ id: tool.id, day: selectedDay, loan: loan });
      writeBasket(b);
      startHoldIfNeeded();
      updateBasketCount();
      toast.textContent = 'Added to your basket';
      toast.hidden = false;
      toast.classList.remove('is-leaving');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.add('is-leaving');
        setTimeout(function () { toast.hidden = true; }, 150);
      }, 1200);
    });
  }

  // ?items=a,b&day=YYYY-MM-DD seeds the basket, so a step can be opened on its own (the fixture's states do this).
  function seedFromParams(p) {
    if (!p.get('items')) return;
    var day = p.get('day') || '2026-10-17';
    var loan = p.get('loan') || '1w';
    writeBasket({ items: p.get('items').split(',').filter(Boolean).map(function (id) { return { id: id, day: day, loan: loan }; }) });
    startHoldIfNeeded();
    updateBasketCount();
  }

  function initBasket() {
    var p = params();
    var basket = readBasket();
    var list = document.getElementById('basket-list');
    var empty = document.getElementById('basket-empty');
    var form = document.getElementById('basket-form');
    var sessions = document.getElementById('sessions');
    var error = document.getElementById('error-summary');

    function render() {
      basket = readBasket();
      if (!basket.items.length) {
        empty.hidden = false;
        form.hidden = true;
        list.innerHTML = '';
        return;
      }
      empty.hidden = true;
      form.hidden = false;
      list.innerHTML = basket.items.map(function (it) {
        var t = toolById(it.id);
        var l = LOANS.filter(function (x) { return x.id === it.loan; })[0] || LOANS[0];
        return '<li><div><h2 class="h3">' + escapeHtml(t ? t.name : it.id) + '</h2><p class="hint">Pick up ' + longDate(it.day) + ' · ' + l.label.toLowerCase() + ' · deposit £' + (t ? t.deposit : '') + '</p></div>' +
          '<button type="button" class="button--quiet" data-remove="' + it.id + '">Remove<span class="sr-only"> ' + escapeHtml(t ? t.name : it.id) + '</span></button></li>';
      }).join('');
    }
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-remove]');
      if (!b) return;
      var id = b.getAttribute('data-remove');
      writeBasket({ items: readBasket().items.filter(function (it) { return it.id !== id; }) });
      updateBasketCount();
      render();
      document.getElementById('basket-heading').focus();
    });
    render();

    var chosen = p.get('slot') || '';
    sessions.innerHTML = SESSIONS.map(function (s, i) {
      return '<div class="session"><label><input type="radio" name="slot" value="' + s.id + '"' + (s.id === chosen ? ' checked' : '') + '><span>' + s.label + '</span></label></div>';
    }).join('');

    function radios() {
      return Array.prototype.slice.call(form.querySelectorAll('input[name="slot"]'));
    }
    var sessionsError = document.getElementById('sessions-error');
    sessions.addEventListener('change', function () {
      radios().forEach(function (r) { r.removeAttribute('aria-invalid'); r.removeAttribute('aria-describedby'); });
      sessionsError.hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var slot = form.querySelector('input[name="slot"]:checked');
      error.hidden = true;
      if (!slot) {
        sessionsError.textContent = 'Choose a pick-up session';
        sessionsError.hidden = false;
        radios().forEach(function (r) { r.setAttribute('aria-invalid', 'true'); r.setAttribute('aria-describedby', 'sessions-error'); });
        document.getElementById('error-list').innerHTML = '<li><a href="#sessions">Choose a pick-up session</a></li>';
        error.hidden = false;
        error.focus();
        return;
      }
      var btn = document.getElementById('continue');
      btn.setAttribute('aria-busy', 'true');
      setTimeout(function () {
        btn.removeAttribute('aria-busy');
        if (holdExpired()) {
          document.getElementById('error-list').innerHTML = '<li>Something went wrong. Try again.</li>';
          error.hidden = false;
          error.focus();
          return;
        }
        location.href = 'confirm.html?slot=' + encodeURIComponent(slot.value);
      }, 1200);
    });
  }

  function initConfirm() {
    var p = params();
    var basket = readBasket();
    var slot = sessionById(p.get('slot') || '');
    var summary = document.getElementById('summary-tools');
    summary.innerHTML = basket.items.length ? basket.items.map(function (it) {
      var t = toolById(it.id);
      var l = LOANS.filter(function (x) { return x.id === it.loan; })[0] || LOANS[0];
      return '<li>' + escapeHtml(t ? t.name : it.id) + ', ' + l.label.toLowerCase() + ', pick up ' + longDate(it.day) + '</li>';
    }).join('') : '<li>Your basket is empty.</li>';
    document.getElementById('summary-slot').textContent = slot ? slot.label : 'Not chosen';
    document.getElementById('summary-deposit').textContent = '£' + basket.items.reduce(function (sum, it) { var t = toolById(it.id); return sum + (t ? t.deposit : 0); }, 0) + ' in cash or by card at the desk';

    var form = document.getElementById('confirm-form');
    var error = document.getElementById('error-summary');
    var fields = [
      { id: 'member', label: 'Membership number', check: function (v) { return /^FT-\d{5}$/.test(v.trim()) ? '' : 'Enter your membership number, like FT-01234'; } },
      { id: 'name', label: 'Your name', check: function (v) { return v.trim() ? '' : 'Enter your name'; } },
      { id: 'phone', label: 'Mobile number', check: function (v) { return /^0\d{4}\s?\d{6}$/.test(v.trim()) ? '' : 'Enter a UK mobile number, like 07700 900123'; } },
    ];

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var problems = [];
      fields.forEach(function (f) {
        var input = document.getElementById(f.id);
        var msg = f.check(input.value);
        var out = document.getElementById(f.id + '-error');
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        out.textContent = msg;
        out.hidden = !msg;
        if (msg) problems.push('<li><a href="#' + f.id + '">' + msg + '</a></li>');
      });
      if (!slot) problems.push('<li><a href="basket.html">Choose a pick-up session</a></li>');
      if (problems.length) {
        document.getElementById('error-list').innerHTML = problems.join('');
        error.hidden = false;
        error.focus();
        return;
      }
      error.hidden = true;
      // Allocate the reservation now; the desk's system answers after a moment.
      var refs = JSON.parse(sessionStorage.getItem('reservations') || '[]');
      var next = 4471 + refs.length;
      var ref = 'FT-' + next;
      refs.push({ ref: ref, slot: slot.id, items: basket.items.map(function (it) { return it.id; }) });
      sessionStorage.setItem('reservations', JSON.stringify(refs));
      var btn = document.getElementById('confirm');
      btn.setAttribute('aria-busy', 'true');
      setTimeout(function () {
        var closed = basket.items.filter(function (it) { return !isOpenDay(it.day); });
        if (closed.length) {
          sessionStorage.setItem('reservations', JSON.stringify(refs.filter(function (r) { return r.ref !== ref; })));
          btn.removeAttribute('aria-busy');
          document.getElementById('error-list').innerHTML = closed.map(function (it) {
            return '<li>The library is closed on ' + longDate(it.day) + ', so this pick-up day is not possible. Choose another day.</li>';
          }).join('');
          error.hidden = false;
          error.focus();
          return;
        }
        location.href = 'done.html?slot=' + encodeURIComponent(slot.id);
      }, 1500);
    });
  }

  function initDone() {
    var p = params();
    var refs = JSON.parse(sessionStorage.getItem('reservations') || '[]');
    if (p.get('ref') && !refs.length) refs = [{ ref: p.get('ref'), slot: p.get('slot') || '', items: readBasket().items.map(function (it) { return it.id; }) }];
    var slot = sessionById(params().get('slot') || '') || (refs.length ? sessionById(refs[refs.length - 1].slot) : null);
    var mine = refs.filter(function (r) { return !slot || r.slot === slot.id; });
    var refText = mine.length > 1 ? mine.map(function (r) { return r.ref; }).join(' and ') : (mine[0] ? mine[0].ref : 'FT-4471');
    document.getElementById('c-ref').textContent = refText;
    document.getElementById('c-ref-label').textContent = mine.length > 1 ? 'Reservation numbers' : 'Reservation number';
    document.getElementById('c-slot').textContent = slot ? slot.label : 'See your confirmation text';
    var items = mine.length ? mine[mine.length - 1].items : readBasket().items.map(function (it) { return it.id; });
    document.getElementById('c-tools').innerHTML = items.map(function (id) { var t = toolById(id); return '<li>' + escapeHtml(t ? t.name : id) + '</li>'; }).join('') || '<li>See your confirmation text</li>';
    var first = toolById(items[0]);
    document.getElementById('c-tool').textContent = first ? first.name : '';
    document.getElementById('c-deposit').textContent = '£' + items.reduce(function (sum, id) { var t = toolById(id); return sum + (t ? t.deposit : 0); }, 0);
    document.getElementById('another').addEventListener('click', function () {
      writeBasket({ items: [] });
      sessionStorage.removeItem('hold_started');
    });
  }
})();
