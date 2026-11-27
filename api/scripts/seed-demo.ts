/**
 * Creates three real demo accounts (traveller, border officer, administrator) in the database
 * so presentations use genuine server-side authentication and roles.
 * Usage: DATABASE_URL=... [DEMO_PASSWORD=...] npm run seed:demo
 */
import 'dotenv/config';
import argon2 from 'argon2';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is required.'); process.exit(1); }
if (process.env.NODE_ENV === 'production' && !process.env.DEMO_PASSWORD) { console.error('Set DEMO_PASSWORD explicitly in production.'); process.exit(1); }
const password = process.env.DEMO_PASSWORD ?? 'PearlDemo#2026';

const accounts = [
  { email: 'traveller.demo@pearltravel.ug', first: 'Amina', last: 'Kato', role: 'traveller', nat: 'Kenya', purpose: 'business' },
  { email: 'officer.demo@pearltravel.ug', first: 'Officer', last: 'Okello', role: 'border_officer', nat: null, purpose: null },
  { email: 'admin.demo@pearltravel.ug', first: 'Admin', last: 'Demo', role: 'admin_staff', nat: null, purpose: null },
  { email: 'reviewer.demo@pearltravel.ug', first: 'Second', last: 'Reviewer', role: 'admin_staff', nat: null, purpose: null },
] as const;

const client = new pg.Client({ connectionString: url });
await client.connect();
const hash = await argon2.hash(password, { type: argon2.argon2id });
for (const a of accounts) {
  const u = await client.query<{ id: string }>(
    `INSERT INTO public.pt_auth_users (email, email_normalized, password_hash, full_name, first_name, last_name, nationality, travel_purpose, gender, country_code, phone_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, email_verified, email_verified_at)
     VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE,NOW())
     ON CONFLICT (email_normalized) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE, nationality = EXCLUDED.nationality, travel_purpose = EXCLUDED.travel_purpose, gender = EXCLUDED.gender, country_code = EXCLUDED.country_code, phone_number = EXCLUDED.phone_number, emergency_contact_name = EXCLUDED.emergency_contact_name, emergency_contact_phone = EXCLUDED.emergency_contact_phone, emergency_contact_relation = EXCLUDED.emergency_contact_relation RETURNING id`,
    [a.email, hash, `${a.first} ${a.last}`, a.first, a.last, a.nat, a.purpose, ...(a.role === 'traveller' ? ['Female', '+254', '712345678', 'Peter Kato', '+254700123456', 'Spouse'] : [null, null, null, null, null, null])]);
  const uid = u.rows[0]!.id;
  await client.query(`INSERT INTO public.pt_auth_user_roles (user_id, role_id) SELECT $1, id FROM public.pt_auth_roles WHERE code = $2 ON CONFLICT DO NOTHING`, [uid, a.role]);
  if (a.role === 'border_officer') {
    await client.query(`INSERT INTO public.pt_admin_officer_assignments (user_id, border_post_id) SELECT $1, id FROM public.pt_admin_border_posts ON CONFLICT (user_id, border_post_id) DO UPDATE SET is_active = TRUE`, [uid]);
  }
  console.log(`seeded ${a.email} (${a.role})`);
}
await client.end();
