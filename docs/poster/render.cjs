// Renders poster.html to PDF (vector, A1 landscape) and a PNG preview. Usage: node render.cjs
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 3179, height: 2245 }, deviceScaleFactor: 0.75 });
  await page.goto('file://' + path.resolve(__dirname, 'poster.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(() => [...document.querySelectorAll('.col')].map((c, i) => ({ col: i + 1, scroll: c.scrollHeight, client: c.clientHeight, over: c.scrollHeight - c.clientHeight })).concat([...document.querySelectorAll('.card')].filter(c => c.scrollHeight > c.clientHeight + 1).map(c => ({ card: c.querySelector('h2')?.innerText, over: c.scrollHeight - c.clientHeight }))));
  console.log(JSON.stringify(overflow));
  await page.screenshot({ path: path.resolve(__dirname, 'poster-preview.png') });
  await page.pdf({ path: path.resolve(__dirname, 'Pearl-Travel-Poster-A1.pdf'), width: '841mm', height: '594mm', printBackground: true, pageRanges: '1' });
  await b.close();
})();
