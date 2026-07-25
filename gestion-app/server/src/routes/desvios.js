const express          = require('express')
const ctrl             = require('../controllers/desviosController')
const { upload }       = require('../uploads_desvios')

const router = express.Router()

router.get('/',                                ctrl.listar)
router.post('/',                               ctrl.crear)
router.post('/notificar/email',                ctrl.notificar)
router.get('/:id',                             ctrl.obtener)
router.put('/:id',                             ctrl.actualizar)
router.patch('/:id/estado',                    ctrl.cambiarEstado)
router.post('/:id/evidencias',                 upload.single('archivo'), ctrl.agregarEvidencia)
router.delete('/:id/evidencias/:evidenciaId',  ctrl.eliminarEvidencia)
router.delete('/:id',                          ctrl.eliminar)

module.exports = router
