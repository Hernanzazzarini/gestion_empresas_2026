const multer = require('multer')

// Documentos de proveedores → Cloudinary (buffer en memoria, la sube el service).
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ['application/pdf', 'image/jpeg', 'image/png']
    if (permitidos.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos PDF, JPG o PNG'))
    }
  },
})

module.exports = { upload }
