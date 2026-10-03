import { PRODUCTS, ALLOWED_INTENTS } from "./catalog.js";
import { interpretMessage } from "./providers/index.js";

const MAX_MESSAGE_LENGTH = 500;

function corsHeaders(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || "https://josenunezapps.github.io";
  const local = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
  const allowOrigin = origin === allowed || local ? origin : allowed;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status, origin, env) {
  return Response.json(data, { status, headers: corsHeaders(origin, env) });
}

function sanitizeInterpretation(raw) {
  const validIds = new Set(PRODUCTS.map((p) => p.id));
  const intent = ALLOWED_INTENTS.includes(raw?.intent) ? raw.intent : "unknown";
  const items = Array.isArray(raw?.items)
    ? raw.items
        .filter((item) => validIds.has(item?.product_id))
        .map((item) => ({
          product_id: item.product_id,
          quantity: Math.max(1, Math.min(24, Number.parseInt(item.quantity, 10) || 1))
        }))
    : [];

  return {
    intent,
    items,
    needs_human: Boolean(raw?.needs_human || intent === "human"),
    question: typeof raw?.question === "string" && raw.question.trim()
      ? raw.question.trim().slice(0, 180)
      : null
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "zenix-fuego-sur-ai", provider: env.AI_PROVIDER || "cloudflare" }, 200, origin, env);
    }

    if (request.method !== "POST" || url.pathname !== "/interpret") {
      return json({ ok: false, error: "NOT_FOUND" }, 404, origin, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "INVALID_JSON" }, 400, origin, env);
    }

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return json({ ok: false, error: "INVALID_MESSAGE" }, 400, origin, env);
    }

    try {
      const raw = await interpretMessage({ env, message, products: PRODUCTS });
      return json({ ok: true, interpretation: sanitizeInterpretation(raw) }, 200, origin, env);
    } catch (error) {
      console.error("ZENIX_AI_ERROR", error?.message || error);
      return json({ ok: false, error: "AI_UNAVAILABLE" }, 503, origin, env);
    }
  }
};
