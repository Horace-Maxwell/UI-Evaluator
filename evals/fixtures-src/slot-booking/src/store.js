// The booking in progress lives in sessionStorage for the visit. A query string on any page seeds it, so each
// step can be opened on its own: ?date=2026-10-17&slot=09:40&vehicle=car&waste=garden,wood&permit=DRC-10231&hold=expired
import { HOLD_MINUTES } from './data.js';

const KEY = 'booking';

export function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}
export function write(state) {
  sessionStorage.setItem(KEY, JSON.stringify(state));
  return state;
}
export function update(patch) {
  return write({ ...read(), ...patch });
}
export function holdExpired(state) {
  return !!state.hold_started && Date.now() - state.hold_started > HOLD_MINUTES * 60 * 1000;
}
export function seedFromQuery() {
  const p = new URLSearchParams(location.search);
  if (!p.get('date') && !p.get('slot') && !p.get('vehicle') && !p.get('hold') && !p.get('ref')) return;
  const s = read();
  if (p.get('date')) s.date = p.get('date');
  if (p.get('slot')) s.slot = p.get('slot');
  if (p.get('vehicle')) s.vehicle = p.get('vehicle');
  if (p.get('waste')) s.waste = p.get('waste').split(',').filter(Boolean);
  if (p.get('permit')) s.permit = p.get('permit');
  if (p.get('ref')) s.ref = p.get('ref');
  if (p.get('status')) s.status = p.get('status');
  if (s.slot && !s.hold_started) s.hold_started = Date.now();
  if (p.get('hold') === 'expired') s.hold_started = Date.now() - (HOLD_MINUTES + 1) * 60 * 1000;
  write(s);
}
