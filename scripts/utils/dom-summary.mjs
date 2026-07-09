// scripts/utils/dom-summary.mjs
// Create a readable DOM summary from the live page.
// We avoid dumping enormous HTML bodies; instead we summarize the semantic
// structure (landmarks, roles, aria, classes, ids, text snippets, boxes).

const MAX_DEPTH = 12;
const MAX_NODES = 4000;
const MAX_TEXT = 80;

function summarizeNode(node, depth, counters) {
  counters.visited += 1;
  if (counters.visited > MAX_NODES) return null;

  if (!node || depth > MAX_DEPTH) return null;

  const tag = node.tagName ? node.tagName.toLowerCase() : null;
  if (!tag) return null;

  const out = {
    tag,
    id: node.id || undefined,
    classes: node.classList && node.classList.length
      ? Array.from(node.classList).slice(0, 4)
      : undefined,
    role: node.getAttribute && node.getAttribute('role') || undefined,
    aria: collectAria(node),
    text: textSnippet(node),
  };

  // bounding box if visible
  if (typeof node.getBoundingClientRect === 'function') {
    try {
      const r = node.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        out.box = {
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      }
    } catch {
      /* ignore */
    }
  }

  // recurse
  const children = [];
  for (const child of node.children || []) {
    const c = summarizeNode(child, depth + 1, counters);
    if (c) children.push(c);
  }
  if (children.length) out.children = children;
  return out;
}

function collectAria(node) {
  const a = {};
  for (const attr of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden', 'aria-expanded']) {
    const v = node.getAttribute && node.getAttribute(attr);
    if (v) a[attr] = v;
  }
  return Object.keys(a).length ? a : undefined;
}

function textSnippet(node) {
  if (!node.children || node.children.length === 0) {
    const t = (node.textContent || '').trim().replace(/\s+/g, ' ');
    if (t && t.length > 0) return t.length > MAX_TEXT ? t.slice(0, MAX_TEXT) + '…' : t;
  }
  return undefined;
}

/**
 * Summarize the current document.
 * @param {import('playwright').Page} page
 */
export async function summarizeDom(page) {
  return await page.evaluate(({ MAX_DEPTH: MAX_DEPTH_LOCAL }) => {
    const counters = { visited: 0 };
    const root = document.body || document.documentElement;
    function summarize(node, depth) {
      counters.visited += 1;
      if (counters.visited > 4000) return null;
      if (!node || depth > MAX_DEPTH_LOCAL) return null;
      const tag = node.tagName ? node.tagName.toLowerCase() : null;
      if (!tag) return null;
      const out = {
        tag,
        id: node.id || undefined,
        classes: node.classList && node.classList.length ? Array.from(node.classList).slice(0, 4) : undefined,
        role: node.getAttribute && node.getAttribute('role') || undefined,
        aria: (function () {
          const a = {};
          for (const attr of ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden', 'aria-expanded']) {
            const v = node.getAttribute && node.getAttribute(attr);
            if (v) a[attr] = v;
          }
          return Object.keys(a).length ? a : undefined;
        })(),
        text: (function () {
          if (!node.children || node.children.length === 0) {
            const t = (node.textContent || '').trim().replace(/\s+/g, ' ');
            if (t) return t.length > 80 ? t.slice(0, 80) + '…' : t;
          }
          return undefined;
        })(),
      };
      try {
        const r = node.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          out.box = {
            x: Math.round(r.x),
            y: Math.round(r.y),
            w: Math.round(r.width),
            h: Math.round(r.height),
          };
        }
      } catch {
        /* ignore */
      }
      const children = [];
      for (const child of node.children || []) {
        const c = summarize(child, depth + 1);
        if (c) children.push(c);
      }
      if (children.length) out.children = children;
      return out;
    }
    return summarize(root, 0);
  }, { MAX_DEPTH });
}

/**
 * Return the truncated outerHTML of the document, but only if it's a
 * reasonable size. Otherwise return null.
 */
export async function outerHtmlSafe(page, maxBytes = 1_500_000) {
  return await page.evaluate((max) => {
    const html = document.documentElement.outerHTML;
    if (html.length > max) return null;
    return html;
  }, maxBytes);
}