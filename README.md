# Fuego Sur Rotisería — Demo Zenix Gastronomía

Negocio ficticio creado como demostración comercial de **Zenix AR** siguiendo el Documento Maestro de Zenix Negocio Internacional.

## Arquitectura

**IA conversa; software decide.**

La IA sólo interpreta intención, productos, cantidades y necesidad de derivación humana. Precios, delivery, totales, códigos y estados salen de lógica determinística.

La estrategia de IA es híbrida y prioriza costo cero:

1. El motor local determinístico intenta resolver primero consultas simples y pedidos claros sin usar IA.
2. Si el mensaje requiere interpretación, `local-ai.js` intenta usar **WebLLM** directamente en el navegador con el modelo `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` cuando el dispositivo dispone de WebGPU y recursos suficientes.
3. Si WebLLM no está disponible, falla o queda inseguro, puede usarse **Cloudflare Workers AI** como respaldo si hay un endpoint configurado.
4. Si tampoco hay IA externa disponible, el sistema conserva el parser local y deriva los casos inciertos a una persona.

El proveedor de IA sigue desacoplado: la lógica comercial no depende de WebLLM ni de Cloudflare.

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
- IA local WebLLM cargada sólo cuando hace falta.
- Backend `/worker` preparado como respaldo mediante Cloudflare Workers AI.

## Configuración de IA

`ai-config.js` controla la capa de IA:

```js
window.ZENIX_AI_CONFIG = {
  endpoint: "",
  localAI: {
    enabled: true,
    model: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    webllmVersion: "0.2.85",
    minDeviceMemoryGB: 4
  }
};
```

Con `endpoint: ""`, Cloudflare no se usa. WebLLM puede seguir funcionando completamente en el dispositivo compatible.

Si después se despliega el Worker, se coloca su URL en `endpoint`. Cloudflare entonces queda como respaldo para dispositivos sin WebGPU, fallos del modelo local o interpretaciones inciertas.

La primera carga de WebLLM puede tardar porque el navegador debe descargar y guardar el modelo. Las siguientes cargas pueden reutilizar la caché del navegador.

## Validación

La carpeta `worker/tests` contiene 50 casos de prueba para el contrato de interpretación. La Fase A no se considera cerrada hasta ejecutar y revisar las pruebas integradas correspondientes.

## Aviso

Fuego Sur es un negocio ficticio. Los productos, precios, promociones y horarios fueron creados únicamente para demostrar el funcionamiento del sistema.

## Publicación

Frontend: GitHub Pages desde `main` y `/`.

Backend opcional de respaldo: ver `worker/README.md`.
