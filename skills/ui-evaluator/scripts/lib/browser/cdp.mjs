// Chrome DevTools Protocol helpers: forced pseudo-states, platform fonts, vision-deficiency emulation.

export async function openCdp(page) {
  const s = await page.context().newCDPSession(page);
  await s.send('DOM.enable').catch(() => {});
  await s.send('DOM.getDocument', { depth: 0 }).catch(() => {});
  await s.send('CSS.enable').catch(() => {});
  return s;
}

export async function withCdp(page, fn) {
  const s = await openCdp(page);
  try {
    return await fn(s);
  } finally {
    await s.detach().catch(() => {});
  }
}

/** DOM nodeId for an element registered with window.__uie.id(). */
export async function nodeIdFor(session, uieId) {
  const { result } = await session.send('Runtime.evaluate', { expression: `window.__uie && window.__uie.el(${Number(uieId)})` });
  if (!result || !result.objectId) return null;
  try {
    const { nodeId } = await session.send('DOM.requestNode', { objectId: result.objectId });
    return nodeId || null;
  } catch {
    return null;
  }
}

/** Force pseudo-classes (hover, active, focus, focus-visible, …) on a node; [] clears them. */
export async function forceState(session, nodeId, classes) {
  await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: classes });
}

/** Fonts actually used to render a node's text: [{familyName, glyphCount, isCustomFont}]. */
export async function platformFonts(session, nodeId) {
  try {
    const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
    return fonts || [];
  } catch {
    return [];
  }
}

export const VISION_DEFICIENCIES = ['deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia'];

export async function emulateVision(session, type) {
  await session.send('Emulation.setEmulatedVisionDeficiency', { type: type || 'none' });
}
