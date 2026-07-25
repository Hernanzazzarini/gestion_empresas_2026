import { API_URL } from './config'

const BASE_URL = `${API_URL}/uploads`

export const subirFoto = async (archivo, contenedorId, numeroFoto) => {
  const formData = new FormData()
  formData.append('foto', archivo)

  const res = await fetch(`${BASE_URL}/foto/${contenedorId}/${numeroFoto}`, {
    method: 'POST',
    body:   formData,
  })

  if (!res.ok) throw new Error('Error al subir la foto')
  return res.json()
}

export const eliminarFoto = async (contenedorId, numeroFoto, filename) => {
  const res = await fetch(`${BASE_URL}/foto/${contenedorId}/${numeroFoto}`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ filename }),
  })

  if (!res.ok) throw new Error('Error al eliminar la foto')
  return res.json()
}