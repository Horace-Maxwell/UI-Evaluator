// Margins seller flow: account, listing, handover. Seeded fixture: see ground-truth.json.
(function () {
  var page = document.body.getAttribute('data-page');

  if (page === 'account') {
    var form = document.getElementById('account-form');
    var create = document.getElementById('create');
    var fields = ['fullname', 'email', 'mobile', 'password'].map(function (id) {
      return document.getElementById(id);
    });
    var password = document.getElementById('password');

    // The button stays disabled until every field looks complete; nothing says which one is missing.
    function update() {
      var complete = fields.every(function (f) {
        return f.value.trim() !== '';
      }) && password.value.length >= 10;
      create.disabled = !complete;
    }
    fields.forEach(function (f) {
      f.addEventListener('input', update);
    });
    update();

    document.getElementById('clear-email').addEventListener('click', function () {
      document.getElementById('email').value = '';
      update();
    });

    var toggle = document.getElementById('toggle-password');
    toggle.addEventListener('click', function () {
      var show = password.type === 'password';
      password.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!create.disabled) window.location.assign('listing.html');
    });
  }

  if (page === 'listing') {
    var listing = document.getElementById('listing-form');
    listing.addEventListener('submit', function (event) {
      var checks = [
        ['isbn', function (v) { return /^(\d{10}|\d{13})$/.test(v.replace(/[\s-]/g, '')); }],
        ['title', function (v) { return v.trim().length > 0; }],
        ['price', function (v) { return /^\d+(\.\d{1,2})?$/.test(v.trim()) && Number(v) > 0; }]
      ];
      var firstBad = null;
      checks.forEach(function (c) {
        var input = document.getElementById(c[0]);
        var msg = document.getElementById(c[0] + '-error');
        if (c[1](input.value)) {
          msg.hidden = true;
          msg.textContent = '';
          input.removeAttribute('aria-invalid');
          input.removeAttribute('aria-describedby');
        } else {
          msg.textContent = 'Invalid';
          msg.hidden = false;
          input.setAttribute('aria-invalid', 'true');
          input.setAttribute('aria-describedby', msg.id);
          if (!firstBad) firstBad = input;
        }
      });
      if (firstBad) {
        event.preventDefault();
        firstBad.focus();
      }
    });
  }

  if (page === 'handover') {
    // A notice arrives after the page has rendered and pushes the form down.
    window.setTimeout(function () {
      var slot = document.getElementById('notice-slot');
      var notice = document.createElement('div');
      notice.className = 'notice';
      notice.innerHTML = '<p><strong>Exam weeks:</strong> staffed handover points close at 16:00 on Fridays from 4 January to 29 January.</p>' +
        '<p>Plan Friday handovers for the morning, or use the library entrance, which stays open until the library closes.</p>';
      slot.appendChild(notice);
    }, 400);

    var saveNote = document.getElementById('save-note');
    document.getElementById('save-draft').addEventListener('click', function () {
      saveNote.textContent = '';
      window.setTimeout(function () {
        saveNote.textContent = 'Draft saved. You can come back to it from your account.';
      }, 700);
    });

    var handover = document.getElementById('handover-form');
    var point = document.getElementById('point');
    var pointError = document.getElementById('point-error');
    handover.addEventListener('submit', function (event) {
      var chosen = handover.querySelector('input[name="point"]:checked');
      var radios = handover.querySelectorAll('input[name="point"]');
      if (chosen) {
        pointError.hidden = true;
        point.setAttribute('aria-describedby', 'point-hint');
        radios.forEach(function (r) {
          r.removeAttribute('aria-invalid');
          r.removeAttribute('aria-describedby');
        });
        return;
      }
      event.preventDefault();
      pointError.textContent = 'Choose where you will meet the buyer';
      pointError.hidden = false;
      point.setAttribute('aria-describedby', 'point-hint point-error');
      radios.forEach(function (r) {
        r.setAttribute('aria-invalid', 'true');
        r.setAttribute('aria-describedby', 'point-error');
      });
    });
  }
})();
