const multer = require('multer')

// Adjuntos de reclamos (imágenes + PDF) → Cloudinary (buffer en memoria, lo sube el service).
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg',
      'application/pdf',
    ]
    if (permitidos.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP) o PDF'))
    }
  },
})

module.exports = { upload }
