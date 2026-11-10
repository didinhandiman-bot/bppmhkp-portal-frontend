/**
 * Tipe data modul SPDI Pascapanen (Sistem Pengawasan Distribusi Ikan).
 *
 * Seluruh nama field mengikuti respons riil backend
 * `/api/v1/pascapanen/spdi/*` (`spdiPasca.service.js`): `snake_case` untuk
 * kolom baris tabel, `camelCase` untuk agregat metrik — sama seperti HACCP.
 *
 * Envelope yang dipakai backend (`sendResponse`):
 *  - `/dashboard` -> `{ success, message, data }`
 *  - `/list`      -> `{ success, message, data: [], meta: { total, page, limit, totalPages } }`
 */

/** Parameter query bersama untuk kedua endpoint SPDI; seluruhnya opsional. */
export interface SpdiFilterParams {
  /** Kode UPT dari master `GET /api/v1/options/upt`, mis. `15.0` -> `kd_upt`. */
  kdUpt?: string;
  /** Kode provinsi BPS 2 digit, mis. `32` -> `kd_provinsi`. */
  kdProvinsi?: string;
  /** Tahun filter; `null`/kosong berarti seluruh tahun ikut terhitung. */
  tahun?: number | '';
  /** Kata kunci pencarian `nama_unit`/`nomor_sertifikat` (khusus `/list`). */
  search?: string;
  /** Halaman saat ini, mulai 1 (khusus `/list`). */
  page?: number;
  /** Jumlah baris per halaman (khusus `/list`). */
  limit?: number;
}

/** Isi `data.metrics` pada `GET /dashboard`. */
export interface SpdiMetrics {
  /** Seluruh baris unit pada filter aktif (termasuk belum terbit). */
  totalData: number;
  /** Sertifikat yang sudah terbit (`tgl_terbit` terisi). */
  totalTerbit: number;
  /** Unit unik (berdasarkan `nama_unit`). */
  totalUnit: number;
  /** Rata-rata skor inspeksi 0-100; `null` bila tidak ada sampel. */
  avgSkorInspeksi: number | null;
  /** Rata-rata skor CDIB 0-100; `null` bila tidak ada sampel. */
  avgSkorCdib: number | null;
  /** Rata-rata SLA penerbitan dalam hari; `null` bila belum ada terbitan. */
  avgSlaHari: number | null;
}

/** Baris `{ bulan, total }` tren bulanan; `bulan` format `YYYY-MM`. */
export interface SpdiMonthlyTrendItem {
  bulan: string;
  total: number;
}

/** Baris agregat per UPT (`byUpt`). */
export interface SpdiUptItem {
  kd_upt: string | null;
  nama_upt: string;
  total: number;
  avgSkorInspeksi: number | null;
  avgSkorCdib: number | null;
}

/** Baris sebaran per provinsi (`byProvinsi`), kunci peta GeoJSON. */
export interface SpdiProvinsiItem {
  kd_provinsi: string;
  nama_provinsi: string | null;
  total: number;
}

/** Slice donut KBLI; bucket `Lainnya` sudah digabung backend. */
export interface SpdiKbliItem {
  kode: string;
  total: number;
}

/** Isi `data` pada `GET /dashboard` secara utuh. */
export interface SpdiDashboardData {
  filters: {
    tahun: number | null;
    kd_upt: string | null;
    kd_provinsi: string | null;
  };
  metrics: SpdiMetrics;
  monthlyTrend: SpdiMonthlyTrendItem[];
  byUpt: SpdiUptItem[];
  byProvinsi: SpdiProvinsiItem[];
  kbliDistribution: SpdiKbliItem[];
}

/** Satu baris tabel pada `GET /list`. */
export interface SpdiListItem {
  id: number;
  nama_unit: string | null;
  tgl_permohonan: string | null;
  tgl_terbit: string | null;
  nomor_sertifikat: string | null;
  kd_upt: string | null;
  nama_upt: string | null;
  kd_provinsi: string | null;
  kab_kota: string | null;
  skor_inspeksi: number | null;
  skor_cdib: number | null;
  tagging_kdmp: string | null;
  kbli: string | null;
  produk: string | null;
  status: string | null;
  /** SLA terbit per baris; `null` bila sertifikat belum terbit. */
  sla_hari: number | null;
}

/** Paginasi `meta` `/list` (nama key backend: `total/page/limit/totalPages`). */
export interface SpdiPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Bentuk `/list`: array data di `data`, paginasi di `meta`. */
export interface SpdiListData {
  items: SpdiListItem[];
  pagination: SpdiPagination;
}

/** Dashboard kosong (fallback sebelum data pertama tiba). */
export const SPDI_DASHBOARD_KOSONG: SpdiDashboardData = {
  filters: { tahun: null, kd_upt: null, kd_provinsi: null },
  metrics: {
    totalData: 0,
    totalTerbit: 0,
    totalUnit: 0,
    avgSkorInspeksi: null,
    avgSkorCdib: null,
    avgSlaHari: null,
  },
  monthlyTrend: [],
  byUpt: [],
  byProvinsi: [],
  kbliDistribution: [],
};
