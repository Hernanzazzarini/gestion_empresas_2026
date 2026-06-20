# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**GestiónPro** — internal company management app with two modules:
- **Mantenimiento**: Work orders (OTs) with multi-stage approval (maintenance → inocuidad → solicitante)
- **Logística**: Container loading control with a two-section form and photo uploads + PDF export

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

The server connects via a `mysql2/promise` pool (`gestion-app/server/src/db.js`). There are no migration files — the schema must be created manually. Tables used: `ots`, `contenedores`, `contenedores_seccion1`, `contenedores_seccion2`.

## Architecture

```
gestion-app/
  server/          # Express API (CommonJS)
    index.js       # Entry point, mounts routes, serves /uploads static
    src/
      db.js        # mysql2 pool singleton
      routes/      # ots.js, contenedores.js, uploads.js
      controllers/ # otsController.js, contenedoresController.js
      uploads.js   # multer config (stores to gestion-app/uploads/contenedores/)
  client/          # React 19 + Vite (ESM)
    src/
      router/AppRouter.jsx     # BrowserRouter with MainLayout as shell
      pages/
        Mantenimiento/         # OTs.jsx, FormNuevaOT.jsx, DetalleOT.jsx, ReportesOTs.jsx
        Logistica/             # Contenedores.jsx, DashboardContenedores.jsx,
                               # HistorialContenedores.jsx, FormSeccion1.jsx, FormSeccion2.jsx
                               # ExportarPDF.js (jsPDF + jspdf-autotable)
      services/    # contenedores.js, ots.js, uploads.js — thin fetch wrappers
      components/ui/           # Badge, Button, Card, Input, Modal, Select, Textarea, PrioridadDot
      layouts/MainLayout.jsx   # Shared nav shell
  uploads/contenedores/        # Runtime photo storage (multer destination)
```

## Key conventions

**API base URLs are hardcoded** in `services/` files to `http://localhost:3000`. There is a `VITE_API_URL` env var in `client/.env.example` but it is not yet wired up in the service files.

**DB field naming**: MySQL columns use `snake_case`; the server's `formatear()` function in `otsController.js` converts them to `camelCase` for the frontend. The contenedores controller does not apply this conversion — raw snake_case is returned.

**Container state flow**: `pendiente_carga` → (after sec2 submitted) → `completado`.

**OT ID generation**: sequential counter-based (`OT-001`, `OT-002`…) via `COUNT(*)` — not collision-safe under concurrent inserts.

**File uploads**: multipart POST to `/api/uploads`, stored in `gestion-app/uploads/contenedores/`, served as static files at `/uploads/…` with CORS headers set directly in `server/index.js`.

**UI design tokens** live in `client/src/components/ui/tokens.js` — dark theme palette, `prioridades` array, and `estadoConfig` map. Always import from there for colors and status labels.

**No tests** are configured (server test script just errors out).
