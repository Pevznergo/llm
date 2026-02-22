const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.sbtybwlwnzzowogtcfpy:B7zGOJXPRILsHZYJ@aws-1-eu-west-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  console.log("=== CHECKING USAGE RESULT ROWS ===");
  // Using simple AT TIME ZONE 'America/Los_Angeles' 
  // without jumping through 'UTC' first since "startTime" is a TIMESTAMPTZ (it already knows it's UTC)
  const usageResult = await client.query(`
    SELECT 
        model_id,
        model,
        COUNT(request_id) as consumed_today
    FROM "LiteLLM_SpendLogs"
    WHERE status = 'success'
      AND api_key != 'litellm-internal-health-check'
      AND DATE("startTime" AT TIME ZONE 'America/Los_Angeles') >= DATE(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')
    GROUP BY model_id, model
  `);

  console.log(`Query returned ${usageResult.rows.length} rows`);
  if (usageResult.rows.length > 0) {
    console.table(usageResult.rows.slice(0, 10));
  }

  // Let's see what Postgres outputs for these basic expressions
  const dRes = await client.query(`
    SELECT 
      CURRENT_TIMESTAMP as "raw_now",
      CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles' as "pst_now",
      DATE(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles') as "pst_today",
      (SELECT "startTime" FROM "LiteLLM_SpendLogs" ORDER BY "startTime" DESC LIMIT 1) as "last_record_raw",
      (SELECT "startTime" AT TIME ZONE 'America/Los_Angeles' FROM "LiteLLM_SpendLogs" ORDER BY "startTime" DESC LIMIT 1) as "last_record_pst",
      DATE((SELECT "startTime" AT TIME ZONE 'America/Los_Angeles' FROM "LiteLLM_SpendLogs" ORDER BY "startTime" DESC LIMIT 1)) as "last_record_pst_date"
  `);

  console.log("Postgres timezone evaluation:");
  console.table(dRes.rows);

  await client.end();
}

run().catch(console.error);
