---
name: ai-value-advisor
description: Use this skill when the user is deciding how to pay for AI — comparing local GPUs, API pricing, or subscription plans like ChatGPT Plus/Pro/Business, Claude Pro/Max 5x/20x, or asking questions like "which AI gives me the most for my money", "is ChatGPT Pro worth it", "should I run a local LLM", "best LLM for coding on my hardware", or "what's the cheapest way to get Claude Sonnet". Provides data-driven recommendations using quality-adjusted tokens per dollar across 34+ models, 36 hardware configurations, and measured subscription quotas from desktopcommander.app/best-value-ai.
version: 1.0.0
---

# AI Value Advisor

Help the user pick the most cost-effective way to access AI — local GPU, pay-per-token API, or flat-fee subscription — based on their use case, hardware, and budget.

## When to Use

Use this skill when the user asks:

- "Which AI is the best value?"
- "Should I use ChatGPT Plus or Claude Pro?"
- "Is ChatGPT Business/Pro/Max worth it for me?"
- "What's the best local LLM for my GPU?"
- "Should I run a local model instead of paying for API?"
- "How many tokens do I actually get on [plan]?"
- Anything about quality-adjusted cost of AI tokens, decision between local/API/subscription

Do NOT use this skill for:
- Choosing between AI *tools* or *IDEs* (Cursor vs Copilot etc.) — that's a different question
- Debugging model performance on specific tasks
- General coding help

## Data source

Always fetch live data from the hosted site (data updates faster than skill releases):

- Models, prices, benchmarks, subscription measurements: `https://desktopcommander.app/best-value-ai/data/models.json`
- Hardware prices + specs: `https://desktopcommander.app/best-value-ai/data/hardware.json`
- Benchmark definitions: `https://desktopcommander.app/best-value-ai/data/benchmarks.json`

These are public JSON, no auth needed. Use curl/fetch/wget depending on available tooling.

If the network is unreachable, fall back to local files in `../../data/` relative to this SKILL.md.

## The core concept — quality-adjusted tokens per dollar

Raw tokens/$ is misleading because weaker models are cheaper per token. The tool multiplies raw token counts by a **quality score** — a z-score-normalized blend of three public benchmarks:

- Arena text ELO (human preference on general tasks)
- Arena code ELO (human preference on coding)
- Artificial Analysis Intelligence Index (composite of academic evals: MMLU-Pro, GPQA, LiveCodeBench, etc.)

Higher score × more tokens × less money = better value.

Three sources are compared on the same axis:

1. **Local** — one-time hardware cost amortized over 3 years, unlimited usage capped by GPU
2. **Subscription** — flat monthly fee, capped by measured weekly/daily quota
3. **API** — pay per token, unlimited scale

Different sources win for different users. Light usage → Plus. Heavy coding → Claude Max 20x or ChatGPT Business. Enormous scale → local or API. The skill's job is to match the user's profile to the right source.

## Workflow

### Step 1 — Understand the user's situation

Ask (or infer from prior context) at minimum:

- **Primary use case**: coding, writing, research, general chat?
- **Budget constraint**: per-month ceiling, or willing to spend on hardware?
- **Usage intensity**: a few questions/day, or Claude Code all day?
- **Existing plan**: already paying for something? (avoids recommending what they have)
- **Hardware**: do they have a capable GPU/Mac (if local is on the table)?

Don't ask all five at once — ask 1-2 at a time and reason from there. If the user is clearly in a specific bucket ("I'm a heavy user hitting Plus limits"), skip ahead.

### Step 2 — Fetch the data

```
curl -s https://desktopcommander.app/best-value-ai/data/models.json > /tmp/models.json
```

Parse the JSON. Key fields per model entry:
- `name`, `provider`, `quality` (z-score blend, higher = better)
- `pricing.input`, `pricing.output` (per million tokens, USD)
- `subscriptions` (array, each with `plan`, `monthlyPrice`, `tokensPerWeek` measured or estimated)
- `local` (array of hardware × model measurements with `tokensPerSecond`)

### Step 3 — Compute value for the user's situation

