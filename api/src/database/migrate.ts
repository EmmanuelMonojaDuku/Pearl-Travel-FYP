import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { loadConfig } from '../config/env.js';
import { buildPoolConfig, sanitizeDatabaseError } from './pool.js';

export interface MigrationFile {
  filename: string;
  filepath: string;
  sql: string;
  checksum: string;
}

const DESTRUCTIVE_PATTERNS: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /\bDROP\s+TABLE\b/i, reason: 'DROP TABLE is prohibited in additive migrations' },
  { pattern: /\bDROP\s+SCHEMA\b/i, reason: 'DROP SCHEMA is prohibited in additive migrations' },
  { pattern: /\bTRUNCATE\b/i, reason: 'TRUNCATE is prohibited in additive migrations' },
  { pattern: /\bDELETE\s+FROM\s+auth\./i, reason: 'Modifying Supabase auth.* tables is prohibited' },
  { pattern: /\bDROP\s+POLICY\b/i, reason: 'Dropping existing RLS policies is prohibited' },
];

export function resolveMigrationsDir(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, '../../migrations');
}

export async function loadMigrationFiles(
  migrationsDir: string = resolveMigrationsDir()
): Promise<MigrationFile[]> {
  const entries = await fs.readdir(migrationsDir);
  const sqlFiles = entries.filter((name) => name.endsWith('.sql')).sort();

  const migrations: MigrationFile[] = [];
  for (const filename of sqlFiles) {
    const filepath = path.join(migrationsDir, filename);
    const sql = await fs.readFile(filepath, 'utf8');
    const checksum = createHash('sha256').update(sql, 'utf8').digest('hex');
    migrations.push({ filename, filepath, sql, checksum });
  }

  return migrations;
}

export function validateMigrationSafety(migrations: readonly MigrationFile[]): void {
  if (migrations.length === 0) {
    throw new Error('No SQL migration files found.');
  }

  for (const migration of migrations) {
    if (!/^\d{3}_[a-z0-9_]+\.sql$/.test(migration.filename)) {
      throw new Error(
        `Invalid migration filename "${migration.filename}". Expected format: NNN_description.sql`
      );
    }

    if (!migration.sql.trim()) {
      throw new Error(`Migration "${migration.filename}" is empty.`);
    }

    for (const rule of DESTRUCTIVE_PATTERNS) {
      if (rule.pattern.test(migration.sql)) {
        throw new Error(`Unsafe SQL detected in ${migration.filename}: ${rule.reason}`);
      }
    }
  }
}

export async function runMigrations(): Promise<void> {
  const validateOnly = process.argv.includes('--validate') || process.argv.includes('--dry-run');
  const migrations = await loadMigrationFiles();
  validateMigrationSafety(migrations);

  console.info(
    `[migrate] Validated ${migrations.length} additive migration(s): ${migrations
      .map((m) => m.filename)
      .join(', ')}`
  );

  if (validateOnly) {
    console.info('[migrate] Validation passed (--validate mode; no database changes executed).');
    return;
  }

  const config = loadConfig();
  const connUrl = config.database.migrationUrl;
  if (!connUrl || connUrl.includes('CHANGE_ME')) {
    throw new Error(
      'Cannot execute migrations: DATABASE_URL / MIGRATION_DATABASE_URL is not configured.'
    );
  }

  const pool = new Pool(buildPoolConfig(config, connUrl));
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.pt_api_schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const appliedResult = await client.query<{ filename: string; checksum: string }>(
      'SELECT filename, checksum FROM public.pt_api_schema_migrations'
    );
    const appliedMap = new Map(appliedResult.rows.map((r) => [r.filename, r.checksum]));

    for (const migration of migrations) {
      const existingChecksum = appliedMap.get(migration.filename);
      if (existingChecksum) {
        if (existingChecksum !== migration.checksum) {
          throw new Error(
            `Checksum mismatch for already-applied migration ${migration.filename}. Refusing to modify history.`
          );
        }
        console.info(`[migrate] Skipping already applied: ${migration.filename}`);
        continue;
      }

      console.info(`[migrate] Applying additive migration: ${migration.filename}`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO public.pt_api_schema_migrations (filename, checksum) VALUES ($1, $2)',
          [migration.filename, migration.checksum]
        );
        await client.query('COMMIT');
        console.info(`[migrate] Applied successfully: ${migration.filename}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } catch (err) {
    console.error('[migrate] Migration failed:', sanitizeDatabaseError(err));
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

const isEntrypoint =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  runMigrations().catch((err) => {
    console.error('[migrate] Fatal error:', sanitizeDatabaseError(err));
    process.exit(1);
  });
}
