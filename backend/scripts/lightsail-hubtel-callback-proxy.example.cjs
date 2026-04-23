/**
 * Lightsail forwarder for Hubtel **Service Fulfilment Callback** (outbound from your app → Hubtel).
 * Hubtel requires a whitelisted IP for POST https://gs-callback.hubtel.com:9055/callback — use this
 * so Render (or any host) calls your Lightsail IP instead of Hubtel directly.
 *
 * Run separately from txn-status proxy (port 5001). Typical: this script on **5002**.
 *
 * On the VPS:
 *   export PORT=5002
 *   export HUBTEL_CALLBACK_UPSTREAM_HOST=gs-callback.hubtel.com
 *   export HUBTEL_CALLBACK_UPSTREAM_PORT=9055
 *   node lightsail-hubtel-callback-proxy.example.cjs
 *
 * On Render (Nest), set:
 *   HUBTEL_SERVICE_CALLBACK_URL=http://YOUR_LIGHTSAIL_PUBLIC_IP:5002/callback
 *
 * Only your backend should reach this port (security group / firewall).
 */
const http = require('http');
const https = require('https');

const LISTEN_PORT = Number(process.env.PORT || 5002);
const UPSTREAM_HOST =
  process.env.HUBTEL_CALLBACK_UPSTREAM_HOST || 'gs-callback.hubtel.com';
const UPSTREAM_PORT = Number(
  process.env.HUBTEL_CALLBACK_UPSTREAM_PORT || 9055,
);

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

  const pathWithQuery =
    req.url && req.url.startsWith('/')
      ? req.url
      : `/${req.url || 'callback'}`;

  const options = {
    hostname: UPSTREAM_HOST,
    port: UPSTREAM_PORT,
    path: pathWithQuery,
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
    console.error('Hubtel callback upstream error:', err);
    if (!res.headersSent) {
      res.writeHead(502);
    }
    res.end('Bad gateway');
  });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(
    `Hubtel fulfilment-callback proxy → https://${UPSTREAM_HOST}:${UPSTREAM_PORT} (listening ${LISTEN_PORT})`,
  );
});
