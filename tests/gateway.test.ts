import { describe, it, expect, beforeAll } from "vitest";
import { app, init } from "../src/app.js";
import { config, USDC_TESTNET_ASA_ID } from "../src/config.js";
import { defaultModelRegistry } from "../src/models/registry.js";
import {
  validateChatCompletionRequest,
  validateImageRequest,
  validateAudioRequest,
  validateVideoRequest,
} from "../src/middleware/validation.js";

beforeAll(async () => {
  await init();
}, 30000);

describe("Moltworld x402 Gateway - Free Routes & Modality Filtering", () => {
  it("GET / returns 200 OK with polished landing page HTML", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/html");

    const html = await res.text();
    expect(html).toContain("Moltworld");
    expect(html).toContain("One API for AI models and agents");
    expect(html).toContain("Algorand USDC");
    expect(html).toContain("x402");
    expect(html).toContain("/logo.png");
    expect(html).toContain("/favicon.png");
    expect(html).toContain("/favicon.ico");
  });

  it("serves static logo and favicon assets with valid cache headers", async () => {
    // /logo.png
    const logoRes = await app.fetch(new Request("http://localhost/logo.png"));
    expect(logoRes.status).toBe(200);
    expect(logoRes.headers.get("content-type")).toBe("image/png");
    expect(logoRes.headers.get("cache-control")).toContain("public");
    const logoBuf = await logoRes.arrayBuffer();
    expect(logoBuf.byteLength).toBeGreaterThan(10000);

    // /favicon.png
    const favPngRes = await app.fetch(new Request("http://localhost/favicon.png"));
    expect(favPngRes.status).toBe(200);
    expect(favPngRes.headers.get("content-type")).toBe("image/png");
    const favPngBuf = await favPngRes.arrayBuffer();
    expect(favPngBuf.byteLength).toBeGreaterThan(1000);

    // /favicon.ico
    const favIcoRes = await app.fetch(new Request("http://localhost/favicon.ico"));
    expect(favIcoRes.status).toBe(200);
    expect(favIcoRes.headers.get("content-type")).toBe("image/x-icon");
    const favIcoBuf = await favIcoRes.arrayBuffer();
    expect(favIcoBuf.byteLength).toBeGreaterThan(1000);
  });

  it("GET /health returns 200 OK with 38 enabled models and zero exposed secrets", async () => {
    const res = await app.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.status).toBe("healthy");
    expect(body.ready).toBe(true);
    expect(body.product).toBe("Moltworld");
    expect(body.public_domain).toBe(config.publicDomain);
    expect(body.network).toBe(config.isMainnet ? "mainnet" : "testnet");
    expect(body.usdc_asset_id).toBe(config.usdcAsaId);
    expect(body.pay_to).toBe(config.payToAddress);
    expect(body.tag).toBe("x402-global-challenge");
    expect(body.enabled_models).toBe(38);
    expect(body.models_by_modality.chat).toBe(22);
    expect(body.models_by_modality.image).toBe(6);
    expect(body.models_by_modality.voice).toBe(5);
    expect(body.models_by_modality.video).toBe(5);
    expect(body.uptime_seconds).toBeGreaterThanOrEqual(0);

    // Ensure no secrets leaked
    const jsonStr = JSON.stringify(body);
    expect(jsonStr).not.toContain("OPENROUTER_API_KEY");
    expect(jsonStr).not.toContain("API_KEY");
    expect(jsonStr).not.toContain("secret");
  });

  it("GET /health returns 503 degraded when facilitator is unavailable (Fail Closed)", async () => {
    const { setGatewayReady } = await import("../src/routes/api.js");
    setGatewayReady(false, "Simulated facilitator outage");

    const res = await app.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(503);
    const body = (await res.json()) as any;
    expect(body.status).toBe("degraded");
    expect(body.ready).toBe(false);

    // Restore ready state
    setGatewayReady(true);
  });

  it("GET /v1/models returns 200 OK with all 38 enabled models across Chat, Image, Voice & Video", async () => {
    const res = await app.fetch(new Request("http://localhost/v1/models"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.object).toBe("list");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(38);

    const slugs = body.data.map((m: any) => m.id);
    // Chat models
    expect(slugs).toContain("gpt");
    expect(slugs).toContain("gpt-4o");
    expect(slugs).toContain("claude");
    expect(slugs).toContain("claude-sonnet");
    expect(slugs).toContain("gemini");
    expect(slugs).toContain("gemini-lite");
    expect(slugs).toContain("gemini-pro");
    expect(slugs).toContain("deepseek");
    expect(slugs).toContain("deepseek-r1");
    expect(slugs).toContain("llama");
    expect(slugs).toContain("gpt-5.4-pro");
    expect(slugs).toContain("gpt-5.2-pro");
    expect(slugs).toContain("gpt-5-pro");
    expect(slugs).toContain("o3-pro");
    expect(slugs).toContain("claude-fable-5.1");
    expect(slugs).toContain("claude-opus-5");
    expect(slugs).toContain("claude-opus-5.5");
    expect(slugs).toContain("gpt-5.4");
    expect(slugs).toContain("gpt-5.2");
    expect(slugs).toContain("gemini-3.1-pro");
    expect(slugs).toContain("gpt-5.6-terra");
    expect(slugs).toContain("claude-sonnet-5");

    // Image models
    expect(slugs).toContain("recraft-v4.1-flash");
    expect(slugs).toContain("flux-2-pro");
    expect(slugs).toContain("qwen-image-3");
    expect(slugs).toContain("seedream-5.0");
    expect(slugs).toContain("grok-imagine-image");
    expect(slugs).toContain("recraft-v3");

    // Voice models
    expect(slugs).toContain("gpt-audio-mini");
    expect(slugs).toContain("tts-1");
    expect(slugs).toContain("tts-1-hd");
    expect(slugs).toContain("gpt-audio");
    expect(slugs).toContain("eleven-multilingual");

    // Video models
    expect(slugs).toContain("veo-3.1-fast");
    expect(slugs).toContain("kling-v3.0-std");
    expect(slugs).toContain("wan-3.0");
    expect(slugs).toContain("hailuo-3");
    expect(slugs).toContain("sora-2-pro");
  });

  it("verifies accurate model identity: Claude Sonnet 4.5 and Claude 3 Haiku", async () => {
    const res = await app.fetch(new Request("http://localhost/v1/models"));
    const body = (await res.json()) as any;

    const sonnet = body.data.find((m: any) => m.id === "claude-sonnet");
    expect(sonnet.name).toBe("Claude Sonnet 4.5");

    const haiku = body.data.find((m: any) => m.id === "claude");
    expect(haiku.name).toBe("Claude 3 Haiku");
  });

  it("guarantees >= 50% profit margin on Chat models and > 500% markup on Image, Voice & Video models", () => {
    // OpenRouter rates for chat models (in USD per 1M tokens)
    const chatRates: Record<string, { prompt: number; completion: number }> = {
      gpt: { prompt: 0.15, completion: 0.60 },
      "gpt-4o": { prompt: 2.50, completion: 10.00 },
      claude: { prompt: 0.25, completion: 1.25 },
      "claude-sonnet": { prompt: 3.00, completion: 15.00 },
      gemini: { prompt: 0.30, completion: 2.50 },
      "gemini-lite": { prompt: 0.10, completion: 0.40 },
      "gemini-pro": { prompt: 1.25, completion: 10.00 },
      deepseek: { prompt: 0.32, completion: 0.89 },
      "deepseek-r1": { prompt: 0.70, completion: 2.50 },
      llama: { prompt: 0.10, completion: 0.32 },
      "gpt-5.4-pro": { prompt: 30.00, completion: 180.00 },
      "gpt-5.2-pro": { prompt: 21.00, completion: 168.00 },
      "gpt-5-pro": { prompt: 15.00, completion: 120.00 },
      "o3-pro": { prompt: 20.00, completion: 80.00 },
      "claude-fable-5.1": { prompt: 10.00, completion: 50.00 },
      "claude-opus-5": { prompt: 5.00, completion: 25.00 },
      "claude-opus-5.5": { prompt: 4.00, completion: 20.00 },
      "gpt-5.4": { prompt: 2.50, completion: 15.00 },
      "gpt-5.2": { prompt: 1.75, completion: 14.00 },
      "gemini-3.1-pro": { prompt: 2.00, completion: 12.00 },
      "gpt-5.6-terra": { prompt: 2.00, completion: 12.00 },
      "claude-sonnet-5": { prompt: 2.00, completion: 10.00 },
    };

    // Worst-case upstream generation costs for multimodal models
    const multimodalCosts: Record<string, number> = {
      // Image: cost per image generation
      "recraft-v4.1-flash": 0.007,
      "flux-2-pro": 0.030,
      "qwen-image-3": 0.030,
      "seedream-5.0": 0.035,
      "grok-imagine-image": 0.040,
      "recraft-v3": 0.040,
      // Voice: cost per audio speech generation
      "gpt-audio-mini": 0.002,
      "tts-1": 0.015,
      "tts-1-hd": 0.030,
      "gpt-audio": 0.033,
      "eleven-multilingual": 0.030,
      // Video: cost per 5s video generation
      "veo-3.1-fast": 0.40,
      "kling-v3.0-std": 0.42,
      "wan-3.0": 0.50,
      "hailuo-3": 0.65,
      "sora-2-pro": 1.50,
    };

    const models = defaultModelRegistry.getEnabledModels();
    expect(models.length).toBe(38);

    for (const model of models) {
      const priceUsd = parseFloat(model.price.replace("$", ""));

      if (model.modality === "chat") {
        const rate = chatRates[model.slug];
        expect(rate).toBeDefined();

        const maxIn = model.limits.maxInputTokens || 4096;
        const maxOut = model.limits.maxOutputTokens || 1024;
        const maxUpstreamCost = (maxIn * rate.prompt) / 1e6 + (maxOut * rate.completion) / 1e6;
        const grossMargin = (priceUsd - maxUpstreamCost) / priceUsd;

        // Chat models: gross margin >= 50%
        expect(grossMargin).toBeGreaterThanOrEqual(0.50);
        expect(priceUsd).toBeGreaterThanOrEqual(maxUpstreamCost * 1.5);
      } else {
        // Multimodal models: strictly >= 500% markup (Price >= 6.0 * Cost)
        const cost = multimodalCosts[model.slug];
        expect(cost).toBeDefined();

        const markup = (priceUsd - cost) / cost;
        expect(markup).toBeGreaterThanOrEqual(5.0);
        expect(priceUsd).toBeGreaterThanOrEqual(cost * 6.0);
      }
    }
  });
});

