/**
 * Service untuk modul SPDI Pascapanen (Sistem Pengawasan Distribusi Ikan).
 *
 * Bentuk envelope yang dipakai backend (`sendResponse` di `spdiPasca.controller.js`):
 *  - `/dashboard` -> `{ success, message, data }`
 *  - `/list`      -> `{ success, message, data: [], meta: { total, page, limit, totalPages } }`
 *
 * Berbeda dari HACCP/SKP, paginasi `/list` berada LANGSUNG di `meta` (bukan
 * `meta.pagination`), dengan key `total`/`page` (bukan `totalRows`/`currentPage`).
 */

import { SPDI_API } from './api';
import { isApiSuccess, type ApiResponse } from '../types/api';
import type {
  SpdiDashboardData,
  SpdiFilterParams,
  SpdiKbliItem,
  SpdiListData,
  SpdiListItem,
  SpdiMonthlyTrendItem,
  SpdiPagination,
  SpdiProvinsiItem,
  SpdiUptItem,
} from '../types/spdi';

/**
 * Ubah filter UI menjadi query string, membuang nilai kosong.
 *
 * `tahun` sengaja tidak punya default: backend menghitung SELURUH tahun bila
 * parameternya tidak dikirim (kontrak berbeda dari SKP yang terikat YoY).
 */
const toParams = (filters: SpdiFilterParams = {}): Record<string, string | number> => {
  const params: Record<string, string | number> = {};

  if (filters.kdUpt && filters.kdUpt.trim() !== '') params.kd_upt = filters.kdUpt.trim();
  if (filters.kdProvinsi && filters.kdProvinsi.trim() !== '') {
    params.kd_provinsi = filters.kdProvinsi.trim();
  }
  if (typeof filters.tahun === 'number' && Number.isFinite(filters.tahun) && filters.tahun > 0) {
    params.tahun = filters.tahun;
  }
  if (filters.search && filters.search.trim() !== '') params.search = filters.search.trim();
  if (typeof filters.page === 'number' && Number.isFinite(filters.page) && filters.page > 0) {
    params.page = filters.page;
  }
  if (typeof filters.limit === 'number' && Number.isFinite(filters.limit) && filters.limit > 0) {
    params.limit = filters.limit;
  }

  return params;
};

