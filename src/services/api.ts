import { isAuthenticationFailure, decodeErrorBody } from '../utils/authFailure';
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { AUTH_EXEMPT_URLS, type ApiErrorResponse } from '../types/api';

export const TOKEN_STORAGE_KEY = 'token';
export const USER_STORAGE_KEY = 'user';

const LOGIN_ROUTE = '/login';

/**
 * Backend memakai dua status untuk masalah auth:
 *   - 401 saat token tidak ditemukan (`authMiddleware`) atau kredensial login salah
 *   - 403 saat token tidak valid / kedaluwarsa (`authMiddleware`)
 * Menangani 401 saja membuat token kedaluwarsa lolos tanpa redirect.
 */


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1/auth';

/**
 * Base URL modul pascapanen. Terpisah dari auth karena backend me-mount modul
 * ini di path lain (`app.js`: `/api/v1/pascapanen/smkhp`).
 *
 * Path absolut tidak bisa dipakai pada instance auth: axios selalu
 * menempelkan baseURL, sehingga `/api/v1/pascapanen/...` dari instance auth
 * akan menjadi `/api/v1/auth/api/v1/pascapanen/...`.
 */
export const SMKHP_BASE_URL = import.meta.env.VITE_SMKHP_BASE_URL || '/api/v1/pascapanen/smkhp';

/**
 * Base URL modul options/master (`/api/v1/options/upt`). Butuh instance
 * sendiri karena path-nya berada di luar baseURL modul pascapanen maupun auth.
 */
export const OPTIONS_BASE_URL = import.meta.env.VITE_OPTIONS_BASE_URL || '/api/v1/options';

/**
 * Base URL modul SKP (Pasca Panen), di-mount backend di `/api/v1/skp`.
 * Path relatif supaya melewati Vite proxy (`/api` -> localhost:5002), sama
 * seperti modul lain.
 */
export const SKP_BASE_URL = import.meta.env.VITE_SKP_BASE_URL || '/api/v1/skp';

/** Prefix utama HACCP; override environment tetap didukung. */
export const HACCP_BASE_URL =
  import.meta.env.VITE_HACCP_BASE_URL || '/api/v1/pasca-panen/haccp';

/**
 * Base URL dashboard ringkasan, di-mount backend di `/api/v1/dashboard`.
 *
 * Butuh instance sendiri: instance auth berpatokan `/api/v1/auth`, jadi
 * `/dashboard/overview` darinya akan menjadi `/api/v1/auth/dashboard/overview`.
 */
export const DASHBOARD_BASE_URL =
  import.meta.env.VITE_DASHBOARD_BASE_URL || '/api/v1/dashboard';

/**
 * Token dibaca dari localStorage lalu sessionStorage, sehingga token yang
 * disimpan di salah satu storage tetap dipakai bila storage lain kosong.
 */
const readToken = (): string | null =>
  localStorage.getItem(TOKEN_STORAGE_KEY) ?? sessionStorage.getItem(TOKEN_STORAGE_KEY);

export { readToken };

/** Bersihkan seluruh state auth di kedua storage. */
export const clearAuthState = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
};

/**
 * Pasang interceptor auth pada sebuah instance axios.
 *
 * Semua modul memakai satu papan token yang sama, sehingga instance per modul
 * cukup berbagi implementasi ini alih-alih menduplikasi logika.
 */
const withAuthInterceptors = (instance: AxiosInstance): AxiosInstance => {
  // Request Interceptor: tempel `Authorization: Bearer <token>` bila token ada.
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = readToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: unknown) => Promise.reject(error)
  );

  // Response Interceptor: tangani kegagalan auth (401/403).
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
      const status = error.response?.status;
      const url = error.config?.url ?? '';
      const body = await decodeErrorBody(error.response?.data);
      if (error.response && body !== undefined && !(body instanceof Blob)) error.response.data = body as ApiErrorResponse;

      // Login yang gagal membalas 401/403 karena kredensial salah, bukan karena
      // sesi kedaluwarsa. Membersihkan token di sini akan membuang kredensial
      // yang barusan diketik user sebelum pesan errornya sempat tampil.
      const isAuthExempt = AUTH_EXEMPT_URLS.some((path) => url.includes(path));

      if (isAuthenticationFailure(status, body) && !isAuthExempt) {
        clearAuthState();

        if (!window.location.pathname.startsWith(LOGIN_ROUTE)) {
          window.location.replace(LOGIN_ROUTE);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const createApiInstance = (baseURL: string) =>
  withAuthInterceptors(
    axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  );

/** Instance untuk modul auth. */
const API = createApiInstance(API_BASE_URL);

/** Instance untuk modul pascapanen/SMKHP. */
export const SMKHP_API = createApiInstance(SMKHP_BASE_URL);

/** Instance untuk modul options/master (opsi UPT). */
export const OPTIONS_API = createApiInstance(OPTIONS_BASE_URL);

/** Instance untuk modul SKP (Pasca Panen). */
export const SKP_API = createApiInstance(SKP_BASE_URL);

/** Instance untuk modul HACCP (Pasca Panen). */
export const HACCP_API = createApiInstance(HACCP_BASE_URL);

/** Instance untuk dashboard ringkasan eksekutif. */
export const DASHBOARD_API = createApiInstance(DASHBOARD_BASE_URL);

/** Base URL modul PRIMER, di-mount backend di `/api/v1/primer`. */
export const PRIMER_BASE_URL = import.meta.env.VITE_PRIMER_BASE_URL || "/api/v1/primer";

/** Instance untuk modul PRIMER. */
export const PRIMER_API = createApiInstance(PRIMER_BASE_URL);

/**
 * Base URL modul landing page (`/api/v1/landing`), di-mount backend di
 * `src/routes/landingRoutes.js`. Endpoint di bawahnya (`peta-sebar`,
 * `upt-marker`) bersifat PUBLIK, jadi instance ini tetap dipakai walau tanpa
 * token — interceptor auth hanya menempelkan Bearer bila token memang ada.
 */
export const LANDING_BASE_URL =
  import.meta.env.VITE_LANDING_BASE_URL || '/api/v1/landing';

/** Instance untuk modul landing page (peta sebaran). */
export const LANDING_API = createApiInstance(LANDING_BASE_URL);

export default API;
