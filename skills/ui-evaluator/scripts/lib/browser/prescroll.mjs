// A snapshot of the page at rest before any scrolling (taken by the session when tells or motion run):
// section-level elements hidden by an entrance (opacity 0 with a transform), their animations, and numeric texts
// (to recognise count-up numbers after the settle scroll).
export function preSettleProbe() {
  const U = window.__uie;
  const vh = innerHeight;
  const vw = innerWidth;
  const sectionLike = (el) => {
    const r = el.getBoundingClientRect();
    return el.matches('section,article,main > *,[class*="section" i]') || (r.height >= 120 && r.width >= vw * 0.5);
  };
  const hidden = [];
  const animated = [];
  for (const el of document.querySelectorAll('body *')) {
    if (hidden.length + animated.length > 400) break;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none') continue;
    const op = parseFloat(s.opacity);
    const hasText = (el.innerText || '').trim().length > 0;
    if (!hasText) continue;
    const anim = s.animationName && s.animationName !== 'none' ? s.animationName : null;
    const transformed = s.transform && s.transform !== 'none';
    if ((op < 0.05 || s.visibility === 'hidden') && (transformed || anim || /opacity|all/.test(s.transitionProperty))) {
      const r = el.getBoundingClientRect();
      hidden.push({ id: U.id(el), selector: U.selector(el), below: r.top >= vh, section: sectionLike(el), anim, transition: s.transitionProperty, transform: s.transform, text: U.collapse(el.innerText).slice(0, 60) });
    } else if (anim && sectionLike(el)) {
      animated.push({ id: U.id(el), selector: U.selector(el), anim, section: true });
    }
  }
  const numbers = [];
  for (const el of U.textElements(document.body, { limit: 2000 })) {
    const t = U.ownText(el);
    if (/^[^\d]{0,3}\d[\d,.\s]*(%|[kKmMbB+×x]|\+)?[^\d]{0,3}$/.test(t) && t.length <= 16) numbers.push({ id: U.id(el), text: t });
    if (numbers.length >= 100) break;
  }
  return { hidden, animated, numbers, at: performance.now() };
}
