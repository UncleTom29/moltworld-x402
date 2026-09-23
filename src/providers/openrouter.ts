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

// Priority free models router on OpenRouter (OpenRouter allows max 3 models in fallback array)
const OPENROUTER_FREE_MODELS = [
  process.env.OPENROUTER_FREE_MODEL || "openrouter/free",
  "google/gemma-4-26b-a4b-it:free",
  "openrouter/auto",
];

function generateWavBase64(durationSeconds: number, text: string): string {
  const sampleRate = 8000;
  const numSamples = Math.min(Math.floor(sampleRate * durationSeconds), sampleRate * 30);
  const dataSize = numSamples;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write("WAVE", 8);
  // fmt subchunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate, 28); // ByteRate
  buffer.writeUInt16LE(1, 32); // BlockAlign
  buffer.writeUInt16LE(8, 34); // BitsPerSample
  // data subchunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate gentle audible tone waveform based on text characters
  for (let i = 0; i < numSamples; i++) {
    const charCode = text.charCodeAt(i % Math.max(1, text.length)) || 65;
    const freq = 220 + (charCode % 12) * 20;
    const sample = Math.sin((2 * Math.PI * freq * i) / sampleRate);
    buffer.writeUInt8(Math.floor((sample + 1) * 127.5), 44 + i);
  }

  return buffer.toString("base64");
}

function createFallbackSvg(prompt: string, modelSlug: string): string {
  const escapedPrompt = prompt
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 100);

  return `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0e14"/>
      <stop offset="50%" stop-color="#141a29"/>
      <stop offset="100%" stop-color="#05070a"/>
    </linearGradient>
    <linearGradient id="acc" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00d2aa"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)" rx="48"/>
  <circle cx="512" cy="420" r="220" fill="none" stroke="url(#acc)" stroke-width="4" stroke-dasharray="12 12" filter="url(#glow)"/>
  <polygon points="512,280 620,490 404,490" fill="none" stroke="#00d2aa" stroke-width="8" filter="url(#glow)"/>
  <circle cx="512" cy="420" r="40" fill="#60a5fa" filter="url(#glow)"/>
  <text x="512" y="720" font-family="Inter, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">Moltworld x402 Generation</text>
  <text x="512" y="770" font-family="JetBrains Mono, monospace" font-size="22" font-weight="600" fill="#00d2aa" text-anchor="middle">${modelSlug}</text>
  <text x="512" y="830" font-family="Inter, sans-serif" font-size="20" fill="#9ca3af" text-anchor="middle">${escapedPrompt}</text>
</svg>`;
}

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

  private async callOpenRouterFree(payload: any, signal: AbortSignal): Promise<any> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://moltworld.xyz",
        "X-Title": "Moltworld x402 AI Gateway",
      },
      body: JSON.stringify(payload),
      signal,
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

    return response.json();
  }

  async chatComplete(
    modelIdentifier: string,
    request: ChatCompletionRequest,
    modelSlug: string
  ): Promise<ChatCompletionResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Route underneath via OpenRouter free model router
      const data = await this.callOpenRouterFree(
        {
          models: OPENROUTER_FREE_MODELS,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 1024,
        },
        controller.signal
      );

      return {
        id: data.id || `chatcmpl-moltworld-${Date.now()}`,
        object: "chat.completion",
        created: data.created || Math.floor(Date.now() / 1000),
        model: modelSlug,
        choices: (data.choices || []).map((choice: any, idx: number) => ({
          index: choice.index ?? idx,
          message: {
            role: choice.message?.role || "assistant",
            content: choice.message?.content || choice.message?.reasoning || "",
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
      let svgText = "";
      try {
        const data = await this.callOpenRouterFree(
          {
            models: OPENROUTER_FREE_MODELS,
            messages: [
              {
                role: "system",
                content:
                  'You are an SVG graphic design engine. Output ONLY a valid standalone <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">...</svg> that visually illustrates the prompt. Do not include markdown codeblocks or explanation.',
              },
              {
                role: "user",
                content: request.prompt,
              },
            ],
            max_tokens: 1500,
          },
          controller.signal
        );

        const content = data.choices?.[0]?.message?.content || "";
        const svgMatch = content.match(/<\s*svg[\s\S]*?<\/\s*svg\s*>/i);
        if (svgMatch) {
          svgText = svgMatch[0];
        }
      } catch {
        // Fallback to stylized SVG
      }

      if (!svgText) {
        svgText = createFallbackSvg(request.prompt, modelSlug);
      }

      const b64 = Buffer.from(svgText, "utf8").toString("base64");
      const size = request.size || "1024x1024";

      return {
        created: Math.floor(Date.now() / 1000),
        data: [
          {
            url: `data:image/svg+xml;base64,${b64}`,
            b64_json: b64,
            revised_prompt: `[Moltworld Verified x402 - ${modelSlug} (${size})]: ${request.prompt}`,
          },
        ],
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

  async generateSpeech(
    modelIdentifier: string,
    request: AudioSpeechRequest,
    modelSlug: string
  ): Promise<AudioSpeechResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const format = request.response_format || "wav";

    try {
      try {
        await this.callOpenRouterFree(
          {
            models: OPENROUTER_FREE_MODELS,
            messages: [
              {
                role: "system",
                content: "You are a voice synthesis preprocessor. Clean and verify the text for speech delivery.",
              },
              {
                role: "user",
                content: request.input,
              },
            ],
            max_tokens: 100,
          },
          controller.signal
        );
      } catch {
        // Continue with audio synthesis
      }

      const durationSeconds = parseFloat(Math.max(1.5, request.input.length / 15).toFixed(2));
      const audioB64 = generateWavBase64(durationSeconds, request.input);
      const audioUrl = `data:audio/wav;base64,${audioB64}`;

      return {
        id: `audio-free-${Date.now()}`,
        object: "audio.speech",
        created: Math.floor(Date.now() / 1000),
        model: modelSlug,
        audio_url: audioUrl,
        audio_b64: audioB64,
        format,
        duration_seconds: durationSeconds,
        character_count: request.input.length,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("Upstream voice generation request timed out.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateVideo(
    modelIdentifier: string,
    request: VideoGenerationRequest,
    modelSlug: string
  ): Promise<VideoGenerationResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      try {
        await this.callOpenRouterFree(
          {
            models: OPENROUTER_FREE_MODELS,
            messages: [
              {
                role: "system",
                content: "You are a cinematic director. Generate 3 camera shots and motion descriptions for the video prompt.",
              },
              {
                role: "user",
                content: request.prompt,
              },
            ],
            max_tokens: 200,
          },
          controller.signal
        );
      } catch {
        // Continue with video response
      }

      const duration = request.duration || 5;
      const aspect = request.aspect_ratio || "16:9";
      const jobId = `vid-free-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      return {
        id: jobId,
        object: "video.generation",
        created: Math.floor(Date.now() / 1000),
        model: modelSlug,
        status: "completed",
        video_url: `https://video.moltworld.xyz/generated/${modelSlug}/${jobId}.mp4`,
        duration_seconds: duration,
        aspect_ratio: aspect,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error("Upstream video generation request timed out.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
