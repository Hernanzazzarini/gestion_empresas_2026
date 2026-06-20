const express  = require('express')
const router   = express.Router()
const { getLotes, crearLote, reducirEnvases, darDeBajaLote } = require('../controllers/stockController')

router.get('/',              getLotes)
router.post('/',             crearLote)
router.patch('/:id/reducir', reducirEnvases)
router.delete('/:id',        darDeBajaLote)

module.exports = router
