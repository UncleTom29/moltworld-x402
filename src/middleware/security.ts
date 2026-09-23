import { Context, Next } from "hono";
import crypto from "crypto";
import { config } from "../config.js";

// Request ID middleware
export async function requestIdMiddleware(c: Context, next: Next): Promise<void> {
  const reqId = c.req.header("x-request-id") || crypto.randomUUID();
  c.set("requestId", reqId);
  c.header("x-request-id", reqId);
  await next();
}

// Security & Cache-Control headers (Cloudflare compatibility)
export async function securityHeadersMiddleware(c: Context, next: Next): Promise<void> {
  await next();

  // Basic security headers
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // Cloudflare caching rules:
  // All /v1/* endpoints MUST NOT be cached
  const path = c.req.path;
  if (path.startsWith("/v1/")) {
    c.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    c.header("Pragma", "no-cache");
    c.header("Expires", "0");
  } else if (path === "/health") {
    c.header("Cache-Control", "public, max-age=5");
  }

  // Ensure x402 payment headers are exposed to CORS callers
  c.header("Access-Control-Expose-Headers", "Payment-Required, Payment-Response, x-request-id");
}

// In-memory sliding window rate limiter for free/unpaid routes
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number
  ) {
    // Clean up old entries periodically
    setInterval(() => this.cleanup(), windowMs * 2).unref();
  }

  isRateLimited(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.requests.get(ip) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= this.maxRequests) {
      return true;
    }

    timestamps.push(now);
    this.requests.set(ip, timestamps);
    return false;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [ip, timestamps] of this.requests.entries()) {
      const active = timestamps.filter((t) => t > windowStart);
      if (active.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, active);
      }
    }
  }
}

const freeRouteLimiter = new RateLimiter(
  config.rateLimitWindowMs,
  config.rateLimitMaxRequests
);

export async function rateLimitFreeRoutesMiddleware(c: Context, next: Next): Promise<Response | void> {
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    "client-ip";

  if (freeRouteLimiter.isRateLimited(ip)) {
    return c.json(
      {
        error: {
          message: "Too many requests. Please slow down.",
          type: "rate_limit_error",
        },
      },
      429
    );
  }

  await next();
}

// Structured request logger
export async function structuredLogger(c: Context, next: Next): Promise<void> {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: c.get("requestId") || c.res.headers.get("x-request-id"),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: duration,
    ip: c.req.header("cf-connecting-ip") || "direct",
  };

  // Skip noisy healthcheck logs in production if healthy
  if (c.req.path === "/health" && c.res.status === 200 && config.env === "production") {
    return;
  }

  console.log(JSON.stringify(logEntry));
}

// Global safe error handler
export function safeErrorHandler(err: Error, c: Context): Response {
  const reqId = c.get("requestId") || "unknown";
  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      requestId: reqId,
      message: err.message,
    })
  );

  let message = "An internal server error occurred.";
  if (config.env !== "production" || err.message.startsWith("Upstream model provider")) {
    message = err.message;
  }

  return c.json(
    {
      error: {
        message,
        type: "server_error",
        request_id: reqId,
      },
    },
    500
  );
}
