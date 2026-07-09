const cron = require('node-cron')
const { procesarNotificaciones }            = require('./services/documentosService')
const { procesarNotificaciones: procesarNotifProveedores } = require('./services/proveedoresService')

// Ejecuta todos los días a las 8:00 AM (hora Argentina, UTC-3)
// Para cambiar el horario: https://crontab.guru
const HORARIO = process.env.CRON_NOTIFICACIONES || '0 8 * * *'

const iniciarCron = () => {
  cron.schedule(HORARIO, async () => {
    const ahora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
    console.log(`[CRON ${ahora}] Ejecutando notificaciones automáticas...`)
    try {
      const result = await procesarNotificaciones()
      console.log(`[CRON] Documentos inocuidad: ${result.mensaje}`)
    } catch (err) {
      console.error(`[CRON] Error notificaciones documentos: ${err.message}`)
    }
    try {
      const resultProv = await procesarNotifProveedores()
      console.log(`[CRON] Documentos proveedores: ${resultProv.mensaje}`)
    } catch (err) {
      console.error(`[CRON] Error notificaciones proveedores: ${err.message}`)
    }
  }, {
    timezone: 'America/Argentina/Buenos_Aires',
  })

  console.log(`[CRON] Notificaciones automáticas programadas — horario: "${HORARIO}" (America/Argentina/Buenos_Aires)`)
}

module.exports = { iniciarCron }
