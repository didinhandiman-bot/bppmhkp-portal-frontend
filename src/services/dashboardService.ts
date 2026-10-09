/**
 * Service untuk dashboard ringkasan eksekutif.
 *
 * Satu endpoint juga, `GET /api/v1/dashboard/overview`, yang mengembalikan
 * `{ success, message, data }` lewat `sendResponse`. Backend sudah menjalankan
 * tiga agregat repository secara paralel (`Promise.all` di
 * `DashboardOverviewService.getOverviewMetrics`), jadi filter tidak perlu
 * memecah panggilan per pilar.
 *
 * Catatan penting soal data: `monthlyTrends`, `uptDistribution`, dan
 * `recentActivities` masih dikirim sebagai array kosong oleh backend. Mapping di
 * bawah tetap menormalkan bentuknya sehingga modul ini siap bekerja begitu
 * backend mulai mengisinya — tanpa perubahan di sini.
 */

import { DASHBOARD_API } from './api';
import { isApiSuccess, type ApiResponse } from '../types/api';
import type {
  DashboardActivityStatus,
  DashboardEksporKpi,
  DashboardFilterParams,
  DashboardMonthlyTrend,
  DashboardOverview,
  DashboardPascaPanenKpi,
  DashboardPascaPanenModul,
  DashboardPrimerKpi,
  DashboardRecentActivity,
  DashboardSummaryKpi,
  DashboardUptDistribution,
  PrimerDetail,
} from '../types/dashboard';

