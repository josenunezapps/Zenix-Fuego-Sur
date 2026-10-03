(() => {
  const WHATSAPP_URL = "https://wa.me/542901535229?text=Hola%2C%20quiero%20hablar%20con%20una%20persona.";

  function ensureStyles() {
    if (document.getElementById("zenix-handoff-style")) return;
    const style = document.createElement("style");
    style.id = "zenix-handoff-style";
    style.textContent = `
      .handoff-whatsapp {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 10px;
        padding: 10px 14px;
        border-radius: 999px;
        background: #25D366;
        color: #fff;
        font-weight: 800;
        text-decoration: none;
        line-height: 1;
      }
      .handoff-whatsapp:hover { filter: brightness(.96); }
    `;
    document.head.appendChild(style);
  }

  function enhanceHandoffs() {
    document.querySelectorAll("#chatLog .msg.system").forEach((message) => {
      if (!message.textContent.includes("Te derivo a una persona")) return;
      if (message.querySelector(".handoff-whatsapp")) return;

      const link = document.createElement("a");
      link.className = "handoff-whatsapp";
      link.href = WHATSAPP_URL;
      link.target = "_blank";
      link.rel = "noopener";
      link.setAttribute("aria-label", "Abrir WhatsApp para hablar con una persona");
      link.textContent = "💬 Abrir WhatsApp";
      message.appendChild(document.createElement("br"));
      message.appendChild(link);
    });
  }

  function init() {
    ensureStyles();
    enhanceHandoffs();
    const chatLog = document.getElementById("chatLog");
    if (!chatLog) return;
    new MutationObserver(enhanceHandoffs).observe(chatLog, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
