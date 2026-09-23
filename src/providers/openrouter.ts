import {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "./types.js";

export class OpenRouterProvider implements AIProvider {
  readonly id = "openrouter";

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 25000
  ) {
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is required to initialize OpenRouterProvider.");
    }
  }

  async chatComplete(
    modelIdentifier: string,
    request: ChatCompletionRequest,
    modelSlug: string
  ): Promise<ChatCompletionResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://moltworld.xyz",
          "X-Title": "Moltworld x402 AI Gateway",
        },
        body: JSON.stringify({
          model: modelIdentifier,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 1024,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorDetail = `Status ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody?.error?.message) {
            errorDetail = String(errBody.error.message);
          }
        } catch {
          // ignore parsing error
        }
        errorDetail = errorDetail.replace(this.apiKey, "[REDACTED]");
        throw new Error(`Upstream model provider returned error: ${errorDetail}`);
      }

      const data = (await response.json()) as any;

      return {
        id: data.id || `chatcmpl-moltworld-${Date.now()}`,
        object: "chat.completion",
        created: data.created || Math.floor(Date.now() / 1000),
        model: modelSlug,
        choices: (data.choices || []).map((choice: any, idx: number) => ({
          index: choice.index ?? idx,
          message: {
            role: choice.message?.role || "assistant",
            content: choice.message?.content || "",
          },
          finish_reason: choice.finish_reason || "stop",
        })),
        usage: data.usage
          ? {
              prompt_tokens: data.usage.prompt_tokens || 0,
              completion_tokens: data.usage.completion_tokens || 0,
              total_tokens: data.usage.total_tokens || 0,
            }
          : undefined,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("Upstream AI model request timed out.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateImage(
    modelIdentifier: string,
    request: ImageGenerationRequest,
    modelSlug: string
  ): Promise<ImageGenerationResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://moltworld.xyz",
          "X-Title": "Moltworld x402 AI Gateway",
        },
        body: JSON.stringify({
          model: modelIdentifier,
          prompt: request.prompt,
          n: request.n || 1,
          size: request.size || "1024x1024",
          response_format: request.response_format || "b64_json",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorDetail = `Status ${response.status}`;
        try {
          const errBody = await response.json();
          if (errBody?.error?.message) {
            errorDetail = String(errBody.error.message);
          }
        } catch {
          // ignore
        }
        errorDetail = errorDetail.replace(this.apiKey, "[REDACTED]");
        throw new Error(`Upstream image provider returned error: ${errorDetail}`);
      }

      const data = (await response.json()) as any;
      return {
        created: data.created || Math.floor(Date.now() / 1000),
        data: data.data || [],
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("Upstream image generation request timed out.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
