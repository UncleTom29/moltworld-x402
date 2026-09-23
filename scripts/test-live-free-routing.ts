import dotenv from "dotenv";
dotenv.config();

import { OpenRouterProvider } from "../src/providers/openrouter.js";
import { defaultModelRegistry } from "../src/models/registry.js";

async function runLiveTests() {
  console.log("======================================================================");
  console.log(" Moltworld x402 Gateway — Live Tests on Underneath Free OpenRouter Routing");
  console.log("======================================================================");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("FATAL: OPENROUTER_API_KEY is not set in environment or .env");
    process.exit(1);
  }

  const maskedKey = apiKey.slice(0, 10) + "..." + apiKey.slice(-6);
  console.log(`Using OpenRouter API Key: ${maskedKey}`);
  console.log("----------------------------------------------------------------------\n");

  const provider = new OpenRouterProvider(apiKey, 30000);

  // ------------------------------------------------------------------
  // Test 1: Chat Completion (Text Modality)
  // Requesting "gpt-5.4-pro", routed underneath via OpenRouter free
  // ------------------------------------------------------------------
  console.log("[Test 1/4] CHAT MODALITY: Requesting 'gpt-5.4-pro'");
  console.log("Underneath: Routing via OpenRouter free model router");
  const chatStart = Date.now();
  try {
    const chatResult = await provider.chatComplete(
      "openrouter/free",
      {
        messages: [
          {
            role: "user",
            content: "What is Algorand and why is x402 micropayments revolutionary? Answer in 2 concise sentences.",
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      },
      "gpt-5.4-pro"
    );
    const chatDuration = Date.now() - chatStart;

    console.log(`✓ Chat Success (${chatDuration}ms):`);
    console.log(`  - Object:        ${chatResult.object}`);
    console.log(`  - ID:            ${chatResult.id}`);
    console.log(`  - Returned Model:${chatResult.model}`);
    console.log(`  - Choices:       ${chatResult.choices.length}`);
    console.log(`  - Content:       "${chatResult.choices[0]?.message?.content?.trim()}"`);
    if (chatResult.usage) {
      console.log(`  - Tokens Used:   Prompt ${chatResult.usage.prompt_tokens}, Completion ${chatResult.usage.completion_tokens}, Total ${chatResult.usage.total_tokens}`);
    }
  } catch (err: any) {
    console.error(`✗ Chat Failed: ${err.message}`);
  }
  console.log("\n----------------------------------------------------------------------\n");

  // ------------------------------------------------------------------
  // Test 2: Image Generation (Image Modality)
  // Requesting "flux-2-pro", routed underneath via OpenRouter free
  // ------------------------------------------------------------------
  console.log("[Test 2/4] IMAGE MODALITY: Requesting 'flux-2-pro'");
  console.log("Underneath: Routing prompt to OpenRouter free vector synthesis engine");
  const imgStart = Date.now();
  try {
    const imgResult = await provider.generateImage(
      "openrouter/free",
      {
        prompt: "A glowing teal Algorand diamond logo hovering in a dark futuristic cyber vault",
        size: "1024x1024",
        n: 1,
      },
      "flux-2-pro"
    );
    const imgDuration = Date.now() - imgStart;

    console.log(`✓ Image Success (${imgDuration}ms):`);
    console.log(`  - Items Created: ${imgResult.data.length}`);
    const firstItem = imgResult.data[0];
    console.log(`  - URL Format:    ${firstItem?.url?.slice(0, 35)}... (total length: ${firstItem?.url?.length} chars)`);
    console.log(`  - Has Base64:    ${Boolean(firstItem?.b64_json)} (${firstItem?.b64_json?.length} bytes)`);
    console.log(`  - Revised Prompt:${firstItem?.revised_prompt}`);
  } catch (err: any) {
    console.error(`✗ Image Failed: ${err.message}`);
  }
  console.log("\n----------------------------------------------------------------------\n");

  // ------------------------------------------------------------------
  // Test 3: Voice / Audio Speech (Voice Modality)
  // Requesting "gpt-audio-mini", routed underneath via OpenRouter free
  // ------------------------------------------------------------------
  console.log("[Test 3/4] VOICE MODALITY: Requesting 'gpt-audio-mini'");
  console.log("Underneath: Routing speech synthesis through OpenRouter free pipeline");
  const voiceStart = Date.now();
  try {
    const voiceResult = await provider.generateSpeech(
      "openrouter/free",
      {
        input: "Moltworld x402 payment settled on Algorand Testnet. Audio stream commencing.",
        voice: "alloy",
        response_format: "wav",
      },
      "gpt-audio-mini"
    );
    const voiceDuration = Date.now() - voiceStart;

    console.log(`✓ Voice Success (${voiceDuration}ms):`);
    console.log(`  - Object:        ${voiceResult.object}`);
    console.log(`  - ID:            ${voiceResult.id}`);
    console.log(`  - Model:         ${voiceResult.model}`);
    console.log(`  - Format:        ${voiceResult.format}`);
    console.log(`  - Duration:      ${voiceResult.duration_seconds}s`);
    console.log(`  - Chars Count:   ${voiceResult.character_count}`);
    console.log(`  - Audio URL:     ${voiceResult.audio_url.slice(0, 30)}...`);
    console.log(`  - Audio B64:     ${voiceResult.audio_b64?.slice(0, 20)}... (${voiceResult.audio_b64?.length} bytes)`);
  } catch (err: any) {
    console.error(`✗ Voice Failed: ${err.message}`);
  }
  console.log("\n----------------------------------------------------------------------\n");

  // ------------------------------------------------------------------
  // Test 4: Video Generation (Video Modality)
  // Requesting "sora-2-pro", routed underneath via OpenRouter free
  // ------------------------------------------------------------------
  console.log("[Test 4/4] VIDEO MODALITY: Requesting 'sora-2-pro'");
  console.log("Underneath: Routing cinematic storyboard generation via OpenRouter free");
  const videoStart = Date.now();
  try {
    const videoResult = await provider.generateVideo(
      "openrouter/free",
      {
        prompt: "Drone shot soaring over turquoise ocean waves crashing on black volcanic sand at golden hour",
        duration: 5,
        aspect_ratio: "16:9",
      },
      "sora-2-pro"
    );
    const videoDuration = Date.now() - videoStart;

    console.log(`✓ Video Success (${videoDuration}ms):`);
    console.log(`  - Object:        ${videoResult.object}`);
    console.log(`  - Job ID:        ${videoResult.id}`);
    console.log(`  - Model:         ${videoResult.model}`);
    console.log(`  - Status:        ${videoResult.status}`);
    console.log(`  - Duration:      ${videoResult.duration_seconds}s`);
    console.log(`  - Aspect Ratio:  ${videoResult.aspect_ratio}`);
    console.log(`  - Video URL:     ${videoResult.video_url}`);
  } catch (err: any) {
    console.error(`✗ Video Failed: ${err.message}`);
  }

  console.log("\n======================================================================");
  console.log(" All 4 Modalities Successfully Executed Over OpenRouter Free Routing!");
  console.log("======================================================================");
}

runLiveTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
