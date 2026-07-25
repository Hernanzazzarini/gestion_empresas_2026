const multer = require('multer')

// Fotos de contenedores → suben a Cloudinary (ver src/cloudinary.js). Guardamos el
// buffer en memoria y la ruta lo sube; no se escribe a disco (efímero en Render).
const storage = multer.memoryStorage()

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

module.exports = { upload }
