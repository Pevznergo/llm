/**
 * Stress test — sends 200 requests/min to gemini/gemini-2.5-pro via Aporto API.
 *
 * Usage:
 *   API_KEY=sk-... node stress-test.js
 *   API_KEY=sk-... RATE=300 MODEL=gemini/gemini-2.5-flash node stress-test.js
 */

const API_BASE = process.env.API_BASE || 'https://api.aporto.tech';
const API_KEY = process.env.API_KEY;
const MODEL = process.env.MODEL || 'gemini/gemini-2.5-pro';
const RATE = parseInt(process.env.RATE || '200', 10); // requests per minute

if (!API_KEY) {
    console.error('❌  Set API_KEY env var, e.g.:  API_KEY=sk-xxx node stress-test.js');
    process.exit(1);
}

const INTERVAL_MS = Math.round(60_000 / RATE); // ms between requests

let sent = 0, ok = 0, fail = 0;
const latencies = [];

async function sendRequest(idx) {
    const start = Date.now();
    try {
        const res = await fetch(`${API_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: `What is ${17 + idx} * ${3 + (idx % 7)}? Answer with just the number.` }],
                max_tokens: 20,
            }),
        });

        const elapsed = Date.now() - start;
        latencies.push(elapsed);

        if (res.ok) {
            ok++;
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content?.trim() || '';
            process.stdout.write(`✓ #${idx} ${elapsed}ms "${content.substring(0, 30)}"  `);
        } else {
            fail++;
            const text = await res.text().catch(() => '');
            process.stdout.write(`✗ #${idx} ${res.status} ${elapsed}ms ${text.substring(0, 60)}  `);
        }
    } catch (e) {
        fail++;
        const elapsed = Date.now() - start;
        process.stdout.write(`✗ #${idx} ERR ${elapsed}ms ${e.message.substring(0, 40)}  `);
    }
    sent++;
}

function printStats() {
    const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

    console.log(`\n\n📊 Stats after ${sent} requests:`);
    console.log(`   ✅ OK: ${ok}  ❌ Fail: ${fail}  (${((ok / sent) * 100).toFixed(1)}% success)`);
    console.log(`   ⏱  Avg: ${avg}ms  P50: ${p50}ms  P95: ${p95}ms  P99: ${p99}ms`);
    console.log(`   🎯 Target: ${RATE} req/min  Model: ${MODEL}`);
}

console.log(`🚀 Stress test: ${RATE} req/min → ${API_BASE} model=${MODEL}`);
console.log(`   Interval: ${INTERVAL_MS}ms between requests\n`);

let idx = 0;
const timer = setInterval(() => {
    sendRequest(++idx);
}, INTERVAL_MS);

// Print stats every 15 seconds
const statsTimer = setInterval(printStats, 15_000);

// Graceful stop on Ctrl+C
process.on('SIGINT', () => {
    clearInterval(timer);
    clearInterval(statsTimer);
    printStats();
    process.exit(0);
});
