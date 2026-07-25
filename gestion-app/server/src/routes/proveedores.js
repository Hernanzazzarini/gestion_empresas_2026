const express = require('express')
const router  = express.Router()
const { upload } = require('../uploads_proveedores')
const {
  getProveedores,
  getProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
  crearDocumento,
  actualizarDocumento,
  eliminarDocumento,
  enviarNotificaciones,
} = require('../controllers/proveedoresController')

// Notificaciones (disparo manual)
router.post('/notificar/email', enviarNotificaciones)

// Documentos adjuntos (multipart)
router.post('/:id/documentos',        upload.single('archivo'), crearDocumento)
router.patch('/documentos/:docId',    upload.single('archivo'), actualizarDocumento)
router.delete('/documentos/:docId',   eliminarDocumento)

// Proveedores (JSON)
router.get('/',        getProveedores)
router.get('/:id',     getProveedor)
router.post('/',       crearProveedor)
router.patch('/:id',   actualizarProveedor)
router.delete('/:id',  eliminarProveedor)

module.exports = router