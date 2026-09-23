import { Context } from "hono";
import { config } from "../config.js";
import { defaultModelRegistry, getModelEndpoint } from "../models/registry.js";
import { defaultProviderRegistry } from "../providers/index.js";
import {
  validateChatCompletionRequest,
  validateImageRequest,
  validateAudioRequest,
  validateVideoRequest,
} from "../middleware/validation.js";
import { ModelModality } from "../providers/types.js";

const startTime = Date.now();
let isGatewayReady = false;
let gatewayInitError: string | null = null;

export function setGatewayReady(ready: boolean, error?: string): void {
  isGatewayReady = ready;
  gatewayInitError = error || null;
}

export function isReady(): boolean {
  return isGatewayReady;
}

export function handleHealth(c: Context): Response {
  if (!isGatewayReady) {
    return c.json(
      {
        status: "degraded",
        ready: false,
        version: "1.0.0",
        product: "Moltworld",
        error: gatewayInitError || "x402 Facilitator unavailable. Gateway failing closed to protect user funds.",
        timestamp: new Date().toISOString(),
      },
      503
    );
  }

  const models = defaultModelRegistry.getEnabledModels();

  return c.json({
    status: "healthy",
    ready: true,
    version: "1.0.0",
    product: "Moltworld",
    public_domain: config.publicDomain,
    network: config.isMainnet ? "mainnet" : "testnet",
    network_caip2: config.networkCaip2,
    usdc_asset_id: config.usdcAsaId,
    pay_to: config.payToAddress,
    facilitator: config.facilitatorUrl,
    bazaar_enabled: true,
    tag: "x402-global-challenge",
    modalities_supported: ["chat"],
    enabled_models: models.length,
    models_by_modality: {
      chat: models.filter((m) => m.modality === "chat").length,
      image: models.filter((m) => m.modality === "image").length,
      voice: models.filter((m) => m.modality === "voice").length,
      video: models.filter((m) => m.modality === "video").length,
    },
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
  });
}

export function handleListModels(c: Context): Response {
  const modalityFilter = c.req.query("modality") as ModelModality | undefined;
  let models = defaultModelRegistry.getEnabledModels();

  if (modalityFilter) {
    models = models.filter((m) => m.modality === modalityFilter);
  }

  return c.json({
    object: "list",
    data: models.map((m) => ({
      id: m.slug,
      name: m.displayName,
      modality: m.modality,
      price: m.price,
      endpoint: getModelEndpoint(m),
      max_tokens: m.limits.maxOutputTokens,
      max_input_tokens: m.limits.maxInputTokens,
      max_duration_seconds: m.limits.maxDurationSeconds,
      description: m.description,
      tags: m.tags || [],
    })),
  });
}

// ----------------------------------------------------
// Chat Completion Handler
// ----------------------------------------------------
export async function handleChatCompletion(c: Context): Promise<Response> {
  const modelSlug = c.req.param("model") || "";
  const model = defaultModelRegistry.getModel(modelSlug);

  if (!model || !model.enabled || model.modality !== "chat") {
    return c.json(
      {
        error: {
          message: `Model '${modelSlug}' is not found or is not a chat model. Available chat models: ${defaultModelRegistry
            .getModelsByModality("chat")
            .map((m) => m.slug)
            .join(", ")}`,
          type: "invalid_request_error",
          code: "model_not_found",
        },
      },
      404
    );
  }

  if (!isGatewayReady) {
    return c.json(
      {
        error: {
          message: "Gateway payment verification is currently unavailable. Failing closed.",
          type: "service_unavailable",
          code: "facilitator_unavailable",
        },
      },
      503
    );
  }

  if (!defaultProviderRegistry.hasProvider(model.provider)) {
    return c.json(
      {
        error: {
          message: `Provider '${model.provider}' for model '${modelSlug}' is not available or configured. Failing closed.`,
          type: "service_unavailable",
          code: "provider_unconfigured",
        },
      },
      503
    );
  }

  const validationResult = await validateChatCompletionRequest(c, model);
  if (!validationResult.valid) {
    return c.json(
      {
        error: {
          message: validationResult.error,
          type: "invalid_request_error",
          code: "validation_error",
        },
      },
      400
    );
  }

  const provider = defaultProviderRegistry.getProvider(model.provider);
  try {
    const completion = await provider.chatComplete(
      model.upstreamModelId,
      validationResult.request,
      model.slug
    );
    return c.json(completion);
  } catch (err: any) {
    return c.json(
      {
        error: {
          message: err.message || "Failed to generate completion from upstream provider.",
          type: "api_error",
          code: "provider_error",
        },
      },
      502
    );
  }
}