describe("Moltworld x402 Gateway - Payment Gating (HTTP 402) & Fail-Closed Protection", () => {
  it("POST /v1/models/gpt/chat/completions returns 402 with exact USDC price and Bazaar extension", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/gpt/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Explain Algorand x402" }],
        }),
      })
    );

    expect(res.status).toBe(402);
    const payReqHeader = res.headers.get("payment-required");
    expect(payReqHeader).toBeTruthy();

    const decoded = JSON.parse(Buffer.from(payReqHeader!, "base64").toString("utf8"));
    expect(decoded.x402Version).toBe(2);
    expect(decoded.error).toBe("Payment required");
    expect(decoded.resource.url).toContain("/v1/models/gpt/chat/completions");
    expect(decoded.accepts[0].amount).toBe("30000"); // $0.03
    expect(decoded.accepts[0].payTo).toBe(config.payToAddress);
    expect(decoded.accepts[0].extra.tag).toBe("x402-global-challenge");
    expect(decoded.extensions.bazaar).toBeDefined();
    expect(decoded.extensions.bazaar.info.input.method).toBe("POST");
    expect(decoded.extensions.bazaar.info.output.type).toBe("json");
  });

  it("POST /v1/models/claude-sonnet/chat/completions returns 402 with $0.06 pricing", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/claude-sonnet/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Write a smart contract" }],
        }),
      })
    );

    expect(res.status).toBe(402);
    const payReqHeader = res.headers.get("payment-required");
    const decoded = JSON.parse(Buffer.from(payReqHeader!, "base64").toString("utf8"));
    expect(decoded.accepts[0].amount).toBe("60000"); // $0.06
  });

  it("POST /v1/models/flux-2-pro/images/generations returns 402 with $0.20 pricing (200,000 base units)", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/flux-2-pro/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Futuristic city with Algorand towers, neon lighting, 8k",
        }),
      })
    );

    expect(res.status).toBe(402);
    const payReqHeader = res.headers.get("payment-required");
    expect(payReqHeader).toBeTruthy();
    const decoded = JSON.parse(Buffer.from(payReqHeader!, "base64").toString("utf8"));
    expect(decoded.accepts[0].amount).toBe("200000"); // $0.20
    expect(decoded.accepts[0].payTo).toBe(config.payToAddress);
  });

  it("POST /v1/models/gpt-audio-mini/audio/speech returns 402 with $0.02 pricing (20,000 base units)", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/gpt-audio-mini/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: "Payment received. Commencing audio synthesis.",
          voice: "alloy",
        }),
      })
    );

    expect(res.status).toBe(402);
    const payReqHeader = res.headers.get("payment-required");
    expect(payReqHeader).toBeTruthy();
    const decoded = JSON.parse(Buffer.from(payReqHeader!, "base64").toString("utf8"));
    expect(decoded.accepts[0].amount).toBe("20000"); // $0.02
  });

  it("POST /v1/models/sora-2-pro/videos/generations returns 402 with $10.00 pricing (10,000,000 base units)", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/sora-2-pro/videos/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Cinematic drone shot flying over turquoise ocean waves into sunset",
          duration: 5,
        }),
      })
    );

    expect(res.status).toBe(402);
    const payReqHeader = res.headers.get("payment-required");
    expect(payReqHeader).toBeTruthy();
    const decoded = JSON.parse(Buffer.from(payReqHeader!, "base64").toString("utf8"));
    expect(decoded.accepts[0].amount).toBe("10000000"); // $10.00
  });

  it("disabled/unsupported endpoints return 404 and NEVER accept payment (Protection Against Unfulfilled Requests)", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/unknown-model/videos/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Drone shot" }),
      })
    );

    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("model_not_found");
  });

  it("attaches Cloudflare anti-caching headers and x-request-id on all /v1/* routes", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/gpt/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Hello" }] }),
      })
    );

    const cacheControl = res.headers.get("cache-control");
    expect(cacheControl).toContain("no-store");
    expect(cacheControl).toContain("no-cache");
    expect(cacheControl).toContain("must-revalidate");

    const exposeHeaders = res.headers.get("access-control-expose-headers");
    expect(exposeHeaders).toContain("Payment-Required");
    expect(exposeHeaders).toContain("Payment-Response");

    const requestId = res.headers.get("x-request-id");
    expect(requestId).toBeTruthy();
  });
});

