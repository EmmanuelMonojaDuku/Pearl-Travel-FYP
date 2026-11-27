import { randomUUID } from 'node:crypto';
import { buildApp, type BuiltApplication } from '../../src/app.js';
import { createTestConfig } from '../helpers/inMemoryAuthFixtures.js';
import { PostgresAuthRepository } from '../../src/modules/auth/repository.js';
import { PostgresDatabaseClient } from '../../src/database/pool.js';
import { USER_ROLES, type UserRole } from '../../src/shared/roles.js';

/** Integration tests run against a real PostgreSQL with migrations 001-004 applied. Set TEST_DATABASE_URL to enable them. */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
export const hasDatabase = TEST_DATABASE_URL.length > 0;

export async function createIntegrationApp(overrides: Partial<NodeJS.ProcessEnv> = {}) {
  const config = createTestConfig({ DATABASE_URL: TEST_DATABASE_URL, DB_SSL_MODE: 'disable', REQUIRE_EMAIL_VERIFICATION: 'false', ...overrides });
  const db = new PostgresDatabaseClient(config);
  const built = await buildApp({ config, db, authRepository: new PostgresAuthRepository(db) });
  return { ...built, db };
}

export interface TestUser { id: string; email: string; token: string }

/** Registers a user through the real API, optionally grants a role, and logs in. */
export async function makeUser(built: BuiltApplication, role: UserRole = USER_ROLES.TRAVELLER, extra: Record<string, unknown> = {}): Promise<TestUser> {
  const email = `it-${randomUUID().slice(0, 8)}@example.com`;
  const password = 'PearlBorder2026!';
  const reg = await built.app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { email, password, firstName: 'Test', lastName: 'User', nationality: 'Kenya', travelPurpose: 'business', ...extra } });
  if (reg.statusCode !== 201) throw new Error(`register failed: ${reg.body}`);
  const user = await built.db.query<{ id: string }>(`SELECT id FROM public.pt_auth_users WHERE email_normalized = $1`, [email]);
  const id = user.rows[0]!.id;
  if (role !== USER_ROLES.TRAVELLER) {
    const roleRow = await built.db.query<{ id: string }>(`SELECT id FROM public.pt_auth_roles WHERE code = $1`, [role]);
    await built.db.query(`INSERT INTO public.pt_auth_user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, roleRow.rows[0]!.id]);
  }
  const login = await built.app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, password } });
  if (login.statusCode !== 200) throw new Error(`login failed: ${login.body}`);
  return { id, email, token: login.json().data.tokens.accessToken };
}

export const auth = (u: TestUser) => ({ authorization: `Bearer ${u.token}` });

export async function assignOfficer(built: BuiltApplication, userId: string, postCode = 'MALABA-OSBP') {
  await built.db.query(
    `INSERT INTO public.pt_admin_officer_assignments (user_id, border_post_id) SELECT $1, id FROM public.pt_admin_border_posts WHERE code = $2 ON CONFLICT (user_id, border_post_id) DO UPDATE SET is_active = TRUE`,
    [userId, postCode]
  );
}
