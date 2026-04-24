## Data sources

All data is synced from multiple sources. See [DATA_SOURCES.md](DATA_SOURCES.md) for full details.

### Automated sync scripts

ScriptSourcesWhat it updates`node scripts/sync-from-aa.mjs`[Artificial Analysis](https://artificialanalysis.ai/), [Arena AI](https://arena.ai/), [OpenRouter](https://openrouter.ai/)API pricing, benchmark scores, Arena ELO, API throughput`node scripts/sync-from-arena.mjs`[Arena AI](https://arena.ai/) full leaderboard (338 models)Arena text + code ELO via Chrome scraping`node scripts/sync-hardware-prices.js`[bestvaluegpu.com](https://bestvaluegpu.com/), [apple.com](https://apple.com/shop/buy-mac), [Swappa](https://swappa.com/)GPU prices (HTTP), Mac prices (Playwright + Chrome)

### Manual (community PRs)

- **Local tok/s benchmarks** — run a model on your hardware, measure, submit with specs
- **Subscription token limits** — measured empirically, see below
- **New model entries** — especially Chinese open-weights and smaller models

### Subscription token measurement