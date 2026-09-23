import { app, init } from "./app.js";

let initialized = false;

export default {
  async fetch(request: Request, env: Record<string, string>, ctx: any): Promise<Response> {
    // Populate process.env if running under Cloudflare Workers with bound vars
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string" && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    // Lazy initialization for serverless edge cold starts
    if (!initialized) {
      if (ctx?.waitUntil) {
        ctx.waitUntil(init());
      } else {
        await init();
      }
      initialized = true;
    }

    return app.fetch(request, env, ctx);
  },
};
