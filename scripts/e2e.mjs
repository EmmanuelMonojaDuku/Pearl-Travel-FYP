// End-to-end check of the real stack: API (port 4000) + built web app served by `vite preview` (port 4173).
// Run:  npm run build -- --mode demo  &&  (npx vite preview --port 4173 &)  &&  npm run test:e2e
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.E2E_BASE || 'http://127.0.0.1:4173';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`); };

const browser = await chromium.launch();
async function demoLogin(ctx, role) {
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Login' }).first().click();
  await page.getByRole('button', { name: role, exact: true }).click();
  return page;
}

try {
  /* 1. Traveller: server login, QR pass issue (signed, no PII) */
  const tctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  let issued = null;
  const tp = await demoLogin(tctx, 'Traveller');
  tp.on('response', async (r) => { if (r.url().endsWith('/qr/issue') && r.ok()) issued = (await r.json()).data; });
  await tp.getByRole('button', { name: /^QR Pass/ }).first().click();
  await tp.getByRole('button', { name: /Create (new )?pass/ }).click();
  await tp.waitForSelector('text=Signed pass', { timeout: 15000 }).catch(() => {});
  check('Traveller signs in through the API and creates a signed pass', Boolean(issued?.token?.startsWith('PT1.')), JSON.stringify(issued)?.slice(0, 120));
  const claims = issued ? JSON.parse(Buffer.from(issued.token.split('.')[1], 'base64url').toString()) : {};
  check('Pass carries no name or passport number', issued && !/Amina|Kato|AK1234567/i.test(JSON.stringify(claims)), JSON.stringify(claims));
  check('Pass is shown with a reference code, not a name', await tp.locator(`text=${issued?.referenceCode}`).count() > 0);

  /* 2. Offline: shell and saved pass still load, banner shows */
  await tp.reload();
  await tp.waitForTimeout(1500);
  const swReady = await tp.evaluate(async () => Boolean(await navigator.serviceWorker.ready.catch(() => null)));
  check('Service worker is active', swReady);
  await tctx.setOffline(true);
  await tp.reload();
  await tp.waitForTimeout(2000);
  check('App shell opens with no connection', await tp.locator('#root *').count() > 5);
  check('Offline banner is shown', await tp.getByText(/^Offline\./).count() > 0);
  await tp.getByRole('button', { name: /^QR Pass/ }).first().click().catch(() => {});
  await tp.waitForTimeout(800);
  check('Saved pass is still available offline', await tp.locator(`text=${issued?.referenceCode}`).count() > 0);
  check('Creating a pass is disabled offline with an explanation', await tp.getByRole('button', { name: /Create (new )?pass/ }).isDisabled().catch(() => false));
  await tctx.setOffline(false);

  /* 3. Officer: verify genuine, reject tampered, no PII shown */
  const octx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const op = await demoLogin(octx, 'Officer');
  await op.getByRole('button', { name: /Scan Passenger QR/ }).click();
  const verify = async (token) => { if (!(await op.locator('#manual-code').count())) await op.getByRole('button', { name: /Scan/ }).first().click(); await op.locator('#manual-code').fill(token); await op.getByRole('button', { name: 'Verify pass code' }).click(); await op.waitForTimeout(1500); };
  await verify(issued.token);
  const body = await op.locator('body').innerText();
  check('Officer sees the reference and readiness for a genuine pass', body.includes(issued.referenceCode));
  check('Officer screen shows no passenger name', !/Amina|Kato/.test(body));
  await op.getByRole('button', { name: /Approve/ }).click().catch(() => {});
  await op.waitForTimeout(800);
  await op.getByRole('button', { name: /Back to scanner/ }).click().catch(() => {});
  const parts = issued.token.split('.');
  const forged = JSON.parse(Buffer.from(parts[1], 'base64url').toString()); forged.sc = 100;
  await verify(`${parts[0]}.${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${parts[2]}`);
  const body2 = await op.locator('body').innerText();
  check('Tampered pass is rejected', /Not a valid pass/.test(body2), body2.slice(0, 200));

  /* 4. Admin: draft -> review -> approval by a different admin */
  const actx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const ap = await demoLogin(actx, 'Admin');
  await ap.getByRole('button', { name: /^Content/ }).click();
  await ap.getByRole('button', { name: /New/ }).click();
  const title = `E2E guidance ${Date.now()}`;
  await ap.getByLabel('Title').fill(title);
  await ap.getByLabel('Short summary').fill('Test summary for e2e');
  await ap.getByLabel('Full text').fill('This is a test guidance article created by the automated end to end test.');
  await ap.getByLabel('Official source').fill('Test Authority');
  await ap.getByRole('button', { name: 'Save draft' }).click();
  await ap.waitForSelector(`text=${title}`, { timeout: 8000 }).catch(() => {});
  check('Admin creates a draft stored on the server', await ap.getByText(title).count() > 0);
  await ap.locator('li', { hasText: title }).getByRole('button', { name: 'Submit for review' }).click();
  await ap.waitForTimeout(800);
  await ap.locator('li', { hasText: title }).getByRole('button', { name: /Approve and publish/ }).click();
  await ap.waitForTimeout(800);
  check('Author cannot approve their own item', await ap.getByText(/cannot approve content you authored/i).count() > 0);
  await ap.getByRole('button', { name: /Profile/ }).click();
  await ap.getByRole('button', { name: /Sign out/ }).click();
  await ap.waitForTimeout(500);
  await ap.getByRole('button', { name: 'Login' }).first().click().catch(() => {});
  await ap.locator('input[type=email], input[name=email]').first().fill('reviewer.demo@pearltravel.ug');
  await ap.locator('input[type=password]').first().fill('PearlDemo#2026');
  await ap.getByRole('button', { name: 'Login', exact: true }).last().click();
  await ap.waitForTimeout(2000);
  await ap.getByRole('button', { name: /^Content/ }).click();
  await ap.locator('li', { hasText: title }).getByRole('button', { name: /Approve and publish/ }).click();
  await ap.waitForTimeout(1000);
  check('A second administrator approves and publishes it', await ap.locator('li', { hasText: title }).getByText('published').count() > 0);

  /* 5. Roles come from the server: a forged local role gives no access */
  const fctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const fp = await fctx.newPage();
  await fp.addInitScript(() => localStorage.setItem('pearl_travel_user_session_v1', JSON.stringify({ user: { name: 'Mallory', email: 'm@x.ug', roles: ['admin_staff'], profileCompleted: true }, rememberMe: true })));
  await fp.goto(BASE + '/');
  await fp.waitForTimeout(1500);
  check('Forged admin role in browser storage does not open the admin dashboard', await fp.getByText('Admin Dashboard').count() === 0);
} catch (e) {
  check('Test run completed without an exception', false, String(e).slice(0, 300));
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
