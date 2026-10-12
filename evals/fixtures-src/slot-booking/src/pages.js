// The four steps. Seeded problems are marked R01–R14 in comments here (the bundle carries none of these comments).
import { TODAY, NOW_MINUTES, SLOT_MINUTES, SLOT_LOAD_MS, PERMIT_REVEAL_MS, BOOK_MS, VEHICLES, WASTE, longDate, ukDate, fromUkDate, isClosed, inWindow, minutesOf, slotLabel, slotsFor, vehicleById, wasteLabels, makeRef } from './data.js';
import * as store from './store.js';
import { $, esc, toast, showErrors, hideErrors } from './ui.js';

// --- step 1: when ---------------------------------------------------------------------------------------------------

export function initWhen() {
  const state = store.read();
  const dateInput = $('date');
  const grid = $('slots');
  const status = $('slots-status');
  const next = $('next');
  // R12: the step always opens on today, whatever day and slot were chosen before (Change slot forgets them).
  let date = TODAY;
  let chosen = '';
  let loading = false;
  let loadTimer = null;

  dateInput.value = ukDate(date);
  function reflectDay() {
    for (const b of document.querySelectorAll('[data-quick]')) b.setAttribute('aria-pressed', String(b.getAttribute('data-quick') === date));
  }
  reflectDay();

  // R05: the slot buttons never show focus; an agency rule meant for the pressed look removed the outline.
  const style = document.createElement('style');
  style.textContent = '.slot:focus{outline:0}';
  document.head.appendChild(style);

  // R04: below 361 px the grid's columns are sized from the window, not the container, and run past it.
  function fitColumns() {
    if (window.innerWidth <= 360) {
      const w = Math.floor((window.innerWidth - 16) / 3);
      grid.style.gridTemplateColumns = `repeat(3, ${w}px)`;
    } else grid.style.gridTemplateColumns = '';
  }
  window.addEventListener('resize', fitColumns);

  function render(slots) {
    const sorted = slots;
    let html = '';
    let head = '';
    for (const s of sorted) {
      const h = s.minutes < 12 * 60 ? 'Morning' : 'Afternoon';
      if (h !== head) {
        head = h;
        html += `<div class="slots__head" role="heading" aria-level="3">${h}</div>`;
      }
      const end = slotLabel(s.minutes + SLOT_MINUTES);
      const full = s.state === 'full';
      // R13: the slot's length and the arrival rule are only in the tooltip.
      // R10: "few left" slots are moved to the front of the grid by order, against the reading and focus order.
      html += `<button type="button" class="slot" data-slot="${s.time}" aria-pressed="${s.time === chosen}" title="${s.time} to ${end}. Arrive within your slot." ${full ? 'disabled' : ''} style="${s.state === 'few' ? 'order:-1' : ''}">` +
        `<span class="slot__time">${s.time}</span>` +
        (s.state === 'few' ? '<span class="slot__tag slot__tag--few">Few left</span>' : full ? '<span class="slot__tag slot__tag--full">Full</span>' : '') +
        '</button>';
    }
    grid.innerHTML = html;
    fitColumns();
    const free = slots.filter((s) => s.state !== 'full').length;
    const why = isClosed(date) ? 'the centre is closed on Wednesdays' : date < TODAY ? 'that day has passed' : !inWindow(date) ? 'slots open 14 days ahead' : 'every slot is taken';
    // R11: the status is written first and only then made a live region, so nothing is announced.
    status.textContent = free ? `${free} slots free on ${longDate(date)}` : `No slots on ${longDate(date)}: ${why}.`;
    status.setAttribute('aria-live', 'polite');
    $('day-heading').textContent = longDate(date);
  }

  // R01/R02: slots arrive after a delay with no sign that anything is loading; the page below moves when they do.
  function load() {
    loading = true;
    clearTimeout(loadTimer);
    grid.innerHTML = '';
    status.textContent = '';
    loadTimer = setTimeout(() => {
      loading = false;
      render(isClosed(date) || !inWindow(date) ? [] : slotsFor(date));
    }, SLOT_LOAD_MS);
  }

  function setDate(iso) {
    date = iso;
    chosen = '';
    store.update({ date, slot: '', hold_started: 0 });
    dateInput.value = ukDate(date);
    $('date-error').hidden = true;
    reflectDay();
    load();
  }

  $('show').addEventListener('click', () => {
    const iso = fromUkDate(dateInput.value);
    const err = $('date-error');
    if (!iso) {
      err.textContent = 'Enter a day as DD/MM/YYYY, for example 17/10/2026.';
      err.hidden = false;
      dateInput.setAttribute('aria-invalid', 'true');
      dateInput.focus();
      return;
    }
    dateInput.removeAttribute('aria-invalid');
    setDate(iso);
  });
  dateInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('show').click();
    }
  });
  for (const b of document.querySelectorAll('[data-quick]')) {
    b.addEventListener('click', () => setDate(b.getAttribute('data-quick')));
  }
  const other = $('other-day');
  other.addEventListener('click', () => {
    const open = other.getAttribute('aria-expanded') === 'true';
    other.setAttribute('aria-expanded', String(!open));
    $('date-wrap').hidden = open;
    if (!open) dateInput.focus();
  });

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('.slot');
    if (!b || b.disabled) return;
    chosen = b.getAttribute('data-slot');
    for (const x of grid.querySelectorAll('.slot')) x.setAttribute('aria-pressed', String(x === b));
    store.update({ date, slot: chosen, hold_started: Date.now() });
    $('slot-error').hidden = true;
  });

  next.addEventListener('click', () => {
    if (loading) return; // R01: nothing happens while the slots are still on their way
    if (!chosen) {
      const err = $('slot-error');
      err.textContent = 'Choose a slot first.';
      err.hidden = false;
      const first = grid.querySelector('.slot:not([disabled])');
      if (first) first.focus();
      return;
    }
    location.href = store.read().vehicle ? 'confirm.html' : 'vehicle.html';
  });

  load();
}

