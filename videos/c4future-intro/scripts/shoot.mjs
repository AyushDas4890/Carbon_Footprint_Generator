// Project-specific capture: drives the locally-run C4Future app (live HF Space is unreachable from this sandbox).
// Serves Google Fonts from assets/fonts (headless Chromium has no proxy), fills the calculator, screenshots each page.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
await ctx.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ contentType: 'text/css', body: fs.readFileSync('assets/fonts/local.css', 'utf8') }));
await ctx.route(/\/__fonts\//, (r) => r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync('assets/fonts/' + r.request().url().split('/__fonts/')[1]) }));
import crypto from 'node:crypto';
await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|fonts\.googleapis)/, (r) => {
  const f = 'assets/cdn/' + crypto.createHash('md5').update(r.request().url() + '\n').digest('hex').slice(0, 12) + '.js';
  return fs.existsSync(f) ? r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(f) }) : (console.log('blocked', r.request().url()), r.abort());
});
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text(), m.location().url); });
const settle = async () => { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(2500); };
const hideCursor = () => page.addStyleTag({ content: '.cursor,.cursor-dot,.cursor-ring,#cursor,#cursor-dot,[class*=cursor]{display:none!important}' });
fs.mkdirSync('assets/cap', { recursive: true });

await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await hideCursor(); await settle();
await page.screenshot({ path: 'assets/cap/home_hero.png' });
const geo = {};
const rel = (sel, inner) => page.evaluate(([a, b]) => {
  const A = document.querySelector(a).getBoundingClientRect(), B = document.querySelector(b), r = B.getBoundingClientRect(), cs = getComputedStyle(B);
  return { x: r.left - A.left, y: r.top - A.top, w: r.width, h: r.height, W: A.width, H: A.height, font: cs.fontSize, weight: cs.fontWeight, color: cs.color, family: cs.fontFamily, pl: cs.paddingLeft };
}, [sel, inner]);
// empty calculator card, placeholder cleared: the film types "Cotton T-Shirt" into the field itself
await page.locator('#calculator').scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
await page.selectOption('#material', 'Cotton'); await page.selectOption('#transportMode', 'SEA');
await page.evaluate(() => { for (const [id, v] of [['weight', 0.3], ['distance', 8000]]) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input')); } });
await page.evaluate(() => { document.getElementById('productName').placeholder = ''; });
await page.mouse.move(0, 0);
geo.form = { field: await rel('#calculator', '#productName'), button: await rel('#calculator', '#carbonForm button[type=submit]') };
await page.locator('#calculator').screenshot({ path: 'assets/cap/el_form.png' });
await page.evaluate(() => { document.getElementById('productName').placeholder = 'e.g. Cotton T-Shirt'; });
await page.fill('#productName', 'Cotton T-Shirt');
await page.selectOption('#material', { index: 1 }).catch(() => {});
const mats = await page.$$eval('#material option', (o) => o.map((x) => x.value));
await page.selectOption('#material', 'Cotton');
await page.selectOption('#transportMode', 'SEA'); await page.evaluate(() => { const d = document.getElementById('distance'); d.value = 8000; d.dispatchEvent(new Event('input')); });
await page.evaluate(() => { const w = document.getElementById('weight'); w.value = 0.3; w.dispatchEvent(new Event('input')); });
await page.locator('#calculator').scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
await page.locator('#calculator').screenshot({ path: 'assets/cap/form.png' });
await Promise.all([page.waitForURL('**/results/', { timeout: 30000 }), page.evaluate(() => document.getElementById('carbonForm').requestSubmit())]);
await hideCursor(); await settle();
await page.screenshot({ path: 'assets/cap/results.png' });
geo.result = { value: await rel('.result-hero-card', '#resultValue'), text: await page.textContent('#resultValue'),
  ciLow: await page.textContent('#ciLow'), ciHigh: await page.textContent('#ciHigh') };
await page.locator('.result-hero-card').screenshot({ path: 'assets/cap/el_result.png' });
await page.evaluate(() => { document.getElementById('resultValue').style.visibility = 'hidden'; });
await page.locator('.result-hero-card').screenshot({ path: 'assets/cap/el_result_blank.png' });
await page.evaluate(() => { document.getElementById('resultValue').style.visibility = ''; });
await page.locator('.results-layout .glass-card').first().screenshot({ path: 'assets/cap/el_breakdown.png' });
await page.screenshot({ path: 'assets/cap/results_full.png', fullPage: true });
for (const p of ['insights', 'compare', 'decompose', 'advisor']) {
  await page.goto(`${BASE}/${p}/`, { waitUntil: 'networkidle' }); await hideCursor(); await settle();
  await page.screenshot({ path: `assets/cap/${p}.png` });
  await page.screenshot({ path: `assets/cap/${p}_full.png`, fullPage: true });
}
fs.writeFileSync('assets/cap/geo.json', JSON.stringify(geo, null, 2));
await browser.close();
console.log('mats:', mats.slice(0, 12).join(','));
