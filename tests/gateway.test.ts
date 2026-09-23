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
  it("GET / returns 200 OK with polished landing page HTML and modality tabs", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/html");

    const html = await res.text();
    expect(html).toContain("Moltworld");
    expect(html).toContain("One API for AI models and agents");
    expect(html).toContain("Algorand USDC");
    expect(html).toContain("x402");
    expect(html).toContain("data-modality=\"chat\"");
    expect(html).toContain("data-modality=\"image\"");
    expect(html).toContain("data-modality=\"voice\"");
    expect(html).toContain("data-modality=\"video\"");
  });

  it("GET /health returns 200 OK with health status, 19 models, 4 modalities, and zero exposed secrets", async () => {
    const res = await app.fetch(new Request("http://localhost/health"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.status).toBe("healthy");
    expect(body.product).toBe("Moltworld");
    expect(body.public_domain).toBe(config.publicDomain);
    expect(body.network).toBe("testnet");
    expect(body.usdc_asset_id).toBe(USDC_TESTNET_ASA_ID);
    expect(body.pay_to).toBe(config.payToAddress);
    expect(body.tag).toBe("x402-global-challenge");
    expect(body.modalities_supported).toEqual(["chat", "image", "voice", "video"]);
    expect(body.enabled_models).toBe(19);
    expect(body.models_by_modality).toEqual({
      chat: 9,
      image: 4,
      voice: 3,
      video: 3,
    });
    expect(body.uptime_seconds).toBeGreaterThanOrEqual(0);

    // Ensure no secrets leaked
    const jsonStr = JSON.stringify(body);
    expect(jsonStr).not.toContain("OPENROUTER_API_KEY");
    expect(jsonStr).not.toContain("API_KEY");
    expect(jsonStr).not.toContain("secret");
  });

  it("GET /v1/models returns 200 OK with all 19 models across all 4 modalities", async () => {
    const res = await app.fetch(new Request("http://localhost/v1/models"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.object).toBe("list");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(19);

    const modalities = new Set(body.data.map((m: any) => m.modality));
    expect(modalities.has("chat")).toBe(true);
    expect(modalities.has("image")).toBe(true);
    expect(modalities.has("voice")).toBe(true);
    expect(modalities.has("video")).toBe(true);
  });

  it("GET /v1/models?modality=image filters correctly to image models", async () => {
    const res = await app.fetch(new Request("http://localhost/v1/models?modality=image"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.data.length).toBe(4);
    for (const model of body.data) {
      expect(model.modality).toBe("image");
      expect(model.endpoint).toContain("/images/generations");
    }

    const slugs = body.data.map((m: any) => m.id);
    expect(slugs).toEqual(["flux-schnell", "flux-dev", "dall-e-3", "recraft-v3"]);
  });

  it("GET /v1/models?modality=voice filters correctly to voice models", async () => {
    const res = await app.fetch(new Request("http://localhost/v1/models?modality=voice"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.data.length).toBe(3);
    for (const model of body.data) {
      expect(model.modality).toBe("voice");
      expect(model.endpoint).toContain("/audio/speech");
    }

    const slugs = body.data.map((m: any) => m.id);
    expect(slugs).toEqual(["tts-1", "tts-1-hd", "eleven-multilingual"]);
  });

  it("GET /v1/models?modality=video filters correctly to video models", async () => {
    const res = await app.fetch(new Request("http://localhost/v1/models?modality=video"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    expect(body.data.length).toBe(3);
    for (const model of body.data) {
      expect(model.modality).toBe("video");
      expect(model.endpoint).toContain("/videos/generations");
    }

    const slugs = body.data.map((m: any) => m.id);
    expect(slugs).toEqual(["kling-v1", "luma-ray", "minimax-video"]);
  });
});

describe("Moltworld x402 Gateway - Payment Gating (HTTP 402) for All Modalities", () => {
  it("POST /v1/models/gpt/chat/completions returns 402 for Chat inference", async () => {
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

  it("POST /v1/models/flux-schnell/images/generations returns 402 for Image generation", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/flux-schnell/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "A futuristic cyberpunk city powered by Algorand",
          size: "1024x1024",
        }),
      })
    );

    expect(res.status).toBe(402);
    const payReqHeader = res.headers.get("payment-required");
    expect(payReqHeader).toBeTruthy();

    const decoded = JSON.parse(Buffer.from(payReqHeader!, "base64").toString("utf8"));
    expect(decoded.x402Version).toBe(2);
    expect(decoded.resource.url).toContain("/v1/models/flux-schnell/images/generations");
    expect(decoded.accepts[0].amount).toBe("20000"); // $0.02
    expect(decoded.accepts[0].payTo).toBe(config.payToAddress);
    expect(decoded.accepts[0].extra.tag).toBe("x402-global-challenge");
    expect(decoded.extensions.bazaar).toBeDefined();
    expect(decoded.extensions.bazaar.info.input.method).toBe("POST");
    expect(decoded.extensions.bazaar.info.output.type).toBe("json");
  });

  it("POST /v1/models/tts-1/audio/speech returns 402 for Voice synthesis", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/tts-1/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: "Welcome to Moltworld, the pay-per-request AI gateway on Algorand.",
          voice: "alloy",
        }),
      })
    );

    expect(res.status).toBe(402);
    const payReqHeader = res.headers.get("payment-required");
    expect(payReqHeader).toBeTruthy();

    const decoded = JSON.parse(Buffer.from(payReqHeader!, "base64").toString("utf8"));
    expect(decoded.x402Version).toBe(2);
    expect(decoded.resource.url).toContain("/v1/models/tts-1/audio/speech");
    expect(decoded.accepts[0].amount).toBe("20000"); // $0.02
    expect(decoded.accepts[0].payTo).toBe(config.payToAddress);
    expect(decoded.accepts[0].extra.tag).toBe("x402-global-challenge");
    expect(decoded.extensions.bazaar).toBeDefined();
    expect(decoded.extensions.bazaar.info.input.method).toBe("POST");
    expect(decoded.extensions.bazaar.info.output.type).toBe("json");
  });

  it("POST /v1/models/kling-v1/videos/generations returns 402 for Video generation", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/kling-v1/videos/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Cinematic drone shot of algorithmic blockchain nodes glowing in the dark",
          duration: 5,
        }),
      })
    );

    expect(res.status).toBe(402);
    const payReqHeader = res.headers.get("payment-required");
    expect(payReqHeader).toBeTruthy();

    const decoded = JSON.parse(Buffer.from(payReqHeader!, "base64").toString("utf8"));
    expect(decoded.x402Version).toBe(2);
    expect(decoded.resource.url).toContain("/v1/models/kling-v1/videos/generations");
    expect(decoded.accepts[0].amount).toBe("250000"); // $0.25
    expect(decoded.accepts[0].payTo).toBe(config.payToAddress);
    expect(decoded.accepts[0].extra.tag).toBe("x402-global-challenge");
    expect(decoded.extensions.bazaar).toBeDefined();
    expect(decoded.extensions.bazaar.info.input.method).toBe("POST");
    expect(decoded.extensions.bazaar.info.output.type).toBe("json");
  });

  it("attaches Cloudflare anti-caching headers and x-request-id on all /v1/* routes", async () => {
    const res = await app.fetch(
      new Request("http://localhost/v1/models/flux-schnell/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Test prompt" }),
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
  const imageModel = defaultModelRegistry.getModel("flux-schnell")!;
  const voiceModel = defaultModelRegistry.getModel("tts-1")!;
  const videoModel = defaultModelRegistry.getModel("kling-v1")!;

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
      expect(durationTooLong.error).toContain("between 1 and 10 seconds");
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

