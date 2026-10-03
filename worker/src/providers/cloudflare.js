const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

function extractJson(text) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("AI_JSON_NOT_FOUND");
  return JSON.parse(candidate.slice(first, last + 1));
}

export async function interpretWithCloudflare({ env, message, products }) {
  const productList = products.map((p) => `${p.id}: ${p.name} | aliases: ${p.aliases.join(", ")}`).join("\n");
  const system = `Sos el intérprete de lenguaje natural de Zenix Gastronomía.
Tu única tarea es EXTRAER intención y datos. No calcules precios, no inventes productos, no decidas horarios, descuentos, stock, delivery, totales ni estados.
Respondé SOLO JSON válido, sin markdown, con esta forma exacta:
{
  "intent":"order|remove|price|menu|hours|delivery|human|greeting|unknown",
  "items":[{"product_id":"id-del-catalogo","quantity":1}],
  "needs_human":false,
  "question":null
}
Reglas:
- Para order/remove, extraé únicamente productos que existan en el catálogo y cantidades enteras positivas.
- Para price, devolvé el producto consultado en items con quantity 1.
- Si el mensaje es ambiguo o no podés mapearlo con seguridad, intent=unknown, items=[], needs_human=true y question con una pregunta corta.
- Reclamos, pagos dudosos, excepciones, lenguaje muy confuso o pedido explícito de persona: intent=human y needs_human=true.
- Nunca inventes un product_id.
- No respondas el contenido comercial: sólo clasificá y extraé.

CATÁLOGO DISPONIBLE:
${productList}`;

  const result = await env.AI.run(
    MODEL,
    {
      messages: [
        { role: "system", content: system },
        { role: "user", content: message }
      ]
    },
    { gateway: { id: "default" } }
  );

  return extractJson(result?.response);
}
