const express          = require('express')
const ctrl             = require('../controllers/reclamosController')
const { upload }       = require('../uploads_reclamos')

const router = express.Router()

router.get('/',                              ctrl.listar)
router.post('/',                             ctrl.crear)
router.post('/notificar/email',              ctrl.notificar)
router.get('/:id',                           ctrl.obtener)
router.put('/:id',                           ctrl.actualizar)
router.patch('/:id/estado',                  ctrl.cambiarEstado)
router.post('/:id/adjuntos',                 upload.single('archivo'), ctrl.agregarAdjunto)
router.delete('/:id/adjuntos/:adjuntoId',    ctrl.eliminarAdjunto)
router.delete('/:id',                        ctrl.eliminar)

module.exports = router
