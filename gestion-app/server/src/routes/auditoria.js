const express = require('express')
const ctrl = require('../controllers/auditoriaController')
const { authRequired, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Todo el módulo de auditoría es sólo para administrador
router.get('/',         authRequired, requireAdmin, ctrl.listar)
router.get('/opciones', authRequired, requireAdmin, ctrl.opciones)

module.exports = router