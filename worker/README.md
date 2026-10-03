# Zenix Fuego Sur — AI Worker

Backend de interpretación de lenguaje para la demo Zenix Gastronomía.

## Regla arquitectónica

La IA **no** calcula precios, descuentos, stock, horarios, zonas, disponibilidad, totales ni estados. Sólo devuelve intención, productos/cantidades detectados y si hace falta derivación humana.

El frontend aplica después el catálogo y las reglas determinísticas.

## Endpoints

- `GET /health`
- `POST /interpret`

Ejemplo de entrada:

```json
{"message":"Quiero 2 empanadas de carne y 1 pizza muzzarella"}
```

Ejemplo de salida:

```json
{
  "ok": true,
  "interpretation": {
    "intent": "order",
    "items": [
      {"product_id":"emp-carne","quantity":2},
      {"product_id":"pizza-muzza","quantity":1}
    ],
    "needs_human": false,
    "question": null
  }
}
```

## Cloudflare

El proyecto usa un binding `AI` y actualmente selecciona el proveedor `cloudflare`. El proveedor está encapsulado en `src/providers/` para poder reemplazarlo sin cambiar el motor del negocio.

Despliegue con Wrangler:

```bash
npm install
npx wrangler login
npm run deploy
```

Después copiar la URL del Worker y colocarla en `/ai-config.js`:

```js
window.ZENIX_AI_CONFIG = {
  endpoint: "https://TU-WORKER.workers.dev"
};
```

Nunca guardar tokens o secretos en el repositorio.
