import { Hono } from "hono";
import { cors } from "hono/cors";
import { paymentMiddleware } from "@x402/hono";
import { createX402Server } from "./x402/server.js";
import {
  requestIdMiddleware,
  securityHeadersMiddleware,
  rateLimitFreeRoutesMiddleware,
  structuredLogger,
  safeErrorHandler,
} from "./middleware/security.js";
import { renderLandingPage } from "./routes/landing.js";
import {
  handleHealth,
  handleListModels,
  handleChatCompletion,
  handleImageGeneration,
  handleAudioSpeech,
  handleVideoGeneration,
} from "./routes/api.js";
import { defaultModelRegistry } from "./models/registry.js";

export function createApp(): {
  app: Hono;
  init: () => Promise<void>;
} {
  const app = new Hono();
  const { server, routes } = createX402Server();

  // Global Error Handler
  app.onError(safeErrorHandler);

  // Request ID & Logger
  app.use("*", requestIdMiddleware);
  app.use("*", structuredLogger);
  app.use("*", securityHeadersMiddleware);

  // CORS Configuration
  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "Payment-Signature",
        "Payment-Required",
        "x-request-id",
      ],
      exposeHeaders: [
        "Payment-Required",
        "Payment-Response",
        "x-request-id",
        "Content-Type",
      ],
      maxAge: 86400,
    })
  );

  // Rate Limiting for Free / Unpaid Endpoints
  app.use("/", rateLimitFreeRoutesMiddleware);
  app.use("/health", rateLimitFreeRoutesMiddleware);
  app.use("/v1/models", rateLimitFreeRoutesMiddleware);

  // Free Endpoints
  app.get("/", renderLandingPage);
  app.get("/health", handleHealth);
  app.get("/v1/models", handleListModels);

  // x402 Payment Middleware for Protected Routes
  app.use(paymentMiddleware(routes, server, undefined, undefined, false));

  // Explicit Protected Model Routes
  const models = defaultModelRegistry.getEnabledModels();
  for (const model of models) {
    switch (model.modality) {
      case "chat":
        app.post(`/v1/models/${model.slug}/chat/completions`, handleChatCompletion);
        break;
      case "image":
        app.post(`/v1/models/${model.slug}/images/generations`, handleImageGeneration);
        break;
      case "voice":
        app.post(`/v1/models/${model.slug}/audio/speech`, handleAudioSpeech);
        break;
      case "video":
        app.post(`/v1/models/${model.slug}/videos/generations`, handleVideoGeneration);
        break;
    }
  }

  // Generic Parameterized Routes
  app.post("/v1/models/:model/chat/completions", handleChatCompletion);
  app.post("/v1/models/:model/images/generations", handleImageGeneration);
  app.post("/v1/models/:model/audio/speech", handleAudioSpeech);
  app.post("/v1/models/:model/videos/generations", handleVideoGeneration);

  const init = async () => {
    try {
      await server.initialize();
    } catch (err) {
      console.warn("Facilitator init warning:", err);
    }
  };

  return { app, init };
}

export const { app, init } = createApp();
