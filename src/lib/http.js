import { NextResponse } from 'next/server';

const hits = (globalThis.__rateLimitHits ??= new Map());

function clientIp(req) {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'local'
  );
}

// simple fixed-window limit per IP, protects API credits
export function rateLimit(req, route, limit, windowMs = 60000) {
  const key = `${route}:${clientIp(req)}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now - entry.start > windowMs) {
    hits.set(key, { start: now, count: 1 });
    return null;
  }
  if (++entry.count <= limit) return null;

  return NextResponse.json(
    { success: false, error: 'Too many requests. Please wait a moment and try again.' },
    { status: 429 }
  );
}

// host the kiosk was opened on (for QR codes); null for localhost
export function requestBaseUrl(req) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!host || /^(localhost|127\.|\[::1\])/.test(host)) return null;
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}