describe("Moltworld x402 Gateway - Input Validation for All Modalities", () => {
  const chatModel = defaultModelRegistry.getModel("gpt")!;
  const imageModel = defaultModelRegistry.getModel("flux-2-pro")!;
  const voiceModel = defaultModelRegistry.getModel("tts-1")!;
  const videoModel = defaultModelRegistry.getModel("kling-v3.0-std")!;

  const makeContext = (body: any, contentLength?: string) =>
    ({
      req: {
        header: (name: string) =>
          name.toLowerCase() === "content-length" ? contentLength : undefined,
        json: async () => body,
      },
    } as any);

  // Chat validation
  it("validates chat completion requests", async () => {
    const emptyRes = await validateChatCompletionRequest(makeContext({ messages: [] }), chatModel);
    expect(emptyRes.valid).toBe(false);

    const invalidRole = await validateChatCompletionRequest(
      makeContext({ messages: [{ role: "hacker", content: "hello" }] }),
      chatModel
    );
    expect(invalidRole.valid).toBe(false);

    const valid = await validateChatCompletionRequest(
      makeContext({ messages: [{ role: "user", content: "hello" }] }),
      chatModel
    );
    expect(valid.valid).toBe(true);
  });

  // Image validation
  it("validates image generation requests", async () => {
    const missingPrompt = await validateImageRequest(makeContext({}), imageModel);
    expect(missingPrompt.valid).toBe(false);
    if (!missingPrompt.valid) {
      expect(missingPrompt.error).toContain("prompt");
    }

    const invalidSize = await validateImageRequest(
      makeContext({ prompt: "A robot", size: "300x300" }),
      imageModel
    );
    expect(invalidSize.valid).toBe(false);
    if (!invalidSize.valid) {
      expect(invalidSize.error).toContain("Allowed sizes");
    }

    const valid = await validateImageRequest(
      makeContext({ prompt: "A robot coding", size: "1024x1024", n: 1 }),
      imageModel
    );
    expect(valid.valid).toBe(true);
  });

  // Voice validation
  it("validates voice synthesis requests", async () => {
    const missingInput = await validateAudioRequest(makeContext({}), voiceModel);
    expect(missingInput.valid).toBe(false);
    if (!missingInput.valid) {
      expect(missingInput.error).toContain("input");
    }

    const invalidSpeed = await validateAudioRequest(
      makeContext({ input: "Hello", speed: 5.0 }),
      voiceModel
    );
    expect(invalidSpeed.valid).toBe(false);
    if (!invalidSpeed.valid) {
      expect(invalidSpeed.error).toContain("speed");
    }

    const valid = await validateAudioRequest(
      makeContext({ input: "Hello Algorand", voice: "alloy", speed: 1.0 }),
      voiceModel
    );
    expect(valid.valid).toBe(true);
  });

  // Video validation
  it("validates video generation requests", async () => {
    const missingPrompt = await validateVideoRequest(makeContext({}), videoModel);
    expect(missingPrompt.valid).toBe(false);
    if (!missingPrompt.valid) {
      expect(missingPrompt.error).toContain("prompt");
    }

    const durationTooLong = await validateVideoRequest(
      makeContext({ prompt: "Spaceship launching", duration: 100 }),
      videoModel
    );
    expect(durationTooLong.valid).toBe(false);
    if (!durationTooLong.valid) {
      expect(durationTooLong.error).toContain("between 1 and 5 seconds");
    }

    const invalidAspect = await validateVideoRequest(
      makeContext({ prompt: "Spaceship launching", aspect_ratio: "5:3" }),
      videoModel
    );
    expect(invalidAspect.valid).toBe(false);
    if (!invalidAspect.valid) {
      expect(invalidAspect.error).toContain("aspect_ratio");
    }

    const valid = await validateVideoRequest(
      makeContext({ prompt: "Spaceship launching", duration: 5, aspect_ratio: "16:9" }),
      videoModel
    );
    expect(valid.valid).toBe(true);
  });
});

