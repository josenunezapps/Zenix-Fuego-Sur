window.ZENIX_AI_CONFIG = {
  endpoint: "https://zenix-fuego-sur.josene242.workers.dev"
};

// Indicador visual discreto mientras el asistente procesa una consulta.
// Oculta el texto técnico interno y muestra puntos, como un chat normal.
(() => {
  const style = document.createElement("style");
  style.textContent = `
    [data-typing="true"] {
      font-size: 0 !important;
    }
    [data-typing="true"]::after {
      content: "•••";
      font-size: 16px;
      letter-spacing: 4px;
      animation: zenixTypingPulse 1s ease-in-out infinite;
    }
    @keyframes zenixTypingPulse {
      0%, 100% { opacity: .35; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();
