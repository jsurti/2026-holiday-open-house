import { listRsvps, listComments, deleteRsvp, deleteComment } from '../lib/store.js';
import { send, body, isHost } from '../lib/http.js';

export default async function handler(req, res) {
  if (!isHost(req)) return send(res, 401, { error: 'Incorrect host password' });

  if (req.method === 'GET') {
    const [rsvps, comments] = await Promise.all([listRsvps(), listComments()]);
    const strip = ({ token, ...r }) => r;
    return send(res, 200, {
      rsvps: rsvps.map(strip).sort((a, b) => b.updatedAt - a.updatedAt),
      comments: comments.map(strip).sort((a, b) => b.createdAt - a.createdAt),
    });
  }

  if (req.method === 'POST') {
    const { action, id } = await body(req);
    if (!id) return send(res, 400, { error: 'Missing id' });
    if (action === 'deleteComment') await deleteComment(String(id));
    else if (action === 'deleteRsvp') await deleteRsvp(String(id));
    else return send(res, 400, { error: 'Unknown action' });
    return send(res, 200, { ok: true });
  }

  send(res, 405, { error: 'Method not allowed' });
}
