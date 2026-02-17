// Quick fix script to drop the obsolete foreign key constraint
// Run with: node scripts/drop-old-constraint.js

const { Pool } = require('pg');

async function dropConstraint() {
    if (!process.env.POSTGRES_URL) {
        console.error('❌ POSTGRES_URL environment variable is not set');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔍 Checking for obsolete constraint...');

        // Check if constraint exists
        const checkResult = await pool.query(`
      SELECT constraint_name, table_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'user_prizes_telegram_id_fkey'
    `);

        if (checkResult.rows.length === 0) {
            console.log('✅ Constraint already removed or does not exist');
        } else {
            console.log('🗑️  Dropping constraint:', checkResult.rows[0].constraint_name);

            // Drop the constraint
            await pool.query(`
        ALTER TABLE user_prizes DROP CONSTRAINT IF EXISTS user_prizes_telegram_id_fkey
      `);

            console.log('✅ Successfully dropped obsolete foreign key constraint');
        }

        // Verify it's gone
        const verifyResult = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'user_prizes_telegram_id_fkey'
    `);

        if (verifyResult.rows.length === 0) {
            console.log('✅ Verified: Constraint has been removed');
        } else {
            console.log('⚠️  Warning: Constraint still exists');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

dropConstraint();
