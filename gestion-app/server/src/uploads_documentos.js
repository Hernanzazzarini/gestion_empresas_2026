const multer = require('multer')

// Documentos de inocuidad → Cloudinary (buffer en memoria, la sube el service).
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (permitidos.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos PDF, DOC, DOCX, XLS o XLSX'))
    }
  },
})

module.exports = { upload }
