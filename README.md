# Moltworld: Multimodal x402 AI Gateway on Algorand

**One unified API for AI models and autonomous agents.**  
Pay per request in USDC on Algorand. Zero subscriptions, zero prepaid credits.

- **Public Domain**: [https://moltworld.xyz](https://moltworld.xyz)
- **Deployment**: Contabo VPS (Ubuntu 22.04 LTS / Debian 12) + Cloudflare Reverse Proxy / DNS
- **Modalities**: Chat Completions (Active in production); Image, Voice & Video (Pre-architected, failing closed until direct upstream keys verified)
- **Active Models**: 10 production-ready models across OpenAI, Anthropic, Google, DeepSeek, and Meta via OpenRouter
- **Payment Scheme**: Algorand x402 exact micropayments via GoPlausible facilitator
- **Challenge Tag**: `x402-global-challenge`
- **Margin Guarantee**: Mathematical >= 50% gross margin under worst-case maximum token capacity

---

## 1. What Moltworld Is

Moltworld is an OpenRouter-style AI model gateway powered by HTTP 402 (`x402`) micropayments on the Algorand blockchain. Clients and autonomous agents select a model, submit a standard OpenAI-compatible JSON payload, pay a fixed per-request USDC fee via the GoPlausible facilitator, and immediately receive the generated output.

Every paid endpoint is:
1. **Protected by x402**: Requests without valid payment return `402 Payment Required` with Base64 payment requirements.
2. **Cataloged in GoPlausible Bazaar**: Discovered automatically by agents via Bazaar discovery extensions.
3. **Attributed to the Global x402 Challenge**: Tagged with `x402-global-challenge` on every route.
4. **Settled under a unified address**: Volume aggregates under one merchant account under `moltworld.xyz`.
5. **Guaranteed Margin**: Fixed prices are calculated against worst-case maximum token usage to strictly guarantee >= 50% profit margin over upstream provider costs.
6. **Fail-Closed Architecture**: Unsupported providers and endpoints without working upstream keys are disabled, never advertised, and never accept payment. If facilitator initialization fails, the gateway immediately fails closed (503 Service Unavailable).

---

## 2. Architecture & Production Flow

Moltworld operates as a **Composite Entry** under the single root domain `moltworld.xyz`:

```
                           Client / Autonomous Agent
                                       │
                                       ▼
                   Cloudflare Edge Proxy (DNS + WAF + SSL)
                                       │ (Full Strict HTTPS)
                                       ▼
                     Contabo VPS (Port 80/443 - UFW)
                                       │
                    Nginx Reverse Proxy (Real IP restore)
                    (CF-Connecting-IP, no-cache on /v1/*)
                                       │ (HTTP 127.0.0.1:3000)
                                       ▼
                         Moltworld Gateway Daemon
                      (Hono + Node.js 20 systemd unit)
                                       │
                  ┌────────────────────┴────────────────────┐
                  ▼                                         ▼
             Free Routes                               Paid Routes
           GET / (Landing)               POST /v1/models/:model/chat/completions
           GET /health (Fail-Closed)
           GET /v1/models (Catalog)
                                                            │
                                                            ▼
                                                x402 HTTP Resource Server
                                             - ExactAvmScheme (Testnet/Mainnet)
                                             - GoPlausible Facilitator
                                             - Bazaar Discovery Extension
                                             - Tag: "x402-global-challenge"
                                                            │
                                                    [Payment Verified]
                                                            │
                                                            ▼
                                                  AI Provider Abstraction
                                            (OpenRouter Direct / Fail-Closed)
                                                            │
                                                            ▼
                                                 Standard Normalized JSON
```

---

## 3. Active Model Catalog & Margin Guarantees

All 22 active models route directly to verified OpenRouter upstream endpoints. Maximum token capacities are capped to guarantee a **minimum 50% gross margin** (and typically >80%) even if the client consumes 100% of the input and output token allowances:

| Model ID | Public Display Name | Upstream Model ID | Price (USDC) | Max In | Max Out | Worst-Case Cost | Gross Margin |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `gpt-5.4-pro` | GPT-5.4 Pro | `openai/gpt-5.4-pro` | **$6.00** | 4,096 | 4,096 | ~$0.860 | **85.7%** |
| `gpt-5.2-pro` | GPT-5.2 Pro | `openai/gpt-5.2-pro` | **$5.00** | 4,096 | 4,096 | ~$0.774 | **84.5%** |
| `gpt-5-pro` | GPT-5 Pro | `openai/gpt-5-pro` | **$3.50** | 4,096 | 4,096 | ~$0.553 | **84.2%** |
| `o3-pro` | o3 Pro | `openai/o3-pro` | **$2.50** | 4,096 | 4,096 | ~$0.410 | **83.6%** |
| `claude-fable-5.1` | Claude Fable 5.1 | `anthropic/claude-fable-5.1` | **$1.50** | 4,096 | 4,096 | ~$0.246 | **83.6%** |
| `claude-opus-5` | Claude Opus 5 | `anthropic/claude-opus-5` | **$0.75** | 4,096 | 4,096 | ~$0.123 | **83.6%** |
| `claude-opus-5.5` | Claude Opus 5.5 | `anthropic/claude-opus-5.5` | **$0.60** | 4,096 | 4,096 | ~$0.098 | **83.6%** |
| `gpt-5.4` | GPT-5.4 | `openai/gpt-5.4` | **$0.45** | 4,096 | 4,096 | ~$0.072 | **84.1%** |
| `gpt-5.2` | GPT-5.2 | `openai/gpt-5.2` | **$0.40** | 4,096 | 4,096 | ~$0.065 | **83.9%** |
| `gemini-3.1-pro` | Gemini 3.1 Pro | `google/gemini-3.1-pro-preview` | **$0.35** | 4,096 | 4,096 | ~$0.057 | **83.6%** |
| `gpt-5.6-terra` | GPT-5.6 Terra | `openai/gpt-5.6-terra` | **$0.35** | 4,096 | 4,096 | ~$0.057 | **83.6%** |
| `claude-sonnet-5` | Claude Sonnet 5 | `anthropic/claude-sonnet-5` | **$0.30** | 4,096 | 4,096 | ~$0.049 | **83.6%** |
| `claude-sonnet` | Claude Sonnet 4.5 | `anthropic/claude-sonnet-4.5` | **$0.06** | 4,096 | 1,024 | $0.02765 | **53.9%** |
| `gpt-4o` | GPT-4o | `openai/gpt-4o` | **$0.05** | 4,096 | 1,024 | $0.02048 | **59.0%** |
| `gemini-pro` | Gemini 2.5 Pro | `google/gemini-2.5-pro` | **$0.04** | 4,096 | 1,024 | $0.01536 | **61.6%** |
| `gpt` | GPT-4o Mini | `openai/gpt-4o-mini` | **$0.03** | 4,096 | 2,048 | $0.00184 | **93.9%** |
| `claude` | Claude 3 Haiku | `anthropic/claude-3-haiku` | **$0.03** | 4,096 | 2,048 | $0.00358 | **88.1%** |
| `gemini` | Gemini 2.5 Flash | `google/gemini-2.5-flash` | **$0.02** | 4,096 | 2,048 | $0.00635 | **68.3%** |
| `deepseek-r1` | DeepSeek R1 | `deepseek/deepseek-r1` | **$0.02** | 4,096 | 2,048 | $0.00799 | **60.1%** |
| `gemini-lite` | Gemini 2.5 Flash Lite | `google/gemini-2.5-flash-lite` | **$0.01** | 4,096 | 2,048 | $0.00123 | **87.7%** |
| `deepseek` | DeepSeek V3 | `deepseek/deepseek-chat` | **$0.01** | 4,096 | 2,048 | $0.00313 | **68.7%** |
| `llama` | Llama 3.3 70B | `meta-llama/llama-3.3-70b-instruct` | **$0.01** | 4,096 | 2,048 | $0.00107 | **89.3%** |

### Fail-Closed Modalities (Image, Voice, Video)
- Unsupported providers (`elevenlabs`, `kling`, `luma`, `minimax`) are set to `enabled: false`.
- Endpoints return **HTTP 404** with zero x402 payment requirements. Clients can **never** be charged for an unfulfilled request.
- OpenRouter image generation uses the modern `POST /api/v1/images` endpoint and will be enabled once upstream image endpoints are verified.

---

## 4. Deploying to Contabo VPS (with Cloudflare DNS)

Moltworld runs natively under **Node.js 22** as a systemd service (`moltworld.service`) listening on conflict-free port **`3402`**, coexisting cleanly alongside other projects on the VPS.

### Live Server Architecture on Contabo VPS (`95.111.229.139`):
- **App Path**: `/opt/moltworld`
- **Port**: `3402` (bound to `127.0.0.1:3402`, no external exposure)
- **Nginx Config**: `/etc/nginx/sites-available/moltworld.conf` (proxies `moltworld.xyz` to `127.0.0.1:3402` with HTTP/2, SSL, and `proxy_buffering off`)
- **Systemd Daemon**: `systemctl status moltworld`
- **Continuous Deployment**: Automated on push to `main` via GitHub Actions (`.github/workflows/deploy.yml`)

### Cloudflare DNS Configuration:
1. **DNS**: Add A record for `@` and `www` pointing to `95.111.229.139` with **Proxy status: Proxied (Orange Cloud)**.
2. **SSL/TLS**: Set encryption mode to **Full** (or **Full (Strict)** with Cloudflare Origin CA certificate).

### Continuous Deployment via GitHub Actions:
Any push to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
1. Runs full test suite (`pnpm test`) and typechecks (`pnpm build`).
2. Connects to Contabo VPS via SSH using repository secret `CONTABO_SSH_KEY`.
3. Pulls latest commit to `/opt/moltworld`, installs dependencies, rebuilds, and restarts `moltworld.service`.
4. Performs automated health verification (`curl -fsS http://127.0.0.1:3402/health`).

---

## 5. Local Development & Testing

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run automated tests (19 tests covering profit margins, fail-closed guards, 402 headers)
pnpm test

# Run local development server
pnpm dev
```

---

---

## 6. Validated End-to-End Testnet Settlement Proof

Moltworld's complete machine-to-machine x402 payment and AI inference pipeline is live, verified, and settled on **Algorand Testnet** through the official **GoPlausible x402 Facilitator**:

$$\text{Client} \xrightarrow{\text{Prompt}} \text{Moltworld} \xrightarrow{\text{HTTP 402}} \text{x402 Signer} \xrightarrow{\text{Exact AVM Scheme}} \text{GoPlausible Facilitator} \xrightarrow{\text{On-Chain USDC}} \text{OpenRouter} \xrightarrow{\text{HTTP 200}} \text{Client}$$

### Confirmed On-Chain Settlements:

| Model | Modality | Price (USDC) | Algorand Testnet TxID | Status | Lora Explorer Link |
|---|---|---|---|---|---|
| **Gemini 2.5 Flash Lite** (`gemini-lite`) | Chat | $0.01 (10,000 base units) | `SNSPRUA6IDIMYB466OXDEZNUQMLJ6MGOTDFFQEU5P4C6KGTQZ2CQ` | **CONFIRMED** | [View on Lora](https://lora.algokit.io/testnet/transaction/SNSPRUA6IDIMYB466OXDEZNUQMLJ6MGOTDFFQEU5P4C6KGTQZ2CQ) |
| **DeepSeek V3** (`deepseek`) | Chat | $0.01 (10,000 base units) | `HMHLVL7FGW7UKNPQ5WV6ZPWM7NWGTMT2MVYV6SQT77O6AASTQEMQ` | **CONFIRMED** | [View on Lora](https://lora.algokit.io/testnet/transaction/HMHLVL7FGW7UKNPQ5WV6ZPWM7NWGTMT2MVYV6SQT77O6AASTQEMQ) |
| **Setup Settlement** (`gemini-lite`) | Chat | $0.01 (10,000 base units) | `REWKVF6KF6PNJTKQGC3PYJLEBQ5XX3EDLYQONP6NY3BADXX5DBCQ` | **CONFIRMED** | [View on Lora](https://lora.algokit.io/testnet/transaction/REWKVF6KF6PNJTKQGC3PYJLEBQ5XX3EDLYQONP6NY3BADXX5DBCQ) |

### Live Execution Trace (`gemini-lite`):
```text
======================================================
 Moltworld x402 Multimodal Client Demo
 Modality: [CHAT]
 Model:    gemini-lite
 Endpoint: https://moltworld.xyz/v1/models/gemini-lite/chat/completions
======================================================

[Step 1] Sending initial prompt request without payment proof...
[Step 2] Received HTTP Status: 402 (Expected: 402 Payment Required)
[Step 3] Payment Required Requirements:
- Resource:   https://moltworld.xyz/v1/models/gemini-lite/chat/completions
- Scheme:     exact
- Network:    algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=
- Amount:     10000 base units (USDC)
- Asset ID:   10458941
- PayTo:      TQWEL54TCBYH3QJLN2OU2QH7XZTHRDZMF2YQIU5B7W2HK6GS7I2TWHDMXU
- Challenge:  tag="x402-global-challenge"

[Step 4] Initialized Algorand client signer:
- Address: WEXP3TE74ID3Y752NCR2ODZYJCD4CZPU2RAWMEGP7FB4IGBHDMSVUJTR3M

[Step 5] Retrying request with x402 payment authorization...
[Step 6] Response Status: 200
[Step 6] Settlement Details:
- Settlement Success: true
- Transaction ID:    SNSPRUA6IDIMYB466OXDEZNUQMLJ6MGOTDFFQEU5P4C6KGTQZ2CQ
- Explorer URL:      https://lora.algokit.io/testnet/transaction/SNSPRUA6IDIMYB466OXDEZNUQMLJ6MGOTDFFQEU5P4C6KGTQZ2CQ
- Network:           algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=

[Step 7] Model Media Response Received:
- Model:   gemini-lite
- Content: 
Imagine you want to build a digital world where people can trade things, play games, or even vote, all without a central authority like a bank or a government. That's where Algorand comes in...

Demo completed successfully!
```

### GoPlausible Bazaar & Leaderboard Verification:

Querying GoPlausible's discovery endpoint (`https://facilitator.goplausible.xyz/discovery/resources?search=moltworld`) confirms that:
1. Every paid endpoint is automatically cataloged with full JSON schemas and examples.
2. Every request embeds the competition tag: `"tag": "x402-global-challenge"`.
3. The merchant profile is crawled and enriched automatically from `https://moltworld.xyz`:
   - Title: `"Moltworld — Multimodal AI Gateway with x402 on Algorand"`
   - Tag: `x402-global-challenge`
   - Confirmed Settlements: 4+

---

## 7. Running the Test Client

```bash
# Test with Gemini 2.5 Flash Lite ($0.01 USDC)
AVM_CLIENT_PRIVATE_KEY=<YOUR_PRIVATE_KEY> pnpm test:client --url=https://moltworld.xyz --model=gemini-lite

# Test with DeepSeek V3 ($0.01 USDC)
AVM_CLIENT_PRIVATE_KEY=<YOUR_PRIVATE_KEY> pnpm test:client --url=https://moltworld.xyz --model=deepseek

# Test with GPT-4o ($0.06 USDC)
AVM_CLIENT_PRIVATE_KEY=<YOUR_PRIVATE_KEY> pnpm test:client --url=https://moltworld.xyz --model=gpt-4o
```

---

## 8. Mainnet Deployment Checklist

When ready to switch from Testnet to Algorand Mainnet:

1. **Merchant Wallet**: Provide your intended Algorand Mainnet address holding/opted-in to Mainnet USDC (ASA `31566704`).
2. **Environment Variables**:
   * Set `ALGORAND_NETWORK=mainnet`
   * Set `AVM_ADDRESS=<YOUR_MAINNET_ADDRESS>`
3. **Deploy**:
   * **Contabo VPS**: Push to `main` (GitHub Actions automatically tests, builds, and deploys to VPS) or run `pnpm deploy:contabo`.
   * **Cloudflare Worker**: Run `pnpm deploy:worker`.
4. **Smoke Test**: Execute a single $0.01 USDC test on Mainnet using `gemini-lite`:
   ```bash
   ALGORAND_NETWORK=mainnet AVM_CLIENT_PRIVATE_KEY=<YOUR_MAINNET_KEY> pnpm test:client --url=https://moltworld.xyz --model=gemini-lite
   ```

---

## 9. CI/CD & Production Architecture

- **GitHub Actions**: Automated CI runs on every push and pull request to `main` via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), compiling TypeScript, running all 19 tests, and deploying to Contabo VPS.
- **Fail-Closed Design**: If upstream provider keys or facilitator services are unavailable, the gateway fails closed (`503 Service Unavailable`) before payment can ever be accepted.
- **Strict Margins**: Fixed model prices guarantee $\ge 50\%$ gross profit margin over OpenRouter upstream token costs.

---

## License

MIT
