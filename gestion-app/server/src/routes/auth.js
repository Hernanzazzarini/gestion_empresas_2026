const express = require('express')
const ctrl = require('../controllers/authController')
const { authRequired, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Público
router.post('/login', ctrl.login)

// Sesión propia (cualquier usuario autenticado)
router.post('/logout', authRequired, ctrl.logout)
router.get('/me',      authRequired, ctrl.me)

// Gestión de usuarios y permisos — sólo administrador
router.get('/usuarios',              authRequired, requireAdmin, ctrl.listarUsuarios)
router.post('/usuarios',             authRequired, requireAdmin, ctrl.crearUsuario)
router.patch('/usuarios/:id',        authRequired, requireAdmin, ctrl.actualizarUsuario)
router.patch('/usuarios/:id/password', authRequired, requireAdmin, ctrl.cambiarPassword)
router.delete('/usuarios/:id',       authRequired, requireAdmin, ctrl.eliminarUsuario)
router.put('/usuarios/:id/permisos', authRequired, requireAdmin, ctrl.actualizarPermisos)

module.exports = router