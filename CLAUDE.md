# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**GestiónPro** — internal company management app organized into modules (each a folder under `client/src/pages/` + a `/api/*` route group on the server):
- **Mantenimiento**: Work orders (OTs) with multi-stage approval (maintenance → inocuidad → solicitante)
- **Logística**: Container loading control (two-section form + photo uploads + PDF export) and stock/lote inventory management
- **Inocuidad**: Document mapping (`Mapeo de Documentos`) — vigente/obsoleto document registry with revision-date email alerts
- **Proveedores**: Supplier registry with attached documents and expiry email alerts

## Running the project

Both processes must run simultaneously.

**Server** (Node.js/Express, port 3000):
```bash
cd gestion-app/server
npm run dev      # nodemon index.js
```

**Client** (React/Vite, port 5173):
```bash
cd gestion-app/client
npm run dev
npm run build
npm run lint     # eslint
```

## Database setup

MySQL database named `gestion_empresa`. Copy and fill the env file before starting the server:
```bash
cp gestion-app/server/.env.example gestion-app/server/.env
```

Required env vars: `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

The server connects via a `mysql2/promise` pool (`gestion-app/server/src/db.js`). There are **no migrations** — the schema is created manually. Tables: `ots`, `contenedores`, `contenedores_seccion1`, `contenedores_seccion2`, `stock_lotes`, `documentos_inocuidad`, `proveedores`, `proveedores_documentos`.

The only committed SQL file is `server/sql/proveedores.sql` (creates the two `proveedores*` tables). Run it directly:
```bash
mysql -u root -p gestion_empresa < gestion-app/server/sql/proveedores.sql
```
The `stock_lotes` and `documentos_inocuidad` tables have no committed DDL — infer their columns from the repositories (`stockRepository.js`, `documentosRepository.js`), where all SQL now lives, if you need to recreate them.

### Email notifications (optional)

The Inocuidad and Proveedores modules send expiry-alert emails via `nodemailer`. Configure `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` in `.env` (see `.env.example`). If unset, notification calls throw "Servidor de correo no configurado" (HTTP 503) and the cron logs an error but the server still runs.

## Architecture

**Server — layered per module.** Each route group is a vertical slice split into four layers, so a request flows:

```
routes/<x>.js → controllers/<x>Controller.js → services/<x>Service.js → repositories/<x>Repository.js → db.js
  (endpoints)    (HTTP only, thin)              (business + validation)   (all SQL + transactions)      (pool)
```

- **controller** — extracts request data, calls the service, sends the response. Wrapped in `asyncHandler`; no `try/catch`, no SQL.
- **service** — validation, business rules, snake↔camel mapping, file cleanup, email. Throws `AppError` (never touches `res`). No SQL.
- **repository** — the *only* layer with SQL. Returns raw rows / ids. Owns transaction helpers (`withTransaction`) where needed (`stock`, `contenedores`).

Errors bubble up to a single `middleware/errorHandler.js` (see conventions). To add a feature, mirror the four layers and mount the route in `server/index.js`. On the **client**, a slice is `services/<x>.js` (fetch wrapper) → `pages/<Module>/`.

```
gestion-app/
  server/          # Express API (CommonJS)
    index.js       # Entry point, mounts /api/* routes, serves /uploads static, starts cron, mounts errorHandler last
    sql/           # proveedores.sql (only committed DDL)
    src/
      db.js        # mysql2 pool singleton
      cron.js      # node-cron daily job (8am ART) → runs both notification processors (imported from services)
      routes/      # ots, contenedores, uploads, stock, documentos, proveedores
      controllers/ # thin HTTP layer, one per route group (uploads has no service/repo — see note)
      services/    # business logic, one per route group (ots, contenedores, stock, documentos, proveedores)
      repositories/# SQL access, one per route group (same set); owns transactions
      middleware/  # errorHandler.js — AppError, asyncHandler, errorHandler
      uploads.js               # multer → uploads/contenedores/  (photos: images)
      uploads_documentos.js    # multer → uploads/documentos/    (PDF/DOC/DOCX/XLS/XLSX, 20MB)
      uploads_proveedores.js   # multer → uploads/proveedores/   (PDF/JPG/PNG, 20MB)
  client/          # React 19 + Vite (ESM)
    src/
      router/AppRouter.jsx     # BrowserRouter with MainLayout as shell
      pages/
        Mantenimiento/         # OTs, FormNuevaOT, DetalleOT, ReportesOTs
        Logistica/             # Contenedores, DashboardContenedores, HistorialContenedores,
                               # FormSeccion1/2, StockLotes, ReporteStock, ExportarPDF.js (jsPDF)
        Inocuidad/             # MapeoDocumentos.jsx
        Proveedores/           # Proveedores.jsx
      services/    # ots, contenedores, uploads, stock, documentos, proveedores — thin fetch wrappers
      components/ui/           # Badge, Button, Card, Input, Modal, Select, Textarea, PrioridadDot
      layouts/MainLayout.jsx   # Shared nav shell
  uploads/{contenedores,documentos,proveedores}/   # Runtime upload storage (multer, auto-created)
