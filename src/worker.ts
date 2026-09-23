import { app, init } from "./app.js";

let initPromise: Promise<void> | undefined;

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

    // Await facilitator initialization to prevent race conditions on cold start
    initPromise ??= init();
    await initPromise;

    return app.fetch(request, env, ctx);
  },
};
