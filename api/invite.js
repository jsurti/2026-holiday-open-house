// Serves the invitation page with absolute link-preview URLs filled in from
// whatever domain it's being served on, so WhatsApp always gets a valid
// og:image no matter which domain you deploy to.
import { promises as fs } from 'node:fs';
import path from 'node:path';

let template;

export default async function handler(req, res) {
  template ||= await fs.readFile(path.join(process.cwd(), 'templates', 'invite.html'), 'utf8');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = (req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https')).split(',')[0];
  const origin = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') : `${proto}://${host}`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
  res.end(template.replaceAll('{{ORIGIN}}', origin));
}
