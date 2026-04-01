# LLM Value Comparison: Local vs Subscription vs API

**Compare the value of Local Hardware vs Subscriptions vs API pricing**

🔗 **Live tool:** https://desktop-commander.github.io/llm-value-comparison/  
📖 **Article:** [Local LLMs Are Finally Beating the Cloud! — But Are They?](https://wonderwhy-er.medium.com/local-llms-are-finally-beating-the-cloud-but-are-they-51fc0ad0dbd7)  
🏠 **Supported by:** [Desktop Commander](https://desktopcommander.app) — a model-agnostic AI assistant that works with local models, API keys, and subscriptions. This is why we care about this question.

---

## What is this?

A tool to calculate and compare **quality-adjusted tokens per dollar** across three ways to access LLMs:

1. **🖥️ Local** — One-time hardware cost, unlimited usage
2. **💳 Subscription** — Monthly fee, daily token limits (⚠️ estimated)
3. **🔌 API** — Pay per token

The core insight: not all tokens are equal. A token from a smarter model is worth more. We multiply raw token counts by model quality (from benchmarks) to get a fair comparison across completely different pricing models.

## Why Desktop Commander built this

Desktop Commander supports API keys, local models, and subscriptions to Claude and ChatGPT. Our users ask us constantly: *"What should I use?"* This tool is our answer — and we're keeping it open source so the community can help keep the data accurate.

## Features

* **📊 Calculator** — Ranked comparison of all models/services with step-by-step math
* **📈 Timeline Chart** — Value trends over time by provider
* **📋 Raw Data** — All data in tables with source links for every data point

## Local Development

```bash
# Using npx (recommended)
npx serve

# Or using Python
python3 -m http.server 8888
```

Then open http://localhost:3000 (serve) or http://localhost:8888 (Python).

## The Formula

All three calculate: **Quality-Adjusted Tokens per Dollar**

### Local
```
(tokens/sec × hours/day × 3600 × 365 × years × quality%) / hardware_cost
```

### Subscription
```
(tokens/day × 365 × years × quality%) / (monthly_price × 12 × years)
```

### API
```
(1,000,000 / weighted_price_per_million) × quality%
```

Weighted price = 75% input + 25% output (typical usage ratio).

## Data Structure

```
/data/
  index.json           # List of all model IDs
  hardware.json        # Hardware specs, prices, sources
  benchmarks.json      # Benchmark metadata
  /models/
    claude-sonnet-4.json
    gpt-5.2.json
    llama-3.1-70b.json
    ...
```

Each model file contains benchmarks, API pricing, local performance, and subscription options — every data point has a source URL.

## Contributing

**This project needs community contributions to stay accurate. Data goes stale fast.**

### How to add or update a model

1. Fork the repo
2. Create or edit: `data/models/your-model-id.json`
3. Add the model ID to `data/index.json`
4. Submit a PR — include source URLs for every data point

### Model file format

```json
{
  "id": "model-id",
  "name": "Model Name",
  "provider": "Provider",
  "releaseDate": "YYYY-MM-DD",
  "modelCard": "https://link-to-model-card",
  "benchmarks": {
    "arena_elo": { "score": 1300, "source": "https://lmarena.ai/leaderboard" },
    "aider_polyglot": { "score": 45.5, "source": "https://aider.chat/docs/leaderboards/" }
  },
  "api": {
    "inputPer1M": 3.00,
    "outputPer1M": 15.00,
    "source": "https://provider.com/pricing"
  },
  "local": {
    "rtx_3090": {
      "tokensPerSec": 45,
      "quantization": "Q4_K_M",
      "vramRequired": 24,
      "source": "https://github.com/ggerganov/llama.cpp/discussions/..."
    }
  },
  "subscriptions": {
    "service_name": {
      "name": "Service Name",
      "monthlyPrice": 20,
      "tokensPerDay": 200000,
      "confidence": "low",
      "notes": "Explanation of estimate",
      "source": "https://..."
    }
  }
}
```

### Subscription confidence levels

| Level | Meaning |
|-------|---------|
| `high` | Official published limits |
| `medium` | Derived from official info |
| `low` | Community estimates, reverse-engineered |

### Recommended benchmarks

| Benchmark | Use case | Why |
|-----------|----------|-----|
| `arena_elo` | General quality | Human preference, most reliable |
| `aider_polyglot` | Coding | Real-world tasks |
| `livebench` | Knowledge | Contamination-resistant |

Avoid MMLU and HumanEval — both are saturated.

## Data Sources

* **Human preference:** [LMSys Chatbot Arena](https://lmarena.ai/leaderboard)
* **Coding:** [Aider Leaderboard](https://aider.chat/docs/leaderboards/)
* **API pricing:** [Artificial Analysis](https://artificialanalysis.ai/models)
* **Local speeds:** [llama.cpp discussions](https://github.com/ggerganov/llama.cpp/discussions)
* **Subscription limits:** Community research (see individual source links)

## License

MIT — use it however you want.

---

*Built by [Eduard Ruzga](https://github.com/wonderwhy-er). Supported by [Desktop Commander](https://desktopcommander.app).*
