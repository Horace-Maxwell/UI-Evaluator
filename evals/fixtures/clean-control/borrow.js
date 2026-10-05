// Request form: validates on submit, lists every problem in the error summary, moves focus to it,
// and announces the result in a status region without moving focus.
(function () {
  var form = document.getElementById('borrow-form');
  var summary = document.getElementById('error-summary');
  var summaryList = document.getElementById('error-list');
  var submit = document.getElementById('submit');
  var confirmation = document.getElementById('confirmation');

  var fields = {
    card: { input: document.getElementById('card'), error: document.getElementById('card-error'), hint: 'card-hint' },
    name: { input: document.getElementById('name'), error: document.getElementById('name-error'), hint: null },
    email: { input: document.getElementById('email'), error: document.getElementById('email-error'), hint: 'email-hint' },
    varieties: { input: document.getElementById('varieties'), error: document.getElementById('varieties-error'), hint: 'varieties-hint' },
    branch: { input: document.getElementById('branch'), error: document.getElementById('branch-error'), hint: null }
  };

  function chosenVarieties() {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="variety"]:checked'));
  }

  // The checkboxes of the varieties group. A fieldset cannot carry aria-invalid, so in an error each checkbox is
  // marked invalid and described by the group's error message (the fieldset keeps its own description as well).
  function groupBoxes(key) {
    return key === 'varieties' ? Array.prototype.slice.call(fields.varieties.input.querySelectorAll('input[type="checkbox"]')) : [];
  }

  function check() {
    var problems = [];
    var card = fields.card.input.value.replace(/\s+/g, '');
    if (!card) problems.push(['card', 'Enter your library card number']);
    else if (!/^\d{8}$/.test(card)) problems.push(['card', 'Library card numbers have 8 digits, printed on the back of the card']);
    if (!fields.name.input.value.trim()) problems.push(['name', 'Enter your full name']);
    var email = fields.email.input.value.trim();
    if (!email) problems.push(['email', 'Enter your email address']);
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problems.push(['email', 'Enter an email address with an @ sign and the part after it']);
    var count = chosenVarieties().length;
    if (count === 0) problems.push(['varieties', 'Choose at least one variety']);
    else if (count > 3) problems.push(['varieties', 'Choose no more than three varieties']);
    if (!fields.branch.input.value) problems.push(['branch', 'Choose where to collect your packets']);
    return problems;
  }

  function clearErrors() {
    Object.keys(fields).forEach(function (key) {
      var f = fields[key];
      f.error.hidden = true;
      f.error.textContent = '';
      f.input.removeAttribute('aria-invalid');
      groupBoxes(key).forEach(function (box) {
        box.removeAttribute('aria-invalid');
        box.removeAttribute('aria-describedby');
      });
      f.input.setAttribute('aria-describedby', [f.hint].filter(Boolean).join(' '));
      if (!f.hint) f.input.removeAttribute('aria-describedby');
    });
    summaryList.textContent = '';
    summary.hidden = true;
  }

  function showErrors(problems) {
    problems.forEach(function (p) {
      var f = fields[p[0]];
      f.error.textContent = p[1];
      f.error.hidden = false;
      if (p[0] !== 'varieties') f.input.setAttribute('aria-invalid', 'true');
      groupBoxes(p[0]).forEach(function (box) {
        box.setAttribute('aria-invalid', 'true');
        box.setAttribute('aria-describedby', f.error.id);
      });
      f.input.setAttribute('aria-describedby', [f.hint, f.error.id].filter(Boolean).join(' '));
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + f.input.id;
      a.textContent = p[1];
      li.appendChild(a);
      summaryList.appendChild(li);
    });
    summary.hidden = false;
    summary.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    confirmation.textContent = '';
    clearErrors();
    var problems = check();
    if (problems.length) {
      showErrors(problems);
      return;
    }
    submit.textContent = 'Sending request…';
    form.setAttribute('aria-busy', 'true');
    window.setTimeout(function () {
      form.removeAttribute('aria-busy');
      submit.textContent = 'Request packets';
      confirmation.textContent = 'Request sent. We will email you when your packets are ready to collect.';
      form.reset();
    }, 600);
  });
})();
