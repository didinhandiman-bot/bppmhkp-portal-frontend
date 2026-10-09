/**
 * Service untuk data Dashboard Ekspor.
 *
 * Berbeda dari `api/exportApi.ts` di proyek dashboard-fe, modul ini:
 *  - memakai instance axios yang sudah ada di `services/api.ts`
 *    (`SMKHP_API`), sehingga JWT sesi disuntik interceptor dan 401/403
 *    ditangani secara terpusat;
 *  - memakai prefix path milik backend portal. Backend portal me-mount modul
 *    ini di `/api/v1/pascapanen/smkhp` (`app.js`), BUKAN `/api/v1/exports`
 *    seperti proyek dashboard — memakai path lama akan berakhir 404.
 *
 * Endpoint matriks dan opsi UPT sudah tersedia di `smkhpService`, jadi di sini
 * hanya tiga endpoint dashboard yang benar-benar baru.
 */

import { SMKHP_API } from './api';
import { isApiSuccess, type ApiResponse } from '../types/api';
import type {
  FilterParams,
  KpiCards,
  KpiSummaryResponse,
  MonthlyTrendItem,
  TopDestinationItem,
} from '../types/export';

/** Ubah filter frontend menjadi query string, membuang nilai kosong. */
const toParams = (filters: FilterParams = {}): Record<string, string | number> => {
  const params: Record<string, string | number> = {};

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.kd_upt) params.kd_upt = filters.kd_upt;
  if (filters.search && filters.search.trim() !== '') params.search = filters.search.trim();
  if (typeof filters.limit === 'number' && Number.isFinite(filters.limit)) {
    params.limit = filters.limit;
  }

  return params;
};

/** Buka `data` dari envelope backend (`{ status|success, message, data }`). */
const unwrap = <T>(res: ApiResponse<T>, context: string): T => {
  if (!isApiSuccess(res)) {
    throw new Error(res.message || `${context} gagal dimuat`);
  }
  return res.data as T;
};

/**
 * Baca angka pertama yang tersedia dari beberapa nama field.
 *
 * Backend memakai beberapa nama untuk metrik yang sama (`totalDokumenAju` vs
 * `totalSertifikatHc`, `totalTraderAktif` vs `totalEksportirAktif`), jadi
 * pemetaan harus menerima semua alias.
 */
const pickNumber = (
  source: Record<string, unknown>,
  keys: readonly string[]
): number => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
};

/**
 * Sama seperti `pickNumber`, tetapi `undefined` bila seluruh alias tidak ada.
 *
 * Dipakai untuk metrik YoY: `0` adalah nilai valid ("tidak berubah") yang
 * berbeda dari "backend tidak mengirim", dan keduanya tidak boleh diperlakukan
 * sama oleh badge.
 */
const pickOptionalNumber = (
  source: Record<string, unknown>,
  keys: readonly string[]
): number | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** `GET /kpi-summary` — total devisa (hero) + kartu KPI + badge YoY. */
export const fetchKpiSummary = async (
  filters: FilterParams = {}
): Promise<KpiSummaryResponse> => {
  const res = await SMKHP_API.get<ApiResponse<unknown>>('/kpi-summary', {
    params: toParams(filters),
  });
  const root = asRecord(unwrap(res.data, 'Ringkasan KPI'));
  const hero = asRecord(root.heroInsight);
  const cards = asRecord(root.kpiCards);
  const yoy = asRecord(cards.yoy);

  const kpiCards: KpiCards = {
    totalNettoTon: pickNumber(cards, ['totalNettoTon']),
    totalDokumenHc: pickNumber(cards, ['totalDokumenHc', 'totalSertifikatHc', 'totalDokumenAju']),
    totalEksportirAktif: pickNumber(cards, ['totalEksportirAktif', 'totalTraderAktif']),
    totalNegaraTujuan: pickNumber(cards, ['totalNegaraTujuan']),
    yoy: {
      tonase: pickOptionalNumber(yoy, ['tonase', 'totalNettoTon']),
      dokumenHc: pickOptionalNumber(yoy, ['dokumenHc', 'totalSertifikatHc']),
      eksportirAktif: pickOptionalNumber(yoy, ['eksportirAktif', 'totalTraderAktif']),
      negaraTujuan: pickOptionalNumber(yoy, ['negaraTujuan', 'totalNegaraTujuan']),
    },
  };

  return {
    heroInsight: {
      totalNilaiRupiah: pickNumber(hero, ['totalNilaiRupiah', 'totalDevisaRupiah']),
      totalNilaiUsd: pickNumber(hero, ['totalNilaiUsd', 'totalDevisaUsd']),
      growthPercent: pickNumber(hero, ['percentage', 'growthPercent', 'pertumbuhanMoM', 'growth']),
    },
    kpiCards,
  };
};

/** `GET /monthly-trends` — deret bulanan untuk dual-axis chart. */
export const fetchMonthlyTrends = async (
  filters: FilterParams = {}
): Promise<MonthlyTrendItem[]> => {
  const res = await SMKHP_API.get<ApiResponse<unknown>>('/monthly-trends', {
    params: toParams(filters),
  });

  return asArray(unwrap(res.data, 'Tren bulanan')).map((row) => {
    const item = asRecord(row);
    return {
      bulan: String(item.bulan ?? ''),
      totalNettoTon: pickNumber(item, ['totalNettoTon']),
      totalNilaiRupiah: pickNumber(item, ['totalNilaiRupiah']),
      totalDokumenHc: pickNumber(item, ['totalDokumenHc', 'totalSertifikatHc', 'totalDokumenAju']),
    };
  });
};

/** `GET /top-destinations` — peringkat negara tujuan ekspor. */
export const fetchTopDestinations = async (
  filters: FilterParams = {}
): Promise<TopDestinationItem[]> => {
  const res = await SMKHP_API.get<ApiResponse<unknown>>('/top-destinations', {
    params: toParams(filters),
  });

  return asArray(unwrap(res.data, 'Negara tujuan')).map((row) => {
    const item = asRecord(row);
    return {
      kode_negara_partner: String(item.kode_negara_partner ?? ''),
      negara_tujuan: String(item.negara_tujuan ?? ''),
      totalNilaiRupiah: pickNumber(item, ['totalNilaiRupiah']),
      totalNettoKg: pickNumber(item, ['totalNettoKg']),
      sharePersentase: pickNumber(item, ['sharePersentase']),
    };
  });
};
