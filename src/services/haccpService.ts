/**
 * Service untuk modul HACCP (Hazard Analysis and Critical Control Point).
 *
 * Bentuk envelope yang dipakai backend (`sendResponse`):
 *  - `/kpi`   -> `{ success, message, data }`
 *  - `/charts`-> `{ success, message, data }`
 *  - `/table` -> `{ success, message, data: [], meta: { pagination } }`
 *
 * Catatan penting: paginasi tabel berada di `meta.pagination`, BUKAN di dalam
 * `data` seperti `{ data: { pagination } }`. Ini berbeda dari modul lain,
 * karena backend memanggil `sendResponse(res, 200, msg, result.data, { pagination })`.
 */

import { HACCP_API } from './api';
import { isApiSuccess, type ApiResponse } from '../types/api';
import type {
  HaccpChartsData,
  HaccpFilterParams,
  HaccpGradeDistributionItem,
  HaccpInvestmentItem,
  HaccpKategoriProdukItem,
  HaccpKpiData,
  HaccpPagination,
  HaccpStatusProdukItem,
  HaccpTableData,
  HaccpTableItem,
  HaccpTopProdukItem,
  HaccpTopUptItem,
} from '../types/haccp';

/**
 * Ubah filter UI menjadi query string, membuang nilai kosong.
 *
 * Nama UPT dikirim sebagai `id_upt`, bukan `kd_unit`, meski nilainya adalah
 * `KD_UNIT` dari master `/api/v1/options/upt`. Alasannya hasil uji langsung ke
 * backend yang berjalan: `?kd_unit=15.0` mengembalikan angka IDENTIK dengan
 * tanpa filter (24085), sedangkan `?id_upt=15.0` mengembalikan 409 baris. Kolom
 * `id_upt` pada view sudah berisi kode `KD_UNIT` persis, jadi nama parameternya
 * yang perlu mengikuti, bukan asal nilainya. `haccpRepository` versi terbaru
 * juga tetap mencocokkan `kd_unit = :upt OR id_upt = :upt`, sehingga `id_upt`
 * tetap benar setelah backend di-restart.
 */
