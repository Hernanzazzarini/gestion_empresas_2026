// Crea (o actualiza) el usuario administrador inicial tomando las credenciales del .env.
//   Uso:  npm run seed:admin
// Requiere ADMIN_USER y ADMIN_PASS en el .env. Es idempotente: si el usuario ya
// existe, sólo re-asegura rol=administrador y (opcionalmente) resetea la contraseña.
require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('./db')

async function main() {
  const usuario = process.env.ADMIN_USER
  const pass    = process.env.ADMIN_PASS
  const nombre  = process.env.ADMIN_NOMBRE || 'Administrador'

  if (!usuario || !pass) {
    console.error('✖ Definí ADMIN_USER y ADMIN_PASS en el .env antes de correr el seed.')
    process.exit(1)
  }

  const hash = await bcrypt.hash(pass, 10)
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario])

  if (rows.length) {
    await pool.query(
      'UPDATE usuarios SET password_hash = ?, nombre = ?, rol = "administrador", activo = 1 WHERE id = ?',
      [hash, nombre, rows[0].id]
    )
    console.log(`✔ Administrador "${usuario}" actualizado (contraseña reseteada).`)
  } else {
    await pool.query(
      'INSERT INTO usuarios (usuario, password_hash, nombre, rol, activo) VALUES (?,?,?,"administrador",1)',
      [usuario, hash, nombre]
    )
    console.log(`✔ Administrador "${usuario}" creado.`)
  }

  await pool.end()
  process.exit(0)
}

main().catch((e) => {
  console.error('✖ Error en el seed:', e.message)
  process.exit(1)
})