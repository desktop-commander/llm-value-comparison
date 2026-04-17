#!/usr/bin/env bash
# Pull latest local-LLM hardware telemetry from DC production DB.
# Outputs to data/dc-local-benchmarks.json.
#
# Requires:
#  - dc-prod-db skill at ~/.desktop-commander/skills/dc-prod-db/
#  - gcloud auth (will re-auth interactively if expired)
#
# Usage: ./scripts/pull-dc-local-data.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$REPO/data/dc-local-benchmarks.json"
QUERY="$REPO/scripts/dc-local-query.sql"
DB_SCRIPT="$HOME/.desktop-commander/skills/dc-prod-db/scripts/db-query.mjs"

if [[ ! -f "$DB_SCRIPT" ]]; then
  echo "Error: dc-prod-db skill not found at $DB_SCRIPT"
  exit 1
fi

echo "Pulling DC local-LLM hardware telemetry..."
cat "$QUERY" | node "$DB_SCRIPT" 2>/dev/null | grep -v '^ℹ' | grep -v '^SET$' | python3 -c "
import sys, json
from datetime import datetime
data = sys.stdin.read().strip()
if not data or data == 'null':
    print('No rows returned — check query / telemetry start date', file=sys.stderr)
    sys.exit(1)
rows = json.loads(data)
for r in rows:
    r['is_cloud'] = r['model'].endswith(':cloud') or '-cloud' in r['model']
out = {
    'meta': {
        'pulled_at': datetime.now().strftime('%Y-%m-%d'),
        'source': 'Desktop Commander production DB (prod-dc-client-read-replica)',
        'query_window': 'since 2026-04-08 (telemetry start)',
        'msgs_min': 1,
        'note': 'Aggregated from chat_message.metadata. Rows with is_cloud=true represent models that go through Ollama/LM Studio clients but run remotely — their TPS reflects network, not user hardware.'
    },
    'rows': rows
}
with open('$OUT', 'w') as f:
    json.dump(out, f, indent=2)
local_count = sum(1 for r in rows if not r['is_cloud'])
cloud_count = sum(1 for r in rows if r['is_cloud'])
print(f'Saved {len(rows)} rows ({local_count} local, {cloud_count} cloud) to $OUT')
"

echo ""
echo "Next: node scripts/import-dc-local-data.js  # apply to models.json/hardware.json"
