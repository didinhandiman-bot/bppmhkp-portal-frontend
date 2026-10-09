import { OPTIONS_API, SMKHP_API } from './api';
import { isApiSuccess, type ApiResponse } from '../types/api';
import type {
  SmkhpFilters,
  SmkhpTransaction,
  TopDestinationsByProductData,
  TopProductsByDestinationData,
  TransactionMeta,
  TransactionPagination,
  UptBreakdownResponse,
} from '../types/smkhp';
import type { LegacyUptName, UptOption } from '../types/upt';

/**
 * Ubah filter frontend menjadi query string backend.
 *
 * Nama key sengaja memakai snake_case yang dibaca `smkhpController.#buildFilters`
 * (`kd_upt`, `negara_tujuan`), bukan camelCase.
 */
const toParams = (filters: SmkhpFilters = {}): Record<string, string> => {
  const params: Record<string, string> = {};

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.kdUpt) params.kd_upt = filters.kdUpt;
  // `upt` (nama) hanya dibaca backend bila `kd_upt` kosong.
  if (!filters.kdUpt && filters.upt) params.upt = filters.upt;
  if (filters.negaraTujuan) params.negara_tujuan = filters.negaraTujuan;
  if (filters.tahun) params.tahun = filters.tahun;
  if (filters.bulan) params.bulan = filters.bulan;

  return params;
};

/**
 * Buka `data` dari envelope `sendResponse()` backend
 * (`{ success, message, data }`).
 */
const unwrap = <T>(res: ApiResponse<T>, context: string): T => {
  if (!isApiSuccess(res)) {
    throw new Error(res.message || `${context} gagal dimuat`);
  }
  return res.data;
};

/* ------------------------------------------------------------------ *
 * Opsi UPT
 * ------------------------------------------------------------------ */

/**
 * Opsi dropdown UPT dari master in-memory backend: `GET /api/v1/options/upt`.
 *
 * Ini sumber yang benar untuk dropdown. Endpoint dilayani oleh
 * `UptMasterService.getOptions()` di backend, sehingga:
 *   - selalu memuat seluruh UPT aktif (46 saat ini), bukan hanya UPT yang punya
 *     transaksi pada periode terpilih;
 *   - `value` adalah `KD_UNIT` kanonik (`01.00`/`01.0` sudah digabung ke
 *     `15.0`), aman dipakai sebagai filter `kd_upt`;
 *   - unit uji `98.0`/`99.0` sudah dibuang backend.
 *
 * Endpoint ini dilindungi `verifyToken`, jadi butuh sesi login.
 */
export const fetchMasterUptOptions = async (): Promise<UptOption[]> => {
  const response = await OPTIONS_API.get<ApiResponse<UptOption[]>>('/upt');
  return unwrap(response.data, 'Master UPT');
};

/**
 * Opsi dropdown UPT dari `GET /upt-breakdown`.
 *
 * Berasal dari agregat transaksi, jadi hanya memuat UPT yang punya transaksi
 * pada periode berjalan. Dipakai untuk tabel rekap angka, BUKAN untuk dropdown
 * filter — memakai ini membuat UPT tanpa transaksi hilang dari opsi.
 */
export const fetchUptBreakdown = async (
  filters: SmkhpFilters = {}
): Promise<UptBreakdownResponse> => {
  const response = await SMKHP_API.get<ApiResponse<UptBreakdownResponse>>('/upt-breakdown', {
    params: toParams(filters),
  });
  return unwrap(response.data, 'Rekap UPT');
};

/**
 * Daftar nama UPT dari `GET /upts`.
 *
 * Endpoint legacy: bersumber dari `DISTINCT nama_upt` tabel transaksi, bukan
 * master. Tidak memuat `kode_upt`, dan jumlahnya berbeda dari master
 * (85 vs 46 saat diverifikasi). Dipakai hanya bila yang dibutuhkan adalah
 * daftar nama.
 */
export const fetchLegacyUptNames = async (): Promise<LegacyUptName[]> => {
  const response = await SMKHP_API.get<ApiResponse<LegacyUptName[]>>('/upts');
  return unwrap(response.data, 'Daftar UPT');
};

/* ------------------------------------------------------------------ *
 * Matriks
 * ------------------------------------------------------------------ */

/** Matriks 1: produk utama di tiap negara tujuan. */
export const fetchTopProductsByDestination = async (
  filters: SmkhpFilters = {},
  options: { products?: number } = {}
): Promise<TopProductsByDestinationData> => {
  const response = await SMKHP_API.get<ApiResponse<TopProductsByDestinationData>>(
    '/top-products-by-destination',
    { params: { ...toParams(filters), ...(options.products ? { products: options.products } : {}) } }
  );
  return unwrap(response.data, 'Matriks produk per negara tujuan');
};

/** Matriks 2: pasar utama per produk. */
export const fetchTopDestinationsByProduct = async (
  filters: SmkhpFilters = {},
  options: { products?: number; destinations?: number } = {}
): Promise<TopDestinationsByProductData> => {
  const response = await SMKHP_API.get<ApiResponse<TopDestinationsByProductData>>(
    '/top-destinations-by-product',
    {
      params: {
        ...toParams(filters),
        ...(options.products ? { products: options.products } : {}),
        ...(options.destinations ? { destinations: options.destinations } : {}),
      },
    }
  );
  return unwrap(response.data, 'Matriks pasar per produk');
};

/* ------------------------------------------------------------------ *
 * Transaksi
 * ------------------------------------------------------------------ */

export interface TransactionPage {
  rows: SmkhpTransaction[];
  meta: TransactionMeta | null;
}

export const fetchTransactions = async (
  filters: SmkhpFilters = {},
  pagination: TransactionPagination = {}
): Promise<TransactionPage> => {
  const response = await SMKHP_API.get<
    ApiResponse<SmkhpTransaction[]> & { meta?: TransactionMeta }
  >('/transactions', {
    params: {
      ...toParams(filters),
      ...(pagination.page ? { page: String(pagination.page) } : {}),
      ...(pagination.limit ? { limit: String(pagination.limit) } : {}),
      ...(pagination.search ? { search: pagination.search } : {}),
    },
  });

  return { rows: unwrap(response.data, 'Daftar transaksi'), meta: response.data.meta ?? null };
};
