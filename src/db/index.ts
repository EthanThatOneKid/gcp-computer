import fs from 'fs/promises';
import path from 'path';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';

type QueryParams = readonly unknown[];

let pool: Pool | null = null;
let readyPromise: Promise<void> | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for Postgres access.');
  }

  return databaseUrl;
}

function createPool() {
  if (pool) {
    return pool;
  }

  let connectionString = getDatabaseUrl();
  const hostname = new URL(connectionString).hostname;
  const useSsl = !['localhost', '127.0.0.1', '::1'].includes(hostname);

  if (useSsl && !connectionString.includes('sslmode=')) {
    connectionString +=
      (connectionString.includes('?') ? '&' : '?') + 'sslmode=verify-full';
  }

  pool = new Pool({
    connectionString,
  });

  return pool;
}

function toPgSql(sql: string) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

async function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const activePool = createPool();
      await activePool.query('SELECT 1');

      await activePool.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
          name TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const migrationsDir = path.join(process.cwd(), 'src/db/migrations');
      const files = (await fs.readdir(migrationsDir))
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const applied = await activePool.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
        if (applied.rowCount) {
          continue;
        }

        const migrationSql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
        const client = await activePool.connect();

        try {
          await client.query('BEGIN');
          await client.query(migrationSql);
          await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    })().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }

  return readyPromise;
}

async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: QueryParams = [],
) {
  await ensureReady();
  return await createPool().query<T>(toPgSql(sql), params as unknown[]);
}

class PgPreparedStatement {
  constructor(private readonly sql: string) {}

  async get<T extends QueryResultRow = QueryResultRow>(...params: unknown[]) {
    const result = await query<T>(this.sql, params);
    return result.rows[0];
  }

  async all<T extends QueryResultRow = QueryResultRow>(...params: unknown[]) {
    const result = await query<T>(this.sql, params);
    return result.rows;
  }

  async run(...params: unknown[]) {
    const result = await query(this.sql, params);
    return { changes: result.rowCount ?? 0 };
  }
}

class PgDatabaseFacade {
  prepare(sql: string) {
    return new PgPreparedStatement(sql);
  }

  async exec(sql: string) {
    await ensureReady();
    await createPool().query(sql);
  }
}

const db = new PgDatabaseFacade();

export function getDb() {
  return db;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
  await ensureReady();
  const client = await createPool().connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