// --- step 2: vehicle and waste --------------------------------------------------------------------------------------

export function initVehicle() {
  const state = store.read();
  let vehicle = state.vehicle || '';
  const seg = $('vehicle');
  const permitWrap = $('permit-wrap');
  const permit = $('permit');
  let revealTimer = null;

  seg.innerHTML = VEHICLES.map((v) => `<button type="button" data-vehicle="${v.id}" aria-pressed="${v.id === vehicle}">${v.label}</button>`).join('');
  $('waste').innerHTML = WASTE.map((w) => `<label class="choice"><input type="checkbox" name="waste" value="${w.id}" ${(state.waste || []).includes(w.id) ? 'checked' : ''}><span>${w.label}</span></label>`).join('');
  if (state.permit) permit.value = state.permit;

  // R07: the permit field appears a moment after a van or trailer is chosen; the rule itself is behind the info button.
  function reflectVehicle() {
    const v = vehicleById(vehicle);
    clearTimeout(revealTimer);
    if (v && v.permit) revealTimer = setTimeout(() => { permitWrap.hidden = false; }, PERMIT_REVEAL_MS);
    else permitWrap.hidden = true;
  }
  reflectVehicle();

  seg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vehicle]');
    if (!b) return;
    vehicle = b.getAttribute('data-vehicle');
    for (const x of seg.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
    store.update({ vehicle });
    $('vehicle-error').hidden = true;
    reflectVehicle();
  });

  const info = $('info');
  info.addEventListener('click', () => {
    const open = info.getAttribute('aria-expanded') === 'true';
    info.setAttribute('aria-expanded', String(!open));
    $('info-panel').hidden = open;
  });

  $('next').addEventListener('click', () => {
    hideErrors();
    const waste = [...document.querySelectorAll('input[name="waste"]:checked')].map((i) => i.value);
    const problems = [];
    if (!vehicle) {
      $('vehicle-error').textContent = 'Choose the vehicle you are bringing.';
      $('vehicle-error').hidden = false;
      problems.push({ text: 'Choose the vehicle you are bringing', href: '#vehicle' });
    }
    if (!waste.length) {
      $('waste-error').textContent = 'Choose at least one kind of waste.';
      $('waste-error').hidden = false;
      for (const i of document.querySelectorAll('input[name="waste"]')) {
        i.setAttribute('aria-invalid', 'true');
        i.setAttribute('aria-describedby', 'waste-error');
      }
      problems.push({ text: 'Choose at least one kind of waste', href: '#waste' });
    } else {
      $('waste-error').hidden = true;
      for (const i of document.querySelectorAll('input[name="waste"]')) {
        i.removeAttribute('aria-invalid');
        i.removeAttribute('aria-describedby');
      }
    }
    if (problems.length) {
      showErrors(problems);
      return;
    }
    store.update({ vehicle, waste, permit: permit.value.trim() });
    location.href = 'confirm.html';
  });
  $('waste').addEventListener('change', () => {
    $('waste-error').hidden = true;
    for (const i of document.querySelectorAll('input[name="waste"]')) {
      i.removeAttribute('aria-invalid');
      i.removeAttribute('aria-describedby');
    }
  });
}

// --- step 3: check and book -------------------------------------------------------------------------------------------

