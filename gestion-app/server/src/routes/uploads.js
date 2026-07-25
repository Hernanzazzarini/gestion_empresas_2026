const express              = require('express')
const router               = express.Router()
const pool                 = require('../db')
const { upload }           = require('../uploads')
const { subir, destruirPorUrl } = require('../cloudinary')

const CAMPOS = ['foto1', 'foto2', 'foto3', 'foto4']

// POST — subir foto a Cloudinary y guardar la URL en BD
router.post('/foto/:contenedorId/:numeroFoto', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' })

    const { contenedorId, numeroFoto } = req.params
    const campo = `foto${numeroFoto}`
    if (!CAMPOS.includes(campo)) {
      return res.status(400).json({ error: 'Número de foto inválido' })
    }

    const url = await subir(req.file.buffer, 'contenedores')

    // Verificar si ya existe la sección 2
    const [[existe]] = await pool.query(
      'SELECT id FROM contenedores_seccion2 WHERE contenedor_id = ?',
      [contenedorId]
    )

    if (existe) {
      await pool.query(
        `UPDATE contenedores_seccion2 SET ${campo} = ? WHERE contenedor_id = ?`,
        [url, contenedorId]
      )
    } else {
      await pool.query(
        `INSERT INTO contenedores_seccion2 (contenedor_id, ${campo}) VALUES (?, ?)`,
        [contenedorId, url]
      )
    }

    res.json({ url })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al subir la foto' })
  }
})

// DELETE — borrar foto de Cloudinary y limpiar la URL en BD
router.delete('/foto/:contenedorId/:numeroFoto', async (req, res) => {
  try {
    const { contenedorId, numeroFoto } = req.params
    const campo = `foto${numeroFoto}`
    if (!CAMPOS.includes(campo)) {
      return res.status(400).json({ error: 'Número de foto inválido' })
    }

    // Leer la URL guardada y borrarla de Cloudinary
    const [[fila]] = await pool.query(
      `SELECT ${campo} AS url FROM contenedores_seccion2 WHERE contenedor_id = ?`,
      [contenedorId]
    )
    if (fila?.url) await destruirPorUrl(fila.url)

    await pool.query(
      `UPDATE contenedores_seccion2 SET ${campo} = NULL WHERE contenedor_id = ?`,
      [contenedorId]
    )

    res.json({ ok: true })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar la foto' })
  }
})

module.exports = router
