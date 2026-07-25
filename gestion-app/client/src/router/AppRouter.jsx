import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MainLayout from '../layouts/MainLayout'
import Login from '../pages/Login'
import Home from '../pages/Home'
import OTs from '../pages/Mantenimiento/OTs'
import ReportesOTs from '../pages/Mantenimiento/ReportesOTs'
import Contenedores from '../pages/Logistica/Contenedores'
import StockLotes from '../pages/Logistica/StockLotes'
import ReporteStock from '../pages/Logistica/ReporteStock'
import MapeoDocumentos from '../pages/Inocuidad/MapeoDocumentos'
import Desvios from '../pages/Inocuidad/Desvios'
import ReportesDesvios from '../pages/Inocuidad/ReportesDesvios'
import Reclamos from '../pages/Inocuidad/Reclamos'
import ReportesReclamos from '../pages/Inocuidad/ReportesReclamos'
import Proveedores from '../pages/Proveedores/Proveedores'
import Usuarios from '../pages/Admin/Usuarios'
import Auditoria from '../pages/Admin/Auditoria'
import { RutaModulo, RutaAdmin } from './guards'

function Splash() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117', display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14,
    }}>
      Cargando...
    </div>
  )
}

export default function AppRouter() {
  const { autenticado, cargando } = useAuth()

  if (cargando) return <Splash />
  if (!autenticado) return <Login />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />

          <Route path="/mantenimiento/ots"      element={<RutaModulo modulo="mantenimiento"><OTs /></RutaModulo>} />
          <Route path="/mantenimiento/reportes" element={<RutaModulo modulo="mantenimiento"><ReportesOTs /></RutaModulo>} />

          <Route path="/logistica/contenedores"  element={<RutaModulo modulo="contenedores"><Contenedores /></RutaModulo>} />
          <Route path="/logistica/stock"         element={<RutaModulo modulo="stock"><StockLotes /></RutaModulo>} />
          <Route path="/logistica/reporte-stock" element={<RutaModulo modulo="stock"><ReporteStock /></RutaModulo>} />

          <Route path="/inocuidad/mapeo-documentos" element={<RutaModulo modulo="inocuidad"><MapeoDocumentos /></RutaModulo>} />
          <Route path="/inocuidad/desvios"          element={<RutaModulo modulo="desvios"><Desvios /></RutaModulo>} />
          <Route path="/inocuidad/desvios/reportes" element={<RutaModulo modulo="desvios"><ReportesDesvios /></RutaModulo>} />
          <Route path="/inocuidad/reclamos"          element={<RutaModulo modulo="reclamos"><Reclamos /></RutaModulo>} />
          <Route path="/inocuidad/reclamos/reportes" element={<RutaModulo modulo="reclamos"><ReportesReclamos /></RutaModulo>} />

          <Route path="/proveedores" element={<RutaModulo modulo="proveedores"><Proveedores /></RutaModulo>} />

          <Route path="/admin/usuarios"  element={<RutaAdmin><Usuarios /></RutaAdmin>} />
          <Route path="/admin/auditoria" element={<RutaAdmin><Auditoria /></RutaAdmin>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}