// ----------------------------------------------------
// Image Generation Handler
// ----------------------------------------------------
export async function handleImageGeneration(c: Context): Promise<Response> {
  const modelSlug = c.req.param("model") || "";
  const model = defaultModelRegistry.getModel(modelSlug);

  if (!model || !model.enabled || model.modality !== "image") {
    return c.json(
      {
        error: {
          message: `Model '${modelSlug}' is not found or is not an image model. Available image models: ${defaultModelRegistry
            .getModelsByModality("image")
            .map((m) => m.slug)
            .join(", ")}`,
          type: "invalid_request_error",
          code: "model_not_found",
        },
      },
      404
    );
  }

  if (!isGatewayReady) {
    return c.json(
      {
        error: {
          message: "Gateway payment verification is currently unavailable. Failing closed.",
          type: "service_unavailable",
          code: "facilitator_unavailable",
        },
      },
      503
    );
  }

  if (!defaultProviderRegistry.hasProvider(model.provider)) {
    return c.json(
      {
        error: {
          message: `Provider '${model.provider}' for model '${modelSlug}' is not available or configured. Failing closed.`,
          type: "service_unavailable",
          code: "provider_unconfigured",
        },
      },
      503
    );
  }

  const validationResult = await validateImageRequest(c, model);
  if (!validationResult.valid) {
    return c.json(
      {
        error: {
          message: validationResult.error,
          type: "invalid_request_error",
          code: "validation_error",
        },
      },
      400
    );
  }

  const provider = defaultProviderRegistry.getProvider(model.provider);
  try {
    if (!provider.generateImage) {
      throw new Error(`Provider '${provider.id}' does not implement image generation.`);
    }
    const response = await provider.generateImage(
      model.upstreamModelId,
      validationResult.request,
      model.slug
    );
    return c.json(response);
  } catch (err: any) {
    return c.json(
      {
        error: {
          message: err.message || "Failed to generate image from upstream provider.",
          type: "api_error",
          code: "provider_error",
        },
      },
      502
    );
  }
}

// ----------------------------------------------------
// Voice / Audio Speech Handler
// ----------------------------------------------------
export async function handleAudioSpeech(c: Context): Promise<Response> {
  const modelSlug = c.req.param("model") || "";
  const model = defaultModelRegistry.getModel(modelSlug);

  if (!model || !model.enabled || model.modality !== "voice") {
    return c.json(
      {
        error: {
          message: `Model '${modelSlug}' is not found or is not a voice model. Available voice models: ${defaultModelRegistry
            .getModelsByModality("voice")
            .map((m) => m.slug)
            .join(", ")}`,
          type: "invalid_request_error",
          code: "model_not_found",
        },
      },
      404
    );
  }

  if (!isGatewayReady) {
    return c.json(
      {
        error: {
          message: "Gateway payment verification is currently unavailable. Failing closed.",
          type: "service_unavailable",
          code: "facilitator_unavailable",
        },
      },
      503
    );
  }

  if (!defaultProviderRegistry.hasProvider(model.provider)) {
    return c.json(
      {
        error: {
          message: `Provider '${model.provider}' for model '${modelSlug}' is not available or configured. Failing closed.`,
          type: "service_unavailable",
          code: "provider_unconfigured",
        },
      },
      503
    );
  }

  const validationResult = await validateAudioRequest(c, model);
  if (!validationResult.valid) {
    return c.json(
      {
        error: {
          message: validationResult.error,
          type: "invalid_request_error",
          code: "validation_error",
        },
      },
      400
    );
  }

  const provider = defaultProviderRegistry.getProvider(model.provider);
  try {
    if (!provider.generateSpeech) {
      throw new Error(`Provider '${provider.id}' does not implement speech generation.`);
    }
    const response = await provider.generateSpeech(
      model.upstreamModelId,
      validationResult.request,
      model.slug
    );
    return c.json(response);
  } catch (err: any) {
    return c.json(
      {
        error: {
          message: err.message || "Failed to synthesize speech from upstream provider.",
          type: "api_error",
          code: "provider_error",
        },
      },
      502
    );
  }
}

// ----------------------------------------------------
// Video Generation Handler
// ----------------------------------------------------
export async function handleVideoGeneration(c: Context): Promise<Response> {
  const modelSlug = c.req.param("model") || "";
  const model = defaultModelRegistry.getModel(modelSlug);

  if (!model || !model.enabled || model.modality !== "video") {
    return c.json(
      {
        error: {
          message: `Model '${modelSlug}' is not found or is not a video model. Available video models: ${defaultModelRegistry
            .getModelsByModality("video")
            .map((m) => m.slug)
            .join(", ")}`,
          type: "invalid_request_error",
          code: "model_not_found",
        },
      },
      404
    );
  }

  if (!isGatewayReady) {
    return c.json(
      {
        error: {
          message: "Gateway payment verification is currently unavailable. Failing closed.",
          type: "service_unavailable",
          code: "facilitator_unavailable",
        },
      },
      503
    );
  }

  if (!defaultProviderRegistry.hasProvider(model.provider)) {
    return c.json(
      {
        error: {
          message: `Provider '${model.provider}' for model '${modelSlug}' is not available or configured. Failing closed.`,
          type: "service_unavailable",
          code: "provider_unconfigured",
        },
      },
      503
    );
  }

  const validationResult = await validateVideoRequest(c, model);
  if (!validationResult.valid) {
    return c.json(
      {
        error: {
          message: validationResult.error,
          type: "invalid_request_error",
          code: "validation_error",
        },
      },
      400
    );
  }

  const provider = defaultProviderRegistry.getProvider(model.provider);
  try {
    if (!provider.generateVideo) {
      throw new Error(`Provider '${provider.id}' does not implement video generation.`);
    }
    const response = await provider.generateVideo(
      model.upstreamModelId,
      validationResult.request,
      model.slug
    );
    return c.json(response);
  } catch (err: any) {
    return c.json(
      {
        error: {
          message: err.message || "Failed to generate video from upstream provider.",
          type: "api_error",
          code: "provider_error",
        },
      },
      502
    );
  }
}
