// Fuente única de módulos, roles y acciones para permisos/auditoría.

// Módulos sobre los que se asignan permisos (deben coincidir con el mapa de rutas en index.js)
const MODULOS = ['mantenimiento', 'contenedores', 'stock', 'inocuidad', 'desvios', 'reclamos', 'proveedores']

const ROLES = ['administrador', 'mandos_medios', 'operarios']

// Defaults de permisos por rol al crear un usuario (el admin puede ajustarlos luego).
const DEFAULTS_POR_ROL = {
  administrador: { leer: 1, editar: 1, eliminar: 1 }, // el admin además bypasea todo chequeo
  mandos_medios: { leer: 1, editar: 1, eliminar: 0 },
  operarios:     { leer: 1, editar: 0, eliminar: 0 },
}

// HTTP method → acción de permiso
const accionDeMetodo = (metodo) => {
  if (metodo === 'GET') return 'leer'
  if (metodo === 'DELETE') return 'eliminar'
  return 'editar' // POST / PUT / PATCH
}

// Acción → etiqueta para el log de auditoría
const etiquetaAccion = (metodo) => {
  if (metodo === 'DELETE') return 'ELIMINAR'
  if (metodo === 'POST') return 'CREAR'
  return 'EDITAR' // PUT / PATCH
}

module.exports = { MODULOS, ROLES, DEFAULTS_POR_ROL, accionDeMetodo, etiquetaAccion }
