const WHATSAPP_NUMBER = "542901535229";
const CART_KEY = "fuego-sur-cart-v1";
const ORDERS_KEY = "fuego-sur-orders-v1";
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

const categoryTabs=document.getElementById("categoryTabs");
const menuGrid=document.getElementById("menuGrid");
const cartList=document.getElementById("cartList");
const cartCount=document.getElementById("cartCount");
const navCount=document.getElementById("navCount");
const subtotalEl=document.getElementById("subtotal");
const deliveryCostEl=document.getElementById("deliveryCost");
const grandTotalEl=document.getElementById("grandTotal");
const clearCartBtn=document.getElementById("clearCart");
const registerOrderBtn=document.getElementById("registerOrder");
const sendWhatsappBtn=document.getElementById("sendWhatsapp");
const customerName=document.getElementById("customerName");
const orderMode=document.getElementById("orderMode");
const orderNotes=document.getElementById("orderNotes");
const chatLog=document.getElementById("chatLog");
const chatForm=document.getElementById("chatForm");
const chatInput=document.getElementById("chatInput");
const ordersList=document.getElementById("ordersList");
const metricOrders=document.getElementById("metricOrders");
const metricPending=document.getElementById("metricPending");
const metricRevenue=document.getElementById("metricRevenue");

let activeCategory="Todos";
let cart=load(CART_KEY,[]);

function load(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));return value??fallback}catch{return fallback}}
function save(key,value){localStorage.setItem(key,JSON.stringify(value))}
function money(value){return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(value)}
function normalize(value){return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9,;+\s]/g," ").replace(/\s+/g," ").trim()}
function productById(id){return products.find(p=>p.id===id)}
function totalQty(){return cart.reduce((sum,i)=>sum+i.qty,0)}
function subtotal(){return cart.reduce((sum,i)=>{const p=productById(i.id);return sum+(p?p.price*i.qty:0)},0)}
function delivery(){return orderMode.value==="delivery"&&cart.length?DELIVERY_PRICE:0}
function total(){return subtotal()+delivery()}

function renderTabs(){
  const cats=["Todos",...new Set(products.map(p=>p.category))];
  categoryTabs.innerHTML=cats.map(c=>`<button type="button" class="${c===activeCategory?"active":""}" data-category="${c}">${c}</button>`).join("");
}
function renderMenu(){
  const visible=activeCategory==="Todos"?products:products.filter(p=>p.category===activeCategory);
  menuGrid.innerHTML=visible.map(p=>`<article class="menu-card"><small>${p.category.toUpperCase()}</small><h3>${p.name}</h3><p>${p.desc}</p><div class="menu-card-foot"><strong>${money(p.price)}</strong><button type="button" data-add="${p.id}">Agregar +</button></div></article>`).join("");
}
function addItem(id,qty=1){
  const product=productById(id);if(!product)return;
  qty=Math.max(1,Math.min(99,Number(qty)||1));
  const existing=cart.find(i=>i.id===id);
  if(existing)existing.qty=Math.min(99,existing.qty+qty);else cart.push({id,qty});
  save(CART_KEY,cart);renderCart();
}
function changeQty(id,delta){
  const item=cart.find(i=>i.id===id);if(!item)return;
  item.qty+=delta;if(item.qty<=0)cart=cart.filter(i=>i.id!==id);else item.qty=Math.min(99,item.qty);
  save(CART_KEY,cart);renderCart();
}
function renderCart(){
  const count=totalQty();cartCount.textContent=count;navCount.textContent=count;
  registerOrderBtn.disabled=!cart.length;sendWhatsappBtn.disabled=!cart.length;
  if(!cart.length){cartList.innerHTML='<div class="cart-empty">Todavía no agregaste productos.</div>'}else{
    cartList.innerHTML=cart.map(i=>{const p=productById(i.id);return `<div class="cart-line" data-id="${i.id}"><div><strong>${p.name}</strong><span>${money(p.price)} c/u · ${money(p.price*i.qty)}</span></div><div class="qty"><button type="button" data-delta="-1">−</button><b>${i.qty}</b><button type="button" data-delta="1">+</button></div></div>`}).join("");
  }
  subtotalEl.textContent=money(subtotal());deliveryCostEl.textContent=money(delivery());grandTotalEl.textContent=money(total());
}

