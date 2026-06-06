const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

// Crear carpeta si no existe
const uploadDir = path.join(__dirname, '../../uploads/contenedores')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext       = path.extname(file.originalname)
    const nombre    = `foto_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
    cb(null, nombre)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp']
    if (permitidos.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'))
    }
  },
})

module.exports = { upload, uploadDir }