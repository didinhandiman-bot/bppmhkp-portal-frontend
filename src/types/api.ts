/**
 * Tipe dasar untuk response API backend BPPMHKP.
 *
 * CATATAN PENTING: backend (`bppmhkp-backend-portal`) tidak konsisten memakai
 * key envelope pada dua jalur yang berbeda:
 *   - `authController` / `authMiddleware` membalas `{ status, message, data? }`
 *   - `errorHandler` global membalas `{ success: false, message, error? }`
 *
 * Karena itu kedua key dimodelkan opsional dan `data` nullable, lalu
 * dinormalisasi lewat type guard `isApiSuccess` di bawah. Jangan akses
 * `response.data.token` langsung tanpa narrowing.
 */

export type ApiStatus = 'success' | 'error';

/** Envelope response standar backend. */
export interface ApiResponse<TData = unknown> {
  /** Dipakai authController & authMiddleware. */
  status?: ApiStatus;
  /** Dipakai global errorHandler. */
  success?: boolean;
  message?: string;
  data?: TData;
  /** Hanya diisi `errorHandler` di mode development (berisi stack trace). */
  error?: string;
}

/** Bentuk body saat request gagal. */
export type ApiErrorResponse = Omit<ApiResponse, 'data'>;

/** Payload yang ditandatangani backend menjadi JWT saat login. */
export interface AuthTokenPayload {
  userId: number;
  username: string;
  nama: string;
  roleId: number;
  /**
   * Alias snake_case dari `roleId`, ikut disertakan backend agar pembacaan
   * yang mengikuti konvensi tabel tidak perlu mengubah. Gunakan
   * `readRoleId()` dari `./auth` daripada memilih salah satu secara manual.
   */
  role_id: number;
  roleName: string;
  kdUnit: string | null;
  isNationalAccess: boolean;
}

/** Objek `user` di dalam response login. */
export interface AuthUser {
  id: number;
  username: string;
  nama: string;
  jabatan: string | null;
  roleId: number;
  /** Alias snake_case dari `roleId`;lihat `AuthTokenPayload.role_id`. */
  role_id: number;
  roleName: string;
  kdUnit: string | null;
  isNationalAccess: boolean;
}

export interface LoginResultData {
  token: string;
  user: AuthUser;
}

export type LoginResponse = ApiResponse<LoginResultData>;

/** Response `GET /me`: `data` berisi payload JWT, bukan objek user penuh. */
export type MeResponse = ApiResponse<AuthTokenPayload>;

/** Response `GET /api/health`. */
export interface HealthResponse {
  status: 'OK';
  timestamp: string;
}

/**
 * Suffix URL yang tidak boleh memicu cleanup auth di response interceptor.
 * Backend membalas 401 untuk kredensial login yang salah, dan itu bukan
 * tanda sesi kedaluwarsa.
 */
export const AUTH_EXEMPT_URLS = ['/login'] as const;

/**
 * Menormalisasi dua variasi envelope backend menjadi satu penentu sukses.
 * Lolos bila `status === 'success'` (authController) atau
 * `success === true` (errorHandler).
 */
export const isApiSuccess = <TData>(
  res: ApiResponse<TData> | null | undefined
): res is ApiResponse<TData> & { data: TData } =>
  res != null && (res.status === 'success' || res.success === true);

/** Ambil pesan error dari body response, dengan fallback bila tidak ada. */
export const getApiMessage = (
  res: ApiResponse | null | undefined,
  fallback: string
): string => res?.message ?? fallback;
