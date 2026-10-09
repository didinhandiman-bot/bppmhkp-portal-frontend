import { createContext } from 'react';
import type { AuthUser } from '../types/api';

/**
 * Konteks auth dipisah ke berkas `.ts` (bukan di dalam AuthContext.tsx) karena
 * aturan `react-refresh/only-export-components` melarang satu berkas
 * mengekspor komponen dan non-komponen sekaligus. Pola ini sama dengan
 * `context/theme.ts` + `context/ThemeContext.tsx`.
 */
export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /**
   * True bila user yang sedang login punya role yang diizinkan aplikasi
   * (role 1 atau 2). `isAuthenticated` hanya menyatakan "ada sesi", sedangkan
   * nilai ini menyatakan "sesi itu berhak masuk" — route guard memakai
   * keduanya.
   */
  isAuthorized: boolean;
  /** Role user yang terbaca, atau `null` bila belum login / tidak terbaca. */
  roleId: number | null;
  /** True selama request login berjalan. */
  isLoading: boolean;
  /**
   * Melempar bila login ditolak. Mengembalikan user yang baru Ceram-auth
   * (bukan `void`) supaya pemanggil bisa memeriksa role dari nilai segar —
   * `isAuthorized` di context belum ter-update pada baris sesudah `await`.
   */
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
