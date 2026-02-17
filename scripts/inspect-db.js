const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

if (!process.env.POSTGRES_URL) {
    console.error('Error: POSTGRES_URL is not defined in .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

const sql = async (strings, ...values) => {
    const text = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
    const client = await pool.connect();
    try {
        const res = await client.query(text, values);
        return res.rows;
    } finally {
        client.release();
    }
}

console.log('Connected to DB Host:', new URL(process.env.POSTGRES_URL).hostname);

async function inspect() {
    try {
        console.log('--- PRIZES ---');
        const prizes = await sql`SELECT id, name, type, value, image_url, probability, is_active FROM prizes ORDER BY id`;
        console.table(prizes);

        await pool.end();
    } catch (error) {
        console.error('Database Error:', error);
        await pool.end();
    }
}

inspect();
