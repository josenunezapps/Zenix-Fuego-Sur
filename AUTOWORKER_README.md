# Zenix AutoWorker Web

Rama independiente para desarrollar Zenix AutoWorker (Cloudflare Workers + D1).

## Estado

Se creó esta rama para no modificar el sitio Fuego del Sur. **La aplicación aún no está publicada ni se han subido a esta rama los archivos completos de la versión 1.0.** Los archivos fuente están disponibles en el ZIP entregado en la conversación.

## Subir el código del ZIP

1. Descargar `Zenix_AutoWorker_Web_v1.0_Cloudflare.zip` desde el chat y extraerlo.
2. Abrir esta rama en GitHub y seleccionar **Add file → Upload files**.
3. Subir desde la carpeta descomprimida: `src/worker.js`, `public/index.html`, `schema.sql`, `package.json`, `wrangler.toml` y `.gitignore` (conservar rutas).
4. Antes de publicar, configurar D1 y el secreto `ADMIN_TOKEN` en Cloudflare siguiendo el README incluido en el ZIP.

No subir contraseñas ni `.env`, `.dev.vars` o `node_modules`. La rama **no es privada**: pertenece a un repositorio público. Una ruta oculta tampoco sustituye la autenticación.

## Arquitectura

- Cloudflare Worker para API autenticada y búsqueda periódica.
- Cloudflare D1 para oportunidades y aprobaciones.
- Archivos estáticos para panel web.
- Ejecutor de programación autónoma: fase posterior (no implementado).

## Advertencia

No se ha vinculado esta rama a un despliegue. No alterar la rama `main` del sitio Fuego del Sur al publicar AutoWorker.
