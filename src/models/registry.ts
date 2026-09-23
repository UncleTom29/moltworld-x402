import { ModelModality } from "../providers/types.js";

export interface ModelLimits {
  maxInputTokens?: number;
  maxOutputTokens?: number;
  maxMessages?: number;
  maxPromptChars?: number;
  maxDurationSeconds?: number;
}

export interface ModelDefinition {
  slug: string;
  displayName: string;
  modality: ModelModality;
  provider: string; // e.g. "openrouter", "openai", "anthropic", "google", "deepseek", "elevenlabs", "fal"
  upstreamModelId: string;
  price: string; // Fixed USD price formatted e.g. "$0.03"
  limits: ModelLimits;
  enabled: boolean;
  description: string;
  tags?: string[];
}

export function getModelEndpoint(model: ModelDefinition): string {
  switch (model.modality) {
    case "chat":
      return `/v1/models/${model.slug}/chat/completions`;
    case "image":
      return `/v1/models/${model.slug}/images/generations`;
    case "voice":
      return `/v1/models/${model.slug}/audio/speech`;
    case "video":
      return `/v1/models/${model.slug}/videos/generations`;
  }
}

export const INITIAL_MODELS: ModelDefinition[] = [
  // ----------------------------------------------------
  // Chat Models
  // ----------------------------------------------------
  {
    slug: "gpt",
    displayName: "GPT-4o Mini",
    modality: "chat",
    provider: process.env.GPT_PROVIDER || "openrouter",
    upstreamModelId: process.env.GPT_UPSTREAM_MODEL || "openai/gpt-4o-mini",
    price: process.env.PRICE_GPT || "$0.03",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 2048,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "GPT inference through Moltworld: send chat messages and receive a normalized AI response.",
    tags: ["chat", "gpt", "openai", "x402-global-challenge"],
  },
  {
    slug: "gpt-4o",
    displayName: "GPT-4o Omni",
    modality: "chat",
    provider: process.env.GPT4O_PROVIDER || "openrouter",
    upstreamModelId: process.env.GPT4O_UPSTREAM_MODEL || "openai/gpt-4o",
    price: process.env.PRICE_GPT4O || "$0.05",
    limits: {
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 64000,
    },
    enabled: true,
    description: "GPT-4o flagship inference through Moltworld: state-of-the-art reasoning and knowledge.",
    tags: ["chat", "gpt-4o", "openai", "flagship", "x402-global-challenge"],
  },
  {
    slug: "claude",
    displayName: "Claude 3 Haiku",
    modality: "chat",
    provider: process.env.CLAUDE_PROVIDER || "openrouter",
    upstreamModelId: process.env.CLAUDE_UPSTREAM_MODEL || "anthropic/claude-3-haiku",
    price: process.env.PRICE_CLAUDE || "$0.03",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 2048,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Claude inference through Moltworld: send chat messages and receive a normalized AI response.",
    tags: ["chat", "claude", "anthropic", "x402-global-challenge"],
  },
  {
    slug: "claude-sonnet",
    displayName: "Claude 3.7 Sonnet",
    modality: "chat",
    provider: process.env.CLAUDE_SONNET_PROVIDER || "openrouter",
    upstreamModelId: process.env.CLAUDE_SONNET_UPSTREAM_MODEL || "anthropic/claude-sonnet-4.5",
    price: process.env.PRICE_CLAUDE_SONNET || "$0.06",
    limits: {
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 64000,
    },
    enabled: true,
    description: "Claude 3.7 Sonnet reasoning through Moltworld: hybrid thinking and coding intelligence.",
    tags: ["chat", "claude", "anthropic", "reasoning", "x402-global-challenge"],
  },
  {
    slug: "gemini",
    displayName: "Gemini 2.5 Flash",
    modality: "chat",
    provider: process.env.GEMINI_PROVIDER || "openrouter",
    upstreamModelId: process.env.GEMINI_UPSTREAM_MODEL || "google/gemini-2.5-flash",
    price: process.env.PRICE_GEMINI || "$0.02",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 2048,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Gemini inference through Moltworld: send chat messages and receive a normalized AI response.",
    tags: ["chat", "gemini", "google", "x402-global-challenge"],
  },
  {
    slug: "gemini-lite",
    displayName: "Gemini 2.5 Flash Lite",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "google/gemini-2.5-flash-lite",
    price: process.env.PRICE_GEMINI_LITE || "$0.01",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 2048,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Gemini 2.5 Flash Lite ultra-low latency & cost-efficient inference through Moltworld.",
    tags: ["chat", "gemini", "google", "lite", "cheap", "x402-global-challenge"],
  },
  {
    slug: "gemini-pro",
    displayName: "Gemini 2.5 Pro",
    modality: "chat",
    provider: process.env.GEMINI_PRO_PROVIDER || "openrouter",
    upstreamModelId: process.env.GEMINI_PRO_UPSTREAM_MODEL || "google/gemini-2.5-pro",
    price: process.env.PRICE_GEMINI_PRO || "$0.04",
    limits: {
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 64000,
    },
    enabled: true,
    description: "Gemini 2.5 Pro frontier reasoning and complex analysis through Moltworld.",
    tags: ["chat", "gemini", "google", "pro", "x402-global-challenge"],
  },
  {
    slug: "deepseek",
    displayName: "DeepSeek V3",
    modality: "chat",
    provider: process.env.DEEPSEEK_PROVIDER || "openrouter",
    upstreamModelId: process.env.DEEPSEEK_UPSTREAM_MODEL || "deepseek/deepseek-chat",
    price: process.env.PRICE_DEEPSEEK || "$0.01",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 2048,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "DeepSeek inference through Moltworld: send chat messages and receive a normalized AI response.",
    tags: ["chat", "deepseek", "x402-global-challenge"],
  },
  {
    slug: "deepseek-r1",
    displayName: "DeepSeek R1",
    modality: "chat",
    provider: process.env.DEEPSEEK_R1_PROVIDER || "openrouter",
    upstreamModelId: process.env.DEEPSEEK_R1_UPSTREAM_MODEL || "deepseek/deepseek-r1",
    price: process.env.PRICE_DEEPSEEK_R1 || "$0.02",
    limits: {
      maxInputTokens: 8192,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 64000,
    },
    enabled: true,
    description: "DeepSeek R1 reasoning through Moltworld: transparent chain-of-thought verification.",
    tags: ["chat", "deepseek", "reasoning", "r1", "x402-global-challenge"],
  },
  {
    slug: "llama",
    displayName: "Llama 3.3 70B",
    modality: "chat",
    provider: process.env.LLAMA_PROVIDER || "openrouter",
    upstreamModelId: process.env.LLAMA_UPSTREAM_MODEL || "meta-llama/llama-3.3-70b-instruct",
    price: process.env.PRICE_LLAMA || "$0.01",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 2048,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Llama 3.3 70B open-weights flagship inference through Moltworld.",
    tags: ["chat", "llama", "meta", "open-source", "x402-global-challenge"],
  },

  // ----------------------------------------------------
  // Image Generation Models
  // ----------------------------------------------------
  {
    slug: "flux-schnell",
    displayName: "FLUX.1 Schnell",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "black-forest-labs/flux-1-schnell",
    price: process.env.PRICE_FLUX_SCHNELL || "$0.02",
    limits: {
      maxPromptChars: 2000,
    },
    enabled: true,
    description: "FLUX.1 Schnell high-speed image generation through Moltworld: generate high-fidelity images in seconds.",
    tags: ["image", "flux", "bfl", "fast", "x402-global-challenge"],
  },
  {
    slug: "flux-dev",
    displayName: "FLUX.1 Dev",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "black-forest-labs/flux-1-dev",
    price: process.env.PRICE_FLUX_DEV || "$0.04",
    limits: {
      maxPromptChars: 4000,
    },
    enabled: true,
    description: "FLUX.1 Dev photorealistic image generation through Moltworld: exceptional typography and visual quality.",
    tags: ["image", "flux", "photorealistic", "x402-global-challenge"],
  },
  {
    slug: "dall-e-3",
    displayName: "DALL-E 3",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "openai/gpt-5-image-mini",
    price: process.env.PRICE_DALLE3 || "$0.05",
    limits: {
      maxPromptChars: 4000,
    },
    enabled: true,
    description: "DALL-E 3 creative image generation through Moltworld: highly detailed prompt adherence.",
    tags: ["image", "dalle", "openai", "creative", "x402-global-challenge"],
  },
  {
    slug: "recraft-v3",
    displayName: "Recraft V3",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "recraft-ai/recraft-v3",
    price: process.env.PRICE_RECRAFT || "$0.04",
    limits: {
      maxPromptChars: 3000,
    },
    enabled: true,
    description: "Recraft V3 vector and brand graphic generation through Moltworld: generate logos, icons, and illustrations.",
    tags: ["image", "recraft", "vector", "design", "x402-global-challenge"],
  },

  // ----------------------------------------------------
  // Voice / Audio Models
  // ----------------------------------------------------
  {
    slug: "tts-1",
    displayName: "OpenAI TTS-1",
    modality: "voice",
    provider: "openai",
    upstreamModelId: "tts-1",
    price: process.env.PRICE_TTS1 || "$0.02",
    limits: {
      maxPromptChars: 4096,
    },
    enabled: true,
    description: "OpenAI TTS-1 text-to-speech synthesis through Moltworld: natural speech generation with low latency.",
    tags: ["voice", "tts", "openai", "speech", "x402-global-challenge"],
  },
  {
    slug: "tts-1-hd",
    displayName: "OpenAI TTS-1 HD",
    modality: "voice",
    provider: "openai",
    upstreamModelId: "tts-1-hd",
    price: process.env.PRICE_TTS1_HD || "$0.03",
    limits: {
      maxPromptChars: 4096,
    },
    enabled: true,
    description: "OpenAI TTS-1 HD high-definition text-to-speech synthesis through Moltworld: studio quality audio.",
    tags: ["voice", "tts", "hd", "audio", "x402-global-challenge"],
  },
  {
    slug: "eleven-multilingual",
    displayName: "ElevenLabs Multilingual V2",
    modality: "voice",
    provider: "elevenlabs",
    upstreamModelId: "eleven_multilingual_v2",
    price: process.env.PRICE_ELEVENLABS || "$0.05",
    limits: {
      maxPromptChars: 5000,
    },
    enabled: true,
    description: "ElevenLabs Multilingual V2 lifelike voice cloning and expressive synthesis through Moltworld in 29+ languages.",
    tags: ["voice", "elevenlabs", "multilingual", "cloning", "x402-global-challenge"],
  },

  // ----------------------------------------------------
  // Video Generation Models
  // ----------------------------------------------------
  {
    slug: "kling-v1",
    displayName: "Kling AI V1.5",
    modality: "video",
    provider: "kling",
    upstreamModelId: "kling-v1-5",
    price: process.env.PRICE_KLING || "$0.25",
    limits: {
      maxPromptChars: 2500,
      maxDurationSeconds: 10,
    },
    enabled: true,
    description: "Kling AI V1.5 high-motion text-to-video generation through Moltworld: physics-accurate cinematic videos.",
    tags: ["video", "kling", "cinematic", "x402-global-challenge"],
  },
  {
    slug: "luma-ray",
    displayName: "Luma Dream Machine Ray-2",
    modality: "video",
    provider: "luma",
    upstreamModelId: "ray-2",
    price: process.env.PRICE_LUMA || "$0.25",
    limits: {
      maxPromptChars: 2500,
      maxDurationSeconds: 10,
    },
    enabled: true,
    description: "Luma Ray-2 Dream Machine video generation through Moltworld: dynamic camera motion and realistic lighting.",
    tags: ["video", "luma", "camera-motion", "x402-global-challenge"],
  },
  {
    slug: "minimax-video",
    displayName: "MiniMax Video-01",
    modality: "video",
    provider: "minimax",
    upstreamModelId: "video-01",
    price: process.env.PRICE_MINIMAX || "$0.20",
    limits: {
      maxPromptChars: 2000,
      maxDurationSeconds: 6,
    },
    enabled: true,
    description: "MiniMax Video-01 text-to-video generation through Moltworld: fast rendering with high character consistency.",
    tags: ["video", "minimax", "character", "x402-global-challenge"],
  },
];

export class ModelRegistry {
  private models: Map<string, ModelDefinition> = new Map();

  constructor(initialModels: ModelDefinition[] = INITIAL_MODELS) {
    for (const model of initialModels) {
      this.registerModel(model);
    }
  }

  registerModel(model: ModelDefinition): void {
    this.models.set(model.slug.toLowerCase(), model);
  }

  getModel(slug: string): ModelDefinition | undefined {
    return this.models.get(slug.toLowerCase());
  }

  getEnabledModels(): ModelDefinition[] {
    return Array.from(this.models.values()).filter((m) => m.enabled);
  }

  getModelsByModality(modality: ModelModality): ModelDefinition[] {
    return this.getEnabledModels().filter((m) => m.modality === modality);
  }

  getAllModels(): ModelDefinition[] {
    return Array.from(this.models.values());
  }
}

export const defaultModelRegistry = new ModelRegistry();
