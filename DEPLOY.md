# Deploy — GestiónPro (Vercel + Render + Aiven + Cloudinary)

Arquitectura de producción:

| Pieza | Servicio | Notas |
|-------|----------|-------|
| Frontend (React/Vite) | **Vercel** | build estático + rewrite SPA |
| Backend (Node/Express) | **Render** | Web Service |
| Base de datos (MySQL) | **Aiven** | free tier — requiere **SSL** y **puerto propio** |
| Archivos subidos | **Cloudinary** | el disco de Render es efímero |

> El frontend pega al backend por su URL absoluta de Render (`VITE_API_URL`). Los archivos
> ya no se sirven desde el server: se suben a Cloudinary y se guarda la URL completa en la BD.

---

## 1) Base de datos en Aiven

1. Crear un servicio **MySQL** (plan free) en <https://aiven.io>. Anotar del panel:
   `host`, `port`, `user` (`avnadmin`), `password`, `database` (`defaultdb`).
2. Cargar el esquema. En vez de reconstruir tablas a mano, volcá el esquema local y subilo:
   ```bash
   # estructura (agregá también los datos quitando --no-data si querés migrarlos)
   mysqldump -u root -p --no-data --set-gtid-purged=OFF gestion_empresa > esquema.sql
   mysql -h <host-aiven> -P <port> -u avnadmin -p --ssl-mode=REQUIRED defaultdb < esquema.sql
   ```
3. Crear el admin inicial apuntando a Aiven (una vez que el backend esté configurado, o localmente
   exportando las mismas `DB_*`):
   ```bash
   cd gestion-app/server && npm run seed:admin
   ```

`db.js` ya soporta `DB_PORT` y `DB_SSL=true` (en local, sin esas vars, sigue conectando a
`localhost:3306` sin SSL).

---

## 2) Cloudinary (uploads)

1. Crear cuenta en <https://cloudinary.com>. En el Dashboard copiar el **`CLOUDINARY_URL`**
   (formato `cloudinary://<api_key>:<api_secret>@<cloud_name>`).
2. Esa única variable configura el SDK (la lee `src/cloudinary.js`).
3. Los archivos se guardan bajo la carpeta `gestionpro/<modulo>/` (proveedores, documentos,
   desvios, reclamos, contenedores). Imágenes van como `image`; PDF/DOC/XLS como `raw`.

> PDF: Cloudinary los entrega bien porque se suben con `resource_type: 'raw'`. Si en tu cuenta
> ves PDF bloqueados, es una restricción de entrega de PDF/ZIP en *Settings → Security* (aplica
> sólo a los subidos como `image`, no a los `raw` que usamos acá).

---

## 3) Backend en Render

**Opción A — Blueprint (recomendada):** el repo trae `render.yaml`. En Render → *New → Blueprint*,
elegí el repo; te va a pedir las variables `sync: false`.

**Opción B — manual:** *New → Web Service*, conectar el repo y configurar:
- **Root Directory:** `gestion-app/server`
- **Build Command:** `npm ci`
- **Start Command:** `node index.js`
- **Health Check Path:** `/`

**Variables de entorno** (las mismas en ambas opciones):

```
NODE_ENV=production
DB_HOST=<host-aiven>
DB_PORT=<port-aiven>
DB_USER=avnadmin
DB_PASSWORD=<pass-aiven>
DB_NAME=defaultdb
DB_SSL=true
JWT_SECRET=<cadena-larga-y-secreta>
JWT_EXPIRES=8h
ADMIN_USER=<usuario-admin>
ADMIN_PASS=<clave-admin>
ADMIN_NOMBRE=Administrador
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud>
# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<tu-email>
EMAIL_PASS=<app-password>
EMAIL_FROM=GestiónPro <tu-email>
```

Al terminar, anotá la URL pública (ej. `https://gestionpro-api.onrender.com`) → se usa en Vercel.
`process.env.PORT` lo inyecta Render; CORS ya está abierto (`origin:'*'` + token Bearer).

---

## 4) Frontend en Vercel

En Vercel → *Add New → Project*, importá el repo y configurá:
- **Root Directory:** `gestion-app/client`
- **Framework Preset:** Vite (Build `npm run build`, Output `dist`)
- **Environment Variable:**
  ```
  VITE_API_URL=https://<tu-backend>.onrender.com
  ```
  (URL absoluta de Render, **sin** `/api` y **sin** barra final — `config.js` le agrega `/api`.)

`vercel.json` ya incluye el rewrite SPA para que las rutas profundas de react-router
(`/inocuidad/reclamos`, etc.) no den 404 al refrescar.

Redeploy después de setear la variable (Vite hornea `VITE_API_URL` en build).

---

## 5) Verificación end-to-end

1. Backend: abrir `https://<backend>.onrender.com/` → `{ "mensaje": "API GestiónPro funcionando ✅" }`.
2. Frontend: abrir la URL de Vercel, loguear con el admin sembrado.
3. Subir un adjunto (proveedor / reclamo / desvío / foto de contenedor) → verificar que aparece
   en el **Media Library** de Cloudinary y que se ve en la app.
4. Borrar ese adjunto → confirmar que desaparece de Cloudinary.
5. Refrescar una ruta profunda (F5 en `/inocuidad/reclamos`) → no debe dar 404 (rewrite OK).

---

## Notas / limitaciones

- **Render free duerme** tras ~15 min sin tráfico. La primera request tarda unos segundos
  (cold start) y el **cron in-process de notificaciones no dispara** de forma confiable.
  Alternativas: un **Cron Job** separado en Render que golpee los endpoints `POST /api/.../notificar/email`,
  un ping externo (UptimeRobot) para mantenerlo despierto, o pasar a plan pago.
- **Datos viejos con rutas locales:** las filas creadas antes de esta migración guardaban una ruta
  relativa (`proveedores/x.pdf`); el cliente las sigue resolviendo contra el server, pero esos
  archivos no existen en Render. Sólo afecta a datos previos; los nuevos van a Cloudinary.
- **Migración de archivos existentes** (si querés conservar los que están en `uploads/` local):
  subirlos manualmente a Cloudinary y actualizar los `archivo_path` en la BD, o volver a cargarlos
  desde la app. No hay script automático.
- **Docker** (`DOCKER.md`) sigue sirviendo para correr todo local; con `CLOUDINARY_URL` y las
  `DB_*` de Aiven en el `.env`, el contenedor se comporta igual que producción.
