# DC Telemetry Data — Models Not Yet In Our Tool

These models have real DC telemetry data but aren't in  yet. To include them in the value ranking, add them with quality benchmarks (Arena ELO, AA Intelligence Index, MMLU).

## New target model IDs (referenced by MODEL_MAP but not in models.json)

### `command-r-35b`

DB variants: command-r:35b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Intel(R) UHD Graphics 615 | Core™ m3-8100Y | win32 | 15.9 | 3 | 4.4 |

### `deepseek-r1-distill-8b`

DB variants: deepseek-r1:8b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| NVIDIA RTX A3000 Laptop GPU | Gen Intel® Core™ i7-11850H | win32 | 15.2 | 7 | 17.0 |

### `gemma-3-1b`

DB variants: gemma3:1b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Intel(R) Iris(R) Xe Graphics | Gen Intel® Core™ i7-1355U | win32 | 15.7 | 35 | 4.1 |
| Apple M4 | M4 | darwin | 24.0 | 1 | 1.0 |

### `gpt-oss-20b`

DB variants: gpt-oss:20b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| NVIDIA GeForce RTX 3060 | Ryzen 9 5900X 12-Core Processor | win32 | 31.9 | 4 | 20.6 |

### `hermes-3-8b`

DB variants: hermes3-64k:latest

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| NVIDIA GeForce RTX 4060 | Core™ i7-14700F | win32 | 31.8 | 1 | 0.4 |

### `lfm2-24b-a2b`

DB variants: liquid/lfm2-24b-a2b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| NVIDIA GeForce RTX 4090 | Gen Intel® Core™ i9-13900KS | win32 | 63.7 | 2 | 42.8 |

### `llama-3.2-3b`

DB variants: llama3.2:3b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Intel(R) UHD Graphics 615 | Core™ m3-8100Y | win32 | 15.9 | 3 | 31.1 |
| Apple M1 Pro | M1 Pro | darwin | 16.0 | 2 | 6.7 |

### `qwen-2.5-14b`

DB variants: qwen2.5:14b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| NVIDIA GeForce RTX 4060 Laptop GPU | Gen Intel® Core™ i7-13650HX | win32 | 15.7 | 4 | 3.9 |

### `qwen-2.5-3b`

DB variants: qwen2.5:3b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Apple M4 | M4 | darwin | 24.0 | 2 | 4.1 |

### `qwen-2.5-7b`

DB variants: qwen2.5:7b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Apple M1 | M1 | darwin | 8.0 | 2 | 3.8 |

### `qwen-2.5-coder-14b`

DB variants: dagbs/qwen2.5-coder-14b-instruct-abliterated:q4_k_m, qwen2.5-coder:14b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Apple M2 Ultra | M2 Ultra | darwin | 64.0 | 5 | 2.5 |
| NVIDIA GeForce RTX 3060 | Ryzen 5 3600 6-Core Processor | win32 | 23.9 | 2 | 2.2 |

### `qwen-2.5-coder-7b`

DB variants: qwen2.5-coder:7b, qwen2.5-coder:latest

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| NVIDIA GeForce RTX 4060 | Core™ i7-14700F | win32 | 31.8 | 2 | 2.6 |
| NVIDIA GeForce RTX 3060 | Ryzen 5 3600 6-Core Processor | win32 | 23.9 | 2 | 7.9 |
| Apple M2 | M2 | darwin | 8.0 | 1 | 0.1 |

### `qwen-3-1.7b`

DB variants: qwen3:1.7b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Apple M2 | M2 | darwin | 8.0 | 5 | 9.8 |

### `qwen-3-4b`

DB variants: qwen3:4b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Apple M2 | M2 | darwin | 8.0 | 1 | 16.3 |

### `qwen-3-8b`

DB variants: qwen3:8b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| NVIDIA GeForce RTX 3060 | Ryzen 5 7600X 6-Core Processor | win32 | 31.1 | 2 | 4.8 |
| NVIDIA GeForce RTX 3080 | Ryzen 7 5800X 8-Core Processor | win32 | 31.9 | 1 | 7.7 |

### `qwen-3-coder-30b`

DB variants: qwen/qwen3-coder-30b, qwen3-coder:30b, qwen3-coder-64k:latest

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Intel(R) UHD Graphics 615 | Core™ m3-8100Y | win32 | 15.9 | 16 | 19.1 |
| AMD Radeon RX 7900 XTX | Ryzen 9 3900X 12-Core Processor | win32 | 63.9 | 6 | 2.9 |
| Apple M2 Ultra | M2 Ultra | darwin | 64.0 | 2 | 1.7 |

### `qwen-3.5-2b`

DB variants: qwen3.5:2b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Apple M4 | M4 | darwin | 32.0 | 1 | 1.8 |

### `qwen-3.5-9b`

DB variants: qwen3.5-9b-claude-4.6-opus-reasoning-distilled, qwen3.5:9b-q8_0-20k, qwen3.5:9b-q8_0-60k, qwen/qwen3.5-9b, qwen3.5:9b

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| NVIDIA GeForce RTX 3060 | Ryzen 9 5900X 12-Core Processor | win32 | 31.9 | 16 | 5.1 |
| NVIDIA GeForce RTX 4090 | Gen Intel® Core™ i9-13900KS | win32 | 63.7 | 7 | 12.8 |
| NVIDIA GeForce RTX 3060 | Ryzen 9 5900X 12-Core Processor | win32 | 31.9 | 7 | 8.2 |
| NVIDIA GeForce RTX 5070 | Ryzen 7 5700X 8-Core Processor | win32 | 31.9 | 2 | 1.0 |
| NVIDIA GeForce RTX 4090 | Gen Intel® Core™ i9-13900KS | win32 | 63.7 | 1 | 0.7 |

### `qwen3.5-397b`

DB variants: qwen3.5:397b-cloud

| GPU | CPU | OS | RAM | msgs | tok/s |
|---|---|---|---|---|---|
| Intel(R) UHD Graphics | Core™ i5-1035G1 | win32 | 15.8 | 4 | 13.8 |
| NVIDIA GeForce RTX 4070 Laptop GPU | Gen Intel® Core™ i7-13650HX | win32 | 15.7 | 2 | 19.0 |

## DB entries with no mapping

- `codegemma:7b`
- `glm-5.1:cloud`
