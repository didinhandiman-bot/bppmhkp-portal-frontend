import API, {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  clearAuthState,
  readToken,
} from './api';
import type {
  AuthUser,
  LoginResponse,
  MeResponse,
} from '../types/api';

/**
 * Body yang dibaca backend pada `POST /api/v1/auth/login`.
 * Backend men-destructure `{ username, password }` — bukan `email`.
 * Backend tidak memvalidasi captcha sama sekali.
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

export const loginApi = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  // baseURL diambil dari VITE_API_BASE_URL (= /api/v1/auth), jadi path relatif
  // ini membentuk POST /api/v1/auth/login sesuai app.js backend.
  const response = await API.post<LoginResponse>('/login', credentials);
  return response.data;
};

export const getMeApi = async (): Promise<MeResponse> => {
  const response = await API.get<MeResponse>('/me');
  return response.data;
};

/** Baca user yang di-persist saat login, agar sesi bertahan setelah reload. */
export const readStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const persistAuth = (token: string, user: AuthUser): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const logoutUser = (): void => {
  clearAuthState();
};

export const hasToken = (): boolean => readToken() !== null;

export type { AuthUser };

/**
 * Alias lama. `UserProfile` sebelumnya didefinisikan di sini dengan shape
 * `{ id, nama, email, role }` yang tidak pernah sesuai dengan backend.
 */
export type UserProfile = AuthUser;
