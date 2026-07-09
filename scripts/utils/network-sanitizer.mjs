// scripts/utils/network-sanitizer.mjs
// Strip sensitive headers, redact obvious tokens in URLs, truncate bodies.

const REDACTED = '[REDACTED]';
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-csrf-token',
  'x-amz-security-token',
  'proxy-authorization',
]);

const TOKEN_KEYS = ['token', 'key', 'sig', 'signature', 'apikey', 'api_key', 'auth'];

export function sanitizeHeaders(headers = {}) {
  if (!headers || typeof headers !== 'object') return headers;
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(k.toLowerCase())) {
      out[k] = REDACTED;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function sanitizeUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    let changed = false;
    for (const k of [...u.searchParams.keys()]) {
      if (TOKEN_KEYS.some((t) => k.toLowerCase().includes(t))) {
        u.searchParams.set(k, REDACTED);
        changed = true;
      }
    }
    return changed ? u.toString() : url;
  } catch {
    return url;
  }
}

export function truncateBody(body, maxBytes = 2048) {
  if (body == null) return null;
  if (typeof body === 'string') {
    if (body.length <= maxBytes) return body;
    return body.slice(0, maxBytes) + `\n... [truncated ${body.length - maxBytes} bytes]`;
  }
  return body;
}

export function sanitizeRequestResponse(req, res, opts = {}) {
  const max = opts.maxBody || 2048;
  return {
    request: {
      method: req.method(),
      url: sanitizeUrl(req.url()),
      resourceType: req.resourceType(),
      headers: sanitizeHeaders(req.headers()),
      postData: truncateBody(req.postData(), max),
    },
    response: res ? {
      status: res.status(),
      statusText: res.statusText(),
      url: sanitizeUrl(res.url()),
      headers: sanitizeHeaders(res.headers()),
      contentType: headerValue(res.headers(), 'content-type'),
      timing: res.timing ? res.timing() : null,
      // body is intentionally NOT captured here to avoid binary dumps
    } : null,
  };
}

function headerValue(headers, name) {
  if (!headers) return null;
  const v = headers[name] || headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v || null;
}