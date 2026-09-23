import {
  AIProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  AudioSpeechRequest,
  AudioSpeechResponse,
} from "./types.js";

export class DirectOpenAIProvider implements AIProvider {
  readonly id = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number = 25000
  ) {}

  async chatComplete(
    modelIdentifier: string,
    request: ChatCompletionRequest,
    modelSlug: string
  ): Promise<ChatCompletionResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelIdentifier,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI chat error: ${err.replace(this.apiKey, "[REDACTED]")}`);
    }

    const data = (await response.json()) as any;
    data.model = modelSlug;
    return data;
  }

  async generateImage(
    modelIdentifier: string,
    request: ImageGenerationRequest,
    _modelSlug: string
  ): Promise<ImageGenerationResponse> {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelIdentifier,
        prompt: request.prompt,
        n: request.n || 1,
        size: request.size || "1024x1024",
        response_format: request.response_format || "url",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI image error: ${err.replace(this.apiKey, "[REDACTED]")}`);
    }

    return (await response.json()) as ImageGenerationResponse;
  }

  async generateSpeech(
    modelIdentifier: string,
    request: AudioSpeechRequest,
    modelSlug: string
  ): Promise<AudioSpeechResponse> {
    const format = request.response_format || "mp3";
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelIdentifier,
        input: request.input,
        voice: request.voice || "alloy",
        response_format: format,
        speed: request.speed || 1.0,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI TTS error: ${err.replace(this.apiKey, "[REDACTED]")}`);
    }

    // OpenAI TTS returns audio binary. For normalized JSON response, we provide audio_url/base64
    const audioBytes = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBytes).toString("base64");
    const dataUrl = `data:audio/${format};base64,${base64Audio}`;

    return {
      id: `audio-openai-${Date.now()}`,
      object: "audio.speech",
      created: Math.floor(Date.now() / 1000),
      model: modelSlug,
      audio_url: dataUrl,
      format,
      duration_seconds: parseFloat((request.input.length / 15).toFixed(2)),
      character_count: request.input.length,
    };
  }
}
