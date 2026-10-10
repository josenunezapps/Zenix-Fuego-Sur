# Zenix AutoWorker Web — rama independiente

Esta rama contiene una **base funcional** de la versión web en la carpeta `autoworker/`. No altera el sitio Fuego del Sur ni su rama `main`.

## Funciones implementadas
- Panel web responsive.
- API protegida por `ADMIN_TOKEN`.
- Registro y edición de oportunidades, borradores y estados en D1.
- Búsqueda periódica de issues de GitHub (sus pagos **no** se verifican).
- Estados de aprobación: se registran, **no** se envían candidaturas ni entregas.
- Historial de cambios.

**No implementado todavía:** agente autónomo que programe trabajos, postulaciones automáticas, ingresos ni cobros. No se ha desplegado la web.

## Publicar en Cloudflare

1. Descargar el repositorio seleccionando la rama `zenix-autoworker-web` o clonar esa rama.
2. Abrir una terminal en `autoworker/` e instalar Node.js LTS.
3. Ejecutar `npm install` y `npx wrangler login`.
4. Ejecutar `npx wrangler d1 create zenix-autoworker`.
5. Sustituir `REPLACE_WITH_YOUR_D1_DATABASE_ID` en `wrangler.toml` por el ID real.
6. Ejecutar `npm run db:remote`.
7. Ejecutar `npx wrangler secret put ADMIN_TOKEN` e ingresar un secreto único de 32 caracteres o más. **No subirlo a GitHub**.
8. Ejecutar `npm run deploy`.
9. Abrir el enlace de Cloudflare y autenticarse con ese secreto.

Para desarrollo local: `npm run db:local`, definir `ADMIN_TOKEN` en `.dev.vars` y ejecutar `npm run dev`.

El repositorio Fuego del Sur es **público**: la rama también lo es. No colocar secretos ni información privada de clientes en el repositorio. Una ruta oculta no equivale a control de acceso.

Si querés evitar cualquier dependencia del repositorio de Fuego del Sur, más adelante conviene migrar esta carpeta a un repositorio privado exclusivo.
