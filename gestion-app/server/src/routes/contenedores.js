const express    = require('express')
const router     = express.Router()
const {
  getContenedores,
  getContenedor,
  crearContenedor,
  actualizarSeccion1,
  completarSeccion2,
} = require('../controllers/contenedoresController')

router.get('/',              getContenedores)
router.get('/:id',           getContenedor)
router.post('/',             crearContenedor)
router.patch('/:id/sec1',    actualizarSeccion1)
router.patch('/:id/sec2',    completarSeccion2)

module.exports = router