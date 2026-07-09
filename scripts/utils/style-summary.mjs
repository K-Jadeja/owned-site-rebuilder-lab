// scripts/utils/style-summary.mjs
// Extract computed styles for key visible elements and CSS variables.

/**
 * @param {import('playwright').Page} page
 * @param {string[]} selectors
 */
export async function summarizeStyles(page, selectors) {
  return await page.evaluate((sels) => {
    const results = [];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) {
        results.push({ selector: sel, found: false });
        continue;
      }
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      results.push({
        selector: sel,
        found: true,
        tag: el.tagName.toLowerCase(),
        classes: el.className && typeof el.className === 'string' ? el.className.slice(0, 200) : '',
        box: rect.width > 0 && rect.height > 0 ? {
          x: Math.round(rect.x), y: Math.round(rect.y),
          w: Math.round(rect.width), h: Math.round(rect.height),
        } : null,
        font: {
          family: cs.fontFamily,
          size: cs.fontSize,
          weight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
        },
        bg: cs.backgroundColor,
        border: {
          top: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor,
          right: cs.borderRightWidth + ' ' + cs.borderRightStyle + ' ' + cs.borderRightColor,
          bottom: cs.borderBottomWidth + ' ' + cs.borderBottomStyle + ' ' + cs.borderBottomColor,
          left: cs.borderLeftWidth + ' ' + cs.borderLeftStyle + ' ' + cs.borderLeftColor,
          radius: cs.borderRadius,
        },
        layout: {
          display: cs.display,
          position: cs.position,
          flexDirection: cs.flexDirection,
          gridTemplateColumns: cs.gridTemplateColumns,
          gap: cs.gap,
        },
        spacing: {
          padding: cs.padding,
          margin: cs.margin,
        },
        shadow: cs.boxShadow,
      });
    }
    return results;
  }, selectors);
}

/**
 * @param {import('playwright').Page} page
 */
export async function extractCssVariables(page) {
  return await page.evaluate(() => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const vars = {};
    // CSS custom properties need to be iterated differently
    // We grab all prop names that start with -- by sampling known tokens.
    const sample = [
      '--bg', '--bg-primary', '--bg-secondary', '--background',
      '--fg', '--text', '--text-primary', '--text-secondary',
      '--primary', '--accent', '--border', '--muted',
      '--color-bg', '--color-fg', '--color-primary', '--color-accent',
    ];
    for (const v of sample) {
      const val = cs.getPropertyValue(v).trim();
      if (val) vars[v] = val;
    }
    return vars;
  });
}

export async function extractColorPalette(page, max = 40) {
  return await page.evaluate((maxLocal) => {
    const counts = new Map();
    function walk(node) {
      if (!node) return;
      const cs = getComputedStyle(node);
      for (const k of ['color', 'backgroundColor', 'borderTopColor']) {
        const v = cs[k];
        if (v && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent') {
          counts.set(v, (counts.get(v) || 0) + 1);
        }
      }
      for (const c of node.children || []) walk(c);
    }
    walk(document.body);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxLocal)
      .map(([color, n]) => ({ color, count: n }));
  }, max);
}