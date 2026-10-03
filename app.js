const WHATSAPP_NUMBER = "542901535229";
const CART_KEY = "fuego-sur-cart-v2";
const ORDERS_KEY = "fuego-sur-orders-v2";
const EVENTS_KEY = "fuego-sur-events-v1";
const DELIVERY_PRICE = 2500;

const products = [
  {id:"emp-carne",category:"Empanadas",name:"Empanada de carne",price:1800,desc:"Carne cortada, cebolla, huevo y especias.",aliases:["empanada de carne","empanadas de carne","de carne","carne"]},
  {id:"emp-pollo",category:"Empanadas",name:"Empanada de pollo",price:1800,desc:"Pollo suave, cebolla y morrón.",aliases:["empanada de pollo","empanadas de pollo","de pollo","pollo"]},
  {id:"emp-jyq",category:"Empanadas",name:"Empanada de jamón y queso",price:1900,desc:"Jamón cocido y mozzarella.",aliases:["empanada de jamon y queso","empanadas de jamon y queso","jamon y queso","jyq"]},
  {id:"emp-humita",category:"Empanadas",name:"Empanada de humita",price:1800,desc:"Choclo cremoso y queso.",aliases:["empanada de humita","empanadas de humita","humita"]},
  {id:"pizza-muzza",category:"Pizzas",name:"Pizza muzzarella",price:15000,desc:"Salsa casera, mozzarella y aceitunas.",aliases:["pizza muzzarella","pizza mozzarella","pizza muzza","muzzarella","mozzarella","muzza"]},
  {id:"pizza-especial",category:"Pizzas",name:"Pizza especial",price:18500,desc:"Mozzarella, jamón, morrón y aceitunas.",aliases:["pizza especial","especial"]},
  {id:"mila-napo",category:"Rotisería",name:"Milanesa napolitana con papas",price:14500,desc:"Milanesa, salsa, jamón, mozzarella y papas.",aliases:["milanesa napolitana","mila napolitana","napolitana"]},
  {id:"pollo-spiedo",category:"Rotisería",name:"Pollo al spiedo",price:22000,desc:"Pollo entero dorado, listo para compartir.",aliases:["pollo al spiedo","pollo spiedo","spiedo"]},
  {id:"hamb-completa",category:"Rotisería",name:"Hamburguesa completa",price:11500,desc:"Carne, queso, jamón, huevo, lechuga y tomate.",aliases:["hamburguesa completa","hamburguesa","hambur"]},
  {id:"papas",category:"Guarniciones",name:"Papas fritas grandes",price:6500,desc:"Porción grande para compartir.",aliases:["papas fritas","papas grandes","papas"]},
  {id:"gaseosa",category:"Bebidas",name:"Gaseosa 1,5 L",price:4500,desc:"Cola, lima-limón o naranja.",aliases:["gaseosa 1.5","gaseosa 1,5","gaseosa","cola"]},
  {id:"combo-familiar",category:"Combos",name:"Combo Familiar",price:35500,desc:"1 pizza muzzarella + 6 empanadas + papas grandes + gaseosa 1,5 L.",aliases:["combo familiar","combo"]}
];

const categoryTabs = document.getElementById("categoryTabs");
const menuGrid = document.getElementById("menuGrid");
const cartList = document.getElementById("cartList");
const cartCount = document.getElementById("cartCount");
const navCount = document.getElementById("navCount");
const subtotalEl = document.getElementById("subtotal");
const deliveryCostEl = document.getElementById("deliveryCost");
const grandTotalEl = document.getElementById("grandTotal");
const clearCartBtn = document.getElementById("clearCart");
const registerOrderBtn = document.getElementById("registerOrder");
const customerName = document.getElementById("customerName");
const orderMode = document.getElementById("orderMode");
const orderNotes = document.getElementById("orderNotes");
const chatLog = document.getElementById("chatLog");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const ordersList = document.getElementById("ordersList");
const metricOrders = document.getElementById("metricOrders");
const metricPending = document.getElementById("metricPending");
const metricRevenue = document.getElementById("metricRevenue");
const orderConfirmation = document.getElementById("orderConfirmation");
const agentMode = document.getElementById("agentMode");

let activeCategory = "Todos";
let cart = load(CART_KEY, []);
let isCompleting = false;
let isThinking = false;

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function logEvent(type, data = {}) {
  const events = load(EVENTS_KEY, []);
  events.unshift({ type, data, at: new Date().toISOString() });
  save(EVENTS_KEY, events.slice(0, 100));
}

