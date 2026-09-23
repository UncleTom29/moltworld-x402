# Moltworld: Multimodal x402 AI Gateway on Algorand

**One unified API for AI models and autonomous agents.**  
Pay per request in USDC on Algorand. Zero subscriptions, zero prepaid credits.

- **Public Domain**: [https://moltworld.xyz](https://moltworld.xyz)
- **Modalities Supported**: Chat Completions, Image Generation, Voice/Speech Synthesis, Video Generation
- **Models Available**: 19 models across OpenAI, Anthropic, Google, DeepSeek, Meta, Black Forest Labs, Recraft, ElevenLabs, Kling, Luma, and MiniMax
- **Payment Scheme**: Algorand x402 exact micropayments via GoPlausible facilitator
- **Challenge Tag**: `x402-global-challenge`

---

## 1. What Moltworld Is

Moltworld is an OpenRouter-style multimodal AI gateway powered by HTTP 402 (`x402`) micropayments on the Algorand blockchain. Clients and autonomous agents select a model across **Chat**, **Image**, **Voice**, or **Video**, submit an OpenAI-compatible request payload, pay a fixed per-request USDC fee via the GoPlausible facilitator, and immediately receive the generated output.

Every paid endpoint is:
1. **Protected by x402**: Requests without valid payment return `402 Payment Required` with Base64 payment requirements.
2. **Cataloged in GoPlausible Bazaar**: Discovered automatically by agents via Bazaar discovery extensions.
3. **Attributed to the Global x402 Challenge**: Tagged with `x402-global-challenge` on every route.
4. **Settled under a unified address**: Volume aggregates under one merchant account under `moltworld.xyz`.

---

## 2. Architecture

Moltworld operates as a **Composite Entry** under the single root domain `moltworld.xyz`:

```
                           Client / Autonomous Agent
                                       │
                                       ▼
                           Cloudflare (moltworld.xyz)
                                       │
                                       ▼
                          Hono Web Server & Middleware
                       (CORS, Rate Limiter, Request ID,
                         no-cache headers for /v1/*)
                                       │
                  ┌────────────────────┴────────────────────┐
                  ▼                                         ▼
             Free Routes                               Paid Routes
           GET / (Landing)               POST /v1/models/:model/chat/completions
           GET /health                   POST /v1/models/:model/images/generations
           GET /v1/models                POST /v1/models/:model/audio/speech
           GET /v1/models?modality=...   POST /v1/models/:model/videos/generations
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
                                            (OpenRouter / Direct Adapters / Mock)
                                                            │
                                                            ▼
                                                 Standard Normalized JSON
```

---

## 3. Endpoints & Model Catalog

### Modality Endpoints

| Modality | Endpoint | Example Models | Price Range |
| :--- | :--- | :--- | :--- |
| **Chat** | `POST /v1/models/:model/chat/completions` | `gpt`, `claude`, `gemini`, `deepseek` | $0.01 – $0.06 |
| **Image** | `POST /v1/models/:model/images/generations` | `flux-schnell`, `flux-dev`, `dall-e-3` | $0.02 – $0.05 |
| **Voice** | `POST /v1/models/:model/audio/speech` | `tts-1`, `tts-1-hd`, `eleven-multilingual` | $0.02 – $0.05 |
| **Video** | `POST /v1/models/:model/videos/generations` | `kling-v1`, `luma-ray`, `minimax-video` | $0.20 – $0.25 |

### Complete 19-Model Catalog

#### Chat Models (9)
- `gpt` (GPT-4o Mini) — **$0.03** (30,000 micro-USDC)
- `gpt-4o` (GPT-4o Omni) — **$0.05** (50,000 micro-USDC)
- `claude` (Claude 3.5 Haiku) — **$0.03** (30,000 micro-USDC)
- `claude-sonnet` (Claude 3.7 Sonnet) — **$0.06** (60,000 micro-USDC)
- `gemini` (Gemini 2.0 Flash) — **$0.02** (20,000 micro-USDC)
- `gemini-pro` (Gemini 2.0 Pro) — **$0.04** (40,000 micro-USDC)
- `deepseek` (DeepSeek V3) — **$0.01** (10,000 micro-USDC)
- `deepseek-r1` (DeepSeek R1) — **$0.02** (20,000 micro-USDC)
- `llama` (Llama 3.3 70B) — **$0.01** (10,000 micro-USDC)

#### Image Generation Models (4)
- `flux-schnell` (FLUX.1 Schnell) — **$0.02** (20,000 micro-USDC)
- `flux-dev` (FLUX.1 Dev) — **$0.04** (40,000 micro-USDC)
- `dall-e-3` (DALL-E 3) — **$0.05** (50,000 micro-USDC)
- `recraft-v3` (Recraft V3) — **$0.04** (40,000 micro-USDC)

#### Voice / Speech Synthesis Models (3)
- `tts-1` (OpenAI TTS-1) — **$0.02** (20,000 micro-USDC)
- `tts-1-hd` (OpenAI TTS-1 HD) — **$0.03** (30,000 micro-USDC)
- `eleven-multilingual` (ElevenLabs Multilingual V2) — **$0.05** (50,000 micro-USDC)

#### Video Generation Models (3)
- `kling-v1` (Kling AI V1.5) — **$0.25** (250,000 micro-USDC)
- `luma-ray` (Luma Ray-2) — **$0.25** (250,000 micro-USDC)
- `minimax-video` (MiniMax Video-01) — **$0.20** (200,000 micro-USDC)

---

## 4. Local Development

### Prerequisites

- Node.js >= 20.0.0
- `pnpm` (recommended) or `npm`

### Installation & Run

```bash
# Clone and enter repo
cd moltworld-x402

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Run local development server (with auto-reload)
pnpm dev

# Run automated test suite (20 tests covering all modalities)
pnpm test

# Build TypeScript
pnpm build
```

---

## 5. Deployment Options

Moltworld provides two complete deployment configurations:

### Option A: Cloudflare Workers (Edge Serverless)

Deploy directly to Cloudflare's edge network under `moltworld.xyz/*` using the configured `wrangler.jsonc` file.

1. Ensure `wrangler` is logged in:
   ```bash
   npx wrangler login
   npx wrangler whoami
   ```
2. Set production secrets in Cloudflare Workers:
   ```bash
   npx wrangler secret put AVM_ADDRESS
   npx wrangler secret put OPENROUTER_API_KEY
   ```
3. Deploy to Cloudflare:
   ```bash
   pnpm run deploy:worker
   # or: bash scripts/deploy.sh worker
   ```

### Option B: Docker (Containerized VPS / Server)

Deploy using the multi-stage Alpine `Dockerfile` and `docker-compose.yml`.

1. Ensure Docker is running.
2. Build and run container:
   ```bash
   pnpm run deploy:docker
   # or: bash scripts/deploy.sh docker
   ```
3. Inspect running service:
   ```bash
   docker ps
   curl http://localhost:3000/health
   ```

---

## 6. Environment Variables

| Variable | Description | Default | Required in Production |
| :--- | :--- | :--- | :--- |
| `ALGORAND_NETWORK` | `testnet` or `mainnet` | `testnet` | Yes |
| `AVM_ADDRESS` | Merchant Algorand address receiving USDC | Default testnet address | **Yes (on Mainnet)** |
| `FACILITATOR_URL` | GoPlausible facilitator URL | `https://facilitator.goplausible.xyz` | No |
| `PUBLIC_DOMAIN` | Production root domain | `https://moltworld.xyz` | No |
| `PORT` | Local server port | `3000` | No |
| `OPENROUTER_API_KEY` | Upstream OpenRouter API Key | — | Optional |
| `OPENAI_API_KEY` | Upstream OpenAI API Key | — | Optional |
| `ELEVENLABS_API_KEY` | Upstream ElevenLabs API Key | — | Optional |
| `MOCK_PROVIDERS` | Simulate responses for offline testing (`true`/`false`) | `false` | No |
| `AVM_CLIENT_PRIVATE_KEY`| 64-byte Base64 Ed25519 key for test client | — | No |

---

## 7. Example Unpaid Request (HTTP 402)

Send an unpaid request to any multimodal route:

```bash
# Chat request
curl -i -X POST https://moltworld.xyz/v1/models/gpt/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Explain Algorand"}]}'

# Image generation request
curl -i -X POST https://moltworld.xyz/v1/models/flux-schnell/images/generations \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Futuristic neon skyline at dusk","size":"1024x1024"}'

# Voice synthesis request
curl -i -X POST https://moltworld.xyz/v1/models/tts-1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"input":"Welcome to Moltworld","voice":"alloy"}'

# Video generation request
curl -i -X POST https://moltworld.xyz/v1/models/kling-v1/videos/generations \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Drone flying over ocean waves","duration":5}'
```

### HTTP 402 Response Headers & Body

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
Access-Control-Expose-Headers: Payment-Required, Payment-Response, x-request-id
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Payment-Required: eyJ4NDAyVmVyc2lvbiI6MiwiZXJyb3IiOiJQYXltZW50IHJlcXVpcmVkIiwicmVzb3VyY2UiOnsidXJsIjoiaHR0cHM6Ly9tb2x0d29ybGQueHl6L3YxL21vZGVscy9mbHV4LXNjaG5lbGwvaW1hZ2VzL2dlbmVyYXRpb25zIi4uLn0=

{}
```

### Decoded Payment Requirements

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "https://moltworld.xyz/v1/models/flux-schnell/images/generations",
    "description": "FLUX.1 Schnell high-speed image generation through Moltworld: generate high-fidelity images in seconds.",
    "mimeType": "application/json"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
      "amount": "20000",
      "asset": "10458941",
      "payTo": "XFYEO7VOP3KX2YHZLQBQLM6L565IQJWYZGNG36OF44GYW5FF2FQXURFR7Q",
      "maxTimeoutSeconds": 300,
      "extra": {
        "asset": "10458941",
        "tag": "x402-global-challenge"
      }
    }
  ],
  "extensions": {
    "bazaar": { ... }
  }
}
```

---

## 8. Example Paying Client (Multimodal)

Using official `@x402/fetch` and `@x402/avm`:

```typescript
import { wrapFetchWithPayment, x402Client, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactAvmScheme, toClientAvmSigner } from "@x402/avm";

// 1. Initialize client signer from Base64 64-byte Ed25519 private key
const signer = toClientAvmSigner(process.env.AVM_CLIENT_PRIVATE_KEY!);

// 2. Register Algorand exact scheme
const client = new x402Client().register("algorand:*", new ExactAvmScheme(signer));

// 3. Wrap fetch
const fetchWithPay = wrapFetchWithPayment(globalThis.fetch, client);

// 4. Send request (handles 402, signing, and settlement automatically)
const response = await fetchWithPay("https://moltworld.xyz/v1/models/flux-schnell/images/generations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Cyberpunk city with blockchain data conduits glowing in the rain",
    size: "1024x1024",
  }),
});

// 5. Inspect settlement details
const paymentResponse = response.headers.get("payment-response");
if (paymentResponse) {
  const settlement = decodePaymentResponseHeader(paymentResponse);
  console.log("Settled on Algorand! TxID:", settlement.txId);
}

// 6. Access output
const data = await response.json();
console.log("Generated Image URL:", data.data[0].url);
```

### Running the Included Test Client

The repository includes a ready-to-run multimodal client:

```bash
# Test Chat inference
pnpm test:client --modality=chat --model=gpt

# Test Image generation
pnpm test:client --modality=image --model=flux-schnell

# Test Voice synthesis
pnpm test:client --modality=voice --model=tts-1

# Test Video generation
pnpm test:client --modality=video --model=kling-v1
```

---

## 9. Bazaar & Competition Configuration

1. **Facilitator**: Built against the official GoPlausible facilitator (`https://facilitator.goplausible.xyz`).
2. **Resource Server Extension**: Registers `bazaarResourceServerExtension` from `@x402-avm/extensions`.
3. **Discovery Metadata**: Every endpoint includes declared input/output schemas and examples via `declareDiscoveryExtension`.
4. **Challenge Attribution Tag**: Every route embeds `extra: { tag: "x402-global-challenge", asset: "<USDC_ASA_ID>" }`.
5. **Unified Merchant Address**: All routes share the exact same `payTo` address to aggregate volume as a single composite product.

---

## License

MIT
