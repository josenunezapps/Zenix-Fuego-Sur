# Fuego Sur Rotisería — Demo Zenix Gastronomía

Negocio ficticio creado como demostración comercial de **Zenix AR** siguiendo el Documento Maestro de Zenix Negocio Internacional.

## Arquitectura

**IA conversa; software decide.**

La IA sólo interpreta intención, productos, cantidades y necesidad de derivación humana. Precios, delivery, totales, códigos y estados salen de lógica determinística.

La estrategia actual prioriza costo bajo y compatibilidad con cualquier celular o computadora:

1. El motor determinístico de Zenix intenta resolver primero consultas simples y pedidos claros sin usar IA.
2. Sólo cuando el mensaje requiere comprensión adicional se llama al backend de IA.
3. El backend preparado actualmente usa **Cloudflare Workers AI** como proveedor intercambiable.
4. Si la IA externa no está disponible, el sistema conserva el parser local y deriva casos inciertos a una persona.

Se descartó WebLLM en el navegador para no depender de WebGPU, memoria o hardware moderno del cliente o del comercio.

El proveedor de IA sigue desacoplado: la lógica comercial no depende de Cloudflare y puede reemplazarse en el futuro sin rehacer el motor del negocio.

## Incluye

- Web responsive con menú y precios ficticios.
- Carrito único compartido entre menú y asistente.
- Nombre obligatorio antes de confirmar.
- Código de pedido tipo `FS-4827`.
- Limpieza del carrito después de confirmar para evitar duplicados.
- WhatsApp configurado a **+54 2901 535229**.
- Derivación humana.
- Panel con estados `Pendiente → Aceptado → Listo → Entregado` y rechazo.
- Tiempo estimado configurable por el comercio.
- Historial local de pedidos y eventos de diagnóstico.
- Backend `/worker` preparado para interpretación con Cloudflare Workers AI.
- Respaldo local si la IA no está disponible.

## Configuración de IA

`ai-config.js` controla el endpoint remoto:

```js
window.ZENIX_AI_CONFIG = {
  endpoint: ""
};
```

Mientras `endpoint` esté vacío, la demo no consume IA externa y usa únicamente el motor/parser local.

Cuando se despliegue el Worker, se coloca su URL en `endpoint`. A partir de ahí, los mensajes que realmente necesiten interpretación pueden usar la IA remota sin exigir hardware especial al dispositivo del usuario.

## Estrategia inicial de costo

Para la etapa piloto se puede agrupar una cantidad pequeña de negocios por cuenta de Cloudflare y medir el consumo real. La IA debe usarse sólo cuando haga falta; menú, precios, cantidades, carrito, horarios, delivery, totales, confirmación y estados siguen resolviéndose por código normal.

Si un negocio empieza a consumir mucho más que los demás, puede aislarse en su propia cuenta o proveedor sin cambiar el frontend ni el motor comercial.

## Validación

La carpeta `worker/tests` contiene 50 casos de prueba para el contrato de interpretación. La Fase A no se considera cerrada hasta ejecutar y revisar las pruebas integradas correspondientes.

## Aviso

Fuego Sur es un negocio ficticio. Los productos, precios, promociones y horarios fueron creados únicamente para demostrar el funcionamiento del sistema.

## Publicación

Frontend: GitHub Pages desde `main` y `/`.

Backend opcional de IA: ver `worker/README.md`.
