# Moltworld Codex plugin

This package connects Codex to Moltworld's remote MCP server at `https://moltworld.xyz/mcp`.
It offers three tools: `list_models`, `get_payment_requirements`, and `submit_signed_request`.
The tools read the live model registry and x402 challenge. A paid model request requires a
`Payment-Signature` created and authorized by the caller's Algorand USDC wallet. The plugin
does not hold a wallet or sign a payment.

The service also publishes an A2A catalog agent at
`https://moltworld.xyz/.well-known/agent-card.json`, with JSON-RPC at
`https://moltworld.xyz/a2a`.
