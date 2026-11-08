// Local preview: `node dev-server.mjs` then open http://localhost:3000
// Mirrors the Vercel setup (static files in /public, functions in /api).
// Without Redis credentials, data is saved to .dev-data.json; host password is "dev".
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ics': 'text/calendar', '.svg': 'image/svg+xml' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = url.pathname === '/' ? '/api/invite' : url.pathname;
  if (p.startsWith('/api/')) {
    try {
      const mod = await import(path.join(root, p + '.js') + '?t=' + Date.now());
      return mod.default(req, res);
    } catch (e) { console.error(e); res.statusCode = 404; return res.end('Not found'); }
  }
  let file = path.join(root, 'public', p);
  if (!path.extname(file)) file += '.html';
  try {
    const buf = await fs.readFile(file);
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(buf);
  } catch { res.statusCode = 404; res.end('Not found'); }
}).listen(process.env.PORT || 3000, () => console.log('http://localhost:' + (process.env.PORT || 3000)));