describe("Moltworld x402 Gateway - Multimodal Mock Provider Execution", () => {
  it("executes mock provider for chat completions", async () => {
    const { defaultProviderRegistry } = await import("../src/providers/index.js");
    const provider = defaultProviderRegistry.getProvider("mock");

    const response = await provider.chatComplete(
      "openai/gpt-4o-mini",
      {
        messages: [{ role: "user", content: "What is Algorand?" }],
        temperature: 0.7,
        max_tokens: 300,
      },
      "gpt"
    );

    expect(response.object).toBe("chat.completion");
    expect(response.model).toBe("gpt");
    expect(response.id).toMatch(/^chatcmpl-/);
    expect(response.choices[0].message.content).toContain("Algorand");
  });

  it("executes mock provider for image generation", async () => {
    const { defaultProviderRegistry } = await import("../src/providers/index.js");
    const provider = defaultProviderRegistry.getProvider("mock");
    expect(provider.generateImage).toBeDefined();

    const response = await provider.generateImage!(
      "flux-1-schnell",
      {
        prompt: "A cybernetic falcon flying above digital clouds",
        size: "1024x1024",
      },
      "flux-schnell"
    );

    expect(response.data).toHaveLength(1);
    expect(response.data[0].b64_json).toBeDefined();
    expect(response.data[0].revised_prompt).toContain("cybernetic falcon");
  });

  it("executes mock provider for audio speech synthesis", async () => {
    const { defaultProviderRegistry } = await import("../src/providers/index.js");
    const provider = defaultProviderRegistry.getProvider("mock");
    expect(provider.generateSpeech).toBeDefined();

    const response = await provider.generateSpeech!(
      "tts-1",
      {
        input: "Welcome to Moltworld",
        voice: "alloy",
        response_format: "mp3",
      },
      "tts-1"
    );

    expect(response.audio_b64).toBeDefined();
    expect(response.format).toBe("mp3");
    expect(response.duration_seconds).toBeGreaterThan(0);
  });

  it("executes mock provider for video generation", async () => {
    const { defaultProviderRegistry } = await import("../src/providers/index.js");
    const provider = defaultProviderRegistry.getProvider("mock");
    expect(provider.generateVideo).toBeDefined();

    const response = await provider.generateVideo!(
      "kling-v1-5",
      {
        prompt: "A drone flying over the neon skyline",
        duration: 5,
        aspect_ratio: "16:9",
      },
      "kling-v1"
    );

    expect(response.id).toMatch(/^vid-/);
    expect(response.status).toBe("completed");
    expect(response.video_url).toContain(".mp4");
  });

  it("redacts API keys and secrets on upstream provider error", async () => {
    const { OpenRouterProvider } = await import("../src/providers/openrouter.js");
    const fakeKey = "sk-or-v1-secret-test-key-123456789";
    const provider = new OpenRouterProvider(fakeKey, 2000);

    try {
      await provider.chatComplete(
        "invalid-model",
        { messages: [{ role: "user", content: "hi" }] },
        "gpt"
      );
    } catch (err: any) {
      expect(err.message).not.toContain(fakeKey);
    }
  });
});

