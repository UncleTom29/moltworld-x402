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
    displayName: "GPT-4o",
    modality: "chat",
    provider: process.env.GPT4O_PROVIDER || "openrouter",
    upstreamModelId: process.env.GPT4O_UPSTREAM_MODEL || "openai/gpt-4o",
    price: process.env.PRICE_GPT4O || "$0.05",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 1024,
      maxMessages: 50,
      maxPromptChars: 32000,
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
    displayName: "Claude Sonnet 4.5",
    modality: "chat",
    provider: process.env.CLAUDE_SONNET_PROVIDER || "openrouter",
    upstreamModelId: process.env.CLAUDE_SONNET_UPSTREAM_MODEL || "anthropic/claude-sonnet-4.5",
    price: process.env.PRICE_CLAUDE_SONNET || "$0.06",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 1024,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Claude Sonnet 4.5 hybrid reasoning & coding intelligence through Moltworld.",
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
      maxInputTokens: 4096,
      maxOutputTokens: 1024,
      maxMessages: 50,
      maxPromptChars: 32000,
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
      maxInputTokens: 4096,
      maxOutputTokens: 2048,
      maxMessages: 50,
      maxPromptChars: 32000,
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
  {
    slug: "gpt-5.4-pro",
    displayName: "GPT-5.4 Pro",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "openai/gpt-5.4-pro",
    price: process.env.PRICE_GPT_5_4_PRO || "$6.00",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "GPT-5.4 Pro frontier reasoning & maximum depth intelligence through Moltworld.",
    tags: ["chat", "gpt", "openai", "pro", "frontier", "x402-global-challenge"],
  },
  {
    slug: "gpt-5.2-pro",
    displayName: "GPT-5.2 Pro",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "openai/gpt-5.2-pro",
    price: process.env.PRICE_GPT_5_2_PRO || "$5.00",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "GPT-5.2 Pro elite multi-step reasoning and deep knowledge synthesis through Moltworld.",
    tags: ["chat", "gpt", "openai", "pro", "x402-global-challenge"],
  },
  {
    slug: "gpt-5-pro",
    displayName: "GPT-5 Pro",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "openai/gpt-5-pro",
    price: process.env.PRICE_GPT_5_PRO || "$3.50",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "GPT-5 Pro next-generation reasoning and technical problem solving through Moltworld.",
    tags: ["chat", "gpt", "openai", "pro", "x402-global-challenge"],
  },
  {
    slug: "o3-pro",
    displayName: "o3 Pro",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "openai/o3-pro",
    price: process.env.PRICE_O3_PRO || "$2.50",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "o3 Pro rigorous chain-of-thought mathematical and algorithmic reasoning through Moltworld.",
    tags: ["chat", "o3", "openai", "reasoning", "x402-global-challenge"],
  },
  {
    slug: "claude-fable-5.1",
    displayName: "Claude Fable 5.1",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "anthropic/claude-fable-5.1",
    price: process.env.PRICE_CLAUDE_FABLE_5_1 || "$1.50",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Claude Fable 5.1 high-end creative, narrative, and synthesis intelligence through Moltworld.",
    tags: ["chat", "claude", "anthropic", "fable", "x402-global-challenge"],
  },
  {
    slug: "claude-opus-5",
    displayName: "Claude Opus 5",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "anthropic/claude-opus-5",
    price: process.env.PRICE_CLAUDE_OPUS_5 || "$0.75",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Claude Opus 5 deep context analysis, literature synthesis, and complex reasoning through Moltworld.",
    tags: ["chat", "claude", "anthropic", "opus", "x402-global-challenge"],
  },
  {
    slug: "claude-opus-5.5",
    displayName: "Claude Opus 5.5",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "anthropic/claude-opus-5.5",
    price: process.env.PRICE_CLAUDE_OPUS_5_5 || "$0.60",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Claude Opus 5.5 enhanced analytical capabilities and code comprehension through Moltworld.",
    tags: ["chat", "claude", "anthropic", "opus", "x402-global-challenge"],
  },
  {
    slug: "gpt-5.4",
    displayName: "GPT-5.4",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "openai/gpt-5.4",
    price: process.env.PRICE_GPT_5_4 || "$0.45",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "GPT-5.4 versatile multi-domain intelligence and production reasoning through Moltworld.",
    tags: ["chat", "gpt", "openai", "x402-global-challenge"],
  },
  {
    slug: "gpt-5.2",
    displayName: "GPT-5.2",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "openai/gpt-5.2",
    price: process.env.PRICE_GPT_5_2 || "$0.40",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "GPT-5.2 balanced reasoning and fast instruction execution through Moltworld.",
    tags: ["chat", "gpt", "openai", "x402-global-challenge"],
  },
  {
    slug: "gemini-3.1-pro",
    displayName: "Gemini 3.1 Pro",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "google/gemini-3.1-pro-preview",
    price: process.env.PRICE_GEMINI_3_1_PRO || "$0.35",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Gemini 3.1 Pro preview next-generation multimodal logic and code synthesis through Moltworld.",
    tags: ["chat", "gemini", "google", "pro", "x402-global-challenge"],
  },
  {
    slug: "gpt-5.6-terra",
    displayName: "GPT-5.6 Terra",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "openai/gpt-5.6-terra",
    price: process.env.PRICE_GPT_5_6_TERRA || "$0.35",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "GPT-5.6 Terra high-throughput terrestrial intelligence engine through Moltworld.",
    tags: ["chat", "gpt", "openai", "terra", "x402-global-challenge"],
  },
  {
    slug: "claude-sonnet-5",
    displayName: "Claude Sonnet 5",
    modality: "chat",
    provider: "openrouter",
    upstreamModelId: "anthropic/claude-sonnet-5",
    price: process.env.PRICE_CLAUDE_SONNET_5 || "$0.30",
    limits: {
      maxInputTokens: 4096,
      maxOutputTokens: 4096,
      maxMessages: 50,
      maxPromptChars: 32000,
    },
    enabled: true,
    description: "Claude Sonnet 5 agile frontier reasoning, refactoring, and code generation through Moltworld.",
    tags: ["chat", "claude", "anthropic", "sonnet", "x402-global-challenge"],
  },

  // ----------------------------------------------------
  // Image Generation Models (Over 500% Markup)
  // ----------------------------------------------------
  {
    slug: "recraft-v4.1-flash",
    displayName: "Recraft V4.1 Flash",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "recraft/recraft-v4.1-flash",
    price: process.env.PRICE_RECRAFT_FLASH || "$0.05",
    limits: {
      maxPromptChars: 3000,
    },
    enabled: true,
    description: "Recraft V4.1 Flash ultra-fast design & vector raster generation through Moltworld.",
    tags: ["image", "recraft", "fast", "vector", "x402-global-challenge"],
  },
  {
    slug: "flux-2-pro",
    displayName: "FLUX.2 Pro",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "black-forest-labs/flux.2-pro",
    price: process.env.PRICE_FLUX_PRO || "$0.20",
    limits: {
      maxPromptChars: 4000,
    },
    enabled: true,
    description: "FLUX.2 Pro frontier photorealistic and typographic image generation through Moltworld.",
    tags: ["image", "flux", "bfl", "photorealistic", "x402-global-challenge"],
  },
  {
    slug: "qwen-image-3",
    displayName: "Qwen Image 3",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "qwen/qwen-image-3",
    price: process.env.PRICE_QWEN_IMAGE || "$0.20",
    limits: {
      maxPromptChars: 3000,
    },
    enabled: true,
    description: "Qwen Image 3 advanced visual composition and prompt coherence through Moltworld.",
    tags: ["image", "qwen", "creative", "x402-global-challenge"],
  },
  {
    slug: "seedream-5.0",
    displayName: "ByteDance Seedream 5.0",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "bytedance-seed/seedream-5-0-lite",
    price: process.env.PRICE_SEEDREAM || "$0.25",
    limits: {
      maxPromptChars: 3000,
    },
    enabled: true,
    description: "ByteDance Seedream 5.0 cinematic styling and aesthetic fidelity through Moltworld.",
    tags: ["image", "bytedance", "seedream", "x402-global-challenge"],
  },
  {
    slug: "grok-imagine-image",
    displayName: "Grok Imagine Image 2.0",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "x-ai/grok-imagine-image-2.0",
    price: process.env.PRICE_GROK_IMAGE || "$0.25",
    limits: {
      maxPromptChars: 3000,
    },
    enabled: true,
    description: "xAI Grok Imagine Image 2.0 uninhibited artistic rendering through Moltworld.",
    tags: ["image", "grok", "xai", "art", "x402-global-challenge"],
  },
  {
    slug: "recraft-v3",
    displayName: "Recraft V3",
    modality: "image",
    provider: "openrouter",
    upstreamModelId: "recraft/recraft-v3",
    price: process.env.PRICE_RECRAFT || "$0.25",
    limits: {
      maxPromptChars: 3000,
    },
    enabled: true,
    description: "Recraft V3 vector and brand graphic generation through Moltworld.",
    tags: ["image", "recraft", "vector", "design", "x402-global-challenge"],
  },

  // ----------------------------------------------------
  // Voice / Audio Speech Models (Over 500% Markup)
  // ----------------------------------------------------
  {
    slug: "gpt-audio-mini",
    displayName: "GPT Audio Mini",
    modality: "voice",
    provider: "openrouter",
    upstreamModelId: "openai/gpt-audio-mini",
    price: process.env.PRICE_GPT_AUDIO_MINI || "$0.02",
    limits: {
      maxPromptChars: 1000,
    },
    enabled: true,
    description: "OpenAI GPT Audio Mini lightweight expressive voice synthesis through Moltworld.",
    tags: ["voice", "tts", "openai", "audio", "fast", "x402-global-challenge"],
  },
  {
    slug: "tts-1",
    displayName: "OpenAI TTS-1",
    modality: "voice",
    provider: "openai",
    upstreamModelId: "tts-1",
    price: process.env.PRICE_TTS1 || "$0.10",
    limits: {
      maxPromptChars: 1000,
    },
    enabled: true,
    description: "OpenAI TTS-1 text-to-speech synthesis through Moltworld.",
    tags: ["voice", "tts", "openai", "speech", "x402-global-challenge"],
  },
  {
    slug: "tts-1-hd",
    displayName: "OpenAI TTS-1 HD",
    modality: "voice",
    provider: "openai",
    upstreamModelId: "tts-1-hd",
    price: process.env.PRICE_TTS1_HD || "$0.20",
    limits: {
      maxPromptChars: 1000,
    },
    enabled: true,
    description: "OpenAI TTS-1 HD high-definition text-to-speech synthesis through Moltworld.",
    tags: ["voice", "tts", "hd", "audio", "x402-global-challenge"],
  },
  {
    slug: "gpt-audio",
    displayName: "GPT Audio",
    modality: "voice",
    provider: "openrouter",
    upstreamModelId: "openai/gpt-audio",
    price: process.env.PRICE_GPT_AUDIO || "$0.20",
    limits: {
      maxPromptChars: 1000,
    },
    enabled: true,
    description: "OpenAI GPT Audio natural conversational speech generation through Moltworld.",
    tags: ["voice", "tts", "openai", "conversational", "x402-global-challenge"],
  },
  {
    slug: "eleven-multilingual",
    displayName: "ElevenLabs Multilingual V2",
    modality: "voice",
    provider: "elevenlabs",
    upstreamModelId: "eleven_multilingual_v2",
    price: process.env.PRICE_ELEVENLABS || "$0.20",
    limits: {
      maxPromptChars: 1000,
    },
    enabled: true,
    description: "ElevenLabs Multilingual V2 lifelike voice cloning and expressive synthesis through Moltworld.",
    tags: ["voice", "elevenlabs", "multilingual", "cloning", "x402-global-challenge"],
  },

  // ----------------------------------------------------
  // Video Generation Models (Over 500% Markup)
  // ----------------------------------------------------
  {
    slug: "veo-3.1-fast",
    displayName: "Google Veo 3.1 Fast",
    modality: "video",
    provider: "openrouter",
    upstreamModelId: "google/veo-3.1-fast",
    price: process.env.PRICE_VEO_FAST || "$2.50",
    limits: {
      maxPromptChars: 2500,
      maxDurationSeconds: 5,
    },
    enabled: true,
    description: "Google Veo 3.1 Fast high-frame-rate video synthesis through Moltworld.",
    tags: ["video", "google", "veo", "cinematic", "x402-global-challenge"],
  },
  {
    slug: "kling-v3.0-std",
    displayName: "Kling Video V3.0",
    modality: "video",
    provider: "openrouter",
    upstreamModelId: "kwaivgi/kling-v3.0-std",
    price: process.env.PRICE_KLING_STD || "$2.75",
    limits: {
      maxPromptChars: 2500,
      maxDurationSeconds: 5,
    },
    enabled: true,
    description: "Kling Video V3.0 Standard dynamic camera motion video generation through Moltworld.",
    tags: ["video", "kling", "motion", "x402-global-challenge"],
  },
  {
    slug: "wan-3.0",
    displayName: "Alibaba Wan 3.0",
    modality: "video",
    provider: "openrouter",
    upstreamModelId: "alibaba/wan-3.0",
    price: process.env.PRICE_WAN || "$3.00",
    limits: {
      maxPromptChars: 2500,
      maxDurationSeconds: 5,
    },
    enabled: true,
    description: "Alibaba Wan 3.0 ultra-realistic physics-accurate video generation through Moltworld.",
    tags: ["video", "alibaba", "wan", "physics", "x402-global-challenge"],
  },
  {
    slug: "hailuo-3",
    displayName: "MiniMax Hailuo H3",
    modality: "video",
    provider: "openrouter",
    upstreamModelId: "minimax/hailuo-3",
    price: process.env.PRICE_HAILUO || "$4.00",
    limits: {
      maxPromptChars: 2000,
      maxDurationSeconds: 5,
    },
    enabled: true,
    description: "MiniMax Hailuo H3 expressive character and action video synthesis through Moltworld.",
    tags: ["video", "minimax", "hailuo", "action", "x402-global-challenge"],
  },
  {
    slug: "sora-2-pro",
    displayName: "OpenAI Sora 2 Pro",
    modality: "video",
    provider: "openrouter",
    upstreamModelId: "openai/sora-2-pro",
    price: process.env.PRICE_SORA_PRO || "$10.00",
    limits: {
      maxPromptChars: 2500,
      maxDurationSeconds: 5,
    },
    enabled: true,
    description: "OpenAI Sora 2 Pro state-of-the-art cinematic video intelligence through Moltworld.",
    tags: ["video", "openai", "sora", "pro", "cinematic", "x402-global-challenge"],
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
