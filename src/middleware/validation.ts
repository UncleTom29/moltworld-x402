import { Context } from "hono";
import { ModelDefinition } from "../models/registry.js";
import {
  ChatCompletionRequest,
  ChatMessage,
  ImageGenerationRequest,
  AudioSpeechRequest,
  VideoGenerationRequest,
} from "../providers/types.js";

const MAX_BODY_BYTES = 100 * 1024; // 100 KB
const MAX_TOTAL_PROMPT_CHARS = 32000;
const VALID_ROLES = new Set(["system", "user", "assistant"]);

// ----------------------------------------------------
// Chat Validation
// ----------------------------------------------------
export async function validateChatCompletionRequest(
  c: Context,
  model: ModelDefinition
): Promise<{ valid: true; request: ChatCompletionRequest } | { valid: false; error: string }> {
  const contentLength = c.req.header("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return {
      valid: false,
      error: `Request body exceeds maximum size of ${MAX_BODY_BYTES} bytes.`,
    };
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return { valid: false, error: "Invalid JSON in request body." };
  }

  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object." };
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return {
      valid: false,
      error: "The 'messages' field must be a non-empty array of chat messages.",
    };
  }

  const maxMessages = model.limits.maxMessages || 50;
  if (body.messages.length > maxMessages) {
    return {
      valid: false,
      error: `Too many messages in conversation: got ${body.messages.length}, maximum allowed is ${maxMessages}.`,
    };
  }

  let totalChars = 0;
  const validatedMessages: ChatMessage[] = [];

  for (let i = 0; i < body.messages.length; i++) {
    const msg = body.messages[i];
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `Message at index ${i} must be an object.` };
    }

    if (!VALID_ROLES.has(msg.role)) {
      return {
        valid: false,
        error: `Message at index ${i} has invalid role '${msg.role}'. Valid roles are: system, user, assistant.`,
      };
    }

    if (typeof msg.content !== "string") {
      return {
        valid: false,
        error: `Message at index ${i} must have a string 'content' field.`,
      };
    }

    if (msg.content.trim().length === 0) {
      return {
        valid: false,
        error: `Message at index ${i} has empty content.`,
      };
    }

    totalChars += msg.content.length;
    const maxChars = model.limits.maxPromptChars || MAX_TOTAL_PROMPT_CHARS;
    if (totalChars > maxChars) {
      return {
        valid: false,
        error: `Combined prompt length exceeds limit of ${maxChars} characters.`,
      };
    }

    validatedMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  let temperature = 0.7;
  if (body.temperature !== undefined) {
    if (
      typeof body.temperature !== "number" ||
      isNaN(body.temperature) ||
      body.temperature < 0 ||
      body.temperature > 2
    ) {
      return {
        valid: false,
        error: "Field 'temperature' must be a number between 0.0 and 2.0.",
      };
    }
    temperature = body.temperature;
  }

  let maxTokens = Math.min(1024, model.limits.maxOutputTokens || 2048);
  if (body.max_tokens !== undefined) {
    if (
      typeof body.max_tokens !== "number" ||
      !Number.isInteger(body.max_tokens) ||
      body.max_tokens < 1
    ) {
      return {
        valid: false,
        error: "Field 'max_tokens' must be a positive integer.",
      };
    }

    const outputLimit = model.limits.maxOutputTokens || 2048;
    if (body.max_tokens > outputLimit) {
      return {
        valid: false,
        error: `Requested max_tokens (${body.max_tokens}) exceeds model limit of ${outputLimit}.`,
      };
    }

    maxTokens = body.max_tokens;
  }

  return {
    valid: true,
    request: {
      messages: validatedMessages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    },
  };
}

