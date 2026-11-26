import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';
import type { AppConfig } from '../config/env.js';
import { ServiceUnavailableError } from '../shared/errors.js';
import type { DatabaseClient, DatabaseHealthStatus, QueryExecutor } from './types.js';

export function buildPoolConfig(config: AppConfig, overrideConnectionString?: string): PoolConfig {
  const connectionString = (overrideConnectionString ?? config.database.url).trim();

  let ssl: PoolConfig['ssl'] = false;
  if (config.database.sslMode !== 'disable') {
    ssl = {
      rejectUnauthorized: config.database.sslRejectUnauthorized,
    };
  }

  return {
    connectionString,
    ssl,
    max: config.database.poolMax,
    idleTimeoutMillis: config.database.idleTimeoutMs,
    connectionTimeoutMillis: config.database.connectionTimeoutMs,
    application_name: 'pearl-travel-api',
  };
}

export function sanitizeDatabaseError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Database connection error';
  // Redact any accidental postgres URI credentials if echoed by driver
  return raw.replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, 'postgresql://[REDACTED]@');
}

export class PostgresDatabaseClient implements DatabaseClient {
  private readonly pool: Pool | null;
  private readonly configured: boolean;

  constructor(config: AppConfig, injectedPool?: Pool) {
    if (injectedPool) {
      this.pool = injectedPool;
      this.configured = true;
      return;
    }

    const url = config.database.url.trim();
    const isPlaceholder =
      !url ||
      url.includes('CHANGE_ME') ||
      url.includes('YOUR_PASSWORD') ||
      url.includes('[YOUR-PASSWORD]');

    if (isPlaceholder) {
      this.pool = null;
      this.configured = false;
      return;
    }

    const poolConfig = buildPoolConfig(config, url);
    this.pool = new Pool(poolConfig);
    this.configured = true;

    this.pool.on('error', (err) => {
      console.error('[database] Unexpected idle PostgreSQL client error:', sanitizeDatabaseError(err));
    });
  }

  public isConfigured(): boolean {
    return this.configured && this.pool !== null;
  }

  public async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new ServiceUnavailableError(
        'PostgreSQL database is not configured. Provide server-side DATABASE_URL.',
        'DATABASE_NOT_CONFIGURED'
      );
    }

    return this.pool.query<T>(text, values ? [...values] : undefined);
  }

  public async transaction<T>(fn: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new ServiceUnavailableError(
        'PostgreSQL database is not configured. Provide server-side DATABASE_URL.',
        'DATABASE_NOT_CONFIGURED'
      );
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const executor: QueryExecutor = {
        query: <R extends QueryResultRow = QueryResultRow>(
          text: string,
          values?: readonly unknown[]
        ) => client.query<R>(text, values ? [...values] : undefined),
      };
      const result = await fn(executor);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  public async checkHealth(): Promise<DatabaseHealthStatus> {
    if (!this.pool || !this.configured) {
      return {
        status: 'unconfigured',
        configured: false,
        error: 'DATABASE_URL is missing or uses placeholder credentials.',
      };
    }

    const start = Date.now();
    try {
      const result = await this.pool.query<{
        ok: number;
        database_name: string;
        role_name: string;
      }>('SELECT 1 AS ok, current_database() AS database_name, current_user AS role_name');

      const row = result.rows[0];
      return {
        status: row?.ok === 1 ? 'healthy' : 'unhealthy',
        configured: true,
        latencyMs: Date.now() - start,
        database: row?.database_name,
        role: row?.role_name,
        pool: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        configured: true,
        latencyMs: Date.now() - start,
        error: sanitizeDatabaseError(error),
      };
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
