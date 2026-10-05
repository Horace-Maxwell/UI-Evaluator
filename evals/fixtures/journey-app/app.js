// Saltmarsh Quay booking flow. Stay details travel in the query string; contact details are never put in a URL.
(function () {
  var BERTHS = {
    A6: { name: 'Pontoon A, berth 6', max: 8, rate: 2.8 },
    B14: { name: 'Pontoon B, berth 14', max: 10, rate: 3.2 },
    C3: { name: 'Pontoon C, berth 3', max: 12, rate: 3.6 },
    W2: { name: 'Wall berth 2', max: 15, rate: 2.4 }
  };
  var params = new URLSearchParams(window.location.search);
  var page = document.body.getAttribute('data-page');

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // One date format for the whole flow ("Saturday 17 October 2026"), independent of the browser's locale data.
  function longDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
    var d = new Date(iso + 'T12:00:00');
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function nightsText(n) {
    var v = Number(n) || 1;
    return v === 1 ? '1 night' : v + ' nights';
  }

  function money(v) {
    return '£' + v.toFixed(2);
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  function errorKit(fieldIds) {
    var summary = document.getElementById('error-summary');
    var list = document.getElementById('error-list');
    return {
      clear: function () {
        fieldIds.forEach(function (id) {
          var input = document.getElementById(id);
          var msg = document.getElementById(id + '-error');
          if (msg) {
            msg.hidden = true;
            msg.textContent = '';
          }
          if (input) {
            input.removeAttribute('aria-invalid');
            if (input.tagName === 'FIELDSET') {
              input.querySelectorAll('input').forEach(function (r) {
                r.removeAttribute('aria-invalid');
                r.removeAttribute('aria-describedby');
              });
            }
            var hint = document.getElementById(id + '-hint');
            if (hint) input.setAttribute('aria-describedby', hint.id);
            else input.removeAttribute('aria-describedby');
          }
        });
        if (list) list.textContent = '';
        if (summary) summary.hidden = true;
      },
      show: function (problems) {
        problems.forEach(function (p) {
          var input = document.getElementById(p[0]);
          var msg = document.getElementById(p[0] + '-error');
          msg.textContent = p[1];
          msg.hidden = false;
          if (input.tagName === 'FIELDSET') {
            input.querySelectorAll('input').forEach(function (r) {
              r.setAttribute('aria-invalid', 'true');
              r.setAttribute('aria-describedby', msg.id);
            });
          } else input.setAttribute('aria-invalid', 'true');
          var hint = document.getElementById(p[0] + '-hint');
          input.setAttribute('aria-describedby', (hint ? hint.id + ' ' : '') + msg.id);
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#' + p[0];
          a.textContent = p[1];
          li.appendChild(a);
          list.appendChild(li);
        });
        summary.hidden = false;
        summary.focus();
      }
    };
  }

  function stayQuery(extra) {
    var q = new URLSearchParams();
    ['date', 'nights', 'arrive', 'berth', 'boat', 'loa', 'draught', 'mmsi'].forEach(function (k) {
      if (params.get(k)) q.set(k, params.get(k));
    });
    Object.keys(extra || {}).forEach(function (k) {
      q.set(k, extra[k]);
    });
    return q.toString();
  }

  if (page === 'plan') {
    var form = document.getElementById('plan-form');
    var date = document.getElementById('date');
    var nights = document.getElementById('nights');
    var arrive = document.getElementById('arrive');
    if (params.get('date')) date.value = params.get('date');
    if (params.get('nights')) nights.value = params.get('nights');
    if (params.get('arrive')) arrive.value = params.get('arrive');
    var kit = errorKit(['date', 'arrive']);
    form.addEventListener('submit', function (event) {
      kit.clear();
      var problems = [];
      if (!date.value) problems.push(['date', 'Enter the date you plan to arrive']);
      if (!arrive.value) problems.push(['arrive', 'Choose the time you plan to arrive']);
      if (problems.length) {
        event.preventDefault();
        kit.show(problems);
      }
    });
  }

  if (page === 'berths') {
    setText('stay-date', longDate(params.get('date')));
    setText('stay-time', params.get('arrive'));
    setText('stay-nights', params.get('nights') ? 'for ' + nightsText(params.get('nights')) : null);
    document.getElementById('f-date').value = params.get('date') || '';
    document.getElementById('f-nights').value = params.get('nights') || '';
    document.getElementById('f-arrive').value = params.get('arrive') || '';
    document.getElementById('change-dates').href = 'index.html?' + stayQuery();

    var moreButton = document.getElementById('more-button');
    var menu = document.getElementById('more-menu');
    function closeMenu(returnFocus) {
      menu.hidden = true;
      moreButton.setAttribute('aria-expanded', 'false');
      if (returnFocus) moreButton.focus();
    }
    moreButton.addEventListener('click', function () {
      var open = menu.hidden;
      menu.hidden = !open;
      moreButton.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
    });
    document.addEventListener('click', function (event) {
      if (!menu.hidden && !menu.contains(event.target) && !moreButton.contains(event.target)) closeMenu(false);
    });

    var berthForm = document.getElementById('berth-form');
    var berthKit = errorKit(['berth']);
    berthForm.addEventListener('submit', function (event) {
      berthKit.clear();
      if (!berthForm.querySelector('input[name="berth"]:checked')) {
        event.preventDefault();
        berthKit.show([['berth', 'Choose a pontoon space for your boat']]);
      }
    });
  }

  if (page === 'boat') {
    var boatForm = document.getElementById('boat-form');
    // The form is emptied whenever the page is shown, including after the browser's Back button.
    window.addEventListener('pageshow', function () {
      boatForm.reset();
    });
    var boatKit = errorKit(['boat', 'loa', 'draught', 'mmsi']);
    boatForm.addEventListener('submit', function (event) {
      event.preventDefault();
      boatKit.clear();
      var v = function (id) {
        return document.getElementById(id).value.trim();
      };
      var problems = [];
      if (!v('boat')) problems.push(['boat', 'Enter the boat name']);
      if (!v('loa')) problems.push(['loa', 'Enter the length']);
      else if (!(Number(v('loa')) > 0)) problems.push(['loa', 'Enter the length as a number']);
      if (!v('draught')) problems.push(['draught', 'Enter the draught in metres, for example 1.5']);
      else if (!(Number(v('draught')) > 0)) problems.push(['draught', 'Enter the draught as a number of metres, for example 1.5']);
      if (!v('mmsi')) problems.push(['mmsi', 'Enter the MMSI']);
      if (problems.length) {
        boatKit.show(problems);
        return;
      }
      var berth = BERTHS[params.get('berth')] || BERTHS.B14;
      if (Number(v('loa')) > berth.max) {
        document.getElementById('boat-step').hidden = true;
        var stop = document.getElementById('dead-end');
        stop.hidden = false;
        document.getElementById('stopped-title').focus();
        return;
      }
      window.location.assign('review.html?' + stayQuery({ boat: v('boat'), loa: v('loa'), draught: v('draught'), mmsi: v('mmsi') }));
    });
  }

  if (page === 'review') {
    var berthR = BERTHS[params.get('berth')];
    var arrivalR = longDate(params.get('date'));
    setText('s-arrival', arrivalR && params.get('arrive') ? arrivalR + ' at ' + params.get('arrive') : arrivalR);
    setText('s-nights', params.get('nights') ? nightsText(params.get('nights')) : null);
    setText('s-berth', berthR ? berthR.name : null);
    setText('s-boat', params.get('boat') ? params.get('boat') + ', ' + params.get('loa') + ' metres long' : null);
    if (berthR && Number(params.get('loa')) > 0) {
      var total = berthR.rate * Number(params.get('loa')) * (Number(params.get('nights')) || 1);
      setText('s-total', money(total) + ', paid on arrival');
    }
    var contact = document.getElementById('contact-form');
    var contactKit = errorKit(['skipper', 'mobile']);
    contact.addEventListener('submit', function (event) {
      event.preventDefault();
      contactKit.clear();
      var problems = [];
      if (!document.getElementById('skipper').value.trim()) problems.push(['skipper', 'Enter the skipper’s name']);
      var mobile = document.getElementById('mobile').value.replace(/[\s()-]/g, '');
      if (!mobile) problems.push(['mobile', 'Enter a mobile number so the harbour office can reach you']);
      else if (!/^\+?\d{10,14}$/.test(mobile)) problems.push(['mobile', 'Enter a mobile number with 10 to 14 digits']);
      if (problems.length) {
        contactKit.show(problems);
        return;
      }
      var q = new URLSearchParams();
      ['date', 'nights', 'berth'].forEach(function (k) {
        if (params.get(k)) q.set(k, params.get(k));
      });
      window.location.assign('confirmed.html?' + q.toString());
    });
  }

  if (page === 'confirmed') {
    var berthC = BERTHS[params.get('berth')];
    var dateC = params.get('date') || '';
    setText('c-arrival', longDate(dateC));
    setText('c-berth', berthC ? berthC.name : null);
    setText('c-nights', params.get('nights') ? nightsText(params.get('nights')) : null);
    if (dateC && params.get('berth')) setText('ref', 'SQ-' + dateC.slice(5, 7) + dateC.slice(8, 10) + '-' + params.get('berth'));
  }
})();