const toParams = (filters: HaccpFilterParams = {}): Record<string, string | number> => {
  const params: Record<string, string | number> = {};

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.kdUpt && filters.kdUpt.trim() !== '') params.id_upt = filters.kdUpt.trim();
  if (filters.grade && filters.grade.trim() !== '') params.grade = filters.grade.trim();
  if (filters.statusSert && filters.statusSert.trim() !== '') {
    params.status_sert = filters.statusSert.trim();
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
 * `Number(null)` dan `Number('')` sama-sama menghasilkan `0`, jadi keduanya
 * aman; `Number.isFinite` menyaring `NaN` dari `undefined`/`'abc'`.
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

/**
 * Tanggal dari view SQL datang sebagai objek `Date`, yang di-JSON menjadi
 * string ISO lengkap (`2026-01-05T00:00:00.000Z`). Backend memangkas
 * whitespace tapi tidak memangkas formatnya, jadi ambil bagian tanggalnya di
 * sini; kalau tidak ter-parse, kirim apa adanya agar tidak jadi "Invalid Date".
 */
const pickDateOnly = (value: unknown): string | null => {
  const text = pickString(value);
  if (text === null) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
};

/**
 * Normalisasi baris berlabel untuk grafik.
 *
 * Key label berbeda per grafik (`grade`, `status_produk`, `nama_produk`, …)
 * dan berasal langsung dari alias `AS` di SQL, jadi generik dipakai agar
 * bentuk tiap item tetap terikat ke tipe yang mendeklarasikannya.
 */
const mapLabelTotals = <T extends { total: number }>(value: unknown, key: keyof T): T[] =>
  asArray(value).map((row) => {
    const record = asRecord(row);
    return {
      ...record,
      [key]: String(record[key as string] ?? '').trim(),
      total: pickNumber(record, 'total'),
    } as T;
  });

/** `GET /api/pasca-panen/haccp/kpi` — lima angka utama dashboard. */
export const getHaccpKpi = async (filters: HaccpFilterParams = {}): Promise<HaccpKpiData> => {
  const response = await HACCP_API.get<ApiResponse<unknown>>('/kpi', {
    params: toParams(filters),
  });
  const data = asRecord(unwrap(response.data, 'KPI HACCP'));

  return {
    totalSertifikat: pickNumber(data, 'totalSertifikat'),
    totalBerlaku: pickNumber(data, 'totalBerlaku'),
    totalKadaluarsa: pickNumber(data, 'totalKadaluarsa'),
    totalUpi: pickNumber(data, 'totalUpi'),
    avgProsesHari: pickNullableNumber(data, 'avgProsesHari'),
  };
};

/**
 * `GET /api/pasca-panen/haccp/charts` — seluruh grafik dalam satu request.
 *
 * Backend sudah menjalankan tujuh query secara paralel di dalam satu endpoint,
 * jadi tidak ada keuntungan menjalankan chart satu per satu dari frontend.
 */
export const getHaccpCharts = async (
  filters: HaccpFilterParams = {}
): Promise<HaccpChartsData> => {
  const response = await HACCP_API.get<ApiResponse<unknown>>('/charts', {
    params: toParams(filters),
  });
  const data = asRecord(unwrap(response.data, 'Chart HACCP'));

  return {
    gradeDistribution: mapLabelTotals<HaccpGradeDistributionItem>(
      data.gradeDistribution,
      'grade'
    ),
    statusProduk: mapLabelTotals<HaccpStatusProdukItem>(data.statusProduk, 'status_produk'),
    kategoriProduk: mapLabelTotals<HaccpKategoriProdukItem>(
      data.kategoriProduk,
      'nama_kategori'
    ),
    topProduk: mapLabelTotals<HaccpTopProdukItem>(data.topProduk, 'nama_produk'),
    topUpt: mapLabelTotals<HaccpTopUptItem>(data.topUpt, 'upt'),
    monthlyTrend: asArray(data.monthlyTrend).map((row) => {
      const record = asRecord(row);
      return {
        bulan: String(record.bulan ?? '').trim(),
        total: pickNumber(record, 'total'),
      };
    }),
    investmentDistribution: mapLabelTotals<HaccpInvestmentItem>(
      data.investmentDistribution,
      'investment'
    ),
  };
};

/**
 * Envelope khusus `/table`.
 *
 * `ApiResponse` generik tidak mendeklarasikan `meta`, padahal backend
 * mengirimkannya. Deklarasi lokal ini menjaga `meta.pagination` tetap
 * type-safe tanpa melonggarkan tipe di modul lain.
 */
interface HaccpTableEnvelope extends ApiResponse<unknown> {
  meta?: { pagination?: unknown };
}

/** `GET /api/pasca-panen/haccp/table` — tabel HACCP terpaginasikan. */
export const getHaccpTable = async (
  filters: HaccpFilterParams = {}
): Promise<HaccpTableData> => {
  const response = await HACCP_API.get<HaccpTableEnvelope>('/table', {
    params: toParams(filters),
  });

  const envelope = response.data;

  // `meta` dibaca SEBELUM narrowing: `isApiSuccess` mempersempit tipe menjadi
  // `ApiResponse<T> & { data: T }` yang tidak mendeklarasikan `meta`, sehingga
  // akses setelahnya akan error TypeScript.
  const rawPagination = asRecord(asRecord(envelope.meta).pagination);

  if (!isApiSuccess(envelope)) {
    throw new Error(envelope.message || 'Daftar HACCP gagal dimuat');
  }

  const items: HaccpTableItem[] = asArray(envelope.data).map((row) => {
    const record = asRecord(row);
    return {
      no_haccp: pickString(record.no_haccp),
      upi_name: pickString(record.upi_name),
      nama_produk: pickString(record.nama_produk),
      nama_kategori: pickString(record.nama_kategori),
      grade: pickString(record.grade),
      upt: pickString(record.upt),
      tgl_terbit: pickDateOnly(record.tgl_terbit),
      tgl_akhir: pickDateOnly(record.tgl_akhir),
      status_sert: pickString(record.status_sert),
    };
  });

  const pagination: HaccpPagination = {
    totalRows: pickNumber(rawPagination, 'totalRows'),
    totalPages: pickNumber(rawPagination, 'totalPages'),
    currentPage: pickNumber(rawPagination, 'currentPage', 1),
    limit: pickNumber(rawPagination, 'limit', 10),
  };

  return { items, pagination };
};