// ----------------------------------------------------
// Image Validation
// ----------------------------------------------------
export async function validateImageRequest(
  c: Context,
  model: ModelDefinition
): Promise<{ valid: true; request: ImageGenerationRequest } | { valid: false; error: string }> {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return { valid: false, error: "Invalid JSON in request body." };
  }

  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object." };
  }

  if (typeof body.prompt !== "string" || body.prompt.trim().length === 0) {
    return { valid: false, error: "Field 'prompt' is required and must be a non-empty string." };
  }

  const maxPromptChars = model.limits.maxPromptChars || 4000;
  if (body.prompt.length > maxPromptChars) {
    return {
      valid: false,
      error: `Prompt length exceeds model limit of ${maxPromptChars} characters.`,
    };
  }

  let n = 1;
  if (body.n !== undefined) {
    if (typeof body.n !== "number" || !Number.isInteger(body.n) || body.n < 1 || body.n > 4) {
      return { valid: false, error: "Field 'n' must be an integer between 1 and 4." };
    }
    n = body.n;
  }

  let size = "1024x1024";
  if (body.size !== undefined) {
    const validSizes = new Set(["1024x1024", "1024x1792", "1792x1024", "512x512", "768x768"]);
    if (typeof body.size !== "string" || !validSizes.has(body.size)) {
      return {
        valid: false,
        error: `Invalid size '${body.size}'. Allowed sizes: ${Array.from(validSizes).join(", ")}.`,
      };
    }
    size = body.size;
  }

  return {
    valid: true,
    request: {
      prompt: body.prompt.trim(),
      n,
      size,
      response_format: body.response_format === "b64_json" ? "b64_json" : "url",
      quality: body.quality === "hd" ? "hd" : "standard",
      style: body.style === "natural" ? "natural" : "vivid",
    },
  };
}

// ----------------------------------------------------
// Voice / Audio Validation
// ----------------------------------------------------
export async function validateAudioRequest(
  c: Context,
  model: ModelDefinition
): Promise<{ valid: true; request: AudioSpeechRequest } | { valid: false; error: string }> {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return { valid: false, error: "Invalid JSON in request body." };
  }

  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object." };
  }

  if (typeof body.input !== "string" || body.input.trim().length === 0) {
    return { valid: false, error: "Field 'input' is required and must be a non-empty string." };
  }

  const maxChars = model.limits.maxPromptChars || 4096;
  if (body.input.length > maxChars) {
    return {
      valid: false,
      error: `Input length (${body.input.length}) exceeds model limit of ${maxChars} characters.`,
    };
  }

  let speed = 1.0;
  if (body.speed !== undefined) {
    if (typeof body.speed !== "number" || body.speed < 0.25 || body.speed > 4.0) {
      return { valid: false, error: "Field 'speed' must be a number between 0.25 and 4.0." };
    }
    speed = body.speed;
  }

  return {
    valid: true,
    request: {
      input: body.input.trim(),
      voice: typeof body.voice === "string" ? body.voice : "alloy",
      response_format: typeof body.response_format === "string" ? (body.response_format as any) : "mp3",
      speed,
    },
  };
}

// ----------------------------------------------------
// Video Validation
// ----------------------------------------------------
export async function validateVideoRequest(
  c: Context,
  model: ModelDefinition
): Promise<{ valid: true; request: VideoGenerationRequest } | { valid: false; error: string }> {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return { valid: false, error: "Invalid JSON in request body." };
  }

  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object." };
  }

  if (typeof body.prompt !== "string" || body.prompt.trim().length === 0) {
    return { valid: false, error: "Field 'prompt' is required and must be a non-empty string." };
  }

  const maxChars = model.limits.maxPromptChars || 2500;
  if (body.prompt.length > maxChars) {
    return {
      valid: false,
      error: `Prompt length exceeds model limit of ${maxChars} characters.`,
    };
  }

  let duration = 5;
  const maxDuration = model.limits.maxDurationSeconds || 10;
  if (body.duration !== undefined) {
    if (
      typeof body.duration !== "number" ||
      !Number.isInteger(body.duration) ||
      body.duration < 1 ||
      body.duration > maxDuration
    ) {
      return {
        valid: false,
        error: `Field 'duration' must be an integer between 1 and ${maxDuration} seconds.`,
      };
    }
    duration = body.duration;
  }

  let aspectRatio: "16:9" | "9:16" | "1:1" = "16:9";
  if (body.aspect_ratio !== undefined) {
    if (!["16:9", "9:16", "1:1"].includes(body.aspect_ratio)) {
      return { valid: false, error: "Field 'aspect_ratio' must be one of: '16:9', '9:16', '1:1'." };
    }
    aspectRatio = body.aspect_ratio;
  }

  return {
    valid: true,
    request: {
      prompt: body.prompt.trim(),
      duration,
      aspect_ratio: aspectRatio,
      quality: body.quality === "hd" ? "hd" : "standard",
    },
  };
}
