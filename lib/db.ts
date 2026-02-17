import { Pool } from 'pg'

// Global pool to prevent multiple connections in dev
let pool: Pool | undefined

const getPool = () => {
  if (!pool) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL is not defined')
    }
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL, but often uses self-signed certs for poolers
    })
  }
  return pool
}

// Helper to convert template literal to parameterized query
export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  const client = await getPool().connect()
  try {
    // Interleave strings and placeholders ($1, $2, etc.)
    const text = strings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? `$${i + 1}` : '')
    }, '')

    const res = await client.query(text, values)
    return res.rows
  } finally {
    client.release()
  }
}

// Инициализация таблицы пользователей и партнеров
export async function initDatabase() {
  try {
    if (!process.env.POSTGRES_URL) {
      console.warn('POSTGRES_URL is not defined, skipping database initialization')
      return
    }





    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS "User" (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Clans Table (New - Integer ID Adaptation)
    await sql`
      CREATE TABLE IF NOT EXISTS clans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        invite_code VARCHAR(50) UNIQUE NOT NULL,
        level INTEGER DEFAULT 1 NOT NULL,
        owner_id INTEGER REFERENCES "User"(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Partners table
    await sql`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age VARCHAR(255) NOT NULL,
        bio TEXT NOT NULL,
        discount VARCHAR(255) NOT NULL,
        logo VARCHAR(255) NOT NULL,
        is_platform BOOLEAN DEFAULT FALSE,
        is_partner BOOLEAN DEFAULT TRUE
      )
    `

    // Tariffs table
    await sql`
      CREATE TABLE IF NOT EXISTS tariffs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        features TEXT NOT NULL,
        partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        billing_period VARCHAR(20) DEFAULT 'monthly'
      )
    `

    // Reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        user_email VARCHAR(255)
      )
    `
    // Note: referencing by email is easier if user table IDs vary between auth methods, but linking by ID is better. 
    // Let's add user_id column and try to alter password.

    try {
      await sql`ALTER TABLE "User" ALTER COLUMN password DROP NOT NULL`
    } catch (e) {
      // Ignore if already nullable or other error (e.g. column doesn't exist yet on fresh init, which is handled by CREATE above if I change it there)
    }

    // User table extensions for Telegram integration and UTM tracking
    try {
      // Make email nullable for Telegram users
      await sql`ALTER TABLE "User" ALTER COLUMN email DROP NOT NULL`;

      // Note: telegramId already exists as VARCHAR, we use it as-is

      // Ensure telegramId exists and is unique (Fix for ON CONFLICT error)
      try {
        await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramId" VARCHAR(255)`;
        // Try validation via distinct index or constraint
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_telegram_id_idx ON "User" ("telegramId")`;
        // Or constraint
        // await sql`ALTER TABLE "User" ADD CONSTRAINT user_telegram_id_unique UNIQUE ("telegramId")`; 
        // Index is safer for "IF NOT EXISTS" logic in Postgres < 9.5 but standard now. 
        // However, ON CONFLICT requires a unique constraint or index.
      } catch (e) {
        console.warn("Telegram ID column/constraint warning:", e);
      }

      // Telegram-specific fields  
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS balance INTEGER DEFAULT 0`; // Token balance for chat requests
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS spins_count INTEGER DEFAULT 0`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMP`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

      // UTM tracking fields
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255)`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255)`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255)`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255)`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS start_param VARCHAR(50)`;

      // Other fields
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS request_count INTEGER DEFAULT 0`;

      // Clan fields (Integer ID Adaptation)
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS clan_id INTEGER`; // Intentionally no FK constraint to avoid strict dependency issues during migration, but ideally REFERENCES clans(id)
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS clan_role VARCHAR(50) DEFAULT 'member'`;
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS free_images_count INTEGER DEFAULT 0`;

      // Cleanup: drop duplicate telegram_id column if it was created before
      await sql`ALTER TABLE "User" DROP COLUMN IF EXISTS telegram_id`;
    } catch (e) {
      console.warn("User table extension warning:", e);
    }

    // Since CREATE TABLE IF NOT EXISTS doesn't update existing tables, we run ALTERs
    try {
      await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)`
    } catch (e) { }

    // Analysis Requests table (New)
    await sql`
      CREATE TABLE IF NOT EXISTS analysis_requests (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        source VARCHAR(50) NOT NULL,
        user_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Short Links table (New)
    await sql`
      CREATE TABLE IF NOT EXISTS short_links (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        target_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Link Schema Updates
    try {
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS tg_chat_id VARCHAR(100)`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS last_count_update TIMESTAMP`;
      await sql`ALTER TABLE short_links ALTER COLUMN target_url DROP NOT NULL`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS district VARCHAR(255)`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS marketplace_topic_id INTEGER`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS reviewer_name VARCHAR(255)`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS org_url TEXT`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS contacts TEXT`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS email_status VARCHAR(50) DEFAULT 'pending'`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS smartlead_lead_id VARCHAR(100)`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'не распечатан'`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS is_stuck BOOLEAN DEFAULT FALSE`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS sticker_title VARCHAR(255)`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS sticker_features TEXT`;
      await sql`ALTER TABLE short_links ADD COLUMN IF NOT EXISTS sticker_prizes TEXT`;

      // Fix: Increase code length to support referral codes (ref_xxxxxxxx = 12 chars)
      await sql`ALTER TABLE short_links ALTER COLUMN code TYPE VARCHAR(50)`;

    } catch (e) {
      console.warn("Schema update warning (short_links cols):", e);
    }

    // Chat Creation Queue (New)
    await sql`
      CREATE TABLE IF NOT EXISTS chat_creation_queue (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        district VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        error TEXT,
        scheduled_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Ecosystems table (New)
    await sql`
      CREATE TABLE IF NOT EXISTS ecosystems (
        id SERIAL PRIMARY KEY,
        tg_chat_id VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        district VARCHAR(255),
        invite_link TEXT,
        marketplace_topic_id INTEGER,
        admin_topic_id INTEGER,
        member_count INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'не подключен'
      )
    `;

    // Migration: Add status column if not exists
    try {
      await sql`ALTER TABLE ecosystems ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'не подключен'`;
    } catch (e) { }

    // Migration: Populate ecosystems from short_links if empty
    const existingEcosystems = await sql`SELECT id FROM ecosystems LIMIT 1`;
    if (existingEcosystems.length === 0) {
      await sql`
        INSERT INTO ecosystems (tg_chat_id, title, district, marketplace_topic_id, member_count, created_at)
        SELECT DISTINCT ON (tg_chat_id) tg_chat_id, reviewer_name, district, marketplace_topic_id, member_count, created_at
        FROM short_links
        WHERE tg_chat_id IS NOT NULL
      `;
    }

    // Market Ads table (New)
    await sql`
      CREATE TABLE IF NOT EXISTS market_ads (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(100) NOT NULL,
        topic_id INTEGER,
        message_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        sender_username VARCHAR(255),
        sender_id VARCHAR(100),
        district VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_id, message_id)
      )
    `;

    // Invite Stats table (New)
    await sql`
      CREATE TABLE IF NOT EXISTS invite_stats (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(100) NOT NULL,
        user_id VARCHAR(100) NOT NULL,
        user_name VARCHAR(255),
        invite_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chat_id, user_id)
      )
    `;

    // Unified Queue (Replaces topic_actions_queue and chat_creation_queue)
    await sql`
      CREATE TABLE IF NOT EXISTS unified_queue (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL, -- 'create_chat', 'create_topic', 'send_message', 'create_promo', etc.
        payload JSONB NOT NULL,    -- { title, district } OR { chat_id, topic_name, ... }
        status VARCHAR(50) DEFAULT 'pending',
        error TEXT,
        scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Topic Actions Queue (Deprecated - Kept for legacy data safety until migration complete)
    await sql`
      CREATE TABLE IF NOT EXISTS topic_actions_queue (
        id SERIAL PRIMARY KEY,
        chat_id VARCHAR(100) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        error TEXT,
        scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Flood Control table (New - Global Lock)
    await sql`
      CREATE TABLE IF NOT EXISTS flood_control (
        key VARCHAR(50) PRIMARY KEY,
        expires_at TIMESTAMP NOT NULL
      )
    `;

    // Telegram Web App Users - DEPRECATED: Now using \"User\" table
    // Migration: Copy data from app_users to User if needed
    try {
      const hasAppUsers = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_users')`;
      if (hasAppUsers[0].exists) {
        console.log('Migrating data from app_users to User...');
        await sql`
          INSERT INTO "User" (
            "telegramId", name, points, spins_count, daily_streak, 
            last_daily_claim, last_visit, created_at,
            utm_source, utm_medium, utm_campaign, utm_content, start_param
          )
          SELECT 
            telegram_id, 
            COALESCE(first_name || ' ' || NULLIF(last_name, ''), first_name, 'Telegram User'),
            COALESCE(points, 0), 
            COALESCE(spins_count, 0), 
            COALESCE(daily_streak, 0),
            last_daily_claim, 
            last_visit, 
            created_at,
            NULL as utm_source, 
            NULL as utm_medium, 
            NULL as utm_campaign, 
            NULL as utm_content, 
            NULL as start_param
          FROM app_users
          ON CONFLICT ("telegramId") DO UPDATE SET
            points = EXCLUDED.points,
            spins_count = EXCLUDED.spins_count,
            daily_streak = EXCLUDED.daily_streak,
            last_daily_claim = EXCLUDED.last_daily_claim,
            last_visit = EXCLUDED.last_visit
        `;
        console.log('Migration completed!');
      }
    } catch (e) {
      console.warn('App users migration warning:', e);
    }


    // Prizes table
    await sql`
      CREATE TABLE IF NOT EXISTS prizes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL, -- 'points', 'coupon', 'physical'
        value VARCHAR(255), -- '50', '10%', 'iPhone'
        probability DECIMAL(5,2) DEFAULT 0, -- percentage 0-100
        image_url TEXT,
        quantity INTEGER, -- NULL = Unlimited
        expiration_hours INTEGER DEFAULT 24, -- NULL = Infinite
        button_text VARCHAR(255) DEFAULT 'К товарам',
        button_url TEXT,
        status_text VARCHAR(255) DEFAULT 'Действует 24 часа',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Migration: Add quantity column if not exists
    try {
      await sql`ALTER TABLE prizes ADD COLUMN IF NOT EXISTS quantity INTEGER`;
      await sql`ALTER TABLE prizes ADD COLUMN IF NOT EXISTS expiration_hours INTEGER DEFAULT 24`;
      await sql`ALTER TABLE prizes ADD COLUMN IF NOT EXISTS button_text VARCHAR(255) DEFAULT 'К товарам'`;
      await sql`ALTER TABLE prizes ADD COLUMN IF NOT EXISTS button_url TEXT`;
      await sql`ALTER TABLE prizes ADD COLUMN IF NOT EXISTS status_text VARCHAR(255) DEFAULT 'Действует 24 часа'`;
    } catch (e) { }

    // User Prizes (Won items)
    await sql`
      CREATE TABLE IF NOT EXISTS user_prizes (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        prize_id INTEGER NOT NULL REFERENCES prizes(id),
        promo_code VARCHAR(255),
        expiry_at TIMESTAMP,
        revealed_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_used BOOLEAN DEFAULT FALSE
      )
    `;

    // Migration for existing tables
    try {
      await sql`ALTER TABLE user_prizes ADD COLUMN IF NOT EXISTS revealed_at TIMESTAMP`;
    } catch (e) { }


    // Migration: Add missing columns to user_prizes
    try {
      await sql`ALTER TABLE user_prizes ADD COLUMN IF NOT EXISTS telegram_id BIGINT`;
      await sql`ALTER TABLE user_prizes ADD COLUMN IF NOT EXISTS prize_id INTEGER`;
      await sql`ALTER TABLE user_prizes ADD COLUMN IF NOT EXISTS won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      await sql`ALTER TABLE user_prizes ADD COLUMN IF NOT EXISTS expiry_at TIMESTAMP`;
      await sql`ALTER TABLE user_prizes ADD COLUMN IF NOT EXISTS promo_code VARCHAR(255)`;
      await sql`ALTER TABLE user_prizes ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE`;

      // Ensure constraints exist (Postgres doesn't support IF NOT EXISTS for constraints easily in one line, 
      // so we assume if column exists, FK might need manual check, but usually adding columns is the main issue)
    } catch (e) {
      console.warn('Migration warning for user_prizes:', e)
    }

    // Migration: Drop old foreign key constraint that references app_users (now using User table)
    try {
      await sql`ALTER TABLE user_prizes DROP CONSTRAINT IF EXISTS user_prizes_telegram_id_fkey`;
      console.log('Dropped old user_prizes_telegram_id_fkey constraint');
    } catch (e) {
      console.warn('Could not drop old FK constraint:', e);
    }

    // --- Referral System Tables ---

    // Update User table with referral code
    try {
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS referral_code VARCHAR(255) UNIQUE`;
    } catch (e) {
      console.warn('Referral code column warning:', e);
    }

    // Referrals Table
    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id VARCHAR(255) NOT NULL, -- Who invited (Telegram ID)
        referred_id VARCHAR(255) UNIQUE NOT NULL, -- Who was invited (Telegram ID)
        status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'pro_upgraded'
        reward_amount INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Withdrawals Table
    await sql`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL, -- Who requests withdrawal (Telegram ID)
        amount INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'rejected'
        contact_info TEXT, -- Email or username
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // User Tasks Table (New)
    await sql`
      CREATE TABLE IF NOT EXISTS user_tasks (
        user_id VARCHAR(255) NOT NULL, -- Telegram ID
        task_id VARCHAR(50) NOT NULL, -- e.g. 'sub_channel_1'
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, task_id)
      )
    `;

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// Flood Wait Helpers
export async function getFloodWait(): Promise<number> {
  const result = await sql`SELECT expires_at FROM flood_control WHERE key = 'telegram_global'`;
  if (result.length === 0) return 0;

  const now = new Date();
  const expires = new Date(result[0].expires_at);

  if (expires > now) {
    return Math.ceil((expires.getTime() - now.getTime()) / 1000);
  }
  return 0;
}

export async function setFloodWait(seconds: number) {
  // Add small buffer (1s) to be safe
  const bufferSeconds = seconds + 1;
  await sql`
        INSERT INTO flood_control(key, expires_at)
    VALUES('telegram_global', NOW() + (${bufferSeconds} || ' seconds')::INTERVAL)
        ON CONFLICT(key) DO UPDATE SET
    expires_at = EXCLUDED.expires_at
      `;
}
