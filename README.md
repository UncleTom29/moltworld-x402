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

All 10 active models route directly to verified OpenRouter upstream endpoints. Maximum token capacities are capped to guarantee a **minimum 50% gross margin** even if the client consumes 100% of the input and output token allowances:

| Model ID | Public Display Name | Upstream Model ID | Price (USDC) | Max In | Max Out | Worst-Case Cost | Gross Margin |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `gpt` | GPT-4o Mini | `openai/gpt-4o-mini` | **$0.03** | 4,096 | 2,048 | $0.00184 | **93.9%** |
| `gpt-4o` | GPT-4o | `openai/gpt-4o` | **$0.05** | 4,096 | 1,024 | $0.02048 | **59.0%** |
| `claude` | Claude 3 Haiku | `anthropic/claude-3-haiku` | **$0.03** | 4,096 | 2,048 | $0.00358 | **88.1%** |
| `claude-sonnet` | Claude Sonnet 4.5 | `anthropic/claude-sonnet-4.5` | **$0.06** | 4,096 | 1,024 | $0.02765 | **53.9%** |
| `gemini` | Gemini 2.5 Flash | `google/gemini-2.5-flash` | **$0.02** | 4,096 | 2,048 | $0.00635 | **68.3%** |
| `gemini-lite` | Gemini 2.5 Flash Lite | `google/gemini-2.5-flash-lite` | **$0.01** | 4,096 | 2,048 | $0.00123 | **87.7%** |
| `gemini-pro` | Gemini 2.5 Pro | `google/gemini-2.5-pro` | **$0.04** | 4,096 | 1,024 | $0.01536 | **61.6%** |
| `deepseek` | DeepSeek V3 | `deepseek/deepseek-chat` | **$0.01** | 4,096 | 2,048 | $0.00313 | **68.7%** |
| `deepseek-r1` | DeepSeek R1 | `deepseek/deepseek-r1` | **$0.02** | 4,096 | 2,048 | $0.00799 | **60.1%** |
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

## 6. Test Client & Testnet Verification Flow

Before deploying to Mainnet, verify end-to-end payment with the GoPlausible facilitator on Algorand Testnet.

### Testnet Requirements:
1. Payer account holding Testnet ALGO (for transaction fees and minimum balance).
2. Payer account opted in to Testnet USDC (`10458941`).
3. Payer account holding Testnet USDC.
4. Merchant account (`AVM_ADDRESS`) opted in to Testnet USDC.

Run the test client with cheap models to preserve credits:

```bash
# Test Gemini 2.5 Flash Lite ($0.01 USDC)
AVM_CLIENT_PRIVATE_KEY=<BASE64_KEY> pnpm test:client --model=gemini-lite
```

---

## 7. Example Unpaid Request (HTTP 402)

```bash
curl -i -X POST https://moltworld.xyz/v1/models/claude-sonnet/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Explain Algorand consensus"}]}'
```

Returns:

```http
HTTP/1.1 402 Payment Required
Payment-Required: eyJ4NDAyVmVyc2lvbiI6MiwiZXJyb3IiOiJQYXltZW50IHJlcXVpcmVkIiw...
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate

{}
```

---

## 8. CI/CD & Production Readiness

- **GitHub Actions**: Automated CI runs on every push and pull request to `main` via [`.github/workflows/ci.yml`](.github/workflows/ci.yml), compiling TypeScript and executing all test suites.
- **Fail-Closed Monitoring**: `/health` checks facilitator health and returns `503 Service Unavailable` if the facilitator is disconnected, preventing payments when verification cannot complete.

---

## License

MIT
