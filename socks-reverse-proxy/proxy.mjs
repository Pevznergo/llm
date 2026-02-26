/**
 * Minimal SOCKS5H reverse proxy.
 *
 * LiteLLM  ──HTTP──▶  this server  ──HTTPS via SOCKS5H──▶  real API (e.g. Google)
 *
 * Environment variables:
 *   PORT         – listen port (required)
 *   TARGET_URL   – upstream HTTPS base URL, e.g. https://generativelanguage.googleapis.com
 *   SOCKS_PROXY  – socks5h://user:pass@ip:port
 */

import http from 'node:http';
import https from 'node:https';
import { SocksProxyAgent } from 'socks-proxy-agent';

const PORT = parseInt(process.env.PORT || '8094', 10);
const TARGET_URL = process.env.TARGET_URL;    // e.g. https://generativelanguage.googleapis.com
const SOCKS_PROXY = process.env.SOCKS_PROXY;   // e.g. socks5h://user:pass@ip:port

if (!TARGET_URL || !SOCKS_PROXY) {
    console.error('TARGET_URL and SOCKS_PROXY env vars are required');
    process.exit(1);
}

const target = new URL(TARGET_URL);
const agent = new SocksProxyAgent(SOCKS_PROXY);

const server = http.createServer((req, res) => {
    const url = new URL(req.url, TARGET_URL);

    const headers = { ...req.headers };
    // Replace Host header with the real upstream host
    headers.host = target.host;
    // Remove hop-by-hop headers
    delete headers['transfer-encoding'];

    const options = {
        hostname: target.hostname,
        port: target.port || 443,
        path: url.pathname + url.search,
        method: req.method,
        headers,
        agent,
    };

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error(`[proxy] ${req.method} ${req.url} → ${err.message}`);
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
    });

    req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[socks-reverse-proxy] :${PORT} → ${TARGET_URL} via ${SOCKS_PROXY.replace(/\/\/.*@/, '//***@')}`);
});
