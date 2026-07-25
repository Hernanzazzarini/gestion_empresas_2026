// ─────────────────────────────────────────────────────────────────────────────
// Almacenamiento de archivos en Cloudinary
//
// Reemplaza el guardado en disco (efímero en Render). Los services/rutas suben el
// buffer de multer (memoryStorage) y guardan la `secure_url` completa en la misma
// columna que antes tenía la ruta relativa. El borrado parsea el public_id desde
// esa URL, así no hace falta cambiar el esquema.
//
// Config: la env CLOUDINARY_URL (cloudinary://<key>:<secret>@<cloud>) se lee sola.
// ─────────────────────────────────────────────────────────────────────────────
const cloudinary = require('cloudinary').v2

cloudinary.config() // lee CLOUDINARY_URL del entorno

// Sube el buffer y resuelve con la URL pública (https). resource_type:'auto' hace
// que imágenes vayan como 'image' y PDF/DOC/XLS como 'raw' (necesario para servirlos).
const subir = (buffer, carpeta) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `gestionpro/${carpeta}`, resource_type: 'auto' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url)),
    )
    stream.end(buffer)
  })

// Borra en Cloudinary a partir de la URL guardada. Best-effort: si es una ruta
// local vieja o falla el destroy, no rompe el flujo (sólo loguea).
const destruirPorUrl = async (url) => {
  if (!url || !/^https?:\/\//.test(url)) return // fila vieja (ruta local) → nada que borrar
  try {
    const partes  = url.split('/')
    const iUpload = partes.indexOf('upload')
    if (iUpload < 1) return
    const resourceType = partes[iUpload - 1] // image | raw | video
    let resto = partes.slice(iUpload + 1)
    if (/^v\d+$/.test(resto[0])) resto = resto.slice(1) // saltar el segmento de versión (v123…)
    let publicId = resto.join('/')
    if (resourceType !== 'raw') publicId = publicId.replace(/\.[^/.]+$/, '') // sin extensión salvo raw
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
  } catch (e) {
    console.error('[cloudinary] no se pudo borrar', url, e.message)
  }
}

module.exports = { cloudinary, subir, destruirPorUrl }
