import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AlignLeft, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Sidebar } from '../components/layout/Sidebar';

const SIDEBAR_COLLAPSED_KEY = 'bppmhkp:sidebar-collapsed';

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Overlay Backdrop Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#0F2942] p-4 text-white shadow-2xl shadow-slate-950/30 transform transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Header Sidebar */}
        <div
          className={`relative mb-6 flex flex-col px-2 ${
            isCollapsed ? 'md:items-center md:px-0' : ''
          }`}
        >
          <div
            className={`flex items-center gap-3 ${
              isCollapsed ? 'md:justify-center md:gap-0' : ''
            }`}
          >
            <img
              src="/images/logo.png"
              alt="Logo BPPMHKP"
              className="h-11 w-11 shrink-0 rounded-full ring-2 ring-white/20"
            />

            <div className={`min-w-0 ${isCollapsed ? 'md:hidden' : ''}`}>
              <h2 className="text-[22px] font-extrabold leading-none tracking-wide">
                <span className="text-[#3B82F6]">BPP</span>
                <span className="text-[#F26522]">MHKP</span>
              </h2>
              <p className="mt-1 text-xs font-medium tracking-[0.31em] text-slate-300">
                Portal Data
              </p>
            </div>

            {/* Tombol Tutup Sidebar (Mobile) */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="ml-auto text-slate-400 hover:text-white p-1 md:hidden cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <p
            className={`mt-2.5 text-[11px] font-medium uppercase leading-snug tracking-[0.06em] text-sky-300/80 ${
              isCollapsed ? 'md:hidden' : ''
            }`}
          >
            SISTEM INFORMASI &amp; ANALITIK PELAYANAN MUTU
          </p>
        </div>

        {/* Menu utama; isi dan sub-menu berasal dari config/navigation.ts */}
        <Sidebar
          isCollapsed={isCollapsed}
          onExpand={() => setIsCollapsed(false)}
          onNavigate={() => setIsSidebarOpen(false)}
        />
      </aside>

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-3">
            {/* Tombol Hamburger Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Buka Menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Tombol Minimize / Collapse Sidebar (Desktop) */}
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="hidden md:inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label={isCollapsed ? 'Buka sidebar' : 'Ringkas sidebar'}
              title={isCollapsed ? 'Buka sidebar' : 'Ringkas sidebar'}
            >
              <AlignLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <span className="font-semibold text-slate-800 text-sm md:text-base">
              Selamat Datang,{' '}
              <span className="text-blue-600 font-bold">
                {user?.nama || 'User'}
              </span>
            </span>
          </div>

          {/* User Info & Logout Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Main Content (DashboardPage / LayananPage) */}
        <main className="p-4 md:p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};