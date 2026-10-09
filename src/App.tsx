import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { LayananPage } from './pages/LayananPage';
import { ProfilPage } from './pages/ProfilPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SmkhpView } from './pages/pascapanen/SmkhpView';
import { DashboardEkspor } from './pages/ekspor/DashboardEkspor';
import { DashboardSkp } from './pages/skp/DashboardSkp';
import { DashboardHaccp } from './pages/haccp/DashboardHaccp';
import { PrimerDashboardPage } from './pages/primer/PrimerDashboardPage';
import { ComingSoon } from './pages/common/ComingSoon';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ACCOUNT_NAVIGATION, collectModuleLeaves } from './config/navigation';

/**
 * Peta path -> komponen nyata. Path yang TIDAK ada di sini otomatis dilayani
 * `ComingSoon`.
 *
 * Dipisah dari `navigation.ts` karena arah dependensinya berlawanan: config
 * navigasi tidak boleh tahu-menahu tentang komponen halaman.
 */
const IMPLEMENTED_PAGES: Record<string, React.ComponentType> = {
  '/dashboard': DashboardPage,
  '/layanan': LayananPage,
  '/profil': ProfilPage,
  '/pascapanen/smkhp': SmkhpView,
  '/ekspor': DashboardEkspor,
  '/pascapanen/skp': DashboardSkp,
  '/pascapanen/haccp': DashboardHaccp,
  '/primer': PrimerDashboardPage,
  '/primer/cpib': PrimerDashboardPage,
  '/primer/cbib': PrimerDashboardPage,
  '/primer/cppib': PrimerDashboardPage,
  '/primer/cpoib': PrimerDashboardPage,
  '/primer/cbib-kapal': PrimerDashboardPage,
  '/primer/cdoib': PrimerDashboardPage,
};

/**
 * Seluruh path yang muncul di sidebar, digabung dari navigasi akun dan modul,
 * lalu dipetakan ke komponen. Path yang belum punya komponen dilayani
 * `ComingSoon`, jadi tidak ada menu sidebar yang berakhir di route 404.
 */
const sidebarRoutes = [
  ...ACCOUNT_NAVIGATION,
  ...collectModuleLeaves(),
].map((leaf) => {
  const Page = IMPLEMENTED_PAGES[leaf.path];
  return (
    <Route
      key={leaf.path}
      path={leaf.path}
      element={Page ? <Page /> : <ComingSoon />}
    />
  );
});

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Rute Form Login */}
        <Route path="/login" element={<Login />} />

        {/* Rute Terproteksi (Wajib Login) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {sidebarRoutes}
          </Route>
        </Route>

        {/* Redirect Rute Tak Dikenal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
