import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ACCESS_DENIED_MESSAGE, describeRoles } from '../../types/auth';

/**
 * Gerbang untuk seluruh route internal.
 *
 * Dua syarat harus lolos:
 *  1. ada sesi (token + user) — kalau tidak, arahkan ke /login;
 *  2. role-nya diizinkan (role 1 atau 2).
 *
 * Syarat kedua tidak memakai `<Navigate to="/login">` karena itu berputar:
 * session masih ada, jadi user akan diarahkan balik ke /login selamanya.
 * Untuk role yang salah ditampilkan panel penolakan dengan aksi keluar, supaya
 * pengguna understandswhy ia ditolak dan bisa memesai akun yang sesuai.
 */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isAuthorized, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full space-y-5 border border-amber-200">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Akses Ditolak</h2>
            <p className="text-sm text-slate-600">
              Anda masuk sebagai <span className="font-semibold">{user?.username}</span>
              {user?.roleName ? ` (${user.roleName})` : ''}.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
            {ACCESS_DENIED_MESSAGE}
          </div>

          <p className="text-xs text-slate-500">
            Role yang diizinkan: {describeRoles()}. Silakan hubungi administrator bila
            kamu merasa ini keliru.
          </p>

          <button
            type="button"
            onClick={logout}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer shadow-md"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
