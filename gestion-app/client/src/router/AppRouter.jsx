import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Home from '../pages/Home'
import OTs from '../pages/Mantenimiento/OTs'
import ReportesOTs from '../pages/Mantenimiento/ReportesOTs'
import Contenedores from '../pages/Logistica/Contenedores'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/mantenimiento/ots" element={<OTs />} />
          <Route path="/mantenimiento/reportes" element={<ReportesOTs />} />
          <Route path="/logistica/contenedores"      element={<Contenedores />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}