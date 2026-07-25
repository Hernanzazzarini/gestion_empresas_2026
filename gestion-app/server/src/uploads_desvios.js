const multer = require('multer')

// Evidencias de desvíos → Cloudinary (buffer en memoria, la sube el service).
const storage = multer.memoryStorage()

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

module.exports = { upload }
