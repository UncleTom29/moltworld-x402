import { createMcpHandler, hostHeaderValidationResponse, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { config } from "../config.js";
import { defaultModelRegistry, getModelDiscoveryDescription, getModelEndpoint } from "../models/registry.js";

const origin = config.publicDomain.replace(/\/+$/, "");

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "moltworld", version: "1.0.0" });

  server.registerTool("list_models", {
    description: "List live Moltworld chat, image, voice, and video models with USDC prices and paid x402 endpoints.",
    inputSchema: z.object({ modality: z.enum(["chat", "image", "voice", "video"]).optional() }),
  }, async ({ modality }) => ({
    content: [{ type: "text", text: JSON.stringify(defaultModelRegistry.getEnabledModels()
      .filter((model) => !modality || model.modality === modality)
      .map((model) => ({ slug: model.slug, name: model.displayName, modality: model.modality,
        description: getModelDiscoveryDescription(model), priceUsdc: model.price,
        endpoint: `${origin}${getModelEndpoint(model)}`, limits: model.limits }))) }],
  }));

  server.registerTool("get_payment_requirements", {
    description: "Get the live HTTP 402 payment challenge for a model before authorizing Algorand USDC payment.",
    inputSchema: z.object({ model: z.string().min(1) }),
  }, async ({ model: slug }) => {
    const model = defaultModelRegistry.getModel(slug);
    if (!model?.enabled) return { isError: true, content: [{ type: "text", text: "Unknown or disabled model." }] };
    const endpoint = `${origin}${getModelEndpoint(model)}`;
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    return { content: [{ type: "text", text: JSON.stringify({ endpoint, status: response.status,
      paymentRequired: response.headers.get("Payment-Required"), priceUsdc: model.price,
      network: config.networkCaip2, asset: config.usdcAsaId, payTo: config.payToAddress }) }] };
  });

  server.registerTool("submit_signed_request", {
    description: "Submit a model request with a Payment-Signature already authorized by the caller's Algorand x402 wallet. Never sends a payment without that signature.",
    inputSchema: z.object({ model: z.string().min(1), body: z.record(z.string(), z.unknown()), paymentSignature: z.string().min(1) }),
  }, async ({ model: slug, body, paymentSignature }) => {
    const model = defaultModelRegistry.getModel(slug);
    if (!model?.enabled) return { isError: true, content: [{ type: "text", text: "Unknown or disabled model." }] };
    const endpoint = `${origin}${getModelEndpoint(model)}`;
    const response = await fetch(endpoint, { method: "POST", headers: {
      "Content-Type": "application/json", "Payment-Signature": paymentSignature,
    }, body: JSON.stringify(body) });
    const result = await response.text();
    return { isError: !response.ok, content: [{ type: "text", text: JSON.stringify({
      status: response.status, body: result.slice(0, 100_000),
      paymentRequired: response.headers.get("Payment-Required"),
      paymentResponse: response.headers.get("Payment-Response"),
    }) }] };
  });

  return server;
});

export function handleMcp(request: Request): Promise<Response> {
  const hostname = new URL(origin).hostname;
  const rejected = hostHeaderValidationResponse(request, [hostname, "localhost", "127.0.0.1"]);
  return rejected ? Promise.resolve(rejected) : handler.fetch(request);
}
