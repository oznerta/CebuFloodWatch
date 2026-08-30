import pg from 'pg';
const { Pool } = pg;

const dbUrl = "postgresql://postgres.hpjymncwggppjozloqsj:^!*%_SL53kh.q$F@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✅ public.system_settings table created/verified successfully in Supabase PostgreSQL!");
    process.exit(0);
  } catch (err) {
    console.error("DB error:", err);
    process.exit(1);
  }
}

run();
