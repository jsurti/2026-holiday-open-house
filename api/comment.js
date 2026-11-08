import { getComment, saveComment, deleteComment } from '../lib/store.js';
import { send, body, newId, clean, publicComment } from '../lib/http.js';

export default async function handler(req, res) {
  const b = await body(req);

  // Guests can remove their own post with the token they were given.
  if (req.method === 'DELETE') {
    const c = b.id ? await getComment(String(b.id)) : null;
    if (!c || c.token !== b.token) return send(res, 403, { error: 'Not allowed' });
    await deleteComment(c.id);
    return send(res, 200, { ok: true });
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (b.website) return send(res, 200, { ok: true }); // honeypot

  const name = clean(b.name, 80);
  const message = clean(b.message, 600);
  if (!name) return send(res, 400, { error: 'Please add your name.' });
  if (!message) return send(res, 400, { error: 'Please write a message.' });

  try {
    const c = { id: newId(), token: newId(18), name, message, createdAt: Date.now() };
    await saveComment(c);
    send(res, 200, { comment: publicComment(c), token: c.token });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Could not post your message. Please try again.' });
  }
}
