import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const OUT = '/tmp/fleet-screens';
await mkdir(OUT, { recursive: true });

const pages = [
  { name: '01-landing', url: 'http://localhost:3000/' },
  { name: '02-home', url: 'http://localhost:3000/home' },
  { name: '03-projects', url: 'http://localhost:3000/projects' },
  { name: '04-inbox', url: 'http://localhost:3000/inbox' },
  { name: '05-network', url: 'http://localhost:3000/network' },
  { name: '06-wiki', url: 'http://localhost:3000/wiki' },
  { name: '07-waitlists', url: 'http://localhost:3000/waitlists' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

for (const p of pages) {
  try {
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: `${OUT}/${p.name}.png`,
      fullPage: true,
    });
    console.log(`OK ${p.name}`);
  } catch (err) {
    console.warn(`FAIL ${p.name}: ${err.message}`);
  }
}

await browser.close();
console.log(`done -> ${OUT}/`);
