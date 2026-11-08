import { randomBytes, timingSafeEqual } from 'node:crypto';

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}

export const newId = (n = 9) => randomBytes(n).toString('base64url');

// Trim, collapse control characters and cap length.
export function clean(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim().slice(0, max);
}

export function isHost(req) {
  const expected = process.env.HOST_KEY || (process.env.VERCEL ? '' : 'dev');
  const given = String(req.headers['x-host-key'] || '');
  if (!expected || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Public shapes: never expose edit tokens, dietary needs or private notes.
export const publicGuest = r => ({ id: r.id, name: r.name, status: r.status, party: r.party });
export const publicComment = c => ({ id: c.id, name: c.name, message: c.message, createdAt: c.createdAt });
