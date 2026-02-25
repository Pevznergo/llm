const https = require('https');

const endpoints = [
    "/cache/redis/flushall",
    "/v1/cache/redis/flushall",
    "/cache/flush",
    "/v1/cache/flush",
    "/v1/cache/clear",
    "/cache/clear",
    "/cache/redis/clear"
];

async function test(ep) {
    return new Promise(resolve => {
        const req = https.request({
            hostname: 'api.aporto.tech',
            path: ep,
            method: 'POST',
            headers: { 'Authorization': 'Bearer test' }
        }, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve(`${ep}: ${res.statusCode} ${data}`));
        });
        req.on('error', e => resolve(`${ep}: Error ${e.message}`));
        req.end();
    });
}

async function run() {
    for (const ep of endpoints) {
        let text = await test(ep);
        console.log(text);
    }
}
run();
