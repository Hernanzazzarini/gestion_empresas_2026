// Configuración del origen de la API (fuente única).
//
// - En desarrollo, VITE_API_URL no está seteada → usa http://localhost:3000
//   (el navegador pega directo al server, que expone el puerto 3000).
// - En producción, la imagen del cliente se compila con VITE_API_URL='' →
//   las URLs quedan relativas (mismo origen) y Nginx hace de proxy hacia
//   /api y /uploads del contenedor del server.
//
// Vite reemplaza import.meta.env.VITE_API_URL en tiempo de build; si no está
// definida vale undefined y cae al default; si vale '' se respeta (rutas relativas).
export const API_ORIGIN = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
export const API_URL = `${API_ORIGIN}/api`
export const UPLOADS_URL = `${API_ORIGIN}/uploads`
