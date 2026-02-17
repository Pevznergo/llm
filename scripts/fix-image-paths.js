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

async function fixImagePaths() {
    try {
        console.log('Fixing image paths in prizes table...');

        // Update all image_url paths from /api/uploads/ to /uploads/
        const result = await sql`
            UPDATE prizes 
            SET image_url = REPLACE(image_url, '/api/uploads/', '/uploads/')
            WHERE image_url LIKE '/api/uploads/%'
        `;

        console.log(`Updated ${result.length || 0} records`);

        // Show current prizes
        console.log('\n--- PRIZES AFTER FIX ---');
        const prizes = await sql`SELECT id, name, type, image_url FROM prizes ORDER BY id`;
        console.table(prizes);

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
    }
}

fixImagePaths();