/** Ubah filter UI menjadi query string, membuang nilai kosong. */
const toParams = (filters: DashboardFilterParams = {}): Record<string, string> => {
  const params: Record<string, string> = {};

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  // `dashboardOverviewController` membaca `uptId || kd_unit`, jadi `uptId`
  // adalah nama param yang dipakai di sini.
  if (filters.uptId && filters.uptId.trim() !== '') params.uptId = filters.uptId.trim();

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
 * Ambil angka, default 0.
 *
 * `Number(null)` dan `Number('')` sama-sama `0`, jadi keduanya aman;
 * `Number.isFinite` menyaring `NaN` dari `undefined`/`'abc'`.
 */
const pickNumber = (source: Record<string, unknown>, key: string, fallback = 0): number => {
  const parsed = Number(source[key]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickString = (value: unknown, fallback = ''): string => {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text === '' ? fallback : text;
};

/** Sub-objek `{ total, berlaku }`; `berlaku` opsional karena tidak semua ada. */
const mapModul = (value: unknown): DashboardPascaPanenModul => {
  const record = asRecord(value);
  const total = pickNumber(record, 'total');
  // `berlaku` hanya dipopulate SKP & HACCP; SMKHP tidak punya kolom masa
  // berlaku sehingga nilainya sengaja dibiarkan `undefined`.
  return {
    total,
    ...(record.berlaku === undefined ? {} : { berlaku: pickNumber(record, 'berlaku') }),
  };
};

const mapEkspor = (value: unknown): DashboardEksporKpi => {
  const record = asRecord(value);
  return {
    totalFrekuensi: pickNumber(record, 'totalFrekuensi'),
    totalPengajuan: pickNumber(record, 'totalPengajuan'),
    totalVolumeKg: pickNumber(record, 'totalVolumeKg'),
    totalVolumeTon: pickNumber(record, 'totalVolumeTon'),
    totalNilaiRupiah: pickNumber(record, 'totalNilaiRupiah'),
  };
};

const mapPascaPanen = (value: unknown): DashboardPascaPanenKpi => {
  const record = asRecord(value);
  return {
    totalSertifikatTerbit: pickNumber(record, 'totalSertifikatTerbit'),
    smkhp: mapModul(record.smkhp),
    skp: mapModul(record.skp),
    haccp: mapModul(record.haccp),
    // Belum ada di `PascaPanenRepository`; dibaca sekarang supaya kartu tidak
    // perlu diubah lagi kalau backend mengirimkannya.
    spdi: pickNumber(record, 'spdi'),
    totalPending: pickNumber(record, 'totalPending'),
    totalInProgress: pickNumber(record, 'totalInProgress'),
  };
};

/**
 * Rincian enam jenis izin primer.
 *
 * `detail` bisa `undefined` bila backend mengirim objek tanpa rincian, jadi
 * seluruh field di-*fallback* ke 0 — bukan `undefined`, supaya kartu tidak
 * pernah mencetak "undefined".
 */
const mapPrimerDetail = (value: unknown): PrimerDetail => {
  const record = asRecord(value);
  return {
    cpib: pickNumber(record, 'cpib'),
    cbib: pickNumber(record, 'cbib'),
    cppib: pickNumber(record, 'cppib'),
    cpoib: pickNumber(record, 'cpoib'),
    cdoib: pickNumber(record, 'cdoib'),
    cpibKapal: pickNumber(record, 'cpibKapal'),
  };
};

const mapPrimer = (value: unknown): DashboardPrimerKpi => {
  const record = asRecord(value);
  return {
    // `totalSertifikat` adalah nama field resmi dari
    // `DashboardOverviewService`. `totalSertifikatTerbit` hanya dibaca sebagai
    // jaring pengaman untuk backend lama yang belum memperbarui mappingnya.
    totalSertifikat: pickNumber(
      record,
      'totalSertifikat',
      pickNumber(record, 'totalSertifikatTerbit')
    ),
    totalPending: pickNumber(record, 'totalPending'),
    detail: mapPrimerDetail(record.detail),
  };
};

const mapSummaryKpi = (value: unknown): DashboardSummaryKpi => {
  const record = asRecord(value);
  return {
    ekspor: mapEkspor(record.ekspor),
    pascaPanen: mapPascaPanen(record.pascaPanen),
    primer: mapPrimer(record.primer),
    totalSertifikasiNasional: pickNumber(record, 'totalSertifikasiNasional'),
  };
};

/**
 * `month` dikirim backend sebagai apa belum terkunci (angka atau label), jadi
 * dinormalkan ke teks agar sumbu-X Recharts selalu konsisten.
 */
const mapMonthlyTrends = (value: unknown): DashboardMonthlyTrend[] =>
  asArray(value).map((row) => {
    const record = asRecord(row);
    return {
      month: pickString(record.month, '—'),
      ekspor: pickNumber(record, 'ekspor'),
      pascaPanen: pickNumber(record, 'pascaPanen'),
      primer: pickNumber(record, 'primer'),
    };
  });

const mapUptDistribution = (value: unknown): DashboardUptDistribution[] =>
  asArray(value).map((row) => {
    const record = asRecord(row);
    return {
      namaUpt: pickString(record.namaUpt, 'Tanpa Nama'),
      ekspor: pickNumber(record, 'ekspor'),
      pascaPanen: pickNumber(record, 'pascaPanen'),
      primer: pickNumber(record, 'primer'),
      grandTotal: pickNumber(record, 'grandTotal'),
    };
  });

/** Tanggal aktivitas bisa `YYYY-MM-DD` atau ISO penuh; ambil bagian tanggalnya. */
const pickDateOnly = (value: unknown): string => {
  const text = pickString(value);
  if (text === '') return '-';
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
};

const mapRecentActivities = (value: unknown): DashboardRecentActivity[] =>
  asArray(value).map((row, index) => {
    const record = asRecord(row);
    const rawId = record.id;
    return {
      // `id` dipakai sebagai key React; kalau backend tidak mengirimnya, posisi
      // baris dipakai agar key tetap unik.
      id:
        rawId === undefined || rawId === null || String(rawId).trim() === ''
          ? `row-${index}`
          : (rawId as number | string),
      module: pickString(record.module, '-'),
      serviceName: pickString(record.serviceName, '-'),
      applicant: pickString(record.applicant, '-'),
      upt: pickString(record.upt, '-'),
      date: pickDateOnly(record.date),
      status: pickString(record.status, '-') as DashboardActivityStatus,
    };
  });

/**
 * `GET /api/v1/dashboard/overview` — seluruh angka dashboard dalam satu request.
 *
 * @throws Error bila `success !== true` (mis. 401 sesi kedaluwarsa — ditangani
 *   interceptor auth yang sudah mengarahkan ke `/login`).
 */
export const fetchDashboardOverview = async (
  filters: DashboardFilterParams = {}
): Promise<DashboardOverview> => {
  const response = await DASHBOARD_API.get<ApiResponse<unknown>>('/overview', {
    params: toParams(filters),
  });
  const data = asRecord(unwrap(response.data, 'Ringkasan dashboard'));

  return {
    summaryKpi: mapSummaryKpi(data.summaryKpi),
    monthlyTrends: mapMonthlyTrends(data.monthlyTrends),
    uptDistribution: mapUptDistribution(data.uptDistribution),
    recentActivities: mapRecentActivities(data.recentActivities),
  };
};