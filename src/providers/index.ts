import { config } from "../config.js";
import { AIProvider } from "./types.js";
import { OpenRouterProvider } from "./openrouter.js";
import { MockProvider } from "./mock.js";
import { DirectOpenAIProvider } from "./direct.js";

export * from "./types.js";
export * from "./openrouter.js";
export * from "./mock.js";
export * from "./direct.js";

export class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.registerProvider(new MockProvider());

    if (config.openrouterApiKey) {
      this.registerProvider(
        new OpenRouterProvider(config.openrouterApiKey, config.upstreamTimeoutMs)
      );
    }

    if (config.openaiApiKey) {
      this.registerProvider(
        new DirectOpenAIProvider(config.openaiApiKey, config.upstreamTimeoutMs)
      );
    }
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id.toLowerCase(), provider);
  }

  getProvider(providerId: string): AIProvider {
    if (config.mockProviders) {
      return this.providers.get("mock")!;
    }

    const provider = this.providers.get(providerId.toLowerCase());
    if (provider) {
      return provider;
    }

    // Fallbacks
    if (this.providers.has("openrouter")) {
      return this.providers.get("openrouter")!;
    }

    if (this.providers.has("openai")) {
      return this.providers.get("openai")!;
    }

    // Default to mock provider
    return this.providers.get("mock")!;
  }
}

export const defaultProviderRegistry = new ProviderRegistry();
