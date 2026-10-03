(() => {
  "use strict";

  const originalInterpretWithAI = window.interpretWithAI;
  const config = window.ZENIX_AI_CONFIG || {};
  const localConfig = config.localAI || {};
  const agentMode = document.getElementById("agentMode");
  const MODEL = localConfig.model || "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
  const WEBLLM_VERSION = localConfig.webllmVersion || "0.2.85";
  const MIN_DEVICE_MEMORY_GB = Number(localConfig.minDeviceMemoryGB || 4);

  let enginePromise = null;
  let localDisabled = false;
  let localFailureReason = "";

  function setMode(text) {
    if (agentMode) agentMode.textContent = text;
  }

  function safeLog(type, data = {}) {
    try {
      if (typeof window.logEvent === "function") window.logEvent(type, data);
    } catch {}
  }

  function getCatalog() {
    return Array.from(document.querySelectorAll("#menuGrid .menu-card")).map((card) => ({
      id: card.querySelector("[data-add]")?.dataset?.add || "",
      name: card.querySelector("h3")?.textContent?.trim() || ""
    })).filter((item) => item.id && item.name);
  }

  function canUseLocalAI() {
    if (localConfig.enabled === false || localDisabled) return false;
    if (!navigator.gpu) {
      localFailureReason = "WEBGPU_UNAVAILABLE";
      return false;
    }
    if (navigator.deviceMemory && Number(navigator.deviceMemory) < MIN_DEVICE_MEMORY_GB) {
      localFailureReason = "LOW_DEVICE_MEMORY";
      return false;
    }
    return true;
  }

  function parseJson(text) {
    const raw = String(text || "").trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : raw;
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first < 0 || last <= first) throw new Error("LOCAL_AI_JSON_NOT_FOUND");
    return JSON.parse(candidate.slice(first, last + 1));
  }

  function sanitizeInterpretation(result, catalog) {
    const allowedIntents = new Set(["order", "remove", "price", "menu", "hours", "delivery", "human", "greeting", "unknown"]);
    const allowedIds = new Set(catalog.map((item) => item.id));
    const intent = allowedIntents.has(result?.intent) ? result.intent : "unknown";
    const items = Array.isArray(result?.items) ? result.items.map((item) => ({
      product_id: String(item?.product_id || ""),
      quantity: Math.max(1, Math.min(24, Number(item?.quantity) || 1))
    })).filter((item) => allowedIds.has(item.product_id)) : [];

    const normalized = {
      intent,
      items,
      needs_human: Boolean(result?.needs_human),
      question: typeof result?.question === "string" && result.question.trim() ? result.question.trim().slice(0, 180) : null
    };

    if (["order", "remove", "price"].includes(normalized.intent) && !normalized.items.length) {
      normalized.intent = "unknown";
      normalized.needs_human = true;
      normalized.question = normalized.question || "No pude identificar el producto con seguridad. ¿Podés reformularlo?";
    }

    if (normalized.intent === "human") normalized.needs_human = true;
    return normalized;
  }

  async function getEngine() {
    if (enginePromise) return enginePromise;

    enginePromise = (async () => {
      setMode("IA local · preparando modelo…");
      const webllm = await import(`https://esm.run/@mlc-ai/web-llm@${WEBLLM_VERSION}`);
      const engine = await webllm.CreateMLCEngine(MODEL, {
        initProgressCallback(progress) {
          const value = Math.max(0, Math.min(100, Math.round((Number(progress?.progress) || 0) * 100)));
          setMode(`IA local · cargando ${value}%`);
        }
      });
      setMode("IA local · WebLLM");
      safeLog("local_ai_ready", { model: MODEL });
      return engine;
    })().catch((error) => {
      localDisabled = true;
      localFailureReason = String(error?.message || error);
      enginePromise = null;
      safeLog("local_ai_init_error", { message: localFailureReason });
      throw error;
    });

    return enginePromise;
  }

  async function interpretLocallyWithWebLLM(message) {
    const catalog = getCatalog();
    if (!catalog.length) throw new Error("LOCAL_AI_CATALOG_EMPTY");

    const engine = await getEngine();
    const catalogText = catalog.map((item) => `${item.id}: ${item.name}`).join("\n");
    const system = `Sos el intérprete local de Zenix Gastronomía. Respondé solamente JSON válido.\n\nTu tarea es EXTRAER intención, producto y cantidad. No calcules precios, delivery, horarios, stock, descuentos, totales, códigos ni estados. El software de Zenix decide todo eso.\n\nFormato exacto:\n{\n  "intent":"order|remove|price|menu|hours|delivery|human|greeting|unknown",\n  "items":[{"product_id":"id-del-catalogo","quantity":1}],\n  "needs_human":false,\n  "question":null\n}\n\nReglas:\n- Usá exclusivamente product_id del catálogo.\n- Para pedidos y quitar productos, extraé cantidades enteras positivas.\n- Para consultar precio, devolvé el producto con quantity 1.\n- Entendé español rioplatense y abreviaciones comunes como muzza/mozza para muzzarella.\n- Si es un reclamo, pago dudoso, excepción o pide hablar con una persona: intent=human y needs_human=true.\n- Si no estás seguro, intent=unknown, items=[], needs_human=true y escribí una pregunta corta.\n- Nunca inventes un producto ni un dato comercial.\n\nCATÁLOGO:\n${catalogText}`;

    const reply = await engine.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: String(message).slice(0, 220) }
      ],
      temperature: 0,
      max_tokens: 220,
      response_format: { type: "json_object" }
    });

    const content = reply?.choices?.[0]?.message?.content;
    return sanitizeInterpretation(parseJson(content), catalog);
  }

  async function cloudflareFallback(message) {
    if (typeof originalInterpretWithAI !== "function") {
      return typeof window.localInterpretation === "function"
        ? window.localInterpretation(message)
        : { intent: "unknown", items: [], needs_human: true, question: "No pude interpretar el mensaje." };
    }

    if (config.endpoint?.trim()) setMode("Respaldo · Cloudflare");
    const result = await originalInterpretWithAI(message);
    if (!config.endpoint?.trim()) setMode("Motor local · sin IA externa");
    return result;
  }

  window.interpretWithAI = async function hybridInterpretWithAI(message) {
    const deterministic = typeof window.localInterpretation === "function"
      ? window.localInterpretation(message)
      : null;

    if (deterministic && deterministic.intent && deterministic.intent !== "unknown") {
      setMode("Motor local · 0 IA");
      safeLog("deterministic_interpretation", { intent: deterministic.intent });
      return deterministic;
    }

    if (canUseLocalAI()) {
      try {
        setMode("IA local · WebLLM");
        const result = await interpretLocallyWithWebLLM(message);
        safeLog("local_ai_interpretation_ok", { intent: result.intent, model: MODEL });

        if (result.intent !== "unknown") {
          setMode("IA local · WebLLM");
          return result;
        }

        safeLog("local_ai_uncertain", { model: MODEL });
        if (!config.endpoint?.trim()) {
          setMode("IA local · necesita aclaración");
          return result;
        }
      } catch (error) {
        localDisabled = true;
        localFailureReason = String(error?.message || error);
        safeLog("local_ai_interpretation_error", { message: localFailureReason });
      }
    }

    const fallback = await cloudflareFallback(message);
    safeLog("hybrid_fallback", {
      provider: config.endpoint?.trim() ? "cloudflare" : "local-parser",
      local_reason: localFailureReason || null,
      intent: fallback?.intent || "unknown"
    });
    return fallback;
  };

  window.ZENIX_LOCAL_AI_STATUS = () => ({
    enabled: localConfig.enabled !== false,
    supported: Boolean(navigator.gpu),
    model: MODEL,
    minDeviceMemoryGB: MIN_DEVICE_MEMORY_GB,
    disabledForSession: localDisabled,
    failureReason: localFailureReason || null,
    cloudflareFallbackConfigured: Boolean(config.endpoint?.trim())
  });

  if (canUseLocalAI()) setMode("Motor local + WebLLM de respaldo");
  else if (config.endpoint?.trim()) setMode("Motor local + Cloudflare de respaldo");
  else setMode("Motor local · sin IA externa");
})();
