// Fixed clock and the rules of the centre. Dates are pinned so the fixture is reproducible: today is Monday
// 12 October 2026 at 10:05.
export const TODAY = '2026-10-12';
export const NOW_MINUTES = 10 * 60 + 5;
export const SLOT_MINUTES = 20;
export const FIRST_SLOT = 8 * 60;
export const LAST_SLOT = 17 * 60 + 20;
export const DAYS_AHEAD = 14;
export const HOLD_MINUTES = 5;
export const CLOSED_WEEKDAY = 3; // Wednesday
export const SLOT_LOAD_MS = 900;
export const PERMIT_REVEAL_MS = 1200;
export const BOOK_MS = 1500;

export const VEHICLES = [
  { id: 'car', label: 'Car', permit: false },
  { id: 'trailer', label: 'Car with trailer', permit: true },
  { id: 'van', label: 'Van', permit: true },
];

export const WASTE = [
  { id: 'garden', label: 'Garden waste' },
  { id: 'wood', label: 'Wood' },
  { id: 'rubble', label: 'Rubble (up to four bags)' },
  { id: 'electricals', label: 'Electricals' },
  { id: 'mattress', label: 'Mattresses (up to two)' },
  { id: 'metal', label: 'Scrap metal' },
  { id: 'cardboard', label: 'Cardboard' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function parseIso(iso) {
  const p = String(iso || '').split('-').map(Number);
  if (p.length !== 3 || p.some((n) => !Number.isFinite(n))) return null;
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  return Number.isNaN(d.getTime()) ? null : d;
}
export function toIso(d) {
  return d.toISOString().slice(0, 10);
}
export function addDays(iso, n) {
  const d = parseIso(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}
export function longDate(iso) {
  const d = parseIso(iso);
  return d ? `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}` : '';
}
export function ukDate(iso) {
  const d = parseIso(iso);
  return d ? `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}` : '';
}
/** "17/10/2026" → "2026-10-17", or null. */
export function fromUkDate(text) {
  const raw = String(text || '').trim();
  const digits = raw.replace(/\D/g, '');
  const m = /^\s*(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})\s*$/.exec(raw) || (digits.length === 8 ? [null, digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)] : digits.length === 6 ? [null, digits.slice(0, 2), digits.slice(2, 4), `20${digits.slice(4)}`] : null);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
  if (d.getUTCDate() !== Number(m[1]) || d.getUTCMonth() !== Number(m[2]) - 1) return null;
  return toIso(d);
}
export function isClosed(iso) {
  const d = parseIso(iso);
  return !d || d.getUTCDay() === CLOSED_WEEKDAY;
}
export function inWindow(iso) {
  return iso >= TODAY && iso <= addDays(TODAY, DAYS_AHEAD);
}
export function minutesOf(slot) {
  const [h, m] = String(slot).split(':').map(Number);
  return h * 60 + m;
}
export function slotLabel(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
/** Every slot of a day with its availability, from a seed so the same day always looks the same. */
export function slotsFor(iso) {
  const out = [];
  let seed = 0;
  for (const ch of iso) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  for (let t = FIRST_SLOT; t <= LAST_SLOT; t += SLOT_MINUTES) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const r = (seed >>> 8) % 100;
    out.push({ time: slotLabel(t), minutes: t, state: r < 55 ? 'free' : r < 80 ? 'few' : 'full' });
  }
  return out;
}
export function vehicleById(id) {
  return VEHICLES.find((v) => v.id === id) || null;
}
export function wasteLabels(ids) {
  return (ids || []).map((id) => (WASTE.find((w) => w.id === id) || {}).label).filter(Boolean);
}
export function makeRef(seed) {
  let n = 0;
  for (const ch of seed) n = (n * 33 + ch.charCodeAt(0)) >>> 0;
  return `DR-${String(100000 + (n % 900000))}`;
}
