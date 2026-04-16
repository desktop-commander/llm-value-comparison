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
| **Estimated 5h window** | **~6.6M tokens** |
| **Estimated weekly quota** | **~13.3M tokens** |
| **Effective daily (weekly/7)** | **~1.9M tokens/day** |
| Binding constraint | Weekly (not 5h) |

### For the Value Calculator

We use `tokensPerWeek = 13,280,883` for ChatGPT Plus in our formula.
Value = `tokensPerWeek × 4 × quality% / monthlyPrice`.

Pro ($100/mo) is officially 5x Plus → `tokensPerWeek = 66,500,000`.
(Currently has 2x boost ending May 31, 2026, making it effectively 10x.)

## How to Contribute Your Own Measurements

1. Clone the repo
2. Run: `bash scripts/measure-codex-quota.sh` (or `measure-claude-quota.sh`)
3. Edit the JSON in `measurements/` to add your plan name
4. Submit a PR or open an issue with the results

More measurements = more accurate data. We especially need:
- **ChatGPT Pro** ($100/mo) measurements
- **Claude Pro** ($20/mo), **Max5** ($100/mo), **Max20** ($200/mo)
- Different reasoning effort levels (low, medium, high, xhigh)
- Different models (GPT-5.3-Codex, GPT-5.4-mini, Claude Sonnet vs Opus)

## Data Files

- `measurements/*.json` — Raw measurement data (gitignored for privacy, submit via PR)
- `measurements/codex_plus_20260413.json` — First reference measurement (committed)
- `data/models.json` — The subscription data used by the calculator