/** Buka `data` dari envelope backend, lempar error bila `success !== true`. */
const unwrap = <T>(envelope: ApiResponse<T>, context: string): T => {
  if (!isApiSuccess(envelope)) {
    throw new Error(envelope.message || `${context} gagal dimuat`);
  }
  return envelope.data;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/**
 * Ambil angka dari sumber, default 0.
 *
 * `Number(null)` dan `Number('')` sama-sama `0`, jadi keduanya aman;
 * `Number.isFinite` menyaring `NaN` dari `undefined`/`'abc'`.
 */
const pickNumber = (source: Record<string, unknown>, key: string, fallback = 0): number => {
  const parsed = Number(source[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Sama seperti `pickNumber`, tetapi mempertahankan `null` dari backend. */
const pickNullableNumber = (source: Record<string, unknown>, key: string): number | null => {
  const raw = source[key];
  if (raw === null || raw === undefined || raw === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickString = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};

/** Kode provinsi dinormalkan ke 2 digit agar cocok dengan `KODE_PROV` GeoJSON. */
const pickProvinceCode = (value: unknown): string => {
  const text = pickString(value) ?? '';
  return /^\d{1,2}$/.test(text) ? text.padStart(2, '0') : text;
};

/**
 * `GET /api/v1/pascapanen/spdi/dashboard` — KPI + seluruh grafik dalam satu
 * request (lima query agregat sudah dijalankan paralel di sisi backend).
 */
export const getSpdiDashboard = async (
  filters: SpdiFilterParams = {}
): Promise<SpdiDashboardData> => {
  const response = await SPDI_API.get<ApiResponse<unknown>>('/dashboard', {
    params: toParams(filters),
  });
  const data = asRecord(unwrap(response.data, 'Dashboard SPDI'));
  const metrics = asRecord(data.metrics);
  const appliedFilters = asRecord(data.filters);

  return {
    filters: {
      tahun: pickNullableNumber(appliedFilters, 'tahun'),
      kd_upt: pickString(appliedFilters.kd_upt),
      kd_provinsi: pickString(appliedFilters.kd_provinsi),
    },
    metrics: {
      totalData: pickNumber(metrics, 'totalData'),
      totalTerbit: pickNumber(metrics, 'totalTerbit'),
      totalUnit: pickNumber(metrics, 'totalUnit'),
      avgSkorInspeksi: pickNullableNumber(metrics, 'avgSkorInspeksi'),
      avgSkorCdib: pickNullableNumber(metrics, 'avgSkorCdib'),
      avgSlaHari: pickNullableNumber(metrics, 'avgSlaHari'),
    },
    monthlyTrend: asArray(data.monthlyTrend).map<SpdiMonthlyTrendItem>((row) => {
      const record = asRecord(row);
      return {
        bulan: String(record.bulan ?? '').trim(),
        total: pickNumber(record, 'total'),
      };
    }),
    byUpt: asArray(data.byUpt).map<SpdiUptItem>((row) => {
      const record = asRecord(row);
      return {
        kd_upt: pickString(record.kd_upt),
        nama_upt: pickString(record.nama_upt) ?? 'Tidak Diisi',
        total: pickNumber(record, 'total'),
        avgSkorInspeksi: pickNullableNumber(record, 'avgSkorInspeksi'),
        avgSkorCdib: pickNullableNumber(record, 'avgSkorCdib'),
      };
    }),
    byProvinsi: asArray(data.byProvinsi).map<SpdiProvinsiItem>((row) => {
      const record = asRecord(row);
      return {
        kd_provinsi: pickProvinceCode(record.kd_provinsi),
        nama_provinsi: pickString(record.nama_provinsi),
        total: pickNumber(record, 'total'),
      };
    }),
    kbliDistribution: asArray(data.kbliDistribution).map<SpdiKbliItem>((row) => {
      const record = asRecord(row);
      return {
        kode: String(record.kode ?? '').trim(),
        total: pickNumber(record, 'total'),
      };
    }),
  };
};

/**
 * Envelope khusus `/list`.
 *
 * `ApiResponse` generik tidak mendeklarasikan `meta`, padahal backend
 * mengirimkannya langsung berisi `{ total, page, limit, totalPages }`.
 */
interface SpdiListEnvelope extends ApiResponse<unknown> {
  meta?: unknown;
}

/** `GET /api/v1/pascapanen/spdi/list` — direktori unit SPDI terpaginasikan. */
export const getSpdiList = async (filters: SpdiFilterParams = {}): Promise<SpdiListData> => {
  const response = await SPDI_API.get<SpdiListEnvelope>('/list', {
    params: toParams(filters),
  });

  const envelope = response.data;

  // `meta` dibaca SEBELUM narrowing: `isApiSuccess` mempersempit tipe menjadi
  // `ApiResponse<T> & { data: T }` yang tidak mendeklarasikan `meta`.
  const rawMeta = asRecord(envelope.meta);

  if (!isApiSuccess(envelope)) {
    throw new Error(envelope.message || 'Daftar unit SPDI gagal dimuat');
  }

  const items: SpdiListItem[] = asArray(envelope.data).map((row) => {
    const record = asRecord(row);
    return {
      id: pickNumber(record, 'id'),
      nama_unit: pickString(record.nama_unit),
      tgl_permohonan: pickString(record.tgl_permohonan),
      tgl_terbit: pickString(record.tgl_terbit),
      nomor_sertifikat: pickString(record.nomor_sertifikat),
      kd_upt: pickString(record.kd_upt),
      nama_upt: pickString(record.nama_upt),
      kd_provinsi: record.kd_provinsi === null || record.kd_provinsi === undefined
        ? null
        : pickProvinceCode(record.kd_provinsi),
      kab_kota: pickString(record.kab_kota),
      skor_inspeksi: pickNullableNumber(record, 'skor_inspeksi'),
      skor_cdib: pickNullableNumber(record, 'skor_cdib'),
      tagging_kdmp: pickString(record.tagging_kdmp),
      kbli: pickString(record.kbli),
      produk: pickString(record.produk),
      status: pickString(record.status),
      sla_hari: pickNullableNumber(record, 'sla_hari'),
    };
  });

  const pagination: SpdiPagination = {
    total: pickNumber(rawMeta, 'total'),
    page: pickNumber(rawMeta, 'page', 1),
    limit: pickNumber(rawMeta, 'limit', 10),
    totalPages: pickNumber(rawMeta, 'totalPages'),
  };

  return { items, pagination };
};
