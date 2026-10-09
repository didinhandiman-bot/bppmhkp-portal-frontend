/**
 * Service untuk modul SKP (Standar Kompetensi Producer).
 *
 * Seluruh mapping di sini mengikuti respons riil backend `/api/v1/skp/*`
 * (lihat komentar tipe pada `types/skp.ts`). Backend memakai `snake_case`
 * secara konsisten, jadi tidak ada alias tebakan seperti pada modul lain.
 *
 * Catatan bentuk envelope yang dipakai:
 *  - `/summary`, `/trends`, `/distribution` -> `{ success, message, data }`
 *  - `/list`                             -> `{ success, message, data: [], meta: { pagination } }`
 *    jadi array data berada langsung di `data`, bukan `data.items`.
 */

import { SKP_API } from './api';
import { isApiSuccess, type ApiResponse } from '../types/api';
import type {
  SkpDistributionData,
  SkpFilterParams,
  SkpLabelTotal,
  SkpListData,
  SkpListItem,
  SkpPagination,
  SkpSummaryData,
  SkpTrendsData,
} from '../types/skp';

/** Ubah filter UI menjadi query string, membuang nilai kosong. */
const toParams = (filters: SkpFilterParams = {}): Record<string, string | number> => {
  const params: Record<string, string | number> = {};

  if (typeof filters.year === 'number' && Number.isFinite(filters.year)) {
    params.year = filters.year;
  }
  if (filters.provinsiId && filters.provinsiId.trim() !== '') {
    params.provinsi_id = filters.provinsiId.trim();
  }
  if (filters.skalaUsaha && filters.skalaUsaha.trim() !== '') {
    params.skala_usaha = filters.skalaUsaha.trim();
  }
  if (filters.peringkat && filters.peringkat.trim() !== '') {
    params.peringkat = filters.peringkat.trim();
  }
  if (filters.search && filters.search.trim() !== '') {
    params.search = filters.search.trim();
  }
  // Tab status pada tabel bersifat khusus `/list`; dikirim hanya bila bukan "semua"
  // supaya endpoint agregat tetap memakai seluruh data.
  if (filters.status && filters.status !== 'semua') {
    params.status = filters.status;
  }
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
 * `Number(null)` menghasilkan `0` dan `Number('')` juga `0`, jadi kedua nilai
 * itu aman; `Number.isFinite` menyaring `NaN` dari `undefined`/`'abc'`.
 */
const pickNumber = (source: Record<string, unknown>, key: string, fallback = 0): number => {
  const parsed = Number(source[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickString = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};

/** Normalisasi baris `{ label, total }` untuk seluruh grafik distribusi. */
const mapLabelTotals = (value: unknown): SkpLabelTotal[] =>
  asArray(value).map((row) => {
    const record = asRecord(row);
    return {
      label: String(record.label ?? '').trim(),
      total: pickNumber(record, 'total'),
    };
  });

/** `GET /api/v1/skp/summary` — KPI utama beserta pembanding YoY. */
export const getSkpSummary = async (filters: SkpFilterParams = {}): Promise<SkpSummaryData> => {
  const response = await SKP_API.get<ApiResponse<unknown>>('/summary', {
    params: toParams(filters),
  });
  const data = asRecord(unwrap(response.data, 'Ringkasan SKP'));
  const appliedFilters = asRecord(data.filters);

  return {
    year: pickNumber(data, 'year'),
    previousYear: pickNumber(data, 'previousYear'),
    totalTerbit: pickNumber(data, 'totalTerbit'),
    totalTerbitPrevYear: pickNumber(data, 'totalTerbitPrevYear'),
    yoyGrowth: pickNumber(data, 'yoyGrowth'),
    totalAktif: pickNumber(data, 'totalAktif'),
    totalExpired: pickNumber(data, 'totalExpired'),
    totalUpi: pickNumber(data, 'totalUpi'),
    filters: {
      provinsiId: pickString(appliedFilters.provinsiId),
      skalaUsaha: pickString(appliedFilters.skalaUsaha),
      peringkat: pickString(appliedFilters.peringkat),
    },
  };
};

/** `GET /api/v1/skp/trends` — pembanding bulanan tahun berjalan vs sebelumnya. */
export const getSkpTrends = async (filters: SkpFilterParams = {}): Promise<SkpTrendsData> => {
  const response = await SKP_API.get<ApiResponse<unknown>>('/trends', {
    params: toParams(filters),
  });
  const data = asRecord(unwrap(response.data, 'Tren SKP'));

  return {
    year: pickNumber(data, 'year'),
    previousYear: pickNumber(data, 'previousYear'),
    totalCurrentYear: pickNumber(data, 'totalCurrentYear'),
    totalPreviousYear: pickNumber(data, 'totalPreviousYear'),
    data: asArray(data.data).map((row) => {
      const point = asRecord(row);
      return {
        month: pickNumber(point, 'month'),
        monthName: String(point.monthName ?? '').trim(),
        currentYear: pickNumber(point, 'currentYear'),
        previousYear: pickNumber(point, 'previousYear'),
      };
    }),
  };
};

/** `GET /api/v1/skp/distribution` — sebaran grade, skala usaha, dan top list. */
export const getSkpDistribution = async (
  filters: SkpFilterParams = {}
): Promise<SkpDistributionData> => {
  const response = await SKP_API.get<ApiResponse<unknown>>('/distribution', {
    params: toParams(filters),
  });
  const data = asRecord(unwrap(response.data, 'Distribusi SKP'));

  return {
    year: pickNumber(data, 'year'),
    byPeringkat: mapLabelTotals(data.byPeringkat),
    bySkalaUsaha: mapLabelTotals(data.bySkalaUsaha),
    topJenisOlahan: mapLabelTotals(data.topJenisOlahan),
    topWilayah: mapLabelTotals(data.topWilayah),
  };
};

/**
 * Envelope khusus `/list`.
 *
 * Berbeda dari tiga endpoint lain, `ApiResponse` generik tidak mendeklarasikan
 * `meta`, padahal `/list` mengirimkannya. Deklarasi lokal ini dipakai agar
 * `meta.pagination` tetap type-safe tanpa melonggarkan tipe di modul lain.
 */
interface SkpListEnvelope extends ApiResponse<unknown> {
  meta?: { pagination?: unknown };
}

/** `GET /api/v1/skp/list` — tabel SKP terpaginasikan (data + meta.pagination). */
export const getSkpList = async (filters: SkpFilterParams = {}): Promise<SkpListData> => {
  const response = await SKP_API.get<SkpListEnvelope>('/list', {
    params: toParams(filters),
  });

  const envelope = response.data;

  // `meta` dibaca SEBELUM narrowing: `isApiSuccess` mempersempit tipe menjadi
  // `ApiResponse<T> & { data: T }` yang tidak mendeklarasikan `meta`, sehingga
  // akses setelahnya akan error TypeScript.
  const rawPagination = asRecord(asRecord(envelope.meta).pagination);

  if (!isApiSuccess(envelope)) {
    throw new Error(envelope.message || 'Daftar SKP gagal dimuat');
  }

  // `/list` berbeda dari tiga endpoint lain: `data` langsung berupa array.
  const items: SkpListItem[] = asArray(envelope.data).map((row) => {
    const record = asRecord(row);
    return {
      id: pickNumber(record, 'id'),
      nama_upi: String(record.nama_upi ?? '').trim(),
      nib: pickString(record.nib),
      provinsi_id: pickString(record.provinsi_id),
      provinsi: pickString(record.provinsi),
      regency_id: pickString(record.regency_id),
      kota_kabupaten: pickString(record.kota_kabupaten),
      alamat: pickString(record.alamat),
      skala_usaha: pickString(record.skala_usaha),
      jenis_permohonan: pickString(record.jenis_permohonan),
      tanggal_pengajuan: pickString(record.tanggal_pengajuan),
      tanggal_rekomendasi: pickString(record.tanggal_rekomendasi),
      tanggal_terbit: pickString(record.tanggal_terbit),
      tanggal_kadaluarsa: pickString(record.tanggal_kadaluarsa),
      nomor_skp: pickString(record.nomor_skp),
      nama_produk: pickString(record.nama_produk),
      jenis_olahan: pickString(record.jenis_olahan),
      peringkat: pickString(record.peringkat),
      status: pickString(record.status),
    };
  });

  const paginationRecord = rawPagination;
  const pagination: SkpPagination = {
    totalRows: pickNumber(paginationRecord, 'totalRows'),
    totalPages: pickNumber(paginationRecord, 'totalPages'),
    currentPage: pickNumber(paginationRecord, 'currentPage', 1),
    limit: pickNumber(paginationRecord, 'limit', 10),
  };

  return { items, pagination };
};
