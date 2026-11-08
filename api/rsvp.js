import { getRsvp, saveRsvp } from '../lib/store.js';
import { send, body, newId, clean, publicGuest } from '../lib/http.js';

const STATUSES = ['yes', 'maybe', 'no'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const b = await body(req);
  if (b.website) return send(res, 200, { ok: true }); // honeypot

  const name = clean(b.name, 80);
  const status = STATUSES.includes(b.status) ? b.status : null;
  let party = parseInt(b.party, 10);
  if (!name) return send(res, 400, { error: 'Please add your name.' });
  if (!status) return send(res, 400, { error: 'Please choose a reply.' });
  party = status === 'no' ? 0 : Math.min(Math.max(Number.isFinite(party) ? party : 1, 1), 20);

  try {
    const now = Date.now();
    let record;
    if (b.id && b.token) {
      const existing = await getRsvp(String(b.id));
      if (existing && existing.token === b.token) record = existing;
    }
    record = {
      ...(record || { id: newId(), token: newId(18), createdAt: now }),
      name, status, party,
      dietary: clean(b.dietary, 300),
      note: clean(b.note, 1000),
      updatedAt: now,
    };
    await saveRsvp(record);
    send(res, 200, { id: record.id, token: record.token, guest: publicGuest(record) });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Something went wrong saving your reply. Please try again.' });
  }
}
