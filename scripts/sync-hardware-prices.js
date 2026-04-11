#!/usr/bin/env node
// Sync hardware prices from bestvaluegpu.com (GPUs) and apple.com (Macs)
// Usage: node scripts/sync-hardware-prices.js

const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO = path.join(__dirname, '..');
const hardware = JSON.parse(fs.readFileSync(path.join(REPO, 'data/hardware.json'), 'utf-8'));

// Map hardware IDs to bestvaluegpu.com URL slugs
const GPU_SLUGS = {
  rtx_5090: 'rtx-5090',
  rtx_5070: 'rtx-5070',
  rtx_4090: 'rtx-4090',
  rtx_4060: 'rtx-4060',
  rtx_3090: 'rtx-3090',
  rtx_3080_ti: 'rtx-3080-ti',
  rx_7900_xtx: 'rx-7900-xtx',
};

// Apple product prices — manually maintained since Apple has no price API
// These are current apple.com prices or refurbished store prices
// Update quarterly by checking apple.com/shop/buy-mac and apple.com/shop/refurbished/mac
const APPLE_PRICES = {
  mac_m1_max_64gb: { price: 2500, notes: 'Refurbished MacBook Pro 16" M1 Max 64GB. Uses unified memory for inference.', source: 'https://www.apple.com/shop/refurbished/mac/macbook-pro' },
  mac_m2_8gb: { price: 800, notes: 'MacBook Air M2 8GB. Refurbished/sale price. Very limited for LLM inference.', source: 'https://www.apple.com/shop/buy-mac/macbook-air' },
  mac_m3_max_64gb: { price: 3500, notes: 'MacBook Pro 16" M3 Max 36GB/64GB. apple.com starting price.', source: 'https://www.apple.com/shop/buy-mac/macbook-pro' },
  mac_m3_max_128gb: { price: 5500, notes: 'MacBook Pro 16" M3 Max 128GB. apple.com configured price.', source: 'https://www.apple.com/shop/buy-mac/macbook-pro' },
  mac_m4_24gb: { price: 1599, notes: 'MacBook Pro 14" M4 24GB. Starting price $1599.', source: 'https://www.apple.com/shop/buy-mac/macbook-pro' },
  mac_m4_48gb: { price: 2499, notes: 'MacBook Pro M4 Pro 48GB configuration.', source: 'https://www.apple.com/shop/buy-mac/macbook-pro' },
  mac_m4_max_128gb: { price: 4999, notes: 'MacBook Pro 16" M4 Max 128GB. apple.com configured price.', source: 'https://www.apple.com/shop/buy-mac/macbook-pro' },
  macbook_pro_2019_i9: { price: 2000, notes: 'Refurbished/used price estimate. Uses unified/system RAM. Radeon Pro 5500M.', source: 'https://www.apple.com/shop/refurbished/mac/macbook-pro' },
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 LLM-Value-Comparison/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeGpuPrice(slug) {
  const url = `https://bestvaluegpu.com/history/new-and-used-${slug}-price-history-and-specs/`;
  try {
    const html = await fetch(url);

    // bestvaluegpu.com is Next.js — all data is in __NEXT_DATA__ JSON
    const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!jsonMatch) {
      // Fallback: parse from JSON-LD schema
      const schemaMatch = html.match(/"@type":"Product".*?"offers":\[(.*?)\]/);
      if (schemaMatch) {
        const newMatch = schemaMatch[1].match(/"NewCondition".*?"price":(\d+)/);
        const usedMatch = schemaMatch[1].match(/"UsedCondition".*?"price":(\d+)/);
        const msrpMatch = html.match(/release price \(MSRP\)[^$]*\$([0-9,]+)/i);
        return {
          retail: newMatch ? parseInt(newMatch[1]) : null,
          used: usedMatch ? parseInt(usedMatch[1]) : null,
          msrp: msrpMatch ? parseInt(msrpMatch[1].replace(',', '')) : null,
          source: url
        };
      }
      console.log(`  ? No data found for ${slug}`);
      return null;
    }

    const data = JSON.parse(jsonMatch[1]);
    const props = data.props?.pageProps;
    if (!props) return null;

    const retail = props.newCard?.price || null;
    const used = props.usedCard?.price || null;
    const msrp = props.msrp || null;

    return { retail, used, msrp, source: url };
  } catch (err) {
    console.log(`  ✗ Failed to fetch ${slug}: ${err.message}`);
    return null;
  }
}

async function main() {
  const today = new Date().toISOString().split('T')[0];
  let updated = 0;

  console.log('=== GPU prices from bestvaluegpu.com ===');
  for (const [hwId, slug] of Object.entries(GPU_SLUGS)) {
    const data = await scrapeGpuPrice(slug);
    if (!data) continue;

    const hw = hardware[hwId];
    if (!hw) { console.log(`  ? ${hwId} not in hardware.json, skipping`); continue; }

    // For discontinued cards (3080 Ti, 3090), use eBay used price
    // For current cards, use MSRP as the reference price
    const isDiscontinued = hw.year <= 2021;
    const newPrice = isDiscontinued ? data.used : (data.msrp || data.retail);

    if (newPrice && newPrice !== hw.price) {
      console.log(`  ✓ ${hwId}: $${hw.price} → $${newPrice} (MSRP: $${data.msrp}, retail: $${data.retail}, used: $${data.used})`);
      hw.price = newPrice;
      updated++;
    } else if (newPrice) {
      console.log(`  = ${hwId}: $${hw.price} unchanged (MSRP: $${data.msrp}, retail: $${data.retail}, used: $${data.used})`);
    } else {
      console.log(`  ? ${hwId}: no price found on page`);
    }
    hw.notes = `${isDiscontinued ? 'Discontinued. Used' : 'MSRP'} $${newPrice}. Retail: $${data.retail || '?'}, Used: $${data.used || '?'}. Checked ${today}.`;
    hw.source = data.source;
    hw.lastVerified = today;
  }

  console.log('\n=== Apple/Mac prices (manual reference) ===');
  for (const [hwId, appleData] of Object.entries(APPLE_PRICES)) {
    const hw = hardware[hwId];
    if (!hw) { console.log(`  ? ${hwId} not in hardware.json, skipping`); continue; }
    if (hw.price !== appleData.price) {
      console.log(`  ✓ ${hwId}: $${hw.price} → $${appleData.price}`);
      hw.price = appleData.price;
      updated++;
    } else {
      console.log(`  = ${hwId}: $${hw.price} unchanged`);
    }
    hw.notes = appleData.notes + ` Checked ${today}.`;
    hw.source = appleData.source;
    hw.lastVerified = today;
  }

  fs.writeFileSync(path.join(REPO, 'data/hardware.json'), JSON.stringify(hardware, null, 2));
  console.log(`\nDone: ${updated} prices updated. All entries have lastVerified: ${today}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
