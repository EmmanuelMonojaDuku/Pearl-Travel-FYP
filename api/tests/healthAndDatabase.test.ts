import type { Pool, PoolClient } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { PostgresDatabaseClient, sanitizeDatabaseError } from '../src/database/pool.js';
import {
  createTestConfig,
  FakeDatabaseClient,
  InMemoryAuthRepository,
} from './helpers/inMemoryAuthFixtures.js';

describe('Server startup, health checks, and PostgreSQL handling', () => {
  it('starts the Fastify server on an ephemeral port and responds to GET /health', async () => {
    const config = createTestConfig();
    const fakeDb = new FakeDatabaseClient();
    const { app } = await buildApp({
      config,
      db: fakeDb,
      authRepository: new InMemoryAuthRepository(),
    });

    const address = await app.listen({ host: '127.0.0.1', port: 0 });
    expect(address).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

    const res = await fetch(`${address}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      success: boolean;
      data: { status: string; service: string };
    };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.service).toBe('pearl-travel-api');

    await app.close();
  });

  it('returns 200 on GET /health/database when PostgreSQL pool check succeeds', async () => {
    const config = createTestConfig();
    const mockPool = {
      totalCount: 2,
      idleCount: 1,
      waitingCount: 0,
      query: vi.fn().mockResolvedValue({
        rows: [{ ok: 1, database_name: 'postgres', role_name: 'pearl_api_app' }],
      }),
      end: vi.fn().mockResolvedValue(undefined),
    } as unknown as Pool;

    const db = new PostgresDatabaseClient(config, mockPool);
    const { app } = await buildApp({
      config,
      db,
      authRepository: new InMemoryAuthRepository(),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health/database',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('healthy');
    expect(body.data.database).toBe('postgres');
    expect(body.data.role).toBe('pearl_api_app');

    await app.close();
  });

  it('returns 503 on GET /health/database when database is unconfigured', async () => {
    const config = createTestConfig({ DATABASE_URL: '' });
    const db = new PostgresDatabaseClient(config);
    const { app } = await buildApp({
      config,
      db,
      authRepository: new InMemoryAuthRepository(),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health/database',
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.data.status).toBe('unconfigured');
    expect(body.data.configured).toBe(false);

    await app.close();
  });

  it('sanitizes PostgreSQL connection errors and never exposes credentials', async () => {
    const config = createTestConfig();
    const mockPool = {
      query: vi
        .fn()
        .mockRejectedValue(
          new Error('connect ECONNREFUSED postgresql://secretuser:supersecret@db.supabase.co:5432/postgres')
        ),
      end: vi.fn().mockResolvedValue(undefined),
    } as unknown as Pool;

    const db = new PostgresDatabaseClient(config, mockPool);
    const health = await db.checkHealth();

    expect(health.status).toBe('unhealthy');
    expect(health.error).not.toContain('supersecret');
    expect(health.error).toContain('[REDACTED]@');
    expect(
      sanitizeDatabaseError(new Error('postgres://admin:pass123@host:5432/db failed'))
    ).toBe('postgresql://[REDACTED]@host:5432/db failed');

    await db.close();
  });

  it('rolls back failed database transactions safely and releases the client', async () => {
    const config = createTestConfig();
    const queries: string[] = [];
    const release = vi.fn();

    const mockClient = {
      query: vi.fn(async (sql: string) => {
        queries.push(sql);
        return { rows: [], rowCount: 0 };
      }),
      release,
    } as unknown as PoolClient;

    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
      end: vi.fn().mockResolvedValue(undefined),
    } as unknown as Pool;

    const db = new PostgresDatabaseClient(config, mockPool);

    await expect(
      db.transaction(async (tx) => {
        await tx.query('INSERT INTO test VALUES (1)');
        throw new Error('Simulated failure');
      })
    ).rejects.toThrow('Simulated failure');

    expect(queries).toEqual(['BEGIN', 'INSERT INTO test VALUES (1)', 'ROLLBACK']);
    expect(release).toHaveBeenCalledTimes(1);

    await db.close();
  });
});