function money(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9,;+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[c]));
}

function productById(id) {
  return products.find((p) => p.id === id);
}

function totalQty() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function subtotal() {
  return cart.reduce((sum, item) => {
    const product = productById(item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function delivery() {
  return orderMode.value === "delivery" && cart.length ? DELIVERY_PRICE : 0;
}

function total() {
  return subtotal() + delivery();
}

function renderTabs() {
  const categories = ["Todos", ...new Set(products.map((p) => p.category))];
  categoryTabs.innerHTML = categories
    .map((category) => `<button type="button" class="${category === activeCategory ? "active" : ""}" data-category="${category}">${category}</button>`)
    .join("");
}

function renderMenu() {
  const visible = activeCategory === "Todos" ? products : products.filter((p) => p.category === activeCategory);
  menuGrid.innerHTML = visible.map((p) => `
    <article class="menu-card">
      <small>${p.category.toUpperCase()}</small>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="menu-card-foot">
        <strong>${money(p.price)}</strong>
        <button type="button" data-add="${p.id}">Agregar +</button>
      </div>
    </article>
  `).join("");
}

function addItem(id, qty = 1) {
  const product = productById(id);
  if (!product) return;
  qty = Math.max(1, Math.min(99, Number(qty) || 1));
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.qty = Math.min(99, existing.qty + qty);
  else cart.push({ id, qty });
  save(CART_KEY, cart);
  renderCart();
}

function removeItem(id, qty = 1) {
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;
  item.qty -= Math.max(1, Number(qty) || 1);
  if (item.qty <= 0) cart = cart.filter((entry) => entry.id !== id);
  save(CART_KEY, cart);
  renderCart();
}

function changeQty(id, delta) {
  if (delta > 0) addItem(id, delta);
  else removeItem(id, Math.abs(delta));
}

function renderCart() {
  const count = totalQty();
  const hasName = customerName.value.trim().length >= 2;
  cartCount.textContent = count;
  navCount.textContent = count;
  registerOrderBtn.disabled = !cart.length || !hasName || isCompleting;

  if (!cart.length) {
    cartList.innerHTML = '<div class="cart-empty">Todavía no agregaste productos.</div>';
  } else {
    cartList.innerHTML = cart.map((item) => {
      const p = productById(item.id);
      return `
        <div class="cart-line" data-id="${item.id}">
          <div>
            <strong>${p.name}</strong>
            <span>${money(p.price)} c/u · ${money(p.price * item.qty)}</span>
          </div>
          <div class="qty">
            <button type="button" data-delta="-1">−</button>
            <b>${item.qty}</b>
            <button type="button" data-delta="1">+</button>
          </div>
        </div>
      `;
    }).join("");
  }

  subtotalEl.textContent = money(subtotal());
  deliveryCostEl.textContent = money(delivery());
  grandTotalEl.textContent = money(total());
}

function resetCurrentOrder() {
  cart = [];
  save(CART_KEY, cart);
  customerName.value = "";
  orderNotes.value = "";
  orderMode.value = "retiro";
  renderCart();
}

function generateOrderCode(existingOrders) {
  const used = new Set(existingOrders.map((o) => o.id));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = `FS-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!used.has(code)) return code;
  }
  return `FS-${String(Date.now()).slice(-4)}`;
}

function buildMessageFromOrder(order) {
  const lines = order.items.map((item) => {
    const p = productById(item.id);
    return `• ${item.qty} × ${p.name} — ${money(p.price * item.qty)}`;
  });

  return [
    `🔥 FUEGO SUR — PEDIDO ${order.id}`,
    "",
    ...lines,
    "",
    `Productos: ${money(order.subtotal)}`,
    order.mode === "delivery" ? `Delivery: ${money(order.delivery)}` : "Modalidad: Retiro en el local",
    `TOTAL: ${money(order.total)}`,
    `Nombre: ${order.name}`,
    order.notes ? `Aclaraciones: ${order.notes}` : null,
    "",
    `Código del pedido: ${order.id}`,
    order.mode === "retiro" ? "Para retirar, presentá nombre + código." : "Conservá este código para identificar el pedido.",
    "",
    "¿Me lo confirman?"
  ].filter(Boolean).join("\n");
}

function showOrderConfirmation(order) {
  orderConfirmation.hidden = false;
  orderConfirmation.innerHTML = `
    <small>PEDIDO REGISTRADO</small>
    <strong>${escapeHtml(order.id)}</strong>
    <span>A nombre de ${escapeHtml(order.name)}</span>
    <p>${order.mode === "retiro" ? "Guardá este código. Lo vas a presentar junto con tu nombre al retirar." : "Guardá este código para identificar tu pedido."}</p>
  `;
}

function completeOrder() {
  if (!cart.length || isCompleting) return;

  const name = customerName.value.trim();
  if (name.length < 2) {
    customerName.focus();
    addMessage("Antes de confirmar necesito el nombre del pedido.", "system");
    return;
  }

  isCompleting = true;
  renderCart();

  const whatsappWindow = window.open("about:blank", "_blank");
  if (!whatsappWindow) {
    isCompleting = false;
    renderCart();
    addMessage("El navegador bloqueó WhatsApp. Permití ventanas emergentes e intentá confirmar de nuevo.", "system");
    return;
  }

  const orders = load(ORDERS_KEY, []);
  const order = {
    id: generateOrderCode(orders),
    createdAt: new Date().toISOString(),
    status: "pending",
    eta: 30,
    name,
    mode: orderMode.value,
    notes: orderNotes.value.trim(),
    items: cart.map((item) => ({ ...item })),
    subtotal: subtotal(),
    delivery: delivery(),
    total: total()
  };

  orders.unshift(order);
  save(ORDERS_KEY, orders);
  logEvent("order_created", { id: order.id, total: order.total, mode: order.mode });
  renderOrders();

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessageFromOrder(order))}`;
  try { whatsappWindow.opener = null; } catch {}
  whatsappWindow.location.href = whatsappUrl;

  showOrderConfirmation(order);
  resetCurrentOrder();
  isCompleting = false;
  renderCart();
  addMessage(`Pedido ${order.id} confirmado. Guardá ese código para identificarlo.`, "system");
}

categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderTabs();
  renderMenu();
});

menuGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  addItem(button.dataset.add);
  button.textContent = "Agregado ✓";
  setTimeout(() => { button.textContent = "Agregar +"; }, 700);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button || menuGrid.contains(button)) return;
  addItem(button.dataset.add);
});

