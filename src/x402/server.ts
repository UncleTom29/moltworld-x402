import {
  HTTPFacilitatorClient,
  x402ResourceServer,
  RouteConfig,
  RoutesConfig,
} from "@x402/core/server";
import { ExactAvmScheme } from "@x402/avm/exact/server";
import {
  bazaarResourceServerExtension,
  declareDiscoveryExtension,
} from "@x402-avm/extensions";
import {
  config,
  ALGORAND_TESTNET_FACILITATOR_CAIP2,
  ALGORAND_TESTNET_CANONICAL_CAIP2,
  ALGORAND_MAINNET_FACILITATOR_CAIP2,
  ALGORAND_MAINNET_CANONICAL_CAIP2,
} from "../config.js";
import { ModelRegistry, defaultModelRegistry, getModelEndpoint, ModelDefinition } from "../models/registry.js";

export function createX402Server(): {
  server: x402ResourceServer;
  routes: RoutesConfig;
} {
  const facilitatorClient = new HTTPFacilitatorClient({
    url: config.facilitatorUrl,
  });

  const server = new x402ResourceServer(facilitatorClient);

  // Register ExactAvmScheme across both facilitator full-hash formats and canonical 32-char CAIP-2 formats
  server.register(ALGORAND_TESTNET_FACILITATOR_CAIP2, new ExactAvmScheme());
  server.register(ALGORAND_TESTNET_CANONICAL_CAIP2, new ExactAvmScheme());
  server.register(ALGORAND_MAINNET_FACILITATOR_CAIP2, new ExactAvmScheme());
  server.register(ALGORAND_MAINNET_CANONICAL_CAIP2, new ExactAvmScheme());

  // Register Bazaar resource-server discovery extension
  server.registerExtension(bazaarResourceServerExtension);

  const routes = buildX402Routes(defaultModelRegistry);

  return { server, routes };
}

function buildDiscoveryExtensionForModel(model: ModelDefinition) {
  switch (model.modality) {
    case "chat":
      return declareDiscoveryExtension({
        input: {
          messages: [{ role: "user", content: "Explain Algorand in simple terms." }],
          temperature: 0.7,
          max_tokens: 500,
        },
        inputSchema: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["system", "user", "assistant"] },
                  content: { type: "string" },
                },
                required: ["role", "content"],
              },
            },
            temperature: { type: "number", minimum: 0, maximum: 2 },
            max_tokens: { type: "integer", minimum: 1, maximum: model.limits.maxOutputTokens || 2048 },
          },
          required: ["messages"],
        },
        bodyType: "json",
        output: {
          example: {
            id: `chatcmpl-${model.slug}-demo`,
            object: "chat.completion",
            created: 1727096174,
            model: model.slug,
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: "Algorand is a high-speed, secure, and decentralized pure proof-of-stake blockchain...",
                },
                finish_reason: "stop",
              },
            ],
            usage: { prompt_tokens: 15, completion_tokens: 42, total_tokens: 57 },
          },
        },
      });

    case "image":
      return declareDiscoveryExtension({
        input: {
          prompt: "Futuristic city with autonomous drones and neon lights at dusk",
          n: 1,
          size: "1024x1024",
          response_format: "url",
        },
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string", maxLength: model.limits.maxPromptChars || 4000 },
            n: { type: "integer", minimum: 1, maximum: 4 },
            size: { type: "string", enum: ["1024x1024", "1024x1792", "1792x1024", "512x512"] },
            response_format: { type: "string", enum: ["url", "b64_json"] },
          },
          required: ["prompt"],
        },
        bodyType: "json",
        output: {
          example: {
            created: 1727096174,
            data: [
              {
                url: `https://images.moltworld.xyz/generated/${model.slug}/demo-sample.webp`,
                revised_prompt: "Futuristic neon cityscape with flying delivery drones",
              },
            ],
          },
        },
      });

    case "voice":
      return declareDiscoveryExtension({
        input: {
          input: "Welcome to Moltworld, powered by Algorand x402 payments.",
          voice: "alloy",
          response_format: "mp3",
          speed: 1.0,
        },
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string", maxLength: model.limits.maxPromptChars || 4096 },
            voice: { type: "string" },
            response_format: { type: "string", enum: ["mp3", "opus", "aac", "flac", "wav"] },
            speed: { type: "number", minimum: 0.25, maximum: 4.0 },
          },
          required: ["input"],
        },
        bodyType: "json",
        output: {
          example: {
            id: `audio-${model.slug}-demo`,
            object: "audio.speech",
            created: 1727096174,
            model: model.slug,
            audio_url: `https://audio.moltworld.xyz/speech/${model.slug}/sample.mp3`,
            format: "mp3",
            duration_seconds: 3.4,
            character_count: 58,
          },
        },
      });

    case "video":
      return declareDiscoveryExtension({
        input: {
          prompt: "Cinematic drone shot soaring over crystalline ocean waves at golden hour sunset",
          duration: 5,
          aspect_ratio: "16:9",
        },
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string", maxLength: model.limits.maxPromptChars || 2500 },
            duration: { type: "integer", minimum: 1, maximum: model.limits.maxDurationSeconds || 10 },
            aspect_ratio: { type: "string", enum: ["16:9", "9:16", "1:1"] },
          },
          required: ["prompt"],
        },
        bodyType: "json",
        output: {
          example: {
            id: `video-${model.slug}-demo`,
            object: "video.generation",
            created: 1727096174,
            model: model.slug,
            status: "completed",
            video_url: `https://video.moltworld.xyz/generated/${model.slug}/sample.mp4`,
            duration_seconds: 5,
            aspect_ratio: "16:9",
          },
        },
      });
  }
}

export function buildX402Routes(registry: ModelRegistry): RoutesConfig {
  const routes: Record<string, RouteConfig> = {};
  const models = registry.getEnabledModels();

  for (const model of models) {
    const routeKey = `POST ${getModelEndpoint(model)}`;

    routes[routeKey] = {
      accepts: {
        scheme: "exact",
        price: model.price,
        network: config.networkCaip2,
        payTo: config.payToAddress,
        extra: {
          asset: config.usdcAsaId,
          tag: "x402-global-challenge",
        },
      },
      description: model.description,
      mimeType: "application/json",
      extensions: {
        ...buildDiscoveryExtensionForModel(model),
      },
    };
  }

  return routes;
}
