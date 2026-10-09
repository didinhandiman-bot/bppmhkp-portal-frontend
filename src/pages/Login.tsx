import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { getApiMessage, type ApiErrorResponse } from '../types/api';
import { ACCESS_DENIED_MESSAGE, describeRoles, hasAllowedRole } from '../types/auth';

/**
 * Halaman login minimal untuk menguji autentikasi riil ke backend.
 * Sengaja tanpa captcha: backend `authController.login` hanya membaca
 * `{ username, password }`.
 */
export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // 403 berarti kredensial benar tetapi role tidak entitled. Itu kondisi yang
  // berbeda dari 401 (salah password), jadi tampilannya dibedakan agar
  // pengguna tidak mengira password-nya yang bermasalah.
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsAccessDenied(false);

    try {
      // Pakai nilai balik, bukan `isAuthorized` dari context: state context
      // baru ter-update setelah render berikutnya, jadi membacanya di sini
      // masih menghasilkan nilai lama.
      const loggedInUser = await login(username.trim(), password);

      // Penjaga kedua: kalau backend sempat membiarkan user(role di luar 1–2)
      // lolos tanpa melempar error, jangan navigasi ke halaman internal.
      if (!hasAllowedRole(loggedInUser)) {
        setIsAccessDenied(true);
        setErrorMessage(ACCESS_DENIED_MESSAGE);
        return;
      }

      navigate('/ekspor', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        // Backend menjawab role yang ditolak dengan 403 dan envelope
        // `{ success: false, message }` — bukan `{ status: 'error' }` seperti
        // error auth lain. `getApiMessage` sudah membaca keduanya lewat `message`.
        if (err.response?.status === 403) {
          setIsAccessDenied(true);
          setErrorMessage(
            getApiMessage(err.response.data, ACCESS_DENIED_MESSAGE)
          );
          return;
        }

        setErrorMessage(getApiMessage(err.response?.data, 'Gagal masuk'));
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Gagal masuk');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full space-y-6 border border-slate-200">
        <div className="text-center">
          <div className="inline-block bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-lg mb-3">
            Portal BPPMHKP
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Masuk Akun</h2>
          <p className="text-sm text-slate-600 mt-1">
            {/* POST /api/v1/auth/login */}
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className={
              isAccessDenied
                ? 'bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-lg text-sm space-y-1'
                : 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'
            }
          >
            <p className="font-semibold">{isAccessDenied ? 'Akses Ditolak' : 'Gagal Masuk'}</p>
            <p>{errorMessage}</p>
            {isAccessDenied && (
              <p className="text-xs opacity-80">Role yang diizinkan: {describeRoles()}.</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
              placeholder="username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer shadow-md"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
