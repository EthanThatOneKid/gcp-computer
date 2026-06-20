import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

let db: DatabaseSync | null = null;

export function initDb() {
  try {
    const dbPath = path.join(process.cwd(), 'database.db');
    const isNew = !fs.existsSync(dbPath);

    db = new DatabaseSync(dbPath);
    
    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = ON');

    // Run schema migrations
    // Find schema.sql: since Next.js transpiles, it might look in different folders
    // We try src/db/schema.sql and fallback to root-level schema.sql if copied
    let schemaPath = path.join(process.cwd(), 'src/db/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.join(process.cwd(), 'db/schema.sql');
    }

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql);
      console.log('[DB] Database initialized and schema applied successfully.');
    } else {
      console.warn('[DB] schema.sql not found at', schemaPath);
    }
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    process.exit(1);
  }
}

export function getDb(): DatabaseSync {
  if (!db) {
    initDb();
  }
  return db!;
}