```

## Key conventions

**Error handling**: services/repositories throw `AppError(message, statusCode)` (from `middleware/errorHandler.js`) instead of touching `res`. Controllers are wrapped in `asyncHandler` so rejections flow to the central `errorHandler`, mounted last in `index.js`. The handler returns `{ error }`: for `AppError` (any status, incl. 503) it uses the message; for unexpected errors it logs and returns a generic `500` (never leaks internals). Don't reintroduce per-handler `try/catch` — throw an `AppError`.

**Layering rule**: no SQL outside `repositories/`; no `res`/HTTP outside `controllers/`; business logic and validation in `services/`. The **exception is `uploads`** (`controllers/uploads` + `routes/uploads`), which was not refactored and stays self-contained.

**API base URLs are hardcoded** in each client `services/*.js` file as `const BASE_URL = 'http://localhost:3000/api/<group>'`. There is a `VITE_API_URL` env var in `client/.env.example` but it is not yet wired up in the service files.

**DB field naming**: MySQL columns use `snake_case`. Conversion to `camelCase` happens in the **service** via a local `formatear()` helper — `otsService`, `documentosService`, and `proveedoresService` convert; **`contenedoresService` and `stockService` return raw `snake_case`**. Match the service you're editing.

**Container state flow**: `pendiente_carga` → (after sec2 submitted) → `completado`.

**OT ID generation**: sequential counter-based (`OT-001`, `OT-002`…) via `COUNT(*)` in `otsService.generarId` — not collision-safe under concurrent inserts.

**Document uniqueness (Inocuidad)**: at most one `vigente` + one `obsoleto` per `codigo`. Creating/promoting a `vigente` auto-demotes the prior vigente to obsoleto and deletes any existing obsoleto — this business logic lives in `documentosService` create/update.

**Stock lotes**: soft-deleted (`activo = 0`, never hard-deleted). `stockService.reducirEnvases` validates first, then runs a `SELECT … FOR UPDATE` transaction (via `repository.withTransaction`) and auto-bajas the lote when stock hits 0. Kilos/toneladas are computed in SQL (`stock_envases * kilos_por_unidad`), not stored.

**Expiry notifications**: `documentosService` and `proveedoresService` each export `procesarNotificaciones(forzar)`. `forzar=false` (cron) sends once per item then sets `notificacion_enviada=1`; changing the due date resets that flag. `forzar=true` (manual `POST /api/{documentos,proveedores}/notificar/email`) re-sends regardless. `cron.js` imports both from the services and runs them daily at 8am `America/Argentina/Buenos_Aires` (override with `CRON_NOTIFICACIONES`).

**File uploads**: three separate multer configs (see tree) with distinct destinations, filename prefixes, and MIME whitelists. Services store a **relative** `archivo_path` (e.g. `proveedores/<file>`) and resolve the physical path as `../../../uploads/<archivo_path>` for deletion (from `services/`, same depth as `controllers/`). All are served statically at `/uploads/…` with CORS headers set in `server/index.js`.

**UI design tokens** live in `client/src/components/ui/tokens.js` — dark theme palette, `prioridades` array, and `estadoConfig` map. Always import from there for colors and status labels.

**No tests** are configured yet (server `test` script just errors out). The layered split makes `services/` unit-testable in isolation by mocking the matching repository (its methods are called on the shared module object), with no DB or Express needed — no runner is wired up though.
