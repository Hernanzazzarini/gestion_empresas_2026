const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

const uploadDir = path.join(__dirname, '../../uploads/desvios')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext    = path.extname(file.originalname)
    const nombre = `ev_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
    cb(null, nombre)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
    if (permitidos.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)'))
    }
  },
})

module.exports = { upload, uploadDir }
