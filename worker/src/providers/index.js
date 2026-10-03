import { interpretWithCloudflare } from "./cloudflare.js";

export async function interpretMessage(args) {
  const provider = (args.env.AI_PROVIDER || "cloudflare").toLowerCase();
  switch (provider) {
    case "cloudflare":
      return interpretWithCloudflare(args);
    default:
      throw new Error(`AI_PROVIDER_UNSUPPORTED:${provider}`);
  }
}
