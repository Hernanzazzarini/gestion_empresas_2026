import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Home from '../pages/Home'
import OTs from '../pages/Mantenimiento/OTs'
import ReportesOTs from '../pages/Mantenimiento/ReportesOTs'
import Contenedores from '../pages/Logistica/Contenedores'
import StockLotes from '../pages/Logistica/StockLotes'
import ReporteStock from '../pages/Logistica/ReporteStock'
import MapeoDocumentos from '../pages/Inocuidad/MapeoDocumentos'
import Proveedores from '../pages/Proveedores/Proveedores'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/mantenimiento/ots" element={<OTs />} />
          <Route path="/mantenimiento/reportes" element={<ReportesOTs />} />
          <Route path="/logistica/contenedores" element={<Contenedores />} />
          <Route path="/logistica/stock" element={<StockLotes />} />
          <Route path="/logistica/reporte-stock" element={<ReporteStock />} />
          <Route path="/inocuidad/mapeo-documentos" element={<MapeoDocumentos />} />
          <Route path="/proveedores" element={<Proveedores />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}