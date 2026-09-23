import { serve } from "@hono/node-server";
import { app, init } from "./app.js";
import { config } from "./config.js";

async function main(): Promise<void> {
  console.log("Initializing Moltworld x402 Gateway...");
  console.log(`- Network: ${config.isMainnet ? "MAINNET" : "TESTNET"}`);
  console.log(`- Network CAIP-2: ${config.networkCaip2}`);
  console.log(`- USDC ASA ID: ${config.usdcAsaId}`);
  console.log(`- PayTo Address: ${config.payToAddress}`);
  console.log(`- Facilitator: ${config.facilitatorUrl}`);
  console.log(`- Mock Provider Mode: ${config.mockProviders}`);

  await init();

  serve(
    {
      fetch: app.fetch,
      port: config.port,
    },
    (info) => {
      console.log(`\n======================================================`);
      console.log(` Moltworld x402 Gateway is LIVE`);
      console.log(` Local URL:     http://localhost:${info.port}`);
      console.log(` Public Domain: ${config.publicDomain}`);
      console.log(` Health Status: http://localhost:${info.port}/health`);
      console.log(` Model Catalog: http://localhost:${info.port}/v1/models`);
      console.log(`======================================================\n`);
    }
  );
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
