import fs from "node:fs/promises";

const endpoint = (process.env.AI_ENDPOINT || "").replace(/\/$/, "");
if (!endpoint) {
  console.error("Falta AI_ENDPOINT. Ejemplo: AI_ENDPOINT=https://tu-worker.workers.dev npm run test:ai");
  process.exit(2);
}

const cases = JSON.parse(await fs.readFile(new URL("./cases.json", import.meta.url), "utf8"));
let passed = 0;
let failed = 0;

function itemMap(items = []) {
  return Object.fromEntries(items.map((item) => [item.product_id, Number(item.quantity)]));
}

function equalItems(expected = {}, actual = {}) {
  const a = Object.keys(expected).sort();
  const b = Object.keys(actual).sort();
  return a.length === b.length && a.every((key, index) => key === b[index] && Number(expected[key]) === Number(actual[key]));
}

for (const test of cases) {
  try {
    const response = await fetch(`${endpoint}/interpret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: test.message })
    });
    const body = await response.json();
    const result = body?.interpretation || {};
    const intentOk = result.intent === test.intent;
    const humanOk = test.needs_human === undefined || Boolean(result.needs_human) === Boolean(test.needs_human);
    const itemsOk = test.items === undefined || equalItems(test.items, itemMap(result.items));
    const ok = response.ok && body.ok && intentOk && humanOk && itemsOk;

    if (ok) {
      passed += 1;
      console.log(`✅ ${test.id.toString().padStart(2, "0")} [${test.group}] ${test.message}`);
    } else {
      failed += 1;
      console.log(`❌ ${test.id.toString().padStart(2, "0")} [${test.group}] ${test.message}`);
      console.log("   esperado:", { intent:test.intent, items:test.items, needs_human:test.needs_human });
      console.log("   recibido:", result);
    }
  } catch (error) {
    failed += 1;
    console.log(`❌ ${test.id.toString().padStart(2, "0")} ERROR ${error.message}`);
  }
}

console.log(`\nResultado: ${passed}/${cases.length} correctos · ${failed} fallidos`);
process.exit(failed ? 1 : 0);
