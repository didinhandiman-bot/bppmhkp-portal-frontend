import { useState } from 'react';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  // Cek apakah user sudah login (memiliki token JWT di localStorage)
  const [isLoggedIn] = useState<boolean>(() => !!localStorage.getItem('token'));

  return (
    <section 
      id="beranda" 
      className="bg-gradient-to-b from-blue-50 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 py-20 px-4 transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto text-center space-y-6">
        
        {/* Badge Sistem Informasi */}
        <span className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider transition-colors">
          Sistem Informasi Terpadu
        </span>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight transition-colors">
          Selamat Datang di Portal Resmi <br className="hidden md:inline" />
          <span className="text-blue-600 dark:text-blue-400">BPPMHKP</span>
        </h1>

        {/* Deskripsi */}
        <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto transition-colors">
          Layanan penjaminan mutu dan pengendalian hasil kelautan dan perikanan secara transparan, akuntabel, dan terintegrasi.
        </p>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          {/* Tombol Utama (Dinamis) */}
          <Link
            to={isLoggedIn ? '/dashboard' : '/login'}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg shadow-md transition-all text-center"
          >
            {isLoggedIn ? 'Ke Dashboard' : 'Mulai Layanan'}
          </Link>

          {/* Tombol Sekunder */}
          <button className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium px-6 py-3 rounded-lg transition-all cursor-pointer">
            Pelajari Lebih Lanjut
          </button>
        </div>

      </div>
    </section>
  );
};