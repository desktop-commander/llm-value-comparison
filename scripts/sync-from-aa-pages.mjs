#!/usr/bin/env node
/**
 * sync-from-aa-pages.mjs
 *
 * Backfills benchmark scores that AA's public API doesn't expose but AA's
 * per-evaluation leaderboard pages do. Pulls from Next.js-inlined defaultData
 * on these pages:
 *   - /evaluations/mmlu-pro           (MMLU-Pro, retired from v4.0)
 *   - /evaluations/livecodebench      (LiveCodeBench, retired from v4.0)
 *   - /evaluations/aime-2025          (AIME 2025, retired from v4.0)
 *   - /evaluations/gdpval-aa          (GDPval-AA, v4.0 but not in API)
 *
 * Bonus: also exposes omniscience, critpt (other v4.0 benchmarks missing
 * from the public API).
 *
 * Same AA methodology as sync-from-aa.mjs — scores are z-score comparable.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const MODELS_FILE = path.join(DATA_DIR, 'models.json');

const PAGES = [
  'https://artificialanalysis.ai/evaluations/mmlu-pro',
  'https://artificialanalysis.ai/evaluations/livecodebench',
  'https://artificialanalysis.ai/evaluations/aime-2025',
  'https://artificialanalysis.ai/evaluations/gdpval-aa',
];

// AA field -> our benchmark key, scale
const FIELD_MAP = {
  mmlu_pro:      { key: 'mmlu_pro',       scale: 'pct' },
  livecodebench: { key: 'livecodebench',  scale: 'pct' },
  aime25:        { key: 'aime_25',        scale: 'pct' },
  gdpval:        { key: 'gdpval_aa',      scale: 'raw' },  // ELO
  omniscience:   { key: 'aa_omniscience', scale: 'raw' },  // signed index
  critpt:        { key: 'critpt',         scale: 'pct' },
};

// Extract defaultData JSON array from AA leaderboard page HTML
function extractDefaultData(html) {
  const pushRe = /self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\s*\]\)/g;
  let m, best = '';
  while ((m = pushRe.exec(html)) !== null) {
    if (m[1].length > best.length && m[1].includes('defaultData')) best = m[1];
  }
  if (!best) return null;
  const decoded = JSON.parse('"' + best + '"');
  const key = '"defaultData":[';
  const idx = decoded.indexOf(key);
  if (idx < 0) return null;
  // Walk balanced brackets starting at the '['
  const startBracket = idx + key.length - 1;
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = startBracket; i < decoded.length; i++) {
    const ch = decoded[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end < 0) return null;
  return JSON.parse(decoded.slice(startBracket, end));
}

// Map AA slug -> our model ID. Reuse the same mapping logic as sync-from-aa.mjs:
// models.json stores modelCard URLs like https://artificialanalysis.ai/models/<slug>
function buildAaSlugToOurId(models) {
  const map = {};
  for (const [ourId, m] of Object.entries(models)) {
    const mc = m.modelCard || '';
    const match = mc.match(/artificialanalysis\.ai\/models\/([^/?#]+)/);
    if (match) map[match[1]] = ourId;
    // Also allow the slug to equal ourId directly
    if (!map[ourId]) map[ourId] = ourId;
  }
  return map;
}

async function main() {
  console.log('Fetching AA leaderboard pages in parallel...');
  const pages = await Promise.all(PAGES.map(async url => {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; best-value-ai-sync/1.0)' }
    });
    if (!res.ok) {
      console.warn(`  ${url} -> HTTP ${res.status}`);
      return { url, data: null };
    }
    const html = await res.text();
    const data = extractDefaultData(html);
    console.log(`  ${url.split('/').pop()}: ${data ? data.length + ' records' : 'NO DATA'}`);
    return { url, data };
  }));

  // Merge all records across pages, keyed by slug. Later pages can fill nulls
  // left by earlier pages but never overwrite non-null values.
  const mergedBySlug = {};
  for (const p of pages) {
    if (!p.data) continue;
    for (const r of p.data) {
      const slug = r.slug;
      if (!slug) continue;
      if (!mergedBySlug[slug]) mergedBySlug[slug] = {};
      for (const [field] of Object.entries(FIELD_MAP)) {
        const v = r[field];
        if (v != null && mergedBySlug[slug][field] == null) {
          mergedBySlug[slug][field] = v;
        }
      }
    }
  }
  console.log(`\nMerged records: ${Object.keys(mergedBySlug).length} unique slugs`);

  const models = JSON.parse(fs.readFileSync(MODELS_FILE, 'utf8'));
  const slugMap = buildAaSlugToOurId(models);

  let totalCellsAdded = 0, modelsUpdated = 0;
  for (const [aaSlug, fields] of Object.entries(mergedBySlug)) {
    const ourId = slugMap[aaSlug];
    if (!ourId || !models[ourId]) continue;
    models[ourId].benchmarks = models[ourId].benchmarks || {};
    let added = 0;
    for (const [aaField, cfg] of Object.entries(FIELD_MAP)) {
      const raw = fields[aaField];
      if (raw == null) continue;
      if (models[ourId].benchmarks[cfg.key]?.score != null) continue;  // never overwrite
      const score = cfg.scale === 'pct'
        ? parseFloat((raw * 100).toFixed(1))
        : parseFloat(raw.toFixed(1));
      models[ourId].benchmarks[cfg.key] = {
        score,
        source: `https://artificialanalysis.ai/models/${aaSlug}`
      };
      added++;
    }
    if (added > 0) {
      modelsUpdated++;
      totalCellsAdded += added;
      console.log(`  ${ourId.padEnd(30)} (${aaSlug}) +${added} cells`);
    }
  }

  fs.writeFileSync(MODELS_FILE, JSON.stringify(models, null, 2) + '\n');
  console.log(`\nDone. ${modelsUpdated} models updated, ${totalCellsAdded} new benchmark cells added.`);
  console.log('Data attribution: https://artificialanalysis.ai/');
}

main().catch(e => { console.error(e); process.exit(1); });
