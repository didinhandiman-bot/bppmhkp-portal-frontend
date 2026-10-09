import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

export const Navbar = () => {
  // Cek apakah user punya token JWT di localStorage
  const [isLoggedIn] = useState<boolean>(() => !!localStorage.getItem('token'));
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Judul Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg text-sm">
              BPPMHKP
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg hidden sm:inline">
              Portal Layanan Mutu
            </span>
          </Link>

          {/* Menu Navigasi Tengah */}
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#beranda" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Beranda
            </a>
            <a href="#layanan" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Layanan
            </a>
            <a href="#tentang" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Tentang Kami
            </a>
          </nav>

          {/* Tombol Aksi Kanan (Dinamis) */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Tombol Toggle Dark Mode */}
            <button
              onClick={toggleTheme}
              p-2
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Ubah ke Light Mode' : 'Ubah ke Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                /* Icon Matahari (Light) */
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                /* Icon Bulan (Dark) */
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Tombol Auth */}
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-xs"
              >
                Ke Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-xs"
              >
                Masuk
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};