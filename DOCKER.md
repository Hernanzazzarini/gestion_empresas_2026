# Docker — GestiónPro

Setup con Docker para **desarrollo** (hot-reload) y **producción** (Nginx + build optimizado).
La base de datos **MySQL es la que ya tenés instalada en tu máquina** — Docker no levanta MySQL;
los contenedores se conectan al host vía `host.docker.internal`.

## Requisitos previos

1. **Docker Desktop** instalado y corriendo.
2. **MySQL** corriendo en tu máquina con la base `gestion_empresa` ya creada (tablas incluidas).
3. El archivo **`gestion-app/server/.env`** completo (copiá de `.env.example` y llenalo).
   Docker lo lee tal cual; **sobrescribe automáticamente `DB_HOST` a `host.docker.internal`**,
   así que no hace falta que cambies el `.env` (dejalo con `DB_HOST=localhost` para correr sin Docker).

> ⚠️ Si tu MySQL sólo escucha en `localhost` y rechaza conexiones externas, habilitá que el
> usuario pueda conectarse desde otras IPs, o que MySQL escuche en `0.0.0.0`. En Docker Desktop
> (Mac/Windows) `host.docker.internal` llega al host sin más configuración.

---

## Desarrollo

```bash
docker compose up --build      # primera vez (build + arranca)
docker compose up              # siguientes veces
docker compose down            # detener
```

- **Client (Vite + HMR):** http://localhost:5173
- **Server (API):** http://localhost:3000
- El código se monta por volumen: **editás y se recarga solo** (nodemon en el server, HMR en el client).
- Las fotos/PDF subidos persisten en `gestion-app/uploads/` (montado en el contenedor).

## Producción

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml down
```

- **App completa:** http://localhost:8080
- El **client** se compila y lo sirve **Nginx**, que además hace de **proxy** hacia `/api` y `/uploads`
  del server. El server **no expone puerto** al host (sólo Nginx lo alcanza por la red interna).
- Por eso en prod el frontend usa **rutas relativas** (se compila con `VITE_API_URL=""`), y todo
  queda en el mismo origen → sin problemas de CORS.

---

## Cómo se resuelve la URL de la API

`client/src/services/config.js` es la fuente única:

```js
export const API_ORIGIN = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
```

- **Dev:** `VITE_API_URL` sin definir → `http://localhost:3000` (el navegador pega directo al server).
- **Prod:** se hornea `VITE_API_URL=""` en el build → URLs relativas (`/api`, `/uploads`) → Nginx proxea.

## Comandos útiles

```bash
docker compose logs -f server        # ver logs del server
docker compose logs -f client        # ver logs del client
docker compose exec server sh        # entrar al contenedor del server
docker compose build --no-cache      # rebuild limpio
```

## Notas

- **Seed del admin:** una vez levantado el server en dev, podés crear/resetear el admin con
  `docker compose exec server npm run seed:admin` (usa `ADMIN_USER`/`ADMIN_PASS` del `.env`).
- **Email/cron:** funcionan igual dentro del contenedor si configuraste las variables `EMAIL_*`.
- **Puertos ocupados:** si ya tenés el server/client corriendo a mano (`npm run dev`), paralos antes
  de `docker compose up` para no chocar con los puertos 3000/5173.