cartList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delta]");
  const line = event.target.closest("[data-id]");
  if (!button || !line) return;
  changeQty(line.dataset.id, Number(button.dataset.delta));
});

clearCartBtn.addEventListener("click", () => {
  cart = [];
  save(CART_KEY, cart);
  renderCart();
});

customerName.addEventListener("input", renderCart);
orderMode.addEventListener("change", renderCart);
registerOrderBtn.addEventListener("click", completeOrder);

const numberWords = {
  un:1, uno:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6,
  siete:7, ocho:8, nueve:9, diez:10, once:11, doce:12
};

function quantityFromSegment(segment) {
  const digit = segment.match(/\b(\d{1,2})\b/);
  if (digit) return Math.max(1, Math.min(24, Number(digit[1])));
  for (const [word, number] of Object.entries(numberWords)) {
    if (new RegExp(`\\b${word}\\b`).test(segment)) return number;
  }
  return 1;
}

function splitOrderText(text) {
  const protectedText = normalize(text).replace(/jamon y queso/g, "jamon_y_queso");
  return protectedText
    .split(/\s+y\s+|[,;+]/)
    .map((part) => part.replace(/jamon_y_queso/g, "jamon y queso").trim())
    .filter(Boolean);
}

function parseOrderLocally(text) {
  const segments = splitOrderText(text);
  const found = [];
  for (const segment of segments) {
    const qty = quantityFromSegment(segment);
    const matches = products.filter((p) => p.aliases.some((alias) => segment.includes(normalize(alias))));
    if (!matches.length) continue;
    matches.sort((a, b) =>
      Math.max(...b.aliases.map((x) => normalize(x).length)) -
      Math.max(...a.aliases.map((x) => normalize(x).length))
    );
    const chosen = matches[0];
    const existing = found.find((entry) => entry.id === chosen.id);
    if (existing) existing.qty += qty;
    else found.push({ id: chosen.id, qty });
  }
  return found;
}

