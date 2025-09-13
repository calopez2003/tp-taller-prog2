// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// "BD" en memoria
let concepts = [];

// util: responder JSON
function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// servir archivos estáticos desde /public
function serveStatic(req, res) {
  const base = path.join(__dirname, 'public');
  const requested = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(base, requested);

  if (!filePath.startsWith(base)) { res.writeHead(403); return res.end('Forbidden'); }

  const ext = path.extname(filePath).toLowerCase();
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8'
  }[ext] || 'text/plain; charset=utf-8';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // --- API REST ---
  if (pathname.startsWith('/api/concepts')) {
    // GET /api/concepts
    if (req.method === 'GET' && pathname === '/api/concepts') {
      return sendJSON(res, 200, concepts);
    }

    // GET /api/concepts/:id
    if (req.method === 'GET') {
      const m = pathname.match(/^\/api\/concepts\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        const item = concepts.find(c => c.id === id);
        return item ? sendJSON(res, 200, item)
                    : sendJSON(res, 404, { error: 'Concepto no encontrado' });
      }
    }

    // POST /api/concepts (para cargar desde form)
    if (req.method === 'POST' && pathname === '/api/concepts') {
      let body = '';
      req.on('data', ch => (body += ch));
      req.on('end', () => {
        try {
          const { titulo, desarrollo } = JSON.parse(body || '{}');
          if (!titulo || !desarrollo) {
            return sendJSON(res, 400, { error: 'Campos requeridos: titulo, desarrollo' });
          }
          const id = concepts.length ? concepts[concepts.length - 1].id + 1 : 1;
          const nuevo = { id, titulo, desarrollo, createdAt: new Date().toISOString() };
          concepts.push(nuevo);
          return sendJSON(res, 201, nuevo);
        } catch {
          return sendJSON(res, 400, { error: 'JSON inválido' });
        }
      });
      return;
    }

    // DELETE /api/concepts
    if (req.method === 'DELETE' && pathname === '/api/concepts') {
      concepts = [];
      return sendJSON(res, 200, { ok: true, message: 'Todos los conceptos eliminados' });
    }

    // DELETE /api/concepts/:id
    if (req.method === 'DELETE') {
      const m = pathname.match(/^\/api\/concepts\/(\d+)$/);
      if (m) {
        const id = Number(m[1]);
        const prev = concepts.length;
        concepts = concepts.filter(c => c.id !== id);
        return prev === concepts.length
          ? sendJSON(res, 404, { error: 'Concepto no encontrado' })
          : sendJSON(res, 200, { ok: true, id });
      }
    }

    // si no coincide ningún endpoint:
    return sendJSON(res, 404, { error: 'Endpoint no encontrado' });
  }

  // estáticos
  return serveStatic(req, res);
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Servidor http://localhost:${PORT}`));
  