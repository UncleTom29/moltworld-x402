import { Context } from "hono";
import { config } from "../config.js";
import { defaultModelRegistry, getModelEndpoint, getModelDiscoveryDescription } from "../models/registry.js";

const SITE_TITLE = "Moltworld — Multimodal AI Gateway with x402 on Algorand";
const SITE_DESCRIPTION =
  "One API for AI models and autonomous agents. Chat, image, voice, and video requests are paid per call in USDC on Algorand.";
const SERVICE_TAGS = ["moltworld", "ai-inference", "algorand", "x402", "x402-global-challenge"];

function siteUrl(): string {
  return config.publicDomain.replace(/\/+$/, "");
}

function microUsdc(price: string): string {
  const match = /^\$(\d+)(?:\.(\d{1,6}))?$/.exec(price);
  if (!match) throw new Error(`Invalid USDC price: ${price}`);
  return (BigInt(match[1]) * 1_000_000n + BigInt((match[2] || "").padEnd(6, "0"))).toString();
}

export function handleX402Discovery(c: Context): Response {
  const origin = siteUrl();
  return c.json(
    {
      x402Version: 2,
      name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      website: origin,
      logo: `${origin}/logo.png`,
      image: `${origin}/logo.png`,
      tags: SERVICE_TAGS,
      resources: defaultModelRegistry.getEnabledModels().map((model) => ({
        url: `${origin}${getModelEndpoint(model)}`,
        method: "POST",
        description: getModelDiscoveryDescription(model),
        network: config.networkCaip2,
        asset: config.usdcAsaId,
        amount: microUsdc(model.price),
        payTo: config.payToAddress,
        tags: [...SERVICE_TAGS, model.modality],
      })),
    },
    200,
    { "Cache-Control": "public, max-age=300" }
  );
}

export function handleLlmsTxt(c: Context): Response {
  const origin = siteUrl();
  const network = config.isMainnet ? "Algorand Mainnet" : "Algorand Testnet";
  const lines = [
    `# ${SITE_TITLE}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Site: ${origin}/`,
    `Logo: ${origin}/logo.png`,
    `Merchant payTo address: ${config.payToAddress}`,
    `Payment: x402 exact scheme; USDC on ${network} (ASA ${config.usdcAsaId}; network ${config.networkCaip2}).`,
    `Facilitator: ${config.facilitatorUrl} (GoPlausible).`,
    "Discovery: GoPlausible Bazaar; challenge tag: x402-global-challenge.",
    "",
    "## Agent guidance",
    "",
    "- Read the live model catalog for current availability, prices, descriptions, and endpoint paths.",
    "- Send JSON to a model's POST endpoint. An unpaid request returns HTTP 402 with a Payment-Required header containing the current x402 terms and Bazaar input/output metadata.",
    "- Use an x402 client that supports Algorand USDC to authorize the quoted payment and retry with Payment-Signature. Check the 402 terms before authorizing; prices here are informational.",
    "- Choose a model that matches the requested modality and respect the input limits in the catalog and payment response.",
    "",
    "## Discovery and service links",
    "",
    `- [Moltworld home](${origin}/): Service overview and logo.`,
    `- [x402 service descriptor](${origin}/.well-known/x402): Machine-readable paid route and payment catalog.`,
    `- [A2A agent card](${origin}/.well-known/agent-card.json): Working JSON-RPC model discovery agent at ${origin}/a2a.`,
    `- [MCP server](${origin}/mcp): Model catalog, live payment requirements, and caller-signed paid requests.`,
    `- [Live model catalog](${origin}/v1/models): Enabled models, prices, descriptions, and endpoint paths in JSON.`,
    `- [Service health](${origin}/health): Network, asset, payTo address, and facilitator context.`,
    `- [GoPlausible Bazaar resources](${config.facilitatorUrl}/discovery/resources): Facilitator catalog of settled x402 resources.`,
    `- [GoPlausible Bazaar merchants](${config.facilitatorUrl}/discovery/merchants): Facilitator merchant catalog; find the payTo address above.`,
    "",
    "## Paid model endpoints",
    "",
  ];

  for (const modality of ["chat", "image", "voice", "video"] as const) {
    const models = defaultModelRegistry.getEnabledModels().filter((model) => model.modality === modality);
    lines.push(`### ${modality[0].toUpperCase()}${modality.slice(1)}`, "");
    for (const model of models) {
      lines.push(
        `- [${model.displayName}](${origin}${getModelEndpoint(model)}): POST; ${model.price} USDC per request. ${getModelDiscoveryDescription(model)}`
      );
    }
    lines.push("");
  }

  return c.text(lines.join("\n"), 200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=300",
  });
}