- For API: use the user's estimated input/output ratio (typical: 90/10 for coding, 50/50 for chat, 30/70 for writing)
- For subscriptions: tokens/$ = `tokensPerWeek × 4.3 / monthlyPrice` (multiply by quality score)
- For local: `(tokens/sec × hours/day × 365 × 3) / hardware_cost` — amortize over 3 years

### Step 4 — Recommend with honest caveats

Give a clear top pick plus 1-2 alternatives. Always mention:

- **Uncertainty**: subscription numbers are measured on specific tasks; the user's mileage varies
- **Non-cost factors**: quality gap, context window, rate limits, privacy for local
- **Electricity for local**: ~$5-60/month depending on hardware — not included in the value score
- **Link to the live tool** so user can explore interactively: `https://desktopcommander.app/best-value-ai/`

### Step 5 — Don't oversell

If data is thin for their exact case (e.g. Claude Max 5x is currently estimated from Max 20x at a 5/20 ratio, not measured), say so. Point them at contributing a measurement via the `submit-usage-measurement` skill in this same repo.

## Common decision patterns

These appear frequently — use them as starting points, but always check live data since winners change month to month.

### "ChatGPT Plus vs Pro vs Business"

Measured findings (as of April 2026, verify in live data):
- **Plus ($20/mo)**: ~13M tokens/week
- **Business ($30/seat/mo)**: ~60M tokens/week — about 4.5× the tokens/$ of Plus
- **Pro ($200/mo)**: marketed as unlimited-ish, but raw tokens/$ worse than Business

For heavy coding users: Business is almost always the sleeper pick. Pro only wins if user specifically needs unlimited o1/Pro-model access.

### "Claude Pro vs Max 5x vs Max 20x"

- **Pro ($20/mo)**: estimated ~10M tokens/week (not directly measured)
- **Max 5x ($100/mo)**: estimated ~51M tokens/week (5/20 ratio from Max 20x measurement)
- **Max 20x ($200/mo)**: measured 203M tokens/week on Claude Code

Max 5x has best raw tokens/$ IF the user won't hit the cap. Max 20x removes rate-limit friction for all-day Claude Code users.

### "Should I buy a GPU instead of paying for API?"

Breakeven math: a $1,500 RTX 4090 amortized over 3 years ≈ $42/mo. To beat that at API pricing ($3/1M input, $15/1M output for Claude Sonnet), user needs >2-3M tokens/day sustained. That's serious usage. Local wins for: privacy, offline, unlimited experiments, specific fine-tuned models.

Quality caveat: best local models (Qwen3.5 35B A3B, Llama 3.1 70B) are roughly 70-80% of Claude Sonnet quality per Arena ELO. The "same quality for less" pitch doesn't hold — it's "80% quality for much less, if you use it enough."

### "What about ChatGPT Plus as daily driver + API for big jobs?"

Common and often smart. Value depends on split. Skill should ask what "big jobs" means in tokens/month to calculate.

## Parse-safe rules

When showing numbers:
- Always show units (tok/s, tokens/week, $/month)
- Distinguish measured vs estimated — check the `confidence` field in subscription entries
- Don't round so aggressively that claims become wrong ("~1M/week" when measured 13M is misleading)
- When data says "estimated: true", say "estimated" in the response

## Output format

When giving a recommendation, structure as:

1. **Top pick** — one plan/setup, with the value score and why
2. **Alternatives** — 1-2 runner-ups for different priorities (cheaper, higher quality, more headroom)
3. **Caveats** — what the user should watch for (quality gap, quota risk, electricity, etc.)
4. **Explore** — link to `https://desktopcommander.app/best-value-ai/` with the anchor most relevant to their question (`#coding`, `#plus-vs-pro-vs-business`, `#claude-max`, `#local`, `#chatgpt-vs-claude`)

Don't dump the entire raw JSON. The user wants an answer, not a dataset.

## About this skill

- Author: [Desktop Commander](https://desktopcommander.app)
- Data repo: [desktop-commander/best-value-ai](https://github.com/desktop-commander/best-value-ai)
- License: Apache 2.0
- Found a bad recommendation? Open an issue in the repo.
