-- Local-LLM hardware telemetry query for DC production DB.
-- Source: chat_message.metadata (JSONB) — captures model, hardwareInfo, and outputTokensPerSecond.
-- Telemetry started 2026-04-08. See dc-prod-db skill docs/references/common-queries.md for field reference.

SET LOCAL statement_timeout = '15s';

SELECT json_agg(row_to_json(t)) FROM (
  SELECT
    CASE
      WHEN metadata->>'modelId' LIKE 'ollama__%' THEN 'ollama'
      WHEN metadata->>'modelId' LIKE 'lm_studio__%' THEN 'lm_studio'
    END AS source_provider,
    CASE
      WHEN metadata->>'modelId' LIKE 'ollama__%' THEN replace(metadata->>'modelId', 'ollama__', '')
      WHEN metadata->>'modelId' LIKE 'lm_studio__%' THEN replace(metadata->>'modelId', 'lm_studio__', '')
    END AS model,
    metadata->'hardwareInfo'->'gpu'->>'model' AS gpu,
    metadata->'hardwareInfo'->'cpu'->>'brand' AS cpu,
    metadata->'hardwareInfo'->>'platform' AS os,
    round((metadata->'hardwareInfo'->>'totalMemoryGB')::numeric, 1) AS ram_gb,
    count(*) AS msgs,
    round(avg((metadata->>'outputTokensPerSecond')::numeric), 1) AS avg_tps
  FROM chat_message
  WHERE role = 'assistant'
    AND (metadata->>'modelId' LIKE 'ollama%' OR metadata->>'modelId' LIKE 'lm_studio%')
    AND metadata->>'outputTokensPerSecond' IS NOT NULL
    AND (metadata->'hardwareInfo') IS NOT NULL
    AND created_at > '2026-04-08'
  GROUP BY 1,2,3,4,5,6
  HAVING count(*) >= 1
  ORDER BY model, avg_tps DESC
) t;