function localInterpretation(text) {
  const n = normalize(text);
  if (/persona|humano|encargado|reclamo|queja|problema/.test(n)) return { intent:"human", items:[], needs_human:true };
  if (/horario|abierto|cerrado|hora/.test(n)) return { intent:"hours", items:[], needs_human:false };
  if (/delivery|envio|entrega/.test(n)) return { intent:"delivery", items:[], needs_human:false };
  const priceProduct = products.find((p) => p.aliases.some((a) => n.includes(normalize(a))));
  if (priceProduct && /cuanto|precio|sale|valor/.test(n)) return { intent:"price", items:[{product_id:priceProduct.id, quantity:1}], needs_human:false };
  const parsed = parseOrderLocally(text);
  if (parsed.length) return { intent:"order", items:parsed.map((i) => ({product_id:i.id, quantity:i.qty})), needs_human:false };
  if (/menu|carta|venden|tenes|tienen/.test(n)) return { intent:"menu", items:[], needs_human:false };
  if (/hola|buenas|buen dia|buenas tardes|buenas noches/.test(n)) return { intent:"greeting", items:[], needs_human:false };
  return { intent:"unknown", items:[], needs_human:true, question:"No pude identificar el pedido. ¿Podés reformularlo?" };
}

async function interpretWithAI(text) {
  const endpoint = window.ZENIX_AI_CONFIG?.endpoint?.trim();
  if (!endpoint) {
    agentMode.textContent = "Modo respaldo local";
    return localInterpretation(text);
  }

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, "")}/interpret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    if (!response.ok) throw new Error(`AI_HTTP_${response.status}`);
    const data = await response.json();
    if (!data?.ok || !data?.interpretation) throw new Error("AI_INVALID_RESPONSE");
    agentMode.textContent = "IA real · Cloudflare";
    logEvent("ai_interpretation_ok", { intent: data.interpretation.intent });
    return data.interpretation;
  } catch (error) {
    agentMode.textContent = "Respaldo local · IA no disponible";
    logEvent("ai_interpretation_error", { message: String(error?.message || error) });
    return localInterpretation(text);
  }
}

function addMessage(text, type = "bot") {
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function removeTypingMessage() {
  const typing = chatLog.querySelector("[data-typing='true']");
  if (typing) typing.remove();
}

function addTypingMessage() {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.dataset.typing = "true";
  div.textContent = "Interpretando…";
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function respondFromInterpretation(result) {
  const items = Array.isArray(result.items) ? result.items : [];

  if (result.needs_human || result.intent === "human") {
    addMessage("Te derivo a una persona. El canal humano de esta demo es WhatsApp al +54 2901 535229.", "system");
    return;
  }

  if (result.intent === "hours") {
    addMessage("Horario configurado de la demo: todos los días de 12:00 a 15:00 y de 19:00 a 00:00.");
    return;
  }

  if (result.intent === "delivery") {
    addMessage(`El delivery demo cuesta ${money(DELIVERY_PRICE)}. El software lo suma al total cuando elegís Delivery.`);
    return;
  }

  if (result.intent === "price" && items.length) {
    const product = productById(items[0].product_id);
    if (product) addMessage(`${product.name}: ${money(product.price)}.`);
    else addMessage("No encontré ese producto en el catálogo configurado.");
    return;
  }

  if (result.intent === "order" && items.length) {
    const added = [];
    for (const item of items) {
      const product = productById(item.product_id);
      if (!product) continue;
      const qty = Math.max(1, Math.min(24, Number(item.quantity) || 1));
      addItem(product.id, qty);
      added.push(`${qty} × ${product.name}`);
    }
    if (added.length) {
      addMessage(`Perfecto. Agregué ${added.join(", ")}. El pedido ahora suma ${money(total())}${orderMode.value === "delivery" ? " con delivery incluido" : ""}.`);
      return;
    }
  }

  if (result.intent === "remove" && items.length) {
    const removed = [];
    for (const item of items) {
      const product = productById(item.product_id);
      if (!product) continue;
      const qty = Math.max(1, Math.min(24, Number(item.quantity) || 1));
      removeItem(product.id, qty);
      removed.push(`${qty} × ${product.name}`);
    }
    if (removed.length) {
      addMessage(`Listo. Saqué ${removed.join(", ")}. El pedido queda en ${money(total())}.`);
      return;
    }
  }

  if (result.intent === "menu") {
    addMessage("Tenemos empanadas, pizzas, milanesa napolitana, pollo al spiedo, hamburguesa, papas, bebidas y combo familiar.");
    return;
  }

  if (result.intent === "greeting") {
    addMessage("¡Hola! Podés pedirme productos, consultar precios, horarios o delivery.");
    return;
  }

  addMessage(result.question || "No pude interpretar eso con seguridad. Te puedo derivar a una persona.", "system");
}

async function handleChat(text) {
  if (isThinking) return;
  addMessage(text, "user");
  isThinking = true;
  chatInput.disabled = true;
  addTypingMessage();
  const result = await interpretWithAI(text);
  removeTypingMessage();
  respondFromInterpretation(result);
  isThinking = false;
  chatInput.disabled = false;
  chatInput.focus();
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text || isThinking) return;
  chatInput.value = "";
  await handleChat(text);
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => handleChat(button.dataset.prompt));
});

