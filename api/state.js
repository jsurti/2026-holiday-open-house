import { listRsvps, listComments } from '../lib/store.js';
import { send, publicGuest, publicComment } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  try {
    const [rsvps, comments] = await Promise.all([listRsvps(), listComments()]);
    send(res, 200, {
      guests: rsvps.sort((a, b) => a.createdAt - b.createdAt).map(publicGuest),
      comments: comments.sort((a, b) => b.createdAt - a.createdAt).map(publicComment),
    });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'Could not load the guest list' });
  }
}
