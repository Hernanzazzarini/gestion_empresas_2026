const express              = require('express')
const router               = express.Router()
const path                 = require('path')
const fs                   = require('fs')
const pool                 = require('../db')
const { upload, uploadDir } = require('../uploads')

// POST — subir foto y guardar URL en BD
router.post('/foto/:contenedorId/:numeroFoto', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' })

    const { contenedorId, numeroFoto } = req.params
    const camposPermitidos = ['foto1', 'foto2', 'foto3', 'foto4']
    const campo = `foto${numeroFoto}`

    if (!camposPermitidos.includes(campo)) {
      return res.status(400).json({ error: 'Número de foto inválido' })
    }

    const url = `http://localhost:3000/uploads/contenedores/${req.file.filename}`

    // Verificar si ya existe la sección 2
    const [[existe]] = await pool.query(
      'SELECT id FROM contenedores_seccion2 WHERE contenedor_id = ?',
      [contenedorId]
    )

    if (existe) {
      // Actualizar el campo de la foto
      await pool.query(
        `UPDATE contenedores_seccion2 SET ${campo} = ? WHERE contenedor_id = ?`,
        [url, contenedorId]
      )
    } else {
      // Crear sección 2 con solo la foto
      await pool.query(
        `INSERT INTO contenedores_seccion2 (contenedor_id, ${campo}) VALUES (?, ?)`,
        [contenedorId, url]
      )
    }

    res.json({ url, filename: req.file.filename })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al subir la foto' })
  }
})

// DELETE — eliminar foto y limpiar URL en BD
router.delete('/foto/:contenedorId/:numeroFoto', async (req, res) => {
  try {
    const { contenedorId, numeroFoto } = req.params
    const { filename } = req.body
    const campo = `foto${numeroFoto}`

    // Eliminar archivo físico
    if (filename) {
      const filePath = path.join(uploadDir, filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    // Limpiar URL en BD
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