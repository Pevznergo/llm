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

async function migrate() {
    try {
        console.log('Starting migration to remove legacy fields...');
        console.log('Connected to DB Host:', new URL(process.env.POSTGRES_URL).hostname);

        // Check if columns exist
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'partners'
        `;

        const columnNames = columns.map(c => c.column_name);
        console.log('Current columns:', columnNames);

        // Drop role if exists
        if (columnNames.includes('role')) {
            console.log('Dropping role column...');
            await sql`ALTER TABLE partners DROP COLUMN role`;
            console.log('role column dropped.');
        } else {
            console.log('role column does not exist.');
        }

        // Drop looking_for if exists
        if (columnNames.includes('looking_for')) {
            console.log('Dropping looking_for column...');
            await sql`ALTER TABLE partners DROP COLUMN looking_for`;
            console.log('looking_for column dropped.');
        } else {
            console.log('looking_for column does not exist.');
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
