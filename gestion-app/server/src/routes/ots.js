const express    = require('express')
const router     = express.Router()
const {
  getOTs,
  getOT,
  crearOT,
  actualizarOT,
} = require('../controllers/otsController')

router.get('/',     getOTs)
router.get('/:id',  getOT)
router.post('/',    crearOT)
router.patch('/:id', actualizarOT)

module.exports = router