/**
 * Tipe data modul HACCP (Hazard Analysis and Critical Control Point).
 *
 * Seluruh nama field mengikuti respons riil backend
 * `/api/pasca-panen/haccp/*` secara literal — backend memakai `snake_case`
 * untuk kolom tabel dan `camelCase` untuk agregat, jadi tidak ada alias yang
 * perlu ditebak di lapisan service.
 */

/**
 * Nilai `status_sert` yang dihitung backend pada KPI (`berlaku`/`kadaluarsa`).
 * Dipakai juga sebagai opsi filter tabel, karena repository membandingkan
 * `status_sert = :statusSert` secara literal terhadap kolom yang sama.
 */
export const HACCP_STATUS_SERTIFIKAT = ['BERLAKU', 'KADALUARSA'] as const;

/** Label UI untuk tiap `status_sert`; kunci mengikuti nilai backend. */
export const HACCP_STATUS_LABEL: Record<string, string> = {
  BERLAKU: 'Berlaku',
  KADALUARSA: 'Kadaluarsa',
};

/** Bucket yang dipakai repository untuk baris dengan grade kosong. */
export const HACCP_KOSONG = 'Tidak Ada';

/** Parameter query bersama untuk ketiga endpoint HACCP. */
export interface HaccpFilterParams {
  /** Tanggal terbit awal, format `YYYY-MM-DD`. */
  startDate?: string;
  /** Tanggal terbit akhir, format `YYYY-MM-DD`. */
  endDate?: string;
  /**
   * Kode unit kerja dari master `GET /api/v1/options/upt`, mis. `15.0`.
   *
   * Nilainya `KD_UNIT`, tapi dikirim ke backend sebagai query param `id_upt`
   * (lihat catatan di `toParams` pada `services/haccpService.ts`) karena
   * hanya param itu yang membuat filter benar-benar memfilter.
   */
  kdUpt?: string;
  /** Grade sertifikat. */
  grade?: string;
  /** Filter status sertifikat; khusus endpoint `/table` saat dipakai. */
  statusSert?: string;
  /** Kata kunci pencarian (UPI, produk, kategori, nomor HACCP, UPT). */
  search?: string;
  /** Halaman saat ini, mulai 1. */
  page?: number;
  /** Jumlah baris per halaman. */
  limit?: number;
}

/** Isi `data` pada `GET /api/pasca-panen/haccp/kpi`. */
export interface HaccpKpiData {
  /** Jumlah seluruh sertifikat pada periode & filter aktif. */
  totalSertifikat: number;
  /** Sertifikat dengan `status_sert = 'BERLAKU'`. */
  totalBerlaku: number;
  /** Sertifikat dengan `status_sert = 'KADALUARSA'`. */
  totalKadaluarsa: number;
  /** Jumlah UPI unik tersertifikasi. */
  totalUpi: number;
  /**
   * Rata-rata selisih hari `tgl_terbit - tgl_terima`.
   *
   * `null` bila tidak ada satu pun baris yang punya kedua tanggal tersebut —
   * `AVG` SQL mengembalikan `NULL`, bukan 0, jadi 0 di sini akan berarti
   * "selesaur dalam nol hari".
   */
  avgProsesHari: number | null;
}

/** Baris `{ grade, total }` dari `gradeDistribution`. */
export interface HaccpGradeDistributionItem {
  grade: string;
  total: number;
}

/** Baris `{ status_produk, total }` dari `statusProduk`. */
export interface HaccpStatusProdukItem {
  status_produk: string;
  total: number;
}

/** Baris `{ nama_kategori, total }` dari `kategoriProduk`. */
export interface HaccpKategoriProdukItem {
  nama_kategori: string;
  total: number;
}

/** Baris `{ nama_produk, total }` dari `topProduk`. */
export interface HaccpTopProdukItem {
  nama_produk: string;
  total: number;
}

/** Baris `{ upt, total }` dari `topUpt`. */
export interface HaccpTopUptItem {
  upt: string;
  total: number;
}

/** Baris `{ bulan, total }` dari `monthlyTrend`; `bulan` format `YYYY-MM`. */
export interface HaccpMonthlyTrendItem {
  bulan: string;
  total: number;
}

/** Baris `{ investment, total }` dari `investmentDistribution`. */
export interface HaccpInvestmentItem {
  investment: string;
  total: number;
}

/**
 * Isi `data` pada `GET /api/pasca-panen/haccp/charts`.
 *
 * Ketujuh grafik dikirim dalam satu endpoint dan dipanggil paralel di sisi
 * backend (`Promise.all` pada `haccpService.getCharts`), jadi satu request
 * sudah mencakup seluruh chart.
 */
export interface HaccpChartsData {
  gradeDistribution: HaccpGradeDistributionItem[];
  statusProduk: HaccpStatusProdukItem[];
  kategoriProduk: HaccpKategoriProdukItem[];
  topProduk: HaccpTopProdukItem[];
  topUpt: HaccpTopUptItem[];
  monthlyTrend: HaccpMonthlyTrendItem[];
  investmentDistribution: HaccpInvestmentItem[];
}

/** Satu baris tabel pada `GET /api/pasca-panen/haccp/table`. */
export interface HaccpTableItem {
  no_haccp: string | null;
  upi_name: string | null;
  nama_produk: string | null;
  nama_kategori: string | null;
  grade: string | null;
  upt: string | null;
  tgl_terbit: string | null;
  tgl_akhir: string | null;
  status_sert: string | null;
}

/** Paginasi pada `meta.pagination` (dipakai `/table`). */
export interface HaccpPagination {
  totalRows: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

/** Bentuk `/table`: array data di `data`, paginasi di `meta.pagination`. */
export interface HaccpTableData {
  items: HaccpTableItem[];
  pagination: HaccpPagination;
}