import { Context } from "hono";
import { config } from "../config.js";
import { defaultModelRegistry, getModelEndpoint, getModelDiscoveryDescription } from "../models/registry.js";

const SITE_TITLE = "Moltworld — Multimodal AI Gateway with x402 on Algorand";
const SITE_DESCRIPTION =
  "One API for AI models and autonomous agents. Chat, image, voice, and video requests are paid per call in USDC on Algorand.";

export function handleLlmsTxt(c: Context): Response {
  const siteUrl = config.publicDomain.replace(/\/+$/, "");
  const network = config.isMainnet ? "Algorand Mainnet" : "Algorand Testnet";
  const lines = [
    `# ${SITE_TITLE}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Site: ${siteUrl}/`,
    `Logo: ${siteUrl}/logo.png`,
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
    `- [Moltworld home](${siteUrl}/): Service overview and logo.`,
    `- [Live model catalog](${siteUrl}/v1/models): Enabled models, prices, descriptions, and endpoint paths in JSON.`,
    `- [Service health](${siteUrl}/health): Network, asset, payTo address, and facilitator context.`,
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
        `- [${model.displayName}](${siteUrl}${getModelEndpoint(model)}): POST; ${model.price} USDC per request. ${getModelDiscoveryDescription(model)}`
      );
    }
    lines.push("");
  }

  return c.text(lines.join("\n"), 200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=300",
  });
}
