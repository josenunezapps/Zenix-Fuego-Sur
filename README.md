# Fuego Sur Rotisería — Demo Zenix Gastronomía

Negocio ficticio creado como demostración comercial de **Zenix AR** siguiendo el Documento Maestro de Zenix Negocio Internacional.

## Arquitectura

**IA conversa; software decide.**

La IA sólo interpreta intención, productos, cantidades y necesidad de derivación humana. Precios, delivery, totales, códigos y estados salen de lógica determinística.

El proveedor de IA está desacoplado. La primera implementación preparada es **Cloudflare Workers AI**, pero puede reemplazarse sin rehacer el motor del negocio.

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
- Backend `/worker` preparado para una IA real mediante Cloudflare Workers AI.
- Respaldo local si la IA no está disponible.

## Estado de IA

El backend de IA ya está en el repositorio, pero la IA real sólo queda activa cuando el Worker se despliega y su URL se configura en `ai-config.js`.

Mientras `ai-config.js` tenga `endpoint: ""`, la web informa **Modo respaldo local** y no pretende estar usando IA externa.

## Aviso

Fuego Sur es un negocio ficticio. Los productos, precios, promociones y horarios fueron creados únicamente para demostrar el funcionamiento del sistema.

## Publicación

Frontend: GitHub Pages desde `main` y `/`.

Backend de IA: ver `worker/README.md`.
