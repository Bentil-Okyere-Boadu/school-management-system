/**
 * Run on Lightsail (separate from your port-5000 GoEdtech proxy).
 *
 * Nest calls: GET {HUBTEL_TXN_STATUS_BASE_URL}/transactions/{posSalesId}/status?clientReference=...
 * This script forwards that path to Hubtel with a correct Host header (required for TLS/SNI).
 *
 * Usage on the VPS:
 *   export PORT=5001
 *   export HUBTEL_UPSTREAM_HOST=api-txnstatus.hubtel.com
 *   node lightsail-hubtel-txn-proxy.example.cjs
 *
 * On Render (Nest), set:
 *   HUBTEL_TXN_STATUS_BASE_URL=http://YOUR_LIGHTSAIL_PUBLIC_IP:5001
 *
 * Lock the Lightsail security group so only your backend (e.g. Render egress) can reach this port,
 * or terminate TLS in front of this with nginx/Caddy if you need HTTPS to the proxy.
 */
const http = require('http');
const https = require('https');

const LISTEN_PORT = Number(process.env.PORT || 5001);
const UPSTREAM_HOST = process.env.HUBTEL_UPSTREAM_HOST || 'api-txnstatus.hubtel.com';

const hopByHop = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

const server = http.createServer((req, res) => {
  const outHeaders = { ...req.headers };
  for (const h of hopByHop) {
    delete outHeaders[h];
  }
  outHeaders.host = UPSTREAM_HOST;

  const options = {
    hostname: UPSTREAM_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: outHeaders,
  };

  const proxy = https.request(options, (upstream) => {
    const rh = { ...upstream.headers };
    res.writeHead(upstream.statusCode || 502, rh);
    upstream.pipe(res, { end: true });
  });

  req.pipe(proxy, { end: true });

  proxy.on('error', (err) => {
    console.error('Upstream error:', err);
    if (!res.headersSent) {
      res.writeHead(502);
    }
    res.end('Bad gateway');
  });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(
    `Hubtel txn-status proxy → https://${UPSTREAM_HOST} (listening ${LISTEN_PORT})`,
  );
});