export function initConfirm() {
  const state = store.read();
  const v = vehicleById(state.vehicle);
  $('sum-day').textContent = state.date ? longDate(state.date) : 'Not chosen';
  $('sum-slot').textContent = state.slot ? `${state.slot} to ${slotLabel(minutesOf(state.slot) + SLOT_MINUTES)}` : 'Not chosen';
  $('sum-vehicle').textContent = v ? v.label + (v.permit ? (state.permit ? `, permit ${state.permit}` : ', no permit given') : '') : 'Not chosen';
  $('sum-waste').textContent = wasteLabels(state.waste).join(', ') || 'Not chosen';
  const fields = [
    { id: 'reg', label: 'Registration', check: (x) => (/^[A-Z0-9]{2,7}$/i.test(x.replace(/\s+/g, '')) ? '' : 'Enter the registration, like AB12 CDE') },
    { id: 'name', label: 'Your name', check: (x) => (x.trim() ? '' : 'Enter your name') },
    { id: 'phone', label: 'Mobile number', check: (x) => (/^07\d{9}$/.test(x.replace(/\s+/g, '').replace(/^\+44/, '0')) ? '' : 'Enter a UK mobile number, like 07700 900123') },
    { id: 'postcode', label: 'Postcode', check: (x) => (/^DN\d/i.test(x.trim()) ? '' : 'Enter a Dunmore district postcode, which starts DN') },
  ];
  for (const f of fields) if (state.details && state.details[f.id]) $(f.id).value = state.details[f.id];
  for (const f of fields) {
    $(f.id).addEventListener('input', () => store.update({ details: { ...(store.read().details || {}), [f.id]: $(f.id).value } }));
    $(f.id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        $('book').click();
      }
    });
  }

  const book = $('book');
  let pending = null;
  let cancelled = false;
  book.addEventListener('click', () => {
    // R09: a second press while the booking is being made turns into "cancel" before the label says so.
    if (pending) {
      cancelled = true;
      book.textContent = 'Cancel booking';
      return;
    }
    hideErrors();
    const problems = [];
    const details = {};
    for (const f of fields) {
      const input = $(f.id);
      const msg = f.check(input.value);
      details[f.id] = input.value.trim();
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      const out = $(`${f.id}-error`);
      out.textContent = msg;
      out.hidden = !msg;
      if (msg) problems.push({ text: msg, href: `#${f.id}` });
    }
    store.update({ details });
    const current = store.read();
    if (!current.slot) problems.push({ text: 'Choose a slot', href: 'index.html' });
    if (problems.length) {
      showErrors(problems);
      return;
    }
    book.setAttribute('aria-busy', 'true');
    pending = setTimeout(() => {
      pending = null;
      book.removeAttribute('aria-busy');
      book.textContent = 'Book this slot';
      const now = store.read();
      const late = [];
      // R08: the hold ran out silently; the slot is dropped from the booking and the message does not say why.
      if (store.holdExpired(now)) {
        store.update({ slot: '', hold_started: 0 });
        $('sum-slot').textContent = '—';
        showErrors([{ text: 'This slot is no longer available.' }]);
        return;
      }
      // R06: today's slots that have started, or start within half an hour, were offered and are refused here.
      if (now.date === TODAY && minutesOf(now.slot) < NOW_MINUTES + 30) late.push(`The ${now.slot} slot today can no longer be booked. Choose another slot or day.`);
      // R07: the permit rule is enforced only here, where there is no permit field.
      const veh = vehicleById(now.vehicle);
      if (veh && veh.permit && !/^DRC-\d{5}$/i.test(now.permit || '')) late.push(`A ${veh.label.toLowerCase()} needs a permit number (DRC- and five digits).`);
      if (isClosed(now.date)) late.push(`The centre is closed on ${longDate(now.date)}.`);
      if (late.length) {
        showErrors(late.map((t) => ({ text: t })));
        return;
      }
      const ref = makeRef(`${now.date}|${now.slot}|${details.reg}`);
      store.update({ ref, status: cancelled ? 'cancelled' : 'booked' });
      location.href = `done.html?ref=${encodeURIComponent(ref)}`;
    }, BOOK_MS);
  });
}

// --- step 4: done ---------------------------------------------------------------------------------------------------

export function initDone() {
  const state = store.read();
  $('ref').textContent = state.ref || 'DR-000000';
  const phone = state.details && state.details.phone;
  $('reminder').textContent = phone ? `A reminder will be sent to ${phone} the evening before.` : 'A reminder will be sent to your mobile the evening before.';
  // R14: the page gives the reference and what to bring, not the day, slot or vehicle that were booked.
  const st = $('status');
  if (state.status === 'cancelled') {
    st.textContent = 'Status: cancelled. This booking is not on the gate\'s list.';
    st.hidden = false;
  } else st.hidden = true;
  $('again').addEventListener('click', () => {
    store.write({});
  });
}
