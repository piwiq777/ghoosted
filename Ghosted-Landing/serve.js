const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.zip': 'application/zip'
};

const CLEAN_URL_MAP = {
  '/terms': '/terms.html',
  '/privacy': '/privacy.html',
  '/cookies': '/cookies.html',
  '/aviso-legal': '/aviso-legal.html',
  '/refund': '/refund.html',
  '/m': '/m.html',
  '/success': '/success.html',
  '/variant-a': '/variant-a-playful.html',
  '/variant-b': '/variant-b.html',
  '/variant-c': '/variant-c-cosmos.html'
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(urlObj.pathname);

  // Default route
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Clean URLs mapping
  if (CLEAN_URL_MAP[pathname]) {
    pathname = CLEAN_URL_MAP[pathname];
  } else if (!path.extname(pathname) && fs.existsSync(path.join(ROOT, pathname + '.html'))) {
    pathname = pathname + '.html';
  }

  const safePath = path.resolve(ROOT, '.' + pathname);

  // Security check: ensure path is within ROOT
  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1><p>The requested file does not exist.</p>');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Ghoosted Landing server running at http://localhost:${PORT}`);
});
