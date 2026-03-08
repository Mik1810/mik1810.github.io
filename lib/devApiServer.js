import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'api');
const port = Number(process.env.API_PORT || 3000);

function resolveHandlerPath(pathname) {
  const cleaned = pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
  const candidate = cleaned ? `${cleaned}.js` : 'index.js';
  const safePath = path.normalize(candidate).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(apiDir, safePath);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve(undefined);
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(data);
      }
    });
  });
}

function createRes(res) {
  const apiRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      res.setHeader(name, value);
      return this;
    },
    json(payload) {
      res.statusCode = this.statusCode;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(payload));
    },
    send(payload) {
      res.statusCode = this.statusCode;
      res.end(payload);
    },
  };
  return apiRes;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    if (!url.pathname.startsWith('/api')) {
      res.statusCode = 404;
      return res.end('Not found');
    }

    const handlerPath = resolveHandlerPath(url.pathname);
    if (!existsSync(handlerPath)) {
      res.statusCode = 404;
      return res.end('API route not found');
    }

    const mod = await import(pathToFileURL(handlerPath).href);
    const handler = mod.default;
    if (typeof handler !== 'function') {
      res.statusCode = 500;
      return res.end('Invalid API handler');
    }

    const body = await parseBody(req);
    const apiReq = {
      method: req.method,
      headers: req.headers,
      query: Object.fromEntries(url.searchParams.entries()),
      body,
      url: req.url,
    };
    const apiRes = createRes(res);

    await handler(apiReq, apiRes);
  } catch (err) {
    console.error('[dev-api] error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(port, () => {
  console.log(`[dev-api] listening on http://localhost:${port}`);
});
