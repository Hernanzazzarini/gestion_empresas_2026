const repo = require('../repositories/auditoriaRepository')
const { MODULOS } = require('../auth/constants')

const formatear = (r) => ({
  id:       r.id,
  usuarioId: r.usuario_id,
  usuario:  r.usuario,
  accion:   r.accion,
  modulo:   r.modulo,
  recurso:  r.recurso,
  metodo:   r.metodo,
  detalle:  r.detalle,
  ip:       r.ip,
  creadoEn: r.creado_en,
})

// Registra un evento. Nunca debe romper el flujo principal: si falla, se loguea y sigue.
const registrar = async (evento) => {
  try {
    await repo.insert({
      usuario_id: evento.usuarioId ?? null,
      usuario:    evento.usuario ?? null,
      accion:     evento.accion ?? null,
      modulo:     evento.modulo ?? null,
      recurso:    evento.recurso ?? null,
      metodo:     evento.metodo ?? null,
      detalle:    evento.detalle ?? null,
      ip:         evento.ip ?? null,
    })
  } catch (e) {
    console.error('[AUDITORIA] No se pudo registrar el evento:', e.message)
  }
}

const listar = async (filtros) => {
  const rows = await repo.findAll(filtros)
  return rows.map(formatear)
}

const opcionesFiltros = async () => ({
  usuarios: await repo.distinctUsuarios(),
  modulos:  MODULOS,
  acciones: ['LOGIN', 'LOGOUT', 'CREAR', 'EDITAR', 'ELIMINAR'],
})

module.exports = { registrar, listar, opcionesFiltros }
