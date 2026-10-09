import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { findLeafByPath } from '../../config/navigation';

interface ComingSoonProps {
  /** Menimpa label yang diambil otomatis dari konfigurasi navigasi. */
  title?: string;
  description?: string;
}

/**
 * Placeholder generik untuk modul yang belum tersedia.
 *
 * Label dan deskripsi diambil sendiri dari `config/navigation.ts` lewat
 * `useLocation()`, jadi satu elemen rute ini melayani seluruh path
 * `coming-soon` sekaligus. Rute tidak pernah 404: setiap path yang muncul di
 * sidebar punya route yang menunjuk ke komponen ini.
 */
export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description }) => {
  const { pathname } = useLocation();
  const leaf = findLeafByPath(pathname);

  const resolvedTitle = title ?? leaf?.label ?? 'Modul';
  const resolvedDescription =
    description ??
    leaf?.description ??
    'Modul ini sedang dalam tahap pengembangan.';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
        <span aria-hidden="true">&#9203;</span>
        Segera Hadir
      </span>

      <h2 className="mt-5 text-2xl font-bold text-slate-900">{resolvedTitle}</h2>

      <p className="mt-2 max-w-md text-sm text-slate-600">{resolvedDescription}</p>

      <p className="mt-1 text-xs text-slate-400">
        Modul ini belum dapat diakses. Silakan kembali lagi setelah fiturnya
        selesai dikembangkan.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Kembali ke Dashboard
        </Link>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Rute saat ini: <code className="text-slate-600">{pathname}</code>
      </p>
    </div>
  );
};

export default ComingSoon;
