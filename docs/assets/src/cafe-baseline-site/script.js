/* ==================================================================
   Repair Café – small helpers for the one-page site
   1. Works out the next "first Saturday of the month" and shows it.
   2. Lists the upcoming Saturdays people can book.
   3. Checks the booking form, then sends it by email (or to a form
      service, if you've set one up – see the comment in index.html).

   No libraries. If this file doesn't load, the page still works: it
   says "first Saturday of every month" and the form opens an email.
   ================================================================== */
(function () {
  'use strict';

  /* ---------- SETTINGS: change these if your schedule changes ---------- */
  const SETTINGS = {
    startHour: 10,   // doors open (24-hour clock)
    endHour: 13,     // finish (13 = 1pm)
    bookAhead: 3,    // how many upcoming Saturdays people can choose from
    // Saturdays you're NOT running (hall unavailable, holidays…),
    // written as 'YYYY-MM-DD', for example: ['2027-01-02']
    skipDates: []
  };
  // If you change the hours, change the arrival times in index.html too.

  /* ---------- Dates ---------- */

  const DAY_MS = 24 * 60 * 60 * 1000;
  // Spelled out (rather than left to the browser) so every browser shows exactly the same text.
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  const weekdayName = (d) => DAYS[d.getDay()];
  const dayMonth = (d) => d.getDate() + ' ' + MONTHS[d.getMonth()];                 // "3 October"
  const shortDate = (d) => DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' +
    MONTHS[d.getMonth()].slice(0, 3);                                                // "Sat 3 Oct"

  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const daysUntil = (now, day) => Math.round((startOfDay(day) - startOfDay(now)) / DAY_MS);
  const hourLabel = (h) => (h % 12 || 12) + (h < 12 ? 'am' : 'pm');

  function firstSaturday(year, month) {
    const first = new Date(year, month, 1);
    return new Date(year, month, 1 + ((6 - first.getDay() + 7) % 7));
  }

  // The next `count` sessions that haven't finished yet, skipping any in skipDates.
  function upcomingSessions(now, count) {
    const sessions = [];
    let year = now.getFullYear();
    let month = now.getMonth();
    for (let tries = 0; sessions.length < count && tries < 48; tries++) {
      const day = firstSaturday(year, month);
      const finish = new Date(year, month, day.getDate(), SETTINGS.endHour);
      if (finish > now && SETTINGS.skipDates.indexOf(isoDate(day)) === -1) sessions.push(day);
      month += 1;
      if (month > 11) { month = 0; year += 1; }
    }
    return sessions;
  }

  // "Saturday 3 October", plus the year when it isn't this year.
  function longDate(now, day) {
    return weekdayName(day) + ' ' + dayMonth(day) +
      (day.getFullYear() !== now.getFullYear() ? ' ' + day.getFullYear() : '');
  }

  function whenLabel(now, day) {
    const days = daysUntil(now, day);
    if (days === 0) {
      return now.getHours() >= SETTINGS.startHour
        ? 'On now – until ' + hourLabel(SETTINGS.endHour)
        : 'Today – doors open at ' + hourLabel(SETTINGS.startHour);
    }
    if (days === 1) return 'Tomorrow';
    if (days < 14) return 'In ' + days + ' days';
    return 'In ' + Math.round(days / 7) + ' weeks';
  }

  /* ---------- Small DOM helpers ---------- */

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function svgIcon(id) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  /* ---------- 1. Next date on the luggage tag ---------- */

  function showNextSession(now) {
    const target = document.getElementById('next-date');
    const chip = document.getElementById('next-when');
    const next = upcomingSessions(now, 1)[0];
    if (!target || !next) return;

    const time = el('time');
    time.dateTime = isoDate(next) + 'T' + pad(SETTINGS.startHour) + ':00';
    time.append(
      el('span', 'tag-weekday', weekdayName(next)), ' ',
      el('span', 'tag-daymonth', dayMonth(next))
    );
    if (next.getFullYear() !== now.getFullYear()) {
      time.append(' ', el('span', 'tag-year', String(next.getFullYear())));
    }
    target.textContent = '';
    target.appendChild(time);
    target.classList.remove('is-fallback');

    if (chip) {
      chip.textContent = whenLabel(now, next);
      chip.hidden = false;
    }
  }

  /* ---------- 2. Dates people can book ---------- */

  function fillBookingDates(now) {
    const select = document.getElementById('b-date');
    if (!select) return;
    const today = startOfDay(now);
    const sessions = upcomingSessions(now, SETTINGS.bookAhead + 1);
    const bookable = sessions.filter((d) => d > today).slice(0, SETTINGS.bookAhead);

    select.textContent = '';
    bookable.forEach((d, i) => {
      const label = longDate(now, d);
      const option = new Option(label, label, i === 0, i === 0);
      option.setAttribute('data-short', shortDate(d));
      select.add(option);
    });

    // On the day itself, point people to just drop in.
    const hint = document.getElementById('b-date-hint');
    if (hint && sessions[0] && daysUntil(now, sessions[0]) === 0) {
      hint.textContent = 'We’re on today until ' + hourLabel(SETTINGS.endHour) +
        ' – just drop in! Or book a slot for another date.';
    }
  }

  /* ---------- 3. Booking form ---------- */

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Where each error message lives, and which controls get marked invalid.
  const ERROR_SLOTS = {
    date: { message: 'b-date-error', controls: ['b-date'] },
    slot: { message: 'b-slot-error', group: 'b-slot-group' },
    item: { message: 'b-item-error', group: 'b-item-group' },
    details: { message: 'b-details-error', controls: ['b-details'] },
    name: { message: 'b-name-error', controls: ['b-name'] },
    contact: { message: 'b-contact-error', controls: ['b-email', 'b-phone'] }
  };

  function readForm(form) {
    const field = (name) => form.elements.namedItem(name);
    const checked = (name) => form.querySelector('input[name="' + name + '"]:checked');
    const dateSelect = field('date');
    const dateOption = dateSelect.options[dateSelect.selectedIndex];
    const slot = checked('slot');
    const item = checked('item');
    return {
      date: dateSelect.value,
      dateShort: dateOption ? (dateOption.getAttribute('data-short') || dateOption.text) : '',
      slot: slot ? slot.value : '',
      item: item ? item.value : '',
      details: field('details').value.trim(),
      name: field('name').value.trim(),
      email: field('email').value.trim(),
      phone: field('phone').value.trim(),
      trap: field('_gotcha').value
    };
  }

  function validate(form, d) {
    const field = (name) => form.elements.namedItem(name);
    const firstRadio = (name) => form.querySelector('input[name="' + name + '"]');
    const errors = [];
    const add = (key, focus, message, invalid) => errors.push({ key, focus, message, invalid: invalid || [] });

    if (!d.date) add('date', field('date'), 'Choose which Saturday you’d like to come.', [field('date')]);
    if (!d.slot) add('slot', firstRadio('slot'), 'Choose a time to arrive.');
    if (!d.item) add('item', firstRadio('item'), 'Tell us what kind of thing you’re bringing.');
    if (!d.details) add('details', field('details'), 'Tell us a little about what’s wrong with it.', [field('details')]);
    if (!d.name) add('name', field('name'), 'Tell us your name.', [field('name')]);

    const email = field('email');
    const phone = field('phone');
    if (!d.email && !d.phone) {
      add('contact', email, 'Give us an email address or phone number so we can confirm your slot.', [email, phone]);
    } else if (d.email && !EMAIL_PATTERN.test(d.email)) {
      add('contact', email, 'That email address doesn’t look quite right – please check it.', [email]);
    } else if (d.phone && d.phone.replace(/\D/g, '').length < 7) {
      add('contact', phone, 'That phone number looks too short – please check it.', [phone]);
    }
    return errors;
  }

  // onlyClear: used while typing after a failed submit. It removes messages
  // that have been fixed, but never adds new ones until the next submit.
  function renderErrors(errors, onlyClear) {
    Object.keys(ERROR_SLOTS).forEach((key) => {
      const slot = ERROR_SLOTS[key];
      const box = document.getElementById(slot.message);
      if (!box) return;
      const error = errors.find((e) => e.key === key);
      const current = box.hidden ? null : box.getAttribute('data-message');

      let message = null;
      if (error) message = onlyClear ? (current === error.message ? current : null) : error.message;

      if (message) {
        if (message !== current) {
          const text = el('span');
          text.append(el('span', 'visually-hidden', 'Error: '), message);
          box.textContent = '';
          box.append(svgIcon('i-alert'), text);
          box.setAttribute('data-message', message);
        }
        box.hidden = false;
      } else {
        box.textContent = '';
        box.removeAttribute('data-message');
        box.hidden = true;
      }

      (slot.controls || []).forEach((id) => {
        const control = document.getElementById(id);
        if (!control) return;
        if (message && error.invalid.indexOf(control) !== -1) control.setAttribute('aria-invalid', 'true');
        else control.removeAttribute('aria-invalid');
      });
      if (slot.group) {
        const group = document.getElementById(slot.group);
        if (group) group.classList.toggle('has-error', Boolean(message));
      }
    });
  }

  function subjectLine(d) {
    return 'Repair booking: ' + d.dateShort + ', ' + d.slot + ' – ' + d.item;
  }

  function bookingText(d) {
    const lines = [
      'Hello! I’d like to book a repair slot.',
      '',
      'Date: ' + d.date,
      'Arriving at: ' + d.slot,
      'Bringing: ' + d.item,
      'What’s wrong: ' + d.details,
      '',
      'Name: ' + d.name
    ];
    if (d.email) lines.push('Email: ' + d.email);
    if (d.phone) lines.push('Phone: ' + d.phone);
    return lines.join('\n');
  }

  function mailtoLink(to, d) {
    return 'mailto:' + to +
      '?subject=' + encodeURIComponent(subjectLine(d)) +
      '&body=' + encodeURIComponent(bookingText(d).replace(/\n/g, '\r\n'));
  }

  function openLink(href) {
    const link = document.createElement('a');
    link.href = href;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function initBooking() {
    const form = document.getElementById('booking-form');
    const done = document.getElementById('booking-done');
    if (!form || !done) return;

    const orgEmail = (form.getAttribute('action') || '').replace(/^mailto:/i, '').split('?')[0].trim();
    const endpoint = (form.getAttribute('data-endpoint') || '').trim();
    const submitButton = form.querySelector('button[type="submit"]');
    const submitLabel = submitButton.textContent;
    const title = document.getElementById('done-title');
    const textBox = done.querySelector('[data-fill="text"]');
    const copyStatus = done.querySelector('[data-copy-status]');
    let submittedOnce = false;

    form.noValidate = true; // we show our own, friendlier messages instead

    // Keep the "email us instead" link in step with the form's address.
    done.querySelectorAll('[data-fill="org-email"]').forEach((link) => {
      link.textContent = orgEmail;
      link.href = 'mailto:' + orgEmail;
    });

    if (endpoint) {
      const hint = document.getElementById('submit-hint');
      if (hint) hint.textContent = 'We’ll get back to you to confirm your slot.';
    } else if (/@example\.(org|com|net)$/i.test(orgEmail)) {
      const note = document.getElementById('setup-note');
      if (note) note.hidden = false;
    }

    function showDone(mode, data) {
      const titles = {
        email: 'Nearly done, ' + data.name + '!',
        sent: 'Thanks, ' + data.name + '!',
        failed: 'Sorry, that didn’t send'
      };
      done.setAttribute('data-mode', mode);
      done.querySelectorAll('[data-show]').forEach((node) => {
        node.toggleAttribute('hidden', node.getAttribute('data-show').split(' ').indexOf(mode) === -1);
      });
      done.querySelectorAll('[data-fill="when"]').forEach((node) => {
        node.textContent = data.slot + ' on ' + data.date;
      });
      textBox.value = 'To: ' + orgEmail + '\nSubject: ' + subjectLine(data) + '\n\n' + bookingText(data);
      copyStatus.textContent = '';
      title.textContent = titles[mode];
      form.hidden = true;
      done.hidden = false;
      // Grow the text box to fit, so nobody has to scroll inside it on a phone.
      textBox.style.height = 'auto';
      if (textBox.scrollHeight) textBox.style.height = (textBox.scrollHeight + 4) + 'px';
      title.focus();
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      submittedOnce = true;
      const data = readForm(form);
      const errors = validate(form, data);
      renderErrors(errors, false);
      if (errors.length) {
        errors[0].focus.focus();
        return;
      }

      if (data.trap) { // only bots fill in the hidden spam-trap field
        showDone('sent', data);
        return;
      }

      if (!endpoint) {
        openLink(mailtoLink(orgEmail, data));
        showDone('email', data);
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
      try {
        const body = new FormData(form);
        body.append('_subject', subjectLine(data));
        const response = await fetch(endpoint, {
          method: 'POST',
          body: body,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Status ' + response.status);
        showDone('sent', data);
      } catch (err) {
        showDone('failed', data);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
      }
    });

    // After a failed submit, clear each message as soon as it's fixed.
    const recheck = () => {
      if (submittedOnce) renderErrors(validate(form, readForm(form)), true);
    };
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);

    done.querySelector('[data-action="copy"]').addEventListener('click', async () => {
      let copied = false;
      try {
        await navigator.clipboard.writeText(textBox.value);
        copied = true;
      } catch (err) {
        textBox.focus();
        textBox.select();
        try { copied = document.execCommand('copy'); } catch (err2) { copied = false; }
      }
      copyStatus.textContent = copied
        ? 'Copied – now paste it into an email to us.'
        : 'Select the text above and copy it.';
    });

    done.querySelector('[data-action="again"]').addEventListener('click', () => {
      // Keep the person's contact details; clear the item details.
      const keep = ['name', 'email', 'phone'].map((n) => [n, form.elements.namedItem(n).value]);
      form.reset();
      keep.forEach(([n, value]) => { form.elements.namedItem(n).value = value; });
      submittedOnce = false;
      renderErrors([], false);
      done.hidden = true;
      form.hidden = false;
      form.elements.namedItem('date').focus();
    });
  }

  /* ---------- Start ---------- */

  function init() {
    const now = new Date();
    showNextSession(now);
    fillBookingDates(now);
    initBooking();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