document.getElementById("resetChat").addEventListener("click", () => {
  chatLog.innerHTML = "";
  addMessage("¡Hola! Soy el asistente de Fuego Sur. Podés escribir un pedido como lo harías por WhatsApp.");
});

function statusLabel(status) {
  return {
    pending: "Pendiente",
    accepted: "Aceptado",
    ready: "Listo",
    delivered: "Entregado",
    rejected: "Rechazado"
  }[status] || "Pendiente";
}

function nextActions(order) {
  if (order.status === "pending") {
    return `
      <button data-status="accepted">Aceptar</button>
      <button data-status="rejected">Rechazar</button>
    `;
  }
  if (order.status === "accepted") return '<button data-status="ready">Marcar listo</button><button data-status="rejected">Rechazar</button>';
  if (order.status === "ready") return '<button data-status="delivered">Marcar entregado</button>';
  return "";
}

function renderOrders() {
  const orders = load(ORDERS_KEY, []);
  if (!orders.length) {
    ordersList.innerHTML = '<div class="cart-empty">Todavía no hay pedidos registrados en esta demo.</div>';
  } else {
    ordersList.innerHTML = orders.map((order) => {
      const items = order.items.map((item) => {
        const p = productById(item.id);
        return `${item.qty} × ${p ? p.name : item.id}`;
      }).join(" · ");
      return `
        <article class="order-card" data-order="${escapeHtml(order.id)}">
          <div class="order-top">
            <strong>${escapeHtml(order.id)} · ${escapeHtml(order.name)}</strong>
            <span class="status ${order.status}">${statusLabel(order.status)}</span>
          </div>
          <p>
            ${items}<br>
            ${order.mode === "delivery" ? "Delivery" : "Retiro"} · <b>${money(order.total)}</b>
            ${order.notes ? `<br>${escapeHtml(order.notes)}` : ""}
          </p>
          ${order.status !== "delivered" && order.status !== "rejected" ? `
            <label class="eta-field">Tiempo estimado
              <select data-eta>
                ${[15,30,45,60].map((minutes) => `<option value="${minutes}" ${Number(order.eta) === minutes ? "selected" : ""}>${minutes} min</option>`).join("")}
              </select>
            </label>
          ` : `<div class="closed-note">Pedido cerrado</div>`}
          <div class="order-actions">${nextActions(order)}</div>
        </article>
      `;
    }).join("");
  }

  metricOrders.textContent = orders.length;
  metricPending.textContent = orders.filter((o) => ["pending","accepted","ready"].includes(o.status)).length;
  metricRevenue.textContent = money(
    orders.filter((o) => ["accepted","ready","delivered"].includes(o.status)).reduce((sum, o) => sum + o.total, 0)
  );
}

ordersList.addEventListener("change", (event) => {
  const select = event.target.closest("[data-eta]");
  const card = event.target.closest("[data-order]");
  if (!select || !card) return;
  const orders = load(ORDERS_KEY, []);
  const order = orders.find((o) => o.id === card.dataset.order);
  if (!order) return;
  order.eta = Number(select.value);
  save(ORDERS_KEY, orders);
  logEvent("order_eta_changed", { id: order.id, eta: order.eta });
});

ordersList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status]");
  const card = event.target.closest("[data-order]");
  if (!button || !card) return;
  const orders = load(ORDERS_KEY, []);
  const order = orders.find((o) => o.id === card.dataset.order);
  if (!order) return;
  order.status = button.dataset.status;
  save(ORDERS_KEY, orders);
  logEvent("order_status_changed", { id: order.id, status: order.status, eta: order.eta });
  renderOrders();
});

function initializeAgentMode() {
  agentMode.textContent = window.ZENIX_AI_CONFIG?.endpoint ? "IA real configurada" : "Modo respaldo local";
}

renderTabs();
renderMenu();
renderCart();
renderOrders();
initializeAgentMode();
addMessage("¡Hola! Soy el asistente demo de Fuego Sur. Probá: “2 empanadas de carne y 1 pizza muzzarella”.");
