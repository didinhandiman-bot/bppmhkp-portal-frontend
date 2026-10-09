/**
 * Utilitas konversi error menjadi pesan yang layak ditampilkan ke pengguna.
 *
 * Berbeda dari versi dashboard-fe, modul ini tidak/client-side tidak memegang
 * token publik: autentikasi memakai JWT sesi yang disuntik interceptor di
 * `services/api.ts`. Karena itu 401/403 sudah ditangani interceptor (membersihkan
 * state auth lalu mengarahkan ke /login) dan TIDAK perlu pesan khusus di sini.
 */
import { SMKHP_BASE_URL } from '../services/api';

/**
 * Mengubah error apa pun menjadi pesan yang dapat dipahami pengguna.
 *
 * @param error Nilai error mentah (umumnya `AxiosError` dari axios).
 * @returns Pesan siap ditampilkan.
 */
export function toErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: unknown } }).response;

    if (response && response.status !== undefined) {
      // `message` backend sudah berbahasa Indonesia dan spesifik per endpoint.
      const data = response.data;
      if (typeof data === 'object' && data !== null) {
        const message = (data as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim().length > 0) {
          return message;
        }
      }

      if (response.status === 404) {
        return 'Endpoint tidak ditemukan. Periksa konfigurasi base URL API.';
      }
      if (response.status >= 500) {
        return `Server mengalami gangguan (HTTP ${response.status}). Silakan coba lagi beberapa saat.`;
      }
      return `Permintaan gagal (HTTP ${response.status}).`;
    }

    // Response tidak ada: sebagian besar berarti jaringan/offline/proxy.
    return `Tidak dapat menghubungi server API (${SMKHP_BASE_URL}).`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Terjadi kesalahan tidak diketahui saat memuat data.';
}