categoryTabs.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;activeCategory=b.dataset.category;renderTabs();renderMenu()});
menuGrid.addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(!b)return;addItem(b.dataset.add);b.textContent="Agregado ✓";setTimeout(()=>b.textContent="Agregar +",700)});
document.addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(!b||menuGrid.contains(b))return;addItem(b.dataset.add)});
cartList.addEventListener("click",e=>{const b=e.target.closest("[data-delta]"),line=e.target.closest("[data-id]");if(!b||!line)return;changeQty(line.dataset.id,Number(b.dataset.delta))});
clearCartBtn.addEventListener("click",()=>{cart=[];save(CART_KEY,cart);renderCart()});
orderMode.addEventListener("change",renderCart);

function buildMessage(){
  const lines=cart.map(i=>{const p=productById(i.id);return `• ${i.qty} × ${p.name} — ${money(p.price*i.qty)}`});
  return ["Hola Fuego Sur, quiero hacer este pedido:","",...lines,"",`Productos: ${money(subtotal())}`,orderMode.value==="delivery"?`Delivery: ${money(DELIVERY_PRICE)}`:"Modalidad: Retiro en el local",`TOTAL: ${money(total())}`,customerName.value.trim()?`Nombre: ${customerName.value.trim()}`:null,orderNotes.value.trim()?`Aclaraciones: ${orderNotes.value.trim()}`:null,"","¿Me lo confirman?"].filter(Boolean).join("\n")
}
function sendWhatsapp(){if(!cart.length)return;window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`,"_blank","noopener")}
sendWhatsappBtn.addEventListener("click",sendWhatsapp);

function registerOrder(){
  if(!cart.length)return;
  const orders=load(ORDERS_KEY,[]);
  const order={id:`FS-${Date.now().toString(36).slice(-6).toUpperCase()}`,createdAt:new Date().toISOString(),status:"pending",name:customerName.value.trim()||"Cliente demo",mode:orderMode.value,notes:orderNotes.value.trim(),items:cart.map(i=>({...i})),subtotal:subtotal(),delivery:delivery(),total:total()};
  orders.unshift(order);save(ORDERS_KEY,orders);renderOrders();
  addMessage(`Pedido ${order.id} registrado por ${money(order.total)}. Ahora aparece en el panel del negocio.`,"system");
}
registerOrderBtn.addEventListener("click",registerOrder);

const numberWords={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12};
function quantityFromSegment(segment){
  const digit=segment.match(/\b(\d{1,2})\b/);if(digit)return Math.max(1,Math.min(24,Number(digit[1])));
  for(const [word,n] of Object.entries(numberWords)){if(new RegExp(`\\b${word}\\b`).test(segment))return n}
  return 1;
}
function splitOrderText(text){
  let s=normalize(text).replace(/jamon y queso/g,"jamon_y_queso");
  return s.split(/\s+y\s+|[,;+]/).map(part=>part.replace(/jamon_y_queso/g,"jamon y queso").trim()).filter(Boolean)
}
function parseOrder(text){
  const segments=splitOrderText(text),found=[];
  for(const segment of segments){
    const qty=quantityFromSegment(segment);
    const matches=products.filter(p=>p.aliases.some(a=>segment.includes(normalize(a))));
    if(!matches.length)continue;
    matches.sort((a,b)=>Math.max(...b.aliases.map(x=>normalize(x).length))-Math.max(...a.aliases.map(x=>normalize(x).length)));
    const chosen=matches[0];
    const existing=found.find(f=>f.id===chosen.id);if(existing)existing.qty+=qty;else found.push({id:chosen.id,qty});
  }
  return found
}

function addMessage(text,type="bot"){
  const div=document.createElement("div");div.className=`msg ${type}`;div.textContent=text;chatLog.appendChild(div);chatLog.scrollTop=chatLog.scrollHeight
}
function handleChat(text){
  addMessage(text,"user");const n=normalize(text);
  if(/persona|humano|encargado|reclamo|queja|problema/.test(n)){addMessage("Te derivo a una persona. En esta demo, el canal humano es WhatsApp al +54 2901 535229.","system");return}
  if(/horario|abierto|cerrado|hora/.test(n)){addMessage("Horario configurado de la demo: todos los días de 12:00 a 15:00 y de 19:00 a 00:00.");return}
  if(/delivery|envio|entrega/.test(n)){addMessage(`El delivery demo cuesta ${money(DELIVERY_PRICE)}. Si elegís Delivery en el pedido, se suma automáticamente al total.`);return}
  const parsed=parseOrder(text);
  if(parsed.length){parsed.forEach(i=>addItem(i.id,i.qty));const detail=parsed.map(i=>{const p=productById(i.id);return `${i.qty} × ${p.name}`}).join(", ");addMessage(`Perfecto. Agregué ${detail}. El pedido ahora suma ${money(total())}${orderMode.value==="delivery"?" con delivery incluido":""}.`);return}
  const product=products.find(p=>p.aliases.some(a=>n.includes(normalize(a))));
  if(product&&/cuanto|precio|sale|valor/.test(n)){addMessage(`${product.name}: ${money(product.price)}.`);return}
  if(/menu|carta|venden|tenes|tienen/.test(n)){addMessage("Tenemos empanadas, pizzas, milanesa napolitana, pollo al spiedo, hamburguesa, papas, bebidas y combo familiar. Podés pedirme cantidades directamente.");return}
  if(/hola|buenas|buen dia|buenas tardes|buenas noches/.test(n)){addMessage("¡Hola! Soy el asistente demo de Fuego Sur. Podés pedirme productos, consultar precios, horarios o delivery.");return}
  addMessage("No pude identificar el pedido. Probá por ejemplo: “2 empanadas de carne y 1 pizza muzzarella”.")
}
chatForm.addEventListener("submit",e=>{e.preventDefault();const text=chatInput.value.trim();if(!text)return;chatInput.value="";handleChat(text)});
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>handleChat(b.dataset.prompt)));
document.getElementById("resetChat").addEventListener("click",()=>{chatLog.innerHTML="";addMessage("¡Hola! Soy el asistente de Fuego Sur. Probá escribiendo un pedido como lo harías por WhatsApp.")});

function renderOrders(){
  const orders=load(ORDERS_KEY,[]);
  if(!orders.length){ordersList.innerHTML='<div class="cart-empty">Todavía no hay pedidos registrados en esta demo.</div>'}else{
    ordersList.innerHTML=orders.map(o=>{const items=o.items.map(i=>{const p=productById(i.id);return `${i.qty} × ${p?p.name:i.id}`}).join(" · ");return `<article class="order-card" data-order="${o.id}"><div class="order-top"><strong>${o.id} · ${o.name}</strong><span class="status ${o.status}">${o.status==="accepted"?"Aceptado":o.status==="rejected"?"Rechazado":"Pendiente"}</span></div><p>${items}<br>${o.mode==="delivery"?"Delivery":"Retiro"} · <b>${money(o.total)}</b>${o.notes?`<br>${o.notes}`:""}</p><div class="order-actions"><button data-status="accepted">Aceptar</button><button data-status="rejected">Rechazar</button></div></article>`}).join("")
  }
  metricOrders.textContent=orders.length;metricPending.textContent=orders.filter(o=>o.status==="pending").length;metricRevenue.textContent=money(orders.filter(o=>o.status==="accepted").reduce((s,o)=>s+o.total,0))
}
ordersList.addEventListener("click",e=>{const b=e.target.closest("[data-status]"),card=e.target.closest("[data-order]");if(!b||!card)return;const orders=load(ORDERS_KEY,[]),o=orders.find(x=>x.id===card.dataset.order);if(!o)return;o.status=b.dataset.status;save(ORDERS_KEY,orders);renderOrders()});

renderTabs();renderMenu();renderCart();renderOrders();addMessage("¡Hola! Soy el asistente demo de Fuego Sur. Probá: “2 empanadas de carne y 1 pizza muzzarella”.");
