const cron = require('node-cron')
const { procesarNotificaciones } = require('./controllers/documentosController')

// Ejecuta todos los días a las 8:00 AM (hora Argentina, UTC-3)
// Para cambiar el horario: https://crontab.guru
const HORARIO = process.env.CRON_NOTIFICACIONES || '0 8 * * *'

const iniciarCron = () => {
  cron.schedule(HORARIO, async () => {
    const ahora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
    console.log(`[CRON ${ahora}] Ejecutando notificaciones automáticas de revisión...`)
    try {
      const result = await procesarNotificaciones()
      console.log(`[CRON] ${result.mensaje}`)
    } catch (err) {
      console.error(`[CRON] Error al enviar notificaciones: ${err.message}`)
    }
  }, {
    timezone: 'America/Argentina/Buenos_Aires',
  })

  console.log(`[CRON] Notificaciones automáticas programadas — horario: "${HORARIO}" (America/Argentina/Buenos_Aires)`)
}

module.exports = { iniciarCron }
