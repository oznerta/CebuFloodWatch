import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

// Clean database URL to allow custom SSL options without libpq override
const cleanDbUrl = config.databaseUrl.replace(/[?&]sslmode=[^&]+/g, '');

const isCloud = config.databaseUrl.includes('supabase') ||
  config.databaseUrl.includes('pooler') ||
  config.databaseUrl.includes('ssl') ||
  config.databaseUrl.includes('render') ||
  config.databaseUrl.includes('neon');

export const pool = new Pool({
  connectionString: cleanDbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: isCloud ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
});

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (config.nodeEnv === 'development' && duration > 100) {
    console.warn(`[Slow Query ${duration}ms]: ${text.slice(0, 80)}...`);
  }
  return res;
}
