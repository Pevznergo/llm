
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function createTable() {
    try {
        await client.connect();
        console.log("Connected to database");

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS model_descriptions (
        model_id VARCHAR(255) PRIMARY KEY,
        display_name VARCHAR(255),
        description TEXT,
        provider_alias VARCHAR(100),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await client.query(createTableQuery);
        console.log("Table 'model_descriptions' created successfully.");

        // Optional: Insert some initial data from our local file?
        // Let's leave it empty as user wants to add them.

    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await client.end();
    }
}

createTable();
