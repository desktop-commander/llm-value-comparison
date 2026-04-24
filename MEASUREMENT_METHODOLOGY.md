# Subscription Token Measurement Methodology

## The Problem

Neither OpenAI nor Anthropic publish exact daily token quotas for their subscription plans.
Both use rolling 5-hour windows and weekly limits expressed as percentages, not absolute token counts.
This makes it impossible to calculate "tokens per dollar" without empirical measurement.

## Our Approach

We measure subscription quotas empirically by:
1. Running a standardized coding task through the CLI
2. Capturing exact token counts from the API response
3. Recording the quota percentage consumed before and after
4. Calculating: `total_quota = tokens_consumed / (percentage_consumed / 100)`

## Tools Used

### Codex CLI (ChatGPT Plus/Pro)

**Token counts:** `npx codex exec --json` outputs JSONL with exact per-turn usage:
```json
{"type":"turn.completed","usage":{"input_tokens":361912,"cached_input_tokens":293760,"output_tokens":8177}}
```

**Quota percentages:** The Codex TUI `/status` command shows 5h and weekly limits.
We automate this using tmux to drive the TUI non-interactively:
```bash
tmux new-session -d -s codex 'cd /project && npx codex'
sleep 18
tmux send-keys -t codex Escape
sleep 1
tmux send-keys -t codex '/status' Enter
sleep 10
tmux capture-pane -t codex -p  # → parseable text
tmux kill-session -t codex
```

**Local database:** `~/.codex/state_5.sqlite` contains cumulative `tokens_used` per session
in the `threads` table, useful for cross-checking.


### Claude Code (Claude Pro/Max)

**Token counts:** `claude -p "prompt"` with `/cost` command shows session tokens.
Claude Code also has `/status` for quota percentages.

**Quota percentages:** Similar 5-hour rolling window + weekly limits.
Pro: ~44K output tokens per 5h window (community estimate).
Max5 ($100): ~88K. Max20 ($200): ~220K.
(Not yet measured empirically — contributions welcome.)

## Standardized Test Task

We use a deterministic coding prompt to ensure measurements are comparable:

> "Write a Python doubly-linked list with insert_head, insert_tail, delete_node, 
> find, reverse, to_list methods. Include Node class, type hints, docstrings. 
> Write exactly 10 pytest tests."

This produces ~150 lines of code output and typically requires 3-5 tool calls
(ls, git status, python validation, file write).

## What "Tokens" Means

The token counts from `--json` include ALL tokens billed against the quota:
- **System prompt:** ~70K tokens (Codex's built-in instructions)
- **Cached input:** Tokens that match the prompt cache (cheaper but still counted)
- **Tool call overhead:** Each tool invocation adds context
- **Reasoning tokens:** Internal chain-of-thought (varies by effort level)
- **Output tokens:** The actual code/text the user receives

**Important:** A single "real coding task" consumes ~370K total tokens at xhigh
reasoning, of which only ~8K are user-visible output. The system overhead dominates.

## Impact of Reasoning Effort

Same task measured at different reasoning levels (Codex Plus, GPT-5.4):

| Reasoning | Input tokens | Output tokens | Total | Ratio |
|-----------|-------------|---------------|-------|-------|
| xhigh    | 361,912     | 8,177         | 370,089 | 1.0x |
| medium   | 211,972     | 3,073         | 215,045 | 0.58x |

xhigh uses ~1.7x more tokens than medium for the same task.
This means reasoning effort directly affects how many tasks fit in your quota.


## First Measurement: ChatGPT Plus ($20/mo)

**Date:** 2026-04-13  
**Tool:** Codex CLI v0.120.0  
**Model:** GPT-5.4 (reasoning xhigh)  
**Plan:** Plus ($20/mo)

### Runs

| Run | Reasoning | Total tokens | % of 5h consumed |
|-----|-----------|-------------|-------------------|
| Hello World | xhigh | 70,023 | ~1% |
| Linked list + tests | xhigh | 370,089 | ~5% |
| Linked list + tests | medium | 215,045 | ~3% |
| Status query overhead | xhigh | 141,696 | ~2% |
| **Total** | | **796,853** | **12%** |

### Results

| Metric | Value |
|--------|-------|
| 5h window consumed | 12% (88% remaining) |
| Weekly consumed | 6% (94% remaining) |
| **Estimated 5h window** | **\~6.6M tokens** | | **Estimated weekly quota** | **\~13.3M tokens** | | **Effective daily (weekly/7)** | **\~1.9M tokens/day** | | Binding constraint | Weekly (not 5h) |

### For the Value Calculator

We use `tokensPerWeek = 13,280,883` for ChatGPT Plus in our formula. Value = `tokensPerWeek × 4 × quality% / monthlyPrice`.

Pro ($100/mo) is officially 5x Plus → `tokensPerWeek = 66,500,000`. (Currently has 2x boost ending May 31, 2026, making it effectively 10x.)

## How to Contribute Your Own Measurements

1. Clone the repo

2. Pick the right script for your CLI:

   - **Claude Code**: `scripts/measure-claude-quota.sh`
   - **Codex CLI**: `scripts/measure-codex-quota.sh`

3. **Always pass the model name** as the second argument so the script can force the model:

   ```bash
   bash scripts/measure-claude-quota.sh /tmp/claude-scratch sonnet
   bash scripts/measure-codex-quota.sh  /tmp/codex-scratch  gpt-5.4
   ```

4. **Size** `PARALLEL` **for your plan**. Each batch should move the weekly meter by \~1%; larger batches collapse multiple flips into one measurement point and corrupt the estimate. Rough defaults:

   - Claude Pro: `PARALLEL=2–3`
   - Claude Max 20×: `PARALLEL=20–30`
   - ChatGPT Plus: `PARALLEL=3–5`
   - ChatGPT Business: `PARALLEL=2–3`
   - ChatGPT Pro: `PARALLEL=15–25` (not yet confirmed)

5. The script writes `measurements/<tool>_measurement_<timestamp>.json`. Open a PR with that file + any notes about your plan state (5h quota consumed at start, etc.)

### Multi-flip method (current ground truth)

Since April 2026 both scripts measure quota the same way:

1. Record the weekly meter value before the run
2. Run the standardized coding task in batches of `PARALLEL` concurrent calls
3. After each batch, re-read `/status`. If the meter crossed a whole-percent boundary, record the cumulative token total at that crossing.
4. Stop after `TARGET_FLIPS` (default 3) crossings.
5. Discard the first crossing — we don't know where inside the starting 1% bucket the measurement began, so it's a biased estimate.
6. Average the remaining inter-flip token deltas → tokens per 1% → multiply by 100 for the weekly estimate.

A clean run produces 1 flip per batch. If a batch crosses 2+ boundaries at once, flip resolution degrades and the estimate is unreliable — lower `PARALLEL` and re-run.

### What we still need

More measurements = more accurate data. We especially need:

- **ChatGPT Pro** ($200/mo) — never measured
- **Claude Max 5×** ($100/mo) — estimated as 5/20 × Max 20×, never measured
- **Claude Pro + Sonnet** — we have Pro + Opus, not Sonnet yet
- **ChatGPT Business + GPT-5.5** — Business on 5.4 is from an older single-flip run; GPT-5.5 Business entirely unmeasured
- **Different reasoning effort levels** on Codex (low, medium, high, xhigh) — currently all our Codex runs use xhigh
- **Gemini Advanced** subscriptions once Google exposes a quota meter

## Data Files

- `measurements/*.json` — Raw measurement data, one file per run. PRs welcome.
- `data/models.json` — Subscription data used by the calculator (aggregated from measurements)