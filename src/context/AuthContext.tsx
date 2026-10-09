import React, { useCallback, useMemo, useState } from 'react';
import { AuthContext, type AuthContextValue } from './auth';
import {
  hasToken,
  loginApi,
  logoutUser,
  persistAuth,
  readStoredUser,
} from '../services/authService';
import type { AuthUser } from '../types/api';
import { isApiSuccess } from '../types/api';
import { ACCESS_DENIED_MESSAGE, hasAllowedRole, readRoleId } from '../types/auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await loginApi({ username, password });

      // Backend membalas `{ status: 'success', data: { token, user } }`.
      // Cek `status`, bukan `success` — key `success` hanya dipakai global
      // errorHandler, sehingga selalu undefined pada response login.
      if (!isApiSuccess(res) || !res.data?.token) {
        throw new Error(res.message || 'Login gagal');
      }

      // Gate roleLapisan kedua, setelah backend. Backend sebenarnya sudah
      // menolak role di luar [1, 2] dengan 403;pemeriksaan ini menangkap
      // kasus di mana backend lolos (mis. versi backend lama belum di-deploy)
      // sehingga tidak ada user(role 3) yang sampai ke state tanpa diIzinkan.
      if (!hasAllowedRole(res.data.user)) {
        throw new Error(ACCESS_DENIED_MESSAGE);
      }

      persistAuth(res.data.token, res.data.user);
      setUser(res.data.user);

      return res.data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      // Token bisa saja ada tanpa user (mis. storage ditulis parsial),
      // jadi dua-duanya harus terpenuhi.
      isAuthenticated: user !== null && hasToken(),
      isAuthorized: hasAllowedRole(user),
      roleId: readRoleId(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
