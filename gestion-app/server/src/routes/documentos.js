const express = require('express')
const router  = express.Router()
const { upload } = require('../uploads_documentos')
const {
  getDocumentos,
  getDocumento,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
  subirArchivo,
  eliminarArchivo,
  enviarNotificaciones,
} = require('../controllers/documentosController')

router.get('/',                       getDocumentos)
router.get('/:id',                    getDocumento)
router.post('/',                      crearDocumento)
router.patch('/:id',                  actualizarDocumento)
router.delete('/:id',                 eliminarDocumento)
router.post('/:id/archivo',           upload.single('archivo'), subirArchivo)
router.delete('/:id/archivo',         eliminarArchivo)
router.post('/notificar/email',       enviarNotificaciones)

module.exports = router
