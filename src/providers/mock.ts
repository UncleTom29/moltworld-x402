import {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  AudioSpeechRequest,
  AudioSpeechResponse,
  VideoGenerationRequest,
  VideoGenerationResponse,
} from "./types.js";

export class MockProvider implements AIProvider {
  readonly id = "mock";

  async chatComplete(
    modelIdentifier: string,
    request: ChatCompletionRequest,
    modelSlug: string
  ): Promise<ChatCompletionResponse> {
    const lastMessage = request.messages[request.messages.length - 1];
    const userPrompt = lastMessage?.content || "Hello";

    await new Promise((resolve) => setTimeout(resolve, 30));

    const simulatedResponse = `[Moltworld Verified x402 Inference - Model: ${modelSlug} (${modelIdentifier})]

In response to: "${userPrompt.slice(0, 80)}${userPrompt.length > 80 ? "..." : ""}"

Algorand is a high-performance, carbon-negative pure proof-of-stake (PPoS) blockchain that provides instant transaction finality, sub-second block times, and negligible transaction fees (~0.001 ALGO). With x402 payment facilitation, autonomous agents and web clients can seamlessly pay for individual inference requests via USDC without subscriptions or credit cards.`;

    const promptTokens = Math.max(10, Math.ceil(userPrompt.length / 4));
    const completionTokens = Math.max(20, Math.ceil(simulatedResponse.length / 4));

    return {
      id: `chatcmpl-mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelSlug,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: simulatedResponse,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };
  }

  async generateImage(
    modelIdentifier: string,
    request: ImageGenerationRequest,
    modelSlug: string
  ): Promise<ImageGenerationResponse> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const n = Math.min(request.n || 1, 4);
    const size = request.size || "1024x1024";
    const promptSlug = encodeURIComponent(request.prompt.slice(0, 30));

    const items = [];
    for (let i = 0; i < n; i++) {
      items.push({
        url: `https://images.moltworld.xyz/generated/${modelSlug}/${Date.now()}-${i}.webp`,
        b64_json: Buffer.from(`mock-image-data-${modelSlug}-${i}`).toString("base64"),
        revised_prompt: `[Moltworld Verified x402 Image - ${modelSlug} (${size})]: ${request.prompt}`,
      });
    }

    return {
      created: Math.floor(Date.now() / 1000),
      data: items,
    };
  }

  async generateSpeech(
    modelIdentifier: string,
    request: AudioSpeechRequest,
    modelSlug: string
  ): Promise<AudioSpeechResponse> {
    await new Promise((resolve) => setTimeout(resolve, 40));

    const format = request.response_format || "mp3";
    const duration = Math.max(1.5, (request.input.length / 15));

    return {
      id: `audio-mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      object: "audio.speech",
      created: Math.floor(Date.now() / 1000),
      model: modelSlug,
      audio_url: `https://audio.moltworld.xyz/speech/${modelSlug}/${Date.now()}.${format}`,
      audio_b64: Buffer.from(`mock-audio-data-${modelSlug}`).toString("base64"),
      format,
      duration_seconds: parseFloat(duration.toFixed(2)),
      character_count: request.input.length,
    };
  }

  async generateVideo(
    modelIdentifier: string,
    request: VideoGenerationRequest,
    modelSlug: string
  ): Promise<VideoGenerationResponse> {
    await new Promise((resolve) => setTimeout(resolve, 60));

    const duration = request.duration || 5;
    const aspect = request.aspect_ratio || "16:9";

    return {
      id: `vid-mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      object: "video.generation",
      created: Math.floor(Date.now() / 1000),
      model: modelSlug,
      status: "completed",
      video_url: `https://video.moltworld.xyz/generated/${modelSlug}/${Date.now()}.mp4`,
      duration_seconds: duration,
      aspect_ratio: aspect,
    };
  }
}
