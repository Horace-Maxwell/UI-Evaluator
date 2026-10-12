// Small shared pieces: the toast (a live region that exists before any message), escaping, element lookup.
export const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let toastTimer = null;
export function toast(text, ms = 4000) {
  const el = $('toast');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('is-leaving');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => {
      el.textContent = '';
      el.classList.remove('is-leaving');
    }, 150);
  }, ms);
}

export function showErrors(items) {
  const box = $('error-summary');
  const list = $('error-list');
  if (!box || !list) return;
  list.innerHTML = items.map((i) => `<li>${i.href ? `<a href="${i.href}">${esc(i.text)}</a>` : esc(i.text)}</li>`).join('');
  box.hidden = false;
  box.focus();
}
export function hideErrors() {
  const box = $('error-summary');
  if (box) box.hidden = true;
}
