// Storage layer. On Vercel it uses Upstash Redis (connected through the
// Vercel Marketplace). Locally, with no Redis credentials, it falls back to a
// JSON file so the app can be run and tested without any account.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const RSVPS = 'invite:rsvps';
const COMMENTS = 'invite:comments';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

let redis = null;
if (url && token) {
  const { Redis } = await import('@upstash/redis');
  redis = new Redis({ url, token });
}

export const usingRedis = () => Boolean(redis);

// ---------- local file fallback ----------
const DEV_FILE = path.join(process.cwd(), '.dev-data.json');
async function readDev() {
  try { return JSON.parse(await fs.readFile(DEV_FILE, 'utf8')); }
  catch { return { [RSVPS]: {}, [COMMENTS]: {} }; }
}
async function writeDev(d) { await fs.writeFile(DEV_FILE, JSON.stringify(d, null, 2)); }

async function hgetall(key) {
  if (redis) {
    const all = (await redis.hgetall(key)) || {};
    // @upstash/redis auto-parses JSON values
    return Object.values(all).map(v => (typeof v === 'string' ? JSON.parse(v) : v));
  }
  const d = await readDev();
  return Object.values(d[key] || {});
}
async function hget(key, id) {
  if (redis) {
    const v = await redis.hget(key, id);
    return typeof v === 'string' ? JSON.parse(v) : v;
  }
  const d = await readDev();
  return (d[key] || {})[id] || null;
}
async function hset(key, id, value) {
  if (redis) return redis.hset(key, { [id]: JSON.stringify(value) });
  const d = await readDev();
  d[key] = d[key] || {};
  d[key][id] = value;
  await writeDev(d);
}
async function hdel(key, id) {
  if (redis) return redis.hdel(key, id);
  const d = await readDev();
  if (d[key]) delete d[key][id];
  await writeDev(d);
}

export const listRsvps = () => hgetall(RSVPS);
export const getRsvp = id => hget(RSVPS, id);
export const saveRsvp = r => hset(RSVPS, r.id, r);
export const deleteRsvp = id => hdel(RSVPS, id);

export const listComments = () => hgetall(COMMENTS);
export const getComment = id => hget(COMMENTS, id);
export const saveComment = c => hset(COMMENTS, c.id, c);
export const deleteComment = id => hdel(COMMENTS, id);
