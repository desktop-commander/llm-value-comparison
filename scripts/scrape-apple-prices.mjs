#!/usr/bin/env node
// Scrape Apple Mac prices using Playwright (headless Chromium)
// Run: node scripts/scrape-apple-prices.mjs

import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const hwPath = join(REPO, 'data/hardware.json');

// Find playwright
let chromium;
try {
  const require = createRequire(import.meta.url);
  chromium = require('playwright').chromium;
} catch {
  const npxPath = execSync(
    'find ~/.npm/_npx -name "playwright" -path "*/node_modules/playwright" -type d 2>/dev/null | head -1',
    { encoding: 'utf-8' }
  ).trim();
  if (!npxPath) throw new Error('Playwright not found. Run: npx playwright install chromium');
  const require2 = createRequire(npxPath + '/index.js');
  chromium = require2(npxPath).chromium;
}

const hardware = JSON.parse(readFileSync(hwPath, 'utf-8'));
const today = new Date().toISOString().split('T')[0];

async function scrapePage(page, url) {
  console.log(`  Loading ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Extract structured price data from the rendered page
  return await page.evaluate(() => {
    const text = document.body.innerText;
    // Find all "From $X" prices — these are the key product prices on Apple buy pages
    const fromPrices = [];
    const regex = /From\s+\$([0-9,]+)/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const pos = m.index;
      // Get surrounding context (200 chars before and after)
      const start = Math.max(0, pos - 200);
      const end = Math.min(text.length, pos + 200);
      const context = text.substring(start, end).replace(/\s+/g, ' ');
      fromPrices.push({
        price: parseFloat(m[1].replace(/,/g, '')),
        context
      });
    }
    return { fromPrices, title: document.title };
  });
}

async function main() {
  console.log('=== Apple prices via Playwright ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let updated = 0;

  // --- MacBook Pro ---
  const mbpData = await scrapePage(page, 'https://www.apple.com/shop/buy-mac/macbook-pro');
  console.log(`  ${mbpData.title}: ${mbpData.fromPrices.length} "From $X" prices found`);;
  
  // On Apple's buy page, the "From $X" prices appear in order:
  // 1st occurrence = headline price (same as 14")
  // The one near "14-inch" = 14" starting price  
  // The one near "16-inch" = 16" starting price
  // Apple's MBP buy page has "From $X" in this order:
  // [0] hero headline, [1] duplicate, [2] 14-inch selector, [3] 16-inch selector, [4] footer
  // We identify by unique price values — the 14" and 16" have different prices
  const uniquePrices = [...new Set(mbpData.fromPrices.map(p => p.price))].sort((a,b) => a - b);
  let mbp14 = uniquePrices[0] || null;  // lower = 14" base
  let mbp16 = uniquePrices.length > 1 ? uniquePrices[1] : null;  // higher = 16" base
  if (mbp14) console.log(`  → MBP 14" (lowest): $${mbp14}`);
  if (mbp16) console.log(`  → MBP 16" (next): $${mbp16}`);
  // Fallback: if 14" not matched by context, use first "From $" price
  if (!mbp14 && mbpData.fromPrices.length > 0) {
    mbp14 = mbpData.fromPrices[0].price;
    console.log(`  → MBP 14" (fallback first price): $${mbp14}`);
  }

  // --- MacBook Air ---
  const mbaData = await scrapePage(page, 'https://www.apple.com/shop/buy-mac/macbook-air');
  console.log(`  ${mbaData.title}: ${mbaData.fromPrices.length} "From $X" prices found`);
  let mba = null;
  const mbaUnique = [...new Set(mbaData.fromPrices.map(p => p.price))].sort((a,b) => a - b);
  mba = mbaUnique[0] || null;  // lowest = base Air
  if (mba) console.log(`  → MBA: $${mba}`);

  await browser.close();

  // --- Update hardware.json ---
  // Map scraped prices to hardware entries
  // 14" base = entry-level chip + 24GB unified memory
  // 16" base = Pro chip + 48GB+ unified memory (starting config)
  const updates = {
    mac_m4_24gb: { price: mbp14, note: 'MacBook Pro 14" base config' },
    mac_m4_48gb: { price: mbp16, note: 'MacBook Pro 16" base config' },
  };

  console.log('\n  Updating hardware.json:');
  for (const [hwId, data] of Object.entries(updates)) {
    if (!data.price) { console.log(`  ? ${hwId}: no price scraped`); continue; }
    const hw = hardware[hwId];
    if (!hw) { console.log(`  ? ${hwId}: not in hardware.json`); continue; }
    if (hw.price !== data.price) {
      console.log(`  ✓ ${hwId}: $${hw.price} → $${data.price} (${data.note})`);
      hw.price = data.price;
      updated++;
    } else {
      console.log(`  = ${hwId}: $${hw.price} unchanged`);
    }
    hw.notes = `${data.note}. Scraped from apple.com. Checked ${today}.`;
    hw.source = 'https://www.apple.com/shop/buy-mac/macbook-pro';
    hw.lastVerified = today;
  }

  writeFileSync(hwPath, JSON.stringify(hardware, null, 2));
  console.log(`\nDone: ${updated} Apple prices updated.`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
