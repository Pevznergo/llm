const { Client } = require("pg");

async function protectDB(connectionString) {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        // Prevent DROP TABLE
        await client.query(`
            CREATE OR REPLACE FUNCTION prevent_drop_table()
            RETURNS event_trigger AS $$
            BEGIN
              IF tg_tag IN ('DROP TABLE', 'DROP SCHEMA') THEN
                RAISE EXCEPTION 'Удаление таблиц СТРОГО ЗАПРЕЩЕНО! (DROP / TRUNCATE is blocked)';
              END IF;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await client.query(`DROP EVENT TRIGGER IF EXISTS prevent_drop_table_trigger`);

        await client.query(`
            CREATE EVENT TRIGGER prevent_drop_table_trigger
            ON sql_drop
            EXECUTE FUNCTION prevent_drop_table();
        `);

        // Prevent TRUNCATE TABLE
        await client.query(`
            CREATE OR REPLACE FUNCTION prevent_truncate_table()
            RETURNS trigger AS $$
            BEGIN
              RAISE EXCEPTION 'Очистка таблиц СТРОГО ЗАПРЕЩЕНА! (TRUNCATE is blocked)';
              RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Apply TRUNCATE trigger to all existing tables in public schema
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);

        for (const row of tablesRes.rows) {
            const tableName = row.table_name;
            await client.query(`DROP TRIGGER IF EXISTS prevent_truncate_trig ON "${tableName}"`);
            await client.query(`
                CREATE TRIGGER prevent_truncate_trig
                BEFORE TRUNCATE ON "${tableName}"
                FOR EACH STATEMENT
                EXECUTE FUNCTION prevent_truncate_table();
            `);
        }

        console.log(`Successfully protected DB: ${connectionString.split('@')[1]}`);
    } catch (e) {
        console.error(`Error protecting DB ${connectionString.split('@')[1]}:`, e.message);
    } finally {
        await client.end();
    }
}

async function main() {
    console.log("Protecting LiteLLM DB...");
    await protectDB("postgresql://postgres.sbtybwlwnzzowogtcfpy:B7zGOJXPRILsHZYJ@aws-1-eu-west-1.pooler.supabase.com:5432/postgres");
}

main();
